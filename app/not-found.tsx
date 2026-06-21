import Link from "next/link";

export default function NotFound() {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <span className="font-heading text-6xl leading-none tracking-tight text-charcoal">
          LEN<span className="text-field">DAS</span>
        </span>
        <span className="mt-6 font-heading text-8xl leading-none text-gold">
          404
        </span>
        <h1 className="mt-4 font-heading text-3xl tracking-wide text-charcoal">
          Essa lenda não foi encontrada.
        </h1>
        <p className="mt-2 max-w-xs font-sans text-sm text-muted-foreground">
          O link pode estar errado ou a página não existe mais.
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/play/world-cup"
            className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
          >
            Jogar agora
          </Link>
          <Link
            href="/"
            className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-xl tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
          >
            Voltar para início
          </Link>
        </div>
      </main>
    </div>
  );
}
