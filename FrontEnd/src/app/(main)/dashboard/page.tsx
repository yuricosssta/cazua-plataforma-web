//src/app/(main)/dashboard/page.tsx
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";

export default function DashboardOverviewPage() {
  return (
    <div className="h-full flex flex-col flex-1 mx-auto w-full">
      {/* Grid de Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">

        {/* Célula Esquerda (Métricas e Ações) */}
        <div className="lg:col-span-2">
          <DashboardMetrics />
        </div>

        {/* Célula Direita (O nosso Activity Log) */}
        <div className="lg:col-span-1 h-full">
          <ActivityLog />
        </div>

      </div>
    </div>
  );
}