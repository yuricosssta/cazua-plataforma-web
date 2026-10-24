"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { KeyRound, Copy, Check, ShieldAlert, Lock } from "lucide-react";
import { toast } from "sonner";

export interface IGeneratedSecretData {
  appName: string;
  clientId: string;
  clientSecret: string;
  isRotation?: boolean;
}

interface IApiClientSecretModalProps {
  secretData: IGeneratedSecretData | null;
  onClose: () => void;
}

export function ApiClientSecretModal({
  secretData,
  onClose,
}: IApiClientSecretModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<"id" | "secret" | null>(null);
  const [hasConfirmedSave, setHasConfirmedSave] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (secretData) {
      setHasConfirmedSave(false);
      setCopiedField(null);
    }
  }, [secretData]);

  if (!secretData || !mounted) return null;

  const handleCopy = async (value: string, field: "id" | "secret") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(
        field === "secret"
          ? "Client Secret copiado para a área de transferência!"
          : "Client ID copiado para a área de transferência!",
      );
      setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2500);
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secret-modal-title"
    >
      <div className="bg-background w-full max-w-lg rounded-md shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden text-foreground">
        <div className="bg-amber-100 dark:bg-amber-950/60 border-b border-amber-300 dark:border-amber-800 px-6 py-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold uppercase tracking-wider">
              Atenção: Exibição Única de Segredo
            </p>
            <p>
              Por segurança, o <strong>Client Secret</strong> é armazenado apenas
              como hash SHA-256 e <strong>jamais poderá ser exibido novamente</strong>{" "}
              após fechar esta janela.
            </p>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-border bg-muted/30">
          <h2
            id="secret-modal-title"
            className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2"
          >
            <KeyRound className="w-5 h-5 text-primary" />
            {secretData.isRotation
              ? "Novo Segredo Gerado"
              : "Credenciais da Aplicação Criadas"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Aplicação: <strong className="text-foreground">{secretData.appName}</strong>
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Header <code className="text-foreground">x-client-id</code>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={secretData.clientId}
                onFocus={(e) => e.currentTarget.select()}
                className="flex h-11 w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => handleCopy(secretData.clientId, "id")}
                className="h-11 px-4 rounded-md border border-border bg-card hover:bg-accent text-foreground text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors"
                title="Copiar Client ID"
              >
                {copiedField === "id" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              Header <code className="text-foreground">x-client-secret</code>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={secretData.clientSecret}
                onFocus={(e) => e.currentTarget.select()}
                className="flex h-11 w-full rounded-md border border-primary-border bg-primary-bg px-3 py-2 text-xs font-mono font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => handleCopy(secretData.clientSecret, "secret")}
                className="h-11 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-2 shrink-0 transition-colors shadow-sm"
                title="Copiar Client Secret"
              >
                {copiedField === "secret" ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Segredo
                  </>
                )}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3.5 rounded-md border border-border bg-muted/20 cursor-pointer select-none min-h-11">
            <input
              type="checkbox"
              checked={hasConfirmedSave}
              onChange={(e) => setHasConfirmedSave(e.target.checked)}
              className="w-4 h-4 rounded-md border-input accent-primary cursor-pointer"
            />
            <span className="text-xs font-medium text-foreground">
              Confirmo que copiei e armazenei o{" "}
              <code className="font-mono font-bold">clientSecret</code> em um
              cofre/gerenciador seguro.
            </span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
          <button
            type="button"
            disabled={!hasConfirmedSave}
            onClick={onClose}
            className="h-11 px-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Concluir e Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

