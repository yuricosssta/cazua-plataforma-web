//src/components/layout/SettingsSidebar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectAllOrgs, selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { User, ShieldCheck, Settings, PlusCircle, ArrowLeft, Menu, X } from "lucide-react";
import LogoBloco from "../LogoBloco";

export function SettingsSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const organizations = useSelector(selectAllOrgs);

  // Pegamos a organização atual para destacar
  const currentOrg = useSelector(selectCurrentOrg);
  // Pegamos a lista COMPLETA de organizações do usuário no Redux
  const authUser = useSelector((state: RootState) => state.auth.user);
  const userOrganizations = organizations;//authUser?.organizations || [];

  const accountLinks = [
    { name: "Meu Perfil", href: "/account/profile", icon: User },
    { name: "Emails e Autenticação", href: "/account/security", icon: ShieldCheck },
    { name: "Configurações", href: "/account/settings", icon: Settings },
  ];

  return (
    <>
      {/* Botão Hamburger (Mobile apenas) */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-background border border-border rounded-md shadow-sm text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop escuro (Mobile apenas) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-border bg-background flex flex-col h-full flex-shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>

        <div className="h-14 flex items-center justify-between px-6 border-b border-border">
          <LogoBloco />
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1 -mr-2 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8">
          <div className="pb-2 border-b border-border/50">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Link>
          </div>

          {/* Seção 1: Account Settings */}
          <div>
            <h4 className="px-2 text-xs font-semibold text-foreground mb-3">Configurações da Conta</h4>
            <div className="space-y-0.5">
              {accountLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Teams (Lista de todas as organizações) */}
          <div>
            <h4 className="px-2 text-xs font-semibold text-foreground mb-3">Equipes</h4>
            <div className="space-y-1">

              {/* Loop pelas organizações reais do usuário */}
              {userOrganizations.map((orgWrapper: any) => {
                const org = orgWrapper.organizationId;
                // Verifica se esta é a organização atualmente selecionada no Redux
                const isCurrent = currentOrg?.organizationId?._id === org._id;

                return (
                  // <Link
                  <div
                    key={org._id}
                    // href={`/account/organization/`} // Ajuste esta rota conforme sua arquitetura
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isCurrent
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      }`}
                  >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-sm font-bold text-xs flex-shrink-0 ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{org.name}</span>
                    {/* </Link> */}
                  </div>
                );
              })}

              {/* Criar nova equipe */}
              <Link
                href="/account/organization/new" // Rota para criação de nova org
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mt-3 border border-dashed border-border"
              >
                <PlusCircle className="w-4 h-4" />
                Criar nova equipe
              </Link>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}