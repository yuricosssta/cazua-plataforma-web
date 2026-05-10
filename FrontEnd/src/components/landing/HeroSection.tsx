//src/components/landing/HeroSection.tsx
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="bg-stone-50 px-6 py-24 text-center dark:bg-stone-950 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-6xl">
          Controle o custo real e o histórico completo das suas obras em um só lugar.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-600 dark:text-stone-300">
          Conecte o canteiro de obras ao escritório. Elimine a perda de informações, saiba exatamente o que a obra precisa e aprove pedidos de material com clareza e rastreabilidade.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/signup"
            className="rounded-md bg-[#8B4513] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#5D2E0D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4513] transition-colors"
          >
            Criar Conta Gratuita
          </Link>
          <Link href="#recursos" className="text-sm font-semibold leading-6 text-stone-900 dark:text-stone-50">
            Conheça os recursos <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}