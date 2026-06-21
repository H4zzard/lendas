import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ModeCard } from "@/components/home/ModeCard";
import { CodeEntry } from "@/components/friends/CodeEntry";

const MODES = [
  { title: "Copa do Mundo", subtitle: "Seleções históricas", slug: "world-cup" },
  { title: "Clubes do Brasil", subtitle: "Clubes lendários", slug: "brazil-clubs" },
  { title: "Europa Lendária", subtitle: "Clubes históricos", slug: "europe-legends" },
];

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-10">
        <Link
          href="/"
          className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-charcoal"
        >
          ← Voltar
        </Link>

        <h1 className="mt-5 font-heading text-5xl leading-none tracking-tight text-charcoal">
          Modo Amigos
        </h1>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          Monte seu 11 e desafie alguém por link.
        </p>

        <section className="mt-8">
          <h2 className="mb-3 font-heading text-2xl tracking-wide text-charcoal">
            Criar desafio
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {MODES.map((mode) => (
              <Link
                key={mode.slug}
                href={`/friends/new?mode=${mode.slug}`}
                className="block"
              >
                <ModeCard
                  title={mode.title}
                  subtitle={mode.subtitle}
                  available
                />
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-heading text-2xl tracking-wide text-charcoal">
            Entrar com código
          </h2>
          <CodeEntry />
        </section>
      </main>
    </div>
  );
}
