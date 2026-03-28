//src/app/(main)/dashboard/layout.tsx
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // O Container mestre: Tela cheia, flexível, com fundo base
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />
      {/* Área Principal (Onde vai o Header e o Conteúdo da Página) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        {/* Área de Conteúdo Rolável (O page.tsx é renderizado aqui dentro) */}
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
        
      </main>
    </div>
  );
}