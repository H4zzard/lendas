"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <span className="font-heading text-6xl leading-none tracking-tight text-charcoal">
          LEN<span className="text-field">DAS</span>
        </span>
        <h1 className="mt-8 font-heading text-4xl tracking-wide text-charcoal">
          O jogo encontrou um erro.
        </h1>
        <p className="mt-2 max-w-xs font-sans text-sm text-muted-foreground">
          Algo deu errado por aqui. Você pode tentar de novo ou voltar ao
          início.
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
          >
            Tentar novamente
          </button>
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
