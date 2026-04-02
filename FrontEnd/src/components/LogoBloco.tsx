// FrontEnd/src/components/LogoBloco.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function LogoBloco() {
    return (
        <div>
            <Link href="/dashboard" className="group">
                {/* Bloco do Logo */}
                <div className="flex items-center gap-3">
                    
                    {/* Imagem do Logo */}
                    <div className="relative w-11 h-11 rounded-full overflow-hidden border-s-0 border-border shadow-sm group-hover:border-primary/50 transition-colors">
                        <Image
                            src="/logo-cazua.png"
                            alt="Logo Cazuá"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Texto do Logo */}
                    <div className="font-bold text-xl tracking-tighter text-foreground leading-none group-hover:text-primary transition-colors duration-300">
                        cazuá
                        <span className="text-muted-foreground font-normal">.tech</span>
                    </div>
                </div>
            </Link>
        </div>
    );
};