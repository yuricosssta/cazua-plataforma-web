//src/app/(main)/dashboard/settings/page.tsx
"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/redux/store";
import { logout } from "@/lib/redux/slices/authSlice";
import { clearOrganizationState } from "@/lib/redux/slices/organizationSlice";
import { DataManagement } from "@/components/dashboard/settings/DataManagement";
import { LogOut, Palette, X } from "lucide-react";
import { BrandingSettings } from "@/components/dashboard/settings/BrandingSettings";
import { StorageManagement } from "@/components/dashboard/settings/StorageManagement";

export default function GeneralSettingsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);

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

        {/* Personalização da empresa (Agora como um botão de chamada) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Identidade Visual</h2>
          <section className="flex items-center justify-between border border-border bg-card p-5 rounded-sm shadow-sm">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">Papel Timbrado e Logomarca</h3>
              <p className="text-xs text-muted-foreground mt-1">Configure o cabeçalho e rodapé para a exportação de Pareceres e Diários de Obra.</p>
            </div>
            <button
              onClick={() => setIsBrandingModalOpen(true)}
              className="h-9 px-4 py-2 bg-primary text-primary-foreground border border-transparent rounded-sm text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
            >
              <Palette className="w-4 h-4" /> Personalizar
            </button>
          </section>
        </div>

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

      {/* --- MODAL DE BRANDING SETTINGS --- */}
      {isBrandingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

            {/* Header do Modal Fixo */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-bold tracking-tight">Configurações de Identidade</h2>
              <button
                onClick={() => setIsBrandingModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo Scrollável (O componente é renderizado aqui) */}
            <div className="p-6 overflow-y-auto">
              <BrandingSettings />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}