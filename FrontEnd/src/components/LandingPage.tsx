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

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* 1. HEADER / NAVBAR COMPACTA */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <LogoBloco />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link href="/signup" className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm">
              Criar Conta Grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION - CHAMADA PRINCIPAL */}
      <section className="bg-muted/30 border-b border-border py-20 md:py-28 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <FeatureBadge>
            <Clock className="w-3 h-3" />
            Tech-enabled Construction
          </FeatureBadge>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mt-6 mb-8 text-foreground">
            Sua Obra como ela é:<br />
            <span className="text-primary">Transparente e Rastreável.</span>
          </h1 >
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Elimine o caos de planilhas e o telefone sem fio. Centralize demandas, pareces técnicos e diários de obra em uma <span className="text-foreground font-semibold">Timeline centralizada</span> para engenheiros, gestores e stakeholders.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="flex items-center gap-2 px-8 py-3.5 text-lg font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-transform hover:scale-105 shadow-md">
              Começar agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/learn-more" className="flex items-center gap-2 px-8 py-3.5 text-lg font-medium text-foreground hover:bg-accent rounded-lg transition-colors">
              Como funciona?
            </Link>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION - O QUE RESOLVEMOS */}
      <section className="py-20 md:py-28 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <FeatureBadge>
              <Award className="w-3 h-3" />
              Do Canteiro ao Dashboard
            </FeatureBadge>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-6 mb-6">
              A Engenharia de Gestão que<br /> faltava no seu Canteiro.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Desenhado para a realidade burocrática e operacional das construtoras privadas e obras públicas do Brasil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-card border border-border rounded-xl p-8 shadow-sm flex flex-col gap-6 hover:border-primary/50 hover:shadow-md transition-all">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-base flex-1">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. PREPARANDO TERRENO (EM BREVE) */}
      <section className="py-16 md:py-20 px-6 bg-muted/20 border-t border-b border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              Roadmap: Fase 2
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground">Gestão Integrada de Recursos</h3>
            <p className="text-muted-foreground leading-relaxed max-w-xl">
              Em breve, nosso módulo de estoque e efetivo injetará eventos de custo e produtividade diretamente na Timeline, gerando um histórico financeiro automático da obra.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-shrink-0 text-center">
            <div className="bg-card border border-border p-4 rounded-md text-sm font-semibold text-muted-foreground">RH & Equipe</div>
            <div className="bg-card border border-border p-4 rounded-md text-sm font-semibold text-muted-foreground">Materiais</div>
            <div className="bg-card border border-border p-4 rounded-md text-sm font-semibold text-muted-foreground">Equipamentos</div>
            <div className="bg-card border border-border p-4 rounded-md text-sm font-semibold text-muted-foreground">Avanço Físico %</div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CALL TO ACTION */}
      <section className="py-20 md:py-28 px-6 bg-background text-center">
        <div className="max-w-2xl mx-auto">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8 leading-tight">
            Pronto para digitalizar o controle da sua obra?
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-lg mx-auto leading-relaxed">
            Cadastre-se grátis hoje e comece a mapear suas demandas e obras em uma linha do tempo profissional e segura.
          </p>
          <Link href="/signup" className="flex items-center gap-2 px-8 py-3.5 text-lg font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-transform hover:scale-105 shadow-md mx-auto inline-flex">
            Criar minha conta grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* 6. FOOTER COMPACTO */}
      <footer className="border-t border-border bg-muted/10 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <LogoBloco />
          <p className="text-xs text-muted-foreground font-medium">
            © 2026 Grupo Cazuá. A engenharia de gestão imobiliária começa aqui.
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