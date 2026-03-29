//FrontEnd/src/app/(auth)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import axiosInstance from "@/lib/api/axiosInstance";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axiosInstance.post("/users/forgot-password", { email });
      setIsSuccess(true);
    } catch (error) {
      setIsSuccess(true); // evita vazamento de e-mails
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="max-w-md w-full bg-background border border-border rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Esqueci minha senha</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Digite seu e-mail cadastrado e enviaremos um link seguro para redefinição.
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-800">Pronto! Verifique sua caixa de entrada.</p>
              <p className="text-xs text-emerald-600 mt-1">Se o e-mail existir em nossa base, você receberá o link em instantes.</p>
            </div>
            <Link href="/login" className="block w-full py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors">
              Voltar para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">E-mail de Acesso</label>
              <input type="email" required placeholder="engenheiro@construtora.com.br" value={email} onChange={(e) => setEmail(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-sm" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full h-10 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Link de Recuperação'}
            </button>
            <div className="text-center pt-4">
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}