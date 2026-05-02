//src/components/dashboard/ProjectsList.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, MapPin, Calendar, Clock, AlertCircle, HardHat, CheckCircle, FileText, Flame, Activity, Loader2, Lock, Search, UserCircle, ArrowUpDown
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { CreateProjectModal } from "./CreateProjectModal";
import { EmitParecerModal } from "./EmitParecerModal";
import { useRouter, useSearchParams } from "next/navigation";
import { MapViewerModal } from "../ui/MapViewer";
import { ProjectStatus, Project, TabType } from "@/types/project";
import { listProjects } from "@/lib/services/projectService";

export function ProjectsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>("MINE");
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState<"PRIORITY_DESC" | "PRIORITY_ASC" | "NEWEST" | "OLDEST">("PRIORITY_DESC");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectForParecer, setProjectForParecer] = useState<Project | null>(null);
  const [mapLocationView, setMapLocationView] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]); // Usando any temporário para suportar o createdAt numérico
  const [isLoading, setIsLoading] = useState(true);

  const currentOrg = useSelector(selectCurrentOrg);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const userId = user?.sub || (user as any)?._id || (user as any)?.id;

  const getOrgId = (): string => {
    if (!currentOrg?.organizationId) return "";
    if (typeof currentOrg.organizationId === "object" && "_id" in currentOrg.organizationId) {
      return (currentOrg.organizationId as any)._id;
    }
    return currentOrg.organizationId as string;
  };
  const orgId = getOrgId();

  const isOrgAdmin = currentOrg?.role === 'OWNER' || currentOrg?.role === 'ADMIN';

  const fetchProjects = async () => {
    if (!orgId || !token) return;

    try {
      setIsLoading(true);

      const rawData = await listProjects(orgId);

      const formattedProjects = rawData.map((p: any) => {
        const formatDate = (dateString?: string) => {
          if (!dateString) return undefined;
          return new Date(dateString).toLocaleDateString('pt-BR');
        };

        return {
          id: p._id,
          referenceCode: p.referenceCode,
          title: p.title,
          description: p.description,
          status: p.status as ProjectStatus,
          progress: p.progress || 0,
          location: p.location,
          startDate: formatDate(p.startDate),
          endDate: formatDate(p.endDate),
          priorityScore: p.priorityScore || 0,
          createdAt: new Date(p.createdAt || new Date()).getTime(),
          assignedMembers: p.assignedMembers || [],
          attachments: p.attachments || [],
          lastUpdate: p.lastEventId ? {
            id: p.lastEventId._id,
            date: new Date(p.lastEventId.createdAt || p.updatedAt).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
            }),
            author: p.lastEventId.authorId?.name || "Sistema",
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

  useEffect(() => {
    fetchProjects();
  }, [orgId, token]);

  useEffect(() => {
    if (urlTab && ["ALL", "MINE", "DEMAND", "PLANNING", "EXECUTION", "COMPLETED", "INVALID"].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const isUserAssigned = (assignedMembers: any[]) => {
    const currentUserId = String(user?.sub || (user as any)?._id || (user as any)?.id || "");
    if (!currentUserId || currentUserId === "undefined") return false;

    return assignedMembers?.some((m: any) => {
      if (typeof m === 'string') return m === currentUserId;
      if (m && typeof m === 'object') return String(m._id || m.id || "") === currentUserId;
      return false;
    });
  };

  const counts = {
    MINE: projects.filter(p => isUserAssigned(p.assignedMembers || [])).length,
    ALL: projects.length,
    DEMAND: projects.filter(p => p.status === "DEMAND").length,
    PLANNING: projects.filter(p => p.status === "PLANNING").length,
    EXECUTION: projects.filter(p => p.status === "EXECUTION").length,
    COMPLETED: projects.filter(p => p.status === "COMPLETED").length,
    INVALID: projects.filter(p => p.status === "INVALID").length,
  };

  // MOTOR DE BUSCA E ORDENAÇÃO
  const filteredProjects = projects.filter((p) => {
    let matchesTab = false;
    if (activeTab === "ALL") matchesTab = true;
    else if (activeTab === "MINE") matchesTab = isUserAssigned(p.assignedMembers || []);
    else matchesTab = p.status === activeTab;

    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.referenceCode && p.referenceCode.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.location && p.location.toLowerCase().includes(term));

    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    // Aplica a regra de ordenação escolhida no Select
    switch (sortBy) {
      case "PRIORITY_DESC": return b.priorityScore - a.priorityScore; // Maior prioridade primeiro
      case "PRIORITY_ASC": return a.priorityScore - b.priorityScore;  // Menor prioridade primeiro
      case "NEWEST": return b.createdAt - a.createdAt;                // Mais recentes primeiro
      case "OLDEST": return a.createdAt - b.createdAt;                // Mais antigos primeiro
      default: return 0;
    }
  });

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case "DEMAND": return { label: "Demanda", icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" };
      case "PLANNING": return { label: "Planejamento", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "EXECUTION": return { label: "Em Execução", icon: HardHat, color: "text-amber-600", bg: "bg-amber-600/10" };
      case "COMPLETED": return { label: "Concluída", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case "INVALID": return { label: "Inválida", icon: Lock, color: "text-muted-foreground", bg: "bg-muted/10" };
      default: return { label: "Desconhecido", icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/10" };
    }
  };

  const getPriorityConfig = (score?: number) => {
    if (!score) return null;
    if (score >= 100) return { label: `Crítica (${score})`, icon: Flame, color: "text-red-600", bg: "bg-red-600/10 border-red-200" };
    if (score >= 60) return { label: `Alta (${score})`, icon: Activity, color: "text-orange-600", bg: "bg-orange-600/10 border-orange-200" };
    if (score >= 30) return { label: `Média (${score})`, icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-600/10 border-blue-200" };
    return { label: `Baixa (${score})`, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-600/10 border-emerald-200" };
  };

  const tabs = [
    { id: "MINE", label: "Minhas Obras", icon: UserCircle, count: counts.MINE },
    { id: "ALL", label: "Todas", count: counts.ALL },
    { id: "DEMAND", label: "Demandas", count: counts.DEMAND },
    { id: "PLANNING", label: "Planejamento", count: counts.PLANNING },
    { id: "EXECUTION", label: "Em Execução", count: counts.EXECUTION },
    { id: "COMPLETED", label: "Concluídas", count: counts.COMPLETED },
    { id: "INVALID", label: "Inválidas", count: counts.INVALID },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-6 text-foreground pb-24 relative min-h-[calc(100vh-4rem)]">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Demandas e Projetos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe o ciclo de vida e a timeline das suas frentes de trabalho.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden md:flex bg-primary text-primary-foreground px-5 py-2.5 rounded-md shadow-sm hover:bg-primary/90 transition-colors items-center justify-center gap-2 font-semibold text-sm h-10"
        >
          <Plus className="w-4 h-4" />
          Nova Demanda
        </button>
      </div>

      {/* BARRA DE PESQUISA E FILTRO DE ORDENAÇÃO */}
      <div className="flex flex-col md:flex-row items-center gap-3 w-full">
        {/* Input de Busca */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Buscar por código, título ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-all"
          />
        </div>

        {/* Dropdown de Ordenação */}
        <div className="relative w-full md:w-auto flex items-center gap-2 ml-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="flex h-10 w-full md:w-[220px] rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm appearance-none cursor-pointer"
          >
            <option value="PRIORITY_DESC">Maior Prioridade</option>
            <option value="PRIORITY_ASC">Menor Prioridade</option>
            <option value="NEWEST">Mais Recentes</option>
            <option value="OLDEST">Mais Antigas</option>
          </select>
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS */}
      <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide border-b border-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-md"
                }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista de Cards */}
      <div className="flex flex-col space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Sincronizando com o canteiro...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-md border border-dashed border-border flex flex-col items-center justify-center">
            {activeTab === "MINE" && !searchTerm ? (
              <>
                <UserCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-foreground font-semibold">Você não está alocado em nenhuma obra.</p>
                <p className="text-muted-foreground text-sm mt-1">Quando um administrador te adicionar a uma equipe, a demanda aparecerá aqui.</p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                {searchTerm ? "Nenhum registro encontrado para sua busca." : "Nenhum registro encontrado nesta fase."}
              </p>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => {
            const statusConfig = getStatusConfig(project.status);
            const StatusIcon = statusConfig.icon;
            const priorityConfig = getPriorityConfig(project.priorityScore);
            const PriorityIcon = priorityConfig?.icon;
            const hasPermission = isOrgAdmin || isUserAssigned(project.assignedMembers || []);

            return (
              <div
                key={project.id}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                className="bg-card border border-border rounded-md p-4 shadow-sm flex flex-col gap-4 cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    {project.referenceCode && (
                      <span className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                        {project.referenceCode}
                      </span>
                    )}
                    <h3 className="font-semibold text-base leading-tight">{project.title}</h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-muted-foreground mt-1.5 text-xs font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMapLocationView(project.location || null);
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{project.location || 'Local não encontrado'}</span>
                    </div>
                  </div>

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

                {project.lastUpdate && (
                  <div className="bg-muted/30 rounded-md p-3 border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Última Atualização</span>
                    </div>
                    <div className="text-sm text-foreground line-clamp-2">
                      <span className="font-semibold text-primary">{project.lastUpdate.author}:</span> {project.lastUpdate.description}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {project.lastUpdate.date}
                    </p>
                  </div>
                )}

                {project.status === "DEMAND" && (
                  <div className="pt-2">
                    <button
                      disabled={!hasPermission}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasPermission) {
                          setProjectForParecer(project);
                        }
                      }}
                      title={!hasPermission ? "Você não está alocado nesta demanda." : ""}
                      className={`w-full py-2 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${hasPermission
                        ? 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                        : 'bg-muted text-muted-foreground/50 border border-border cursor-not-allowed'
                        }`}
                    >
                      {!hasPermission ? <Lock className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                      Emitir Parecer
                    </button>
                  </div>
                )}

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

      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center z-50"
        title="Nova Demanda / Obra"
      >
        <Plus className="w-6 h-6" />
      </button>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchProjects()}
      />

      <EmitParecerModal
        isOpen={!!projectForParecer}
        onClose={() => setProjectForParecer(null)}
        project={projectForParecer as any}
        onSuccess={() => fetchProjects()}
      />

      <MapViewerModal
        isOpen={!!mapLocationView}
        onClose={() => setMapLocationView(null)}
        locationString={mapLocationView || ""}
      />

    </div>
  );
}