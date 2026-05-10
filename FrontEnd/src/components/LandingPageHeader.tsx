//src/components/LandingPage.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart3,
  Activity,
  Clock,
  Target,
  Flame,
  CheckCircle,
  FileText,
  Award,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import LogoBloco from "./LogoBloco";
import { Footer } from "./Footer";

// Componente para as Badges de Recurso
function FeatureBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
      {children}
    </span>
  );
}

// Dados dos Recursos para fácil edição
const FEATURES = [
  {
    icon: Activity,
    title: "A Linha do Tempo Definitiva",
    description: "Cada parecer, diário de obra ou mudança de status vira um card na timeline. Auditoria e transparência em tempo real, do início ao fim do projeto."
  },
  {
    icon: Target,
    title: "Priorização Inteligente (Matriz GUT)",
    description: "Separe o ruído do que é crítico. Pontue demandas de 1 a 125 baseadas em Gravidade, Urgência e Tendência, e ataque o que importa primeiro."
  },
  {
    icon: FileText,
    title: "Laudos Técnicos em Modo Foco",
    description: "Uma experiência de escrita 'Word-like' imersiva. Escreva laudos detalhados com facilidade no computador ou no celular de forma responsiva."
  },
  {
    icon: ShieldCheck,
    title: "Rastreabilidade Inviolável (PRC)",
    description: "Cada parecer técnico gera um Código de Referência único (ex: PRC-2026-A9F2) pronto para citação oficial e futura exportação validada por QR Code."
  }
];

export function LandingPageHeader() {
  return (
    <div>

      {/* 1. HEADER / NAVBAR COMPACTA */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <LogoBloco />
          <div className="flex items-center gap-3">
            <Link href="/signup" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Criar Conta Grátis
            </Link>
            <Link href="/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm">
              Entrar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>    

    </div>
  );
}