//src/app/(main)/dashboard/master-admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import axios from "axios";
import { ShieldAlert, Zap, Loader2, Search, Building2, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";

interface OwnerMembership {
  _id: string;
  role: string;
  organizationId: {
    _id: string;
    name: string;
    acronym: string;
    plan: string;
  };
}

interface AdminOrg {
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
  ownerMemberships?: OwnerMembership[]; // O currículo de empresas injetado pelo Back-end
}

export default function MasterAdminPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

  const handleUpdatePlan = async (orgId: string, newPlan: string) => {
    if (!confirm(`Tem certeza que deseja alterar o plano desta empresa para ${newPlan}?`)) return;

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

  const toggleRow = (orgId: string) => {
    if (expandedRow === orgId) setExpandedRow(null);
    else setExpandedRow(orgId);
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
            Painel Administrador Master
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
                <th className="px-6 py-4">Criação</th>
                <th className="px-6 py-4">Status / Plano</th>
                <th className="px-6 py-4 text-right">Ação Rápida</th>
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
                      <div className="text-xs text-muted-foreground mt-0.5">Ticker: {org.acronym || 'N/A'}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="font-medium">{org.ownerId?.email || 'N/A'}</div>
                      {org.ownerMemberships && org.ownerMemberships.length > 0 && (
                        <button 
                          onClick={() => toggleRow(org._id)}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          {expandedRow === org._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Ver {org.ownerMemberships.length} vínculos
                        </button>
                      )}
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(org.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
                        org.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        org.plan === 'PRO' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                        'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}>
                        {org.plan === 'ENTERPRISE' || org.plan === 'PRO' ? <Zap className={`w-3 h-3 ${org.plan === 'ENTERPRISE' ? 'fill-purple-500' : 'fill-amber-500'}`} /> : null}
                        {org.plan || 'FREE'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <select
                        value={org.plan || 'FREE'}
                        onChange={(e) => handleUpdatePlan(org._id, e.target.value)}
                        className="h-8 rounded-sm border border-input bg-background px-2 text-xs font-semibold focus:ring-1 focus:ring-red-600 outline-none cursor-pointer"
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </td>
                  </tr>

                  {/* LINHA EXPANSÍVEL: O Currículo do Dono */}
                  {expandedRow === org._id && org.ownerMemberships && (
                    <tr className="bg-muted/10 border-b-2 border-border/50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="bg-background border border-border rounded-sm p-4 text-xs">
                          <h4 className="font-bold mb-3 flex items-center gap-2 text-muted-foreground">
                            <LinkIcon className="w-4 h-4" /> 
                            Raio-X: Outras empresas vinculadas a {org.ownerId?.email}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {org.ownerMemberships.map(mem => (
                              <div key={mem._id} className="p-2 bg-muted/30 rounded-sm border border-border/50 flex flex-col gap-1">
                                <span className="font-semibold text-foreground truncate" title={mem.organizationId?.name}>
                                  {mem.organizationId?.name || 'Desconhecida'}
                                </span>
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${mem.role === 'OWNER' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    {mem.role}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-foreground">
                                    {mem.organizationId?.plan || 'FREE'}
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
            Nenhuma empresa encontrada no banco de dados.
          </div>
        )}
      </div>
    </div>
  );
}