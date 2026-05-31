//src/app/(main)/dashboard/planning/page.tsx
"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { UploadPlanningModal } from "@/components/planning/UploadPlanningModal";
import { SearchCompositionsModal } from "@/components/planning/SearchCompositionsModal";
import { UploadCloud, Search, Info } from "lucide-react";

export default function PlanningPage() {
  // 1. Extração do usuário e perfil do state global (padrão BFF)
  const authUser = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: any) => state.user?.profile);
  const displayUser = profile || authUser;

  // 2. Verificação de permissão centralizada
  const isSuperAdmin = Boolean(displayUser?.isSuperAdmin);

  // 3. Controle dos Modais
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">

      {/* Cabeçalho */}
      <div className="border-b border-border pb-6 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Planejamento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie e consulte bases de composições de serviços, materiais e insumos.
        </p>
      </div>

      <div className="flex flex-col space-y-8">

        {/* Administração de Base (Exclusivo Super Admin) */}
        {isSuperAdmin && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Administração de Base
            </h2>
            <section className="flex flex-col sm:flex-row sm:items-center justify-between border border-border bg-card p-5 rounded-sm shadow-sm gap-4 sm:gap-0">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">Upload de Composições</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Faça upload de planilhas de composições (SINAPI ou customizadas) para o banco de dados geral.
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="h-9 px-4 py-2 bg-primary text-primary-foreground border border-transparent rounded-sm text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <UploadCloud className="w-4 h-4" /> Importar Dados
              </button>
            </section>
          </div>
        )}

        {/* Consultas e Relatórios */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Consultas e Pesquisas
          </h2>
          <section className="flex flex-col sm:flex-row sm:items-center justify-between border border-border bg-card p-5 rounded-sm shadow-sm gap-4 sm:gap-0">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">Pesquisar Composições</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Busque rapidamente por serviços e insumos disponíveis na base de dados do sistema.
              </p>
            </div>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="h-9 px-4 py-2 bg-secondary text-secondary-foreground border border-border rounded-sm text-sm font-bold hover:bg-muted transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" /> Abrir Pesquisa
            </button>
          </section>
        </div>

        {/* Alerta para usuários padrão */}
        {!isSuperAdmin && (
          <div className="mt-4 p-4 bg-muted/40 border border-border rounded-sm flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong>Aviso:</strong> A importação e gestão das bases de composições são restritas à administração da plataforma. Você possui acesso completo às ferramentas de consulta.
            </p>
          </div>
        )}

      </div>

      {/* Modais do Módulo de Planejamento */}
      <UploadPlanningModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
      <SearchCompositionsModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

    </div>
  );
}