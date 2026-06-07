//src/app/(main)/dashboard/planning/page.tsx
"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { UploadCostsModal } from "@/components/planning/UploadCostsModal";
import { UploadPlanningModal } from "@/components/planning/UploadPlanningModal";
import { SearchCompositionsModal } from "@/components/planning/SearchCompositionsModal";
import { UploadCloud, Search, Info, DollarSign } from "lucide-react";

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
  const [isUploadCostsModalOpen, setIsUploadCostsModalOpen] = useState(false);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Card 1: Base Principal */}
              <section className="flex flex-col justify-between border border-border bg-card p-5 rounded-lg shadow-sm gap-4">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">Upload de Composições</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Faça upload da planilha estrutural completa (composições, insumos, descrições e unidades).
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="h-9 w-full px-4 py-2 bg-[#8B4513] text-white border border-transparent rounded-md text-sm font-bold hover:bg-[#8B4513]/90 transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <UploadCloud className="w-4 h-4" /> Importar Estrutura
                </button>
              </section>

              {/* Card 2: Atualização de Custos */}
              <section className="flex flex-col justify-between border border-border bg-card p-5 rounded-lg shadow-sm gap-4">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">Atualização de Custos</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Faça upload de uma planilha complementar contendo apenas os códigos e os novos valores de custo.
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadCostsModalOpen(true)}
                  className="h-9 w-full px-4 py-2 bg-secondary text-secondary-foreground border border-border rounded-md text-sm font-bold hover:bg-muted transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <DollarSign className="w-4 h-4" /> Injetar Custos
                </button>
              </section>

            </div>
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
      <UploadCostsModal
        isOpen={isUploadCostsModalOpen}
        onClose={() => setIsUploadCostsModalOpen(false)}
      />
      <SearchCompositionsModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

    </div>
  );
}