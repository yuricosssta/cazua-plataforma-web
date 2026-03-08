// components/SidebarLayout.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Globe,
  BarChart3,
  ShoppingCart,
  Tag,
  Settings,
  BookOpenText,
  Menu,
  X
} from "lucide-react";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const dashboardLinks = [
    { name: "Visão Geral", href: "/dashboard", icon: <Globe className="w-4 h-4" /> },
  ];

  const managementLinks = [
    { name: "Recursos Humanos", href: "/dashboard/people", icon: <Users className="w-4 h-4" /> },
    { name: "Publicações", href: "/dashboard/posts", icon: <BookOpenText className="w-4 h-4" /> },
    { name: "Projetos e Demandas", href: "/dashboard/projects", icon: <LayoutDashboard className="w-4 h-4" /> },
  ];

  const monetizationLinks = [
    { name: "Receita", href: "/dashboard/revenue", icon: <BarChart3 className="w-4 h-4" /> },
    { name: "Pedidos", href: "/dashboard/orders", icon: <ShoppingCart className="w-4 h-4" /> },
    { name: "Descontos", href: "/dashboard/discounts", icon: <Tag className="w-4 h-4" /> },
  ];

  const settingsLinks = [
    { name: "Configurações", href: "/dashboard/settings", icon: <Settings className="w-4 h-4" /> },
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

      {/* Sidebar (Gaveta no Mobile / Fixa no Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-border bg-background flex flex-col h-full flex-shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="flex-1">
            <OrgSwitcher />
          </div>
          {/* Botão Fechar (Mobile apenas) */}
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          <div className="space-y-1">
            {dashboardLinks.map((link) => (
              <NavItem key={link.name} href={link.href} icon={link.icon} label={link.name} onClick={() => setIsOpen(false)} />
            ))}
          </div>

          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground mb-2">Gerenciamento</p>
            <div className="space-y-1">
              {managementLinks.map((link) => (
                <NavItem key={link.name} href={link.href} icon={link.icon} label={link.name} onClick={() => setIsOpen(false)} />
              ))}
            </div>
          </div>

          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground mb-2">Configurações</p>
            <div className="space-y-1">
              {settingsLinks.map((link) => (
                <NavItem key={link.name} href={link.href} icon={link.icon} label={link.name} onClick={() => setIsOpen(false)} />
              ))}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

function NavItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}