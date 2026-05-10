"use client";

import { HardHat, Activity, Wallet } from 'lucide-react';
import LogoBloco from '@/components/LogoBloco';

export function ComercialLogin() {
    return (
        <div>
            {/* LADO DIREITO: Atualizado com Copywriting Comercial */}
            <div className="relative hidden lg:flex h-full flex-col bg-zinc-950 text-white p-10 dark:border-r">
                <div className="absolute inset-0 bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,69,19,0.3),rgba(255,255,255,0))]" />

                <div className="relative z-20 flex items-center text-lg font-medium gap-2">
                    <LogoBloco />
                </div>

                <div className="relative z-20 mt-auto mb-auto max-w-lg mx-auto">
                    <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
                        Controle o custo real e o histórico das suas obras.
                    </h2>
                    <div className="space-y-6 text-zinc-400">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800 text-zinc-300">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-zinc-200 font-semibold">Histórico de Decisões Blindado</h4>
                                <p className="text-sm leading-relaxed mt-1">Registre relatórios diários, anexos e mudanças de status. Nunca mais perca o rastro de quem aprovou o quê.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800 text-zinc-300">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-zinc-200 font-semibold">Controle do Custo Real</h4>
                                <p className="text-sm leading-relaxed mt-1">Consolide tudo o que foi requisitado e entregue no canteiro, separando os custos por materiais, serviços e equipamentos.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800 text-zinc-300">
                                <HardHat className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-zinc-200 font-semibold">Fim da Confusão nos Pedidos</h4>
                                <p className="text-sm leading-relaxed mt-1">O mestre de obras solicita materiais com exatidão e o escritório aprova descontando diretamente do estoque central.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-20 mt-auto text-sm text-zinc-500 font-medium">
                    © {new Date().getFullYear()} Grupo Cazuá. Sistema de Gestão para Construção Civil.
                </div>
            </div>
        </div>
    );
}