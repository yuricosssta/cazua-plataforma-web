// FrontEnd/src/app/(auth)/reset-password/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, ArrowRight, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import axiosInstance from "@/lib/api/axiosInstance";

function ResetPasswordContent() { // isolado
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token"); // Extrai o ?token= da URL

  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) return setErrorMsg("Link de recuperação inválido ou ausente.");
    if (passwords.new.length < 6) return setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
    if (passwords.new !== passwords.confirm) return setErrorMsg("As senhas não coincidem.");

    setIsLoading(true);
    try {
      await axiosInstance.post("/users/reset-password", {
        token,
        newPassword: passwords.new
      });
      setIsSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 3000);
      
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "Erro ao redefinir senha. O link pode ter expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  // Se o usuário acessar a rota sem o token na URL, barramos na hora
  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-800">Link Inválido</p>
          <p className="text-xs text-red-600 mt-1">Não encontramos o token de segurança na URL. Por favor, solicite a recuperação novamente.</p>
        </div>
        <Link href="/forgot-password" className="block w-full py-2.5 bg-background border border-border text-foreground text-sm font-bold rounded-md hover:bg-muted transition-colors">
          Pedir novo link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-800">Senha Redefinida!</p>
          <p className="text-xs text-emerald-600 mt-1">Sua nova senha foi salva. Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Nova Senha</label>
        <input 
          type="password" 
          required minLength={6} 
          placeholder="Mínimo de 6 caracteres"
          value={passwords.new} 
          onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-sm" 
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Confirmar Nova Senha</label>
        <input 
          type="password" 
          required 
          placeholder="Digite a senha novamente"
          value={passwords.confirm} 
          onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-sm" 
        />
      </div>

      <button 
        type="submit" 
        disabled={isLoading || !passwords.new} 
        className="w-full h-10 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <>Salvar Nova Senha <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="max-w-md w-full bg-background border border-border rounded-sm shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Criar nova senha</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Quase lá. Digite sua nova senha de acesso abaixo.
          </p>
        </div>

        {/* O Suspense é obrigatório no Next.js App Router quando usamos useSearchParams */}
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
          <ResetPasswordContent />
        </Suspense>

      </div>
    </div>
  );
}