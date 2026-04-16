// src/components/dashboard/ExportPdfModal.tsx
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
  metadata?: Record<string, any>; // Tipado para conseguirmos ler os anexos salvos no banco
}

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEvent | null;
  currentOrg: any;
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Se for link temporário do upload local, não precisa de CORS nem Cache-Buster
    if (url.startsWith('blob:')) {
      img.src = url;
    } else {
      // Se for link público da Cloudflare R2, aplica a segurança
      img.crossOrigin = "Anonymous";
      const cacheBuster = url.includes('?') ? '&' : '?';
      img.src = `${url}${cacheBuster}nocache=${new Date().getTime()}`;
    }

    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error("Falha ao processar imagem para o PDF:", url);
      reject(e);
    };
  });
};

export function ExportPdfModal({ isOpen, onClose, event, currentOrg }: ExportPdfModalProps) {
  const [step, setStep] = useState<"ASK" | "PHOTOS" | "GENERATING">("ASK");
  const [photos, setPhotos] = useState<File[]>([]); // Fotos adicionadas apenas para este PDF

  if (!isOpen || !event) return null;

  const allAttachments = event?.metadata?.attachments || (event as any)?.attachments || [];
  // Extrai as imagens que JÁ FORAM salvas na Timeline, ignorando PDFs (pois jsPDF desenha imagens)
  const existingImages = allAttachments.filter((url: string) => !url.toLowerCase().includes('.pdf'));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles].slice(0, 4));
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
      const orgSettings = currentOrg?.organizationId?.settings || currentOrg?.settings || {};

      let headerImg: HTMLImageElement | null = null;
      let footerImg: HTMLImageElement | null = null;
      let footerHeight = 0;
      let footerWidth = 0;

      if (orgSettings.headerUrl) {
        try { headerImg = await loadImage(orgSettings.headerUrl); }
        catch (e) { console.warn("Falha ao carregar Header Image."); }
      }

      if (orgSettings.footerUrl) {
        try {
          footerImg = await loadImage(orgSettings.footerUrl);
          footerHeight = (footerImg.height * contentWidth) / footerImg.width;
          if (footerHeight > 35) footerHeight = 35;
          footerWidth = (footerImg.width * footerHeight) / footerImg.height;
        }
        catch (e) { console.warn("Falha ao carregar Footer Image."); }
      }

      const bottomLimit = 297 - margin - footerHeight - 10;
      let yPos = margin;

      if (headerImg) {
        const headerH = (headerImg.height * contentWidth) / headerImg.width;
        const maxHeaderH = 40;
        const finalHeaderH = headerH > maxHeaderH ? maxHeaderH : headerH;
        const finalHeaderW = (headerImg.width * finalHeaderH) / headerImg.height;

        pdf.addImage(headerImg, "PNG", margin, yPos - 10, finalHeaderW, finalHeaderH);
        yPos += finalHeaderH + 5;
      } else {
        let logoLoaded = false;
        if (orgSettings.logoUrl) {
          try {
            const logoImg = await loadImage(orgSettings.logoUrl);
            const logoH = 14;
            const logoW = (logoImg.width * logoH) / logoImg.height;
            pdf.addImage(logoImg, "PNG", margin, margin, logoW, logoH);
            logoLoaded = true;
          } catch (e) {
            console.warn("Falha ao carregar Logo Image.");
          }
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
        yPos = margin + 25;
      }

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

      yPos += 12;

      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(11);

      const paragraphs = event.description.split('\n');
paragraphs.forEach(para => {
    // Verifica se o parágrafo vazio para evitar pulo de linha desnecessário
    if (para.trim().length === 0) {
        yPos += 6; 
        return;
    }

    // O jsPDF calcula as quebras automaticamente com o maxWidth
    // O align: "justify" distribui os espaços
        const lines: string[] = pdf.splitTextToSize(para, contentWidth);
    
    lines.forEach((line: string, index: number) => { // Tipagem adicionada aqui
        if (yPos > bottomLimit) {
            pdf.addPage();
            yPos = margin + 10;
        }

        const isLastLine = index === lines.length - 1;
        
        pdf.text(line, margin, yPos, { 
            align: isLastLine ? "left" : "justify", 
            maxWidth: contentWidth 
        });
        
        yPos += 6;
    });
});

      yPos += 20;
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
      // MOTOR UNIFICADO DE FOTOS (Do Banco + Do Modal)
      // ----------------------------------------------------
      const totalPhotos = photos.length + existingImages.length;

      if (totalPhotos > 0) {
        let photoIndex = 1;

        // 1. Desenha as fotos que já vieram do banco (do EmitParecerModal)
        for (let i = 0; i < existingImages.length; i++) {
          pdf.addPage();
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(30, 30, 30);
          pdf.text(`Anexo Fotográfico - ${photoIndex}`, margin, margin);
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Ref: ${codeStr}`, margin, margin + 6);

          try {
            const img = await loadImage(existingImages[i]);
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
            photoIndex++;
          } catch (e) {
            console.error("Erro ao carregar foto do banco no PDF", e);
          }
        }

        // 2. Desenha as fotos adicionadas apenas neste PDF
        for (let i = 0; i < photos.length; i++) {
          pdf.addPage();
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(30, 30, 30);
          pdf.text(`Anexo Fotográfico - ${photoIndex}`, margin, margin);
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Ref: ${codeStr} (Complemento)`, margin, margin + 6);

          try {
            const photoUrl = URL.createObjectURL(photos[i]);
            const img = await loadImage(photoUrl);
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
            photoIndex++;
          } catch (e) {
            console.error("Erro ao carregar foto local no PDF", e);
          }
        }
      }

      // Rodapé
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        if (footerImg) {
          const footerY = 297 - margin - footerHeight;
          pdf.addImage(footerImg, "PNG", margin, footerY, footerWidth, footerHeight);
        }
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, 297 - 12, { align: "right" });
      }

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
                <h3 className="text-base font-semibold">
                  {existingImages.length > 0
                    ? `O parecer possui ${existingImages.length} imagem(ns) anexa(s).`
                    : "Deseja anexar fotos extras?"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {existingImages.length > 0
                    ? "Elas serão inseridas no PDF automaticamente. Você pode adicionar mais fotos se desejar."
                    : "Você pode incluir fotos do seu computador para ilustrar este parecer no PDF."}
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={() => setStep("PHOTOS")}
                  className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-colors"
                >
                  Adicionar fotos extras
                </button>
                <button
                  onClick={generatePDF}
                  className="w-full h-10 bg-background border border-border text-foreground font-bold rounded-md hover:bg-muted transition-colors"
                >
                  {existingImages.length > 0 ? "Gerar PDF com fotos do banco" : "Gerar apenas texto"}
                </button>
              </div>
            </div>
          )}

          {step === "PHOTOS" && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
                <UploadCloud className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-semibold text-primary">Clique para anexar extras (Máx. 4)</span>
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
              <p className="text-sm text-muted-foreground text-center">Processando anexos, papel timbrado e formatando o relatório.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modalContent, document.body) : null;
}
