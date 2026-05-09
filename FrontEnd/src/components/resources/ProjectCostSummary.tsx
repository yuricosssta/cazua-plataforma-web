//src/components/resources/ProjectCostSummary.tsx
import React from 'react';
import { ProjectStatement } from "@/lib/services/resourceService";

interface ProjectCostSummaryProps {
  data: ProjectStatement;
}

export function ProjectCostSummary({ data }: ProjectCostSummaryProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Mapeamento semântico para exibição de nomenclaturas técnicas
  const categoryLabels: Record<string, string> = {
    MATERIAL: "Material",
    LABOR: "Mão de Obra",
    EQUIPMENT: "Equipamento",
    CAPITAL: "Capital / Verba",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card border border-border p-6 rounded-md shadow-sm mb-6">
      <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6 flex flex-col justify-center">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Custo Direto Acumulado
        </span>
        <div className="text-3xl font-black mt-2 text-foreground">
          {formatCurrency(data.totalAccumulated)}
        </div>
      </div>

      <div className="md:col-span-2 space-y-4 flex flex-col justify-center">
        {data.categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum custo apropriado ainda.</p>
        ) : (
          data.categories.map((cat) => (
            <div key={cat.type} className="space-y-1.5">
              <div className="flex justify-between items-end text-sm">
                <span className="font-semibold text-foreground">
                  {categoryLabels[cat.type] || cat.type}
                </span>
                <span className="text-muted-foreground font-medium text-xs">
                  {formatCurrency(cat.total)} ({cat.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}