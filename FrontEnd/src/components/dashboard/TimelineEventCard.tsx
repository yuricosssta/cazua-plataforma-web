//src/components/dashboard/TimelineEventCard.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, ArrowRightCircle, FileText, ClipboardList, Activity, Clock, 
  LinkIcon, MoreVertical, FileDown 
} from "lucide-react";
import { TimelineEventType } from "@/types/project";

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
  attachments?: string[]; 
}

interface TimelineEventCardProps {
  event: TimelineEvent;
  isLatest: boolean;
  onExportPdf: (eventData: TimelineEvent) => void;
}

export function TimelineEventCard({ event, isLatest, onExportPdf }: TimelineEventCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const formatSystemEventText = (desc: string) => {
    if (desc.includes('foi adicionado')) {
      // Pega qualquer coisa entre "Membro " e " foi adicionado"
      return desc.replace(/Membro (.*?) foi adicionado.*/, 'adicionou $1 à equipe');
    }
    if (desc.includes('foi removido')) {
      return desc.replace(/Membro (.*?) foi removido.*/, 'removeu $1 da equipe');
    }
    return `alterou o status da demanda: ${desc}`;
  };

  const eventConfig = getEventConfig(event.type);
  const EventIcon = eventConfig.icon;
  const isDocumentStyle = event.type === "COMMENT" || event.type === "REPORT" || event.type === "DOCUMENT";

  const attachments = event.metadata?.attachments || event.attachments || [];

  return (
    <div className="relative pl-6 md:pl-6 mb-4">
      <span className={`absolute -left-[17px] top-4 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background ${eventConfig.bg} ${eventConfig.color} ${isLatest ? 'scale-110 shadow-sm' : ''}`}>
        <EventIcon className="h-4 w-4" />
      </span>

      <div className={`flex flex-col relative ${isDocumentStyle ? 'bg-card border border-border shadow-md rounded-sm p-6 md:p-10' : 'pt-5'}`}>
        
        {isDocumentStyle && (
          <div className="absolute top-4 right-4" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-10 animate-in fade-in zoom-in-95 duration-100">
                <div className="py-1">
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExportPdf(event);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar para PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-b border-border gap-2 pb-3 mb-4 pr-8">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              {isDocumentStyle && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {event.metadata?.labelOverride || "Parecer Técnico"}
                  </span>
                  {event.parecerCode && <span className="text-sm font-bold text-foreground">{event.parecerCode}</span>}
                </div>
              )}
            </div>
            <time className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDateTime(event.createdAt)}
            </time>
          </div>

          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {event.metadata.priorityScore && (
                <span className="text-sm text-foreground">Prioridade: {event.metadata.priorityScore}</span>
              )}
              {event.metadata.newStatus && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md border border-orange-200">
                  <ArrowRightCircle className="w-4 h-4" /> Status Avançado
                </span>
              )}
              {event.metadata.isInitialDemand && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-md border border-zinc-200">
                  <FileText className="w-4 h-4" /> Demanda Original
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`text-base text-foreground/90 mb-4 leading-relaxed ${!isDocumentStyle && 'bg-muted/30 p-4 rounded-lg border border-transparent'}`}>
          {isDocumentStyle ? (
            event.description.split('\n').map((line, i) => (
              <React.Fragment key={i}>{line}<br /></React.Fragment>
            ))
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-foreground">
                {event.authorId?.name || "Usuário"}
              </span>
              <span className="text-muted-foreground">
                {formatSystemEventText(event.description)}
              </span>
            </div>
          )}
        </div>

        {attachments.length > 0 && (
          <div className="w-full mb-6 border-t border-border pt-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Anexos ({attachments.length})
            </span>
            <div className="flex gap-3 flex-wrap">
              {attachments.map((link: string, idx: number) => {
                const isPdf = link.toLowerCase().includes('.pdf');
                return (
                  <a
                    key={idx} href={link} target="_blank" rel="noopener noreferrer"
                    className="group relative flex flex-col items-center justify-center w-16 h-16 rounded-md border border-border bg-muted overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  >
                    {isPdf ? (
                      <>
                        <FileText className="w-6 h-6 text-red-500" />
                        <span className="text-[8px] font-bold mt-1 text-muted-foreground">PDF</span>
                      </>
                    ) : (
                      <img src={link} alt="Anexo" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {isDocumentStyle && (
          <span className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-2">
            {event.authorId?.name || "Usuário Desconhecido"}
          </span>
        )}
      </div>
    </div>
  );
}