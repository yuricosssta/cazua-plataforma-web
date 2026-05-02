//src/components/resources/TransactionHistory.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { resourceService, ResourceTransaction } from "@/lib/services/resourceService";
import { ArrowDownLeft, ArrowUpRight, RefreshCcw, Ban, AlertCircle, History } from "lucide-react";

interface TransactionHistoryProps {
  refreshKey?: number;
}

export function TransactionHistory({ refreshKey = 0 }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentOrg = useSelector(selectCurrentOrg);
  const orgId = typeof currentOrg?.organizationId === "object"
    ? (currentOrg.organizationId as any)._id
    : currentOrg?.organizationId;

  useEffect(() => {
    async function fetchHistory() {
      if (!orgId) return;
      try {
        setIsLoading(true);
        // Esta é a nova função do BFF que vamos adicionar no Passo 2
        const data = await resourceService.listTransactions(orgId);
        setTransactions(data);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
        setError("Não foi possível carregar o livro razão.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [orgId, refreshKey]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // Renderiza o ícone e a cor baseada no tipo de movimentação
  const getTransactionBadge = (type: string, isCanceled: boolean) => {
    if (isCanceled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
          <Ban className="w-3.5 h-3.5" /> Estornado
        </span>
      );
    }

    switch (type) {
      case "ENTRY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Entrada
          </span>
        );
      case "ALLOCATION":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium border border-orange-200">
            <ArrowUpRight className="w-3.5 h-3.5" /> Saída (Obra)
          </span>
        );
      case "RETURN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
            <RefreshCcw className="w-3.5 h-3.5" /> Devolução
          </span>
        );
      default:
        return <span className="text-muted-foreground text-xs">{type}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Carregando livro razão...</p>
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

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3">
        <History className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium">Nenhuma movimentação registrada.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 font-semibold text-muted-foreground">Data / Hora</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground">Movimentação</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground">Recurso</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground">Qtd.</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Custo Total</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground">Destino / Origem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((tx) => (
            <tr key={tx._id} className={`hover:bg-muted/10 transition-colors group ${tx.isCanceled ? 'opacity-60 bg-muted/5' : ''}`}>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatDate(tx.createdAt)}
              </td>
              <td className="px-4 py-3">
                {getTransactionBadge(tx.type, tx.isCanceled)}
              </td>
              <td className={`px-4 py-3 font-medium ${tx.isCanceled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {tx.resourceId?.name || "Recurso Excluído"} 
                <span className="text-xs text-muted-foreground font-normal ml-1">({tx.resourceId?.unit})</span>
              </td>
              <td className="px-4 py-3 font-medium">
                {tx.quantity}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCurrency(tx.totalCost)}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {tx.projectId ? (
                  <span className="font-medium text-foreground">Obra: {tx.projectId.title}</span>
                ) : (
                  <span>{tx.origin || "Estoque Central"}</span>
                )}
                {tx.status === 'PENDING' && <span className="ml-2 text-orange-500 font-medium">(Pendente)</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}