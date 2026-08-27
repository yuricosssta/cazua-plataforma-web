//src/app/sites/[domain]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { tenantLandingPageSchema } from '@/validations/tenant.zod';
import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';
import { getNestApiUrl } from '@/lib/api/serverUtils';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'grupocazua.com.br';

// Busca real no BackEnd (RSC): endpoint público retorna a config ativa por domínio
async function getTenantConfig(domain: string) {
  const isCazuaSubdomain = domain.endsWith(`.${ROOT_DOMAIN}`) && domain !== `www.${ROOT_DOMAIN}`;
  const slug = isCazuaSubdomain ? domain.replace(`.${ROOT_DOMAIN}`, '') : null;

  const endpoint = slug
    ? `/public/landing-pages/by-slug/${encodeURIComponent(slug)}`
    : `/public/landing-pages/${encodeURIComponent(domain)}`;

  const response = await fetch(`${getNestApiUrl()}${endpoint}`, { cache: 'no-store' });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const rawData = await getTenantConfig(domain);
  const parseResult = tenantLandingPageSchema.safeParse(rawData);

  if (!parseResult.success || !parseResult.data.isActive) {
    notFound();
  }

  const tenant = parseResult.data;
  const loginUrl = `https://app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cazua.com.br'}/login?tenant=${tenant.domain}`;

  // Dicionário MDX: Injeta o organizationId no formulário contra adulteração
  const mdxComponents = {
    LeadCaptureForm: (props: any) => <LeadCaptureForm organizationId={tenant.organizationId} {...props} />,
    h2: (props: any) => <h2 className="text-3xl font-bold mt-8 mb-4" {...props} />,
    p: (props: any) => <p className="text-muted-foreground mb-6" {...props} />,
  };

  return (
    <main
      className="min-h-screen bg-background text-foreground"
      style={{
        '--primary': tenant.theme.primaryHSL,
        ...(tenant.theme.backgroundHSL && { '--background': tenant.theme.backgroundHSL }),
        ...(tenant.theme.foregroundHSL && { '--foreground': tenant.theme.foregroundHSL }),
      } as React.CSSProperties}
    >
      <header className="border-b border-border p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="font-bold text-xl">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={`Logo ${tenant.name}`} className="h-8" />
          ) : (
            tenant.name
          )}
        </div>
        <nav>
          <Link
            href={loginUrl}
            className="inline-flex items-center justify-center bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors hover:opacity-90"
          >
            Portal do Cliente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </nav>
      </header>

      <section className="flex flex-col items-center justify-center text-center py-20 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{tenant.heroTitle}</h1>
        <p className="text-lg mb-8 opacity-80">{tenant.heroSubtitle}</p>
      </section>

      {/* Container de Conteúdo MDX Customizável */}
      {tenant.contentMDX && (
        <section className="max-w-3xl mx-auto px-4 pb-24 prose prose-neutral dark:prose-invert">
          <MDXRemote source={tenant.contentMDX} components={mdxComponents} />
        </section>
      )}
    </main>
  );
}