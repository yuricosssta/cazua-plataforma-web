// src/components/dashboard/OrganizationPeople.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { UserPlus, MoreHorizontal, Loader2, Save } from "lucide-react";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { RootState } from "@/lib/redux/store";
import axios from "axios";


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

  const getOrgId = (): string => {
    if (!currentOrg?.organizationId) return "";
    // Se o Redux populou como objeto, pegamos o _id
    if (typeof currentOrg.organizationId === "object" && "_id" in currentOrg.organizationId) {
      return (currentOrg.organizationId as any)._id;
    }
    // Se for apenas a string do ID
    return currentOrg.organizationId as string;
  };

  const orgId = getOrgId();

  // Estados da Lista de Usuários
  const [members, setMembers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do Formulário de Cadastro
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    membership: {
      organizationId: orgId,
      role: "MEMBER" // Padrão
    }
  });

  // Função para buscar os usuários no backend
  const fetchMembers = async () => {
    if (!orgId) return; // Trava a requisição se o ID não existir ainda

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${orgId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && orgId) fetchMembers();
  }, [token, orgId]);

  // Função para cadastrar um novo usuário direto pelo Admin
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !orgId) return;

    try {
      setIsSubmitting(true);

      // 1. Cria o usuário global (Sua rota atual)
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${orgId}/members`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.membership.role
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // 'x-organization-id': orgId
          }
        }
      );

      // 2. Limpa o formulário e atualiza a lista
      setFormData({
        name: "",
        email: "",
        password: "",
        membership: { organizationId: orgId, role: "MEMBER" }
      });
      fetchMembers();

      alert("Usuário criado com sucesso! Ele já pode fazer login.");
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      alert(error.response?.data?.message || "Erro ao cadastrar usuário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentOrg) return null;

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-8 text-foreground pb-10">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão de Membros</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Cadastre novos usuários e gerencie o acesso da sua equipe em <strong>{currentOrg.organizationId.name}</strong>.
        </p>
      </div>

      {/* Formulário de Cadastro Manual (Substitui o Convite por Email) */}
      <div className="p-5 border border-border bg-card rounded-lg shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Cadastrar Novo Colaborador
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Crie a conta e forneça a senha temporária para que o colaborador acesse o sistema.
          </p>
        </div>

        <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nome</label>
            <input
              type="text" required
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-medium text-muted-foreground">E-mail</label>
            <input
              type="email" required
              value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Senha Provisória</label>
            <input
              type="text" required
              value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="w-full sm:w-32 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Cargo</label>
            <select
              value={formData.membership.role} onChange={(e) => setFormData({ ...formData, membership: { ...formData.membership, role: e.target.value } })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="MEMBER">Membro</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 h-9 px-4 w-full sm:w-auto bg-foreground text-background rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </form>
      </div>

      {/* Tabela de Membros Ativos (Agora Consumindo a API) */}
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
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Carregando usuários...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold border border-border flex-shrink-0 text-accent-foreground">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{member.name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {member.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${member.membership.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                        {member.membership.role === 'ADMIN' ? 'Admin' : (member.membership.role || 'Member')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}