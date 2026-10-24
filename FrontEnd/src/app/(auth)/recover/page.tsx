"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { fetchBff } from "@/lib/api/fetchBff";

function RecoverContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) {
      return setErrorMsg("Link de recuperação inválido ou ausente.");
    }
    if (passwords.new.length < 8) {
      return setErrorMsg("A senha deve conter no mínimo 8 caracteres.");
    }
    if (passwords.new !== passwords.confirm) {
      return setErrorMsg("As senhas informadas não coincidem.");
    }

    setIsLoading(true);
    try {
      await fetchBff("/api/users/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: passwords.new }),
      });
      setIsSuccess(true);
    } catch (error: any) {
      setErrorMsg(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Erro ao redefinir a senha. O link pode ter expirado.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-semibold text-destructive">Link Inválido</p>
          <p className="text-xs text-muted-foreground mt-1">
            Não foi possível identificar o token de validação. Solicite um novo link de recuperação no seu aplicativo.
          </p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
        <div className="p-5 bg-card border border-border rounded-md">
          <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground">Senha atualizada com sucesso!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sua nova senha já está ativa. Você já pode fechar esta aba e retornar ao aplicativo para realizar o login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      {errorMsg && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs font-semibold rounded-md border border-destructive/20">
          {errorMsg}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Nova Senha</label>
        <input
          type="password"
          required
          minLength={8}
          placeholder="Mínimo de 8 caracteres"
          value={passwords.new}
          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Confirmar Nova Senha</label>
        <input
          type="password"
          required
          placeholder="Digite novamente a nova senha"
          value={passwords.confirm}
          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !passwords.new || !passwords.confirm}
        className="w-full h-11 min-h-11 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Salvar Nova Senha <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

export default function RecoverPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-md shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-md flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Redefinir Senha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Digite sua nova senha abaixo para atualizar sua conta.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
        >
          <RecoverContent />
        </Suspense>
      </div>
    </div>
  );
}
