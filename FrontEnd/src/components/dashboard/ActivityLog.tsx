//src/components/dashboard/ActivityLog.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, MessageSquare, AlertCircle, FileText, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";

interface TimelineEvent {
  _id: string;
  type: "DOCUMENT" | "COMMENT" | "STATUS_CHANGE" | "REPORT";
  description: string;
  createdAt: string;
  authorId?: {
    name: string;
    avatarUrl?: string;
  };
  projectId?: {
    title: string;
    referenceCode?: string;
  };
}

// Função nativa para "Há X minutos/horas"
function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Agora mesmo";
  if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 172800) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

// Mapeamento visual dinâmico do Back-end para o Front-end
const getEventConfig = (type: string) => {
  switch (type) {
    case "DOCUMENT":
      return { icon: <Plus className="w-3.5 h-3.5 text-emerald-500" />, actionText: "abriu a demanda" };
    case "COMMENT":
      return { icon: <MessageSquare className="w-3.5 h-3.5 text-blue-500" />, actionText: "emitiu parecer em" };
    case "STATUS_CHANGE":
      return { icon: <Edit2 className="w-3.5 h-3.5 text-amber-500" />, actionText: "atualizou o status de" };
    case "REPORT":
      return { icon: <FileText className="w-3.5 h-3.5 text-purple-500" />, actionText: "gerou relatório de" };
    default:
      return { icon: <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />, actionText: "interagiu com" };
  }
};

export function ActivityLog() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentOrg = useSelector(selectCurrentOrg);
  const token = useSelector((state: RootState) => state.auth.token);

  const orgId = typeof currentOrg?.organizationId === "object"
    ? (currentOrg.organizationId as any)._id
    : currentOrg?.organizationId;

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!orgId || !token) return;
      try {
        setIsLoading(true);
        // Bate na rota nova que criamos no passo 1
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${orgId}/projects/timeline`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEvents(response.data);
      } catch (error) {
        console.error("Erro ao carregar log de atividades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, [orgId, token]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          Atividades Recentes
        </h2>
        <p className="text-sm text-muted-foreground">
          Monitoramento em tempo real do canteiro.
        </p>
      </div>

      <div className="flex-1 rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Sincronizando atividades...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda nesta construtora.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-0">
            <ul className="divide-y divide-border">
              {events.map((event) => {
                const authorName = event.authorId?.name || "Sistema";
                const initials = authorName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
                const config = getEventConfig(event.type);
                const projectTitle = event.projectId?.title || "Demanda Excluída";
                const projectCode = event.projectId?.referenceCode ? `[${event.projectId.referenceCode}]` : "";

                return (
                  <li key={event._id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                    
                    {/* Avatar do Usuário */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold text-xs border border-border">
                        {event.authorId?.avatarUrl ? (
                          <img src={event.authorId.avatarUrl} alt={authorName} className="h-full w-full rounded-full object-cover" />
                        ) : initials}
                      </div>
                      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                        {config.icon}
                      </div>
                    </div>

                    {/* Descrição do Evento */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        <span className="font-semibold">{authorName}</span>{" "}
                        <span className="text-muted-foreground">{config.actionText}</span>{" "}
                        <span className="font-medium">{projectCode} {projectTitle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        "{event.description}"
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1.5 block">
                        {getRelativeTime(event.createdAt)}
                      </span>
                    </div>
                    
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}