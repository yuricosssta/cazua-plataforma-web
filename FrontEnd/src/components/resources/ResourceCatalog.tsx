//src/components/resources/ResourceCatalog.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { resourceService, Resource, ResourceType } from '@/lib/services/resourceService';
import { Box, HardHat, Wrench, DollarSign, AlertCircle, Edit2, Archive } from "lucide-react";
import { EditResourceModal } from "./EditResourceModal";

interface ResourceCatalogProps {
  refreshKey: number;
}

export function ResourceCatalog({ refreshKey }: ResourceCatalogProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refresh interno para não precisar alterar a page.tsx pai
  const [internalRefresh, setInternalRefresh] = useState(0);

  // Estados de Edição
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const currentOrg = useSelector(selectCurrentOrg);
  const orgId = typeof currentOrg?.organizationId === "object"
    ? (currentOrg.organizationId as any)._id
    : currentOrg?.organizationId;

  useEffect(() => {
    async function fetchResources() {
      if (!orgId) return;
      try {
        setIsLoading(true);
        const data = await resourceService.listResources(orgId);
        setResources(data);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar recursos:", err);
        setError("Não foi possível carregar o catálogo de recursos.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchResources();
  }, [orgId, refreshKey, internalRefresh]);

  const triggerLocalRefresh = () => setInternalRefresh(prev => prev + 1);

  const handleInactivate = async (resource: Resource) => {
    if (!orgId) return;
    
    if (resource.currentStock !== 0) {
      alert("Operação bloqueada: Zere o saldo deste recurso antes de inativá-lo para evitar furos contábeis.");
      return;
    }

    const confirm = window.confirm(`Tem certeza que deseja inativar o recurso "${resource.name}"? Ele deixará de aparecer em novas requisições.`);
    if (!confirm) return;

    try {
      await resourceService.inactivateResource(orgId, resource._id);
      triggerLocalRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Erro ao inativar recurso.");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getCategoryBadge = (type: ResourceType) => {
    switch (type) {
      case ResourceType.MATERIAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
            <Box className="w-3.5 h-3.5" /> Material
          </span>
        );
      case ResourceType.LABOR:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium border border-orange-200">
            <HardHat className="w-3.5 h-3.5" /> Mão de Obra
          </span>
        );
      case ResourceType.EQUIPMENT:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">
            <Wrench className="w-3.5 h-3.5" /> Equipamento
          </span>
        );
      case ResourceType.CAPITAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
            <DollarSign className="w-3.5 h-3.5" /> Financeiro
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive space-y-2">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3">
        <Box className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium">Nenhum recurso ativo no almoxarifado.</p>
        <p className="text-xs opacity-70">Utilize o botão "Novo Recurso" para iniciar o catálogo.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 font-semibold text-muted-foreground">Nome do Recurso</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground">Categoria</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground">Unidade</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Custo Padrão</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Saldo Central</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {resources.map((resource) => (
            <tr key={resource._id} className="hover:bg-muted/10 transition-colors group">
              <td className="px-4 py-3 font-medium text-foreground">
                {resource.name}
              </td>
              <td className="px-4 py-3">
                {getCategoryBadge(resource.type)}
              </td>
              <td className="px-4 py-3 text-muted-foreground uppercase">
                {resource.unit}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCurrency(resource.standardCost)}
              </td>
              <td className="px-4 py-3 text-right">
                {resource.type === ResourceType.LABOR ? (
                  <span className="text-muted-foreground text-xs italic">N/A</span>
                ) : resource.type === ResourceType.CAPITAL ? (
                  <span className={`font-semibold ${resource.currentStock < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {formatCurrency(resource.currentStock)}
                  </span>
                ) : (
                  <span className={`font-semibold ${resource.currentStock <= 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {resource.currentStock} <span className="uppercase text-xs ml-0.5">{resource.unit}</span>
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingResource(resource)}
                    className="p-1.5 text-muted-foreground hover:text-primary bg-muted/50 hover:bg-muted rounded-md transition-colors"
                    title="Editar Recurso"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleInactivate(resource)}
                    className="p-1.5 text-muted-foreground hover:text-destructive bg-muted/50 hover:bg-destructive/10 rounded-md transition-colors"
                    title="Arquivar/Inativar"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orgId && (
        <EditResourceModal
          isOpen={!!editingResource}
          onClose={() => setEditingResource(null)}
          orgId={orgId}
          resource={editingResource}
          onSuccess={triggerLocalRefresh}
        />
      )}
    </div>
  );
}