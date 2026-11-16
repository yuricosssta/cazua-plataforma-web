//src/components/resources/CancelEntryModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  resourceService,
  ResourceTransaction,
  ResourceType,
  AddStockInitialData,
} from "@/lib/services/resourceService";
import {
  formatCurrencyBR,
  formatQuantityBR,
  formatDateTimeBR,
  getUserDisplayName,
  getUserDisplayEmail,
  getPopulatedResourceId,
} from "./resourceUtils";

export interface CancelEntryResourceInfo {
  _id: string;
  name: string;
  unit: string;
  type?: ResourceType;
  currentStock?: number;
}

interface CancelEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgRole: string;
  transaction: ResourceTransaction | null;
  resourceInfo?: CancelEntryResourceInfo | null;
  onCanceled: () => void;
  onCancelAndRecreate: (initialData: AddStockInitialData) => void;
}

export function CancelEntryModal({
  isOpen,
  onClose,
  orgId,
  orgRole,
  transaction,
  resourceInfo = null,
  onCanceled,
  onCancelAndRecreate,
}: CancelEntryModalProps) {
  const [reason, setReason] = useState("");
  const [recreateAfterCancel, setRecreateAfterCancel] = useState(false);
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setRecreateAfterCancel(false);
      setShowExtraDetails(false);
      setConfirmDiscard(false);
      setReasonError(null);
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, transaction?._id]);

  const requestClose = () => {
    if (isSubmitting) return;
    if (reason.trim().length > 0 && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        if (confirmDiscard) return;
        if (reason.trim().length > 0) {
          setConfirmDiscard(true);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, reason, confirmDiscard, onClose]);

  if (!isOpen || !transaction) return null;

  const populatedRes =
    typeof transaction.resourceId === "object" ? transaction.resourceId : null;

  const resolvedResourceId =
    resourceInfo?._id || getPopulatedResourceId(transaction.resourceId);
  const resolvedName = resourceInfo?.name || populatedRes?.name || "Recurso";
  const resolvedUnit = resourceInfo?.unit || populatedRes?.unit || "un";
  const resolvedType = resourceInfo?.type ?? populatedRes?.type;
  const resolvedCurrentStock =
    resourceInfo?.currentStock ?? populatedRes?.currentStock;

  const isLabor = resolvedType === ResourceType.LABOR;
  const isCapital = resolvedType === ResourceType.CAPITAL;
  const projectedStock =
    resolvedCurrentStock !== undefined
      ? Number((resolvedCurrentStock - transaction.quantity).toFixed(2))
      : null;
  const willBecomeNegative =
    !isLabor && projectedStock !== null && projectedStock < 0;

  const authorName = getUserDisplayName(transaction.authorId);
  const authorEmail = getUserDisplayEmail(transaction.authorId);
  const trimmedLength = reason.trim().length;

  const handleConfirm = async () => {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5) {
      setReasonError(
        "Informe o motivo do estorno com pelo menos 5 caracteres para fins de auditoria."
      );
      textareaRef.current?.focus();
      return;
    }

    setReasonError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await resourceService.cancelTransaction(
        orgId,
        transaction._id,
        { reason: trimmedReason },
        orgRole
      );

      onCanceled();

      if (recreateAfterCancel) {
        toast.success(
          "Entrada estornada. Revise os dados para registrar o novo lançamento."
        );
        const initialData: AddStockInitialData = {
          resourceId: resolvedResourceId,
          quantity: Number(transaction.quantity) || 0,
          unitCostSnapshot:
            transaction.unitCostSnapshot !== undefined
              ? Number(transaction.unitCostSnapshot)
              : undefined,
          origin: transaction.origin || "",
          notes: transaction.notes || "",
        };
        onClose();
        onCancelAndRecreate(initialData);
      } else {
        toast.success("Entrada estornada com sucesso.");
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Erro ao estornar a entrada."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={requestClose}
    >
      <div
        className="bg-card border border-border w-full max-w-xl rounded-md shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-entry-modal-title"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-st-critical" />
            <h2
              id="cancel-entry-modal-title"
              className="text-base font-semibold text-foreground tracking-tight"
            >
              Estornar Entrada no Almoxarifado
            </h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSubmitting}
            aria-label="Fechar modal"
            className="min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmDiscard && (
          <div className="px-5 py-3 text-xs bg-st-execution-bg border-b border-st-execution-border text-st-execution flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="font-medium">
              Há uma justificativa digitada. Deseja descartar e fechar?
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="min-h-11 px-3 rounded-md border border-st-execution-border bg-background text-foreground font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 px-3 rounded-md bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {/* Corpo */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {submitError && (
            <div className="p-3 text-sm text-st-critical bg-st-critical-bg rounded-md border border-st-critical-border flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Resumo Condensado do Lançamento (até 5 pontos essenciais) */}
          <div className="rounded-md border border-border bg-muted/20 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {resolvedName}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({resolvedUnit})
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  NF/Origem:{" "}
                  <span className="text-foreground font-medium">
                    {transaction.origin || "Não informado"}
                  </span>
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">
                  {isCapital
                    ? formatCurrencyBR(transaction.quantity)
                    : `${formatQuantityBR(transaction.quantity)} ${resolvedUnit}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total: {formatCurrencyBR(transaction.totalCost)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
              <span>
                Lançado por{" "}
                <strong className="text-foreground">{authorName}</strong> em{" "}
                <strong className="text-foreground">
                  {formatDateTimeBR(transaction.createdAt)}
                </strong>
              </span>

              <button
                type="button"
                onClick={() => setShowExtraDetails((prev) => !prev)}
                aria-expanded={showExtraDetails}
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-3 min-h-11"
              >
                {showExtraDetails ? "Menos detalhes" : "Mais detalhes"}
                {showExtraDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {showExtraDetails && (
              <div className="pt-2 border-t border-border/60 text-xs space-y-1 text-muted-foreground">
                <div>
                  Custo unitário NF:{" "}
                  <span className="text-foreground font-medium">
                    {formatCurrencyBR(transaction.unitCostSnapshot)}
                  </span>
                  {authorEmail && (
                    <span className="ml-2">• E-mail: {authorEmail}</span>
                  )}
                </div>
                <div>
                  Observações originais:{" "}
                  <span className="text-foreground break-words">
                    {transaction.notes || "Sem observações registradas"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Aviso de saldo negativo */}
          {willBecomeNegative && (
            <div className="p-3 bg-st-critical-bg border border-st-critical-border rounded-md flex items-start gap-2.5 text-xs text-st-critical">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  Aviso: este estorno deixará o saldo central temporariamente
                  negativo.
                </p>
                <p>
                  Saldo atual:{" "}
                  <strong>
                    {isCapital
                      ? formatCurrencyBR(resolvedCurrentStock)
                      : `${formatQuantityBR(
                          resolvedCurrentStock
                        )} ${resolvedUnit}`}
                  </strong>{" "}
                  → Após estorno:{" "}
                  <strong>
                    {isCapital
                      ? formatCurrencyBR(projectedStock)
                      : `${formatQuantityBR(projectedStock)} ${resolvedUnit}`}
                  </strong>
                  . Caso queira corrigir o valor, marque a opção abaixo para
                  abrir o novo lançamento em seguida.
                </p>
              </div>
            </div>
          )}

          {/* Campo obrigatório de justificativa */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="cancel-entry-reason"
                className="text-sm font-medium text-foreground"
              >
                Motivo / Observação do Estorno{" "}
                <span className="text-st-critical">*</span>
              </label>
              <span
                className={`text-xs font-medium ${
                  trimmedLength >= 5
                    ? "text-st-completed"
                    : "text-muted-foreground"
                }`}
              >
                {trimmedLength}/5 caracteres mínimos
              </span>
            </div>

            <textarea
              ref={textareaRef}
              id="cancel-entry-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setConfirmDiscard(false);
                if (reasonError && e.target.value.trim().length >= 5) {
                  setReasonError(null);
                }
              }}
              aria-invalid={Boolean(reasonError)}
              placeholder="Ex: Quantidade digitada incorretamente (lançado 100 em vez de 10) ou NF duplicada..."
              className={`w-full px-3 py-2 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y ${
                reasonError ? "border-st-critical" : "border-input"
              }`}
              disabled={isSubmitting}
            />

            {reasonError ? (
              <p className="text-xs text-st-critical flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{reasonError}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                A operação de estorno é irreversível; autor, data/hora e este
                motivo ficarão gravados na auditoria contábil.
              </p>
            )}
          </div>

          {/* Opção única de fluxo pós-estorno (Lei de Hick) */}
          <label
            htmlFor="cancel-entry-recreate"
            className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/10 hover:bg-muted/20 cursor-pointer min-h-11 transition-colors"
          >
            <input
              id="cancel-entry-recreate"
              type="checkbox"
              checked={recreateAfterCancel}
              onChange={(e) => setRecreateAfterCancel(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 accent-primary rounded-md shrink-0"
            />
            <span className="text-xs font-medium text-foreground">
              Após confirmar o estorno, abrir novo lançamento corretivo com os
              dados copiados
            </span>
          </label>
        </div>

        {/* Rodapé com apenas 2 decisões claras */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 px-5 py-4 border-t border-border bg-muted/10 shrink-0">
          <button
            type="button"
            onClick={requestClose}
            disabled={isSubmitting}
            className="px-4 min-h-11 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 min-h-11 text-sm font-semibold text-destructive-foreground bg-destructive rounded-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {isSubmitting ? "Estornando..." : "Confirmar Estorno"}
          </button>
        </div>
      </div>
    </div>
  );
}
