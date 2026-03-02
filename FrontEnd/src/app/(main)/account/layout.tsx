import React from "react";
import { SettingsSidebar } from "@/components/layout/SettingsSidebar";
import { Header } from "@/components/layout/Header";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      
      {/* A nossa nova Sidebar Secundária entra aqui */}
      <SettingsSidebar />

      {/* Área Principal de Conteúdo das Configurações */}
      <main className="flex-1 overflow-auto">
        {/* Adicionei um padding superior generoso para bater com o visual limpo do seu print */}
        <Header />
        <div className="p-10 lg:p-14 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}