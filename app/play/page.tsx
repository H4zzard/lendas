import Link from "next/link";
import { ModeCard } from "@/components/home/ModeCard";

const modes = [
  { title: "Copa do Mundo", subtitle: "Lendas mundiais", available: true },
  { title: "Brasileirão", subtitle: "Ídolos nacionais" },
  { title: "Europa", subtitle: "Gigantes do velho continente" },
  { title: "Amigos", subtitle: "Desafie quem você quiser" },
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
          Comece pela Copa do Mundo. Os outros modos chegam em breve.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {modes.map((mode) =>
            mode.available ? (
              <Link key={mode.title} href="/play/world-cup">
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
