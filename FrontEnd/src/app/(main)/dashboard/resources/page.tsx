//src/app/(main)/dashboard/resources/page.tsx
"use client";

import React, {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  Loader2,
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
import {
  selectCurrentOrg,
  selectOrgStatus,
} from "@/lib/redux/slices/organizationSlice";
import {
  resourceService,
  AddStockInitialData,
} from "@/lib/services/resourceService";

type TabType = "catalog" | "requests" | "history";

const TABS: Array<{
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "catalog", label: "Saldo de Recursos", icon: Package },
  { id: "requests", label: "Fila de Requisições", icon: ClipboardList },
  { id: "history", label: "Extrato de Movimentações", icon: History },
];

const isValidTab = (value: string | null): value is TabType =>
  value === "catalog" || value === "requests" || value === "history";

function ResourcesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<TabType>(() =>
    isValidTab(tabParam) ? tabParam : "catalog"
  );
  const lastTabParamRef = useRef<string | null>(tabParam);

  useEffect(() => {
    if (tabParam !== lastTabParamRef.current) {
      lastTabParamRef.current = tabParam;
      setActiveTab(isValidTab(tabParam) ? tabParam : "catalog");
    }
  }, [tabParam]);

  const handleSelectTab = useCallback(
    (tab: TabType) => {
      lastTabParamRef.current = tab;
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [stockModalInitialData, setStockModalInitialData] =
    useState<AddStockInitialData | null>(null);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [warehouseTeamState, setWarehouseTeamState] = useState<{
    orgId: string | null;
    members: string[];
  }>({ orgId: null, members: [] });
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [teamErrorState, setTeamErrorState] = useState<{
    orgId: string | null;
    message: string | null;
  }>({ orgId: null, message: null });

  const tabRefs = useRef<Record<TabType, HTMLButtonElement | null>>({
    catalog: null,
    requests: null,
    history: null,
  });

  const currentOrg = useSelector(selectCurrentOrg);
  const orgStatus = useSelector(selectOrgStatus);
  const user = useSelector((state: RootState) => state.auth.user);

  const orgId: string | undefined =
    currentOrg?.organizationId && typeof currentOrg.organizationId === "object"
      ? (currentOrg.organizationId as { _id?: string })._id
      : typeof currentOrg?.organizationId === "string"
        ? currentOrg.organizationId
        : undefined;

  const orgRole = currentOrg?.role || "MEMBER";
  const isAdminOrOwner = orgRole === "OWNER" || orgRole === "ADMIN";
  const currentUserId = String(
    user?.sub ||
      (user as { _id?: string } | null)?._id ||
      (user as { id?: string } | null)?.id ||
      ""
  );

  const fetchTeam = useCallback(
    async (isCancelled?: () => boolean) => {
      if (!orgId) {
        setIsLoadingTeam(false);
        return;
      }
      try {
        setIsLoadingTeam(true);
        const team = await resourceService.getWarehouseTeam(orgId);
        if (isCancelled?.()) return;
        setTeamErrorState({ orgId, message: null });
        setWarehouseTeamState({
          orgId,
          members: team.map((id) => String(id)),
        });
      } catch (error) {
        if (isCancelled?.()) return;
        console.error("Erro ao buscar equipe do almoxarifado:", error);
        setTeamErrorState({
          orgId,
          message:
            "Não foi possível verificar suas permissões do Almoxarifado Central.",
        });
      } finally {
        if (!isCancelled?.()) {
          setIsLoadingTeam(false);
        }
      }
    },
    [orgId]
  );

  useEffect(() => {
    let cancelled = false;
    fetchTeam(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchTeam]);

  const warehouseTeam =
    orgId && warehouseTeamState.orgId === orgId
      ? warehouseTeamState.members
      : [];
  const isTeamStale = Boolean(orgId) && warehouseTeamState.orgId !== orgId;
  const teamError =
    orgId && teamErrorState.orgId === orgId ? teamErrorState.message : null;
  const isAssigned = warehouseTeam.includes(currentUserId);
  const hasWriteAccess =
    Boolean(orgId) &&
    (isAdminOrOwner ||
      (!isLoadingTeam && !isTeamStale && !teamError && isAssigned));
  const isOrgResolving =
    !orgId && (orgStatus === "idle" || orgStatus === "loading");
  const isTeamLoadingOrStale = isLoadingTeam || isTeamStale;
  const isCheckingPermissions =
    isOrgResolving ||
    (!isAdminOrOwner && Boolean(orgId) && !teamError && isTeamLoadingOrStale);

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

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = TABS[nextIndex].id;
      handleSelectTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    }
  };

  return (
    <>
      <div className="flex flex-col w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-10">
        {/* CABEÇALHO E AÇÕES GLOBAIS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Almoxarifado Central
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestão de recursos, saldos de materiais e aprovação de requisições
              dos projetos.
            </p>
          </div>

          <div className="flex flex-wrap items-center sm:justify-end gap-3 w-full sm:w-auto">
            {isCheckingPermissions && (
              <div
                className="h-11 w-full sm:w-48 rounded-md bg-muted animate-pulse"
                aria-hidden="true"
              />
            )}

            {isAdminOrOwner && Boolean(orgId) && (
              <button
                type="button"
                onClick={() => setIsTeamDrawerOpen(true)}
                disabled={isTeamLoadingOrStale || Boolean(teamError)}
                aria-busy={isTeamLoadingOrStale}
                className="flex-1 sm:flex-none bg-background border border-border text-muted-foreground hover:text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors flex items-center justify-center gap-2 font-medium text-sm min-h-11 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isTeamLoadingOrStale ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
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

        {isOrgResolving && (
          <div
            role="status"
            aria-label="Carregando Almoxarifado Central"
            className="rounded-md border border-border bg-card shadow-sm min-h-64 sm:min-h-[400px] p-6 space-y-4"
          >
            <span className="sr-only">Carregando Almoxarifado Central...</span>
            <div className="h-8 w-64 max-w-full rounded-md bg-muted animate-pulse" />
            <div className="h-48 w-full rounded-md bg-muted animate-pulse" />
          </div>
        )}

        {!orgId && orgStatus === "failed" && (
          <div
            role="alert"
            className="bg-st-critical-bg border border-st-critical-border text-st-critical p-4 rounded-md flex items-center gap-3 text-sm font-medium shrink-0"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              Não foi possível carregar as organizações da sua conta. Recarregue
              a página ou tente novamente mais tarde.
            </span>
          </div>
        )}

        {!orgId && orgStatus === "succeeded" && (
          <div className="rounded-md border border-dashed border-border bg-card p-8 sm:p-12 text-center space-y-2">
            <Package className="w-10 h-10 text-muted-foreground mx-auto opacity-60" />
            <h2 className="text-base font-semibold text-foreground">
              Nenhuma organização selecionada
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Selecione ou crie uma organização para acessar o Almoxarifado
              Central.
            </p>
          </div>
        )}

        {Boolean(orgId) && (
          <>
            {teamError && (
              <div
                role="alert"
                className="bg-st-critical-bg border border-st-critical-border text-st-critical p-3 rounded-md flex flex-wrap items-center justify-between gap-3 text-sm font-medium shrink-0"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{teamError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchTeam()}
                  disabled={isLoadingTeam}
                  className="inline-flex items-center gap-2 px-3 min-h-11 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw
                    className={`w-3.5 h-3.5 ${isLoadingTeam ? "animate-spin" : ""}`}
                  />
                  Tentar novamente
                </button>
              </div>
            )}

            {!isLoadingTeam &&
              !isTeamStale &&
              !teamError &&
              !hasWriteAccess && (
                <div
                  role="status"
                  className="bg-st-execution-bg border border-st-execution-border text-st-execution p-3 rounded-md flex items-center gap-3 text-sm font-medium shrink-0"
                >
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>
                    Você está em modo de visualização. Apenas a equipe
                    autorizada do Almoxarifado Central pode registrar
                    movimentações.
                  </span>
                </div>
              )}

            {/* NAVEGAÇÃO INTERNA (TABS — NO FLUXO NORMAL, SEM FLUTUAR SOBRE O CONTEÚDO) */}
            <div className="border-b border-border pb-2 lg:pb-0 shrink-0">
              <div
                className="flex flex-wrap gap-2 lg:gap-6 w-full"
                role="tablist"
                aria-label="Seções do Almoxarifado Central"
              >
                {TABS.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        tabRefs.current[tab.id] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`tab-${tab.id}`}
                      tabIndex={isActive ? 0 : -1}
                      aria-selected={isActive}
                      aria-controls="resources-tabpanel"
                      onClick={() => handleSelectTab(tab.id)}
                      onKeyDown={(e) => handleTabKeyDown(e, index)}
                      className={`relative flex items-center justify-center lg:justify-start gap-2 min-h-11 px-3 lg:px-1 py-2 lg:py-2.5 rounded-md border lg:border-0 font-medium text-sm text-center whitespace-nowrap flex-1 lg:flex-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isActive
                          ? "bg-primary-bg text-primary border-primary-border lg:bg-transparent"
                          : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted lg:bg-transparent lg:hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="hidden lg:block absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-md"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ÁREA DE CONTEÚDO (RENDERIZAÇÃO CONDICIONAL) */}
            <div
              id="resources-tabpanel"
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={`tab-${activeTab}`}
              className="flex-1 w-full min-w-0 rounded-md border border-border bg-card shadow-sm min-h-64 sm:min-h-[400px] p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  hasWriteAccess={hasWriteAccess}
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
          </>
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
            onSuccess={async () => {
              await fetchTeam();
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
    </>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Carregando Almoxarifado Central"
          className="flex flex-col w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-10"
        >
          <span className="sr-only">Carregando Almoxarifado Central...</span>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
            <div className="space-y-2">
              <div className="h-8 w-56 rounded-md bg-muted animate-pulse" />
              <div className="h-4 w-80 max-w-full rounded-md bg-muted animate-pulse" />
            </div>
            <div className="h-11 w-full sm:w-48 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="rounded-md border border-border bg-card shadow-sm min-h-64 sm:min-h-[400px] p-6 space-y-4">
            <div className="h-8 w-64 max-w-full rounded-md bg-muted animate-pulse" />
            <div className="h-48 w-full rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      }
    >
      <ResourcesPageContent />
    </Suspense>
  );
}
