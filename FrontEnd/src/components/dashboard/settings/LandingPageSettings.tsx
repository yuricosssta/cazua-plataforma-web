//src/components/dashboard/settings/LandingPageSettings.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { landingPageService } from "@/lib/services/landingPageService";
import { Loader2, Globe, Eye, AlertCircle, Copy, Check, ExternalLink } from "lucide-react";

export function LandingPageSettings() {
  const currentOrgId = useSelector((state: RootState) => state.organizations.currentOrganization?.organizationId?._id);
  const orgSlug = useSelector((state: RootState) => state.organizations.currentOrganization?.organizationId?.slug);
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'grupocazua.com.br';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loginUrl = orgSlug ? `https://${orgSlug}.${rootDomain}/login` : '';

  useEffect(() => {
    async function fetchConfig() {
      if (!currentOrgId) return;
      try {
        const data = await landingPageService.getConfig(currentOrgId);
        setIsActive(data.isActive ?? false);
      } catch (error: any) {
        if (!error.message.includes("não encontrada")) {
          setErrorMsg(error.message || "Falha ao carregar configurações.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, [currentOrgId]);

  const handleToggle = async () => {
    if (!currentOrgId) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const newActive = !isActive;
      await landingPageService.upsertConfig(currentOrgId, { isActive: newActive });
      setIsActive(newActive);
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(loginUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Visibilidade */}
      <section className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-md">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4" /> Portal de Login da Construtora
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Ative para disponibilizar a página de login personalizada com a identidade visual da sua empresa.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isActive}
            onChange={handleToggle}
            disabled={isSaving}
          />
          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border/60 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </section>

      {/* Endereço do Portal de Login */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold border-b border-border pb-2 flex items-center gap-2">
          <Globe className="w-4 h-4" /> Endereço do Portal de Login
        </h3>

        <div className="p-4 border border-border rounded-md bg-card shadow-sm space-y-4">
          <p className="text-xs text-muted-foreground">
            Este é o link que a construtora deve colocar no botão &quot;Portal do Cliente&quot; do seu site.
            Ao acessar este endereço, o cliente verá a página de login personalizada com a logo e cor da construtora.
          </p>

          {!orgSlug ? (
            <p className="text-xs text-muted-foreground italic">Nenhum slug configurado para esta organização.</p>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted/30 rounded-md border border-border font-mono text-sm text-foreground break-all">
                {loginUrl}
              </div>
              <button
                onClick={handleCopyUrl}
                className="h-9 px-3 rounded-md border border-border bg-background hover:bg-muted transition-colors flex items-center gap-1 shrink-0 text-sm font-medium"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-emerald-600" /> Copiado</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar</>
                )}
              </button>
              <a
                href={loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3 rounded-md border border-border bg-background hover:bg-muted transition-colors flex items-center gap-1 shrink-0 text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" /> Testar
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}