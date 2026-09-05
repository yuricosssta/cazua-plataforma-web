//src/app/sites/[domain]/login/page.tsx
"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { loginUser, selectIsAuthenticated } from '@/lib/redux/slices/authSlice';
import { fetchMyOrganizations } from '@/lib/redux/slices/organizationSlice';
import Spinner from '@/components/Spinner';
import LogoBloco from '@/components/LogoBloco';
import { tenantLandingPageSchema, TenantLandingPageDTO } from '@/validations/tenant.zod';
import { getClientApiUrl } from '@/lib/api/clientUtils';
import { notFound } from 'next/navigation';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'grupocazua.com.br';

function extractSlug(domain: string): string | null {
  const isCazuaSubdomain = domain.endsWith(`.${ROOT_DOMAIN}`) && domain !== `www.${ROOT_DOMAIN}`;
  return isCazuaSubdomain ? domain.replace(`.${ROOT_DOMAIN}`, '') : null;
}

function hexToHslString(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  r /= 255; g /= 255; b /= 255;
  const cmax = Math.max(r, g, b), cmin = Math.min(r, g, b), delta = cmax - cmin;
  let h = 0;
  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  const l = (cmax + cmin) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return `${h} ${+(s * 100).toFixed(1)}% ${+(l * 100).toFixed(1)}%`;
}

async function getTenantConfig(slug: string): Promise<TenantLandingPageDTO | null> {
  const endpoint = `/public/landing-pages/by-slug/${encodeURIComponent(slug)}`;
  const response = await fetch(`${getClientApiUrl()}${endpoint}`, { cache: 'no-store' });
  if (!response.ok) return null;
  return response.json();
}

export default function TenantLoginPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const [tenant, setTenant] = useState<TenantLandingPageDTO | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { status, error: authError } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    async function loadTenantConfig() {
      const { domain } = await params;
      const slug = extractSlug(domain);

      if (!slug) {
        notFound();
        return;
      }

      const rawData = await getTenantConfig(slug);
      const parseResult = tenantLandingPageSchema.safeParse(rawData);

      if (!parseResult.success || !parseResult.data.isActive) {
        notFound();
        return;
      }

      setTenant(parseResult.data);
      setIsConfigLoading(false);
    }
    loadTenantConfig();
  }, [params]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyOrganizations())
        .unwrap()
        .then(() => router.push('/dashboard'))
        .catch(() => router.push('/dashboard'));
    }
  }, [isAuthenticated, dispatch, router]);

  if (isConfigLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!tenant) return null;

  const { name, organizationSettings } = tenant;
  const primaryColorHex = organizationSettings.primaryColorHex || '#000000';
  const primaryHSL = hexToHslString(primaryColorHex);
  const logoUrl = organizationSettings.logoUrl;

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      style={{ '--primary': primaryHSL } as React.CSSProperties}
    >
      {/* Cabeçalho com logo */}
      <header className="border-b border-border p-6 flex justify-center items-center">
        {logoUrl ? (
          <img src={logoUrl} alt={`Logo ${name}`} className="h-10" />
        ) : (
          <div className="flex items-center gap-2">
            <LogoBloco />
            <span className="text-sm text-muted-foreground font-medium ml-2">{name}</span>
          </div>
        )}
      </header>

      {/* Container Centralizado */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 pb-16">
        <div className="w-full max-w-sm space-y-8">
          
          <div className="flex flex-col space-y-2 text-center">
            {logoUrl && (
              <h2 className="text-lg font-semibold text-foreground">{name}</h2>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {logoUrl ? 'Acessar Plataforma' : `Acessar ${name}`}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Insira suas credenciais corporativas para gerenciar suas obras e demandas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold leading-none text-foreground">
                E-mail corporativo
              </label>
              <input
                type="email"
                placeholder="nome@construtora.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold leading-none text-foreground">
                  Senha
                </label>
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline" tabIndex={-1}>
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center w-full h-11 rounded-md bg-primary px-8 text-sm font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 mt-2"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Autenticando...
                </span>
              ) : (
                'Entrar no Painel'
              )}
            </button>

            {authError && (
              <div className="p-3 mt-4 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
                Algo deu errado. Verifique suas credenciais e tente novamente.
              </div>
            )}
          </form>

          {/* Rodapé */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            Sua empresa ainda não utiliza o Cazuá?{" "}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
              Criar conta gratuita.
            </Link>
          </p>

        </div>
      </div>

      {/* Rodapé sutil */}
      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        Powered by Cazuá
      </footer>
    </div>
  );
}