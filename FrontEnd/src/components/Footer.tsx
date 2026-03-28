//src/components/Footer.tsx
"use client";

import React from "react";
import LogoBloco from "./LogoBloco";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <div>

      {/* FOOTER COMPACTO */}
      <footer className="border-t border-border bg-muted/10 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <LogoBloco />
          <p className="text-xs text-muted-foreground font-medium">
            © {year} Grupo Cazuá. Gestão Inteligente de Projetos
          </p>
          <div className="text-xs text-muted-foreground space-x-3">
            <span>Privacidade</span>
            <span>Termos</span>
          </div>
        </div>
      </footer>

    </div>   
  );
}