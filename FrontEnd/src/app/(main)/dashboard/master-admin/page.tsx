//src/app/(main)/dashboard/master-admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import axios from "axios";
import { ShieldAlert, Zap, Loader2, Search, Building2 } from "lucide-react";

interface AdminOrg {
  _id: string;
  name: string;
  acronym: string;
  plan: string;
  createdAt: string;
  ownerId?: {
    name: string;
    email: string;
  };
}

export default function MasterAdminPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllOrgs = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/admin/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrgs(response.data);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Acesso negado ou erro ao buscar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAllOrgs();
  }, [token]);

  const handleUpdatePlan = async (orgId: string, currentPlan: string) => {
    const newPlan = currentPlan === "FREE" ? "PRO" : "FREE";
    const confirmMessage = newPlan === "PRO" 
      ? "Tem certeza que deseja FAZER O UPGRADE desta empresa para PRO?" 
      : "Tem certeza que deseja REBAIXAR esta empresa para FREE?";
      
    if (!confirm(confirmMessage)) return;

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/admin/${orgId}/plan`,
        { plan: newPlan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAllOrgs(); // Recarrega a lista para atualizar a tela
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao atualizar plano.");
    }
  };

  const filteredOrgs = orgs.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (org.ownerId?.email && org.ownerId.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col space-y-6 text-foreground pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-red-600 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8" />
            Painel Adiministrador Master
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Área de risco. Gerencie o faturamento e o plano das empresas ativas no Cazuá.
          </p>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar empresa ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-red-600"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Proprietário (E-mail)</th>
                <th className="px-6 py-4">Data de Criação</th>
                <th className="px-6 py-4">Plano Atual</th>
                <th className="px-6 py-4 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrgs.map((org) => (
                <tr key={org._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {org.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Ticker: {org.acronym || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{org.ownerId?.email || 'N/A'}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      org.plan === 'PRO' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                      {org.plan === 'PRO' ? <Zap className="w-3 h-3 fill-amber-500" /> : null}
                      {org.plan || 'FREE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleUpdatePlan(org._id, org.plan || 'FREE')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                        org.plan === 'PRO' 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                          : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                      }`}
                    >
                      {org.plan === 'PRO' ? 'Rebaixar para FREE' : 'Promover para PRO'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrgs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma empresa encontrada no banco de dados.
          </div>
        )}
      </div>
    </div>
  );
}