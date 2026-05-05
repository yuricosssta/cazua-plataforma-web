//src/components/resources/RequestResourceModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Search, ChevronDown } from "lucide-react";
import { resourceService, Resource, ResourceType } from "@/lib/services/resourceService";

interface RequestResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  projectId: string;
  onSuccess: () => void;
}

export function RequestResourceModal({ isOpen, onClose, orgId, projectId, onSuccess }: RequestResourceModalProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resourceSearch, setResourceSearch] = useState("");
  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const resourceRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    resourceId: "",
    quantity: 0,
    origin: "",
  });

  useEffect(() => {
    if (isOpen && orgId) {
      setIsLoading(true);
      resourceService.listResources(orgId)
        .then(setResources)
        .catch(() => setError("Erro ao carregar catálogo."))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, orgId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resourceRef.current && !resourceRef.current.contains(event.target as Node)) {
        setIsResourceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const selectedResource = resources.find((r) => r._id === formData.resourceId);
  const isCapital = selectedResource?.type === ResourceType.CAPITAL;

  const filteredResources = resources.filter(r => 
    r.name.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const handleSelectResource = (id: string, name: string) => {
    setFormData({ ...formData, resourceId: id });
    setResourceSearch(name);
    setIsResourceOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.resourceId) return setError("Selecione um recurso.");
    if (formData.quantity <= 0) return setError("A quantidade deve ser maior que zero.");

    try {
      setIsSubmitting(true);
      await resourceService.requestAllocation(orgId, projectId, {
        resourceId: formData.resourceId,
        quantity: Number(formData.quantity),
        origin: formData.origin || "Requisição de projeto.",
      });
      
      setFormData({ resourceId: "", quantity: 0, origin: "" });
      setResourceSearch("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao solicitar recurso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-md rounded-lg shadow-xl flex flex-col overflow-visible">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
          <h2 className="text-base font-semibold">Solicitar Recurso</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col p-5 space-y-4">
          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">{error}</div>}

          <div className="space-y-1.5" ref={resourceRef}>
            <label className="text-sm font-medium">Buscar Recursos</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder={isLoading ? "Carregando..." : "Digite para buscar o recurso..."}
                value={resourceSearch}
                disabled={isLoading}
                onFocus={() => setIsResourceOpen(true)}
                onChange={(e) => {
                  setResourceSearch(e.target.value);
                  setFormData({ ...formData, resourceId: "" });
                  setIsResourceOpen(true);
                }}
                className="w-full pl-9 pr-10 py-2 text-sm border border-input rounded-md bg-background focus:ring-2 focus:ring-primary/50"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>

              {isResourceOpen && (
                <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto py-1">
                  {filteredResources.map((res) => (
                    <li
                      key={res._id}
                      onClick={() => handleSelectResource(res._id, res.name)}
                      className="px-3 py-2 text-sm hover:bg-muted cursor-pointer transition-colors flex justify-between"
                    >
                      <span>{res.name}</span>
                      <span className="text-xs text-muted-foreground">({res.unit})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isCapital ? "Valor (R$)" : "Quantidade"}</label>
              <input
                type="number" step="0.01" min="0.01"
                value={formData.quantity || ""}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Justificativa</label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Ex: Frente de Serviço A"
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm transition-colors">
              {isSubmitting ? "Enviando..." : "Solicitar Recurso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}