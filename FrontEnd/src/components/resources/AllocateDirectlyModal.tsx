//src/components/resources/AllocateDirectlyModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Search, ChevronDown } from "lucide-react";
import { resourceService, Resource, ResourceType } from "@/lib/services/resourceService";
import { listProjects } from "@/lib/services/projectService";

interface AllocateDirectlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onSuccess: () => void;
}

export function AllocateDirectlyModal({ isOpen, onClose, orgId, onSuccess }: AllocateDirectlyModalProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados dos campos de busca
  const [projectSearch, setProjectSearch] = useState("");
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  
  const [resourceSearch, setResourceSearch] = useState("");
  const [isResourceOpen, setIsResourceOpen] = useState(false);

  // Refs para fechar os menus ao clicar fora
  const projectRef = useRef<HTMLDivElement>(null);
  const resourceRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    projectId: "",
    resourceId: "",
    quantity: 0,
    origin: "Envio Direto Almoxarifado",
  });

  useEffect(() => {
    if (isOpen && orgId) {
      setIsLoading(true);
      Promise.all([
        resourceService.listResources(orgId),
        listProjects(orgId)
      ])
      .then(([resourcesData, projectsData]) => {
        setResources(resourcesData);
        setProjects(projectsData);
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar dados do formulário.");
      })
      .finally(() => setIsLoading(false));
    }
  }, [isOpen, orgId]);

  // Lógica de clique fora para fechar os dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(event.target as Node)) {
        setIsProjectOpen(false);
      }
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

  // Filtros dinâmicos baseados na digitação
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(projectSearch.toLowerCase())
  );
  
  const filteredResources = resources.filter(r => 
    r.name.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const handleSelectProject = (id: string, title: string) => {
    setFormData({ ...formData, projectId: id });
    setProjectSearch(title);
    setIsProjectOpen(false);
  };

  const handleSelectResource = (id: string, name: string) => {
    setFormData({ ...formData, resourceId: id });
    setResourceSearch(name);
    setIsResourceOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.projectId) return setError("Selecione o projeto de destino.");
    if (!formData.resourceId) return setError("Selecione um recurso.");
    if (formData.quantity <= 0) return setError(isCapital ? "O valor deve ser maior que zero." : "A quantidade deve ser maior que zero.");

    try {
      setIsSubmitting(true);
      await resourceService.allocateDirectly(orgId, formData.projectId, {
        resourceId: formData.resourceId,
        quantity: Number(formData.quantity),
        origin: formData.origin,
      });
      
      setFormData({ projectId: "", resourceId: "", quantity: 0, origin: "Envio Direto Almoxarifado" });
      setProjectSearch("");
      setResourceSearch("");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Erro ao registrar a alocação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-lg rounded-lg shadow-xl flex flex-col overflow-visible">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Saída Direta para Destino</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col p-5 space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          {/* Campo de Busca: Obra / Destino */}
          <div className="space-y-1.5" ref={projectRef}>
            <label className="text-sm font-medium text-foreground">Destino</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder={isLoading ? "Carregando projetos..." : "Digite para buscar o projeto/obra..."}
                value={projectSearch}
                disabled={isLoading}
                onFocus={() => setIsProjectOpen(true)}
                onChange={(e) => {
                  setProjectSearch(e.target.value);
                  setFormData({ ...formData, projectId: "" }); // Invalida o ID se alterar o texto
                  setIsProjectOpen(true);
                }}
                className="w-full pl-9 pr-10 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>

              {isProjectOpen && (
                <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto py-1">
                  {filteredProjects.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum destino encontrado.</li>
                  ) : (
                    filteredProjects.map((proj) => (
                      <li
                        key={proj._id || proj.id}
                        onClick={() => handleSelectProject(proj._id || proj.id, proj.title)}
                        className="px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                      >
                        {proj.title}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Campo de Busca: Item / Recurso */}
          <div className="space-y-1.5" ref={resourceRef}>
            <label className="text-sm font-medium text-foreground">Item / Recurso</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder={isLoading ? "Carregando lista..." : "Digite para buscar o recurso..."}
                value={resourceSearch}
                disabled={isLoading}
                onFocus={() => setIsResourceOpen(true)}
                onChange={(e) => {
                  setResourceSearch(e.target.value);
                  setFormData({ ...formData, resourceId: "" }); // Invalida o ID se alterar o texto
                  setIsResourceOpen(true);
                }}
                className="w-full pl-9 pr-10 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>

              {isResourceOpen && (
                <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto py-1">
                  {filteredResources.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum recurso encontrado.</li>
                  ) : (
                    filteredResources.map((res) => (
                      <li
                        key={res._id}
                        onClick={() => handleSelectResource(res._id, res.name)}
                        className="px-3 py-2 flex justify-between items-center text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                      >
                        <span>{res.name}</span>
                        {res.type === ResourceType.LABOR ? (
                          <span className="text-xs text-muted-foreground font-medium">Mão de Obra</span>
                        ) : res.type === ResourceType.CAPITAL ? (
                          <span className={`text-xs font-semibold ${res.currentStock < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                            R$ {res.currentStock.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className={`text-xs font-semibold ${res.currentStock <= 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            Saldo: {res.currentStock} {res.unit}
                          </span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {isCapital ? "Valor Enviado (R$)" : "Quantidade a Enviar"}
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Observação / Origem</label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Ex: Saída Autorizada"
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {selectedResource && formData.quantity > 0 && selectedResource.currentStock - formData.quantity < 0 && !isCapital && selectedResource.type !== ResourceType.LABOR && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-xs text-orange-800 font-medium">
                Aviso: Esta saída deixará o saldo do Almoxarifado Central negativo.
              </p>
            </div>
          )}

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
              {isSubmitting ? "Registrando..." : "Confirmar Saída"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}