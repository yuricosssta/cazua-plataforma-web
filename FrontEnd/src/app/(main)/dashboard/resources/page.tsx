//src/app/(main)/dashboard/resources/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Package, ClipboardList, History, Plus, ArrowDownToLine, Send, Users, ShieldAlert } from "lucide-react";
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
import { resourceService } from "@/lib/services/resourceService";

type TabType = "catalog" | "requests" | "history";

export default function ResourcesPage() {
    const [activeTab, setActiveTab] = useState<TabType>("catalog");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
    const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);
    
    const [refreshKey, setRefreshKey] = useState(0);
    const [warehouseTeam, setWarehouseTeam] = useState<string[]>([]);

    const currentOrg = useSelector(selectCurrentOrg);
    const user = useSelector((state: RootState) => state.auth.user);
    
    const orgId = typeof currentOrg?.organizationId === "object"
        ? (currentOrg.organizationId as any)._id
        : currentOrg?.organizationId;

    const orgRole = currentOrg?.role || 'MEMBER';
    const isAdminOrOwner = orgRole === 'OWNER' || orgRole === 'ADMIN';
    const currentUserId = String(user?.sub || (user as any)?._id || (user as any)?.id || "");

    const fetchTeam = async () => {
        if (!orgId) return;
        try {
            const team = await resourceService.getWarehouseTeam(orgId);
            setWarehouseTeam(team.map(id => String(id)));
        } catch (error) {
            console.error("Erro ao buscar equipe do almoxarifado:", error);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, [orgId, refreshKey]);

    const isAssigned = warehouseTeam.includes(currentUserId);
    const hasWriteAccess = isAdminOrOwner || isAssigned;

    const triggerRefresh = () => {
        setRefreshKey(prev => prev + 1);
        fetchTeam();
    };

    return (
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-6 pb-10">

            {/* CABEÇALHO E AÇÕES GLOBAIS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Almoxarifado Central</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestão de recursos, saldos de materiais e aprovação de requisições dos projetos.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {isAdminOrOwner && (
                        <button
                            onClick={() => setIsTeamDrawerOpen(true)}
                            className="flex-1 sm:flex-none bg-muted border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-accent transition-colors flex items-center justify-center gap-2 font-semibold text-sm h-10"
                        >
                            <Users className="w-4 h-4" />
                            Equipe
                        </button>
                    )}

                    {hasWriteAccess && (
                        <>
                            <button
                                onClick={() => setIsAddStockModalOpen(true)}
                                className="flex-1 sm:flex-none bg-card border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-muted transition-colors flex items-center justify-center gap-2 font-medium text-sm h-10"
                            >
                                <ArrowDownToLine className="w-4 h-4" /> Entrada de Recurso
                            </button>

                            <button
                                onClick={() => setIsAllocateModalOpen(true)}
                                className="flex-1 sm:flex-none bg-card border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-muted transition-colors flex items-center justify-center gap-2 font-medium text-sm h-10"
                            >
                                <Send className="w-4 h-4" /> Saída de Recurso
                            </button>

                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex-1 sm:flex-none bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium text-sm h-10"
                            >
                                <Plus className="w-4 h-4" /> Novo Recurso
                            </button>
                        </>
                    )}
                </div>
            </div>

            {!hasWriteAccess && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md flex items-center gap-3 text-sm font-medium">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    Você está em modo de visualização. Apenas a equipe autorizada do Almoxarifado Central pode registrar movimentações.
                </div>
            )}

            {/* NAVEGAÇÃO INTERNA (TABS) */}
            <div className="border-b border-border">
                <nav className="flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab("catalog")}
                        className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "catalog"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                            }`}
                    >
                        <Package className="w-4 h-4" /> Saldo de Recursos
                    </button>

                    <button
                        onClick={() => setActiveTab("requests")}
                        className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "requests"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                            }`}
                    >
                        <ClipboardList className="w-4 h-4" /> Fila de Requisições
                    </button>

                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "history"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                            }`}
                    >
                        <History className="w-4 h-4" /> Extrato de Movimentações
                    </button>
                </nav>
            </div>

            {/* ÁREA DE CONTEÚDO (RENDERIZAÇÃO CONDICIONAL) */}
            <div className="flex-1 bg-card shadow-sm min-h-[400px] p-1">
                {activeTab === "catalog" && (
                    <div className="flex flex-col items-center justify-start h-full text-muted-foreground opacity-60">
                        <ResourceCatalog refreshKey={refreshKey} />
                    </div>
                )}

                {activeTab === "requests" && (
                    <PendingRequests
                        refreshKey={refreshKey}
                        onActionComplete={triggerRefresh}
                    />
                )}

                {activeTab === "history" && (
                    <div className="flex flex-col items-center justify-start h-full text-muted-foreground opacity-60">
                        <TransactionHistory refreshKey={refreshKey} />
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
                        onSuccess={triggerRefresh}
                    />
                    <CreateResourceModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        orgId={orgId}
                        onSuccess={triggerRefresh}
                    />
                    <AddStockModal
                        isOpen={isAddStockModalOpen}
                        onClose={() => setIsAddStockModalOpen(false)}
                        orgId={orgId}
                        onSuccess={triggerRefresh}
                    />
                    <AllocateDirectlyModal
                        isOpen={isAllocateModalOpen}
                        onClose={() => setIsAllocateModalOpen(false)}
                        orgId={orgId}
                        onSuccess={triggerRefresh}
                    />
                </>
            )}
        </div>
    );
}