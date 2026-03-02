"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { User, ShieldCheck, Settings, PlusCircle, ArrowLeft } from "lucide-react";
import LogoBloco from "../LogoBloco";

export function SettingsSidebar() {
  const pathname = usePathname();
  const currentOrg = useSelector(selectCurrentOrg);

  // Links da Conta
  const accountLinks = [
    { name: "Meu Perfil", href: "/account/profile", icon: User },
    { name: "Emails e Autenticação", href: "/account/security", icon: ShieldCheck },
    { name: "Configurações", href: "/account/settings", icon: Settings },
  ];

  return (
    <aside className="w-[260px] border-r border-border bg-background flex flex-col h-full flex-shrink-0">

      <div className="h-14 flex items-center px-6 border-b border-border">
        <LogoBloco />
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
          <h4 className="px-2 text-xs font-semibold text-foreground mb-3">
            Configurações da Conta
          </h4>
          <div className="space-y-0.5">
            {accountLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`} 
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Seção 2: Teams */}
        <div>
          <h4 className="px-2 text-xs font-semibold text-foreground mb-3">
            Equipes
          </h4>
          <div className="space-y-0.5">
            {/* Equipe Atual */}
            {currentOrg && (
              <Link
                href="/account/organization"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/account/organization"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
              >
                <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-sm font-bold text-xs flex-shrink-0">
                  {currentOrg.organizationId.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{currentOrg.organizationId.name}</span>
              </Link>
            )}

            {/* Criar nova equipe */}
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors text-left mt-2">
              <PlusCircle className="w-4 h-4" />
              Criar nova equipe
            </button>
          </div>
        </div>

      </nav>
    </aside>
  );
}