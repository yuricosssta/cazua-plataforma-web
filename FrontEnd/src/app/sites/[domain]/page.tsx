//src/app/sites/[domain]/page.tsx
import { redirect } from 'next/navigation';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'grupocazua.com.br';

export default async function TenantRedirectPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const isCazuaSubdomain = domain.endsWith(`.${ROOT_DOMAIN}`) && domain !== `www.${ROOT_DOMAIN}`;

  if (isCazuaSubdomain) {
    redirect('/login');
  }

  redirect('/');
}