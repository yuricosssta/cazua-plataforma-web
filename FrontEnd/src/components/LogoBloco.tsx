// FrontEnd/src/components/LogoBloco.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link'; // CORREÇÃO: Usar Link do Next para navegação rápida

export default function LogoBloco() {
    return (
        <div>
            <Link href="/dashboard" className="group">
                {/* Bloco do Logo */}
                <div className="flex items-center gap-3">
                    
                    {/* Imagem do Logo */}
                    {/* CORREÇÃO 1: border-stone-200 -> border-border
                        Isso faz a borda ser cinza claro no tema light e cinza escuro no dark.
                    */}
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border shadow-sm group-hover:border-primary/50 transition-colors">
                        <Image
                            src="/logo-cazua.jpg"
                            alt="Logo Cazuá"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Texto do Logo */}
                    {/* CORREÇÃO 2: text-stone-900 -> text-foreground
                        No Light: Fica quase preto.
                        No Dark: Fica branco automaticamente.
                    */}
                    <div className="font-bold text-xl tracking-tighter text-foreground leading-none group-hover:text-primary transition-colors duration-300">
                        cazuá
                        {/* CORREÇÃO 3: text-stone-400 -> text-muted-foreground
                            Garante contraste correto em ambos os temas.
                        */}
                        <span className="text-muted-foreground font-normal">.tech</span>
                    </div>
                </div>
            </Link>
        </div>
    );
};