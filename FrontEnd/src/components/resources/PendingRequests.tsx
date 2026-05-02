//src/components/resources/PendingRequests.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { resourceService, ResourceTransaction } from "@/lib/services/resourceService";
import { CheckCircle, XCircle, AlertCircle, ClipboardList, Loader2 } from "lucide-react";

interface PendingRequestsProps {
  refreshKey?: number;
  onActionComplete: () => void;
}

export function PendingRequests({ refreshKey = 0, onActionComplete }: PendingRequestsProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para os fluxos de Aprovação/Rejeição
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [actionData, setActionData] = useState({ quantity: 0, reason: "" });

  const currentOrg = useSelector(selectCurrentOrg);
  const orgId = typeof currentOrg?.organizationId === "object"
    ? (currentOrg.organizationId as any)._id
    : currentOrg?.organizationId;

  useEffect(() => {
    async function fetchPendingRequests() {
      if (!orgId) return;
      try {
        setIsLoading(true);
        const data = await resourceService.listTransactions(orgId);
        // Filtra apenas as transações pendentes
        const pendingData = data.filter((tx) => tx.status === "PENDING" && !tx.isCanceled);
        setRequests(pendingData);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar requisições:", err);
        setError("Não foi possível carregar a fila de requisições.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPendingRequests();
  }, [orgId, refreshKey]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const handleOpenAction = (id: string, type: "APPROVE" | "REJECT", defaultQuantity: number = 0) => {
    setProcessingId(id);
    setActionType(type);
    setActionData({ quantity: defaultQuantity, reason: "" });
  };

  const handleCancelAction = () => {
    setProcessingId(null);
    setActionType(null);
  };

  const handleConfirmAction = async () => {
    if (!orgId || !processingId || !actionType) return;

    try {
      if (actionType === "APPROVE") {
        if (actionData.quantity <= 0) throw new Error("Quantidade deve ser maior que zero.");
        await resourceService.approveRequest(orgId, processingId, { approvedQuantity: actionData.quantity });
      } else {
        if (actionData.reason.trim().length < 5) throw new Error("Informe um motivo válido (mín. 5 caracteres).");
        await resourceService.rejectRequest(orgId, processingId, { reason: actionData.reason });
      }

      handleCancelAction();
      onActionComplete(); // Aciona o gatilho para recarregar a tabela e abas globais
    } catch (err: any) {
      alert(err.message || err.response?.data?.message || "Erro ao processar a requisição.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Buscando requisições pendentes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive space-y-2">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3">
        <ClipboardList className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium">Nenhuma requisição pendente no momento.</p>
        <p className="text-xs opacity-70">A fila do almoxarifado está zerada.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-10">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 font-semibold text-muted-foreground">Data da Solicitação</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground">Projeto / Destino</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground">Recurso Requisitado</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Qtd. Solicitada</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {requests.map((req) => (
            <React.Fragment key={req._id}>
              <tr className="hover:bg-muted/5 transition-colors">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(req.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {req.projectId?.title || "Projeto não identificado"}
                </td>
                <td className="px-4 py-3 font-medium">
                  {req.resourceId?.name} <span className="text-xs font-normal text-muted-foreground">({req.resourceId?.unit})</span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-orange-600">
                  {req.quantity}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => handleOpenAction(req._id, "REJECT")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md hover:bg-destructive/20 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Rejeitar
                  </button>
                  <button
                    onClick={() => handleOpenAction(req._id, "APPROVE", req.quantity)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Analisar
                  </button>
                </td>
              </tr>

              {/* Linha Expansível para Ação (Aprovar ou Rejeitar) */}
              {processingId === req._id && (
                <tr className="bg-muted/10 border-b border-border">
                  <td colSpan={5} className="px-4 py-4">
                    <div className="flex flex-col sm:flex-row items-end gap-4 p-4 border border-border rounded-md bg-card shadow-sm">
                      
                      {actionType === "APPROVE" ? (
                        <div className="flex-1 w-full space-y-1.5">
                          <label className="text-sm font-medium text-foreground">Quantidade a Liberar</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={actionData.quantity || ""}
                            onChange={(e) => setActionData({ ...actionData, quantity: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-sm border border-input rounded-md focus:ring-2 focus:ring-emerald-500/50"
                          />
                          <p className="text-xs text-muted-foreground">Ajuste o valor caso não haja saldo suficiente para atender toda a RM.</p>
                        </div>
                      ) : (
                        <div className="flex-1 w-full space-y-1.5">
                          <label className="text-sm font-medium text-foreground">Motivo da Rejeição</label>
                          <input
                            type="text"
                            value={actionData.reason}
                            onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                            placeholder="Ex: Material em falta no estoque..."
                            className="w-full px-3 py-2 text-sm border border-input rounded-md focus:ring-2 focus:ring-destructive/50"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelAction}
                          className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleConfirmAction}
                          className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-colors ${
                            actionType === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"
                          }`}
                        >
                          Confirmar {actionType === "APPROVE" ? "Liberação" : "Rejeição"}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}