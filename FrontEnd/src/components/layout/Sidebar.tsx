// components/SidebarLayout.tsx
"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Box,
  Users,
  PieChart,
  Globe,
  BarChart3,
  ShoppingCart,
  Tag,
  Settings,
  BookOpenText
} from "lucide-react";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const dashboardLinks = [
    {
      name: "Visão Geral", href: "/dashboard", icon:
        <Globe className="w-4 h-4" />
      // <LayoutDashboard className="w-4 h-4" />
    },
  ];

  const managementLinks = [
    // { name: "Products", href: "/dashboard/products", icon: <Box className="w-4 h-4" /> },
    { name: "Recursos Humanos", href: "/dashboard/people", icon: <Users className="w-4 h-4" /> },
    { name: "Publicações", href: "/dashboard/posts", icon: <BookOpenText className="w-4 h-4" /> },
    // { name: "Segmentos", href: "/dashboard/segments", icon: <PieChart className="w-4 h-4" /> },
    // { name: "Regiões", href: "/dashboard/regions", icon: <Globe className="w-4 h-4" /> },
  ];

  const monetizationLinks = [
    { name: "Receita", href: "/dashboard/revenue", icon: <BarChart3 className="w-4 h-4" /> },
    { name: "Pedidos", href: "/dashboard/orders", icon: <ShoppingCart className="w-4 h-4" /> },
    { name: "Descontos", href: "/dashboard/discounts", icon: <Tag className="w-4 h-4" /> },
  ];

  const settingsLinks = [
    { name: "Configuration", href: "/dashboard/settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-[260px] border-r border-border bg-background flex flex-col h-full flex-shrink-0">

      <div className="p-4 border-b border-border">
        <OrgSwitcher />
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">

        {/* Seção Principal */}
        <div className="space-y-1">
          {dashboardLinks.map((link) => (
            <NavItem
              key={link.name}
              href={link.href}
              icon={link.icon}
              label={link.name}
            />
          ))}
        </div>

        {/* Seção: Management */}
        <div>
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
            Gerenciamento
          </p>
          <div className="space-y-1">
            {managementLinks.map((link) => (
              <NavItem
                key={link.name}
                href={link.href}
                icon={link.icon}
                label={link.name}
              />
            ))}
          </div>
        </div>

        {/* Seção: Monetization */}
        {/* <div>
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
            Monetization
          </p>
          <div className="space-y-1">
            {monetizationLinks.map((link) => (
              <NavItem
                key={link.name}
                href={link.href}
                icon={link.icon}
                label={link.name}
              />
            ))}
          </div>
        </div> */}

        {/* Seção: Settings */}
        <div>
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
            Configurações
          </p>
          <div className="space-y-1">
            {settingsLinks.map((link) => (
              <NavItem
                key={link.name}
                href={link.href}
                icon={link.icon}
                label={link.name}
              />
            ))}
          </div>
        </div>

      </nav>
    </aside>
  );
}

function NavItem({ href, icon, label, className }: { href: string; icon: React.ReactNode; label: string; className?: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      // className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${className || "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
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