//src/app/(main)/dashboard/master-admin/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ShieldAlert,
  Zap,
  Search,
  Building2,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Cpu,
  Plus,
  Copy,
  Check,
  KeyRound,
  Settings,
  Power,
  PowerOff,
  Globe,
  UserCheck,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { fetchBff } from "@/lib/api/fetchBff";
import {
  ApiClientFormModal,
  IApiClientItem,
} from "@/components/dashboard/master-admin/ApiClientFormModal";
import {
  ApiClientSecretModal,
  IGeneratedSecretData,
} from "@/components/dashboard/master-admin/ApiClientSecretModal";

interface IOwnerMembership {
  _id: string;
  role: string;
  organizationId: {
    _id: string;
    name: string;
    acronym: string;
    plan: string;
  };
}

interface IAdminOrg {
  _id: string;
  name: string;
  acronym: string;
  plan: string;
  createdAt: string;
  ownerId?: {
    _id: string;
    name: string;
    email: string;
  };
  ownerMemberships?: IOwnerMembership[];
}

interface IPendingConfirmAction {
  title: string;
  description: string;
  confirmLabel: string;
  variant: "warning" | "danger" | "primary";
  onConfirm: () => Promise<void>;
}

export default function MasterAdminPage() {
  const [activeTab, setActiveTab] = useState<"orgs" | "api-clients">("orgs");

  const [orgs, setOrgs] = useState<IAdminOrg[]>([]);
  const [apiClients, setApiClients] = useState<IApiClientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<IApiClientItem | null>(
    null,
  );
  const [generatedSecret, setGeneratedSecret] =
    useState<IGeneratedSecretData | null>(null);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] =
    useState<IPendingConfirmAction | null>(null);

  const fetchMasterData = async () => {
    try {
      setIsLoading(true);
      const [orgsData, clientsData] = await Promise.all([
        fetchBff<IAdminOrg[]>("/api/organizations/admin/all"),
        fetchBff<IApiClientItem[]>("/api/api-clients"),
      ]);
      setOrgs(Array.isArray(orgsData) ? orgsData : []);
      setApiClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error: any) {
      console.error(error);
      toast.error(
        String(
          error.response?.data?.message ||
            "Acesso negado ou erro ao buscar dados do Master Admin.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshApiClients = async () => {
    try {
      const clientsData = await fetchBff<IApiClientItem[]>("/api/api-clients");
      setApiClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error: any) {
      toast.error(
        String(
          error.response?.data?.message ||
            "Erro ao atualizar lista de API Clients.",
        ),
      );
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (!pendingConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isActionLoading) {
        setPendingConfirm(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingConfirm, isActionLoading]);

  const orgMap = useMemo(() => {
    const map = new Map<string, IAdminOrg>();
    orgs.forEach((o) => map.set(String(o._id), o));
    return map;
  }, [orgs]);

  const requestPlanUpdate = (org: IAdminOrg, newPlan: string) => {
    if (newPlan === (org.plan || "FREE")) return;
    setPendingConfirm({
      title: `Alterar Plano de ${org.name}`,
      description: `Tem certeza que deseja alterar o plano da empresa "${org.name}" para ${newPlan}?`,
      confirmLabel: `Confirmar ${newPlan}`,
      variant: "primary",
      onConfirm: async () => {
        await fetchBff(`/api/organizations/admin/${org._id}/plan`, {
          method: "PATCH",
          body: JSON.stringify({ plan: newPlan }),
        });
        toast.success(`Plano alterado para ${newPlan} com sucesso!`);
        await fetchMasterData();
      },
    });
  };

  const requestRotateSecret = (client: IApiClientItem) => {
    setPendingConfirm({
      title: `Rotacionar Segredo: ${client.name}`,
      description: `Um novo clientSecret será gerado para "${client.name}" (${client.clientId}) e o segredo anterior será invalidado imediatamente. Aplicações em produção que usam o segredo antigo pararão de autenticar até serem atualizadas.`,
      confirmLabel: "Rotacionar Segredo Agora",
      variant: "warning",
      onConfirm: async () => {
        const res = await fetchBff<{
          message: string;
          clientId: string;
          clientSecret: string;
        }>(`/api/api-clients/${client._id}/rotate-secret`, {
          method: "POST",
        });
        toast.success("Segredo rotacionado com sucesso!");
        setGeneratedSecret({
          appName: client.name,
          clientId: res.clientId,
          clientSecret: res.clientSecret,
          isRotation: true,
        });
      },
    });
  };

  const requestToggleClientActive = (client: IApiClientItem) => {
    if (client.isActive) {
      setPendingConfirm({
        title: `Desativar Aplicação: ${client.name}`,
        description: `Ao desativar "${client.name}", todas as chamadas server-to-server com o clientId "${client.clientId}" serão bloqueadas imediatamente.`,
        confirmLabel: "Desativar Aplicação",
        variant: "danger",
        onConfirm: async () => {
          await fetchBff(`/api/api-clients/${client._id}`, {
            method: "DELETE",
          });
          toast.success("Aplicação desativada com sucesso.");
          await refreshApiClients();
        },
      });
    } else {
      setPendingConfirm({
        title: `Reativar Aplicação: ${client.name}`,
        description: `Deseja reativar a aplicação "${client.name}" (${client.clientId})?`,
        confirmLabel: "Reativar Aplicação",
        variant: "primary",
        onConfirm: async () => {
          await fetchBff(`/api/api-clients/${client._id}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: true }),
          });
          toast.success("Aplicação reativada com sucesso.");
          await refreshApiClients();
        },
      });
    }
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    try {
      setIsActionLoading(true);
      await pendingConfirm.onConfirm();
      setPendingConfirm(null);
    } catch (error: any) {
      toast.error(
        String(
          error.response?.data?.message ||
            error.message ||
            "Falha ao executar a operação.",
        ),
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopyClientId = async (clientId: string) => {
    try {
      await navigator.clipboard.writeText(clientId);
      setCopiedClientId(clientId);
      toast.success("Client ID copiado!");
      setTimeout(() => {
        setCopiedClientId((prev) => (prev === clientId ? null : prev));
      }, 2000);
    } catch {
      toast.error("Não foi possível copiar o Client ID.");
    }
  };

  const toggleRow = (orgId: string) => {
    if (expandedRow === orgId) setExpandedRow(null);
    else setExpandedRow(orgId);
  };

  const filteredOrgs = orgs.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.acronym &&
        org.acronym.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.ownerId?.email &&
        org.ownerId.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const filteredClients = apiClients.filter((client) => {
    const q = searchTerm.toLowerCase();
    const ownerEmail =
      client.ownerUserId && typeof client.ownerUserId === "object"
        ? client.ownerUserId.email.toLowerCase()
        : "";
    const ownerName =
      client.ownerUserId && typeof client.ownerUserId === "object"
        ? client.ownerUserId.name.toLowerCase()
        : "";
    return (
      client.name.toLowerCase().includes(q) ||
      client.clientId.toLowerCase().includes(q) ||
      ownerEmail.includes(q) ||
      ownerName.includes(q)
    );
  });

  if (isLoading) {
    return (
      <div
        className="max-w-6xl mx-auto w-full flex flex-col space-y-6 pb-24 animate-pulse"
        aria-busy="true"
      >
        <div className="h-10 w-80 bg-secondary rounded-md" />
        <div className="h-11 max-w-md bg-secondary rounded-md" />
        <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-8 px-6 py-5 border-b border-border last:border-0"
            >
              <div className="h-4 w-44 bg-muted rounded-md" />
              <div className="h-4 w-60 bg-muted rounded-md" />
              <div className="h-4 w-20 bg-muted rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col space-y-6 text-foreground pb-24">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-red-600 dark:text-red-400 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8" />
            Painel Administrador Master
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Área restrita ao Super Admin. Gerencie planos de organizações e
            credenciais de aplicações externas (API Clients).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={
                activeTab === "orgs"
                  ? "Buscar empresa, sigla ou e-mail..."
                  : "Buscar aplicação, clientId ou responsável..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-background pl-9 pr-10 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Limpar busca"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {activeTab === "api-clients" && (
            <button
              type="button"
              onClick={() => {
                setEditingClient(null);
                setIsFormModalOpen(true);
              }}
              className="h-11 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold flex items-center justify-center gap-2 shrink-0 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Aplicação
            </button>
          )}
        </div>
      </div>

      {/* Navegação por Abas */}
      <div
        className="flex items-center gap-2 border-b border-border"
        role="tablist"
        aria-label="Seções do Painel Master Admin"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "orgs"}
          onClick={() => {
            setActiveTab("orgs");
            setSearchTerm("");
          }}
          className={`min-h-11 px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "orgs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Empresas e Planos
          <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {orgs.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "api-clients"}
          onClick={() => {
            setActiveTab("api-clients");
            setSearchTerm("");
          }}
          className={`min-h-11 px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "api-clients"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cpu className="w-4 h-4" />
          API Clients (Integrações)
          <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {apiClients.length}
          </span>
        </button>
      </div>

      {/* ABA 1: EMPRESAS E PLANOS */}
      {activeTab === "orgs" && (
        <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-6 py-4">Empresa</th>
                  <th className="px-6 py-4">Proprietário (E-mail)</th>
                  <th className="px-6 py-4">Criação</th>
                  <th className="px-6 py-4">Status / Plano</th>
                  <th className="px-6 py-4 text-right">Alterar Plano</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrgs.map((org) => (
                  <React.Fragment key={org._id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {org.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Ticker: {org.acronym || "N/A"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {org.ownerId?.email || "N/A"}
                        </div>
                        {org.ownerMemberships &&
                          org.ownerMemberships.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleRow(org._id)}
                              className="min-h-11 px-2 -ml-2 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                            >
                              {expandedRow === org._id ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                              Ver {org.ownerMemberships.length} vínculos
                            </button>
                          )}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            org.plan === "ENTERPRISE"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 border-purple-200"
                              : org.plan === "PRO"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 border-amber-200"
                                : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {org.plan === "ENTERPRISE" || org.plan === "PRO" ? (
                            <Zap
                              className={`w-3 h-3 ${
                                org.plan === "ENTERPRISE"
                                  ? "fill-purple-500"
                                  : "fill-amber-500"
                              }`}
                            />
                          ) : null}
                          {org.plan || "FREE"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <select
                          aria-label={`Alterar plano de ${org.name}`}
                          value={org.plan || "FREE"}
                          onChange={(e) =>
                            requestPlanUpdate(org, e.target.value)
                          }
                          className="h-11 rounded-md border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-ring outline-none cursor-pointer"
                        >
                          <option value="FREE">FREE</option>
                          <option value="PRO">PRO</option>
                          <option value="ENTERPRISE">ENTERPRISE</option>
                        </select>
                      </td>
                    </tr>

                    {expandedRow === org._id && org.ownerMemberships && (
                      <tr className="bg-muted/10 border-b-2 border-border/50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="bg-background border border-border rounded-md p-4 text-xs">
                            <h4 className="font-bold mb-3 flex items-center gap-2 text-muted-foreground">
                              <LinkIcon className="w-4 h-4" />
                              Raio-X: Outras empresas vinculadas a{" "}
                              {org.ownerId?.email}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {org.ownerMemberships.map((mem) => (
                                <div
                                  key={mem._id}
                                  className="p-2.5 bg-muted/30 rounded-md border border-border/50 flex flex-col gap-1"
                                >
                                  <span
                                    className="font-semibold text-foreground truncate"
                                    title={mem.organizationId?.name}
                                  >
                                    {mem.organizationId?.name || "Desconhecida"}
                                  </span>
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                        mem.role === "OWNER"
                                          ? "bg-primary-bg text-primary"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {mem.role}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground">
                                      {mem.organizationId?.plan || "FREE"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredOrgs.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma empresa encontrada para os critérios informados.
            </div>
          )}
        </div>
      )}

      {/* ABA 2: API CLIENTS (APLICAÇÕES EXTERNAS) */}
      {activeTab === "api-clients" && (
        <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-6 py-4">Aplicação / Client ID</th>
                  <th className="px-6 py-4">Responsável</th>
                  <th className="px-6 py-4">Organizações & Cargo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClients.map((client) => {
                  const ownerObj =
                    client.ownerUserId && typeof client.ownerUserId === "object"
                      ? client.ownerUserId
                      : null;

                  return (
                    <tr
                      key={client._id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Coluna 1: Nome, Client ID e URL de Recuperação */}
                      <td className="px-6 py-4 space-y-1.5">
                        <div className="font-bold text-foreground flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-primary shrink-0" />
                          {client.name}
                        </div>

                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleCopyClientId(client.clientId)}
                            className="min-h-11 px-3 py-1.5 rounded-md border border-border bg-muted/60 hover:bg-accent text-foreground inline-flex items-center gap-2 transition-colors"
                            title="Clique para copiar o Client ID"
                            aria-label={`Copiar Client ID de ${client.name}`}
                          >
                            <code className="text-xs font-mono">
                              {client.clientId}
                            </code>
                            {copiedClientId === client.clientId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                          </button>
                        </div>

                        {client.resetPasswordUrl ? (
                          <div
                            className="text-[11px] text-muted-foreground flex items-center gap-1 max-w-xs truncate"
                            title={client.resetPasswordUrl}
                          >
                            <Globe className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate">
                              {client.resetPasswordUrl}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground">
                            Recuperação padrão (<code className="font-mono">/recover</code>)
                          </div>
                        )}
                      </td>

                      {/* Coluna 2: Usuário Responsável (ownerUserId) */}
                      <td className="px-6 py-4">
                        {ownerObj ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                              {ownerObj.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {ownerObj.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Não vinculado
                          </span>
                        )}
                      </td>

                      {/* Coluna 3: Organizações Permitidas & Cargo Padrão */}
                      <td className="px-6 py-4 space-y-2">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {(client.allowedOrgIds || [])
                            .slice(0, 3)
                            .map((orgId) => {
                              const resolvedOrg = orgMap.get(String(orgId));
                              return (
                                <span
                                  key={String(orgId)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary-bg text-primary border border-primary-border"
                                  title={
                                    resolvedOrg
                                      ? `${resolvedOrg.name} (${resolvedOrg._id})`
                                      : String(orgId)
                                  }
                                >
                                  <Building2 className="w-3 h-3 shrink-0" />
                                  {resolvedOrg
                                    ? resolvedOrg.acronym || resolvedOrg.name
                                    : String(orgId).slice(-6)}
                                </span>
                              );
                            })}
                          {(client.allowedOrgIds || []).length > 3 && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground border border-border"
                              title={(client.allowedOrgIds || [])
                                .slice(3)
                                .map((orgId) => {
                                  const resolvedOrg = orgMap.get(String(orgId));
                                  return resolvedOrg
                                    ? `${resolvedOrg.name} (${resolvedOrg.acronym || "N/A"})`
                                    : String(orgId);
                                })
                                .join(", ")}
                            >
                              +{(client.allowedOrgIds || []).length - 3} org(s)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Cargo no auto-cadastro:{" "}
                          <strong className="text-foreground font-mono">
                            {client.defaultRole}
                          </strong>
                        </div>
                      </td>

                      {/* Coluna 4: Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            client.isActive
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                          }`}
                        >
                          {client.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      {/* Coluna 5: Ações */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingClient(client);
                              setIsFormModalOpen(true);
                            }}
                            className="h-11 px-3 rounded-md border border-primary-border bg-primary-bg hover:bg-primary-hover-bg text-primary text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                            title="Editar configurações"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => requestRotateSecret(client)}
                            className="h-11 px-3 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                            title="Gerar novo clientSecret e invalidar o atual"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Rotacionar Segredo
                          </button>

                          <button
                            type="button"
                            onClick={() => requestToggleClientActive(client)}
                            className={`h-11 px-3 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                              client.isActive
                                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            }`}
                            title={
                              client.isActive
                                ? "Desativar aplicação"
                                : "Reativar aplicação"
                            }
                          >
                            {client.isActive ? (
                              <>
                                <PowerOff className="w-3.5 h-3.5" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <Power className="w-3.5 h-3.5" />
                                Reativar
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="p-10 text-center space-y-3">
              <p className="text-muted-foreground text-sm">
                Nenhuma aplicação externa (API Client) encontrada.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingClient(null);
                  setIsFormModalOpen(true);
                }}
                className="h-11 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar Primeira Aplicação
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Criar / Editar API Client */}
      <ApiClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editingClient={editingClient}
        organizations={orgs}
        onSaved={refreshApiClients}
        onSecretGenerated={(secretData) => setGeneratedSecret(secretData)}
      />

      {/* Modal de Exibição Única de Segredo */}
      <ApiClientSecretModal
        secretData={generatedSecret}
        onClose={() => setGeneratedSecret(null)}
      />

      {/* Modal de Confirmação para Ações Críticas */}
      {pendingConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-action-title"
        >
          <div className="bg-background w-full max-w-md rounded-md shadow-2xl border border-border p-6 space-y-4 text-foreground">
            <div className="flex items-start gap-3">
              <ShieldAlert
                className={`w-6 h-6 shrink-0 mt-0.5 ${
                  pendingConfirm.variant === "danger"
                    ? "text-red-600 dark:text-red-400"
                    : pendingConfirm.variant === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-primary"
                }`}
              />
              <div className="space-y-1">
                <h3
                  id="confirm-action-title"
                  className="text-base font-bold tracking-tight text-foreground"
                >
                  {pendingConfirm.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pendingConfirm.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setPendingConfirm(null)}
                className="h-11 px-4 rounded-md border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={executeConfirmedAction}
                className={`h-11 px-4 rounded-md text-xs font-bold inline-flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm ${
                  pendingConfirm.variant === "danger"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {isActionLoading && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
