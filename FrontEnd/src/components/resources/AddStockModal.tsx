//src/components/resources/AddStockModal.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Info,
  AlertCircle,
  Loader2,
  Calculator,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  resourceService,
  Resource,
  ResourceType,
  AddStockData,
  AddStockInitialData,
} from "@/lib/services/resourceService";
import {
  formatCurrencyBR,
  formatQuantityBR,
  parseFlexibleDecimal,
} from "./resourceUtils";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgRole: string;
  onSuccess: () => void;
  initialData?: AddStockInitialData | null;
}

interface IFieldErrors {
  resourceId?: string;
  quantity?: string;
  unitCostSnapshot?: string;
}

const EMPTY_FORM = {
  resourceId: "",
  quantity: "",
  unitCostSnapshot: "",
  origin: "",
  notes: "",
};

const formatInitialDecimal = (val?: number): string => {
  if (val === undefined || val === null || !Number.isFinite(val)) return "";
  return String(val).replace(".", ",");
};

export function AddStockModal({
  isOpen,
  onClose,
  orgId,
  orgRole,
  onSuccess,
  initialData = null,
}: AddStockModalProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<IFieldErrors>({});
  const [formData, setFormData] = useState(EMPTY_FORM);

  const resourceSelectRef = useRef<HTMLSelectElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const unitCostRef = useRef<HTMLInputElement>(null);

  const loadCatalog = useCallback(async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      setCatalogError(null);
      const data = await resourceService.listResources(orgId);
      setResources(data);
    } catch {
      setCatalogError("Erro ao carregar lista de recursos.");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setCatalogError(null);
    setFieldErrors({});
    if (initialData) {
      setFormData({
        resourceId: initialData.resourceId || "",
        quantity:
          initialData.quantity > 0
            ? formatInitialDecimal(initialData.quantity)
            : "",
        unitCostSnapshot:
          initialData.unitCostSnapshot !== undefined
            ? formatInitialDecimal(initialData.unitCostSnapshot)
            : "",
        origin: initialData.origin || "",
        notes: initialData.notes || "",
      });
    } else {
      setFormData(EMPTY_FORM);
    }

    loadCatalog();
  }, [isOpen, initialData, loadCatalog]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const isCatalogUnavailable =
    isLoading || Boolean(catalogError) || resources.length === 0;
  const isFormBlocked = isCatalogUnavailable || isSubmitting;

  const selectedResource = resources.find((r) => r._id === formData.resourceId);
  const isCapital = selectedResource?.type === ResourceType.CAPITAL;
  const isLabor = selectedResource?.type === ResourceType.LABOR;
  const isCorrectionMode = Boolean(initialData);

  const parsedQuantity = parseFlexibleDecimal(formData.quantity);
  const roundedQuantity = Number.isFinite(parsedQuantity)
    ? Number(parsedQuantity.toFixed(2))
    : Number.NaN;
  const hasValidQuantity =
    Number.isFinite(roundedQuantity) && roundedQuantity > 0;

  const hasTypedUnitCost = formData.unitCostSnapshot.trim() !== "";
  const parsedUnitCost = hasTypedUnitCost
    ? parseFlexibleDecimal(formData.unitCostSnapshot)
    : Number.NaN;
  const roundedUnitCost =
    hasTypedUnitCost && Number.isFinite(parsedUnitCost)
      ? Number(parsedUnitCost.toFixed(2))
      : Number.NaN;

  const effectiveUnitCost = isCapital
    ? 1
    : hasTypedUnitCost && Number.isFinite(roundedUnitCost) && roundedUnitCost >= 0
    ? roundedUnitCost
    : selectedResource?.standardCost ?? 0;

  const projectedStock =
    selectedResource && hasValidQuantity
      ? Number((selectedResource.currentStock + roundedQuantity).toFixed(2))
      : null;

  const projectedTotalCost = hasValidQuantity
    ? Number((roundedQuantity * effectiveUnitCost).toFixed(2))
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCatalogUnavailable) return;

    setError(null);

    const nextFieldErrors: IFieldErrors = {};

    if (!formData.resourceId) {
      nextFieldErrors.resourceId = "Selecione o item ou recurso recebido.";
    }

    if (!Number.isFinite(roundedQuantity) || roundedQuantity <= 0) {
      nextFieldErrors.quantity = isCapital
        ? "Informe um valor numérico mínimo de 0,01 (ex: 1500,00)."
        : "Informe uma quantidade válida mínima de 0,01 (ex: 10,5).";
    }

    if (!isCapital && hasTypedUnitCost) {
      if (!Number.isFinite(roundedUnitCost) || roundedUnitCost < 0) {
        nextFieldErrors.unitCostSnapshot =
          "Informe um custo unitário válido (ex: 42,90) ou deixe em branco para usar o custo padrão.";
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      if (nextFieldErrors.resourceId) {
        resourceSelectRef.current?.focus();
      } else if (nextFieldErrors.quantity) {
        quantityRef.current?.focus();
      } else if (nextFieldErrors.unitCostSnapshot) {
        unitCostRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});

    try {
      setIsSubmitting(true);

      const payload: AddStockData = {
        resourceId: formData.resourceId,
        quantity: roundedQuantity,
        origin: formData.origin.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (isCapital) {
        payload.unitCostSnapshot = 1;
      } else if (hasTypedUnitCost) {
        payload.unitCostSnapshot = roundedUnitCost;
      }

      await resourceService.addStock(orgId, payload, orgRole);

      toast.success(
        isCorrectionMode
          ? "Novo lançamento corretivo registrado com sucesso."
          : "Entrada registrada com sucesso."
      );
      setFormData(EMPTY_FORM);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Erro ao registrar a entrada."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="bg-card border border-border w-full max-w-lg rounded-md shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-stock-modal-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20 shrink-0">
          <h2
            id="add-stock-modal-title"
            className="text-base font-semibold text-foreground tracking-tight"
          >
            {isCorrectionMode
              ? "Novo Lançamento Corretivo de Entrada"
              : "Registro de Entrada de Estoque"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar modal"
            className="min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {isCorrectionMode && (
              <div className="p-3 text-xs text-primary bg-primary-bg rounded-md border border-primary-border flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Novo lançamento a partir de entrada estornada. Revise os dados
                  abaixo antes de confirmar.
                </span>
              </div>
            )}

            {catalogError && (
              <div className="p-3 text-sm text-st-critical bg-st-critical-bg rounded-md border border-st-critical-border flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{catalogError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadCatalog}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 min-h-11 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tentar novamente
                </button>
              </div>
            )}

            {!isLoading && !catalogError && resources.length === 0 && (
              <div className="p-3 text-xs text-st-execution bg-st-execution-bg rounded-md border border-st-execution-border flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  Nenhum recurso ativo disponível no catálogo. Cadastre um
                  recurso antes de registrar entradas.
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-st-critical bg-st-critical-bg rounded-md border border-st-critical-border flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="add-stock-resource"
                className="text-sm font-medium text-foreground"
              >
                Item / Recurso <span className="text-st-critical">*</span>
              </label>
              <select
                ref={resourceSelectRef}
                id="add-stock-resource"
                value={formData.resourceId}
                onChange={(e) => {
                  setFormData({ ...formData, resourceId: e.target.value });
                  if (fieldErrors.resourceId) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      resourceId: undefined,
                    }));
                  }
                }}
                disabled={isFormBlocked}
                aria-invalid={Boolean(fieldErrors.resourceId)}
                className={`w-full px-3 py-2 min-h-11 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                  fieldErrors.resourceId ? "border-st-critical" : "border-input"
                }`}
              >
                <option value="" disabled>
                  {isLoading
                    ? "Carregando catálogo..."
                    : resources.length === 0
                    ? "Nenhum recurso disponível"
                    : "Selecione o recurso recebido"}
                </option>
                {resources.map((res) => {
                  const stockSummary =
                    res.type === ResourceType.LABOR
                      ? "Mão de Obra"
                      : res.type === ResourceType.CAPITAL
                      ? `Atual: ${formatCurrencyBR(res.currentStock)}`
                      : `Atual: ${formatQuantityBR(res.currentStock)} ${
                          res.unit
                        }`;
                  return (
                    <option key={res._id} value={res._id}>
                      {res.name} ({stockSummary})
                    </option>
                  );
                })}
              </select>
              {fieldErrors.resourceId && (
                <p className="text-xs text-st-critical">
                  {fieldErrors.resourceId}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="p-4 rounded-md border border-border bg-muted/20 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Carregando parâmetros do recurso...</span>
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  isCapital ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="add-stock-quantity"
                    className="text-sm font-medium text-foreground"
                  >
                    {isCapital
                      ? "Valor do Aporte (R$)"
                      : "Quantidade Recebida"}{" "}
                    <span className="text-st-critical">*</span>
                  </label>
                  <input
                    ref={quantityRef}
                    id="add-stock-quantity"
                    type="text"
                    inputMode="decimal"
                    value={formData.quantity}
                    disabled={isFormBlocked}
                    onChange={(e) => {
                      setFormData({ ...formData, quantity: e.target.value });
                      if (fieldErrors.quantity) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          quantity: undefined,
                        }));
                      }
                    }}
                    placeholder={
                      isCapital ? "Ex: 1500,00" : "Ex: 25 ou 10,5"
                    }
                    aria-invalid={Boolean(fieldErrors.quantity)}
                    className={`w-full px-3 py-2 min-h-11 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                      fieldErrors.quantity
                        ? "border-st-critical"
                        : "border-input"
                    }`}
                  />
                  {fieldErrors.quantity && (
                    <p className="text-xs text-st-critical">
                      {fieldErrors.quantity}
                    </p>
                  )}
                </div>

                {!isCapital && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="add-stock-unit-cost"
                      className="text-sm font-medium text-foreground"
                    >
                      Custo Unitário NF (Opcional)
                    </label>
                    <input
                      ref={unitCostRef}
                      id="add-stock-unit-cost"
                      type="text"
                      inputMode="decimal"
                      value={formData.unitCostSnapshot}
                      disabled={isFormBlocked}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          unitCostSnapshot: e.target.value,
                        });
                        if (fieldErrors.unitCostSnapshot) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            unitCostSnapshot: undefined,
                          }));
                        }
                      }}
                      placeholder={
                        selectedResource
                          ? `Padrão: ${formatCurrencyBR(
                              selectedResource.standardCost
                            )}`
                          : "R$ Padrão"
                      }
                      aria-invalid={Boolean(fieldErrors.unitCostSnapshot)}
                      className={`w-full px-3 py-2 min-h-11 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                        fieldErrors.unitCostSnapshot
                          ? "border-st-critical"
                          : "border-input"
                      }`}
                    />
                    {fieldErrors.unitCostSnapshot && (
                      <p className="text-xs text-st-critical">
                        {fieldErrors.unitCostSnapshot}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="add-stock-origin"
                className="text-sm font-medium text-foreground"
              >
                Documento de Origem / NF
              </label>
              <input
                id="add-stock-origin"
                type="text"
                value={formData.origin}
                disabled={isFormBlocked}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value })
                }
                placeholder={
                  isCapital
                    ? "Ex: Comprovante de PIX, Transferência Sócio X"
                    : "Ex: Nota Fiscal nº 12345 / Fornecedor XPTO"
                }
                className="w-full px-3 py-2 min-h-11 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="add-stock-notes"
                className="text-sm font-medium text-foreground"
              >
                Observações (Opcional)
              </label>
              <textarea
                id="add-stock-notes"
                rows={2}
                value={formData.notes}
                disabled={isFormBlocked}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Ex: Conferido na entrega, embalagem íntegra, compra emergencial..."
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y disabled:opacity-60"
              />
            </div>

            {/* Bloco de Síntese (Conferência em Tempo Real) */}
            {!isLoading &&
              selectedResource &&
              hasValidQuantity &&
              projectedTotalCost !== null && (
                <div className="p-3 rounded-md border border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <Calculator className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <span className="text-muted-foreground">
                        {isLabor ? "Lançamento:" : "Novo saldo projetado:"}{" "}
                      </span>
                      {isLabor ? (
                        <strong>
                          {formatQuantityBR(roundedQuantity)}{" "}
                          {selectedResource.unit}
                        </strong>
                      ) : isCapital ? (
                        <strong>
                          {formatCurrencyBR(selectedResource.currentStock)} →{" "}
                          {formatCurrencyBR(projectedStock)}
                        </strong>
                      ) : (
                        <strong>
                          {formatQuantityBR(selectedResource.currentStock)} →{" "}
                          {formatQuantityBR(projectedStock)}{" "}
                          {selectedResource.unit}
                        </strong>
                      )}
                    </div>
                  </div>
                  <div className="text-foreground">
                    <span className="text-muted-foreground">
                      Valor total da entrada:{" "}
                    </span>
                    <strong className="text-primary">
                      {formatCurrencyBR(projectedTotalCost)}
                    </strong>
                  </div>
                </div>
              )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 px-5 py-4 border-t border-border bg-muted/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 min-h-11 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isFormBlocked}
              className="px-4 min-h-11 text-sm font-semibold text-primary-foreground bg-primary rounded-md shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Registrando..." : "Registrar Entrada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
