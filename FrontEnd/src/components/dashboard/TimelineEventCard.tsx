//src/components/dashboard/TimelineEventCard.tsx
"use client";

import React, { useState, useRef } from "react";
import {
  Clock, Flame, ArrowRightCircle, LinkIcon, FileText,
  MessageSquare, ClipboardList, Activity, MoreVertical,
  Download, Image as ImageIcon, Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import { TimelineEventType, Project } from "@/types/project";

interface TimelineEventCardProps {
  event: any;
  index: number;
  project: Project;
  currentOrg: any; // Puxado do Redux para pegar o nome/logo
}

export function TimelineEventCard({ event, index, project, currentOrg }: TimelineEventCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLatest = index === 0;
  const isDocumentStyle = event.type === "COMMENT" || event.type === "REPORT" || event.type === "DOCUMENT";

  // Helpers visuais (iguais aos que você já tinha)
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
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

  const eventConfig = getEventConfig(event.type);
  const EventIcon = eventConfig.icon;

  // --- MOTOR DE PDF ---
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const generatePDF = async (files?: FileList | null) => {
  try {
    setIsGenerating(true);
    setIsMenuOpen(false);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageGap = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // 1. Logo (Empresa ou Cazuá)
    const logoImg = currentOrg?.logoUrl || 'URL_DO_LOGO_CAZUA';
    try {
      // Se tiver logo, a logo fica no topo e o texto desce
      doc.addImage(logoImg, 'PNG', pageGap, yPos, 30, 15);
      yPos += 20; 
    } catch (e) {
      doc.setFont("helvetica", "bold").setFontSize(16).text(currentOrg?.name || 'CAZUÁ', pageGap, yPos + 10);
      yPos += 20;
    }

    // 2. Cabeçalho Simples (Parecer e Localização)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Parecer Técnico: ${event.parecerCode || 'N/A'}`, pageGap, yPos);

    // Cidade e Data por extenso no lado direito
    const dataExtenso = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const localizacao = `${currentOrg?.city || 'Brasil'}, ${dataExtenso}`;
    doc.setFont("helvetica", "normal");
    doc.text(localizacao, pageWidth - pageGap, yPos, { align: 'right' });

    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text(`Local: `, pageGap, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${project.title}`, 26, yPos);

    yPos += 12;

    // 3. Texto do Parecer (Quebra de linha automática)
    const splitDescription = doc.splitTextToSize(event.description, 182);
    doc.text(splitDescription, pageGap, yPos);
    
    // Atualiza yPos baseado no tamanho do texto (aprox 6mm por linha)
    yPos += (splitDescription.length * 6) + 20;

    // 4. Assinatura Centralizada (Nome e Função)
    if (yPos > 260) { // Se não couber a assinatura, cria nova página
      doc.addPage();
      yPos = 30;
    }

    doc.setFont("helvetica", "bold");
    doc.text(event.authorId?.name || 'Autor não identificado', pageWidth / 2, yPos, { align: 'center' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    // Usando o campo 'role' (função) que você pretende implementar
    doc.text(event.authorId?.role || 'Responsável Técnico', pageWidth / 2, yPos + 5, { align: 'center' });

    // 5. Anexo de Fotos (Sempre em páginas novas)
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await convertFileToBase64(file);

        doc.addPage();
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`ANEXO FOTOGRÁFICO ${i + 1}`, pageGap, 20);

        // Imagem redimensionada para caber na página mantendo proporção segura
        doc.addImage(base64, file.type === 'image/png' ? 'PNG' : 'JPEG', pageGap, 30, 182, 135);
      }
    }

    // 6. Rodapé (Página X de Y) - Aplicado em todas as páginas ao final
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - pageGap, 285, { align: 'right' });
    }

    doc.save(`Parecer_${event.parecerCode || 'Tecnico'}.pdf`);

  } catch (error) {
    console.error("Erro ao gerar PDF", error);
    alert("Falha ao gerar o documento.");
  } finally {
    setIsGenerating(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
};


  const handleExportClick = () => {
    const wantsPhotos = window.confirm("Deseja anexar fotos ao final deste laudo em PDF?");
    if (wantsPhotos) {
      fileInputRef.current?.click(); // Abre o seletor de arquivos
    } else {
      generatePDF(null); // Gera direto sem fotos
    }
  };

  return (
    <div className="relative pl-6 md:pl-6 mb-4">
      {/* Input oculto para fotos */}
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => generatePDF(e.target.files)}
      />

      <span className={`absolute -left-[17px] top-4 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background ${eventConfig.bg} ${eventConfig.color} ${isLatest ? 'scale-110 shadow-sm' : ''}`}>
        <EventIcon className="h-4 w-4" />
      </span>

      <div className={`flex flex-col relative ${isDocumentStyle ? 'bg-card border border-border shadow-md rounded-sm p-6 md:p-10' : 'pt-5'}`}>

        {/* MENU DE 3 PONTINHOS (Apenas para Documentos/Pareceres) */}
        {isDocumentStyle && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <MoreVertical className="w-5 h-5" />}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-card border border-border shadow-xl rounded-md py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={handleExportClick}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-muted flex items-center gap-2 text-foreground"
                >
                  <Download className="w-4 h-4 text-primary" /> Exportar PDF
                </button>
              </div>
            )}
          </div>
        )}

        {/* RESTANTE DO SEU CÓDIGO VISUAL INTACTO */}
        <div className="border-b border-border gap-2 pb-3 mb-4 pr-8">
          <div className="flex items-baseline justify-between flex-wrap">
            <div className="flex items-center gap-3">
              {isDocumentStyle && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Parecer Técnico</span>
                  {event.parecerCode && (
                    <span className="text-sm font-bold text-foreground">{event.parecerCode}</span>
                  )}
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
                <span className="text-sm text-foreground">
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
                    <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md border border-blue-200 transition-colors">
                      <LinkIcon className="w-3.5 h-3.5" /> Acessar Anexos
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`text-base text-foreground/90 mb-10 leading-relaxed ${!isDocumentStyle && 'bg-muted/30 p-4 rounded-lg border border-transparent'}`}>
          {event.description.split('\n').map((line: string, i: number) => (
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
}