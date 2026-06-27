import { Metadata } from 'next';
import { Footer } from "@/components/Footer";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { LandingPageHeader } from "@/components/LandingPageHeader";

export const metadata: Metadata = {
  title: 'Cazuá | Gestão inteligente de projetos',
  description: 'Pare de perder dinheiro no canteiro de obras e projetos. Sistema simples e integrado para requisição de materiais, aprovações e controle de orçamento.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <LandingPageHeader />
      <HeroSection />
      <FeatureSection />
      <PricingSection />
      <Footer />
    </main>
  );
}