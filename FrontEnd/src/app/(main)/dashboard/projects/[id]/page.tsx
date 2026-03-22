// src/app/dashboard/projects/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import axios from "axios";
import {
  ArrowLeft, MapPin, Calendar, CheckCircle, AlertCircle, HardHat, FileText, Lock,
  Flame, Activity, MessageSquare, ArrowRightCircle, Clock, Loader2, ClipboardList, Plus, Network, Users,
  LinkIcon
} from "lucide-react";
import { EmitParecerModal } from '@/components/dashboard/EmitParecerModal';
import { ManageTeamDrawer } from "@/components/dashboard/ManageTeamDrawer";

type ProjectStatus = "DEMAND" | "PLANNING" | "EXECUTION" | "COMPLETED";
type TimelineEventType = "COMMENT" | "STATUS_CHANGE" | "DOCUMENT" | "REPORT";

interface TimelineEvent {
  _id: string;
  type: TimelineEventType;
  description: string;
  parecerCode?: string;
  authorId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  metadata?: Record<string, any>;
}

interface Project {
  _id: string;
  referenceCode?: string;
  title: string;
  status: ProjectStatus;
  progress: number;
  location: string;
  startDate?: string;
  endDate?: string;
  priorityScore?: number;
  priorityDetails?: Record<string, number>;
  assignedMembers?: any[];
  createdAt: string;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const currentOrg = useSelector(selectCurrentOrg);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

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
  const [isDiarioOpen, setIsDiarioOpen] = useState(false);
  const [isEapOpen, setIsEapOpen] = useState(false);
  const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);

  const fetchProjectDetails = async (showFullLoader = true) => {
    if (!orgId || !token || !projectId) return;

    try {
      if (showFullLoader) setIsLoading(true);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${orgId}/projects/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProject(response.data.project);
      setTimeline(response.data.timeline);
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
      alert("Não foi possível carregar os detalhes do projeto.");
      router.push("/dashboard/projects");
    } finally {
      if (showFullLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails(true); // 'true' porque é o primeiro carregamento da tela
  }, [orgId, token, projectId, router]);

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case "DEMAND": return { label: "Demanda", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100 border-orange-200" };
      case "PLANNING": return { label: "Planejamento", icon: FileText, color: "text-blue-600", bg: "bg-blue-100 border-blue-200" };
      case "EXECUTION": return { label: "Em Execução", icon: HardHat, color: "text-amber-700", bg: "bg-amber-100 border-amber-200" };
      case "COMPLETED": return { label: "Concluída", icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200" };
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

  const getEventConfig = (type: TimelineEventType) => {
    switch (type) {
      case "COMMENT": return { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-100" };
      case "STATUS_CHANGE": return { icon: ArrowRightCircle, color: "text-orange-500", bg: "bg-orange-100" };
      case "DOCUMENT": return { icon: FileText, color: "text-purple-500", bg: "bg-purple-100" };
      case "REPORT": return { icon: ClipboardList, color: "text-emerald-500", bg: "bg-emerald-100" };
      default: return { icon: Activity, color: "text-gray-500", bg: "bg-gray-100" };
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  if (isLoading || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Buscando histórico da obra...</p>
      </div>
    );
  }

  const isOrgAdmin = currentOrg?.role === 'OWNER' || currentOrg?.role === 'ADMIN';
  const isAssigned = project.assignedMembers?.some((m: any) => {
    const memberId = typeof m === 'string' ? m : m._id;
    return memberId === user?._id;
  });
  const hasPermission = isOrgAdmin || isAssigned;

  const statusConfig = getStatusConfig(project.status);
  const priorityConfig = getPriorityConfig(project.priorityScore);
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-8 text-foreground pb-24 relative min-h-screen">

      {/* 1. CABEÇALHO DE COMANDO (Top Bar) */}
      <div className="flex flex-col gap-5">

        {/* Linha Superior: Título e Botões de Ação */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push("/dashboard/projects")}
              className="mt-1.5 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              {project.referenceCode && (
                <div className="text-sm font-mono font-bold text-primary mb-1 tracking-wider uppercase">
                  {project.referenceCode}
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{project.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground mt-2 text-sm font-medium">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {project.location}</span>
                {(project.startDate || project.endDate) && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : 'TBD'}
                    {' - '}
                    {project.endDate ? new Date(project.endDate).toLocaleDateString('pt-BR') : 'TBD'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PAINEL DE AÇÕES */}
          <div className="flex flex-wrap items-center gap-2 ml-14 md:ml-0">
            {isOrgAdmin && (
              <button
                onClick={() => setIsTeamDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-muted text-foreground hover:bg-accent rounded-md text-sm font-semibold transition-colors border border-border"
              >
                <Users className="w-4 h-4" />
                Equipe
              </button>
            )}

            <button
              disabled={!hasPermission}
              onClick={() => setIsParecerOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-colors border ${hasPermission
                ? 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20'
                : 'bg-muted text-muted-foreground/50 border-border cursor-not-allowed'
                }`}
              title={!hasPermission ? "Você não está alocado neste projeto." : ""}
            >
              {!hasPermission ? <Lock className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
              Parecer Técnico
            </button>

            <button
              disabled={!hasPermission}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-colors border ${hasPermission
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-200'
                : 'bg-muted text-muted-foreground/50 border-border cursor-not-allowed'
                }`}
            >
              {!hasPermission ? <Lock className="w-4 h-4" /> : <HardHat className="w-4 h-4" />}
              Diário de Obra
            </button>

            <button
              disabled={!hasPermission}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-colors border ${hasPermission
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white border-blue-200'
                : 'bg-muted text-muted-foreground/50 border-border cursor-not-allowed'
                }`}
            >
              {!hasPermission ? <Lock className="w-4 h-4" /> : <Network className="w-4 h-4" />}
              EAP / Orçamento
            </button>

          </div>
        </div>


        {/* Barra de Metadados (Badges, GUT, Progresso) */}
        <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-lg p-3 shadow-sm ml-0 md:ml-12">

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider ${priorityConfig.bg} ${priorityConfig.color}`}>
            <PriorityIcon className="w-4 h-4" />
            {priorityConfig.label}
          </div>

          {project.priorityDetails && (
            <div className="flex items-center gap-2 px-3 py-1 border-l border-border text-xs text-muted-foreground font-medium">
              <span title="Gravidade">Gravidade: {project.priorityDetails.gravidade}</span>
              <span title="Urgência">Urgência: {project.priorityDetails.urgencia}</span>
              <span title="Tendência">Tendência: {project.priorityDetails.tendencia}</span>
            </div>
          )}

          {(project.status === "EXECUTION" || project.status === "COMPLETED") && (
            <div className="flex-1 min-w-[150px] flex items-center gap-3 pl-3 md:pl-6 border-l border-border">
              <span className="text-xs font-bold whitespace-nowrap">{project.progress}% Físico</span>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden max-w-[200px]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${project.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. O MOTOR: TIMELINE CENTRALIZADA E FOCADA NO CONTEÚDO */}
      <div className="ml-4 md:ml-16 relative border-l-2 border-muted pb-8 mt-4">

        {timeline.length === 0 ? (
          <p className="text-muted-foreground text-sm ml-8">Nenhum evento registrado ainda.</p>
        ) : (
          timeline.map((event, index) => {
            const eventConfig = getEventConfig(event.type);
            const EventIcon = eventConfig.icon;
            const isLatest = index === 0;
            // Identifica se é um evento de texto longo (Parecer/Laudo) para aplicar o estilo "Folha A4"
            const isDocumentStyle = event.type === "COMMENT" || event.type === "REPORT" || event.type === "DOCUMENT";

            return (
              <div key={event._id} className="relative pl-6 md:pl-6 mb-4">

                {/* O Círculo com o Ícone na Linha */}
                <span className={`absolute -left-[17px] top-4 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background ${eventConfig.bg} ${eventConfig.color} ${isLatest ? 'scale-110 shadow-sm' : ''}`}>
                  <EventIcon className="h-4 w-4" />
                </span>

                {/* Conteúdo do Evento */}
                <div className={`flex flex-col ${isDocumentStyle ? 'bg-card border border-border shadow-md rounded-sm p-6 md:p-10' : 'pt-5'}`}>
                  <div className="border-b border-border gap-2 pb-3 mb-4">
                    {/* Cabeçalho do Evento */}
                    <div className="flex items-baseline justify-between flex-wrap">
                      <div className="flex items-center gap-3">

                        {isDocumentStyle && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {/* <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5"> */}
                              Parecer Técnico
                            </span>
                            {event.parecerCode && (
                              <span className="text-sm font-bold text-foreground">
                                {/* // <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 select-all" title="Código para citação em documentos"> */}
                                {event.parecerCode}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <time className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(event.createdAt)}
                      </time>
                    </div>
                    {/* Metadados Extras (As tags no final do documento) */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {/* <div className="mt-6 pt-4 border-t border-dashed border-border flex gap-2 flex-wrap"> */}
                        {event.metadata.priorityScore && (
                          // <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-200">
                          <span className="text-sm text-foreground">
                            {/* <Flame className="w-4 h-4" />  */}
                            Prioridade: {event.metadata.priorityScore}
                          </span>
                        )}
                        {event.metadata.newStatus && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md border border-orange-200">
                            <ArrowRightCircle className="w-4 h-4" /> Status Avançado
                          </span>
                        )}

                        {event.metadata.attachments && event.metadata.attachments.length > 0 && (
                          <div className="w-full mb-2 flex gap-2 flex-wrap">
                            {event.metadata.attachments.map((link: string, idx: number) => (
                              <a
                                key={idx} href={link} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md border border-blue-200 transition-colors"
                              >
                                <LinkIcon className="w-3.5 h-3.5" /> Acessar Anexos da Demanda
                              </a>
                            ))}
                          </div>
                        )}

                        {event.metadata.isInitialDemand && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-md border border-zinc-200">
                            <FileText className="w-4 h-4" /> Demanda Original
                          </span>
                        )}

                      </div>
                    )}

                  </div>

                  {/* O Texto do Evento (O "Documento") */}
                  <div className={`text-base text-foreground/90 mb-10 leading-relaxed ${!isDocumentStyle && 'bg-muted/30 p-4 rounded-lg border border-transparent'}`}>
                    {event.description.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {event.authorId?.name || "Usuário Desconhecido"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <EmitParecerModal
        isOpen={isParecerOpen}
        onClose={() => setIsParecerOpen(false)}
        project={{ id: project._id, title: project.title, status: project.status }}
        onSuccess={() => {
          fetchProjectDetails(false);
        }}
      />

      {/* A GAVETA DE EQUIPE */}
      <ManageTeamDrawer
        isOpen={isTeamDrawerOpen}
        onClose={() => setIsTeamDrawerOpen(false)}
        orgId={orgId}
        projectId={project._id}
        currentAssignedMembers={project.assignedMembers || []}
        onSuccess={() => {
          fetchProjectDetails(false);
        }}
      />

    </div>
  );
}