//src/app/(main)/dashboard/projects/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { getProjectDetails, apiRemoveMember } from "@/lib/services/projectService";
import { ProjectStatus, TimelineEventType, Project } from "@/types/project";
import { TimelineEventCard } from "@/components/dashboard/TimelineEventCard";
import { ExportPdfModal } from "@/components/dashboard/ExportPdfModal";
import { EmitParecerModal } from '@/components/dashboard/EmitParecerModal';
import { ManageTeamDrawer } from "@/components/dashboard/ManageTeamDrawer";
import { MapViewerModal } from "@/components/ui/MapViewer";
import { ProjectResourcesTab } from "@/components/resources/ProjectResourcesTab";
import {
  ArrowLeft, MapPin, Calendar, CheckCircle, AlertCircle, HardHat, FileText, Lock,
  Flame, Activity, Clock, Loader2, Users, LogOut, Network, FolderKanban, Package
} from "lucide-react";

type DetailTabType = "TIMELINE" | "RESOURCES";

interface TimelineEvent {
  _id: string;
  type: TimelineEventType;
  description: string;
  parecerCode?: string;
  authorId: { _id: string; name: string; };
  createdAt: string;
  metadata?: Record<string, any>;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const currentOrg = useSelector(selectCurrentOrg);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [activeTab, setActiveTab] = useState<DetailTabType>("TIMELINE");
  const [mapLocationView, setMapLocationView] = useState<string | null>(null);
  const [pdfEventTarget, setPdfEventTarget] = useState<any>(null);

  const getOrgId = (): string => {
    if (!currentOrg?.organizationId) return "";
    if (typeof currentOrg.organizationId === "object" && "_id" in currentOrg.organizationId) {
      return (currentOrg.organizationId as any)._id;
    }
    return currentOrg.organizationId as string;
  };
  const orgId = getOrgId();

  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isParecerOpen, setIsParecerOpen] = useState(false);
  const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);

  const fetchDetails = async (showFullLoader = true) => {
    if (!orgId || !token || !projectId) return;
    try {
      if (showFullLoader) setIsLoading(true);
      const data = await getProjectDetails(orgId, projectId); // Usando a refatoração via BFF
      setProject(data.project);
      setTimeline(data.timeline);
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
      alert("Não foi possível carregar os detalhes do projeto.");
      router.push("/dashboard/projects");
    } finally {
      if (showFullLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails(true);
  }, [orgId, token, projectId]);

  const currentUserId = String(user?.sub || (user as any)?._id || (user as any)?.id || "");
  const currentUserName = user?.name || (user as any)?.displayName || "Usuário";

  const isAssigned = project?.assignedMembers?.some((m: any) => {
    if (typeof m === 'string') return m === currentUserId;
    if (m && typeof m === 'object') return String(m._id || m.id || "") === currentUserId;
    return false;
  }) || false;

  const isOrgAdmin = currentOrg?.role === 'OWNER' || currentOrg?.role === 'ADMIN';
  const hasPermission = isOrgAdmin || isAssigned;

  const handleLeaveProject = async () => {
    const confirmLeave = window.confirm("Tem certeza que deseja encerrar sua participação?");
    if (!confirmLeave) return;
    try {
      await apiRemoveMember(orgId, projectId, currentUserId, currentUserName);
      router.push(`/dashboard/projects`);
    } catch (error: any) {
      alert(error.message || "Falha ao sair da demanda.");
    }
  };

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case "DEMAND": return { label: "Demanda", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100 border-orange-200" };
      case "PLANNING": return { label: "Planejamento", icon: FileText, color: "text-blue-600", bg: "bg-blue-100 border-blue-200" };
      case "EXECUTION": return { label: "Em Execução", icon: HardHat, color: "text-amber-700", bg: "bg-amber-100 border-amber-200" };
      case "COMPLETED": return { label: "Concluída", icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200" };
      case "INVALID": return { label: "Inválida", icon: Lock, color: "text-muted-foreground", bg: "bg-muted/10" };
      default: return { label: "Desconhecido", icon: AlertCircle, color: "text-gray-600", bg: "bg-gray-100 border-gray-200" };
    }
  };

  const getPriorityConfig = (score?: number) => {
    if (!score) return { label: "Sem Prioridade", icon: Clock, color: "text-gray-500", bg: "bg-transparent border-dashed border-gray-300" };
    if (score >= 100) return { label: `Crítica (${score})`, icon: Flame, color: "text-red-700", bg: "bg-red-50 border-red-200" };
    if (score >= 60) return { label: `Alta (${score})`, icon: Activity, color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
    if (score >= 30) return { label: `Média (${score})`, icon: AlertCircle, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
    return { label: `Baixa (${score})`, icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  };

  if (isLoading || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Sincronizando projeto...</p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(project.status);
  const priorityConfig = getPriorityConfig(project.priorityScore);
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-6 text-foreground pb-24 relative min-h-screen">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button onClick={() => router.push("/dashboard/projects")} className="mt-1.5 p-2 rounded-full hover:bg-muted text-muted-foreground shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              {project.referenceCode && <div className="text-sm font-mono font-bold text-primary mb-1 tracking-wider uppercase">{project.referenceCode}</div>}
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{project.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground mt-2 text-sm font-medium">
                <span className="flex items-center gap-1.5 cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); setMapLocationView(project.location || ""); }}>
                  <MapPin className="w-4 h-4" /> {project.location}
                </span>
                {(project.startDate || project.endDate) && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : 'TBD'} - {project.endDate ? new Date(project.endDate).toLocaleDateString('pt-BR') : 'TBD'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-14 md:ml-0">
            {isOrgAdmin && (
              <button onClick={() => setIsTeamDrawerOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-foreground hover:bg-accent rounded-md text-sm font-semibold border border-border">
                <Users className="w-4 h-4" /> Equipe
              </button>
            )}
            <button disabled={!hasPermission} onClick={() => setIsParecerOpen(true)} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold border ${hasPermission ? 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20' : 'bg-muted text-muted-foreground/50 border-border cursor-not-allowed'}`}>
              {!hasPermission ? <Lock className="w-4 h-4" /> : <Activity className="w-4 h-4" />} Parecer Técnico
            </button>
            <button disabled={!hasPermission} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold border ${hasPermission ? 'bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-200' : 'bg-muted text-muted-foreground/50 border-border cursor-not-allowed'}`}>
              {!hasPermission ? <Lock className="w-4 h-4" /> : <HardHat className="w-4 h-4" />} RDO
            </button>
            {isAssigned && (
              <button onClick={handleLeaveProject} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm font-semibold border border-red-200 ml-auto md:ml-0">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-md p-3 shadow-sm ml-0 md:ml-12">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="w-4 h-4" /> {statusConfig.label}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider ${priorityConfig.bg} ${priorityConfig.color}`}>
            <PriorityIcon className="w-4 h-4" /> {priorityConfig.label}
          </div>
          {(project.status === "EXECUTION" || project.status === "COMPLETED") && (
            <div className="flex-1 min-w-[150px] flex items-center gap-3 pl-3 md:pl-6 border-l border-border">
              <span className="text-xs font-bold whitespace-nowrap">{project.progress}% Físico</span>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden max-w-[200px]">
                <div className={`h-full rounded-full transition-all duration-500 ${project.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${project.progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex space-x-1 border-b border-border ml-0 md:ml-12 mt-2">
        <button
          onClick={() => setActiveTab("TIMELINE")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "TIMELINE" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <FolderKanban className="w-4 h-4" /> Visão Geral
        </button>
        <button
          onClick={() => setActiveTab("RESOURCES")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "RESOURCES" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Package className="w-4 h-4" /> Recursos
        </button>
      </div>

      {/* ÁREA DE RENDERIZAÇÃO CONDICIONAL */}
      <div className="ml-0 md:ml-12 pt-2">
        {activeTab === "TIMELINE" && (
          <div className="relative border-l-2 border-muted pb-8 pl-4 md:pl-6 ml-2 md:ml-0">
            {timeline.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum evento registrado ainda.</p>
            ) : (
              timeline.map((event, index) => (
                <TimelineEventCard
                  key={event._id}
                  event={event as any}
                  isLatest={index === 0}
                  onExportPdf={(eventData) => setPdfEventTarget(eventData)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "RESOURCES" && (
          <ProjectResourcesTab 
            orgId={orgId} 
            projectId={projectId} 
            hasPermission={hasPermission} 
          />
        )}
      </div>

      {/* MODAIS (Ocultos) */}
      <EmitParecerModal isOpen={isParecerOpen} onClose={() => setIsParecerOpen(false)} project={project as any} onSuccess={() => fetchDetails(false)} />
      <ManageTeamDrawer isOpen={isTeamDrawerOpen} onClose={() => setIsTeamDrawerOpen(false)} orgId={orgId} projectId={projectId} currentAssignedMembers={project.assignedMembers || []} onSuccess={() => fetchDetails(false)} />
      <MapViewerModal isOpen={!!mapLocationView} onClose={() => setMapLocationView(null)} locationString={mapLocationView || ""} />
      <ExportPdfModal isOpen={!!pdfEventTarget} onClose={() => setPdfEventTarget(null)} event={pdfEventTarget} currentOrg={currentOrg} />
    </div>
  );
}