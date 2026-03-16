//src/app/(auth)/login/page.tsx

"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { loginUser, selectIsAuthenticated } from '@/lib/redux/slices/authSlice';
import { fetchMyOrganizations } from '@/lib/redux/slices/organizationSlice';
import Spinner from '@/components/Spinner';
import { HardHat, Activity, ShieldCheck } from 'lucide-react';
import LogoBloco from '@/components/LogoBloco'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { status, error } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyOrganizations())
        .unwrap()
        .then(() => router.push('/dashboard'))
        .catch((err) => {
          console.error("Erro ao carregar organizações pós-login:", err);
          router.push('/dashboard'); 
        });
    }
  }, [isAuthenticated, dispatch, router]);

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-background">
      
      {/* LADO ESQUERDO: O Formulário Focado */}
      <div className="flex flex-col p-6 sm:p-12 lg:p-24 min-h-[100dvh] lg:min-h-screen">
        
        {/* Logo Mobile (Agora dentro do fluxo natural, empurra o resto pra baixo) */}
        <div className="flex-none lg:hidden mb-8">
           <LogoBloco />
        </div>

        {/* Container Centralizado (O flex-1 garante que ele ocupe o espaço restante) */}
        <div className="flex-1 flex flex-col justify-center mx-auto w-full sm:w-[380px] space-y-8 pb-12 lg:pb-0">
          
          <div className="flex flex-col space-y-2 text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Acessar plataforma
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Insira suas credenciais corporativas para gerenciar suas obras e demandas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                E-mail corporativo
              </label>
              <input
                type="email"
                placeholder="nome@construtora.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                  Senha
                </label>
                <Link href="/esqueci-minha-senha" className="text-xs font-medium text-primary hover:underline" tabIndex={-1}>
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
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

            {error && (
              <div className="p-3 mt-4 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}
          </form>

          {/* Rodapé do Formulário */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            Sua empresa ainda não utiliza o Cazuá?{" "}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
              Agendar demonstração
            </Link>
          </p>

        </div>
      </div>

      {/* LADO DIREITO: Permanece idêntico (Oculto no Mobile) */}
      <div className="relative hidden lg:flex h-full flex-col bg-zinc-950 text-white p-10 dark:border-r">
        <div className="absolute inset-0 bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative z-20 flex items-center text-lg font-medium gap-2">
          <LogoBloco />
        </div>

        <div className="relative z-20 mt-auto mb-auto max-w-lg mx-auto">
          <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
            Gestão de obras de ponta a ponta.
          </h2>
          <div className="space-y-6 text-zinc-400">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-300">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-zinc-200 font-semibold">Linha do Tempo Centralizada</h4>
                <p className="text-sm leading-relaxed mt-1">Acompanhe todos os laudos, diários e avanços da sua obra em uma timeline auditável.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-zinc-200 font-semibold">RBAC e Segurança</h4>
                <p className="text-sm leading-relaxed mt-1">Controle de permissões granular. Apenas a equipe técnica designada interfere na sua demanda.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-300">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-zinc-200 font-semibold">Decisões Baseadas em Dados</h4>
                <p className="text-sm leading-relaxed mt-1">Matriz GUT integrada para priorização inteligente do seu fluxo de execução diário.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 mt-auto text-sm text-zinc-500 font-medium">
          © {new Date().getFullYear()} Grupo Cazuá. Sistema fechado para clientes corporativos.
        </div>
      </div>
      
    </div>
  );
}
