// components/SidebarLayout.tsx

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
  Settings 
} from "lucide-react";
import { OrgSwitcher } from "@/components/OrgSwitcher";

export function Sidebar() {
  return (
    <aside className="w-[260px] border-r border-border bg-background flex flex-col h-full flex-shrink-0">
      
      <div className="p-4 border-b border-border">
        <OrgSwitcher />
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        
        {/* Seção Principal */}
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground">
            <Globe className="w-4 h-4" />
            Overview
          </Link>
        </div>

        {/* Seção: Management */}
        <div>
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
            Management
          </p>
          <div className="space-y-1">
            <NavItem href="/dashboard/products" icon={<Box className="w-4 h-4" />} label="Products" />
            <NavItem href="/dashboard/people" icon={<Users className="w-4 h-4" />} label="People" />
            <NavItem href="/dashboard/segments" icon={<PieChart className="w-4 h-4" />} label="Segments" />
            <NavItem href="/dashboard/regions" icon={<Globe className="w-4 h-4" />} label="Regions" />
          </div>
        </div>

        {/* Seção: Monetization */}
        <div>
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
            Monetization
          </p>
          <div className="space-y-1">
            <NavItem href="/dashboard/revenue" icon={<BarChart3 className="w-4 h-4" />} label="Revenue" />
            <NavItem href="/dashboard/orders" icon={<ShoppingCart className="w-4 h-4" />} label="Orders" />
            <NavItem href="/dashboard/discounts" icon={<Tag className="w-4 h-4" />} label="Discounts" />
          </div>
        </div>

        {/* Seção: Settings */}
        <div>
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
            Settings
          </p>
          <div className="space-y-1">
            <NavItem href="/dashboard/settings" icon={<Settings className="w-4 h-4" />} label="Configuration" />
          </div>
        </div>

      </nav>
    </aside>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}