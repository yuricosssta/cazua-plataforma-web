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

  // 1. Requisição via Cloudflare Worker (subdomínio Cazuá)
  // O Worker adiciona o header x-cazua-tenant-slug com o slug da organização
  if (tenantSlug) {
    return NextResponse.rewrite(
      new URL(`/sites/${hostname}${url.pathname}`, req.url)
    );
  }

  // 2. Domínio principal da aplicação (app.grupocazua.com.br ou www.grupocazua.com.br)
  const isMainDomain = hostname === rootDomain || hostname === appDomain || hostname === wwwDomain;
  const isLocalHost = hostname.includes('localhost');

  if (isMainDomain || isLocalHost) {
    return NextResponse.next();
  }

  // 3. Domínio customizado do tenant (ex: construtora.com.br)
  return NextResponse.rewrite(new URL(`/sites/${hostname}${url.pathname}`, req.url));
    
}