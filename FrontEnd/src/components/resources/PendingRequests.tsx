//src/components/resources/PendingRequests.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { resourceService } from "@/lib/services/resourceService";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ClipboardList,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatCurrencyBR,
  formatQuantityBR,
  formatDateTimeBR,
  parseFlexibleDecimal,
} from "./resourceUtils";
import { ScrollableTableContainer } from "./ScrollableTableContainer";

interface PendingRequestsProps {
  refreshKey?: number;
  hasWriteAccess?: boolean;
  onActionComplete: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PendingRequests({
  refreshKey = 0,
  hasWriteAccess = false,
  onActionComplete,
}: PendingRequestsProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(
    null
  );
  const [quantityInput, setQuantityInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const approveInputRef = useRef<HTMLInputElement>(null);
  const rejectInputRef = useRef<HTMLInputElement>(null);
  const triggerFocusRef = useRef<HTMLElement | null>(null);

  const currentOrg = useSelector(selectCurrentOrg);
  const orgId: string | undefined =
    currentOrg?.organizationId && typeof currentOrg.organizationId === "object"
      ? (currentOrg.organizationId as { _id?: string })._id
      : typeof currentOrg?.organizationId === "string"
        ? currentOrg.organizationId
        : undefined;

  const fetchPendingRequests = useCallback(async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await resourceService.listTransactions(orgId);
      const pendingData = Array.isArray(data)
        ? data.filter((tx: any) => tx.status === "PENDING" && !tx.isCanceled)
        : [];
      setRequests(pendingData);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar requisições:", err);
      setError("Não foi possível carregar a fila de requisições.");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests, refreshKey]);

  const restoreTriggerFocus = useCallback(() => {
    const trigger = triggerFocusRef.current;
    triggerFocusRef.current = null;
    if (trigger && document.body.contains(trigger)) {
      trigger.focus();
    } else {
      listContainerRef.current?.focus();
    }
  }, []);

  const handleOpenAction = (
    req: any,
    type: "APPROVE" | "REJECT",
    triggerEl?: HTMLElement | null
  ) => {
    triggerFocusRef.current =
      triggerEl || (document.activeElement as HTMLElement | null);
    setSelectedRequest(req);
    setActionType(type);
    setQuantityInput(
      req.quantity !== undefined && req.quantity !== null
        ? String(req.quantity).replace(".", ",")
        : ""
    );
    setReasonInput("");
    setFieldError(null);
    setSubmitError(null);
  };

  const handleCloseModal = useCallback(() => {
    if (isSubmitting) return;
    setSelectedRequest(null);
    setActionType(null);
    setFieldError(null);
    setSubmitError(null);
    requestAnimationFrame(() => restoreTriggerFocus());
  }, [isSubmitting, restoreTriggerFocus]);

  const isModalOpen = Boolean(selectedRequest && actionType && hasWriteAccess);

  useEffect(() => {
    if (!isModalOpen) return;

    const frameId = requestAnimationFrame(() => {
      if (actionType === "APPROVE") {
        approveInputRef.current?.focus();
        approveInputRef.current?.select();
      } else {
        rejectInputRef.current?.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        e.preventDefault();
        handleCloseModal();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!active || !dialogRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
          return;
        }

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, actionType, isSubmitting, handleCloseModal]);

  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isModalOpen]);

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !selectedRequest || !actionType || isSubmitting) return;

    setFieldError(null);
    setSubmitError(null);

    if (actionType === "APPROVE") {
      const parsedQty = parseFlexibleDecimal(quantityInput);
      const validQty = Number.isFinite(parsedQty)
        ? Number(parsedQty.toFixed(2))
        : Number.NaN;

      if (!Number.isFinite(validQty) || validQty <= 0) {
        setFieldError("Informe uma quantidade válida (mínimo 0,01).");
        approveInputRef.current?.focus();
        return;
      }

      try {
        setIsSubmitting(true);
        await resourceService.approveRequest(
          orgId,
          selectedRequest._id,
          { approvedQuantity: validQty },
          currentOrg?.role
        );
        toast.success("Requisição liberada com sucesso.");
        setSelectedRequest(null);
        setActionType(null);
        onActionComplete();
        requestAnimationFrame(() => restoreTriggerFocus());
      } catch (err: any) {
        const message = String(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Erro ao processar a liberação."
        );
        setSubmitError(message);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const trimmedReason = reasonInput.trim();
      if (trimmedReason.length < 5) {
        setFieldError("Informe um motivo válido (mínimo de 5 caracteres).");
        rejectInputRef.current?.focus();
        return;
      }

      try {
        setIsSubmitting(true);
        await resourceService.rejectRequest(
          orgId,
          selectedRequest._id,
          { reason: trimmedReason },
          currentOrg?.role
        );
        toast.success("Requisição rejeitada.");
        setSelectedRequest(null);
        setActionType(null);
        onActionComplete();
        requestAnimationFrame(() => restoreTriggerFocus());
      } catch (err: any) {
        const message = String(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Erro ao rejeitar a requisição."
        );
        setSubmitError(message);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getResourceDisplay = (req: any) => {
    const name = req.resourceId?.name?.trim() || "Recurso não identificado";
    const unit = req.resourceId?.unit?.trim() || "";
    const type = req.resourceId?.type;
    const isCapital = type === "CAPITAL";
    const isLabor = type === "LABOR";
    const currentStock =
      typeof req.resourceId?.currentStock === "number"
        ? req.resourceId.currentStock
        : undefined;
    return { name, unit, isCapital, isLabor, currentStock };
  };

  const modalResource = selectedRequest
    ? getResourceDisplay(selectedRequest)
    : null;
  const parsedApproveQty = parseFlexibleDecimal(quantityInput);
  const roundedApproveQty = Number.isFinite(parsedApproveQty)
    ? Number(parsedApproveQty.toFixed(2))
    : Number.NaN;
  const validApproveQty =
    Number.isFinite(roundedApproveQty) && roundedApproveQty > 0
      ? roundedApproveQty
      : 0;
  const projectedStock =
    modalResource && modalResource.currentStock !== undefined
      ? Number((modalResource.currentStock - validApproveQty).toFixed(2))
      : undefined;

  return (
    <div ref={listContainerRef} tabIndex={-1} className="w-full outline-none">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 w-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Buscando requisições pendentes...
          </p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center h-64 text-st-critical space-y-3 w-full"
        >
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-medium text-center">{error}</p>
          <button
            type="button"
            onClick={fetchPendingRequests}
            className="inline-flex items-center gap-2 px-4 min-h-11 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3 w-full">
          <ClipboardList className="w-12 h-12 opacity-20" />
          <p className="text-sm font-medium">
            Nenhuma requisição pendente no momento.
          </p>
          <p className="text-xs opacity-70">
            A fila do almoxarifado está zerada.
          </p>
        </div>
      ) : (
        <>
      {/* LAYOUT MOBILE/REDUZIDO (CARDS RESPONSIVOS SEM ROLAGEM HORIZONTAL) */}
      <div className="md:hidden space-y-3 pb-4">
        {requests.map((req) => {
          const { name, unit, isCapital } = getResourceDisplay(req);
          const projectTitle =
            req.projectId?.title?.trim() || "Projeto não identificado";
          const formattedQty = isCapital
            ? formatCurrencyBR(req.quantity)
            : formatQuantityBR(req.quantity);
          const expectedCost = formatCurrencyBR(
            Number(req.quantity || 0) * Number(req.unitCostSnapshot || 0)
          );

          return (
            <div
              key={req._id}
              className="rounded-md border border-border bg-background p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground break-words">
                    {projectTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTimeBR(req.createdAt)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                  {formattedQty}
                  {!isCapital && unit ? ` ${unit}` : ""}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-foreground font-medium">
                  {name}{" "}
                  {unit && (
                    <span className="font-normal text-muted-foreground">
                      ({unit})
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground break-words">
                  Justificativa: {req.origin || "Não informada"}
                </p>
                <p className="text-muted-foreground">
                  Valor previsto:{" "}
                  <span className="font-medium text-foreground">
                    {expectedCost}
                  </span>
                </p>
              </div>

              {hasWriteAccess && (
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={(e) =>
                      handleOpenAction(req, "REJECT", e.currentTarget)
                    }
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 min-h-11 text-xs font-medium text-st-critical bg-st-critical-bg border border-st-critical-border rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Rejeitar
                  </button>
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={(e) =>
                      handleOpenAction(req, "APPROVE", e.currentTarget)
                    }
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 min-h-11 text-xs font-medium text-st-completed bg-st-completed-bg border border-st-completed-border rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Liberar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LAYOUT DESKTOP (TABELA) */}
      <div className="hidden md:block w-full pb-4">
        <ScrollableTableContainer
          className="border border-border rounded-md bg-background"
          ariaLabel="Tabela de requisições pendentes"
        >
          <table className="w-full text-left text-sm border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap"
                >
                  Data da Solicitação
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-muted-foreground"
                >
                  Projeto / Destino
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-muted-foreground"
                >
                  Recurso Requisitado
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-muted-foreground"
                >
                  Justificativa
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-muted-foreground text-center"
                >
                  Qtd.
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-muted-foreground text-right whitespace-nowrap"
                >
                  Valor Previsto
                </th>
                {hasWriteAccess && (
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-muted-foreground text-right"
                  >
                    Ação
                  </th>
                )}
              </tr>
            </thead>
          <tbody className="divide-y divide-border">
            {requests.map((req) => {
              const { name, unit, isCapital } = getResourceDisplay(req);
              const projectTitle =
                req.projectId?.title?.trim() || "Projeto não identificado";
              const formattedQty = isCapital
                ? formatCurrencyBR(req.quantity)
                : formatQuantityBR(req.quantity);
              const expectedCost = formatCurrencyBR(
                Number(req.quantity || 0) * Number(req.unitCostSnapshot || 0)
              );

              return (
                <tr
                  key={req._id}
                  className="hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDateTimeBR(req.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground min-w-[150px]">
                    {projectTitle}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground min-w-[140px] max-w-[260px] break-words">
                    {name}{" "}
                    {unit && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({unit})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs min-w-[200px] max-w-[360px] whitespace-normal break-words">
                    {req.origin || "Não informada"}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground whitespace-nowrap">
                    {formattedQty}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                    {expectedCost}
                  </td>
                  {hasWriteAccess && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-3">
                        <button
                          type="button"
                          aria-haspopup="dialog"
                          onClick={(e) =>
                            handleOpenAction(req, "REJECT", e.currentTarget)
                          }
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-3 min-h-11 text-xs font-medium text-st-critical bg-st-critical-bg border border-st-critical-border rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rejeitar
                        </button>
                        <button
                          type="button"
                          aria-haspopup="dialog"
                          onClick={(e) =>
                            handleOpenAction(req, "APPROVE", e.currentTarget)
                          }
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-3 min-h-11 text-xs font-medium text-st-completed bg-st-completed-bg border border-st-completed-border rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Liberar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        </ScrollableTableContainer>
      </div>
        </>
      )}

      {/* MODAL DEDICADO DE LIBERAÇÃO / REJEIÇÃO */}
      {isModalOpen && selectedRequest && modalResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-request-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border w-full max-w-md rounded-md shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10 shrink-0">
              <h2
                id="pending-request-modal-title"
                className="text-base font-semibold text-foreground tracking-tight"
              >
                {actionType === "APPROVE"
                  ? "Liberar Requisição"
                  : "Rejeitar Requisição"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                aria-label="Fechar modal"
                className="min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              noValidate
              onSubmit={handleConfirmAction}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {submitError && (
                  <div
                    role="alert"
                    className="p-3 text-sm text-st-critical bg-st-critical-bg rounded-md border border-st-critical-border flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="p-3 rounded-md border border-border bg-muted/20 text-xs space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Projeto:</span>
                    <span className="font-medium text-foreground text-right">
                      {selectedRequest.projectId?.title?.trim() ||
                        "Projeto não identificado"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Recurso:</span>
                    <span className="font-medium text-foreground text-right">
                      {modalResource.name}
                      {modalResource.unit ? ` (${modalResource.unit})` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">
                      Qtd. Solicitada:
                    </span>
                    <span className="font-semibold text-foreground text-right">
                      {modalResource.isCapital
                        ? formatCurrencyBR(selectedRequest.quantity)
                        : `${formatQuantityBR(selectedRequest.quantity)}${
                            modalResource.unit ? ` ${modalResource.unit}` : ""
                          }`}
                    </span>
                  </div>
                  {modalResource.currentStock !== undefined &&
                    !modalResource.isLabor && (
                      <div className="flex justify-between gap-2 pt-1.5 border-t border-border">
                        <span className="text-muted-foreground">
                          Saldo Atual no Almoxarifado:
                        </span>
                        <span
                          className={`font-semibold text-right ${
                            modalResource.currentStock <
                            Number(selectedRequest.quantity || 0)
                              ? "text-st-critical"
                              : "text-foreground"
                          }`}
                        >
                          {modalResource.isCapital
                            ? formatCurrencyBR(modalResource.currentStock)
                            : `${formatQuantityBR(modalResource.currentStock)}${
                                modalResource.unit
                                  ? ` ${modalResource.unit}`
                                  : ""
                              }`}
                        </span>
                      </div>
                    )}
                </div>

                {actionType === "APPROVE" ? (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="pending-approve-quantity"
                      className="text-sm font-medium text-foreground"
                    >
                      Quantidade a Liberar{" "}
                      <span className="text-st-critical">*</span>
                    </label>
                    <input
                      ref={approveInputRef}
                      id="pending-approve-quantity"
                      type="text"
                      inputMode="decimal"
                      disabled={isSubmitting}
                      value={quantityInput}
                      onChange={(e) => {
                        setQuantityInput(e.target.value);
                        if (fieldError) setFieldError(null);
                      }}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={
                        fieldError
                          ? "pending-approve-quantity-error"
                          : "pending-approve-quantity-help"
                      }
                      placeholder={
                        modalResource.isCapital
                          ? "Ex: 1.500,00"
                          : "Ex: 10 ou 10,5"
                      }
                      className={`w-full px-3 min-h-11 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                        fieldError ? "border-st-critical" : "border-input"
                      }`}
                    />
                    {fieldError && (
                      <p
                        id="pending-approve-quantity-error"
                        className="text-xs text-st-critical"
                      >
                        {fieldError}
                      </p>
                    )}
                    <p
                      id="pending-approve-quantity-help"
                      className="text-xs text-muted-foreground"
                    >
                      Ajuste o valor caso a liberação seja parcial.
                    </p>

                    {!modalResource.isLabor &&
                      projectedStock !== undefined &&
                      validApproveQty > 0 &&
                      projectedStock < 0 && (
                        <div className="p-3 bg-st-critical-bg border-st-critical-border border rounded-md mt-2">
                          <p className="text-xs text-st-critical font-medium">
                            Atenção: liberar esta quantidade deixará o saldo do
                            Almoxarifado Central negativo (
                            {modalResource.isCapital
                              ? `${formatCurrencyBR(
                                  modalResource.currentStock
                                )} → ${formatCurrencyBR(projectedStock)}`
                              : `${formatQuantityBR(
                                  modalResource.currentStock
                                )} → ${formatQuantityBR(projectedStock)}${
                                  modalResource.unit
                                    ? ` ${modalResource.unit}`
                                    : ""
                                }`}
                            ).
                          </p>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="pending-reject-reason"
                      className="text-sm font-medium text-foreground"
                    >
                      Motivo da Rejeição{" "}
                      <span className="text-st-critical">*</span>
                    </label>
                    <input
                      ref={rejectInputRef}
                      id="pending-reject-reason"
                      type="text"
                      disabled={isSubmitting}
                      value={reasonInput}
                      onChange={(e) => {
                        setReasonInput(e.target.value);
                        if (fieldError) setFieldError(null);
                      }}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={
                        fieldError
                          ? "pending-reject-reason-error"
                          : "pending-reject-reason-counter"
                      }
                      placeholder="Ex: Material em falta no estoque..."
                      className={`w-full px-3 min-h-11 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                        fieldError ? "border-st-critical" : "border-input"
                      }`}
                    />
                    <div className="flex items-center justify-between gap-2">
                      {fieldError ? (
                        <p
                          id="pending-reject-reason-error"
                          className="text-xs text-st-critical"
                        >
                          {fieldError}
                        </p>
                      ) : (
                        <span />
                      )}
                      <p
                        id="pending-reject-reason-counter"
                        className="text-xs text-muted-foreground"
                      >
                        {reasonInput.trim().length} caracteres (mínimo 5)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 px-5 py-4 border-t border-border bg-muted/10 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 min-h-11 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 min-h-11 text-sm font-medium rounded-md shadow-sm transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    actionType === "APPROVE"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-destructive text-destructive-foreground hover:opacity-90"
                  }`}
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Confirmar{" "}
                  {actionType === "APPROVE" ? "Liberação" : "Rejeição"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
