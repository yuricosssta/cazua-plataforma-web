//src/components/resources/CreateResourceModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { resourceService, ResourceType } from "@/lib/services/resourceService";
import { parseFlexibleDecimal } from "./resourceUtils";

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgRole: string;
  onSuccess: () => void;
}

interface IFieldErrors {
  name?: string;
  unit?: string;
  standardCost?: string;
}

const EMPTY_FORM = {
  name: "",
  type: ResourceType.MATERIAL,
  unit: "",
  standardCost: "",
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CreateResourceModal({
  isOpen,
  onClose,
  orgId,
  orgRole,
  onSuccess,
}: CreateResourceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<IFieldErrors>({});
  const [formData, setFormData] = useState(EMPTY_FORM);

  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const unitInputRef = useRef<HTMLInputElement>(null);
  const costInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setFormData(EMPTY_FORM);
    setError(null);
    setFieldErrors({});
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const frameId = requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(frameId);
      const prev = previousFocusRef.current;
      previousFocusRef.current = null;
      if (
        prev &&
        document.body.contains(prev) &&
        typeof prev.focus === "function"
      ) {
        prev.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        e.preventDefault();
        onClose();
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
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isCapital = formData.type === ResourceType.CAPITAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = formData.name.trim();
    const trimmedUnit = formData.unit.trim();
    const trimmedCost = formData.standardCost.trim();
    const parsedCost =
      trimmedCost === "" ? 0 : parseFlexibleDecimal(trimmedCost);

    const nextErrors: IFieldErrors = {};

    if (trimmedName.length < 2) {
      nextErrors.name = "Informe o nome do recurso (mín. 2 caracteres).";
    }
    if (!isCapital && !trimmedUnit) {
      nextErrors.unit = "Informe a unidade de medida (ex: un, kg, m³, h).";
    }
    if (
      !isCapital &&
      trimmedCost !== "" &&
      (!Number.isFinite(parsedCost) || parsedCost < 0)
    ) {
      nextErrors.standardCost =
        "Informe um custo padrão válido (maior ou igual a zero).";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.name) {
        nameInputRef.current?.focus();
      } else if (nextErrors.unit) {
        unitInputRef.current?.focus();
      } else if (nextErrors.standardCost) {
        costInputRef.current?.focus();
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await resourceService.createResource(
        orgId,
        {
          name: trimmedName,
          type: formData.type,
          unit: isCapital ? "R$" : trimmedUnit.toUpperCase(),
          standardCost: isCapital ? 1 : Number(parsedCost.toFixed(2)),
        },
        orgRole
      );

      setFormData(EMPTY_FORM);
      setFieldErrors({});
      toast.success("Recurso cadastrado com sucesso.");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        String(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Erro ao registrar o recurso."
        )
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-resource-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border w-full max-w-md rounded-md shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10 shrink-0">
          <h2
            id="create-resource-modal-title"
            className="text-base font-semibold text-foreground tracking-tight"
          >
            Novo Recurso
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
            {error && (
              <div
                role="alert"
                className="p-3 text-sm text-st-critical bg-st-critical-bg rounded-md border border-st-critical-border flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="create-resource-name"
                className="text-sm font-medium text-foreground"
              >
                Nome do Recurso <span className="text-st-critical">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="create-resource-name"
                type="text"
                disabled={isSubmitting}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={
                  fieldErrors.name ? "create-resource-name-error" : undefined
                }
                placeholder={
                  isCapital
                    ? "Ex: Aporte dos Sócios, Conta Caixa"
                    : "Ex: Cimento CP II 50kg"
                }
                className={`w-full px-3 min-h-11 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                  fieldErrors.name ? "border-st-critical" : "border-input"
                }`}
              />
              {fieldErrors.name && (
                <p
                  id="create-resource-name-error"
                  className="text-xs text-st-critical"
                >
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div
              className={`grid gap-4 ${
                isCapital ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="create-resource-type"
                  className="text-sm font-medium text-foreground"
                >
                  Categoria <span className="text-st-critical">*</span>
                </label>
                <select
                  id="create-resource-type"
                  disabled={isSubmitting}
                  value={formData.type}
                  onChange={(e) => {
                    const nextType = e.target.value as ResourceType;
                    setFormData({
                      ...formData,
                      type: nextType,
                    });
                    if (nextType === ResourceType.CAPITAL) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        unit: undefined,
                        standardCost: undefined,
                      }));
                    }
                  }}
                  className="w-full px-3 min-h-11 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                >
                  <option value={ResourceType.MATERIAL}>
                    Material / Insumo
                  </option>
                  <option value={ResourceType.LABOR}>Mão de Obra</option>
                  <option value={ResourceType.EQUIPMENT}>Equipamento</option>
                  <option value={ResourceType.CAPITAL}>
                    Financeiro (Verba/Capital)
                  </option>
                </select>
              </div>

              {!isCapital && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="create-resource-unit"
                    className="text-sm font-medium text-foreground"
                  >
                    Unidade de Medida <span className="text-st-critical">*</span>
                  </label>
                  <input
                    ref={unitInputRef}
                    id="create-resource-unit"
                    type="text"
                    disabled={isSubmitting}
                    value={formData.unit}
                    onChange={(e) => {
                      setFormData({ ...formData, unit: e.target.value });
                      if (fieldErrors.unit) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          unit: undefined,
                        }));
                      }
                    }}
                    aria-invalid={Boolean(fieldErrors.unit)}
                    aria-describedby={
                      fieldErrors.unit
                        ? "create-resource-unit-error"
                        : undefined
                    }
                    placeholder="Ex: saco, h, un"
                    className={`w-full px-3 min-h-11 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase placeholder:normal-case disabled:opacity-60 ${
                      fieldErrors.unit ? "border-st-critical" : "border-input"
                    }`}
                  />
                  {fieldErrors.unit && (
                    <p
                      id="create-resource-unit-error"
                      className="text-xs text-st-critical"
                    >
                      {fieldErrors.unit}
                    </p>
                  )}
                </div>
              )}
            </div>

            {!isCapital && (
              <div className="space-y-1.5">
                <label
                  htmlFor="create-resource-cost"
                  className="text-sm font-medium text-foreground"
                >
                  Custo Padrão (R$)
                </label>
                <input
                  ref={costInputRef}
                  id="create-resource-cost"
                  type="text"
                  inputMode="decimal"
                  disabled={isSubmitting}
                  value={formData.standardCost}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      standardCost: e.target.value,
                    });
                    if (fieldErrors.standardCost) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        standardCost: undefined,
                      }));
                    }
                  }}
                  aria-invalid={Boolean(fieldErrors.standardCost)}
                  aria-describedby={
                    fieldErrors.standardCost
                      ? "create-resource-cost-error"
                      : "create-resource-cost-help"
                  }
                  placeholder="Ex: 42,90 (opcional)"
                  className={`w-full px-3 min-h-11 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                    fieldErrors.standardCost
                      ? "border-st-critical"
                      : "border-input"
                  }`}
                />
                {fieldErrors.standardCost && (
                  <p
                    id="create-resource-cost-error"
                    className="text-xs text-st-critical"
                  >
                    {fieldErrors.standardCost}
                  </p>
                )}
                <p
                  id="create-resource-cost-help"
                  className="text-xs text-muted-foreground"
                >
                  Valor de referência utilizado caso o lançamento não possua nota
                  fiscal associada.
                </p>
              </div>
            )}

            {isCapital && (
              <div className="p-3 bg-st-completed-bg border-st-completed-border border rounded-md">
                <p className="text-xs text-st-completed font-medium">
                  Recursos financeiros adotam automaticamente o Real (R$) como
                  unidade de medida e custo unitário.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-5 py-4 border-t border-border bg-muted/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 min-h-11 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 min-h-11 text-sm font-medium text-primary-foreground bg-primary rounded-md shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Salvando..." : "Salvar Recurso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
