//src/components/dashboard/ProjectsList.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef, useDeferredValue, useCallback } from "react";
import Link from "next/link";
import {
  Plus, MapPin, Calendar, Clock, AlertCircle, CheckCircle, Activity, Lock, Search, UserCircle, ArrowUpDown, ChevronDown, SlidersHorizontal, X, Loader2
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg, selectOrgStatus } from "@/lib/redux/slices/organizationSlice";
import { CreateProjectModal } from "./CreateProjectModal";
import { EmitParecerModal } from "./EmitParecerModal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapViewerModal } from "../ui/MapViewer";
import { ProjectStatus, Project, TabType } from "@/types/project";
import { useOrganizationProjects } from "@/lib/hooks/useOrganizationProjects";
import { TabPreferencesModal } from "./TabPreferencesModal";

import { getStatusConfig, getPriorityConfig } from "@/lib/projectConfig";
import { getOrgId, isUserAssigned } from "@/lib/projectHelpers";
import { Badge } from "./Badge";

const ALL_AVAILABLE_TABS: TabType[] = [
  "MINE",
  "ALL",
  "DEMAND",
  "PLANNING",
  "EXECUTION",
  "COMPLETED",
  "ON_HOLD",
  "INVALID",
];

const DEFAULT_VISIBLE_TABS: TabType[] = [
  "MINE",
  "ALL",
  "DEMAND",
  "PLANNING",
  "EXECUTION",
  "COMPLETED",
];

const PROJECTS_PAGE_SIZE = 20;

function normalizeSearchText(value?: string | null): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function ProjectsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(() =>
    urlTab && ALL_AVAILABLE_TABS.includes(urlTab) ? urlTab : "MINE"
  );
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState<"PRIORITY_DESC" | "PRIORITY_ASC" | "NEWEST" | "OLDEST">("PRIORITY_DESC");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [projectForParecer, setProjectForParecer] = useState<Project | null>(null);
  const [mapLocationView, setMapLocationView] = useState<string | null>(null);

  const [visibleTabs, setVisibleTabs] = useState<string[]>(DEFAULT_VISIBLE_TABS);
  const [visibleCount, setVisibleCount] = useState(PROJECTS_PAGE_SIZE);
  const [showTabsRightFade, setShowTabsRightFade] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastUrlTabRef = useRef<TabType | null>(urlTab);

  const currentOrg = useSelector(selectCurrentOrg);
  const orgStatus = useSelector(selectOrgStatus);
  const user = useSelector((state: RootState) => state.auth.user);

  const userId = user?.sub || (user as any)?._id || (user as any)?.id;
  const orgId = getOrgId(currentOrg);
  const projectsQuery = useOrganizationProjects(orgId);


  const isOrgAdmin = currentOrg?.role === 'OWNER' || currentOrg?.role === 'ADMIN';

  useEffect(() => {
    const isUrlTabValid = Boolean(urlTab && ALL_AVAILABLE_TABS.includes(urlTab));
    let baseTabs: TabType[] = [...DEFAULT_VISIBLE_TABS];

    const savedPreferences = localStorage.getItem("cazua_tab_preferences");
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        if (Array.isArray(parsed)) {
          const validSaved = parsed.filter((t): t is TabType =>
            ALL_AVAILABLE_TABS.includes(t)
          );
          if (validSaved.length > 0) {
            baseTabs = validSaved;
          }
        }
      } catch (e) {
        console.error("Erro ao carregar preferências de abas", e);
      }
    }

    const mergedTabs =
      isUrlTabValid && urlTab && !baseTabs.includes(urlTab)
        ? [...baseTabs, urlTab]
        : baseTabs;

    setVisibleTabs(mergedTabs);
    if (isUrlTabValid && urlTab) {
      setActiveTab(urlTab);
    } else if (!mergedTabs.includes(activeTab) && mergedTabs.length > 0) {
      setActiveTab(mergedTabs[0]);
    }
  }, []);

  const handleSelectTab = (tab: TabType) => {
    lastUrlTabRef.current = tab;
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

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
      handleSelectTab(newPreferences[0] as TabType);
    }
  };

  const projects = useMemo(() => {
    const rawData = projectsQuery.data ?? [];
    return rawData.map((p: any) => {
      const formatDate = (dateString?: string) => {
        if (!dateString) return undefined;
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return undefined;
        return date.toLocaleDateString('pt-BR');
      };

      const createdDate = p.createdAt ? new Date(p.createdAt) : new Date();
      const createdTimestamp = Number.isNaN(createdDate.getTime())
        ? 0
        : createdDate.getTime();

      const lastEventRawDate = p.lastEventId
        ? new Date(p.lastEventId.createdAt || p.updatedAt)
        : null;
      const formattedLastEventDate =
        lastEventRawDate && !Number.isNaN(lastEventRawDate.getTime())
          ? lastEventRawDate.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-';

      return {
        id: String(p._id || p.id || ""),
        referenceCode: p.referenceCode,
        title: p.title || "Projeto sem título",
        description: p.description,
        status: p.status as ProjectStatus,
        progress: p.progress || 0,
        location: p.location,
        startDate: formatDate(p.startDate),
        endDate: formatDate(p.endDate),
        priorityScore: p.priorityScore || 0,
        createdAt: p.createdAt,
        createdTimestamp,
        assignedMembers: p.assignedMembers || [],
        attachments: p.attachments || [],
        lastUpdate: p.lastEventId ? {
          id: p.lastEventId._id,
          date: formattedLastEventDate,
          author: p.lastEventId.authorId?.name || "Sistema",
          description: p.lastEventId.description,
          type: p.lastEventId.type
        } : undefined
      };
    });
  }, [projectsQuery.data]);

  const isInitialLoading =
    (!orgId && (orgStatus === "idle" || orgStatus === "loading")) ||
    (Boolean(orgId) && projectsQuery.isPending && !projectsQuery.data);
  const hasError = projectsQuery.isError && !projectsQuery.data;

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
    renderedTabs: Array<{ id: string }>
  ) => {
    if (renderedTabs.length === 0) return;

    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % renderedTabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + renderedTabs.length) % renderedTabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = renderedTabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = renderedTabs[nextIndex].id as TabType;
      handleSelectTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    }
  };

  useEffect(() => {
    if (urlTab === lastUrlTabRef.current) return;
    lastUrlTabRef.current = urlTab;

    if (urlTab && ALL_AVAILABLE_TABS.includes(urlTab)) {
      setActiveTab(urlTab);
      setVisibleTabs((prev) => (prev.includes(urlTab) ? prev : [...prev, urlTab]));
    } else if (!urlTab) {
      setActiveTab((visibleTabs[0] as TabType) || "MINE");
    }
  }, [urlTab, visibleTabs]);

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

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredProjects = useMemo(() => {
    const term = normalizeSearchText(deferredSearchTerm);
    return projects
      .filter((p) => {
        let matchesTab = false;
        if (activeTab === "ALL") matchesTab = true;
        else if (activeTab === "MINE") matchesTab = isUserAssigned(p.assignedMembers || [], userId);
        else matchesTab = p.status === activeTab;

        const matchesSearch = !term ||
          normalizeSearchText(p.title).includes(term) ||
          normalizeSearchText(p.referenceCode).includes(term) ||
          normalizeSearchText(p.description).includes(term) ||
          normalizeSearchText(p.location).includes(term);

        return matchesTab && matchesSearch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "PRIORITY_DESC": return b.priorityScore - a.priorityScore;
          case "PRIORITY_ASC": return a.priorityScore - b.priorityScore;
          case "NEWEST": return b.createdTimestamp - a.createdTimestamp;
          case "OLDEST": return a.createdTimestamp - b.createdTimestamp;
          default: return 0;
        }
      });
  }, [projects, activeTab, userId, deferredSearchTerm, sortBy]);

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
  const visibleProjects = useMemo(
    () => filteredProjects.slice(0, visibleCount),
    [filteredProjects, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(PROJECTS_PAGE_SIZE);
  }, [activeTab, deferredSearchTerm, sortBy, orgId]);

  const updateTabsFade = useCallback(() => {
    const el = tabListRef.current;
    if (!el) {
      setShowTabsRightFade(false);
      return;
    }
    setShowTabsRightFade(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
  }, []);

  useEffect(() => {
    const el = tabListRef.current;
    if (!el) return;

    updateTabsFade();
    el.addEventListener("scroll", updateTabsFade, { passive: true });
    window.addEventListener("resize", updateTabsFade);

    return () => {
      el.removeEventListener("scroll", updateTabsFade);
      window.removeEventListener("resize", updateTabsFade);
    };
  }, [tabsToRender.length, updateTabsFade]);

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col space-y-3 text-foreground pb-24 relative min-h-[calc(100vh-4rem)]">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Demandas e Projetos</h1>
            {projectsQuery.isFetching && !isInitialLoading && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Atualizando...
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe o ciclo de vida e a timeline das suas frentes de trabalho.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="hidden md:flex bg-primary text-primary-foreground px-5 py-2.5 rounded-md shadow-sm hover:bg-primary/90 transition-colors items-center justify-center gap-2 font-semibold text-sm min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            aria-label="Buscar demandas e projetos por código, título ou local"
            placeholder="Buscar por código, título ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex h-11 w-full rounded-md border border-input bg-background pl-10 ${
              searchTerm ? "pr-11" : "pr-3"
            } py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm transition-all`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Limpar busca"
              className="absolute inset-y-0 right-0 min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
        <div className="relative flex-1 min-w-0">
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="Filtrar projetos por status"
            className={`flex space-x-1 overflow-x-auto ${
              showTabsRightFade ? "pr-6" : "pr-0"
            }`}
          >
            {tabsToRender.map((tab, index) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  id={`projects-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="projects-tabpanel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleSelectTab(tab.id as TabType)}
                  onKeyDown={(e) => handleTabKeyDown(e, index, tabsToRender)}
                  className={`relative px-4 min-h-11 py-2.5 text-sm font-semibold whitespace-nowrap rounded-md transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {tab.icon && <tab.icon className="w-4 h-4" />}
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isActive ? "bg-primary-bg text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                    {tab.count}
                  </span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-md"
                    />
                  )}
                </button>
              );
            })}
          </div>
          {showTabsRightFade && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent"
            />
          )}
        </div>
        
        <button
          type="button"
          onClick={() => setIsPreferencesModalOpen(true)}
          aria-label="Configurar visibilidade das abas"
          className="ml-2 min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors border border-transparent hover:border-border shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Configurar visibilidade das abas"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Cards */}
      <div
        id="projects-tabpanel"
        role="tabpanel"
        aria-labelledby={`projects-tab-${activeTab}`}
        className="flex flex-col space-y-4"
      >
        {!orgId && orgStatus === "failed" ? (
          <div
            role="alert"
            className="bg-st-critical-bg border border-st-critical-border text-st-critical p-4 rounded-md flex items-center gap-3 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              Não foi possível carregar as organizações da sua conta. Recarregue
              a página ou tente novamente mais tarde.
            </span>
          </div>
        ) : !orgId && orgStatus === "succeeded" ? (
          <div className="rounded-md border border-dashed border-border bg-card p-8 text-center space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Nenhuma organização selecionada
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Selecione ou crie uma organização para visualizar suas demandas e projetos.
            </p>
          </div>
        ) : hasError ? (
          <div className="text-center py-12 bg-card rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-card-foreground font-semibold">Erro ao carregar projetos.</p>
            <p className="text-muted-foreground text-sm">Verifique sua conexão e tente novamente.</p>
            <button
              type="button"
              onClick={() => projectsQuery.refetch()}
              disabled={projectsQuery.isFetching}
              className="bg-primary text-primary-foreground px-4 py-2.5 min-h-11 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {projectsQuery.isFetching && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {projectsQuery.isFetching ? "Tentando..." : "Tentar novamente"}
            </button>
          </div>
        ) : isInitialLoading ? (
          <div className="flex flex-col space-y-4" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-md p-5 shadow-sm animate-pulse space-y-3">
                <div className="h-4 w-1/3 bg-muted rounded-md" />
                <div className="h-3 w-2/3 bg-muted rounded-md" />
                <div className="h-3 w-1/2 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          (() => {
            const hasSearchTerm = searchTerm.trim().length > 0;
            return (
              <div className="text-center py-12 bg-card rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-3">
                {activeTab === "MINE" && !hasSearchTerm ? (
                  <>
                    <UserCircle className="w-12 h-12 text-muted-foreground/30" />
                    <p className="text-card-foreground font-semibold">Você não está alocado em nenhuma obra.</p>
                    <p className="text-muted-foreground text-sm">Quando um administrador te adicionar a uma equipe, a demanda aparecerá aqui.</p>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm">
                      {hasSearchTerm ? "Nenhum registro encontrado para sua busca." : "Nenhum registro encontrado nesta fase."}
                    </p>
                    {hasSearchTerm && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="px-4 min-h-11 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Limpar busca
                        </button>
                        {activeTab !== "ALL" && (
                          <button
                            type="button"
                            onClick={() => {
                              setVisibleTabs((prev) =>
                                prev.includes("ALL") ? prev : [...prev, "ALL"]
                              );
                              handleSelectTab("ALL");
                            }}
                            className="px-4 min-h-11 text-sm font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Buscar em Todas
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()
        ) : (
          <>
          {visibleProjects.map((project) => {
            const statusConfig = getStatusConfig(project.status);
            const priorityConfig = getPriorityConfig(project.priorityScore);
            const hasPermission = isOrgAdmin || isUserAssigned(project.assignedMembers || [], userId);

            return (
              <article
                key={project.id}
                className="relative bg-card border border-border rounded-md p-4 shadow-sm flex flex-col gap-4 hover:border-primary/50 focus-within:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {project.referenceCode && (
                      <div className="mb-1">
                        <span className="relative z-10 inline-block select-text text-xs font-mono text-muted-foreground">
                          {project.referenceCode}
                        </span>
                      </div>
                    )}
                    <h3 className="font-semibold text-base leading-tight text-card-foreground">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring after:content-[''] after:absolute after:inset-0"
                      >
                        {project.title}
                      </Link>
                    </h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {project.location?.trim() ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMapLocationView(project.location || null);
                        }}
                        aria-label={`Ver localização no mapa: ${project.location}`}
                        className="relative z-10 inline-flex items-center gap-1.5 min-h-11 px-2 -ml-2 mt-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate underline decoration-border underline-offset-2">{project.location}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 py-1 mt-1 text-xs font-medium text-muted-foreground max-w-full">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">Localização não informada</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge icon={statusConfig.icon} label={statusConfig.label} color={statusConfig.color} bg={statusConfig.bg} />

                    {priorityConfig && (
                      <Badge icon={priorityConfig.icon} label={priorityConfig.label} color={priorityConfig.color} bg={priorityConfig.bg} />
                    )}
                  </div>
                </div>

                {(project.status === "EXECUTION" || project.status === "COMPLETED" || project.status === "ON_HOLD") && project.progress !== undefined && (() => {
                  const clampedProgress = Math.min(100, Math.max(0, Number(project.progress) || 0));
                  return (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-foreground">
                        <span>Avanço Físico</span>
                        <span>{clampedProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-md overflow-hidden border border-border/50">
                        <div
                          className={`h-full rounded-md transition-all duration-500 ${
                            project.status === 'ON_HOLD' ? 'bg-st-onhold' :
                            clampedProgress === 100 ? 'bg-st-completed' : 'bg-primary'
                          }`}
                          style={{ width: `${clampedProgress}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

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
                      type="button"
                      disabled={!hasPermission}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasPermission) {
                          setProjectForParecer(project);
                        }
                      }}
                      title={!hasPermission ? "Você não está alocado nesta demanda." : ""}
                      className={`relative z-10 w-full py-2.5 min-h-11 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${hasPermission
                        ? 'bg-primary-bg text-primary hover:bg-primary hover:text-primary-foreground'
                        : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
                        }`}
                    >
                      {!hasPermission ? <Lock className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                      Emitir Parecer
                    </button>
                    {!hasPermission && (
                      <p className="text-xs text-muted-foreground mt-1.5 text-center">
                        Apenas membros alocados nesta demanda podem emitir parecer.
                      </p>
                    )}
                  </div>
                )}

                {(project.startDate || project.endDate) && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    {project.startDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Início: {project.startDate}</span>
                      </div>
                    )}
                    {project.endDate && (
                      <div className={`flex items-center gap-1.5 ${!project.startDate ? "ml-auto" : ""}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Fim: {project.endDate}</span>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
          {filteredProjects.length > visibleCount && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PROJECTS_PAGE_SIZE)}
                className="px-5 min-h-11 text-sm font-medium bg-card border border-border text-foreground rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Mostrar mais projetos (restam {filteredProjects.length - visibleCount})
              </button>
            </div>
          )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        aria-label="Nova Demanda"
        className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground min-w-11 min-h-11 p-3.5 rounded-md shadow-lg hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center z-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Nova Demanda"
      >
        <Plus className="w-6 h-6" />
      </button>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => projectsQuery.refetch()}
      />

      <EmitParecerModal
        isOpen={!!projectForParecer}
        onClose={() => setProjectForParecer(null)}
        project={projectForParecer as any}
        onSuccess={() => projectsQuery.refetch()}
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