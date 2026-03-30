//src/components/dashboard/OrgSwitcher.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAllOrgs,
  selectCurrentOrg,
  selectOrgStatus,
  setCurrentOrganization
} from "@/lib/redux/slices/organizationSlice";
import { ChevronsUpDown, Check, Settings, Plus } from "lucide-react";
import { CreateOrganizationModal } from "@/components/dashboard/CreateOrganizationModal";

export function OrgSwitcher() {
  const dispatch = useDispatch();

  // Dados do Redux
  const organizations = useSelector(selectAllOrgs);
  const currentOrg = useSelector(selectCurrentOrg);
  const status = useSelector(selectOrgStatus);

  // Controle do Dropdown Customizado e do Modal
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Se a lista de organizações for carregada e estiver vazia, força abrir o modal de criação
  useEffect(() => {
    if (status === 'succeeded' && organizations.length === 0) {
      setIsCreateModalOpen(true);
    }
  }, [status, organizations.length]); // Verifica quando a lista é carregada e se está vazia

  const handleSwitch = (orgId: string) => {
    dispatch(setCurrentOrganization(orgId));
    setIsOpen(false);
  };

  // --- 1. ESTADO DE CARREGAMENTO (SKELETON) ---
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="w-full h-10 px-3 flex items-center justify-between border border-border bg-background rounded-md animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-muted rounded-sm"></div>
          <div className="w-24 h-4 bg-muted rounded-sm"></div>
        </div>
        <div className="w-4 h-4 bg-muted rounded-sm"></div>
      </div>
    );
  }

  if (organizations.length === 0 || !currentOrg) {
    // Se não tiver organizações, mostra apenas o botão de criar
    return (
      <>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full h-10 px-3 flex items-center justify-center gap-2 border border-dashed border-primary/50 text-primary hover:bg-primary/5 rounded-md text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Empresa
        </button>
        <CreateOrganizationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          forceOnboarding={true} 
        />
      </>
    );
  }

  const initial = currentOrg.organizationId.name.charAt(0).toUpperCase();

  // --- 2. ESTADO CARREGADO (BOTÃO + DROPDOWN) ---
  return (
    <div className="relative w-full" ref={dropdownRef}>

      {/* BOTÃO PRINCIPAL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 flex items-center justify-between border border-border bg-background hover:bg-accent rounded-md text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <div className="flex items-center gap-2 truncate">
          <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-sm font-bold text-xs">
            {initial}
          </div>
          <span className="truncate font-medium text-foreground">
            {currentOrg.organizationId.name}
          </span>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
      </button>

      {/* MENU DROPDOWN */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-popover border border-border rounded-md shadow-lg z-50 p-1 flex flex-col text-popover-foreground">

          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Equipe Atual
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-accent/50 rounded-sm mb-1">
            <div className="flex items-center gap-2 truncate">
              <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-sm font-bold text-xs">
                {initial}
              </div>
              <span className="truncate text-sm font-medium">
                {currentOrg.organizationId.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Settings className="w-4 h-4 hover:text-foreground cursor-pointer transition-colors" />
              <Check className="w-4 h-4 text-foreground" />
            </div>
          </div>

          <div className="h-px bg-border my-1"></div>

          {organizations.length > 1 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Outras Equipes
              </div>
              <div className="max-h-[140px] overflow-y-auto space-y-1 mb-1">
                {organizations
                  .filter((org) => org.organizationId._id !== currentOrg.organizationId._id)
                  .map((org) => (
                    <button
                      key={org.organizationId._id}
                      onClick={() => handleSwitch(org.organizationId._id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm transition-colors text-left"
                    >
                      <div className="flex items-center justify-center w-5 h-5 bg-muted text-muted-foreground rounded-sm font-bold text-xs">
                        {org.organizationId.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{org.organizationId.name}</span>
                    </button>
                  ))}
              </div>
              <div className="h-px bg-border my-1"></div>
            </>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              setIsCreateModalOpen(true); // Abre 
            }}
            className="w-full flex items-center justify-center gap-2 px-2 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-sm transition-colors mt-1"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
        </div>
      )}

      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

    </div>
  );
}