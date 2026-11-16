//src/components/resources/TransactionHistory.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import {
  resourceService,
  ResourceTransaction,
  ResourceType,
  AddStockInitialData,
} from "@/lib/services/resourceService";
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCcw,
  Ban,
  AlertCircle,
  History,
  Filter,
  User,
  RotateCcw,
  FileText,
  Loader2,
} from "lucide-react";
import { CancelEntryModal } from "./CancelEntryModal";
import {
  formatCurrencyBR,
  formatQuantityBR,
  formatDateTimeBR,
  getLocalDateISO,
  getUserDisplayName,
} from "./resourceUtils";

interface TransactionHistoryProps {
  refreshKey?: number;
  hasWriteAccess?: boolean;
  onOpenCorrectionEntry?: (initialData: AddStockInitialData) => void;
  onActionComplete?: () => void;
}

export function TransactionHistory({
  refreshKey = 0,
  hasWriteAccess = false,
  onOpenCorrectionEntry,
  onActionComplete,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<ResourceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [internalRefresh, setInternalRefresh] = useState(0);
  const [cancelingTx, setCancelingTx] = useState<ResourceTransaction | null>(
    null
  );

  const today = useMemo(() => getLocalDateISO(new Date()), []);
  const yearStart = useMemo(() => {
    const d = new Date();
    return getLocalDateISO(new Date(d.getFullYear(), 0, 1));
  }, []);

  const [startDate, setStartDate] = useState(yearStart);
  const [endDate, setEndDate] = useState(today);
  const [appliedStartDate, setAppliedStartDate] = useState(yearStart);
  const [appliedEndDate, setAppliedEndDate] = useState(today);

  const hasInputChanges = useMemo(
    () => startDate !== appliedStartDate || endDate !== appliedEndDate,
    [startDate, endDate, appliedStartDate, appliedEndDate]
  );
  const hasAppliedFilter = useMemo(
    () => appliedStartDate !== yearStart || appliedEndDate !== today,
    [appliedStartDate, appliedEndDate, yearStart, today]
  );

  const handleApplyFilter = () => {
    if (!startDate || !endDate) {
      setFilterError("Informe a data inicial e a data final.");
      return;
    }
    if (startDate > endDate) {
      setFilterError(
        "A data inicial não pode ser posterior à data final."
      );
      return;
    }
    setFilterError(null);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const handleClearFilter = () => {
    setFilterError(null);
    setStartDate(yearStart);
    setEndDate(today);
    setAppliedStartDate(yearStart);
    setAppliedEndDate(today);
  };

  const currentOrg = useSelector(selectCurrentOrg);
  const orgId =
    typeof currentOrg?.organizationId === "object"
      ? (currentOrg.organizationId as any)._id
      : currentOrg?.organizationId;
  const orgRole = currentOrg?.role || "MEMBER";

  useEffect(() => {
    async function fetchHistory() {
      if (!orgId) return;
      try {
        setIsLoading(true);
        const data = await resourceService.listTransactions(
          orgId,
          appliedStartDate,
          appliedEndDate
        );
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
  }, [orgId, refreshKey, internalRefresh, appliedStartDate, appliedEndDate]);

  const { entriesTotal, allocationsNetTotal } = useMemo(() => {
    return transactions
      .filter((tx) => !tx.isCanceled)
      .reduce(
        (acc, tx) => {
          const value = Number(tx.totalCost);
          if (!Number.isFinite(value)) return acc;
          if (tx.type === "ENTRY") {
            acc.entriesTotal += value;
          } else if (tx.type === "ALLOCATION") {
            acc.allocationsNetTotal += value;
          } else if (tx.type === "RETURN") {
            acc.allocationsNetTotal -= value;
          }
          return acc;
        },
        { entriesTotal: 0, allocationsNetTotal: 0 }
      );
  }, [transactions]);

  const getTransactionBadge = (type: string, isCanceled: boolean) => {
    if (isCanceled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-st-critical-bg text-st-critical border border-st-critical-border text-xs font-medium">
          <Ban className="w-3.5 h-3.5" /> Estornado
        </span>
      );
    }

    switch (type) {
      case "ENTRY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-st-completed-bg text-st-completed text-xs font-medium border border-st-completed-border">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Entrada
          </span>
        );
      case "ALLOCATION":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-bg text-primary text-xs font-medium border border-primary-border">
            <ArrowUpRight className="w-3.5 h-3.5" /> Saída para Obra
          </span>
        );
      case "RETURN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-st-planning-bg text-st-planning text-xs font-medium border border-st-planning-border">
            <RefreshCcw className="w-3.5 h-3.5" /> Devolução
          </span>
        );
      default:
        return <span className="text-muted-foreground text-xs">{type}</span>;
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Barra de Filtros e Resumo (Sempre Montada) */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleApplyFilter();
        }}
        className="p-4 rounded-md bg-muted/20 border border-border space-y-3"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="history-start-date"
              className="text-xs font-medium text-muted-foreground"
            >
              Data Inicial
            </label>
            <input
              id="history-start-date"
              type="date"
              value={startDate}
              max={endDate}
              disabled={isLoading}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (filterError) setFilterError(null);
              }}
              className="px-3 min-h-11 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="history-end-date"
              className="text-xs font-medium text-muted-foreground"
            >
              Data Final
            </label>
            <input
              id="history-end-date"
              type="date"
              value={endDate}
              min={startDate}
              disabled={isLoading}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (filterError) setFilterError(null);
              }}
              className="px-3 min-h-11 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!hasInputChanges || isLoading}
            className="px-4 min-h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Filter className="w-4 h-4" />
            )}
            Filtrar
          </button>

          {hasAppliedFilter && (
            <button
              type="button"
              onClick={handleClearFilter}
              disabled={isLoading}
              className="px-4 min-h-11 rounded-md border border-border bg-background text-foreground text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Limpar filtro
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <div className="flex items-center gap-2 px-3 min-h-11 rounded-md bg-st-completed-bg border border-st-completed-border">
              <ArrowDownLeft className="w-4 h-4 text-st-completed shrink-0" />
              <span className="text-xs font-semibold text-st-completed">
                Entradas:{" "}
                {isLoading ? "Calculando..." : formatCurrencyBR(entriesTotal)}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 min-h-11 rounded-md bg-primary-bg border border-primary-border">
              <ArrowUpRight className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-primary">
                Saídas líquidas (obras):{" "}
                {isLoading
                  ? "Calculando..."
                  : formatCurrencyBR(allocationsNetTotal)}
              </span>
            </div>
          </div>
        </div>

        {filterError && (
          <div className="text-xs text-st-critical flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{filterError}</span>
          </div>
        )}
      </form>

      {/* Área de Conteúdo / Tabela */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 w-full border border-border rounded-md bg-background">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Carregando histórico...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 text-st-critical space-y-3 w-full border border-st-critical-border rounded-md bg-st-critical-bg/40 px-4">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-medium text-center">{error}</p>
          <button
            type="button"
            onClick={() => setInternalRefresh((prev) => prev + 1)}
            className="inline-flex items-center gap-2 px-4 min-h-11 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3 border border-border rounded-md bg-background">
          <History className="w-12 h-12 opacity-20" />
          <p className="text-sm font-medium">
            Nenhuma movimentação registrada no período selecionado.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto border border-border rounded-md bg-background">
          <table className="w-full text-left text-sm border-collapse min-w-[980px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
                  Data / Hora &amp; Autor
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">
                  Movimentação
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">
                  Recurso
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-right">
                  Qtd.
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-right">
                  Custo Total
                </th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">
                  Origem / Destino &amp; Observações
                </th>
                {hasWriteAccess && (
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-center">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => {
                const populatedRes =
                  typeof tx.resourceId === "object" ? tx.resourceId : null;
                const populatedProj =
                  typeof tx.projectId === "object" ? tx.projectId : null;
                const isCapital =
                  populatedRes?.type === ResourceType.CAPITAL;
                const canCancelEntry =
                  hasWriteAccess && tx.type === "ENTRY" && !tx.isCanceled;

                return (
                  <tr
                    key={tx._id}
                    className={`hover:bg-muted/10 transition-colors group align-top ${
                      tx.isCanceled ? "bg-muted/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap space-y-1">
                      <div className="text-xs font-medium text-foreground">
                        {formatDateTimeBR(tx.createdAt)}
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>{getUserDisplayName(tx.authorId)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {getTransactionBadge(tx.type, tx.isCanceled)}
                    </td>

                    <td
                      className={`px-4 py-3 font-medium ${
                        tx.isCanceled
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {populatedRes?.name || "Recurso Excluído"}{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({populatedRes?.unit || "-"})
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-right whitespace-nowrap">
                      {isCapital
                        ? formatCurrencyBR(tx.quantity)
                        : formatQuantityBR(tx.quantity)}
                    </td>

                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      {formatCurrencyBR(tx.totalCost)}
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground min-w-[260px] max-w-[380px] space-y-1.5">
                      <div>
                        {populatedProj ? (
                          <span className="font-medium text-foreground">
                            Destino: {populatedProj.title}
                          </span>
                        ) : (
                          <span className="font-medium text-foreground">
                            {tx.origin || "Estoque Central"}
                          </span>
                        )}
                        {tx.status === "PENDING" && (
                          <span className="ml-2 text-primary font-medium">
                            (Pendente)
                          </span>
                        )}
                        {populatedProj && tx.origin && (
                          <span className="block text-muted-foreground mt-0.5">
                            Origem/Justificativa: {tx.origin}
                          </span>
                        )}
                      </div>

                      {tx.notes && (
                        <div className="flex items-start gap-1 text-foreground/90">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="break-words">Obs: {tx.notes}</span>
                        </div>
                      )}

                      {tx.isCanceled && (
                        <div className="p-2 rounded-md bg-st-critical-bg/60 border border-st-critical-border text-st-critical space-y-0.5">
                          <div className="font-semibold">
                            Estornado por {getUserDisplayName(tx.canceledBy)}{" "}
                            em {formatDateTimeBR(tx.canceledAt || tx.updatedAt)}
                          </div>
                          <div className="text-foreground break-words">
                            Motivo: {tx.cancelReason || "Não informado"}
                          </div>
                        </div>
                      )}
                    </td>

                    {hasWriteAccess && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {canCancelEntry ? (
                          <button
                            type="button"
                            onClick={() => setCancelingTx(tx)}
                            className="inline-flex items-center gap-1.5 px-3 min-h-11 text-xs font-medium text-st-critical bg-st-critical-bg border border-st-critical-border rounded-md hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Corrigir / Estornar
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {orgId && (
        <CancelEntryModal
          isOpen={!!cancelingTx}
          onClose={() => setCancelingTx(null)}
          orgId={orgId}
          orgRole={orgRole}
          transaction={cancelingTx}
          onCanceled={() => {
            setInternalRefresh((prev) => prev + 1);
            onActionComplete?.();
          }}
          onCancelAndRecreate={(initialData) => {
            onOpenCorrectionEntry?.(initialData);
          }}
        />
      )}
    </div>
  );
}
