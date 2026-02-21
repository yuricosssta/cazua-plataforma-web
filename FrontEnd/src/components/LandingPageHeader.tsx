// FrontEnd/src/components/LandingPageHeader.tsx
"use client";

import { cn } from "@/lib/utils";
// import { useStackApp, useUser } from "@stackframe/stack";
import { Menu, User, X } from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import * as React from "react";
import { ColorModeSwitcher } from "./color-mode-switcher";
import { Button, buttonVariants } from "./ui/button";
import LogoBloco from "./LogoBloco";
import { UserNav } from "./UserNav";

interface NavProps {
  items?: {
    title: string;
    href: string;
    disabled?: boolean;
    external?: boolean;
  }[];
}

function MobileItems(props: NavProps) {
  return (
    <div className="fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 animate-in slide-in-from-bottom-80 md:hidden">
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
        <nav className="grid grid-flow-row auto-rows-max text-sm">

          {props.items?.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
                item.disabled && "cursor-not-allowed opacity-60"
              )}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
            >
              {item.title}
            </Link>
          ))}

          <div className="flex flex-col gap-2 mt-4">
            <UserNav />
            {/* <AuthButtons /> */}
          </div>
        </nav>
      </div>
    </div>
  );
}

function DesktopItems(props: NavProps) {
  const segment = useSelectedLayoutSegment();

  return (
    <nav className="hidden gap-6 md:flex">
      {/* Logo Desktop: Aparece antes do menu */}
      <LogoBloco /> 
      {props.items?.map((item, index) => (
        <Link
          key={index}
          href={item.disabled ? "#" : item.href}
          className={cn(
            "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
            item.href.startsWith(`/${segment}`)
              ? "text-foreground"
              : "text-foreground/60",
            item.disabled && "cursor-not-allowed opacity-80"
          )}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noreferrer" : undefined}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

export function LandingPageHeader(props: NavProps) {
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false);

  return (
    <header className="fixed w-full z-50 bg-background/80 px-4 md:px-8 backdrop-blur-md border-b border-border/40">
      <div className="flex h-18 items-center justify-between py-4">
        <div className="flex items-center gap-2 md:gap-10">

          {/* 1. Navegação Desktop (Escondida no Mobile) */}
          {props.items?.length ? <DesktopItems items={props.items} /> : null}

          {/* 2. Botão Menu Mobile (Escondido no Desktop) */}
          <Button
            className="space-x-2 md:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>

          {/* 3. Logo Mobile (Adicionado Aqui) */}
          {/* A classe 'md:hidden' garante que ele só apareça em telas pequenas.
              Como ele está DEPOIS do Button no código, ele aparecerá DEPOIS do ícone na tela. */}
          <div className="md:hidden flex items-center ml-2">
             <LogoBloco />
          </div>

          {showMobileMenu && props.items && <MobileItems items={props.items} />}

        </div>

        <div className="flex gap-4 items-center">
          {/* <ColorModeSwitcher /> */}
          <nav className="gap-4 items-center hidden md:flex">
            <UserNav />
            {/* <AuthButtons /> */}
          </nav>
        </div>
      </div>
    </header>
  );
}


// import React from 'react';
// import { CheckCircle, AlertTriangle, Download, Database, Lock, ArrowRight } from 'lucide-react';
// import Image from 'next/image';

// export default function LandingPage() {
//   return (
//     <div className="min-h-screen bg-stone-50 font-sans text-stone-800 selection:bg-[#8B4513] selection:text-white">
//       {/* --- HERO SECTION (Com Fundo Tech) --- */}
//       <header className="relative pt-40 pb-24 px-4 overflow-hidden">
//         {/* Fundo Decorativo (Grid) */}
//         <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
//         <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-[#8B4513] opacity-10 blur-[100px]"></div>

//         <div className="max-w-4xl mx-auto text-center">
//           {/* Badge de Alerta - Mais sutil e elegante */}
//           <div className="inline-flex items-center gap-2 bg-orange-50 text-[#8B4513] px-4 py-1.5 rounded-full text-xs font-bold mb-8 border border-orange-100 shadow-sm animate-fade-in">
//             <AlertTriangle size={14} />
//             PARE DE PERDER DINHEIRO EM OBRA
//           </div>

//           <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-stone-900 leading-[1.1]">
//             O Checklist que evita <br />
//             <span className="text-[#8B4513] relative whitespace-nowrap">
//               <svg className="absolute -bottom-2 w-full h-3 text-orange-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg>
//               5% de prejuízo
//             </span> na obra.
//           </h1>

//           <p className="text-lg md:text-xl text-stone-600 mb-10 max-w-2xl mx-auto leading-relaxed">
//             Baixe o protocolo de auditoria técnica da <strong>Cazuá Engenharia</strong>. O mesmo padrão rigoroso que estamos transformando em SaaS, disponível agora em PDF.
//           </p>

//           <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
//             {/* Botão de Compra - O destaque principal */}
//             <a
//               href="#comprar"
//               className="group w-full md:w-auto bg-[#8B4513] hover:bg-[#6d360f] text-white px-8 py-4 rounded-xl text-lg font-bold shadow-[0_10px_20px_-10px_rgba(139,69,19,0.5)] hover:shadow-[0_20px_20px_-10px_rgba(139,69,19,0.4)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
//             >
//               <Download size={24} />
//               Baixar Checklist (R$ 27,90)
//               <ArrowRight size={20} className="opacity-70 group-hover:translate-x-1 transition-transform" />
//             </a>

//             <div className="text-sm text-stone-500 flex items-center gap-2">
//               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//               Acesso imediato via e-mail
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* --- O PROBLEMA VS SOLUÇÃO --- */}
//       <section className="py-24 bg-white border-y border-stone-200">
//         <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
//           {/* Lado Esquerdo: O Problema */}
//           <div className="bg-stone-50 p-10 rounded-3xl border border-stone-100">
//             <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-stone-700">
//               <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-bold">✕</div>
//               O jeito amador
//             </h3>
//             <ul className="space-y-4 text-stone-600">
//               <li className="flex gap-3">
//                 <span className="text-red-300">•</span> Conferência "de cabeça" ou no WhatsApp.
//               </li>
//               <li className="flex gap-3">
//                 <span className="text-red-300">•</span> Esquece de verificar caimentos antes do piso.
//               </li>
//               <li className="flex gap-3">
//                 <span className="text-red-300">•</span> Patologias aparecem na garantia (prejuízo).
//               </li>
//               <li className="flex gap-3">
//                 <span className="text-red-300">•</span> Retrabalho come seu lucro.
//               </li>
//             </ul>
//           </div>

//           {/* Lado Direito: A Solução Cazuá */}
//           <div className="bg-[#8B4513] p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
//             <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-700"></div>

//             <div className="relative z-10">
//               <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold rounded-full mb-6">
//                 MÉTODO CAZUÁ
//               </div>
//               <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
//                 <CheckCircle size={24} className="text-green-300" />
//                 Engenharia de Verdade
//               </h3>
//               <ul className="space-y-4 font-medium text-orange-50">
//                 <li className="flex items-start gap-3">
//                   <CheckCircle size={18} className="mt-1 text-green-300 shrink-0" /> Auditoria sistemática por etapas.
//                 </li>
//                 <li className="flex items-start gap-3">
//                   <CheckCircle size={18} className="mt-1 text-green-300 shrink-0" /> Prevenção de patologias ocultas.
//                 </li>
//                 <li className="flex items-start gap-3">
//                   <CheckCircle size={18} className="mt-1 text-green-300 shrink-0" /> Economia de materiais e mão de obra.
//                 </li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* --- SOBRE O AUTOR & SAAS --- */}
//       <section className="py-24 bg-stone-900 text-stone-300 relative overflow-hidden">
//         {/* Efeito de luz ao fundo */}
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8B4513] opacity-20 blur-[120px] rounded-full pointer-events-none"></div>

//         <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
//           <div className="w-24 h-24 bg-stone-800 rounded-full mx-auto mb-8 flex items-center justify-center text-3xl font-bold text-white border-4 border-[#8B4513] shadow-xl">
//             CZ
//           </div>
//           <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Quem criou este protocolo?</h2>
//           <p className="text-xl text-stone-400 mb-12 leading-relaxed">
//             Sou Engenheiro Civil e Desenvolvedor Full Stack. Com 3 pós-graduações, cansei de ver dinheiro sendo rasgado em obra por falta de processo.
//           </p>

//           <div className="bg-stone-800/50 backdrop-blur-sm p-8 rounded-2xl border border-stone-700 text-left hover:border-[#8B4513]/50 transition-colors">
//             <div className="flex items-center gap-4 mb-4">
//               <div className="p-3 bg-[#8B4513]/20 rounded-lg text-[#8B4513]">
//                 <Database size={24} />
//               </div>
//               <div>
//                 <h4 className="font-bold text-white text-lg">O Futuro: Cazuá SaaS</h4>
//                 <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Em Desenvolvimento</p>
//               </div>
//             </div>
//             <p className="text-stone-400 mb-6">
//               Este checklist é a lógica base do software de gestão que estou programando. Ao comprar o PDF, você financia o desenvolvimento e entra na lista VIP.
//             </p>

//             {/* <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
//               <input 
//                 type="email" 
//                 placeholder="Seu e-mail para lista de espera" 
//                 className="bg-stone-950 border border-stone-700 rounded-lg px-4 py-3 w-full text-sm focus:outline-none focus:border-[#8B4513] text-white transition-all placeholder:text-stone-600"
//               />
//               <button 
//                 type="submit"
//                 className="bg-stone-700 hover:bg-stone-600 px-6 py-3 rounded-lg text-sm font-bold transition-colors text-white shrink-0"
//               >
//                 Entrar
//               </button>
//             </form> */}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };