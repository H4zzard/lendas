const steps = [
  {
    number: "01",
    title: "Role o sorteio",
    description: "Gire e descubra quais lendas entram no seu elenco.",
  },
  {
    number: "02",
    title: "Monte seu 11",
    description: "Escale o time histórico na tática que combina com você.",
  },
  {
    number: "03",
    title: "Assista à partida",
    description: "Veja a simulação lance a lance e busque a vitória.",
  },
];

export function HowItWorks() {
  return (
    <section className="mt-12">
      <header className="mb-5 flex items-center gap-3">
        <h2 className="font-heading text-3xl tracking-wide text-charcoal">
          Como funciona
        </h2>
        <span className="h-px flex-1 bg-charcoal/20" />
      </header>

      <ol className="flex flex-col gap-3">
        {steps.map((step) => (
          <li
            key={step.number}
            className="flex items-start gap-4 rounded-xl border border-charcoal/10 bg-paper px-4 py-4"
          >
            <span className="font-heading text-4xl leading-none text-gold">
              {step.number}
            </span>
            <div>
              <h3 className="font-sans text-base font-bold text-charcoal">
                {step.title}
              </h3>
              <p className="mt-0.5 font-sans text-sm leading-snug text-muted-foreground">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
