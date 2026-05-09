//src/components/resources/ProjectCostTab.tsx
"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { fetchProjectStatement } from "@/lib/redux/slices/resourcesSlice";
import { ProjectCostSummary } from "./ProjectCostSummary";
import { Loader2, AlertCircle, TrendingDown } from "lucide-react";

export function ProjectCostTab({ orgId, projectId }: { orgId: string, projectId: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const { statement, loading, error } = useSelector((state: RootState) => state.resources);

  useEffect(() => {
    if (orgId && projectId) {
      dispatch(fetchProjectStatement({ orgId, projectId }));
    }
  }, [dispatch, orgId, projectId]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (error) return <div className="flex justify-center py-10 text-destructive gap-2"><AlertCircle /> {error}</div>;
  if (!statement) return null;

  return (
    <div className="flex flex-col space-y-6">
      <ProjectCostSummary data={statement} />

      <div>
        <h2 className="text-lg font-bold">Custos por recurso</h2>
        <p className="text-sm text-muted-foreground mb-4">Total de recursos aplicados ao projeto, subtraindo estornos e devoluções.</p>
        
        <div className="border border-border rounded-md overflow-hidden bg-card">
          {statement.items.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
               <TrendingDown className="w-10 h-10 mb-3 opacity-20" />
               <p className="text-sm">Nenhum custo apropriado ao projeto.</p>
             </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Recurso</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Quantidade Total</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Custo Consolidado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {statement.items.map((item) => (
                    <tr key={item.resourceId} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {item.name} <span className="text-xs font-normal text-muted-foreground">({item.type})</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-center">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}