//src/components/dashboard/TimelineEventCard.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare, ArrowRightCircle, FileText, ClipboardList, Activity, Clock,
  MoreVertical, FileDown
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

const getEventConfig = (type: TimelineEventType) => {
  switch (type) {
    case "COMMENT": return { icon: MessageSquare, color: "text-st-planning", bg: "bg-st-planning-bg border border-st-planning-border" };
    case "STATUS_CHANGE": return { icon: ArrowRightCircle, color: "text-primary", bg: "bg-primary-bg border border-primary-border" };
    case "DOCUMENT": return { icon: FileText, color: "text-st-execution", bg: "bg-st-execution-bg border border-st-execution-border" };
    case "REPORT": return { icon: ClipboardList, color: "text-st-completed", bg: "bg-st-completed-bg border border-st-completed-border" };
    default: return { icon: Activity, color: "text-muted-foreground", bg: "bg-muted border border-border" };
  }
};

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

  const eventConfig = getEventConfig(event.type);
  const EventIcon = eventConfig.icon;
  const isDocumentStyle = event.type === "COMMENT" || event.type === "REPORT" || event.type === "DOCUMENT";

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const getSystemAction = (desc: string): string | null => {
    const added = desc.match(/Membro (.+?) foi adicionado/);
    if (added) return `adicionou ${added[1].trim()} à equipe`;
    const removed = desc.match(/Membro (.+?) foi removido/);
    if (removed) return `removeu ${removed[1].trim()} da equipe`;
    return null;
  };

  const attachments = event.metadata?.attachments || event.attachments || [];
  const hasMetadataChips = Boolean(
    event.metadata?.newStatus || event.metadata?.isInitialDemand || event.metadata?.priorityScore
  );
  const systemAction = isDocumentStyle ? null : getSystemAction(event.description);

  const renderMetadataChips = () => (
    <>
      {event.metadata?.newStatus && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary-bg px-2.5 py-1 rounded-md border border-primary-border">
          <ArrowRightCircle className="w-3.5 h-3.5" /> Status Avançado
        </span>
      )}
      {event.metadata?.isInitialDemand && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
          <FileText className="w-3.5 h-3.5" /> Demanda Original
        </span>
      )}
      {event.metadata?.priorityScore && (
        <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
          Prioridade: {event.metadata.priorityScore}
        </span>
      )}
    </>
  );

  return (
    <div className="relative pl-6 mb-3">
      <span className={`absolute -left-[17px] md:-left-[25px] -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background ${eventConfig.bg} ${eventConfig.color} ${isDocumentStyle ? 'top-3.5' : 'top-1.5'} ${isLatest ? 'scale-110 shadow-sm' : ''}`}>
        <EventIcon className="h-4 w-4" />
      </span>

      {isDocumentStyle ? (
        <div className="flex flex-col relative bg-card border border-border shadow-md rounded-md p-5">

          <div className="absolute top-4 right-4" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Opções do evento"
                className="p-3 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
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
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-hover-bg hover:text-primary flex items-center gap-2 transition-colors"
                    >
                      <FileDown className="w-4 h-4" />
                      Exportar para PDF
                    </button>
                  </div>
                </div>
              )}
          </div>

          <div className="border-b border-border pb-3 mb-4 pr-8">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {event.metadata?.labelOverride || "Parecer Técnico"}
                </span>
                {event.parecerCode && <span className="text-sm font-bold text-foreground">{event.parecerCode}</span>}
              </div>
              <time className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatDateTime(event.createdAt)}
              </time>
            </div>

            {hasMetadataChips && (
              <div className="flex gap-2 flex-wrap mt-2">
                {renderMetadataChips()}
              </div>
            )}
          </div>

          <div className="text-base text-foreground/90 leading-relaxed">
            {event.description.split('\n').map((line, i) => (
              <React.Fragment key={i}>{line}<br /></React.Fragment>
            ))}
          </div>

          {attachments.length > 0 && (
            <div className="w-full mt-4 border-t border-border pt-4">
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
                          <FileText className="w-6 h-6 text-st-critical" />
                          <span className="text-[10px] font-bold mt-1 text-muted-foreground">PDF</span>
                        </>
                      ) : (
                        <img src={link} alt={attachments.length > 1 ? `Anexo ${idx + 1}` : "Anexo do evento"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <span className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-4">
            {event.authorId?.name || "Usuário Desconhecido"}
          </span>
        </div>
      ) : (
        <div className="flex items-center flex-wrap gap-x-3 gap-y-2 bg-card border border-border rounded-md shadow-sm px-4 py-3">
          <p className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1 flex-1 min-w-0">
            {systemAction ? (
              <>
                <span className="font-bold text-foreground">
                  {event.authorId?.name || "Sistema"}
                </span>
                <span className="text-muted-foreground">
                  {systemAction}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {event.description.trim()}
              </span>
            )}
            {hasMetadataChips && renderMetadataChips()}
          </p>
          <time className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 ml-auto shrink-0">
            <Clock className="w-3.5 h-3.5" />
            {formatDateTime(event.createdAt)}
          </time>
        </div>
      )}
    </div>
  );
}