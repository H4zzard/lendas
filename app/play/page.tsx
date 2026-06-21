import Link from "next/link";
import { ModeCard } from "@/components/home/ModeCard";

const modes = [
  {
    title: "Copa do Mundo",
    subtitle: "Seleções históricas",
    available: true,
    href: "/play/world-cup",
  },
  {
    title: "Clubes do Brasil",
    subtitle: "Clubes lendários",
    available: true,
    href: "/play/brazil-clubs",
  },
  {
    title: "Europa Lendária",
    subtitle: "Clubes históricos",
    available: true,
    href: "/play/europe-legends",
    badge: "Novo",
  },
  {
    title: "Modo Amigos",
    subtitle: "Desafie por link",
    available: true,
    href: "/friends",
  },
];

export default function PlayPage() {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-10 pt-10">
        <Link
          href="/"
          className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-charcoal"
        >
          ← Voltar
        </Link>

        <h1 className="mt-5 font-heading text-5xl leading-none tracking-tight text-charcoal">
          Escolha o modo
        </h1>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          Copa do Mundo, Clubes do Brasil e Europa Lendária já estão
          disponíveis. Mais modos em breve.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {modes.map((mode) =>
            mode.available && mode.href ? (
              <Link key={mode.title} href={mode.href} className="relative">
                {mode.badge && (
                  <span className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-gold px-2 py-0.5 font-sans text-[0.55rem] font-bold uppercase tracking-wide text-charcoal shadow">
                    {mode.badge}
                  </span>
                )}
                <ModeCard
                  title={mode.title}
                  subtitle={mode.subtitle}
                  available={mode.available}
                />
              </Link>
            ) : (
              <ModeCard
                key={mode.title}
                title={mode.title}
                subtitle={mode.subtitle}
                available={mode.available}
              />
            ),
          )}
        </div>
      </main>
    </div>
  );
}
