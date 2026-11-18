//src/components/resources/ManageWarehouseTeamDrawer.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  X,
  UserPlus,
  UserMinus,
  Shield,
  Loader2,
  Users,
  AlertCircle,
  RotateCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { IUser } from "@/types/user";
import { resourceService } from "@/lib/services/resourceService";
import { fetchBff } from "@/lib/api/fetchBff";

interface ManageWarehouseTeamDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  currentAssignedMembers: string[];
  orgRole: string;
  onSuccess: () => void | Promise<void>;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ManageWarehouseTeamDrawer({
  isOpen,
  onClose,
  orgId,
  currentAssignedMembers,
  orgRole,
  onSuccess,
}: ManageWarehouseTeamDrawerProps) {
  const [orgMembers, setOrgMembers] = useState<IUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const drawerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const fetchOrgMembers = useCallback(async () => {
    if (!orgId) return;
    try {
      setIsLoadingMembers(true);
      setMembersError(null);
      const data = await fetchBff<IUser[]>(
        `/api/organizations/${orgId}/members`
      );
      setOrgMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar equipe da empresa:", error);
      setMembersError("Não foi possível carregar os membros da organização.");
    } finally {
      setIsLoadingMembers(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchTerm("");
    fetchOrgMembers();
  }, [isOpen, fetchOrgMembers]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const frameId = requestAnimationFrame(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      } else {
        closeButtonRef.current?.focus();
      }
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
      if (e.key === "Escape" && !processingId) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!active || !drawerRef.current.contains(active)) {
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
  }, [isOpen, processingId, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const restoreMemberActionFocus = useCallback((userId: string) => {
    requestAnimationFrame(() => {
      const buttons = drawerRef.current?.querySelectorAll<HTMLButtonElement>(
        "[data-member-action]"
      );
      if (!buttons) return;
      const target = Array.from(buttons).find(
        (btn) => btn.dataset.memberAction === userId
      );
      target?.focus();
    });
  }, []);

  const handleAssign = async (userId: string, memberName: string) => {
    if (processingId) return;
    try {
      setProcessingId(userId);
      await resourceService.assignWarehouseMember(orgId, userId, orgRole);
      await Promise.resolve(onSuccess());
      toast.success(`${memberName} alocado(a) na equipe do almoxarifado.`);
    } catch (error: any) {
      toast.error(
        String(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Falha ao alocar o membro."
        )
      );
    } finally {
      setProcessingId(null);
      restoreMemberActionFocus(userId);
    }
  };

  const handleRemove = async (userId: string, memberName: string) => {
    if (processingId) return;
    try {
      setProcessingId(userId);
      await resourceService.removeWarehouseMember(orgId, userId, orgRole);
      await Promise.resolve(onSuccess());
      toast.success(`${memberName} removido(a) da equipe do almoxarifado.`);
    } catch (error: any) {
      toast.error(
        String(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Falha ao remover o membro do almoxarifado."
        )
      );
    } finally {
      setProcessingId(null);
      restoreMemberActionFocus(userId);
    }
  };

  const { assignedMembers, unassignedMembers } = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = orgMembers.filter((member) => {
      if (!normalizedSearch) return true;
      const name = (member.name ?? "").toLowerCase();
      const email = (member.email ?? "").toLowerCase();
      return name.includes(normalizedSearch) || email.includes(normalizedSearch);
    });

    const assigned: IUser[] = [];
    const unassigned: IUser[] = [];

    for (const member of filtered) {
      const memberId = String(member._id || member.id);
      if (currentAssignedMembers.includes(memberId)) {
        assigned.push(member);
      } else {
        unassigned.push(member);
      }
    }

    return { assignedMembers: assigned, unassignedMembers: unassigned };
  }, [orgMembers, currentAssignedMembers, searchTerm]);

  if (!isOpen) return null;

  const renderMemberRow = (member: IUser, isAssigned: boolean) => {
    const memberId = String(member._id || member.id);
    const isProcessing = processingId === memberId;
    const isAnyProcessing = Boolean(processingId);
    const displayName = member.name?.trim() || "Usuário sem nome";
    const displayEmail = member.email?.trim() || "-";
    const initial = (
      member.name?.trim() ||
      member.email?.trim() ||
      "?"
    )
      .charAt(0)
      .toUpperCase();

    return (
      <div
        key={memberId}
        className={`flex items-center justify-between gap-3 p-3 rounded-md border transition-colors ${
          isAssigned
            ? "bg-primary-bg border-primary-border"
            : "bg-card border-border hover:border-muted-foreground/30"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-md font-bold text-sm flex-shrink-0 ${
              isAssigned
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {initial}
          </div>
          <div className="truncate min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {displayEmail}
            </p>
          </div>
        </div>
        <button
          type="button"
          data-member-action={memberId}
          disabled={isAnyProcessing}
          onClick={() =>
            isAssigned
              ? handleRemove(memberId, displayName)
              : handleAssign(memberId, displayName)
          }
          aria-label={
            isAssigned
              ? `Remover ${displayName} do Almoxarifado`
              : `Alocar ${displayName} no Almoxarifado`
          }
          className={`inline-flex items-center justify-center gap-1.5 px-3 min-w-11 min-h-11 rounded-md text-xs font-medium transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isProcessing
              ? "bg-muted text-muted-foreground border border-border"
              : isAssigned
                ? "bg-st-critical-bg text-st-critical border border-st-critical-border hover:opacity-90"
                : "bg-primary-bg text-primary hover:bg-primary hover:text-primary-foreground border border-primary-border"
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : isAssigned ? (
            <UserMinus className="w-4 h-4 shrink-0" />
          ) : (
            <UserPlus className="w-4 h-4 shrink-0" />
          )}
          <span>
            {isAssigned
              ? isProcessing
                ? "Removendo..."
                : "Remover"
              : isProcessing
                ? "Alocando..."
                : "Alocar"}
          </span>
        </button>
      </div>
    );
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={() => !processingId && onClose()}
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="warehouse-team-drawer-title"
        className="fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-background shadow-2xl border-l border-border translate-x-0 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30 shrink-0">
          <div>
            <h2
              id="warehouse-team-drawer-title"
              className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2"
            >
              <Users className="w-5 h-5 text-primary" /> Equipe do Almoxarifado
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Gerencie quem tem permissão para operar o estoque.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={Boolean(processingId)}
            aria-label="Fechar painel"
            className="min-w-11 min-h-11 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!isLoadingMembers && !membersError && orgMembers.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="warehouse-team-search" className="sr-only">
                Buscar membro por nome ou e-mail
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  id="warehouse-team-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full pl-9 pr-3 min-h-11 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {isLoadingMembers ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm">Buscando usuários...</p>
            </div>
          ) : membersError ? (
            <div
              role="alert"
              className="bg-st-critical-bg border border-st-critical-border text-st-critical p-4 rounded-md space-y-3"
            >
              <div className="flex items-start gap-2.5 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{membersError}</span>
              </div>
              <button
                type="button"
                onClick={fetchOrgMembers}
                className="inline-flex items-center justify-center gap-2 px-4 min-h-11 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Tentar novamente
              </button>
            </div>
          ) : orgMembers.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-md border border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                Nenhum membro encontrado na organização.
              </p>
            </div>
          ) : assignedMembers.length === 0 && unassignedMembers.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-md border border-dashed border-border space-y-3 px-4">
              <p className="text-sm text-muted-foreground">
                Nenhum membro encontrado para &ldquo;{searchTerm.trim()}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  requestAnimationFrame(() => searchInputRef.current?.focus());
                }}
                className="inline-flex items-center justify-center px-4 min-h-11 text-xs font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {assignedMembers.length > 0 && (
                <section aria-labelledby="assigned-members-heading" className="space-y-2.5">
                  <h3
                    id="assigned-members-heading"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Equipe Alocada ({assignedMembers.length})
                  </h3>
                  <div className="space-y-2.5">
                    {assignedMembers.map((member) =>
                      renderMemberRow(member, true)
                    )}
                  </div>
                </section>
              )}

              {unassignedMembers.length > 0 && (
                <section aria-labelledby="unassigned-members-heading" className="space-y-2.5">
                  <h3
                    id="unassigned-members-heading"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Demais Membros ({unassignedMembers.length})
                  </h3>
                  <div className="space-y-2.5">
                    {unassignedMembers.map((member) =>
                      renderMemberRow(member, false)
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-background shrink-0">
          <div className="flex items-start gap-3 p-3 bg-st-planning-bg text-st-planning border-st-planning-border rounded-md border">
            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Apenas os membros alocados podem registrar entradas, saídas,
              estornos e aprovar requisições de projetos.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
