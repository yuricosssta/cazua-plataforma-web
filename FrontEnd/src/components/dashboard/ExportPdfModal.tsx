//src/components/dashboard/ExportPdfModal.tsx
"use client";

import React, { useState } from "react";
import { X, Image as ImageIcon, FileText, Loader2, UploadCloud, Trash2, PenTool, Plus, UserMinus } from "lucide-react";
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
  metadata?: Record<string, any>;
  attachments?: string[];
}

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEvent | null;
  currentOrg: any;
}

interface Signer {
  name: string;
  role: string;
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (url.startsWith('blob:')) {
      img.src = url;
    } else {
      img.crossOrigin = "Anonymous";
      const cacheBuster = url.includes('?') ? '&' : '?';
      img.src = `${url}${cacheBuster}nocache=${new Date().getTime()}`;
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error("🔥 Falha ao processar imagem para o PDF:", url);
      reject(e);
    };
  });
};

export function ExportPdfModal({ isOpen, onClose, event, currentOrg }: ExportPdfModalProps) {
  const [step, setStep] = useState<"ASK" | "PHOTOS" | "GENERATING">("ASK");
  const [photos, setPhotos] = useState<File[]>([]);

  // Estado dinâmico para múltiplos assinantes
  const [signers, setSigners] = useState<Signer[]>([
    { name: event?.authorId?.name || "", role: "Responsável Técnico" }
  ]);

  if (!isOpen || !event) return null;

  const allAttachments = event?.metadata?.attachments || (event as any)?.attachments || [];
  const existingImages = allAttachments.filter((url: string) => !url.toLowerCase().includes('.pdf'));

  const addSigner = () => {
    setSigners([...signers, { name: "", role: "" }]);
  };

  const removeSigner = (index: number) => {
    if (signers.length > 1) {
      setSigners(signers.filter((_, i) => i !== index));
    }
  };

  const updateSigner = (index: number, field: keyof Signer, value: string) => {
    const newSigners = [...signers];
    newSigners[index][field] = value;
    setSigners(newSigners);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles].slice(0, 4)); // Limite de 4 fotos
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
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
          } catch (e) { }
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
        if (!para.trim()) { yPos += 6; return; }
        const lines = pdf.splitTextToSize(para, contentWidth);
        const paraHeight = lines.length * 5;
        if (yPos + paraHeight > bottomLimit) {
          if (paraHeight > (bottomLimit - margin - 10)) {
            lines.forEach((line: string) => {
              if (yPos > bottomLimit) { pdf.addPage(); yPos = margin + 10; }
              pdf.text(line, margin, yPos);
              yPos += 6;
            });
            return;
          } else { pdf.addPage(); yPos = margin + 10; }
        }
        pdf.text(para, margin, yPos, { maxWidth: contentWidth, align: "justify" });
        yPos += paraHeight; 
      });

      // ----------------------------------------------------
      // MOTOR DE ASSINATURAS EM COLUNAS
      // ----------------------------------------------------
      yPos += 15;

      // Calcula a altura necessária para as assinaturas (linhas de 2 em 2)
      const rows = Math.ceil(signers.length / 2);
      const signatureBlockHeight = rows * 30; //

      if (yPos + signatureBlockHeight > bottomLimit) {
        pdf.addPage();
        yPos = margin + 20;
      }

      signers.forEach((signer, index) => {
        const isSecondColumn = index % 2 !== 0;
        const currentRow = Math.floor(index / 2);
        const currentY = yPos + (currentRow * 30);

        let xPos;
        let align: "center" | "left" | "right" = "center";

        if (signers.length === 1) {
          xPos = 105; // Centralizado se for apenas 1
        } else {
          // Layout de duas colunas
          xPos = isSecondColumn ? 147.5 : 62.5;
        }

        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.3);
        // Desenha a linha de assinatura (80mm de largura)
        pdf.line(xPos - 35, currentY, xPos + 35, currentY);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text(signer.name || "NOME DO ASSINANTE", xPos, currentY + 5, { align: "center" });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(signer.role || "FUNÇÃO / CARGO", xPos, currentY + 9, { align: "center" });
      });

      // ----------------------------------------------------
      // ANEXOS FOTOGRÁFICOS
      // ----------------------------------------------------
      const totalPhotos = photos.length + existingImages.length;
      if (totalPhotos > 0) {
        let photoIndex = 1;
        const allPhotoUrls = [...existingImages, ...photos.map(p => URL.createObjectURL(p))];

        for (const url of allPhotoUrls) {
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
            const img = await loadImage(url);
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
          } catch (e) { console.error("Erro ao carregar foto", e); }
        }
      }

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
      setTimeout(() => { setStep("ASK"); setPhotos([]); onClose(); }, 500);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um erro ao montar o arquivo PDF.");
      setStep("ASK");
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-2xl rounded-lg shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Exportar Relatório Técnico
          </h2>
          <button onClick={onClose} disabled={step === "GENERATING"} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {step === "ASK" && (
            <div className="flex flex-col space-y-6">

              {/* SEÇÃO DE ASSINANTES DINÂMICOS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
                    <PenTool className="w-4 h-4 text-primary" /> Assinaturas no Documento
                  </h3>
                  <button
                    onClick={addSigner}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Assinante
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {signers.map((signer, idx) => (
                    <div key={idx} className="relative bg-muted/30 p-4 rounded-lg border border-border group">
                      {signers.length > 1 && (
                        <button
                          onClick={() => removeSigner(idx)}
                          className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full border border-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <UserMinus className="w-3 h-3" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome do Assinante {idx + 1}</label>
                          <input
                            type="text"
                            value={signer.name}
                            onChange={(e) => updateSigner(idx, 'name', e.target.value)}
                            placeholder="Ex: João da Silva"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Cargo / Função</label>
                          <input
                            type="text"
                            value={signer.role}
                            onChange={(e) => updateSigner(idx, 'role', e.target.value)}
                            placeholder="Ex: Engenheiro Civil - CREA 123"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* OPÇÕES DE FOTOS */}
              <div className="text-center space-y-3 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold">
                  {existingImages.length > 0
                    ? `Detectamos ${existingImages.length} imagem(ns) vinculada(s) ao parecer.`
                    : "Deseja anexar fotos extras?"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {existingImages.length > 0
                    ? "Elas serão inseridas no PDF automaticamente. Você pode complementar com mais fotos se desejar."
                    : "Ilustre o laudo com fotos do seu dispositivo para dar mais clareza técnica."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setStep("PHOTOS")}
                  className="w-full h-10 bg-muted text-foreground border border-border font-bold rounded-md hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" /> Escolher fotos extras
                </button>
                <button
                  onClick={generatePDF}
                  className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-colors"
                >
                  Gerar Documento Oficial
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
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="font-bold text-lg">Processando Laudo Técnico...</h3>
                <p className="text-sm text-muted-foreground">Calculando grid de assinaturas, justificando textos e otimizando imagens.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modalContent, document.body) : null;
}