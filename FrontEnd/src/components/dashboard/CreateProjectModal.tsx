//src/components/dashboard/CreateProjectModal.tsx
"use client";

import React, { useState } from "react";
import { X, Loader2, MapPin, AlignLeft, Calendar, Navigation, FileText } from "lucide-react";
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

  const getOrgId = (): string => {
    if (!currentOrg?.organizationId) return ""; 
    if (typeof currentOrg.organizationId === "object" && "_id" in currentOrg.organizationId) {
      return (currentOrg.organizationId as any)._id;
    }
    return currentOrg.organizationId as string;
  };
  const orgId = getOrgId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "", // NOVO CAMPO
    location: "",
    startDate: "",
    endDate: "",
  });

  if (!isOpen) return null;

  // Função para pegar o GPS do dispositivo
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        // Preenche o campo de texto com as coordenadas.
        // Dica: No futuro, você pode enviar essas coordenadas no Payload da API em um campo { lat, lng }
        setFormData(prev => ({ ...prev, location: `Lat: ${lat}, Lng: ${lng}` }));
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Erro de GPS:", error);
        alert("Não foi possível acessar a localização. Verifique as permissões do navegador.");
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return alert("Erro: Organização não identificada.");

    try {
      setIsSubmitting(true);

      const payload = {
        title: formData.title,
        description: formData.description, // Enviando a descrição pro back
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

      setFormData({ title: "", description: "", location: "", startDate: "", endDate: "" });
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background w-full max-w-5xl rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Nova Demanda</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Registre o escopo inicial para avaliação.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
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

          {/* NOVO CAMPO: DESCRIÇÃO */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Descrição Breve <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva o problema estrutural ou o escopo da obra de forma sucinta..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Localização / Coordenadas <span className="text-red-500">*</span>
              </label>
              
              {/* BOTÃO DE GPS */}
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                {isGettingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                Usar meu GPS
              </button>
            </div>
            
            <input
              type="text"
              required
              placeholder="Ex: Rua Direita, 123 - Centro ou Lat/Lng"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border mt-2">
            <div className="space-y-1.5 mt-2">
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
            <div className="space-y-1.5 mt-2">
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
          <p className="text-[11px] text-muted-foreground pt-1 text-center">As datas não são obrigatórias na fase de Demanda.</p>

          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50 border border-transparent hover:border-border"
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