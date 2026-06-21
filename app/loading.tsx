export default function Loading() {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <span className="font-heading text-6xl leading-none tracking-tight text-charcoal">
          LEN<span className="text-field">DAS</span>
        </span>
        <div className="mt-8 h-9 w-9 animate-spin rounded-full border-[3px] border-charcoal/15 border-t-field" />
        <p className="mt-5 font-sans text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Carregando o gramado…
        </p>
      </main>
    </div>
  );
}
