// src/components/dashboard/CreateProjectModal.tsx
"use client";

import React, { useState } from "react";
import { X, Loader2, MapPin, AlignLeft, Calendar } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import axios from "axios";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const currentOrg = useSelector(selectCurrentOrg);
  const token = useSelector((state: RootState) => state.auth.token);

  // Extração segura do ID da organização
  const getOrgId = (): string => {
    if (!currentOrg?.organizationId) return ""; 
    if (typeof currentOrg.organizationId === "object" && "_id" in currentOrg.organizationId) {
      return (currentOrg.organizationId as any)._id;
    }
    return currentOrg.organizationId as string;
  };
  const orgId = getOrgId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    startDate: "",
    endDate: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return alert("Erro: Organização não identificada.");

    try {
      setIsSubmitting(true);

      // O payload reflete exatamente o seu projects.zod.ts (status 'DEMAND' é assumido pelo back)
      const payload = {
        title: formData.title,
        location: formData.location,
        ...(formData.startDate && { startDate: formData.startDate }),
        ...(formData.endDate && { endDate: formData.endDate }),
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${orgId}/projects`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Limpa o form e avisa o componente pai (ProjectsList) que deu certo
      setFormData({ title: "", location: "", startDate: "", endDate: "" });
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error("Erro ao criar demanda:", error);
      alert(error.response?.data?.message || "Erro interno ao criar a demanda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Container do Modal */}
      <div className="bg-background w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Nova Demanda</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Registre o escopo inicial para avaliação.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-muted-foreground" />
              Título da Demanda / Obra <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Infiltração na Escola Municipal"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Localização <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Rua Direita, 123 - Centro"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Data de Início
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 text-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Previsão de Fim
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 text-muted-foreground"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">As datas não são obrigatórias na fase de Demanda.</p>

          {/* Rodapé do Modal */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Demanda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}