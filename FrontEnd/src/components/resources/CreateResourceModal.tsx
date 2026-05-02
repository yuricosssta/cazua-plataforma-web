//src/components/resources/CreateResourceModal.tsx
"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { resourceService, ResourceType } from "@/lib/services/resourceService";

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onSuccess: () => void;
}

export function CreateResourceModal({ isOpen, onClose, orgId, onSuccess }: CreateResourceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: ResourceType.MATERIAL,
    unit: "",
    standardCost: 0,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.unit.trim()) {
      setError("Nome e Unidade são campos obrigatórios.");
      return;
    }

    try {
      setIsSubmitting(true);
      await resourceService.createResource(orgId, {
        name: formData.name,
        type: formData.type,
        unit: formData.unit,
        standardCost: Number(formData.standardCost),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Erro ao registrar o recurso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-md rounded-md shadow-xl flex flex-col overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Novo Recurso no Catálogo</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col p-5 space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome do Recurso</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Cimento CP II 50kg"
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value={ResourceType.MATERIAL}>Material Físico</option>
                <option value={ResourceType.LABOR}>Mão de Obra</option>
                <option value={ResourceType.EQUIPMENT}>Equipamento</option>
                <option value={ResourceType.CAPITAL}>Capital / Verba</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Unidade de Medida</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Ex: saco, h, un"
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Custo Padrão (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.standardCost}
              onChange={(e) => setFormData({ ...formData, standardCost: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">Valor de referência utilizado caso o lançamento não possua nota fiscal associada.</p>
          </div>

          {/* Rodapé de Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-muted-foreground border border-transparent rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar Recurso"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}