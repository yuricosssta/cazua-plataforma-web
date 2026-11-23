//src/components/resources/AllocateDirectlyModal.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  RotateCcw,
  Info,
  Calculator,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  resourceService,
  Resource,
  ResourceType,
} from "@/lib/services/resourceService";
import { useOrganizationProjects } from "@/lib/hooks/useOrganizationProjects";
import { ProjectSearchCombobox } from "./ProjectSearchCombobox";
import {
  formatCurrencyBR,
  formatQuantityBR,
  parseFlexibleDecimal,
} from "./resourceUtils";

interface AllocateDirectlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgRole: string;
  onSuccess: () => void;
}

interface IFieldErrors {
  projectId?: string;
  resourceId?: string;
  quantity?: string;
}

const EMPTY_FORM = {
  projectId: "",
  resourceId: "",
  quantity: "",
  origin: "Envio Direto Almoxarifado",
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AllocateDirectlyModal({
  isOpen,
  onClose,
  orgId,
  orgRole,
  onSuccess,
}: AllocateDirectlyModalProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isResourcesLoading, setIsResourcesLoading] = useState(false);
  const [resourcesLoadError, setResourcesLoadError] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<IFieldErrors>({});
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [projectSearchResetKey, setProjectSearchResetKey] = useState(0);

  const projectsQuery = useOrganizationProjects(orgId, isOpen);
  const projects = projectsQuery.data ?? [];
  const isProjectsInitialLoading =
    projectsQuery.isPending && projects.length === 0;
  const projectsLoadError =
    projectsQuery.isError && projects.length === 0
      ? "Não foi possível carregar os projetos."
      : null;

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const resourceSelectRef = useRef<HTMLSelectElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const submitErrorRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isProjectDropdownOpenRef = useRef(false);

  const loadResources = useCallback(async () => {
    if (!orgId) return;
    try {
      setIsResourcesLoading(true);
      setResourcesLoadError(null);
      const resourcesData = await resourceService.listResources(orgId);
      setResources(Array.isArray(resourcesData) ? resourcesData : []);
    } catch (err) {
      console.error(err);
      setResourcesLoadError("Não foi possível carregar os recursos.");
    } finally {
      setIsResourcesLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!isOpen) return;

    setFormData(EMPTY_FORM);
    setProjectSearchResetKey((prev) => prev + 1);
    isProjectDropdownOpenRef.current = false;
    setError(null);
    setResourcesLoadError(null);
    setFieldErrors({});
    loadResources();
  }, [isOpen, loadResources]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const frameId = requestAnimationFrame(() => {
      if (projectInputRef.current && !projectInputRef.current.disabled) {
        projectInputRef.current.focus();
      } else {
        closeButtonRef.current?.focus();
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
      const prev = previousFocusRef.current;
      previousFocusRef.current = null;
      if (prev && document.body.contains(prev) && typeof prev.focus === "function") {
        prev.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isProjectsInitialLoading || projects.length === 0 || isSubmitting) {
      return;
    }

    const active = document.activeElement;
    if (
      active === closeButtonRef.current ||
      active === dialogRef.current ||
      active === document.body
    ) {
      projectInputRef.current?.focus();
    }
  }, [isOpen, isProjectsInitialLoading, projects.length, isSubmitting]);

  useEffect(() => {
    if (!error) return;
    submitErrorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [error]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !isSubmitting &&
        !isProjectDropdownOpenRef.current
      ) {
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

  const loadError =
    projectsLoadError && resourcesLoadError
      ? "Não foi possível carregar os projetos e recursos."
      : projectsLoadError || resourcesLoadError;
  const isLoading = isProjectsInitialLoading || isResourcesLoading;
  const isProjectFieldDisabled =
    isProjectsInitialLoading ||
    Boolean(projectsLoadError) ||
    projects.length === 0 ||
    isSubmitting;
  const isDataUnavailable =
    isLoading ||
    Boolean(loadError) ||
    projects.length === 0 ||
    resources.length === 0;
  const isFormBlocked = isDataUnavailable || isSubmitting;

  const selectedResource = resources.find((r) => r._id === formData.resourceId);
  const isCapital = selectedResource?.type === ResourceType.CAPITAL;
  const isLabor = selectedResource?.type === ResourceType.LABOR;

  const parsedQuantity = parseFlexibleDecimal(formData.quantity);
  const roundedQuantity = Number.isFinite(parsedQuantity)
    ? Number(parsedQuantity.toFixed(2))
    : Number.NaN;
  const validQuantity =
    Number.isFinite(roundedQuantity) && roundedQuantity > 0
      ? roundedQuantity
      : 0;

  const projectedStock = selectedResource
    ? Number((selectedResource.currentStock - validQuantity).toFixed(2))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isDataUnavailable || isSubmitting) return;

    const nextErrors: IFieldErrors = {};

    if (!formData.projectId) {
      nextErrors.projectId = projectInputRef.current?.value.trim()
        ? "Selecione um projeto da lista de sugestões."
        : "Selecione o projeto de destino.";
    }
    if (!formData.resourceId) {
      nextErrors.resourceId = "Selecione o recurso a enviar.";
    }
    if (!Number.isFinite(parsedQuantity) || validQuantity <= 0) {
      nextErrors.quantity = isCapital
        ? "Informe um valor válido (mínimo R$ 0,01)."
        : "Informe uma quantidade válida (mínimo 0,01).";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.projectId) {
        projectInputRef.current?.focus();
      } else if (nextErrors.resourceId) {
        resourceSelectRef.current?.focus();
      } else if (nextErrors.quantity) {
        quantityInputRef.current?.focus();
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await resourceService.allocateDirectly(
        orgId,
        formData.projectId,
        {
          resourceId: formData.resourceId,
          quantity: validQuantity,
          origin: formData.origin.trim() || "Envio Direto Almoxarifado",
        },
        orgRole
      );

      setFormData(EMPTY_FORM);
      setProjectSearchResetKey((prev) => prev + 1);
      setFieldErrors({});
      toast.success("Saída de recurso registrada com sucesso.");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        String(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Erro ao registrar a alocação."
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
        aria-labelledby="allocate-directly-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border w-full max-w-lg rounded-md shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10 shrink-0">
          <h2
            id="allocate-directly-modal-title"
            className="text-base font-semibold text-foreground tracking-tight"
          >
            Saída Direta para Destino
          </h2>
          <button
            ref={closeButtonRef}
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
            {loadError && (
              <div
                role="alert"
                className="p-3 text-sm text-st-critical bg-st-critical-bg rounded-md border border-st-critical-border flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (projectsLoadError || projects.length === 0) {
                      projectsQuery.refetch();
                    }
                    if (resourcesLoadError || resources.length === 0) {
                      loadResources();
                    }
                    requestAnimationFrame(() =>
                      closeButtonRef.current?.focus()
                    );
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 min-h-11 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tentar novamente
                </button>
              </div>
            )}

            {!isProjectsInitialLoading &&
              !projectsLoadError &&
              projects.length === 0 && (
              <div className="p-3 text-xs text-st-execution bg-st-execution-bg rounded-md border border-st-execution-border flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  Nenhum projeto disponível para destino. Cadastre um projeto
                  antes de registrar saídas.
                </span>
              </div>
            )}

            {!isResourcesLoading &&
              !resourcesLoadError &&
              projects.length > 0 &&
              resources.length === 0 && (
                <div className="p-3 text-xs text-st-execution bg-st-execution-bg rounded-md border border-st-execution-border flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Nenhum recurso ativo disponível no catálogo. Cadastre um
                    recurso antes de registrar saídas.
                  </span>
                </div>
              )}

            {error && (
              <div
                ref={submitErrorRef}
                role="alert"
                className="p-3 text-sm text-st-critical bg-st-critical-bg rounded-md border border-st-critical-border flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="allocate-project"
                className="text-sm font-medium text-foreground"
              >
                Destino <span className="text-st-critical">*</span>
              </label>
              <ProjectSearchCombobox
                id="allocate-project"
                inputRef={projectInputRef}
                projects={projects}
                selectedProjectId={formData.projectId}
                onSelectProject={(projectId) => {
                  setFormData((prev) => ({ ...prev, projectId }));
                  if (fieldErrors.projectId) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      projectId: undefined,
                    }));
                  }
                }}
                onDropdownOpenChange={(open) => {
                  isProjectDropdownOpenRef.current = open;
                }}
                disabled={isProjectFieldDisabled}
                isLoading={isProjectsInitialLoading}
                hasError={Boolean(fieldErrors.projectId)}
                errorDescribedBy={
                  fieldErrors.projectId ? "allocate-project-error" : undefined
                }
                resetSignal={projectSearchResetKey}
              />
              {fieldErrors.projectId && (
                <p
                  id="allocate-project-error"
                  className="text-xs text-st-critical"
                >
                  {fieldErrors.projectId}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="allocate-resource"
                className="text-sm font-medium text-foreground"
              >
                Item / Recurso <span className="text-st-critical">*</span>
              </label>
              <select
                ref={resourceSelectRef}
                id="allocate-resource"
                disabled={isFormBlocked}
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
                aria-invalid={Boolean(fieldErrors.resourceId)}
                aria-describedby={
                  fieldErrors.resourceId
                    ? "allocate-resource-error"
                    : undefined
                }
                className={`w-full px-3 min-h-11 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                  fieldErrors.resourceId
                    ? "border-st-critical"
                    : "border-input"
                }`}
              >
                <option value="" disabled>
                  {isLoading
                    ? "Carregando recursos..."
                    : resources.length === 0
                      ? "Nenhum recurso disponível"
                      : "Selecione o recurso a enviar"}
                </option>
                {[
                  { key: ResourceType.MATERIAL, label: "Materiais" },
                  { key: ResourceType.EQUIPMENT, label: "Equipamentos" },
                  { key: ResourceType.LABOR, label: "Mão de Obra" },
                  { key: ResourceType.CAPITAL, label: "Financeiro" },
                  { key: "OTHER", label: "Outros" },
                ].map((group) => {
                  const groupItems = resources.filter((res) =>
                    group.key === "OTHER"
                      ? res.type !== ResourceType.MATERIAL &&
                        res.type !== ResourceType.EQUIPMENT &&
                        res.type !== ResourceType.LABOR &&
                        res.type !== ResourceType.CAPITAL
                      : res.type === group.key
                  );
                  if (groupItems.length === 0) return null;

                  return (
                    <optgroup key={group.key} label={group.label}>
                      {groupItems.map((res) => {
                        const name = res.name?.trim() || "Recurso sem nome";
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
                            {name} ({stockSummary})
                          </option>
                        );
                      })}
                    </optgroup>
                  );
                })}
              </select>
              {fieldErrors.resourceId && (
                <p
                  id="allocate-resource-error"
                  className="text-xs text-st-critical"
                >
                  {fieldErrors.resourceId}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="allocate-quantity"
                  className="text-sm font-medium text-foreground"
                >
                  {isCapital ? "Valor Enviado (R$)" : "Quantidade a Enviar"}{" "}
                  <span className="text-st-critical">*</span>
                </label>
                <input
                  ref={quantityInputRef}
                  id="allocate-quantity"
                  type="text"
                  inputMode="decimal"
                  disabled={isFormBlocked}
                  value={formData.quantity}
                  onChange={(e) => {
                    setFormData({ ...formData, quantity: e.target.value });
                    if (fieldErrors.quantity) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        quantity: undefined,
                      }));
                    }
                  }}
                  aria-invalid={Boolean(fieldErrors.quantity)}
                  aria-describedby={
                    fieldErrors.quantity
                      ? "allocate-quantity-error"
                      : undefined
                  }
                  placeholder={isCapital ? "Ex: 1.500,00" : "Ex: 10 ou 10,5"}
                  className={`w-full px-3 min-h-11 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
                    fieldErrors.quantity ? "border-st-critical" : "border-input"
                  }`}
                />
                {fieldErrors.quantity && (
                  <p
                    id="allocate-quantity-error"
                    className="text-xs text-st-critical"
                  >
                    {fieldErrors.quantity}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="allocate-origin"
                  className="text-sm font-medium text-foreground"
                >
                  Observação / Origem
                </label>
                <input
                  id="allocate-origin"
                  type="text"
                  disabled={isFormBlocked}
                  value={formData.origin}
                  onChange={(e) =>
                    setFormData({ ...formData, origin: e.target.value })
                  }
                  placeholder="Ex: Saída Autorizada"
                  className="w-full px-3 min-h-11 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </div>
            </div>

            {selectedResource && validQuantity > 0 && (
              <div className="p-3 rounded-md border border-border bg-muted/20 text-xs space-y-1">
                <div className="flex items-center gap-2 text-foreground">
                  <Calculator className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="text-muted-foreground">
                      Saldo após saída:{" "}
                    </span>
                    {isLabor ? (
                      <strong>
                        Saída registrada: {formatQuantityBR(validQuantity)}{" "}
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
              </div>
            )}

            {selectedResource &&
              validQuantity > 0 &&
              projectedStock < 0 &&
              !isLabor && (
                <div className="p-3 bg-st-critical-bg border-st-critical-border border rounded-md">
                  <p className="text-xs text-st-critical font-medium">
                    Aviso: Esta saída deixará o saldo do Almoxarifado Central
                    negativo (
                    {isCapital
                      ? `${formatCurrencyBR(
                          selectedResource.currentStock
                        )} → ${formatCurrencyBR(projectedStock)}`
                      : `${formatQuantityBR(
                          selectedResource.currentStock
                        )} → ${formatQuantityBR(projectedStock)} ${
                          selectedResource.unit
                        }`}
                    ).
                  </p>
                </div>
              )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 px-5 py-4 border-t border-border bg-muted/10 shrink-0">
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
              disabled={isFormBlocked}
              className="px-4 min-h-11 text-sm font-medium text-primary-foreground bg-primary rounded-md shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Registrando..." : "Confirmar Saída"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
