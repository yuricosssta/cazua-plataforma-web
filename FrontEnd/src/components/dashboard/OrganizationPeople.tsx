//src/components/dashboard/OrganizationPeople.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { UserPlus, Settings, Loader2, Save, Trash2, ShieldAlert, X } from "lucide-react";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { RootState } from "@/lib/redux/store";
import {
  apiGetOrgMembers,
  apiCreateOrgMember,
  apiUpdateOrgMemberRole,
  apiRemoveOrgMember
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

export function OrganizationPeople() {
  const currentOrg = useSelector(selectCurrentOrg);
  const token = useSelector((state: RootState) => state.auth.token);
  const loggedUser = useSelector((state: RootState) => state.auth.user);
  const loggedUserId = loggedUser?.sub || (loggedUser as any)?._id;

  const orgId = typeof currentOrg?.organizationId === "object"
    ? (currentOrg.organizationId as any)._id
    : currentOrg?.organizationId;

  const isCurrentUserAdmin = currentOrg?.role === 'ADMIN' || currentOrg?.role === 'OWNER';

  const [members, setMembers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", membership: { role: "MEMBER" } });

  const [editingMember, setEditingMember] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState("");
  const [isUpdatingAction, setIsUpdatingAction] = useState(false);

  const fetchMembers = async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      const data = await apiGetOrgMembers(orgId);
      setMembers(data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && orgId) fetchMembers();
  }, [token, orgId]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !orgId) return;
    try {
      setIsSubmitting(true);
      await apiCreateOrgMember(orgId, {
        name: formData.name, email: formData.email, password: formData.password, role: formData.membership.role
      });
      setFormData({ name: "", email: "", password: "", membership: { role: "MEMBER" } });
      fetchMembers();
      alert("Usuário criado com sucesso!");
    } catch (error: any) {
      alert(error.message || "Erro ao cadastrar usuário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingMember || !orgId) return;
    try {
      setIsUpdatingAction(true);
      await apiUpdateOrgMemberRole(orgId, editingMember._id, editRole);
      setEditingMember(null);
      fetchMembers();
    } catch (error: any) {
      alert(error.message || "Erro ao atualizar cargo.");
    } finally {
      setIsUpdatingAction(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!editingMember || !orgId) return;
    if (!confirm(`Tem certeza que deseja remover ${editingMember.name} da construtora? Ele perderá acesso a todas as demandas.`)) return;

    try {
      setIsUpdatingAction(true);
      await apiRemoveOrgMember(orgId, editingMember._id);
      setEditingMember(null);
      fetchMembers();
    } catch (error: any) {
      alert(error.message || "Erro ao remover usuário.");
    } finally {
      setIsUpdatingAction(false);
    }
  };

  if (!currentOrg) return null;

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-8 text-foreground pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão de Equipe</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Cadastre novos usuários e gerencie o acesso em <strong>{currentOrg.organizationId.name}</strong>.
        </p>
      </div>

      {isCurrentUserAdmin && (
        <div className="p-5 border border-border bg-card rounded-md shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4" /> Cadastrar Novo Colaborador</h3>
            <p className="text-xs text-muted-foreground mt-1">Crie a conta global e forneça a senha provisória para o primeiro acesso.</p>
          </div>
          <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-1 focus-visible:ring-primary" />
            </div>
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground">E-mail</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-1 focus-visible:ring-primary" />
            </div>
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Senha Provisória</label>
              <input type="text" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-1 focus-visible:ring-primary" />
            </div>
            <div className="w-full sm:w-32 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cargo</label>
              <select value={formData.membership.role} onChange={(e) => setFormData({ ...formData, membership: { role: e.target.value } })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-1 focus-visible:ring-primary">
                <option value="MEMBER">Membro</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 h-9 px-4 w-full sm:w-auto bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
            </button>
          </form>
        </div>
      )}

      {/* Tabela de Membros Ativos */}
      <div className="flex flex-col space-y-4">
        <h3 className="text-sm font-semibold">Membros Ativos ({members.length})</h3>
        <div className="rounded-md border border-border overflow-hidden bg-card shadow-sm">
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
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Carregando usuários...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
              ) : (
                members.map((member) => (
                  <tr key={member._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold border border-border flex-shrink-0 text-accent-foreground">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{member.name} {member._id === loggedUserId && "(Você)"}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${member.membership.role === 'ADMIN' || member.membership.role === 'OWNER' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                        {member.membership.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isCurrentUserAdmin && member.membership.role !== 'OWNER' && (
                        <button
                          onClick={() => { setEditingMember(member); setEditRole(member.membership.role); }}
                          className="text-primary hover:text-primary/80 transition-colors p-1.5 rounded-md hover:bg-primary/10 flex items-center gap-2 ml-auto text-xs font-bold"
                        >
                          <Settings className="w-4 h-4" /> Gerenciar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE GESTÃO DO MEMBRO */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-background w-full max-w-sm rounded-sm shadow-2xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Gerenciar Acesso</h3>
              <button onClick={() => setEditingMember(null)} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <p className="text-sm font-bold text-foreground">{editingMember.name}</p>
                <p className="text-xs text-muted-foreground">{editingMember.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cargo na Empresa</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-primary">
                  <option value="MEMBER">Membro (Padrão)</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                <button
                  onClick={handleUpdateRole} disabled={isUpdatingAction || editRole === editingMember.membership.role}
                  className="w-full h-9 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 mt-2 flex items-center justify-center"
                >
                  {isUpdatingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar Cargo'}
                </button>
              </div>

              <div className="border-t border-border pt-4">
                <button
                  onClick={handleRemoveMember} disabled={isUpdatingAction}
                  className="w-full h-9 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Remover da Empresa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}