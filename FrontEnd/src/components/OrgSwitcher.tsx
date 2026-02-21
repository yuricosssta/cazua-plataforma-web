//src/components/OrgSwitcher.tsx
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

export function OrgSwitcher() {
  const dispatch = useDispatch();
  
  // Dados do Redux
  const organizations = useSelector(selectAllOrgs);
  const currentOrg = useSelector(selectCurrentOrg);
  const status = useSelector(selectOrgStatus); // 'idle' | 'loading' | 'succeeded' | 'failed'

  // Controle do Dropdown Customizado
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSwitch = (orgId: string) => {
    dispatch(setCurrentOrganization(orgId));
    setIsOpen(false);
  };

  // --- 1. ESTADO DE CARREGAMENTO (SKELETON) ---
  // Se estiver carregando, mostra o esqueleto do exato tamanho do botão (h-10)
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="w-full h-10 px-3 flex items-center justify-between border border-border bg-background rounded-md animate-pulse">
        <div className="flex items-center gap-2">
          {/* Esqueleto do Ícone (Avatar da empresa) */}
          <div className="w-5 h-5 bg-muted rounded-sm"></div>
          {/* Esqueleto do Texto */}
          <div className="w-24 h-4 bg-muted rounded-sm"></div>
        </div>
        {/* Esqueleto da setinha */}
        <div className="w-4 h-4 bg-muted rounded-sm"></div>
      </div>
    );
  }

  // Se não tiver organizações, não renderiza nada (O Dashboard redireciona para criar)
  if (organizations.length === 0 || !currentOrg) return null;

  // Pegar a primeira letra da empresa para fazer um "Logo" falso
  const initial = currentOrg.organizationId.name.charAt(0).toUpperCase();

  // --- 2. ESTADO CARREGADO (BOTÃO + DROPDOWN) ---
  return (
    <div className="relative w-full" ref={dropdownRef}>
      
      {/* BOTÃO PRINCIPAL (Garante altura fixa h-10) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 flex items-center justify-between border border-border bg-background hover:bg-accent rounded-md text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <div className="flex items-center gap-2 truncate">
          {/* Logo da Empresa */}
          <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-sm font-bold text-xs">
            {initial}
          </div>
          {/* Nome da Empresa */}
          <span className="truncate font-medium text-foreground">
            {currentOrg.organizationId.name}
          </span>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
      </button>

      {/* MENU DROPDOWN (Baseado na sua referência) */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-popover border border-border rounded-md shadow-lg z-50 p-1 flex flex-col text-popover-foreground">
          
          {/* Seção: Current Team */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Current team
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
               {/* Ícone de configurações da equipe atual */}
               <Settings className="w-4 h-4 hover:text-foreground cursor-pointer transition-colors" />
               <Check className="w-4 h-4 text-foreground" />
            </div>
          </div>

          <div className="h-px bg-border my-1"></div>

          {/* Seção: Other Teams */}
          {organizations.length > 1 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Other teams
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

          {/* Ação: Create a Team */}
          <button className="w-full flex items-center justify-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-sm transition-colors mt-1">
            <Plus className="w-4 h-4" />
            Create a team
          </button>
        </div>
      )}
    </div>
  );
}