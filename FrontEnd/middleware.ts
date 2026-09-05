//middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    //  * Ignora rotas internas do Next.js e arquivos estáticos
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const tenantSlug = req.headers.get('x-cazua-tenant-slug');

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const appDomain = `app.${rootDomain}`;
  const wwwDomain = `www.${rootDomain}`;

  console.log('[Middleware] Request hostname:', hostname);
  console.log('[Middleware] X-Cazua-Tenant-Slug:', tenantSlug);
  console.log('[Middleware] Root Domain:', rootDomain);

// 1. Requisição via Cloudflare Worker (subdomínio Cazuá)
  // O Worker adiciona o header x-cazua-tenant-slug com o slug da organização
  // O Worker sobrescreve o header 'host' para www.grupocazua.com.br, então usamos tenantSlug + rootDomain
  if (tenantSlug) {
    const cazuadomain = `${tenantSlug}.${rootDomain}`;
    // Normaliza /login (ou /login/*) para raiz — a página personalizada vive na raiz do subdomínio
    const normalizedPath = url.pathname === '/login' || url.pathname.startsWith('/login/')
      ? '/'
      : url.pathname;
    console.log('[Middleware] Rewriting for Cazuá Subdomain to:', `/sites/${cazuadomain}${normalizedPath}`);
    return NextResponse.rewrite(
      new URL(`/sites/${cazuadomain}${normalizedPath}`, req.url)
    );
  }

  // 2. Domínio principal da aplicação (app.grupocazua.com.br ou www.grupocazua.com.br)
  const isMainDomain = hostname === rootDomain || hostname === appDomain || hostname === wwwDomain;
  const isLocalHost = hostname.includes('localhost');

  if (isMainDomain || isLocalHost) {
    return NextResponse.next();
  }

  // 3. Domínio customizado do tenant (ex: construtora.com.br)
  // Normaliza /login (ou /login/*) para raiz — a página personalizada vive na raiz do subdomínio
  const customDomainPath = url.pathname === '/login' || url.pathname.startsWith('/login/')
    ? '/'
    : url.pathname;
  return NextResponse.rewrite(new URL(`/sites/${hostname}${customDomainPath}`, req.url));
    
}