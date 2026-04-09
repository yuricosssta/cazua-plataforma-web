//src/components/dashboard/ExportPdfModal.tsx
"use client";

import React, { useState } from "react";
import { X, Image as ImageIcon, FileText, Loader2, UploadCloud, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import { TimelineEventType } from "@/types/project";

interface TimelineEvent {
  _id: string;
  type: TimelineEventType;
  description: string;
  parecerCode?: string;
  authorId: { name: string };
  createdAt: string;
}

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEvent | null;
  currentOrg: any;
}

// Função auxiliar para carregar imagens nativamente de forma assíncrona
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Evita problemas de CORS
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export function ExportPdfModal({ isOpen, onClose, event, currentOrg }: ExportPdfModalProps) {
  const [step, setStep] = useState<"ASK" | "PHOTOS" | "GENERATING">("ASK");
  const [photos, setPhotos] = useState<File[]>([]);

  if (!isOpen || !event) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles].slice(0, 4)); // Limite de 4 fotos
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    setStep("GENERATING");
    
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - (margin * 2);
      
      const orgName = currentOrg?.organizationId?.name || currentOrg?.name || "Construtora Cazuá";

      // ----------------------------------------------------
      // PRÉ-CARREGAMENTO DAS IMAGENS DO PAPEL TIMBRADO
      // ----------------------------------------------------
      let headerImg: HTMLImageElement | null = null;
      let footerImg: HTMLImageElement | null = null;
      let footerHeight = 0;
      let footerWidth = 0;

      // Tenta carregar a Imagem de Cabeçalho
      if (currentOrg?.settings?.headerUrl) {
        try { headerImg = await loadImage(currentOrg.settings.headerUrl); } 
        catch (e) { console.warn("Falha ao carregar Header Image."); }
      }
      
      // Tenta carregar a Imagem de Rodapé
      if (currentOrg?.settings?.footerUrl) {
        try { 
          footerImg = await loadImage(currentOrg.settings.footerUrl); 
          footerHeight = (footerImg.height * contentWidth) / footerImg.width;
          if (footerHeight > 35) footerHeight = 35; // Limita a altura máxima do rodapé
          footerWidth = (footerImg.width * footerHeight) / footerImg.height;
        } 
        catch (e) { console.warn("Falha ao carregar Footer Image."); }
      }

      // Calcula onde a página deve quebrar (evitando invadir o rodapé)
      const bottomLimit = 297 - margin - footerHeight - 10;

      // ----------------------------------------------------
      // CONSTRUÇÃO DO CABEÇALHO
      // ----------------------------------------------------
      let yPos = margin;

      if (headerImg) {
        const headerH = (headerImg.height * contentWidth) / headerImg.width;
        const maxHeaderH = 40; 
        const finalHeaderH = headerH > maxHeaderH ? maxHeaderH : headerH;
        const finalHeaderW = (headerImg.width * finalHeaderH) / headerImg.height;
        
        pdf.addImage(headerImg, "PNG", margin, yPos, finalHeaderW, finalHeaderH);
        yPos += finalHeaderH + 15;
      } else {
        // Fallback: Logo ou Nome da Empresa
        let logoLoaded = false;
        if (currentOrg?.settings?.logoUrl) {
          try {
            const logoImg = await loadImage(currentOrg.settings.logoUrl);
            const logoH = 14;
            const logoW = (logoImg.width * logoH) / logoImg.height;
            pdf.addImage(logoImg, "PNG", margin, margin, logoW, logoH);
            logoLoaded = true;
          } catch (e) {}
        }

        if (!logoLoaded) {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(16);
          pdf.setTextColor(20, 20, 20);
          pdf.text(orgName, margin, margin + 6);
        }

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text("Documento Oficial", margin, logoLoaded ? margin + 18 : margin + 12);
        
        yPos = margin + 25; // Prepara para a próxima seção
      }

      // ----------------------------------------------------
      // IDENTIFICAÇÃO DO DOCUMENTO (Alinhado à esquerda)
      // ----------------------------------------------------
      const codeStr = event.parecerCode || event._id.slice(0, 8).toUpperCase();
      const dataExtenso = new Date(event.createdAt).toLocaleDateString('pt-BR', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(30, 30, 30);
      pdf.text(`Parecer Técnico ${codeStr}`, margin, yPos);
      
      yPos += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(80, 80, 80);
      pdf.text(dataExtenso, margin, yPos);

      yPos += 12; // Espaço antes de começar o texto

      // ----------------------------------------------------
      // CORPO DO TEXTO (Espaçamento Exato do Usuário)
      // ----------------------------------------------------
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(11);
      
      const paragraphs = event.description.split('\n');

      paragraphs.forEach(para => {
        // Retorna [''] se o parágrafo for vazio, mantendo o pulo de linha real
        const lines = pdf.splitTextToSize(para, contentWidth); 
        
        lines.forEach((line: string) => {
          if (yPos > bottomLimit) {
            pdf.addPage();
            yPos = margin + 10;
          }
          pdf.text(line, margin, yPos);
          yPos += 6; // Altura de cada linha
        });
        // Sem margem extra! Se ele não deu Enter, o texto segue junto.
      });

      // ----------------------------------------------------
      // ASSINATURA
      // ----------------------------------------------------
      yPos += 30; 
      if (yPos > bottomLimit) {
        pdf.addPage();
        yPos = margin + 20; 
      }
      
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(70, yPos, 140, yPos); 
      
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(event.authorId?.name || "Responsável Técnico", 105, yPos + 6, { align: "center" });
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Responsável Técnico", 105, yPos + 11, { align: "center" });

      // ----------------------------------------------------
      // ANEXOS FOTOGRÁFICOS
      // ----------------------------------------------------
      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          pdf.addPage(); 
          
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(30, 30, 30);
          pdf.text(`Anexo Fotográfico - ${i + 1}`, margin, margin);
          
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Ref: ${codeStr}`, margin, margin + 6);

          try {
            const photoUrl = URL.createObjectURL(photos[i]);
            const img = await loadImage(photoUrl);
            
            // Lógica para a foto caber limitando com o rodapé
            const maxW = contentWidth;
            const maxH = 297 - margin - (margin + 15) - footerHeight - 15; 
            let finalW = maxW;
            let finalH = (img.height * maxW) / img.width;

            if (finalH > maxH) {
              finalH = maxH;
              finalW = (img.width * maxH) / img.height;
            }

            const xOffset = margin + ((contentWidth - finalW) / 2);
            pdf.addImage(img, "JPEG", xOffset, margin + 15, finalW, finalH);
          } catch (e) {
            console.error("Erro ao carregar foto no PDF", e);
          }
        }
      }

      // ----------------------------------------------------
      // RODAPÉ COM PAGINAÇÃO (Aplicado a todas as páginas)
      // ----------------------------------------------------
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Desenha a imagem do rodapé (se existir)
        if (footerImg) {
          const footerY = 297 - margin - footerHeight;
          pdf.addImage(footerImg, "PNG", margin, footerY, footerWidth, footerHeight);
        }

        // Desenha a numeração de páginas (flutuando à direita do rodapé)
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, 297 - 12, { align: "right" });
      }

      // 4. Salva o arquivo final
      pdf.save(`Parecer_${codeStr}.pdf`);
      
      setTimeout(() => {
        setStep("ASK");
        setPhotos([]);
        onClose();
      }, 500);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um erro ao montar o arquivo PDF.");
      setStep("ASK");
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-md rounded-lg shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Exportar Relatório
          </h2>
          <button onClick={onClose} disabled={step === "GENERATING"} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === "ASK" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Deseja anexar fotos?</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Você pode incluir fotos para ilustrar este parecer técnico no PDF.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={() => setStep("PHOTOS")}
                  className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-colors"
                >
                  Sim, escolher fotos
                </button>
                <button 
                  onClick={generatePDF}
                  className="w-full h-10 bg-background border border-border text-foreground font-bold rounded-md hover:bg-muted transition-colors"
                >
                  Não, baixar apenas texto
                </button>
              </div>
            </div>
          )}

          {step === "PHOTOS" && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
                <UploadCloud className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-semibold text-primary">Clique para anexar (Máx. 4 fotos)</span>
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>

              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative group rounded-md overflow-hidden bg-muted aspect-square border border-border">
                      <img src={URL.createObjectURL(photo)} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removePhoto(i)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-border mt-4">
                <button onClick={() => setStep("ASK")} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Voltar</button>
                <button 
                  onClick={generatePDF}
                  className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Gerar PDF
                </button>
              </div>
            </div>
          )}

          {step === "GENERATING" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <h3 className="font-bold text-lg">Montando Documento...</h3>
              <p className="text-sm text-muted-foreground text-center">Desenhando vetores, processando papel timbrado e páginas do relatório.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modalContent, document.body) : null;
}