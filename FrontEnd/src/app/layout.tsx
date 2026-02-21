//src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { cn } from "../lib/utils";
import { ThemeProvider } from "../providers/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import  AuthInitializer  from "@/providers/AuthInitializer";
import { Footer } from "@/components/Footer";
import { SessionExpiredModal } from "@/components/SessionExpiredModal";
import { LandingPageHeader } from "@/components/LandingPageHeader";
import AuthProvider from "@/providers/AuthProvider";
// import './global.css'

// const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
        // "min-h-screen bg-backgroud font-sans antialiased max-w-6xl m-auto", 
        // fontSans.variable
      )}>
        <ThemeProvider>
          <ReduxProvider>
            {/* <AuthProvider> */}
              <AuthInitializer>
                {/* <SessionExpiredModal /> */}
                {/* <Navbar /> */}
                {/* <LandingPageHeader
                  items={[
                    { title: "Home", href: "/" },
                    { title: "Criar (provisório)", href: "/posts/new" },
                    // { title: "Features", href: "/#features" },
                    // { title: "Pricing", href: "/#pricing" },
                    // { title: "Github", href: "https://github.com/stack-auth/stack-template", external: true },
                  ]}
                /> */}
                {children}
              </AuthInitializer>
            {/* </AuthProvider> */}
          </ReduxProvider>
        </ThemeProvider>
      </body>

    </html>
  );
}