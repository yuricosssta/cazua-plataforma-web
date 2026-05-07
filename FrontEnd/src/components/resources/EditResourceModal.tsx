//src/components/resources/EditResourceModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { resourceService, Resource, ResourceType } from "@/lib/services/resourceService";

interface EditResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  resource: Resource | null;
  onSuccess: () => void;
}

export function EditResourceModal({ isOpen, onClose, orgId, resource, onSuccess }: EditResourceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: ResourceType.MATERIAL,
    unit: "",
    standardCost: 0,
  });

  useEffect(() => {
    if (isOpen && resource) {
      setFormData({
        name: resource.name,
        type: resource.type,
        unit: resource.unit,
        standardCost: resource.standardCost,
      });
      setError(null);
    }
  }, [isOpen, resource]);

  if (!isOpen || !resource) return null;

  const hasStock = resource.currentStock !== 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.name.trim().length < 2) {
      return setError("O nome do recurso deve ter pelo menos 2 caracteres.");
    }

    try {
      setIsSubmitting(true);
      await resourceService.updateResource(orgId, resource._id, {
        name: formData.name,
        type: formData.type,
        unit: formData.unit,
        standardCost: Number(formData.standardCost),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Erro ao atualizar o recurso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCapital = formData.type === ResourceType.CAPITAL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-md rounded-lg shadow-xl flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Editar Recurso</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col p-5 space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {hasStock && (
             <div className="p-3 text-xs text-orange-800 bg-orange-50 rounded-md border border-orange-200 font-medium">
               Este recurso possui saldo ativo no almoxarifado. A categoria e a unidade de medida foram bloqueadas para edição a fim de proteger o histórico contábil.
             </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome do Recurso</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Cimento CP-II 50kg"
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Categoria</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
              disabled={hasStock}
              className={`w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${hasStock ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <option value={ResourceType.MATERIAL}>Material / Insumo</option>
              <option value={ResourceType.LABOR}>Mão de Obra</option>
              <option value={ResourceType.EQUIPMENT}>Equipamento</option>
              <option value={ResourceType.CAPITAL}>Financeiro (Verba/Capital)</option>
            </select>
          </div>

          {!isCapital && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Unidade de Medida</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value.toLowerCase() })}
                disabled={hasStock}
                placeholder="Ex: un, kg, m3, h"
                className={`w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${hasStock ? 'opacity-60 cursor-not-allowed' : ''}`}
                required={!isCapital}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {isCapital ? 'Valor Unitário Padrão' : 'Custo Padrão (R$)'}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.standardCost}
              onChange={(e) => setFormData({ ...formData, standardCost: Number(e.target.value) })}
              disabled={isCapital}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:bg-muted"
            />
            {isCapital && <p className="text-xs text-muted-foreground mt-1">Para recursos financeiros, o custo base é sempre 1 para 1.</p>}
          </div>

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
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Alterações
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}