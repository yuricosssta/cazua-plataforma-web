//src/components/dashboard/ProjectsList.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, MapPin, Calendar, Clock, AlertCircle, HardHat, CheckCircle, FileText, Flame, Activity, Loader2 
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import axios from "axios";
import { CreateProjectModal } from "./CreateProjectModal";
import { EmitParecerModal } from "./EmitParecerModal";

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
  progress: number;
  location: string;
  startDate?: string;
  endDate?: string;
  priorityScore?: number;
  lastUpdate: ProjectTimelineEvent;
  attachments: string[];
}

export function ProjectsList() {
  const [activeTab, setActiveTab] = useState<ProjectStatus | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectForParecer, setProjectForParecer] = useState<{id: string, title: string, status: string} | null>(null);
  
  // ESTADOS DO BACKEND
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // REDUX: Extração segura da organização e token
  const currentOrg = useSelector(selectCurrentOrg);
  const token = useSelector((state: RootState) => state.auth.token);

  const getOrgId = (): string => {
    if (!currentOrg?.organizationId) return "";
    if (typeof currentOrg.organizationId === "object" && "_id" in currentOrg.organizationId) {
      return (currentOrg.organizationId as any)._id;
    }
    return currentOrg.organizationId as string;
  };
  const orgId = getOrgId();

  // FUNÇÃO QUE BUSCA AS OBRAS REAIS NO NESTJS
  const fetchProjects = async () => {
    if (!orgId || !token) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${orgId}/projects`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // ADAPTER: Transforma os dados do MongoDB (Back) no formato que a Tela (Front) precisa
      const formattedProjects: Project[] = response.data.map((p: any) => {
        // Formatação segura da data
        const formatDate = (dateString?: string) => {
          if (!dateString) return undefined;
          return new Date(dateString).toLocaleDateString('pt-BR');
        };

        return {
          id: p._id,
          title: p.title,
          status: p.status,
          progress: p.progress || 0,
          location: p.location,
          startDate: formatDate(p.startDate),
          endDate: formatDate(p.endDate),
          priorityScore: p.priorityScore,
          attachments: p.attachments || [],
          // Mapeia a timeline (com fallback caso a obra não tenha eventos ainda)
          lastUpdate: p.lastEventId ? {
            id: p.lastEventId._id,
            // O Mongoose usa createdAt por padrão se não definirmos o campo 'date' explicitamente
            date: new Date(p.lastEventId.createdAt || p.updatedAt).toLocaleString('pt-BR', { 
              day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' 
            }),
            // Futuramente faremos o populate do autor no backend para trazer o nome real
            author: "Autor aqui", 
            description: p.lastEventId.description,
            type: p.lastEventId.type
          } : {
            id: "fallback",
            date: formatDate(p.createdAt) || "Data desconhecida",
            author: "Sistema",
            description: "Demanda criada no sistema.",
            type: "STATUS_CHANGE"
          }
        };
      });

      setProjects(formattedProjects);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Dispara a busca assim que o componente monta na tela (ou se o orgId mudar)
  useEffect(() => {
    fetchProjects();
  }, [orgId, token]);

  // Filtro Inteligente e Ordenação (Mantém a Matriz GUT no topo)
  const filteredProjects = projects.filter(
    (p) => activeTab === "ALL" || p.status === activeTab
  ).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case "DEMAND": return { label: "Demanda", icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" };
      case "PLANNING": return { label: "Planejamento", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "EXECUTION": return { label: "Em Execução", icon: HardHat, color: "text-amber-600", bg: "bg-amber-600/10" };
      case "COMPLETED": return { label: "Concluída", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    }
  };

  const getPriorityConfig = (score?: number) => {
    if (!score) return null;
    if (score >= 100) return { label: `Crítica (${score})`, icon: Flame, color: "text-red-600", bg: "bg-red-600/10 border-red-200" };
    if (score >= 60) return { label: `Alta (${score})`, icon: Activity, color: "text-orange-600", bg: "bg-orange-600/10 border-orange-200" };
    if (score >= 30) return { label: `Média (${score})`, icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-600/10 border-blue-200" };
    return { label: `Baixa (${score})`, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-600/10 border-emerald-200" };
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

      {/* Navegação por Abas */}
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

      {/* Lista de Cards com Estado de Loading */}
      <div className="flex flex-col space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Sincronizando com o canteiro...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground text-sm">Nenhum registro encontrado nesta fase.</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const statusConfig = getStatusConfig(project.status);
            const StatusIcon = statusConfig.icon;
            const priorityConfig = getPriorityConfig(project.priorityScore);
            const PriorityIcon = priorityConfig?.icon;

            return (
              <div 
                key={project.id} 
                className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-primary/50 transition-colors"
              >
                {/* Header do Card */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base leading-tight">{project.title}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground mt-1.5 text-xs">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                    
                    {priorityConfig && PriorityIcon && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${priorityConfig.bg} ${priorityConfig.color}`}>
                        <PriorityIcon className="w-3 h-3" />
                        {priorityConfig.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progresso */}
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

                {/* Timeline Snippet */}
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

                {project.status === "DEMAND" && (
                  <div className="pt-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Evita clicar no card inteiro acidentalmente
                        setProjectForParecer({ id: project.id, title: project.title, status: project.status });
                      }}
                      className="w-full py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      Emitir Parecer
                    </button>
                  </div>
                )}

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

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 md:absolute md:bottom-0 md:right-0 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 flex items-center justify-center z-50 group"
        title="Nova Demanda / Obra"
      >
        <Plus className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out md:group-hover:ml-2 md:group-hover:mr-1 font-medium text-sm">
          Nova Demanda
        </span>
      </button>

      {/* MODAL CONECTADO AO REFTECH */}
      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          fetchProjects();
        }}
      />

      <EmitParecerModal
        isOpen={!!projectForParecer}
        onClose={() => setProjectForParecer(null)}
        project={projectForParecer}
        onSuccess={() => {
          fetchProjects(); 
        }}
      />

    </div>
  );
}

// "use client";

// import React, { useState } from "react";
// import {
//   Plus,
//   MapPin,
//   Calendar,
//   Clock,
//   AlertCircle,
//   HardHat,
//   CheckCircle,
//   FileText,
//   Flame,
//   Activity
// } from "lucide-react";
// import { CreateProjectModal } from "./CreateProjectModal";

// type ProjectStatus = "DEMAND" | "PLANNING" | "EXECUTION" | "COMPLETED";

// interface ProjectTimelineEvent {
//   id: string;
//   date: string;
//   author: string;
//   description: string;
//   type: "COMMENT" | "STATUS_CHANGE" | "DOCUMENT" | "REPORT";
// }

// interface Project {
//   id: string;
//   title: string;
//   status: ProjectStatus;
//   progress: number;
//   location: string;
//   startDate?: string;
//   endDate?: string;
//   priorityScore?: number; // <-- NOVO: Nossa Matriz GUT (1 a 125)
//   lastUpdate: ProjectTimelineEvent;
//   attachments: string[];
// }

// // DADOS MOCKADOS: Agora com pontuação de prioridade
// const MOCK_PROJECTS: Project[] = [
//   {
//     id: "proj-003",
//     title: "Infiltração na Escola Municipal",
//     status: "DEMAND",
//     progress: 0,
//     location: "Zona Rural",
//     priorityScore: 125, // Máxima urgência (5x5x5)
//     attachments: [],
//     lastUpdate: {
//       id: "ev-03",
//       date: "02/03/2026",
//       author: "Yuri (Engenharia)",
//       description: "Parecer emitido: Risco de desabamento do teto. Prioridade Crítica.",
//       type: "COMMENT"
//     }
//   },
//   {
//     id: "proj-001",
//     title: "Recapeamento Av. Bias Fortes",
//     status: "EXECUTION",
//     progress: 45,
//     location: "Centro, Barbacena - MG",
//     priorityScore: 80, // Prioridade Alta
//     startDate: "10/02/2026",
//     endDate: "30/04/2026",
//     attachments: [],
//     lastUpdate: {
//       id: "ev-01",
//       date: "Hoje, 08:30",
//       author: "Yuri",
//       description: "Diário de Obra enviado: Fresagem concluída no trecho 2.",
//       type: "REPORT"
//     }
//   },
//   {
//     id: "proj-002",
//     title: "Edifício Residencial Cazuá Tech",
//     status: "PLANNING",
//     progress: 0,
//     location: "Bairro São José",
//     priorityScore: 45, // Prioridade Média
//     startDate: "Previsto: Mai/2026",
//     attachments: [],
//     lastUpdate: {
//       id: "ev-02",
//       date: "Ontem, 16:45",
//       author: "Arquiteta Responsável",
//       description: "Projeto Básico anexado para aprovação (TAP).",
//       type: "DOCUMENT"
//     }
//   },
//   {
//     id: "proj-004",
//     title: "Reforma da Guarita Principal",
//     status: "COMPLETED",
//     progress: 100,
//     location: "Sede Administrativa",
//     priorityScore: 15, // Prioridade Baixa
//     startDate: "15/01/2026",
//     endDate: "28/02/2026",
//     attachments: ["termo_recebimento.pdf"],
//     lastUpdate: {
//       id: "ev-04",
//       date: "28/02/2026",
//       author: "Yuri",
//       description: "Termo de Encerramento assinado. Obra entregue.",
//       type: "STATUS_CHANGE"
//     }
//   }
// ];

// export function ProjectsList() {
//   const [activeTab, setActiveTab] = useState<ProjectStatus | "ALL">("ALL");
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   // Filtro inteligente + ORDENAÇÃO POR PRIORIDADE (Maior para Menor)
//   const filteredProjects = MOCK_PROJECTS.filter(
//     (p) => activeTab === "ALL" || p.status === activeTab
//   ).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

//   const getStatusConfig = (status: ProjectStatus) => {
//     switch (status) {
//       case "DEMAND": return { label: "Demanda", icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" };
//       case "PLANNING": return { label: "Planejamento", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
//       case "EXECUTION": return { label: "Em Execução", icon: HardHat, color: "text-amber-600", bg: "bg-amber-600/10" };
//       case "COMPLETED": return { label: "Concluída", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" };
//     }
//   };

//   // Termômetro Visual da Matriz GUT
//   const getPriorityConfig = (score?: number) => {
//     if (!score) return null;
//     if (score >= 100) return { label: `Crítica (${score})`, icon: Flame, color: "text-red-600", bg: "bg-red-600/10 border-red-200" };
//     if (score >= 60) return { label: `Alta (${score})`, icon: Activity, color: "text-orange-600", bg: "bg-orange-600/10 border-orange-200" };
//     if (score >= 30) return { label: `Média (${score})`, icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-600/10 border-blue-200" };
//     return { label: `Baixa (${score})`, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-600/10 border-emerald-200" };
//   };

//   return (
//     <div className="max-w-4xl mx-auto w-full flex flex-col space-y-6 text-foreground pb-24 relative min-h-screen">

//       {/* Cabeçalho */}
//       <div>
//         <h1 className="text-2xl font-bold tracking-tight">Obras e Demandas</h1>
//         <p className="text-muted-foreground mt-1 text-sm">
//           Acompanhe o ciclo de vida e a timeline das suas frentes de trabalho.
//         </p>
//       </div>

//       {/* Navegação por Abas */}
//       <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide border-b border-border">
//         {[
//           { id: "ALL", label: "Todas" },
//           { id: "DEMAND", label: "Demandas" },
//           { id: "PLANNING", label: "Planejamento" },
//           { id: "EXECUTION", label: "Execução" },
//           { id: "COMPLETED", label: "Concluídas" }
//         ].map((tab) => (
//           <button
//             key={tab.id}
//             onClick={() => setActiveTab(tab.id as any)}
//             className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
//               ? "border-primary text-primary"
//               : "border-transparent text-muted-foreground hover:text-foreground"
//               }`}
//           >
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Lista de Cards */}
//       <div className="flex flex-col space-y-4">
//         {filteredProjects.length === 0 ? (
//           <div className="text-center py-12 bg-card rounded-lg border border-dashed border-border">
//             <p className="text-muted-foreground text-sm">Nenhum registro encontrado nesta fase.</p>
//           </div>
//         ) : (
//           filteredProjects.map((project) => {
//             const statusConfig = getStatusConfig(project.status);
//             const StatusIcon = statusConfig.icon;
//             const priorityConfig = getPriorityConfig(project.priorityScore);
//             const PriorityIcon = priorityConfig?.icon;

//             return (
//               <div
//                 key={project.id}
//                 className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-primary/50 transition-colors"
//               >
//                 {/* Header do Card (Título na Esquerda, Badges na Direita) */}
//                 <div className="flex justify-between items-start gap-3">
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-base leading-tight">{project.title}</h3>
//                     <div className="flex items-center gap-1 text-muted-foreground mt-1.5 text-xs">
//                       <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
//                       <span className="truncate">{project.location}</span>
//                     </div>
//                   </div>

//                   {/* Container de Badges (Status + Prioridade) */}
//                   <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
//                     <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
//                       <StatusIcon className="w-3 h-3" />
//                       {statusConfig.label}
//                     </span>

//                     {priorityConfig && PriorityIcon && (
//                       <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${priorityConfig.bg} ${priorityConfig.color}`}>
//                         <PriorityIcon className="w-3 h-3" />
//                         {priorityConfig.label}
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 {/* Progresso (Visível apenas em Execução/Concluída) */}
//                 {(project.status === "EXECUTION" || project.status === "COMPLETED") && (
//                   <div className="space-y-1.5">
//                     <div className="flex justify-between text-xs font-medium">
//                       <span>Avanço Físico</span>
//                       <span>{project.progress}%</span>
//                     </div>
//                     <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
//                       <div
//                         className={`h-full rounded-full transition-all duration-500 ${project.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
//                         style={{ width: `${project.progress}%` }}
//                       />
//                     </div>
//                   </div>
//                 )}

//                 {/* Timeline Snippet */}
//                 <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
//                   <div className="flex items-center gap-2 mb-1">
//                     <Clock className="w-3.5 h-3.5 text-muted-foreground" />
//                     <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Última Atualização</span>
//                   </div>
//                   <p className="text-sm text-foreground line-clamp-2">
//                     <span className="font-semibold">{project.lastUpdate.author}:</span> {project.lastUpdate.description}
//                   </p>
//                   <p className="text-xs text-muted-foreground mt-1">
//                     {project.lastUpdate.date}
//                   </p>
//                 </div>

//                 {/* Footer do Card com Datas */}
//                 <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
//                   {project.startDate && (
//                     <div className="flex items-center gap-1.5">
//                       <Calendar className="w-3.5 h-3.5" />
//                       <span>Início: {project.startDate}</span>
//                     </div>
//                   )}
//                   {project.endDate && (
//                     <div className="flex items-center gap-1.5">
//                       <CheckCircle className="w-3.5 h-3.5" />
//                       <span>Fim: {project.endDate}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </div>

//       {/* Floating Action Button */}
//       <button
//         onClick={() => setIsModalOpen(true)}
//         className="fixed bottom-6 right-6 md:absolute md:bottom-0 md:right-0 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 flex items-center justify-center z-50 group"
//         title="Nova Demanda / Projeto"
//       >
//         <Plus className="w-6 h-6" />
//         <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out md:group-hover:ml-2 md:group-hover:mr-1 font-medium text-sm">
//           Nova Demanda
//         </span>
//       </button>

//       <CreateProjectModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSuccess={() => {
//           alert("Demanda criada com sucesso!");
//           // Mais tarde, chamaremos a função fetchProjects() aqui para atualizar a tela
//         }}
//       />

//     </div>
//   );
// }