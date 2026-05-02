//src/app/(auth)/signup/page.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { HardHat, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import LogoBloco from '@/components/LogoBloco'; 
import Spinner from '@/components/Spinner';

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (formData.password !== formData.confirmPassword) {
      return setErrorMsg("As senhas não coincidem.");
    }
    if (formData.password.length < 6) {
      return setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
    }

    try {
      setIsLoading(true);
      // Bate na rota pública do seu Back-end para criar a conta global
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      setIsSuccess(true);
      
      // Sucesso! Joga o usuário para o Login após 3 segundos
      setTimeout(() => {
        router.push("/login");
      }, 3000);
      
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      setErrorMsg(error.response?.data?.message || "Não foi possível criar a conta. Este e-mail pode já estar em uso.");
    } finally {
      setIsLoading(false);
    }
  };

  // TELA DE SUCESSO (Mini-animação antes do redirecionamento)
  if (isSuccess) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner animate-in zoom-in duration-500">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground mb-2">Conta criada com sucesso!</h2>
        <p className="text-muted-foreground max-w-sm">
          Sua identidade global foi gerada. Redirecionando para o login para você criar sua primeira construtora...
        </p>
      </div>
    );
  }

  // TELA PADRÃO DE CADASTRO
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-background">
      
      {/* LADO ESQUERDO: O Formulário Focado */}
      <div className="flex flex-col p-6 sm:p-12 lg:p-24 min-h-[100dvh] lg:min-h-screen">
        
        {/* Logo Mobile  */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nome Completo</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Alguém"
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">E-mail corporativo</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nome@construtora.com.br"
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Senha</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Confirmar</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center w-full h-11 rounded-md bg-primary px-8 text-sm font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 mt-2"
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

            {errorMsg && (
              <div className="p-3 mt-4 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {errorMsg}
              </div>
            )}
          </form>

          {/* Rodapé do Formulário */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            Já possui uma conta?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary font-bold">
              Fazer Login
            </Link>
          </p>

        </div>
      </div>

      {/* LADO DIREITO: Cópia do Login */}
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
              <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800 text-zinc-300">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-zinc-200 font-semibold">Linha do Tempo Centralizada</h4>
                <p className="text-sm leading-relaxed mt-1">Acompanhe todos os laudos, diários e avanços da sua obra em uma timeline auditável.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800 text-zinc-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-zinc-200 font-semibold">RBAC e Segurança</h4>
                <p className="text-sm leading-relaxed mt-1">Controle de permissões granular. Apenas a equipe técnica designada interfere na sua demanda.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800 text-zinc-300">
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