// cloudflare-worker/worker.js
// Cloudflare Worker para roteamento de subdomínios Cazuá
// Deploy: wrangler deploy
// Configuração: wrangler.toml + secrets no dashboard

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let hostname = url.hostname;

    const rootDomain = env.ROOT_DOMAIN || 'grupocazua.com.br';
    const appDomain = env.APP_DOMAIN || `www.${rootDomain}`;
    const vercelOrigin = env.VERCEL_ORIGIN || 'vanguardatech.vercel.app';

    // Paths que passam direto para Vercel ORIGIN (sem headers de tenant)
    const PASSTHROUGH_PATHS = [
      '/_next/',
      '/_static/',
      '/_vercel/',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];

    // Early return para assets estáticos
    if (PASSTHROUGH_PATHS.some(p => url.pathname.startsWith(p))) {
      return fetch(`https://${vercelOrigin}${url.pathname}${url.search}`, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
        cf: { cacheTtl: 3600, cacheEverything: true },
      });
    }

    // Normaliza: remove www. do subdomínio do tenant
    // Ex: www.construtora-alpha.grupocazua.com.br -> construtora-alpha.grupocazua.com.br
    if (hostname.startsWith('www.')) {
      hostname = hostname.replace(/^www\./, '');
    }

    // Subdomínio de tenant: construtora-alpha.grupocazua.com.br
    // Não intercepta o domínio principal (www.grupocazua.com.br)
    const normalizedAppDomain = appDomain.replace(/^www\./, '');
    if (hostname.endsWith(`.${rootDomain}`) && hostname !== normalizedAppDomain) {
      const slug = hostname.replace(`.${rootDomain}`, '');
      const targetUrl = `https://${vercelOrigin}${url.pathname}${url.search}`;

      // Forward para o Vercel com header identificando o tenant
      // host header = domínio verificado na Vercel (www.grupocazua.com.br)
      // target URL = origem nativa Vercel (vanguardatech.vercel.app)
      return fetch(targetUrl, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers),
          'x-cazua-tenant-slug': slug,
          'host': appDomain,
        },
        body: request.body,
        redirect: 'manual',
        cf: {
          cacheTtl: 0,
          cacheEverything: false,
        },
      });
    }

    // Demais tráfego passa direto (www, api, assets, app principal)
    return fetch(request);
  },
};