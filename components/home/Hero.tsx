import Link from "next/link";

export function Hero() {
  return (
    <section className="flex flex-col items-center text-center">
      {/* Selo / categoria */}
      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-paper px-3 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-field-dark">
        <span className="h-1.5 w-1.5 rounded-full bg-cta" />
        Futebol histórico
      </span>

      {/* Logo textual */}
      <h1 className="font-heading text-7xl leading-none tracking-tight text-charcoal sm:text-8xl">
        LEN<span className="text-field">DAS</span>
      </h1>

      <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-muted-foreground">
        Monte seu 11 histórico. Simule. Vença. Suba no ranking.
      </p>

      {/* Card principal — placar visual */}
      <div className="paper-grain mt-8 w-full overflow-hidden rounded-2xl border border-charcoal/15 bg-field-dark text-paper shadow-[0_18px_40px_-20px_rgba(15,61,46,0.7)]">
        <div className="flex items-center justify-between border-b border-paper/15 px-5 py-2.5">
          <span className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold">
            Final · Lendas
          </span>
          <span className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-paper/60">
            90&apos;
          </span>
        </div>

        <div className="grid grid-cols-3 items-center px-5 py-7">
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold/70 font-heading text-2xl text-gold">
              A
            </span>
            <span className="font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-paper/80">
              Seu time
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 font-heading text-6xl leading-none">
              <span>0</span>
              <span className="text-gold">-</span>
              <span>0</span>
            </div>
            <span className="mt-1 font-sans text-[0.6rem] uppercase tracking-[0.25em] text-paper/50">
              Apito inicial
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-paper/40 font-heading text-2xl text-paper/80">
              B
            </span>
            <span className="font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-paper/80">
              Rival
            </span>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-6 flex w-full flex-col gap-3">
        <Link
          href="/play"
          className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
        >
          Jogar agora
        </Link>
        <Link
          href="/ranking"
          className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-xl tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
        >
          Ver ranking
        </Link>
      </div>
    </section>
  );
}
