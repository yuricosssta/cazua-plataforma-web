//src/app/(main)/dashboard/resources/page.tsx
"use client";

import React, { useState } from "react";
import { Package, ClipboardList, History, Plus, ArrowDownToLine } from "lucide-react";
import { ResourceCatalog } from "@/components/resources/ResourceCatalog";
import { CreateResourceModal } from "@/components/resources/CreateResourceModal";
import { AddStockModal } from "@/components/resources/AddStockModal";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { TransactionHistory } from "@/components/resources/TransactionHistory";
import { PendingRequests } from "@/components/resources/PendingRequests";
// Importaremos os subcomponentes aqui no futuro:
// import { ResourceCatalog } from "@/components/resources/ResourceCatalog";
// import { PendingRequests } from "@/components/resources/PendingRequests";
// import { TransactionHistory } from "@/components/resources/TransactionHistory";

type TabType = "catalog" | "requests" | "history";

export default function ResourcesPage() {
    const [activeTab, setActiveTab] = useState<TabType>("catalog");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const currentOrg = useSelector(selectCurrentOrg);
    const orgId = typeof currentOrg?.organizationId === "object"
        ? (currentOrg.organizationId as any)._id
        : currentOrg?.organizationId;

    const triggerRefresh = () => setRefreshKey(prev => prev + 1);

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

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setIsAddStockModalOpen(true)}
                        className="flex-1 sm:flex-none bg-card border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-muted transition-colors flex items-center justify-center gap-2 font-medium text-sm h-10">
                        <ArrowDownToLine className="w-4 h-4" />
                        Entrada de Estoque
                    </button>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex-1 sm:flex-none bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium text-sm h-10">
                        <Plus className="w-4 h-4" />
                        Novo Recurso
                    </button>
                </div>
            </div>

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
                        <Package className="w-4 h-4" />
                        Saldo de Recursos
                    </button>

                    <button
                        onClick={() => setActiveTab("requests")}
                        className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "requests"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                            }`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Fila de Requisições
                        {/* Badge de notificação mockada - depois ligaremos ao Back-end */}
                        {/* <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                            3
                        </span> */}
                    </button>

                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "history"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                            }`}
                    >
                        <History className="w-4 h-4" />
                        Extrato de Movimentações
                    </button>
                </nav>
            </div>

            {/* ÁREA DE CONTEÚDO (RENDERIZAÇÃO CONDICIONAL) */}
            <div className="flex-1 bg-card border border-border rounded-sm shadow-sm min-h-[400px] p-6">
                {activeTab === "catalog" && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
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
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                        <TransactionHistory refreshKey={refreshKey} />
                    </div>
                )}
            </div>
            {orgId && (
                <>
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
                </>
            )}
        </div>
    );
}