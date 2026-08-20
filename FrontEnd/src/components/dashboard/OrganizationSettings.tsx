//src/components/dashboard/OrganizationSettings.tsx
"use client";

import React from "react";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { Edit2, AlertTriangle } from "lucide-react";

export function OrganizationSettings() {
  const currentOrg = useSelector(selectCurrentOrg);

  if (!currentOrg) {
    return <div className="animate-pulse h-32 bg-muted rounded-md w-full"></div>;
  }

  const orgName = currentOrg.organizationId.name;
  const initial = orgName.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Workspace</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gerencie a identidade e as preferências da sua organização.
        </p>
      </div>

      <div className="flex flex-col space-y-8">
        {/* Identidade Visual */}
        <section className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-semibold">Logo da Empresa</h3>
            <p className="text-xs text-muted-foreground mt-1">Faça o upload de uma imagem para representar a organização</p>
          </div>
          <button className="flex items-center justify-center w-12 h-12 rounded-full bg-muted border border-border hover:ring-2 hover:ring-ring transition-all cursor-pointer">
            <span className="font-bold text-muted-foreground">{initial}</span>
          </button>
        </section>

        {/* Nome da Organização */}
        <section className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-semibold">Nome da Organização</h3>
            <p className="text-xs text-muted-foreground mt-1">Altere o nome de exibição oficial da sua equipe</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors">
            {orgName} <Edit2 className="w-4 h-4" />
          </button>
        </section>

        {/* Nome do Usuário no Contexto do Time */}
        <section className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h3 className="text-sm font-semibold">Seu apelido na equipe</h3>
            <p className="text-xs text-muted-foreground mt-1">Sobrescreva seu nome de exibição especificamente para este workspace</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors">
            Yuri Costa <Edit2 className="w-4 h-4" />
          </button>
        </section>

        {/* Zona de Perigo (Danger Zone) */}
        <section className="pt-4">
          <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-md">
            <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Zona de Perigo
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <p className="text-xs text-muted-foreground">
                Sair desta equipe removerá seu acesso a todos os projetos e dados vinculados a ela.
              </p>
              <button className="h-9 px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors whitespace-nowrap shadow-sm">
                Sair da Equipe
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}