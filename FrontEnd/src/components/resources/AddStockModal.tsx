//src/components/resources/AddStockModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { resourceService, Resource, ResourceType } from "@/lib/services/resourceService";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onSuccess: () => void;
}

export function AddStockModal({ isOpen, onClose, orgId, onSuccess }: AddStockModalProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    resourceId: "",
    quantity: 0,
    unitCostSnapshot: "",
    origin: "",
  });

  // Carrega o lista para popular o select
  useEffect(() => {
    if (isOpen && orgId) {
      setIsLoading(true);
      resourceService.listResources(orgId)
        .then(setResources)
        .catch(() => setError("Erro ao carregar lista de recursos."))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, orgId]);

  if (!isOpen) return null;

  // Lógica para identificar se o recurso selecionado é financeiro (CAPITAL)
  const selectedResource = resources.find((r) => r._id === formData.resourceId);
  const isCapital = selectedResource?.type === ResourceType.CAPITAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.resourceId) {
      setError("Selecione um recurso.");
      return;
    }
    if (formData.quantity <= 0) {
      setError(isCapital ? "O valor deve ser maior que zero." : "A quantidade deve ser maior que zero.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Constrói o payload respeitando a regra de negócio do Capital
      const payload: any = {
        resourceId: formData.resourceId,
        quantity: Number(formData.quantity),
        origin: formData.origin,
      };

      if (isCapital) {
        payload.unitCostSnapshot = 1; // Dinheiro sempre custa 1
      } else if (formData.unitCostSnapshot) {
        payload.unitCostSnapshot = Number(formData.unitCostSnapshot);
      }

      await resourceService.addStock(orgId, payload);
      
      // Reseta o formulário
      setFormData({ resourceId: "", quantity: 0, unitCostSnapshot: "", origin: "" });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Erro ao registrar a entrada.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-lg rounded-md shadow-xl flex flex-col overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Registro de Entrada de Estoque</h2>
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
            <label className="text-sm font-medium text-foreground">Item / Recurso</label>
            <select
              value={formData.resourceId}
              onChange={(e) => {
                setFormData({ ...formData, resourceId: e.target.value, unitCostSnapshot: "" });
              }}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="" disabled>
                {isLoading ? "Carregando lista..." : "Selecione o recurso recebido"}
              </option>
              {resources.map((res) => (
                <option key={res._id} value={res._id}>
                  {res.name} (Atual: {res.currentStock} {res.unit})
                </option>
              ))}
            </select>
          </div>

          <div className={`grid gap-4 ${isCapital ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {isCapital ? "Valor do Aporte (R$)" : "Quantidade Recebida"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.quantity || ""}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {!isCapital && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Custo Unitário NF (Opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCostSnapshot}
                  onChange={(e) => setFormData({ ...formData, unitCostSnapshot: e.target.value })}
                  placeholder="R$ Padrão"
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Documento de Origem</label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              placeholder={isCapital ? "Ex: Comprovante de PIX, Transferência Sócio X" : "Ex: Nota Fiscal nº 12345 / Fornecedor XPTO"}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
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
              {isSubmitting ? "Registrando..." : "Registrar Entrada"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}