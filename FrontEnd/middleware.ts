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

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const appDomain = `app.${rootDomain}`;

  const isMainDomain = hostname === rootDomain || hostname === appDomain;
  const isLocalHost = hostname.includes('localhost');

  if (isMainDomain || isLocalHost) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL(`/src/app/sites/${hostname}${url.pathname}`, req.url));
}