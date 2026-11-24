//src/app/(auth)/signup/page.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import LogoBloco from '@/components/LogoBloco';
import Spinner from '@/components/Spinner';
import { ComercialLogin } from '@/components/landing/ComercialLogin';

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      return setErrorMsg('Informe seu nome completo.');
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return setErrorMsg('Informe um e-mail válido.');
    }
    if (formData.password !== formData.confirmPassword) {
      return setErrorMsg('As senhas não coincidem.');
    }
    if (formData.password.length < 8) {
      return setErrorMsg('A senha deve ter pelo menos 8 caracteres.');
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const message =
          response.status >= 500
            ? 'Erro interno ao criar conta. Tente novamente em instantes.'
            : errData.error || errData.message || 'Não foi possível criar a conta. Verifique os dados informados.';
        throw { apiMessage: message };
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      if (error?.apiMessage) {
        setErrorMsg(String(error.apiMessage));
      } else {
        setErrorMsg('Erro de conexão. Verifique sua internet e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  // TELA DE SUCESSO
  if (isSuccess) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-16 h-16 bg-primary/10 text-primary border border-primary/20 rounded-md flex items-center justify-center mb-6 shadow-inner animate-in zoom-in duration-500">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground mb-2">Conta criada com sucesso!</h2>
        <p className="text-muted-foreground max-w-sm">
          Sua identidade global foi gerada. Você já pode acessar o sistema para criar sua primeira construtora.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-5">
          <Spinner />
          <span>Redirecionando para o login...</span>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors mt-6"
        >
          Ir para o Login agora
        </Link>
      </div>
    );
  }

  // TELA PADRÃO DE CADASTRO
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-background">
      {/* LADO ESQUERDO: O Formulário Focado */}
      <div className="flex flex-col p-6 sm:p-12 lg:p-24 min-h-[100dvh] lg:min-h-screen">
        {/* Logo Mobile */}
        <div className="flex-none lg:hidden mb-8">
          <LogoBloco />
        </div>

        {/* Container Centralizado */}
        <div className="flex-1 flex flex-col justify-center mx-auto w-full sm:w-[380px] space-y-8 pb-12 lg:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col space-y-2 text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Criar conta grátis
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Gere sua identidade global e comece a rastrear suas obras.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <fieldset disabled={isLoading} className="space-y-4 disabled:opacity-70">
              <div className="space-y-2">
                <label htmlFor="signup-name" className="text-sm font-semibold text-foreground block">
                  Nome Completo
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Alguém"
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="signup-email" className="text-sm font-semibold text-foreground block">
                  E-mail corporativo
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nome@construtora.com.br"
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="signup-password" className="text-sm font-semibold text-foreground block">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="flex h-11 w-full rounded-md border border-input bg-transparent pl-3 pr-11 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-confirm-password" className="text-sm font-semibold text-foreground block">
                    Confirmar
                  </label>
                  <div className="relative">
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="flex h-11 w-full rounded-md border border-input bg-transparent pl-3 pr-11 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                      className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordsMismatch && (
                    <p className="text-xs text-destructive">As senhas não coincidem.</p>
                  )}
                </div>
              </div>
            </fieldset>

            {errorMsg && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center justify-center w-full h-11 rounded-md bg-primary px-8 text-sm font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Criando ambiente...
                </span>
              ) : (
                'Criar minha conta'
              )}
            </button>
          </form>

          {/* Rodapé do Formulário */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            Já possui uma conta?{' '}
            <Link
              href="/login"
              className="inline-flex items-center min-h-[44px] px-2 rounded-md underline underline-offset-4 hover:text-primary font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              Fazer Login
            </Link>
          </p>
        </div>
      </div>

      {/* LADO DIREITO: Cópia do Login */}
      <ComercialLogin />
    </div>
  );
}
