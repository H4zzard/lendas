import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ModeCard } from "@/components/home/ModeCard";
import { createClient } from "@/lib/supabase/server";

const modes = [
  { title: "Copa do Mundo", subtitle: "Lendas mundiais", available: true },
  { title: "Brasileirão", subtitle: "Ídolos nacionais" },
  { title: "Europa", subtitle: "Gigantes do velho continente" },
  { title: "Amigos", subtitle: "Desafie quem você quiser" },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-10 pt-10">
        <div className="mb-6 flex justify-end">
          <Link
            href={user ? "/profile" : "/login"}
            className="inline-flex items-center gap-2 rounded-full border border-charcoal/20 bg-paper px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
          >
            {user ? "Perfil" : "Entrar"}
          </Link>
        </div>

        <Hero />

        <HowItWorks />

        <section className="mt-12">
          <header className="mb-5 flex items-center gap-3">
            <h2 className="font-heading text-3xl tracking-wide text-charcoal">
              Modos de jogo
            </h2>
            <span className="h-px flex-1 bg-charcoal/20" />
          </header>

          <div className="grid grid-cols-2 gap-3">
            {modes.map((mode) => (
              <ModeCard
                key={mode.title}
                title={mode.title}
                subtitle={mode.subtitle}
                available={mode.available}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="shell w-full px-5 pb-8 pt-4">
        <div className="border-t border-charcoal/15 pt-4 text-center">
          <p className="font-heading text-xl tracking-[0.2em] text-charcoal/80">
            LENDAS
          </p>
          <p className="mt-1 font-sans text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            O álbum vivo do futebol · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
