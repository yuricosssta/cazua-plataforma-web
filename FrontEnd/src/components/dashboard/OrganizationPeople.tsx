//src/components/dashboard/OrganizationPeople.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  UserPlus,
  Settings,
  Loader2,
  Save,
  Trash2,
  X,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { RootState } from "@/lib/redux/store";
import {
  apiGetOrgMembers,
  apiCreateOrgMember,
  apiUpdateOrgMemberRole,
  apiRemoveOrgMember,
} from "@/lib/services/organizationService";

interface UserData {
  _id: string;
  name: string;
  email: string;
  membership: {
    organizationId: string;
    role: string;
  };
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
  VIEWER: "Visualizador",
};

const PAGE_SIZE = 10;

export function OrganizationPeople() {
  const currentOrg = useSelector(selectCurrentOrg);
  const loggedUser = useSelector((state: RootState) => state.auth.user);
  const loggedUserId = loggedUser?.sub || (loggedUser as any)?._id;

  const orgId =
    typeof currentOrg?.organizationId === "object"
      ? (currentOrg.organizationId as any)._id
      : currentOrg?.organizationId;

  const orgName =
    typeof currentOrg?.organizationId === "object" && currentOrg?.organizationId
      ? (currentOrg.organizationId as any).name || "sua organização"
      : "sua organização";

  const isCurrentUserAdmin = currentOrg?.role === "ADMIN" || currentOrg?.role === "OWNER";

  const [members, setMembers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    membership: { role: "MEMBER" },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [editingMember, setEditingMember] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const fetchMembers = async (silent = false) => {
    if (!orgId) return;
    try {
      if (!silent) setIsLoading(true);
      setFetchError(null);
      const data = await apiGetOrgMembers(orgId);
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setFetchError("Não foi possível carregar os membros da equipe.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    setMembers([]);
    setEditingMember(null);
    setConfirmingRemoval(false);
    fetchMembers();
  }, [orgId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    if (!isCreateModalOpen && !editingMember) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isSubmitting || isSavingRole || isRemovingMember) return;
      if (editingMember) {
        setEditingMember(null);
        setConfirmingRemoval(false);
      } else if (isCreateModalOpen) {
        setIsCreateModalOpen(false);
        setShowPassword(false);
        setCreateError(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateModalOpen, editingMember, isSubmitting, isSavingRole, isRemovingMember]);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return members.filter((member) => {
      const role = member.membership?.role ?? "";
      const matchesRole = roleFilter === "ALL" || role === roleFilter;
      if (!matchesRole) return false;
      if (!query) return true;
      return (
        (member.name ?? "").toLowerCase().includes(query) ||
        (member.email ?? "").toLowerCase().includes(query)
      );
    });
  }, [members, searchQuery, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMembers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredMembers.slice(start, start + PAGE_SIZE);
  }, [filteredMembers, safePage]);

  const closeCreateModal = () => {
    if (isSubmitting) return;
    setIsCreateModalOpen(false);
    setShowPassword(false);
    setCreateError(null);
  };

  const closeEditModal = () => {
    if (isSavingRole || isRemovingMember) return;
    setEditingMember(null);
    setConfirmingRemoval(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setCreateError(null);

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      setCreateError("Informe o nome do colaborador.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setCreateError("Informe um e-mail válido.");
      return;
    }
    if (formData.password.length < 8) {
      setCreateError("A senha provisória deve ter no mínimo 8 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiCreateOrgMember(orgId, {
        name: trimmedName,
        email: trimmedEmail,
        password: formData.password,
        role: formData.membership.role,
      });
      await fetchMembers(true);
      setFormData({ name: "", email: "", password: "", membership: { role: "MEMBER" } });
      setIsCreateModalOpen(false);
      setShowPassword(false);
      setCreateError(null);
      toast.success("Colaborador cadastrado com sucesso!");
    } catch (error: any) {
      const msg = String(error.message || "Erro ao cadastrar usuário.");
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingMember || !orgId) return;
    if (editingMember._id === loggedUserId) {
      toast.error("Você não pode alterar o próprio cargo por aqui.");
      return;
    }

    try {
      setIsSavingRole(true);
      await apiUpdateOrgMemberRole(orgId, editingMember._id, editRole);
      await fetchMembers(true);
      setEditingMember(null);
      setConfirmingRemoval(false);
      toast.success("Cargo atualizado com sucesso!");
    } catch (error: any) {
      toast.error(String(error.message || "Erro ao atualizar cargo."));
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!editingMember || !orgId) return;
    if (editingMember._id === loggedUserId) {
      toast.error("Você não pode remover a si mesmo da organização.");
      return;
    }

    try {
      setIsRemovingMember(true);
      await apiRemoveOrgMember(orgId, editingMember._id);
      await fetchMembers(true);
      setEditingMember(null);
      setConfirmingRemoval(false);
      toast.success("Colaborador removido da empresa.");
    } catch (error: any) {
      toast.error(String(error.message || "Erro ao remover usuário."));
    } finally {
      setIsRemovingMember(false);
    }
  };

  if (!currentOrg) return null;

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-6 text-foreground pb-10">
      {/* Cabeçalho com CTA único para criação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Equipe</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Cadastre novos usuários e gerencie o acesso em <strong>{orgName}</strong>.
          </p>
        </div>

        {isCurrentUserAdmin && (
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-4 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors shadow-sm w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            Novo Colaborador
          </button>
        )}
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="members-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            aria-label="Buscar colaborador por nome ou e-mail"
            className="flex h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        <div className="w-full sm:w-52">
          <select
            id="members-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filtrar por função"
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <option value="ALL">Todas as funções</option>
            <option value="OWNER">Proprietário</option>
            <option value="ADMIN">Administrador</option>
            <option value="MEMBER">Membro</option>
            <option value="VIEWER">Visualizador</option>
          </select>
        </div>
      </div>

      {/* Tabela de Membros Ativos */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Membros Ativos ({filteredMembers.length}
            {filteredMembers.length !== members.length ? ` de ${members.length}` : ""})
          </h2>
        </div>

        <div className="rounded-md border border-border overflow-hidden bg-card shadow-sm">
          {fetchError ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{fetchError}</p>
                <p className="text-xs text-muted-foreground">
                  Verifique sua conexão e tente atualizar a lista.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchMembers()}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-4 rounded-md border border-border bg-background text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">E-mail</th>
                  <th className="px-4 py-3 font-medium">Função</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4">
                        <div className="h-4 w-48 bg-muted rounded-md" />
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <div className="h-4 w-56 bg-muted rounded-md" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-20 bg-muted rounded-md" />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="h-9 w-24 bg-muted rounded-md ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      {members.length === 0 ? (
                        "Nenhum usuário encontrado."
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <p>Nenhum colaborador corresponde aos filtros aplicados.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setRoleFilter("ALL");
                            }}
                            className="inline-flex items-center justify-center min-h-[44px] h-11 px-4 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
                          >
                            Limpar filtros
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => {
                    const initial = (member.name?.trim().charAt(0) || "?").toUpperCase();
                    const isSelf = member._id === loggedUserId;
                    const memberRole = member.membership?.role ?? "MEMBER";
                    const isOwner = memberRole === "OWNER";
                    const isElevated = memberRole === "ADMIN" || memberRole === "OWNER";

                    return (
                      <tr key={member._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center text-xs font-bold border border-border flex-shrink-0 text-accent-foreground">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium text-foreground block truncate">
                                {member.name ?? "Sem nome"} {isSelf && "(Você)"}
                              </span>
                              <span className="text-xs text-muted-foreground sm:hidden block truncate">
                                {member.email ?? ""}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {member.email ?? ""}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${
                              isElevated
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {ROLE_LABELS[memberRole] ?? memberRole}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isOwner ? (
                            <span className="text-xs text-muted-foreground">Proprietário</span>
                          ) : isSelf ? (
                            <span className="text-xs text-muted-foreground">Sua conta</span>
                          ) : isCurrentUserAdmin ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMember(member);
                                setEditRole(memberRole);
                                setConfirmingRemoval(false);
                              }}
                              className="text-primary hover:text-primary/80 transition-colors px-3 min-h-[44px] rounded-md hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary inline-flex items-center gap-2 text-xs font-bold"
                            >
                              <Settings className="w-4 h-4" /> Gerenciar
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {!fetchError && filteredMembers.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-4 pt-1">
            <p className="text-xs text-muted-foreground">
              Página {safePage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 min-h-[44px] px-3 rounded-md border border-border bg-card text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 min-h-[44px] px-3 rounded-md border border-border bg-card text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors disabled:opacity-50"
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO DE NOVO COLABORADOR */}
      {isCreateModalOpen && isCurrentUserAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={closeCreateModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-member-title"
            className="bg-card w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-md shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <h3 id="create-member-title" className="font-semibold text-sm">
                  Cadastrar Novo Colaborador
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                aria-label="Fechar modal"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} noValidate className="p-5 space-y-5">
              <p className="text-xs text-muted-foreground">
                Crie a conta global e forneça a senha provisória para o primeiro acesso. Caso o e-mail já exista no Cazuá, o usuário será vinculado diretamente à equipe.
              </p>

              <fieldset disabled={isSubmitting} className="grid grid-cols-1 md:grid-cols-2 gap-4 disabled:opacity-70">
                <div className="space-y-1.5">
                  <label htmlFor="new-member-name" className="text-xs font-medium text-muted-foreground block">
                    Nome
                  </label>
                  <input
                    id="new-member-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Maria Silva"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-member-email" className="text-xs font-medium text-muted-foreground block">
                    E-mail
                  </label>
                  <input
                    id="new-member-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="maria@construtora.com.br"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-member-password" className="text-xs font-medium text-muted-foreground block">
                    Senha Provisória
                  </label>
                  <div className="relative">
                    <input
                      id="new-member-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="flex h-11 w-full rounded-md border border-input bg-background pl-3 pr-11 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Ocultar senha provisória" : "Mostrar senha provisória"}
                      className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-member-role" className="text-xs font-medium text-muted-foreground block">
                    Cargo
                  </label>
                  <select
                    id="new-member-role"
                    value={formData.membership.role}
                    onChange={(e) =>
                      setFormData({ ...formData, membership: { role: e.target.value } })
                    }
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <option value="MEMBER">Membro</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="VIEWER">Visualizador</option>
                  </select>
                </div>
              </fieldset>

              {createError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                >
                  {createError}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center min-h-[44px] h-11 px-4 rounded-md border border-border bg-background text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-5 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSubmitting ? "Salvando..." : "Salvar Colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE GESTÃO DO MEMBRO */}
      {editingMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={closeEditModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-member-title"
            className="bg-card w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-md shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 id="manage-member-title" className="font-semibold text-sm">
                Gerenciar Acesso
              </h3>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Fechar modal"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <p className="text-sm font-bold text-foreground">{editingMember.name}</p>
                <p className="text-xs text-muted-foreground">{editingMember.email}</p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-member-role"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider block"
                >
                  Cargo na Empresa
                </label>
                <select
                  id="edit-member-role"
                  value={editRole}
                  disabled={isSavingRole || isRemovingMember}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="MEMBER">Membro (Padrão)</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="VIEWER">Visualizador</option>
                </select>
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  disabled={
                    isSavingRole || isRemovingMember || editRole === editingMember.membership?.role
                  }
                  className="w-full min-h-[44px] h-11 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                >
                  {isSavingRole ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    "Atualizar Cargo"
                  )}
                </button>
              </div>

              <div className="border-t border-border pt-4">
                {!confirmingRemoval ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingRemoval(true)}
                    disabled={isSavingRole || isRemovingMember}
                    className="w-full min-h-[44px] h-11 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm font-bold hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Remover da Empresa
                  </button>
                ) : (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 space-y-3">
                    <p className="text-xs text-foreground">
                      Remover <strong>{editingMember.name}</strong> da empresa? Ele perderá acesso às demandas desta organização.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmingRemoval(false)}
                        disabled={isRemovingMember}
                        className="flex-1 min-h-[44px] h-11 rounded-md border border-border bg-background text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveMember}
                        disabled={isRemovingMember}
                        className="flex-1 min-h-[44px] h-11 rounded-md bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isRemovingMember ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Removendo...
                          </>
                        ) : (
                          "Confirmar Remoção"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
