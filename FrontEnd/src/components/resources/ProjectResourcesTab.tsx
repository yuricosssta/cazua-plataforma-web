//src/components/resources/ProjectResourcesTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { resourceService } from "@/lib/services/resourceService";
import { RequestResourceModal } from "./RequestResourceModal";
import { Plus, Box, Loader2, AlertCircle } from "lucide-react";

interface ProjectResourcesTabProps {
  orgId: string;
  projectId: string;
  hasPermission: boolean;
}

export function ProjectResourcesTab({ orgId, projectId, hasPermission }: ProjectResourcesTabProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const allData = await resourceService.listTransactions(orgId);
      // Filtra apenas as movimentações deste projeto
      const projectData = allData.filter((tx: any) => tx.projectId?._id === projectId || tx.projectId === projectId);
      setTransactions(projectData);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar movimentações.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId && projectId) fetchTransactions();
  }, [orgId, projectId]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-bold">Aguardando</span>;
      case 'APPROVED': return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">Aprovado</span>;
      case 'REJECTED': return <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-bold">Rejeitado</span>;
      default: return <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Movimentação de Recursos</h2>
          <p className="text-sm text-muted-foreground">Histórico de materiais, mão de obra e verbas alocadas neste projeto.</p>
        </div>
        <button
          disabled={!hasPermission}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Solicitar Recurso
        </button>
      </div>

      <div className="border border-border rounded-md overflow-hidden bg-card">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="flex justify-center py-10 text-destructive gap-2"><AlertCircle className="w-5 h-5"/> {error}</div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Box className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">Nenhum recurso movimentado ou solicitado para este projeto.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-3 font-semibold text-muted-foreground">Data</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Recurso</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Qtd</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-muted/10">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {tx.resourceId?.name} <span className="text-xs font-normal text-muted-foreground">({tx.resourceId?.unit})</span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{tx.quantity}</td>
                  <td className="px-4 py-3 text-right">{getStatusBadge(tx.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RequestResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orgId={orgId}
        projectId={projectId}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}