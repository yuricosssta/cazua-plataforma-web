//src/app/(main)/dashboard/page.tsx
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { PersonalTasksPanel } from "@/components/dashboard/PersonalTasksPanel";

export default function DashboardOverviewPage() {
  return (
    <div className="h-full flex flex-col flex-1 mx-auto w-full">
      {/* Grid de Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">

        {/* Célula Esquerda (Métricas e Ações) */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <DashboardMetrics />
        </div>

        {/* Célula Direita (Tarefas + Activity Log) */}
        <div className="lg:col-span-1 h-full flex flex-col gap-6">
          {/* O Painel de Tarefas fica com altura fixa de 350px (definido no componente) */}
          <PersonalTasksPanel />
          
          {/* O Activity Log ocupa o restante do espaço vertical */}
          <div className="flex-1 overflow-hidden">
            <ActivityLog />
          </div>
        </div>

      </div>
    </div>
  );
}