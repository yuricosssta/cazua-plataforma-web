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
import { HardHat, Activity, Wallet } from 'lucide-react'; // Ícones atualizados
import LogoBloco from '@/components/LogoBloco'; 
import { ComercialLogin } from '@/components/landing/ComercialLogin';

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
        
        {/* Logo Mobile  */}
        <div className="flex-none lg:hidden mb-8">
           <LogoBloco />
        </div>

        {/* Container Centralizado */}
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
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline" tabIndex={-1}>
                  Esqueceu a senha? (em breve)
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
                Algo deu errado. Verifique suas credenciais e tente novamente.
              </div>
            )}
          </form>

          {/* Rodapé do Formulário */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            Sua empresa ainda não utiliza o Cazuá?{" "}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
              Criar conta gratuita.
            </Link>
          </p>

        </div>
      </div>

      {/* LADO DIREITO: Atualizado com Copywriting Comercial */}
      <ComercialLogin />
      
    </div>
  );
}