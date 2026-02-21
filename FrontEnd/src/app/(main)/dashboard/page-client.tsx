// src/app/(main)/dashboard/page-client.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Verifique se o import do Label está certo
import { useSelector, useDispatch } from "react-redux";
import { 
  selectAllOrgs, 
  selectCurrentOrg, 
  fetchMyOrganizations,
  selectOrgStatus
} from "@/lib/redux/slices/organizationSlice";
import { selectAuthToken } from "@/lib/redux/slices/authSlice"; // Crie este seletor se não tiver
import { apiCreateOrganization } from "@/lib/api/organizationService";
import { OrgSwitcher } from "@/components/OrgSwitcher"; // Importe o componente que criamos

export function PageClient() {
  const dispatch = useDispatch<any>();
  
  // Redux Selectors
  const organizations = useSelector(selectAllOrgs);
  const currentOrg = useSelector(selectCurrentOrg);
  const status = useSelector(selectOrgStatus);
  const token = useSelector((state: any) => state.auth.token); // Ajuste conforme seu RootState

  // Local State para o formulário
  const [orgName, setOrgName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  // Função de Criar Organização
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName) return;

    setIsCreating(true);
    try {
      // 1. Cria no Backend
      await apiCreateOrganization(token, orgName);
      
      // 2. Recarrega a lista no Redux (o auto-select vai selecionar a nova empresa)
      await dispatch(fetchMyOrganizations());
      
      setOrgName("");
    } catch (error) {
      alert("Erro ao criar organização. Veja o console.");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  // --- RENDERIZAÇÃO ---

  // 1. Carregando...
  if (status === 'loading' && organizations.length === 0) {
    return <div className="flex h-screen items-center justify-center">Carregando empresas...</div>;
  }

  // 2. Usuário sem nenhuma empresa (Onboarding)
  if (organizations.length === 0 && status === 'succeeded') {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-center text-2xl font-semibold mb-2">Bem-vindo ao Cazuá!</h1>
          <p className="text-center text-gray-500 mb-6">
            Para começar, crie sua primeira organização (Empresa).
          </p>
          
          <form onSubmit={handleCreateOrg}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Nome da Empresa</Label>
                <Input
                  id="orgName"
                  placeholder="Ex: Construtora Silva"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <Button className="w-full" disabled={isCreating}>
                {isCreating ? "Criando..." : "Criar Organização"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 3. Dashboard Principal (Com Empresa Selecionada)
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Aqui está o seletor de empresas (pode mover para a Sidebar depois) */}
        <div className="w-64">
           <OrgSwitcher />
        </div>
      </div>

      {currentOrg ? (
        <div className="grid gap-4">
          <div className="p-4 border rounded bg-white shadow-sm">
            <h2 className="text-xl font-semibold">
              Você está na: <span className="text-blue-600">{currentOrg.organizationId.name}</span>
            </h2>
            <p className="text-gray-600">Seu cargo: {currentOrg.role}</p>
            <p className="text-sm text-gray-400 mt-2">ID: {currentOrg.organizationId._id}</p>
          </div>

          {/* AQUI ENTRARIA O CONTEÚDO REAL DO DASHBOARD (Gráficos, Obras, etc) */}
          <div className="p-8 border-2 border-dashed border-gray-300 rounded text-center text-gray-400">
             Conteúdo da dashboard aparecerá aqui...
          </div>
        </div>
      ) : (
        <div>Selecione uma organização...</div>
      )}
    </div>
  );
}