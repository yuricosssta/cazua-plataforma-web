//src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from 'next/font/google';
import { ReduxProvider } from "@/providers/ReduxProvider";
import { cn } from "../lib/utils";
import { ThemeProvider } from "../providers/ThemeProvider";
import AuthInitializer from "@/providers/AuthInitializer";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    template: '%s | Cazuá',
    default: 'Cazuá - Gestão Inteligente de Projetos',
  },
  description: "Sistema B2B para construtoras e engenheiros civis. Controle almoxarifado, extrato de custos e histórico de decisões do canteiro de obras em tempo real.",
  keywords: ['gestão de obras', 'construção civil', 'controle de custos', 'almoxarifado', 'diário de obra', 'software para construtoras'],
  openGraph: {
    title: 'Cazuá - Gestão Inteligente de Projetos',
    description: 'Conecte o canteiro de obras ao escritório. Elimine desperdícios e controle o custo real das suas construções.',
    url: 'https://grupocazua.com.br',
    siteName: 'Cazuá',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={cn(
      )}>
        <ThemeProvider>
          <ReduxProvider>
            <AuthInitializer>
              {children}
            </AuthInitializer>
          </ReduxProvider>
        </ThemeProvider>
      </body>

    </html>
  );
}