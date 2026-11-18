//src/components/resources/ResourceCatalog.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import {
  resourceService,
  Resource,
  ResourceType,
  ResourceTransaction,
  AddStockInitialData,
} from "@/lib/services/resourceService";
import {
  Box,
  HardHat,
  Wrench,
  DollarSign,
  AlertCircle,
  Edit2,
  Archive,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Clock,
  RotateCcw,
  Ban,
  Receipt,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { EditResourceModal } from "./EditResourceModal";
import { CancelEntryModal } from "./CancelEntryModal";
import { ScrollableTableContainer } from "./ScrollableTableContainer";
import {
  formatCurrencyBR,
  formatQuantityBR,
  formatDateTimeBR,
  getUserDisplayName,
  getUserDisplayEmail,
} from "./resourceUtils";

interface ResourceCatalogProps {
  refreshKey: number;
  hasWriteAccess?: boolean;
  onOpenCorrectionEntry?: (initialData: AddStockInitialData) => void;
  onGlobalRefresh?: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ResourceCatalog({
  refreshKey,
  hasWriteAccess = false,
  onOpenCorrectionEntry,
  onGlobalRefresh,
}: ResourceCatalogProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalRefresh, setInternalRefresh] = useState(0);

  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [inactivateTarget, setInactivateTarget] = useState<Resource | null>(
    null
  );
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);

  const [expandedResourceId, setExpandedResourceId] = useState<string | null>(
    null
  );
  const [expandedAuditIds, setExpandedAuditIds] = useState<
    Record<string, boolean>
  >({});
  const [cancelingContext, setCancelingContext] = useState<{
    transaction: ResourceTransaction;
    resource: Resource;
  } | null>(null);

  const catalogContainerRef = useRef<HTMLDivElement>(null);
  const inactivateDialogRef = useRef<HTMLDivElement>(null);
  const cancelInactivateBtnRef = useRef<HTMLButtonElement>(null);
  const inactivateTriggerRef = useRef<HTMLElement | null>(null);

  const currentOrg = useSelector(selectCurrentOrg);
  const orgId: string | undefined =
    currentOrg?.organizationId && typeof currentOrg.organizationId === "object"
      ? (currentOrg.organizationId as { _id?: string })._id
      : typeof currentOrg?.organizationId === "string"
        ? currentOrg.organizationId
        : undefined;
  const orgRole = currentOrg?.role || "MEMBER";

  useEffect(() => {
    async function fetchResources() {
      if (!orgId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await resourceService.listResources(orgId);
        setResources(data);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar recursos:", err);
        setError("Não foi possível carregar o catálogo de recursos.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchResources();
  }, [orgId, refreshKey, internalRefresh]);

  const restoreInactivateFocus = useCallback(() => {
    const trigger = inactivateTriggerRef.current;
    inactivateTriggerRef.current = null;
    if (trigger && document.body.contains(trigger)) {
      trigger.focus();
    } else {
      catalogContainerRef.current?.focus();
    }
  }, []);

  const handleCloseInactivateModal = useCallback(() => {
    if (inactivatingId) return;
    setInactivateTarget(null);
    requestAnimationFrame(() => restoreInactivateFocus());
  }, [inactivatingId, restoreInactivateFocus]);

  const isInactivateOpen = Boolean(inactivateTarget);

  useEffect(() => {
    if (!isInactivateOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frameId = requestAnimationFrame(() => {
      cancelInactivateBtnRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !inactivatingId) {
        e.preventDefault();
        handleCloseInactivateModal();
        return;
      }

      if (e.key === "Tab" && inactivateDialogRef.current) {
        const focusables = Array.from(
          inactivateDialogRef.current.querySelectorAll<HTMLElement>(
            FOCUSABLE_SELECTOR
          )
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!active || !inactivateDialogRef.current.contains(active)) {
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
      document.body.style.overflow = prevOverflow;
    };
  }, [isInactivateOpen, inactivatingId, handleCloseInactivateModal]);

  const triggerLocalRefresh = () => setInternalRefresh((prev) => prev + 1);

  const handleToggleExpand = (resourceId: string) => {
    setExpandedResourceId((prev) => (prev === resourceId ? null : resourceId));
  };

  const handleToggleAudit = (resourceId: string) => {
    setExpandedAuditIds((prev) => ({
      ...prev,
      [resourceId]: !prev[resourceId],
    }));
  };

  const handleRequestInactivate = (
    resource: Resource,
    triggerEl?: HTMLElement | null
  ) => {
    if (resource.currentStock !== 0) {
      toast.warning(
        "Operação bloqueada: Zere o saldo deste recurso antes de inativá-lo para evitar furos contábeis."
      );
      return;
    }
    inactivateTriggerRef.current =
      triggerEl || (document.activeElement as HTMLElement | null);
    setInactivateTarget(resource);
  };

  const handleConfirmInactivate = async () => {
    if (!orgId || !inactivateTarget) return;

    try {
      setInactivatingId(inactivateTarget._id);
      await resourceService.inactivateResource(
        orgId,
        inactivateTarget._id,
        orgRole
      );
      toast.success("Recurso inativado com sucesso.");
      setInactivateTarget(null);
      triggerLocalRefresh();
      onGlobalRefresh?.();
      requestAnimationFrame(() => restoreInactivateFocus());
    } catch (err: any) {
      toast.error(
        String(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Erro ao inativar recurso."
        )
      );
    } finally {
      setInactivatingId(null);
    }
  };

  const getCategoryBadge = (type: ResourceType) => {
    switch (type) {
      case ResourceType.MATERIAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-st-planning-bg text-st-planning border-st-planning-border text-xs font-medium border">
            <Box className="w-3.5 h-3.5" /> Material
          </span>
        );
      case ResourceType.LABOR:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-st-critical-bg text-st-critical border-st-critical-border text-xs font-medium border">
            <HardHat className="w-3.5 h-3.5" /> Mão de Obra
          </span>
        );
      case ResourceType.EQUIPMENT:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-bg text-primary border-primary-border text-xs font-medium border">
            <Wrench className="w-3.5 h-3.5" /> Equipamento
          </span>
        );
      case ResourceType.CAPITAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-st-completed-bg text-st-completed border-st-completed-border text-xs font-medium border">
            <DollarSign className="w-3.5 h-3.5" /> Financeiro
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={catalogContainerRef}
      tabIndex={-1}
      className="w-full outline-none"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 w-full">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
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
            onClick={triggerLocalRefresh}
            className="inline-flex items-center gap-2 px-4 min-h-11 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3 w-full text-center px-4">
          <Box className="w-12 h-12 opacity-20" />
          <p className="text-sm font-medium">
            Nenhum recurso ativo no almoxarifado.
          </p>
          <p className="text-xs opacity-70">
            {hasWriteAccess
              ? 'Utilize o botão "Novo Recurso" para iniciar o catálogo.'
              : "Solicite a um administrador ou membro do almoxarifado o cadastro inicial de recursos."}
          </p>
        </div>
      ) : (
        <>
      <ScrollableTableContainer
        className="border border-border rounded-md bg-background"
        ariaLabel="Tabela de saldo de recursos"
      >
        <table className="w-full text-left text-sm border-collapse min-w-[840px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-muted-foreground"
              >
                Nome do Recurso / Última NF
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-muted-foreground"
              >
                Categoria
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-muted-foreground"
              >
                Unidade
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-muted-foreground text-right"
              >
                Custo Padrão
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-muted-foreground text-right"
              >
                Saldo Central
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-muted-foreground text-center"
              >
                Ações
              </th>
            </tr>
          </thead>
        <tbody className="divide-y divide-border">
          {resources.map((resource) => {
            const isExpanded = expandedResourceId === resource._id;
            const lastEntry = resource.lastEntry || null;
            const lastCanceledEntry = resource.lastCanceledEntry || null;
            const isCapital = resource.type === ResourceType.CAPITAL;
            const isAuditExpanded =
              !lastEntry || Boolean(expandedAuditIds[resource._id]);
            const isInactivatingThis = inactivatingId === resource._id;

            return (
              <React.Fragment key={resource._id}>
                <tr
                  className={`hover:bg-muted/10 transition-colors group ${
                    isExpanded ? "bg-muted/20" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="min-w-0">
                      <span className="block font-medium text-foreground">
                        {resource.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {lastEntry ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Receipt className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[260px]">
                              Última entrada:{" "}
                              {lastEntry.origin || "Sem nº NF"}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/80">
                            Sem entradas registradas
                          </span>
                        )}
                        {lastCanceledEntry && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-st-critical-bg text-st-critical border border-st-critical-border text-xs font-medium">
                            <Ban className="w-3 h-3" /> Estorno recente
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {getCategoryBadge(resource.type)}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground uppercase">
                    {resource.unit}
                  </td>

                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrencyBR(resource.standardCost)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {resource.type === ResourceType.LABOR ? (
                      <span className="text-muted-foreground text-xs italic">
                        N/A
                      </span>
                    ) : isCapital ? (
                      <span
                        className={`font-semibold ${
                          resource.currentStock < 0
                            ? "text-st-critical"
                            : "text-st-completed"
                        }`}
                      >
                        {formatCurrencyBR(resource.currentStock)}
                      </span>
                    ) : (
                      <span
                        className={`font-semibold ${
                          resource.currentStock <= 0
                            ? "text-st-critical"
                            : "text-foreground"
                        }`}
                      >
                        {formatQuantityBR(resource.currentStock)}{" "}
                        <span className="uppercase text-xs ml-0.5">
                          {resource.unit}
                        </span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(resource._id)}
                        aria-expanded={isExpanded}
                        aria-controls={`resource-details-${resource._id}`}
                        className="px-3 min-h-11 text-xs font-medium text-foreground bg-muted/50 hover:bg-muted border border-border rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        {isExpanded ? "Ocultar NF" : "Ver NF"}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {hasWriteAccess && (
                        <>
                          <button
                            type="button"
                            aria-haspopup="dialog"
                            onClick={() => setEditingResource(resource)}
                            className="min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-primary bg-muted/50 hover:bg-muted border border-border rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title="Editar Recurso"
                            aria-label={`Editar ${resource.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            aria-haspopup="dialog"
                            onClick={(e) =>
                              handleRequestInactivate(resource, e.currentTarget)
                            }
                            disabled={isInactivatingThis}
                            className="ml-1 min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-st-critical bg-muted/50 hover:bg-st-critical-bg border border-border rounded-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title="Arquivar/Inativar"
                            aria-label={`Inativar ${resource.name}`}
                          >
                            {isInactivatingThis ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {isExpanded && (
                  <tr
                    id={`resource-details-${resource._id}`}
                    className="bg-muted/20"
                  >
                    <td colSpan={6} className="px-6 py-4">
                      <div className="space-y-4">
                        {/* Bloco Principal: Última Entrada Ativa */}
                        <div className="rounded-md border border-border bg-card p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-start gap-3 border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                              <Receipt className="w-4 h-4 text-primary" />
                              <h3 className="text-sm font-semibold text-foreground">
                                Dados da Última Entrada / Nota Fiscal
                              </h3>
                            </div>

                            {lastEntry && hasWriteAccess && (
                              <button
                                type="button"
                                aria-haspopup="dialog"
                                onClick={() =>
                                  setCancelingContext({
                                    transaction: lastEntry,
                                    resource,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 min-h-11 text-xs font-medium text-st-critical bg-st-critical-bg border border-st-critical-border rounded-md hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Corrigir / Estornar Entrada
                              </button>
                            )}
                          </div>

                          {lastEntry ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground block">
                                    Documento de Origem / NF
                                  </span>
                                  <span className="font-semibold text-foreground mt-0.5 block break-words">
                                    {lastEntry.origin || "Não informado"}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-muted-foreground block">
                                    Quantidade &amp; Valores
                                  </span>
                                  <span className="font-semibold text-foreground mt-0.5 block">
                                    {isCapital
                                      ? formatCurrencyBR(lastEntry.quantity)
                                      : `${formatQuantityBR(
                                          lastEntry.quantity
                                        )} ${resource.unit}`}
                                  </span>
                                  <span className="text-muted-foreground block mt-0.5">
                                    Unit:{" "}
                                    {formatCurrencyBR(
                                      lastEntry.unitCostSnapshot
                                    )}{" "}
                                    • Total:{" "}
                                    {formatCurrencyBR(lastEntry.totalCost)}
                                  </span>
                                </div>

                                <div className="flex items-start gap-1.5">
                                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-muted-foreground block">
                                      Autor da Ação
                                    </span>
                                    <span className="font-semibold text-foreground mt-0.5 block">
                                      {getUserDisplayName(lastEntry.authorId)}
                                    </span>
                                    {getUserDisplayEmail(
                                      lastEntry.authorId
                                    ) && (
                                      <span className="text-muted-foreground block">
                                        {getUserDisplayEmail(
                                          lastEntry.authorId
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-start gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-muted-foreground block">
                                      Data e Hora
                                    </span>
                                    <span className="font-semibold text-foreground mt-0.5 block">
                                      {formatDateTimeBR(lastEntry.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-border flex items-start gap-1.5 text-xs">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-muted-foreground font-medium">
                                    Observações:{" "}
                                  </span>
                                  <span className="text-foreground break-words">
                                    {lastEntry.notes ||
                                      "Sem observações registradas"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Nenhuma entrada ativa registrada para este recurso
                              no Almoxarifado Central.
                            </p>
                          )}
                        </div>

                        {/* Bloco Secundário: Última Entrada Estornada (Colapsável quando houver entrada ativa) */}
                        {lastCanceledEntry && (
                          <div className="rounded-md border border-st-critical-border bg-st-critical-bg/50 overflow-hidden">
                            <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-st-critical">
                                <Ban className="w-3.5 h-3.5" />
                                <span>
                                  Última Entrada Estornada (Auditoria)
                                </span>
                                <span className="font-normal text-muted-foreground">
                                  —{" "}
                                  {isCapital
                                    ? formatCurrencyBR(
                                        lastCanceledEntry.quantity
                                      )
                                    : `${formatQuantityBR(
                                        lastCanceledEntry.quantity
                                      )} ${resource.unit}`}{" "}
                                  •{" "}
                                  {lastCanceledEntry.origin || "Sem nº NF"}
                                </span>
                              </div>

                              {lastEntry && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleAudit(resource._id)
                                  }
                                  aria-expanded={isAuditExpanded}
                                  className="inline-flex items-center gap-1 px-2.5 min-h-11 text-xs font-medium text-st-critical hover:bg-st-critical-bg rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  {isAuditExpanded
                                    ? "Ocultar auditoria"
                                    : "Ver detalhes do estorno"}
                                  {isAuditExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>

                            {isAuditExpanded && (
                              <div className="px-4 pb-4 pt-2 border-t border-st-critical-border/40 space-y-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                  <div>
                                    <span className="text-muted-foreground block">
                                      Autor Original / Data
                                    </span>
                                    <span className="font-medium text-foreground">
                                      {getUserDisplayName(
                                        lastCanceledEntry.authorId
                                      )}{" "}
                                      (
                                      {formatDateTimeBR(
                                        lastCanceledEntry.createdAt
                                      )}
                                      )
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-muted-foreground block">
                                      Estornado por
                                    </span>
                                    <span className="font-medium text-foreground">
                                      {getUserDisplayName(
                                        lastCanceledEntry.canceledBy
                                      )}
                                      {getUserDisplayEmail(
                                        lastCanceledEntry.canceledBy
                                      )
                                        ? ` (${getUserDisplayEmail(
                                            lastCanceledEntry.canceledBy
                                          )})`
                                        : ""}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-muted-foreground block">
                                      Data / Hora do Estorno
                                    </span>
                                    <span className="font-medium text-foreground">
                                      {formatDateTimeBR(
                                        lastCanceledEntry.canceledAt ||
                                          lastCanceledEntry.updatedAt
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-xs pt-2 border-t border-st-critical-border/40 space-y-1">
                                  <div>
                                    <span className="text-st-critical font-medium">
                                      Motivo / Observação do Estorno:{" "}
                                    </span>
                                    <span className="text-foreground break-words">
                                      {lastCanceledEntry.cancelReason ||
                                        "Motivo não informado"}
                                    </span>
                                  </div>
                                  {lastCanceledEntry.notes && (
                                    <div>
                                      <span className="text-muted-foreground font-medium">
                                        Observações da entrada original:{" "}
                                      </span>
                                      <span className="text-foreground break-words">
                                        {lastCanceledEntry.notes}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      </ScrollableTableContainer>
        </>
      )}

      {/* Modal Interno de Confirmação de Inativação */}
      {inactivateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={handleCloseInactivateModal}
        >
          <div
            ref={inactivateDialogRef}
            className="bg-card border border-border w-full max-w-md rounded-md shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inactivate-modal-title"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20 shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-st-critical" />
                <h2
                  id="inactivate-modal-title"
                  className="text-base font-semibold text-foreground"
                >
                  Confirmar Inativação de Recurso
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseInactivateModal}
                disabled={Boolean(inactivatingId)}
                aria-label="Fechar modal"
                className="min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-sm text-foreground overflow-y-auto flex-1">
              <p>
                Tem certeza que deseja inativar o recurso{" "}
                <strong>&ldquo;{inactivateTarget.name}&rdquo;</strong>?
              </p>
              <p className="text-xs text-muted-foreground">
                Ele deixará de aparecer em novas requisições e movimentações,
                preservando todo o histórico contábil anterior.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 px-5 py-4 border-t border-border bg-muted/10 shrink-0">
              <button
                ref={cancelInactivateBtnRef}
                type="button"
                onClick={handleCloseInactivateModal}
                disabled={Boolean(inactivatingId)}
                className="px-4 min-h-11 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmInactivate}
                disabled={Boolean(inactivatingId)}
                className="px-4 min-h-11 text-sm font-medium text-st-critical bg-st-critical-bg border border-st-critical-border rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {inactivatingId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                {inactivatingId ? "Inativando..." : "Confirmar Inativação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {orgId && (
        <>
          <EditResourceModal
            isOpen={!!editingResource}
            onClose={() => setEditingResource(null)}
            orgId={orgId}
            orgRole={orgRole}
            resource={editingResource}
            onSuccess={() => {
              triggerLocalRefresh();
              onGlobalRefresh?.();
            }}
          />

          <CancelEntryModal
            isOpen={!!cancelingContext}
            onClose={() => setCancelingContext(null)}
            orgId={orgId}
            orgRole={orgRole}
            transaction={cancelingContext?.transaction || null}
            resourceInfo={cancelingContext?.resource || null}
            onCanceled={() => {
              triggerLocalRefresh();
              onGlobalRefresh?.();
            }}
            onCancelAndRecreate={(initialData) => {
              onOpenCorrectionEntry?.(initialData);
            }}
          />
        </>
      )}
    </div>
  );
}
