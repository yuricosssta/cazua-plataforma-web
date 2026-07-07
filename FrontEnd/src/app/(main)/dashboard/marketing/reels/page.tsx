//src/app/(main)/dashboard/marketing/reels/page.tsx
import React from 'react';
import ReelGenerator from '@/components/summary/ReelGenerator';

export const metadata = {
  title: 'Gerador de Reels IA | Sistema Cazuá',
  description: 'Geração automatizada de roteiros B2B.',
};

export default function ReelsPage() {
  return (
    <div className="flex flex-col space-y-6 w-full max-w-7xl mx-auto p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Criação de Conteúdo Publicitário - Vídeos até 60 segundos
        </h1>
        <p className="text-muted-foreground text-sm">
          Crie roteiros técnicos alinhados à sua linha editorial. Suas configurações em andamento são salvas localmente.
        </p>
      </div>

      <div className="mt-6">
        <ReelGenerator />
      </div>
    </div>
  );
}