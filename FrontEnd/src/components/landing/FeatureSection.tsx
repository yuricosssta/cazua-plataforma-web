//src/components/landing/FeatureSection.tsx
export function FeatureSection() {
  const features = [
    {
      title: 'Histórico de Decisões Blindado',
      description: 'Todo projeto possui uma Linha do Tempo. Registre relatórios diários, anexos e mudanças de status. Nunca mais perca o rastro de quem aprovou o quê.',
    },
    {
      title: 'Controle do Custo Real',
      description: 'O Extrato da Obra consolida automaticamente tudo o que foi requisitado e entregue no canteiro, separando os custos por categoria (materiais, serviços, equipamentos).',
    },
    {
      title: 'Fim da Confusão nos Pedidos',
      description: 'O mestre de obras solicita materiais pelo sistema com exatidão. O escritório visualiza, avalia e aprova as requisições em uma esteira ágil, descontando diretamente do estoque.',
    },
  ];

  return (
    <section id="recursos" className="bg-white px-6 py-24 dark:bg-stone-900 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-base font-semibold leading-7 text-[#8B4513]">Soluções para o Canteiro</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl">
          Construído para a realidade da engenharia
        </p>
      </div>
      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none lg:grid-cols-3 lg:grid lg:gap-x-8">
        {features.map((feature) => (
          <div key={feature.title} className="flex flex-col bg-stone-50 dark:bg-stone-950 p-8 rounded-2xl mb-8 lg:mb-0 border border-stone-200 dark:border-stone-800">
            <dt className="text-xl font-semibold leading-7 text-stone-900 dark:text-stone-50">
              {feature.title}
            </dt>
            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-stone-600 dark:text-stone-400">
              <p className="flex-auto">{feature.description}</p>
            </dd>
          </div>
        ))}
      </div>
    </section>
  );
}