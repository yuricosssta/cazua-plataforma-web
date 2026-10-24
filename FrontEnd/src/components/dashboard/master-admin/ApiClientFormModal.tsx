"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  Cpu,
  Building2,
  UserCheck,
  Search,
  Globe,
  Shield,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchBff } from "@/lib/api/fetchBff";
import { IGeneratedSecretData } from "./ApiClientSecretModal";

export interface IApiClientOwnerInfo {
  _id: string;
  name: string;
  email: string;
}

export interface IApiClientItem {
  _id: string;
  name: string;
  clientId: string;
  allowedOrgIds: string[];
  defaultRole: "MEMBER" | "VIEWER";
  ownerUserId?: IApiClientOwnerInfo | string | null;
  resetPasswordUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAdminOrgSummary {
  _id: string;
  name: string;
  acronym: string;
  plan: string;
}

interface IApiClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClient: IApiClientItem | null;
  organizations: IAdminOrgSummary[];
  onSaved: () => void;
  onSecretGenerated: (secretData: IGeneratedSecretData) => void;
}

export function ApiClientFormModal({
  isOpen,
  onClose,
  editingClient,
  organizations,
  onSaved,
  onSecretGenerated,
}: IApiClientFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [defaultRole, setDefaultRole] = useState<"MEMBER" | "VIEWER">("MEMBER");
  const [resetPasswordUrl, setResetPasswordUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [orgSearchTerm, setOrgSearchTerm] = useState("");

  const [selectedOwner, setSelectedOwner] = useState<IApiClientOwnerInfo | null>(
    null,
  );
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<
    IApiClientOwnerInfo[]
  >([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (editingClient) {
      setName(editingClient.name || "");
      setDefaultRole(editingClient.defaultRole || "MEMBER");
      setResetPasswordUrl(editingClient.resetPasswordUrl || "");
      setSelectedOrgIds(
        (editingClient.allowedOrgIds || []).map((id) => String(id)),
      );

      if (
        editingClient.ownerUserId &&
        typeof editingClient.ownerUserId === "object"
      ) {
        setSelectedOwner({
          _id: String(editingClient.ownerUserId._id),
          name: editingClient.ownerUserId.name,
          email: editingClient.ownerUserId.email,
        });
      } else {
        setSelectedOwner(null);
      }
    } else {
      setName("");
      setDefaultRole("MEMBER");
      setResetPasswordUrl("");
      setSelectedOrgIds([]);
      setSelectedOwner(null);
    }

    setUrlError(null);
    setOrgSearchTerm("");
    setUserSearchTerm("");
    setUserSearchResults([]);
  }, [isOpen, editingClient]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    const trimmed = userSearchTerm.trim();
    if (trimmed.length < 2) {
      setUserSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const results = await fetchBff<IApiClientOwnerInfo[]>(
          `/api/users/search?term=${encodeURIComponent(trimmed)}`,
        );
        setUserSearchResults(Array.isArray(results) ? results : []);
      } catch {
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  if (!isOpen || !mounted) return null;

  const toggleOrgSelection = (orgId: string) => {
    setSelectedOrgIds((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId],
    );
  };

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      (org.acronym &&
        org.acronym.toLowerCase().includes(orgSearchTerm.toLowerCase())),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return toast.warning(
        "O nome da aplicação deve conter pelo menos 2 caracteres.",
      );
    }

    if (selectedOrgIds.length === 0) {
      return toast.warning(
        "Selecione pelo menos uma organização permitida para esta aplicação.",
      );
    }

    const rawUrl = resetPasswordUrl.trim();
    let normalizedUrl = "";
    if (rawUrl) {
      normalizedUrl = /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : `https://${rawUrl}`;
      try {
        const parsed = new URL(normalizedUrl);
        if (!parsed.hostname.includes(".")) {
          throw new Error("Invalid hostname");
        }
        setResetPasswordUrl(normalizedUrl);
        setUrlError(null);
      } catch {
        const msg =
          "Informe uma URL válida para recuperação de senha (ex: https://app.parceiro.com/reset).";
        setUrlError(msg);
        return toast.warning(msg);
      }
    } else {
      setUrlError(null);
    }

    try {
      setIsSubmitting(true);

      if (editingClient) {
        await fetchBff(`/api/api-clients/${editingClient._id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: trimmedName,
            allowedOrgIds: selectedOrgIds,
            defaultRole,
            ownerUserId: selectedOwner ? selectedOwner._id : null,
            resetPasswordUrl: normalizedUrl ? normalizedUrl : null,
          }),
        });
        toast.success("Configurações do API Client atualizadas com sucesso!");
        onSaved();
        onClose();
      } else {
        const created = await fetchBff<
          IApiClientItem & { clientSecret: string }
        >("/api/api-clients", {
          method: "POST",
          body: JSON.stringify({
            name: trimmedName,
            allowedOrgIds: selectedOrgIds,
            defaultRole,
            ...(selectedOwner && { ownerUserId: selectedOwner._id }),
            ...(normalizedUrl && { resetPasswordUrl: normalizedUrl }),
          }),
        });

        toast.success("Aplicação registrada com sucesso!");
        onSaved();
        onClose();
        onSecretGenerated({
          appName: created.name,
          clientId: created.clientId,
          clientSecret: created.clientSecret,
          isRotation: false,
        });
      }
    } catch (error: any) {
      toast.error(
        String(
          error.response?.data?.message ||
            error.message ||
            "Erro ao salvar API Client.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-client-form-title"
    >
      <div className="bg-background w-full max-w-2xl max-h-[90vh] rounded-md shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden text-foreground">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div>
            <h2
              id="api-client-form-title"
              className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2"
            >
              <Cpu className="w-5 h-5 text-primary" />
              {editingClient
                ? `Editar Aplicação: ${editingClient.name}`
                : "Registrar Nova Aplicação (API Client)"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure credenciais server-to-server, organizações autorizadas e
              redirecionamento de recuperação de senha.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Bloco 1: Identificação e Papel Padrão */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                Nome da Aplicação{" "}
                <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                placeholder="Ex: Portal do Cliente / App Vistoria"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-muted-foreground" />
                Cargo no Auto-Cadastro
              </label>
              <select
                value={defaultRole}
                onChange={(e) =>
                  setDefaultRole(e.target.value as "MEMBER" | "VIEWER")
                }
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring outline-none cursor-pointer"
              >
                <option value="MEMBER">MEMBER (Membro)</option>
                <option value="VIEWER">VIEWER (Leitor)</option>
              </select>
            </div>
          </div>

          {/* Bloco 2: Usuário Responsável (ownerUserId) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-muted-foreground" />
              Usuário Responsável pela Aplicação (Opcional)
            </label>

            {selectedOwner ? (
              <div className="flex items-center justify-between p-3 rounded-md border border-primary-border bg-primary-bg">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-primary truncate">
                    {selectedOwner.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedOwner.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOwner(null)}
                  className="h-11 px-3 rounded-md border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  Desvincular
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar usuário por nome ou e-mail (mín. 2 letras)..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-background pl-9 pr-9 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring outline-none"
                  />
                  {isSearchingUsers && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {userSearchTerm.trim().length >= 2 &&
                  !isSearchingUsers &&
                  userSearchResults.length > 0 && (
                    <div className="border border-border rounded-md bg-card divide-y divide-border max-h-40 overflow-y-auto shadow-sm">
                      {userSearchResults.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => {
                            setSelectedOwner(user);
                            setUserSearchTerm("");
                            setUserSearchResults([]);
                          }}
                          className="w-full min-h-11 px-3 py-2 text-left hover:bg-muted/50 flex items-center justify-between transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-foreground truncate">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {user.email}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-primary shrink-0 ml-2">
                            Selecionar
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                {userSearchTerm.trim().length >= 2 &&
                  !isSearchingUsers &&
                  userSearchResults.length === 0 && (
                    <p className="text-xs text-muted-foreground px-1">
                      Nenhum usuário ativo encontrado para &ldquo;{userSearchTerm}
                      &rdquo;.
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Bloco 3: URL de Recuperação de Senha (resetPasswordUrl) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-muted-foreground" />
              URL de Recuperação de Senha Customizada (Opcional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: https://parceiro.com.br/redefinir-senha"
                value={resetPasswordUrl}
                onChange={(e) => {
                  setResetPasswordUrl(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                aria-invalid={!!urlError}
                className={`flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring outline-none ${
                  urlError
                    ? "border-red-600 dark:border-red-400"
                    : "border-input"
                }`}
              />
              {resetPasswordUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordUrl("");
                    setUrlError(null);
                  }}
                  className="h-11 px-3 rounded-md border border-border bg-card hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
            {urlError && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {urlError}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Se preenchida, os e-mails de{" "}
              <code className="font-mono">POST /users/forgot-password</code>{" "}
              autenticados com este API Client apontarão para{" "}
              <code className="font-mono">
                {"{resetPasswordUrl}?token=<jwt>"}
              </code>
              . Se vazia, usarão a tela neutra <code className="font-mono">/recover</code> do Cazuá.
            </p>
          </div>

          {/* Bloco 4: Organizações Permitidas (allowedOrgIds) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Organizações Permitidas (<code className="text-xs">allowedOrgIds</code>){" "}
                <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <span className="text-xs font-bold text-primary">
                {selectedOrgIds.length} selecionada(s)
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar organizações por nome ou sigla..."
                value={orgSearchTerm}
                onChange={(e) => setOrgSearchTerm(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring outline-none"
              />
            </div>

            <div className="border border-border rounded-md bg-card max-h-48 overflow-y-auto divide-y divide-border">
              {filteredOrgs.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Nenhuma organização encontrada para o filtro informado.
                </div>
              ) : (
                filteredOrgs.map((org) => {
                  const isSelected = selectedOrgIds.includes(org._id);
                  return (
                    <button
                      key={org._id}
                      type="button"
                      onClick={() => toggleOrgSelection(org._id)}
                      className={`w-full min-h-11 px-3 py-2.5 text-left flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-primary-bg text-primary"
                          : "hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input bg-background"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-semibold truncate">
                          {org.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0 ml-2">
                        {org.acronym || "N/A"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 px-4 text-sm font-medium rounded-md border border-border bg-card hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-5 text-sm font-bold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm transition-colors"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingClient
                ? "Salvar Alterações"
                : "Gerar Credenciais da Aplicação"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

