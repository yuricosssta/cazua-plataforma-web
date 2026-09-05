// cloudflare-worker/worker.js
// Cloudflare Worker para roteamento de subdomínios Cazuá
// Deploy: wrangler deploy
// Configuração: wrangler.toml + secrets no dashboard

// Allowlist de headers seguros para repassar para o upstream (Vercel).
// Não repassamos headers `cf-*` (Cloudflare) porque a Vercel aplica
// `x-vercel-mitigated: deny` quando eles estão presentes.
const ALLOWED_REQUEST_HEADERS = [
  'accept',
  'accept-encoding',
  'accept-language',
  'authorization',
  'content-length',
  'content-type',
  'cookie',
  'dnt',
  'if-match',
  'if-modified-since',
  'if-none-match',
  'if-range',
  'origin',
  'range',
  'referer',
  'sec-ch-ua',
  'sec-ch-ua-mobile',
  'sec-ch-ua-platform',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site',
  'user-agent',
  'x-requested-with',
];

function buildSafeHeaders(request, extra = {}) {
  const safe = {};
  for (const name of ALLOWED_REQUEST_HEADERS) {
    const v = request.headers.get(name);
    if (v) safe[name] = v;
  }
  return { ...safe, ...extra };
}

// Rota admin: purga o cache do Cloudflare para um hostname/url específico.
// Protegida por header `X-Admin-Token` comparado com env.PURGE_TOKEN.
async function handlePurge(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const auth = request.headers.get('x-admin-token');
  if (!env.PURGE_TOKEN || auth !== env.PURGE_TOKEN) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID) {
    return new Response(
      JSON.stringify({ error: 'missing_env: CF_API_TOKEN ou CF_ZONE_ID' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const targets = [];
  if (typeof body.hostname === 'string' && body.hostname.length > 0) {
    targets.push(`https://${body.hostname}/`);
    targets.push(`https://${body.hostname}/login`);
  } else if (typeof body.url === 'string' && body.url.length > 0) {
    targets.push(body.url);
  } else if (Array.isArray(body.files)) {
    targets.push(...body.files.filter((u) => typeof u === 'string'));
  } else {
    return new Response(
      JSON.stringify({ error: 'missing_target: envie hostname, url ou files' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  if (targets.length === 0) {
    return new Response(JSON.stringify({ error: 'no_valid_targets' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: targets }),
    },
  );

  const data = await resp.json();
  return new Response(JSON.stringify({ ok: resp.ok, status: resp.status, result: data }, null, 2), {
    status: resp.ok ? 200 : 502,
    headers: { 'content-type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let hostname = url.hostname;

    console.log('[CazuaRouter] ENTRY', { url: url.toString(), hostname, hasEnv: !!env });

    const rootDomain = env.ROOT_DOMAIN || 'grupocazua.com.br';
    const appDomain = env.APP_DOMAIN || `www.${rootDomain}`;
    const vercelOrigin = env.VERCEL_ORIGIN || 'vanguardatech.vercel.app';

    // Subdomínios reservados que NÃO devem ser roteados para o Vercel (passam direto)
    // Ex: arquivos.grupocazua.com.br -> Cloudflare R2
    const RESERVED_SUBDOMAINS = [
      'arquivos',
      'api',
      'cdn',
      'assets',
      'static',
      'media',
      'send',
      '_dmarc',
    ];

    // Paths que passam direto para Vercel ORIGIN (sem headers de tenant)
    const PASSTHROUGH_PATHS = [
      '/_next/',
      '/_static/',
      '/_vercel/',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];

    // 0. Rota admin: purge de cache via API Cloudflare
    if (url.pathname === '/__purge' || url.pathname === '/__cazua/purge') {
      return handlePurge(request, env);
    }

    // 1. Early return para assets estáticos
    if (PASSTHROUGH_PATHS.some(p => url.pathname.startsWith(p))) {
      return fetch(`https://${vercelOrigin}${url.pathname}${url.search}`, {
        method: request.method,
        headers: buildSafeHeaders(request),
        body: request.body,
        redirect: 'manual',
        cf: { cacheTtl: 3600, cacheEverything: true },
      });
    }

    // 2. Normaliza: remove www. do subdomínio do tenant
    // Ex: www.construtora-alpha.grupocazua.com.br -> construtora-alpha.grupocazua.com.br
    if (hostname.startsWith('www.')) {
      hostname = hostname.replace(/^www\./, '');
    }

    // 3. Extrai o subdomínio (parte antes do rootDomain)
    const subdomain = hostname.replace(`.${rootDomain}`, '');

    // 4. Bypass para subdomínios reservados (ex: arquivos.grupocazua.com.br -> R2)
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return fetch(request);
    }

    // 5. Subdomínio de tenant: construtora-alpha.grupocazua.com.br
    // Não intercepta o domínio principal (www.grupocazua.com.br)
    const normalizedAppDomain = appDomain.replace(/^www\./, '');
    if (hostname.endsWith(`.${rootDomain}`) && hostname !== normalizedAppDomain) {
      const slug = hostname.replace(`.${rootDomain}`, '');
      const targetUrl = `https://${vercelOrigin}${url.pathname}${url.search}`;

      const clientIp = request.headers.get('cf-connecting-ip') || '';
      const safeHeaders = buildSafeHeaders(request, {
        'x-cazua-tenant-slug': slug,
        'host': appDomain,
        'x-forwarded-for': clientIp,
        'x-real-ip': clientIp,
        'x-forwarded-proto': 'https',
      });

      console.log('[CazuaRouter] Tenant subdomain', {
        hostname,
        slug,
        targetUrl,
        appDomain,
        vercelOrigin,
        headerKeys: Object.keys(safeHeaders),
        hasTenantSlug: !!safeHeaders['x-cazua-tenant-slug'],
      });

      // Forward para o Vercel com header identificando o tenant
      // host header = domínio verificado na Vercel (www.grupocazua.com.br)
      // target URL = origem nativa Vercel (vanguardatech.vercel.app)
      // Headers `cf-*` NÃO são propagados (causa `x-vercel-mitigated: deny`)
      const resp = await fetch(targetUrl, {
        method: request.method,
        headers: safeHeaders,
        body: request.body,
        redirect: 'manual',
        cf: {
          cacheTtl: 0,
          cacheEverything: false,
        },
      });

      console.log('[CazuaRouter] Upstream response', {
        status: resp.status,
        xMatchedPath: resp.headers.get('x-matched-path'),
        xVercelMitigated: resp.headers.get('x-vercel-mitigated'),
        xVercelId: resp.headers.get('x-vercel-id'),
        cfCacheStatus: resp.headers.get('cf-cache-status'),
      });

      return resp;
    }

    // 6. Demais tráfego passa direto (www, api, assets, app principal)
    return fetch(request);
  },
};
