//src/components/layout/Header.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { clearOrganizationState, selectCurrentOrg, selectOrgStatus } from "@/lib/redux/slices/organizationSlice";
import { ChevronRight, Settings, LogOut, User } from "lucide-react";
import { ColorModeSwitcher } from "../color-mode-switcher";
import { AppDispatch } from "@/lib/redux/store";
import { logout } from "@/lib/redux/slices/authSlice";

export function Header() {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();

  // Dados da Organização
  const currentOrg = useSelector(selectCurrentOrg);
  const orgStatus = useSelector(selectOrgStatus);

  // Dados do Usuário
  const profile = useSelector((state: any) => state.user?.profile);

  // Controle do Dropdown de Perfil
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lógica para montar o Breadcrumb dinâmico baseado na URL
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentPageRaw = pathSegments.length > 1 ? pathSegments[pathSegments.length - 1] : 'Visão Geral';
  const currentPage = currentPageRaw.charAt(0).toUpperCase() + currentPageRaw.slice(1); // Capitaliza a 1ª letra

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    window.location.replace('/login');
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 flex-shrink-0">

      {/* ESQUERDA: Breadcrumbs */}
      <div className="flex items-center text-sm">
        {orgStatus === 'loading' ? (
          <div className="w-20 h-4 bg-muted animate-pulse rounded-sm"></div>
        ) : (
          <span className="text-muted-foreground font-medium">
            {currentOrg ? currentOrg.organizationId.name : 'Configurações'}
          </span>
        )}

        <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />

        <span className="text-foreground font-semibold">{currentPage}</span>
      </div>

      {/* DIREITA: Dropdown de Perfil */}
      <div className="relative" ref={dropdownRef}>

        {/* Avatar / Botão de acionamento */}
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-accent border border-border hover:ring-2 hover:ring-muted transition-all overflow-hidden focus:outline-none"
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* O Menu Suspenso */}
        {isProfileOpen && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-50 py-1 flex flex-col text-popover-foreground">

            {/* Cabeçalho do Dropdown (Nome e Email) */}
            <div className="px-4 py-3 border-b border-border mb-1">
              <p className="text-sm font-semibold truncate">
                {profile?.name || 'Carregando...'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email || 'Carregando...'}
              </p>
            </div>

            {/* Links de Ação */}
            <div className="flex flex-col space-y-0.5 px-1">
              <Link
                href="/account/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-sm transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configurações da conta
              </Link>

              <ColorModeSwitcher
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-sm transition-colors w-full text-left"
              />

              <div className="h-px bg-border my-1 mx-2"></div>

              {/* Botão de Sign Out */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-sm transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}