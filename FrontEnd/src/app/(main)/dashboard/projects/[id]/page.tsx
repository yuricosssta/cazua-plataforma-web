//src/app/(main)/dashboard/projects/[id]/page.tsx
"use client";
 
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { getProjectDetails, apiRemoveMember } from "@/lib/services/projectService";
import { TimelineEventType, Project } from "@/types/project";
import { getStatusConfig, getPriorityConfig } from "@/lib/projectConfig";
import { getOrgId, getUserSub, isUserAssigned } from "@/lib/projectHelpers";
import { TimelineEventCard } from "@/components/dashboard/TimelineEventCard";
import { Badge } from "@/components/dashboard/Badge";
import { ExportPdfModal } from "@/components/dashboard/ExportPdfModal";
import { EmitParecerModal } from '@/components/dashboard/EmitParecerModal';
import { ManageTeamDrawer } from "@/components/dashboard/ManageTeamDrawer";
import { MapViewerModal } from "@/components/ui/MapViewer";
import { ProjectResourcesTab } from "@/components/resources/ProjectResourcesTab";
import {
  ArrowLeft, MapPin, Calendar, CheckCircle, AlertCircle, HardHat, FileText, Lock,
  Loader2, Users, LogOut, FolderKanban, Package, Activity
} from "lucide-react";
import { ProjectCostTab } from "@/components/resources/ProjectCostTab";
import { toast } from 'sonner';

type DetailTabType = "TIMELINE" | "RESOURCES" | "COSTS";

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
  const orgId = getOrgId(currentOrg);
  const currentUserId = getUserSub(user);
  const currentUserName = user?.name || (user as any)?.displayName || "Usuário";

  const [activeTab, setActiveTab] = useState<DetailTabType>("TIMELINE");
  const [mapLocationView, setMapLocationView] = useState<string | null>(null);
  const [pdfEventTarget, setPdfEventTarget] = useState<any>(null);


  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isParecerOpen, setIsParecerOpen] = useState(false);
  const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const fetchDetails = async (showFullLoader = true) => {
    if (!orgId || !token || !projectId) return;
    try {
      if (showFullLoader) setIsLoading(true);
      const data = await getProjectDetails(orgId, projectId);
      setProject(data.project);
      setTimeline(data.timeline);
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
      toast.error("Não foi possível carregar os detalhes do projeto.");
      router.push("/dashboard/projects");
    } finally {
      if (showFullLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails(true);
  }, [orgId, token, projectId]);

  useEffect(() => {
    if (!isLeaveConfirmOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLeaving) setIsLeaveConfirmOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLeaveConfirmOpen, isLeaving]);


  const isOrgAdmin = currentOrg?.role === 'OWNER' || currentOrg?.role === 'ADMIN';
  const isAssigned = isUserAssigned(project?.assignedMembers, currentUserId);
  const hasPermission = isOrgAdmin || isAssigned;

  const handleLeaveProject = async () => {
    try {
      setIsLeaving(true);
      await apiRemoveMember(orgId, projectId, currentUserId, currentUserName);
      setIsLeaveConfirmOpen(false);
      router.push(`/dashboard/projects`);
    } catch (error: any) {
      console.error(error);
      toast.error("Não foi possível encerrar sua participação. Tente novamente.");
    } finally {
      setIsLeaving(false);
    }
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

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-6 text-foreground pb-24 relative min-h-screen">

      {/* CABEÇALHO */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button onClick={() => router.push("/dashboard/projects")} className="mt-1.5 p-3 rounded-md hover:bg-muted text-muted-foreground shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              {project.referenceCode && <div className="text-sm font-mono font-bold text-primary mb-1 tracking-wider uppercase">{project.referenceCode}</div>}
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{project.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground mt-2 text-sm font-medium">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMapLocationView(project.location || ""); }}
                  className="flex items-center gap-1.5 rounded-md -mx-1 -my-1.5 px-1 py-2 text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MapPin className="w-4 h-4 shrink-0" /> {project.location}
                </button>
                {(project.startDate || project.endDate) && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : 'TBD'} - {project.endDate ? new Date(project.endDate).toLocaleDateString('pt-BR') : 'TBD'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-[60px] md:ml-0">
            {isOrgAdmin && (
              <button onClick={() => setIsTeamDrawerOpen(true)} className="flex items-center gap-1.5 px-3 py-2 min-h-11 bg-muted text-foreground hover:bg-accent rounded-md text-sm font-semibold border border-border">
                <Users className="w-4 h-4" /> Equipe
              </button>
            )}
            <button disabled={!hasPermission} onClick={() => setIsParecerOpen(true)} className={`flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-md text-sm font-semibold border ${hasPermission ? 'bg-primary-bg text-primary hover:bg-primary hover:text-primary-foreground border-primary-border' : 'bg-muted text-muted-foreground/50 border-border cursor-not-allowed'}`}>
              {!hasPermission ? <Lock className="w-4 h-4" /> : <Activity className="w-4 h-4" />} Parecer Técnico
            </button>
            <span title={hasPermission ? "RDO em breve" : "Sem permissão para emitir RDO"} className="inline-flex">
              <button disabled className={`flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-md text-sm font-semibold border cursor-not-allowed opacity-70 ${hasPermission ? 'bg-st-execution-bg text-st-execution border-st-execution-border' : 'bg-muted text-muted-foreground/50 border-border'}`}>
                {!hasPermission ? <Lock className="w-4 h-4" /> : <HardHat className="w-4 h-4" />} RDO
              </button>
            </span>
            {isUserAssigned(project?.assignedMembers, currentUserId) && (
              <button onClick={() => setIsLeaveConfirmOpen(true)} className="flex items-center gap-1.5 px-3 py-2 min-h-11 bg-st-critical-bg text-st-critical border border-st-critical-border hover:bg-st-critical hover:text-background rounded-md text-sm font-semibold ml-auto md:ml-0">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-md p-3 shadow-sm ml-0 md:ml-[60px]">
          <Badge icon={statusConfig.icon} label={statusConfig.label} color={statusConfig.color} bg={statusConfig.bg} size="md" />
          <Badge icon={priorityConfig.icon} label={priorityConfig.label} color={priorityConfig.color} bg={priorityConfig.bg} size="md" />
          {(project.status === "EXECUTION" || project.status === "COMPLETED") && (
            <div className="flex-1 min-w-[150px] flex items-center gap-3 pl-3 md:pl-6 border-l border-border">
              <span className="text-xs font-bold whitespace-nowrap">{project.progress}% Físico</span>
              <div className="w-full h-2 bg-muted rounded-md overflow-hidden max-w-[200px]">
                <div className={`h-full rounded-md transition-all duration-500 ${project.progress === 100 ? 'bg-st-completed' : 'bg-primary'}`} style={{ width: `${project.progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex space-x-1 border-b border-border ml-0 md:ml-[60px] mt-2 overflow-x-auto tab-rail">
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
          <Package className="w-4 h-4" /> Movimentações de Recursos
        </button>

        <button
          onClick={() => setActiveTab("COSTS")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "COSTS" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Activity className="w-4 h-4" /> Resumo de Custos
        </button>
      </div>

      {/* ÁREA DE RENDERIZAÇÃO CONDICIONAL */}
      <div className="ml-0 md:ml-[60px] pt-2">
        {activeTab === "TIMELINE" && (
          <div className="relative border-l-2 border-border pb-2 pl-4 md:pl-6 ml-2 md:ml-0">
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

        {activeTab === "COSTS" && (
          <ProjectCostTab orgId={orgId} projectId={projectId} />
        )}
      </div>

      {/* MODAIS (Ocultos) */}
      {isLeaveConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !isLeaving && setIsLeaveConfirmOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="bg-card border border-border rounded-md shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-st-critical" /> Sair da demanda
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Tem certeza que deseja encerrar sua participação neste projeto? Você perderá o acesso ao painel dele.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsLeaveConfirmOpen(false)}
                disabled={isLeaving}
                autoFocus
                className="px-4 py-2 min-h-11 rounded-md text-sm font-semibold border border-border hover:bg-muted disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleLeaveProject}
                disabled={isLeaving}
                className="flex items-center gap-2 px-4 py-2 min-h-11 rounded-md text-sm font-semibold bg-st-critical text-background hover:opacity-90 disabled:opacity-50"
              >
                {isLeaving && <Loader2 className="w-4 h-4 animate-spin" />} Sair
              </button>
            </div>
          </div>
        </div>
      )}
      <EmitParecerModal isOpen={isParecerOpen} onClose={() => setIsParecerOpen(false)} project={project as any} onSuccess={() => fetchDetails(false)} />
      <ManageTeamDrawer isOpen={isTeamDrawerOpen} onClose={() => setIsTeamDrawerOpen(false)} orgId={orgId} projectId={projectId} currentAssignedMembers={project.assignedMembers || []} onSuccess={() => fetchDetails(false)} />
      <MapViewerModal isOpen={!!mapLocationView} onClose={() => setMapLocationView(null)} locationString={mapLocationView || ""} />
      <ExportPdfModal isOpen={!!pdfEventTarget} onClose={() => setPdfEventTarget(null)} event={pdfEventTarget} currentOrg={currentOrg} />
    </div>
  );
}