//src/app/(main)/dashboard/resources/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  ClipboardList,
  History,
  Plus,
  ArrowDownToLine,
  Send,
  Users,
  ShieldAlert,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { ResourceCatalog } from "@/components/resources/ResourceCatalog";
import { CreateResourceModal } from "@/components/resources/CreateResourceModal";
import { AddStockModal } from "@/components/resources/AddStockModal";
import { TransactionHistory } from "@/components/resources/TransactionHistory";
import { PendingRequests } from "@/components/resources/PendingRequests";
import { AllocateDirectlyModal } from "@/components/resources/AllocateDirectlyModal";
import { ManageWarehouseTeamDrawer } from "@/components/resources/ManageWarehouseTeamDrawer";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import {
  resourceService,
  AddStockInitialData,
} from "@/lib/services/resourceService";

type TabType = "catalog" | "requests" | "history";

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("catalog");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [stockModalInitialData, setStockModalInitialData] =
    useState<AddStockInitialData | null>(null);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [warehouseTeam, setWarehouseTeam] = useState<string[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);

  const currentOrg = useSelector(selectCurrentOrg);
  const user = useSelector((state: RootState) => state.auth.user);

  const orgId =
    typeof currentOrg?.organizationId === "object"
      ? (currentOrg.organizationId as any)._id
      : currentOrg?.organizationId;

  const orgRole = currentOrg?.role || "MEMBER";
  const isAdminOrOwner = orgRole === "OWNER" || orgRole === "ADMIN";
  const currentUserId = String(
    user?.sub || (user as any)?._id || (user as any)?.id || ""
  );

  const fetchTeam = useCallback(async () => {
    if (!orgId) {
      setIsLoadingTeam(false);
      return;
    }
    try {
      setIsLoadingTeam(true);
      setTeamError(null);
      const team = await resourceService.getWarehouseTeam(orgId);
      setWarehouseTeam(team.map((id) => String(id)));
    } catch (error) {
      console.error("Erro ao buscar equipe do almoxarifado:", error);
      setTeamError(
        "Não foi possível verificar suas permissões do Almoxarifado Central."
      );
    } finally {
      setIsLoadingTeam(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const isAssigned = warehouseTeam.includes(currentUserId);
  const hasWriteAccess = isAdminOrOwner || isAssigned;

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleOpenAddStock = () => {
    setStockModalInitialData(null);
    setIsAddStockModalOpen(true);
  };

  const handleOpenCorrectionEntry = (initialData: AddStockInitialData) => {
    setStockModalInitialData(initialData);
    setIsAddStockModalOpen(true);
  };

  const handleCloseAddStockModal = () => {
    setIsAddStockModalOpen(false);
    setStockModalInitialData(null);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-6 pb-10">
      {/* CABEÇALHO E AÇÕES GLOBAIS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Almoxarifado Central
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de recursos, saldos de materiais e aprovação de requisições
            dos projetos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {isAdminOrOwner && (
            <button
              type="button"
              onClick={() => setIsTeamDrawerOpen(true)}
              className="flex-1 sm:flex-none bg-background border border-border text-muted-foreground hover:text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors flex items-center justify-center gap-2 font-medium text-sm min-h-11 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Users className="w-4 h-4" />
              Equipe
            </button>
          )}

          {hasWriteAccess && (
            <>
              <button
                type="button"
                onClick={handleOpenAddStock}
                className="flex-1 sm:flex-none bg-secondary border border-border text-secondary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 font-medium text-sm min-h-11 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowDownToLine className="w-4 h-4" /> Entrada de Recurso
              </button>

              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(true)}
                className="flex-1 sm:flex-none bg-secondary border border-border text-secondary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 font-medium text-sm min-h-11 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Send className="w-4 h-4" /> Saída de Recurso
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 sm:flex-none bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-semibold text-sm min-h-11 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="w-4 h-4" /> Novo Recurso
              </button>
            </>
          )}
        </div>
      </div>

      {!isLoadingTeam && teamError && (
        <div className="bg-st-critical-bg border border-st-critical-border text-st-critical p-3 rounded-md flex flex-wrap items-center justify-between gap-3 text-sm font-medium">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{teamError}</span>
          </div>
          <button
            type="button"
            onClick={fetchTeam}
            className="inline-flex items-center gap-2 px-3 min-h-11 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      )}

      {!isLoadingTeam && !teamError && !hasWriteAccess && (
        <div className="bg-st-execution-bg border border-st-execution-border text-st-execution p-3 rounded-md flex items-center gap-3 text-sm font-medium">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Você está em modo de visualização. Apenas a equipe autorizada do
            Almoxarifado Central pode registrar movimentações.
          </span>
        </div>
      )}

      {/* NAVEGAÇÃO INTERNA (TABS) */}
      <div className="border-b border-border overflow-x-auto">
        <nav
          className="flex space-x-6 min-w-max"
          role="tablist"
          aria-label="Seções do Almoxarifado Central"
        >
          <button
            type="button"
            role="tab"
            id="tab-catalog"
            aria-selected={activeTab === "catalog"}
            aria-controls="resources-tabpanel"
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 min-h-11 py-2.5 px-1 border-b-2 font-medium text-sm whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === "catalog"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            <Package className="w-4 h-4" /> Saldo de Recursos
          </button>

          <button
            type="button"
            role="tab"
            id="tab-requests"
            aria-selected={activeTab === "requests"}
            aria-controls="resources-tabpanel"
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 min-h-11 py-2.5 px-1 border-b-2 font-medium text-sm whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === "requests"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Fila de Requisições
          </button>

          <button
            type="button"
            role="tab"
            id="tab-history"
            aria-selected={activeTab === "history"}
            aria-controls="resources-tabpanel"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 min-h-11 py-2.5 px-1 border-b-2 font-medium text-sm whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            <History className="w-4 h-4" /> Extrato de Movimentações
          </button>
        </nav>
      </div>

      {/* ÁREA DE CONTEÚDO (RENDERIZAÇÃO CONDICIONAL) */}
      <div
        id="resources-tabpanel"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 rounded-md border border-border bg-card shadow-sm min-h-[400px] p-4"
      >
        {activeTab === "catalog" && (
          <div className="flex flex-col items-center justify-start h-full w-full">
            <ResourceCatalog
              refreshKey={refreshKey}
              hasWriteAccess={hasWriteAccess}
              onOpenCorrectionEntry={handleOpenCorrectionEntry}
              onGlobalRefresh={triggerRefresh}
            />
          </div>
        )}

        {activeTab === "requests" && (
          <PendingRequests
            refreshKey={refreshKey}
            onActionComplete={triggerRefresh}
          />
        )}

        {activeTab === "history" && (
          <div className="flex flex-col items-center justify-start h-full w-full">
            <TransactionHistory
              refreshKey={refreshKey}
              hasWriteAccess={hasWriteAccess}
              onOpenCorrectionEntry={handleOpenCorrectionEntry}
              onActionComplete={triggerRefresh}
            />
          </div>
        )}
      </div>

      {orgId && (
        <>
          <ManageWarehouseTeamDrawer
            isOpen={isTeamDrawerOpen}
            onClose={() => setIsTeamDrawerOpen(false)}
            orgId={orgId}
            currentAssignedMembers={warehouseTeam}
            orgRole={orgRole}
            onSuccess={() => {
              fetchTeam();
              triggerRefresh();
            }}
          />
          <CreateResourceModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            orgId={orgId}
            orgRole={orgRole}
            onSuccess={triggerRefresh}
          />
          <AddStockModal
            isOpen={isAddStockModalOpen}
            onClose={handleCloseAddStockModal}
            orgId={orgId}
            orgRole={orgRole}
            onSuccess={triggerRefresh}
            initialData={stockModalInitialData}
          />
          <AllocateDirectlyModal
            isOpen={isAllocateModalOpen}
            onClose={() => setIsAllocateModalOpen(false)}
            orgId={orgId}
            orgRole={orgRole}
            onSuccess={triggerRefresh}
          />
        </>
      )}
    </div>
  );
}
