"use client";

import React, { useState } from "react";
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertCircle, 
  HardHat, 
  CheckCircle, 
  FileText,
  MessageSquare
} from "lucide-react";

// Tipagem baseada na nossa arquitetura de 4 Fases
type ProjectStatus = "DEMAND" | "PLANNING" | "EXECUTION" | "COMPLETED";

interface ProjectTimelineEvent {
  id: string;
  date: string;
  author: string;
  description: string;
  type: "COMMENT" | "STATUS_CHANGE" | "DOCUMENT" | "REPORT";
}

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: number; // 0 a 100
  location: string;
  startDate?: string;
  endDate?: string;
  lastUpdate: ProjectTimelineEvent;
  attachments: string[]; // Preparado para o futuro (AWS S3)
}

// DADOS MOCKADOS: Refletindo a realidade do campo e gestão
const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-001",
    title: "Recapeamento Av. Bias Fortes",
    status: "EXECUTION",
    progress: 45,
    location: "Centro, Barbacena - MG",
    startDate: "10/02/2026",
    endDate: "30/04/2026",
    attachments: [],
    lastUpdate: {
      id: "ev-01",
      date: "Hoje, 08:30",
      author: "Yuri",
      description: "Diário de Obra enviado: Fresagem concluída no trecho 2.",
      type: "REPORT"
    }
  },
  {
    id: "proj-002",
    title: "Edifício Residencial Cazuá Tech",
    status: "PLANNING",
    progress: 0,
    location: "Bairro São José",
    startDate: "Previsto: Mai/2026",
    attachments: [],
    lastUpdate: {
      id: "ev-02",
      date: "Ontem, 16:45",
      author: "Arquiteta Responsável",
      description: "Projeto Básico anexado para aprovação (TAP).",
      type: "DOCUMENT"
    }
  },
  {
    id: "proj-003",
    title: "Infiltração na Escola Municipal",
    status: "DEMAND",
    progress: 0,
    location: "Zona Rural",
    attachments: [],
    lastUpdate: {
      id: "ev-03",
      date: "02/03/2026",
      author: "Diretoria",
      description: "Abertura de chamado: Infiltração grave no teto do refeitório.",
      type: "COMMENT"
    }
  },
  {
    id: "proj-004",
    title: "Reforma da Guarita Principal",
    status: "COMPLETED",
    progress: 100,
    location: "Sede Administrativa",
    startDate: "15/01/2026",
    endDate: "28/02/2026",
    attachments: ["termo_recebimento.pdf"],
    lastUpdate: {
      id: "ev-04",
      date: "28/02/2026",
      author: "Yuri",
      description: "Termo de Encerramento assinado. Obra entregue.",
      type: "STATUS_CHANGE"
    }
  }
];

export function ProjectsList() {
  const [activeTab, setActiveTab] = useState<ProjectStatus | "ALL">("EXECUTION");

  // Filtro inteligente
  const filteredProjects = MOCK_PROJECTS.filter(
    (p) => activeTab === "ALL" || p.status === activeTab
  );

  // Helper para renderizar o ícone e cor corretos baseado no status
  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case "DEMAND": return { label: "Demanda", icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" };
      case "PLANNING": return { label: "Planejamento", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "EXECUTION": return { label: "Em Execução", icon: HardHat, color: "text-amber-600", bg: "bg-amber-600/10" };
      case "COMPLETED": return { label: "Concluída", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-6 text-foreground pb-24 relative min-h-screen">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Obras e Demandas</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Acompanhe o ciclo de vida e a timeline das suas frentes de trabalho.
        </p>
      </div>

      {/* Navegação por Abas (Scrollável no Mobile) */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide border-b border-border">
        {[
          { id: "ALL", label: "Todas" },
          { id: "DEMAND", label: "Demandas" },
          { id: "PLANNING", label: "Planejamento" },
          { id: "EXECUTION", label: "Execução" },
          { id: "COMPLETED", label: "Concluídas" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de Cards */}
      <div className="flex flex-col space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground text-sm">Nenhum registro encontrado nesta fase.</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const config = getStatusConfig(project.status);
            const StatusIcon = config.icon;

            return (
              <div 
                key={project.id} 
                className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-primary/50 transition-colors"
              >
                {/* Header do Card */}
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-base leading-tight">{project.title}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground mt-1.5 text-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>

                {/* Progresso (Visível apenas em Execução/Concluída) */}
                {(project.status === "EXECUTION" || project.status === "COMPLETED") && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Avanço Físico</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${project.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Timeline Snippet (A "Galinha dos Ovos de Ouro") */}
                <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Última Atualização</span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">
                    <span className="font-semibold">{project.lastUpdate.author}:</span> {project.lastUpdate.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {project.lastUpdate.date}
                  </p>
                </div>

                {/* Footer do Card com Datas */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  {project.startDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Início: {project.startDate}</span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Fim: {project.endDate}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (Mobile-First) */}
      <button 
        className="fixed bottom-6 right-6 md:absolute md:bottom-0 md:right-0 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 flex items-center justify-center z-50 group"
        title="Nova Demanda / Obra"
      >
        <Plus className="w-6 h-6" />
        {/* Texto aparece apenas no Desktop no hover */}
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out md:group-hover:ml-2 md:group-hover:mr-1 font-medium text-sm">
          Nova Demanda
        </span>
      </button>

    </div>
  );
}