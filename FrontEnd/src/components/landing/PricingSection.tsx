//src/components/lading/PricingSection.tsx
import Link from 'next/link';

export function PricingSection() {
  const tiers = [
    {
      name: 'FREE',
      id: 'tier-free',
      price: 'R$ 0',
      description: 'Ideal para autônomos ou pequenas reformas.',
      features: [
        'Gestão de até 02 obras simultâneas',
        'Armazenamento de 500MB',
        'Controle de almoxarifado básico',
        'Extrato financeiro da obra',
      ],
      cta: 'Criar Conta Gratuita',
      href: '/signup',
      featured: false,
    },
    {
      name: 'PRO',
      id: 'tier-pro',
      price: 'A definir',
      description: 'Para construtoras em crescimento.',
      features: [
        'Obras e projetos ilimitados',
        'Armazenamento de 50GB',
        'Controle completo de equipe',
        'Fluxo de aprovação de materiais',
      ],
      cta: 'Assinar PRO',
      href: '/signup?plan=pro',
      featured: true,
    },
    {
      name: 'ENTERPRISE',
      id: 'tier-enterprise',
      price: 'Sob Consulta',
      description: 'Controle em grande escala.',
      features: [
        'Obras e projetos ilimitados',
        'Armazenamento premium de 500GB',
        'Gestão Multi-Empresas (Múltiplos CNPJs)',
        'Isolamento total de dados e suporte dedicado',
      ],
      cta: 'Falar com Consultor',
      href: '/contato',
      featured: false,
    },
  ];

  return (
    <section className="bg-stone-50 px-6 py-24 dark:bg-stone-950 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-base font-semibold leading-7 text-[#8B4513]">Preços</h2>
        <p className="mt-2 text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-5xl">
          Planos que crescem com a sua construtora
        </p>
      </div>
      <div className="mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:max-w-5xl lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`flex flex-col justify-between rounded-3xl p-8 ring-1 sm:p-10 ${
              tier.featured
                ? 'bg-[#8B4513] ring-[#8B4513] text-white'
                : 'bg-white dark:bg-stone-900 ring-stone-200 dark:ring-stone-800'
            }`}
          >
            <div>
              <h3 className={`text-base font-semibold leading-7 ${tier.featured ? 'text-stone-100' : 'text-[#8B4513]'}`}>
                {tier.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-x-2">
                <span className={`text-4xl font-bold tracking-tight ${tier.featured ? 'text-white' : 'text-stone-900 dark:text-stone-50'}`}>
                  {tier.price}
                </span>
                {tier.name === 'FREE' && <span className={tier.featured ? 'text-stone-200' : 'text-stone-500'}>/mês</span>}
              </div>
              <p className={`mt-6 text-base leading-7 ${tier.featured ? 'text-stone-200' : 'text-stone-600 dark:text-stone-400'}`}>
                {tier.description}
              </p>
              <ul role="list" className={`mt-8 space-y-3 text-sm leading-6 ${tier.featured ? 'text-stone-100' : 'text-stone-600 dark:text-stone-400'}`}>
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <span aria-hidden="true" className="h-6 w-5 flex-none font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={tier.href}
              className={`mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10 ${
                tier.featured
                  ? 'bg-white text-[#8B4513] hover:bg-stone-50 focus-visible:outline-white'
                  : 'bg-[#8B4513] text-white hover:bg-[#5D2E0D] focus-visible:outline-[#8B4513]'
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}