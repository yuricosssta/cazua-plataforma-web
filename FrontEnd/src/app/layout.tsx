//src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { cn } from "../lib/utils";
import { ThemeProvider } from "../providers/ThemeProvider";
import  AuthInitializer  from "@/providers/AuthInitializer";

export const metadata: Metadata = {
  title: "Cazuá Tech | Gestão Inteligente de Projetos",
  description: "Gerencie seus projetos com eficiência, garantindo qualidade e segurança em cada etapa do processo.",
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
    <html lang="pt-BR">
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