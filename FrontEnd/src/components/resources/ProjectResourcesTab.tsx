//src/components/resources/ProjectResourcesTab.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { fetchProjectStatement } from "@/lib/redux/slices/resourcesSlice";
import { resourceService } from "@/lib/services/resourceService";
import { RequestResourceModal } from "./RequestResourceModal";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
// import { ProjectCostSummary } from "./ProjectCostSummary";
import { Plus, Minus, Box, Loader2, AlertCircle } from "lucide-react";
import { ReturnResourceModal } from "./ReturnResourceModal";

interface ProjectResourcesTabProps {
  orgId: string;
  projectId: string;
  hasPermission: boolean;
}

export function ProjectResourcesTab({ orgId, projectId, hasPermission }: ProjectResourcesTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { statement, loading: statementLoading, error: statementError } = useSelector((state: RootState) => state.resources);
  const currentOrg = useSelector(selectCurrentOrg);
  const orgRole = currentOrg?.role;

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!orgId || !projectId) return;

    // Busca as transações para a tabela
    try {
      setIsLoading(true);
      const allData = await resourceService.listTransactions(orgId);
      const projectData = allData.filter((tx: any) => tx.projectId?._id === projectId || tx.projectId === projectId);
      setTransactions(projectData);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar movimentações.");
    } finally {
      setIsLoading(false);
    }

    // Busca o extrato do projeto para popular o dropdown de devolução
    dispatch(fetchProjectStatement({ orgId, projectId }));
  }, [orgId, projectId, dispatch]);

  const allocatedResources = statement?.items?.map(item => ({
    id: item.resourceId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit
  })) || [];

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Aguardando',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    CANCELED: 'Estornado',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-0.5 rounded-md bg-primary-bg text-primary text-xs font-bold border border-primary-border">Aguardando</span>;
      case 'APPROVED': return <span className="px-2 py-0.5 rounded-md bg-st-completed-bg text-st-completed text-xs font-bold border border-st-completed-border">Aprovado</span>;
      case 'REJECTED': return <span className="px-2 py-0.5 rounded-md bg-st-critical-bg text-st-critical text-xs font-bold border border-st-critical-border">Rejeitado</span>;
      case 'CANCELED': return <span className="px-2 py-0.5 rounded-md bg-st-critical text-background text-xs font-bold">Estornado</span>;
      default: return <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-bold">{STATUS_LABELS[status] || status}</span>;
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Componente de Resumo Financeiro */}
      {statementLoading ? (
        <div className="flex justify-center py-6 border border-border rounded-md bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : statementError ? (
        <div className="flex items-center gap-2 flex-wrap text-st-critical bg-st-critical-bg border border-st-critical-border rounded-md p-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" /> {statementError || "Erro ao carregar o extrato do projeto."}
        </div>
      ) : null}

      {/* Cabeçalho e Tabela de Movimentações */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">Movimentação de Recursos</h2>
          <p className="text-sm text-muted-foreground">Histórico de requisições de insumos, mão de obra e verbas alocadas neste projeto.</p>
        </div>

        <button
          disabled={!hasPermission}
          onClick={() => setIsReturnModalOpen(true)}
          className="flex items-center gap-2 px-3 min-h-11 bg-secondary text-secondary-foreground rounded-md shadow-sm hover:bg-secondary/80 border border-border disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold w-full sm:w-auto justify-center"
        >
          <Minus className="w-4 h-4" /> Devolver Recurso
        </button>

        <button
          disabled={!hasPermission}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 min-h-11 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Solicitar Recurso
        </button>
      </div>

      <div className="border border-border rounded-md overflow-hidden bg-card">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="flex justify-center py-10 text-st-critical gap-2 bg-st-critical-bg"><AlertCircle className="w-5 h-5 shrink-0" /> {error}</div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Box className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">Nenhum recurso movimentado ou solicitado para este projeto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Data</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Recurso</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Justificativa</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Qtd</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-right whitespace-nowrap">Custo Total</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {tx.resourceId?.name} <span className="text-xs font-normal text-muted-foreground">({tx.resourceId?.unit})</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-normal break-words min-w-[200px] max-w-[300px]">
                      {tx.origin || "Não informada"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-center">{tx.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {tx.status === 'APPROVED' ? formatCurrency(tx.totalCost) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right">{getStatusBadge(tx.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RequestResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orgId={orgId}
        projectId={projectId}
        onSuccess={fetchAllData}
      />

      <ReturnResourceModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        orgId={orgId}
        projectId={projectId}
        onSuccess={fetchAllData}
        allocatedResources={allocatedResources}
        orgRole={orgRole}
      />
    </div>
  );
}