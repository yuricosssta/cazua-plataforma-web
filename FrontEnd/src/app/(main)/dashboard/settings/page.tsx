//src/app/(main)/dashboard/settings/page.tsx
"use client";

import React from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/redux/store";
import { logout } from "@/lib/redux/slices/authSlice";
import { clearOrganizationState } from "@/lib/redux/slices/organizationSlice";
import { DataManagement } from "@/components/dashboard/settings/DataManagement";
import { LogOut } from "lucide-react";

export default function GeneralSettingsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearOrganizationState());
    localStorage.removeItem('token'); 
    window.location.replace('/login');
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">
      
      {/* Cabeçalho */}
      <div className="border-b border-border pb-6 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Configurações Gerais</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ajustes globais do sistema e gestão de dados sensíveis.
        </p>
      </div>

      <div className="flex flex-col space-y-8">
        
        {/* Gestão de Dados (Componente Isolado) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gestão e Importação</h2>
          <DataManagement />
        </div>
        
        {/* Zona de Perigo / Logout */}
        <div className="space-y-3 pt-6 border-t border-border">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Acesso</h2>
          <section className="flex items-center justify-between border border-border bg-card p-5 rounded-sm shadow-sm">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">Encerrar Sessão</h3>
              <p className="text-xs text-muted-foreground mt-1">Sair da sua conta global no Cazuá de forma segura.</p>
            </div>
            <button 
              onClick={handleLogout}
              className="h-9 px-4 py-2 bg-secondary text-secondary-foreground border border-border rounded-sm text-sm font-bold hover:bg-muted transition-colors shadow-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </section>
        </div>

      </div>
    </div>
  );
}