//src/components/dashboard/UpgradeModal.tsx
"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X, Zap, CheckCircle2, MessageCircle, Star } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function UpgradeModal({ isOpen, onClose, title, message }: UpgradeModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Substitua pelo seu número de WhatsApp real (com DDI e DDD, ex: 5532999999999)
  const whatsappNumber = "5531993533148"; 
  const whatsappMessage = encodeURIComponent("Olá! Atingi o limite do plano gratuito no Cazuá e gostaria de saber mais sobre o Plano PRO para minha empresa.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-primary/20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative">
        
        {/* Efeito de Brilho no Topo */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-primary to-amber-400"></div>

        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
            <Zap className="w-8 h-8 fill-amber-500" />
          </div>
          
          <h2 className="text-2xl font-black tracking-tight text-foreground mb-2">
            {title || "É hora de evoluir seu plano"}
          </h2>
          
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            {message || "Sua empresa está crescendo e você atingiu o limite do plano gratuito. Faça o upgrade para desbloquear todo o poder da plataforma."}
          </p>

          <div className="w-full bg-muted/30 rounded-sm p-5 mb-8 border border-border text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> O que inclui no Plano PRO:
            </h3>
            <ul className="space-y-3">
              {[
                "Projetos e Demandas Ilimitadas",
                "Criação de Múltiplas Empresas",
                "Gestão de Equipe (Convites Ilimitados)",
                "Relatórios e Diários de Obra avançados",
                "Suporte Técnico Prioritário"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <MessageCircle className="w-5 h-5" />
            Falar com Consultor no WhatsApp
          </a>
          
          <button onClick={onClose} className="mt-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Talvez mais tarde
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}