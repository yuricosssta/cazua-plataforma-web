import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { PostList } from "@/components/PostList";

export default function DashboardOverviewPage() {
  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      {/* Cabeçalho da Página (Opcional, pois já temos Breadcrumbs, mas fica bom visualmente) */}
      {/* <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o que está acontecendo na sua organização.
        </p>
      </div> */}

      {/* Grid de Layout */}
      {/* Quando fizermos os gráficos, eles entrarão na div da esquerda. Por enquanto, o Log ocupa o espaço necessário */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">

        {/* Espaço reservado para os Gráficos futuros (col-span-2) */}
        <div className="lg:col-span-2 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted/20">
          {/* <p className="text-sm text-muted-foreground text-center px-4">
            Espaço reservado para os Cards de Métricas e Gráfico de Faturamento <br/> (Implementação Futura)
          </p> */}
          <PostList />
        </div>

        {/* O nosso Activity Log (col-span-1) */}
        <div className="lg:col-span-1 h-full">
          <ActivityLog />
        </div>

      </div>
    </div>
  );
}