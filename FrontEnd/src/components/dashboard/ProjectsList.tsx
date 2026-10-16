//src/components/dashboard/ProjectsList.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, MapPin, Calendar, Clock, AlertCircle, HardHat, CheckCircle, FileText, Flame, Activity, Lock, Search, UserCircle, ArrowUpDown, ChevronDown, SlidersHorizontal, PauseCircle
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
import { TabPreferencesModal } from "./TabPreferencesModal";

import { getStatusConfig, getPriorityConfig } from "@/lib/projectConfig";
import { getOrgId, isUserAssigned } from "@/lib/projectHelpers";
import { Badge } from "./Badge";

export function ProjectsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>("MINE");
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState<"PRIORITY_DESC" | "PRIORITY_ASC" | "NEWEST" | "OLDEST">("PRIORITY_DESC");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [projectForParecer, setProjectForParecer] = useState<Project | null>(null);
  const [mapLocationView, setMapLocationView] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const allAvailableTabs: TabType[] = ["MINE", "ALL", "DEMAND", "PLANNING", "EXECUTION", "COMPLETED", "ON_HOLD", "INVALID"];
  const [visibleTabs, setVisibleTabs] = useState<string[]>(allAvailableTabs);

  const currentOrg = useSelector(selectCurrentOrg);
  const user = useSelector((state: RootState) => state.auth.user);

  const userId = user?.sub || (user as any)?._id || (user as any)?.id;
  const orgId = getOrgId(currentOrg);


  const isOrgAdmin = currentOrg?.role === 'OWNER' || currentOrg?.role === 'ADMIN';

  useEffect(() => {
    const savedPreferences = localStorage.getItem("cazua_tab_preferences");
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleTabs(parsed);
          if (!parsed.includes(activeTab)) {
            setActiveTab(parsed[0] as TabType);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar preferências de abas", e);
      }
    }
  }, []);

  const handleToggleTabVisibility = (tabId: string) => {
    let newPreferences;
    if (visibleTabs.includes(tabId)) {
      if (visibleTabs.length === 1) return; 
      newPreferences = visibleTabs.filter(id => id !== tabId);
    } else {
      newPreferences = [...visibleTabs, tabId];
    }
    setVisibleTabs(newPreferences);
    localStorage.setItem("cazua_tab_preferences", JSON.stringify(newPreferences));
    
    if (!newPreferences.includes(activeTab) && newPreferences.length > 0) {
      setActiveTab(newPreferences[0] as TabType);
    }
  };

  const fetchProjects = async () => {
    if (!orgId) return;

    try {
      setIsLoading(true);
      setHasError(false);

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
          } : null
        };
      });

      setProjects(formattedProjects);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [orgId]);

  useEffect(() => {
    if (urlTab && allAvailableTabs.includes(urlTab)) {
      setActiveTab(urlTab);
      if (!visibleTabs.includes(urlTab)) {
        handleToggleTabVisibility(urlTab);
      }
    }
  }, [urlTab]);

  const counts = {
    MINE: projects.filter(p => isUserAssigned(p.assignedMembers || [], userId)).length,
    ALL: projects.length,
    DEMAND: projects.filter(p => p.status === "DEMAND").length,
    PLANNING: projects.filter(p => p.status === "PLANNING").length,
    EXECUTION: projects.filter(p => p.status === "EXECUTION").length,
    COMPLETED: projects.filter(p => p.status === "COMPLETED").length,
    ON_HOLD: projects.filter(p => p.status === "ON_HOLD").length,
    INVALID: projects.filter(p => p.status === "INVALID").length,
  };

  const filteredProjects = projects.filter((p) => {
    let matchesTab = false;
    if (activeTab === "ALL") matchesTab = true;
    else if (activeTab === "MINE") matchesTab = isUserAssigned(p.assignedMembers || [], userId);
    else matchesTab = p.status === activeTab;

    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.referenceCode && p.referenceCode.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.location && p.location.toLowerCase().includes(term));

    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case "PRIORITY_DESC": return b.priorityScore - a.priorityScore;
      case "PRIORITY_ASC": return a.priorityScore - b.priorityScore;  
      case "NEWEST": return b.createdAt - a.createdAt;                
      case "OLDEST": return a.createdAt - b.createdAt;                
      default: return 0;
    }
  });

  const allTabsConfig = [
    { id: "MINE", label: "Minhas", icon: UserCircle, count: counts.MINE },
    { id: "ALL", label: "Todas", count: counts.ALL },
    { id: "DEMAND", label: "Demandas", count: counts.DEMAND },
    { id: "PLANNING", label: "Planejamento", count: counts.PLANNING },
    { id: "EXECUTION", label: "Em Execução", count: counts.EXECUTION },
    { id: "ON_HOLD", label: "Paralisadas", count: counts.ON_HOLD },
    { id: "COMPLETED", label: "Concluídas", count: counts.COMPLETED },
    { id: "INVALID", label: "Inválidas", count: counts.INVALID },
  ];

  const tabsToRender = allTabsConfig.filter(tab => visibleTabs.includes(tab.id));

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col space-y-3 text-foreground pb-24 relative min-h-[calc(100vh-4rem)]">
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
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Buscar por código, título ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm transition-all"
          />
        </div>

        <div className="relative w-full md:w-auto flex items-center gap-2 ml-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <select
            aria-label="Ordenar projetos"
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="flex h-11 w-full md:w-[220px] rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm appearance-none cursor-pointer"
          >
            <option value="PRIORITY_DESC">Maior Prioridade</option>
            <option value="PRIORITY_ASC">Menor Prioridade</option>
            <option value="NEWEST">Mais Recentes</option>
            <option value="OLDEST">Mais Antigas</option>
          </select>
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS + BOTÃO DE CONFIGURAÇÃO */}
      <div className="flex items-center border-b border-border">
        <div className="tab-rail flex space-x-1 flex-1">
          {tabsToRender.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-md"
                  }`}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-primary-bg text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => setIsPreferencesModalOpen(true)}
          className="ml-2 p-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors border border-transparent hover:border-border"
          title="Configurar visibilidade das abas"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Cards */}
      <div className="flex flex-col space-y-4">
        {hasError ? (
          <div className="text-center py-12 bg-card rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-card-foreground font-semibold">Erro ao carregar projetos.</p>
            <p className="text-muted-foreground text-sm">Verifique sua conexão e tente novamente.</p>
            <button
              onClick={fetchProjects}
              className="bg-primary text-primary-foreground px-4 py-2.5 min-h-11 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col space-y-4" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-md p-5 shadow-sm animate-pulse space-y-3">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-2/3 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-md border border-dashed border-border flex flex-col items-center justify-center">
            {activeTab === "MINE" && !searchTerm ? (
              <>
                <UserCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-card-foreground font-semibold">Você não está alocado em nenhuma obra.</p>
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
            const priorityConfig = getPriorityConfig(project.priorityScore);
            const hasPermission = isOrgAdmin || isUserAssigned(project.assignedMembers || [], userId);

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
                    <h3 className="font-semibold text-base leading-tight text-card-foreground">{project.title}</h3>
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
                    <Badge icon={statusConfig.icon} label={statusConfig.label} color={statusConfig.color} bg={statusConfig.bg} />

                    {priorityConfig && (
                      <Badge icon={priorityConfig.icon} label={priorityConfig.label} color={priorityConfig.color} bg={priorityConfig.bg} />
                    )}
                  </div>
                </div>

                {(project.status === "EXECUTION" || project.status === "COMPLETED" || project.status === "ON_HOLD") && project.progress !== undefined && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-foreground">
                      <span>Avanço Físico</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          project.status === 'ON_HOLD' ? 'bg-stone-500' :
                          project.progress === 100 ? 'bg-emerald-500' : 'bg-primary'
                        }`}
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
                      className={`w-full py-2.5 min-h-11 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${hasPermission
                        ? 'bg-primary-bg text-primary hover:bg-primary hover:text-primary-foreground'
                        : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
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

      <TabPreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        availableTabs={allTabsConfig.map(t => ({ id: t.id as TabType, label: t.label }))}
        visibleTabs={visibleTabs}
        onToggleTab={handleToggleTabVisibility}
      />
    </div>
  );
}