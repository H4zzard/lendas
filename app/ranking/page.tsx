import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PublicProfile, RankingEntry, Tournament } from "@/lib/types";
import { TrackEvent } from "@/components/analytics/TrackEvent";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-10">{children}</main>
    </div>
  );
}

const MODES = [
  { label: "Copa do Mundo", available: true },
  { label: "Brasileirão", available: false },
  { label: "Europa", available: false },
];

function nameOf(profile: PublicProfile | undefined): string {
  return (
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    "Jogador anônimo"
  );
}

export default async function RankingPage() {
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", "world-cup")
    .maybeSingle<Tournament>();

  let entries: RankingEntry[] = [];
  const profileById = new Map<string, PublicProfile>();

  if (tournament) {
    const { data: rankingData } = await supabase
      .from("ranking_entries")
      .select("*")
      .eq("tournament_id", tournament.id)
      .returns<RankingEntry[]>();
    entries = rankingData ?? [];

    const userIds = entries.map((e) => e.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, username, display_name")
        .in("id", userIds)
        .returns<PublicProfile[]>();
      for (const p of profiles ?? []) profileById.set(p.id, p);
    }
  }

  // Ordenação conforme os critérios da etapa.
  entries.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const gdA = a.goals_for - a.goals_against;
    const gdB = b.goals_for - b.goals_against;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    if (a.goals_against !== b.goals_against) return a.goals_against - b.goals_against;
    if (b.best_overall !== a.best_overall) return b.best_overall - a.best_overall;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const medal = ["text-gold", "text-charcoal/60", "text-cta"];

  return (
    <Shell>
      <TrackEvent event="ranking_viewed" />
      <Link
        href="/"
        className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-charcoal"
      >
        ← Voltar
      </Link>

      <header className="mt-5">
        <h1 className="font-heading text-5xl leading-none tracking-tight text-charcoal">
          Ranking
        </h1>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          As maiores lendas por campeonato.
        </p>
      </header>

      {/* Filtro de campeonatos (Copa ativa; demais em breve) */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {MODES.map((mode) => (
          <span
            key={mode.label}
            className={`shrink-0 rounded-full border px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider ${
              mode.available
                ? "border-field bg-field text-paper"
                : "border-charcoal/15 bg-paper text-muted-foreground"
            }`}
          >
            {mode.label}
            {!mode.available && " · em breve"}
          </span>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-charcoal/20 bg-paper px-6 py-14 text-center">
          <span className="font-heading text-4xl text-gold">🏆</span>
          <p className="mt-3 max-w-xs font-sans text-sm text-muted-foreground">
            Ainda não há lendas no ranking. Monte seu 11 e comece uma campanha.
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 */}
          <section className="mt-7 flex flex-col gap-2">
            {podium.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl border border-charcoal/15 bg-field-dark px-4 py-3 text-paper"
              >
                <span className={`font-heading text-4xl leading-none ${medal[index]}`}>
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-2xl leading-none tracking-wide">
                    {nameOf(profileById.get(entry.user_id))}
                  </span>
                  <span className="mt-1 block font-sans text-[0.65rem] uppercase tracking-wider text-paper/70">
                    {entry.championships > 0 && `${entry.championships}× campeão · `}
                    {entry.campaigns_played} camp. · overall {entry.best_overall}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-heading text-3xl leading-none text-gold">
                    {entry.wins}
                  </span>
                  <span className="font-sans text-[0.55rem] uppercase tracking-wider text-paper/60">
                    vitórias
                  </span>
                </div>
              </div>
            ))}
          </section>

          {/* Demais */}
          {rest.length > 0 && (
            <section className="mt-3 overflow-hidden rounded-xl border border-charcoal/10 bg-paper">
              <div className="grid grid-cols-[1.6rem_1fr_2.5rem_2.5rem_2.5rem] gap-2 border-b border-charcoal/10 px-3 py-2 font-sans text-[0.55rem] font-bold uppercase tracking-wide text-muted-foreground">
                <span>#</span>
                <span>Jogador</span>
                <span className="text-center">V</span>
                <span className="text-center">SG</span>
                <span className="text-center">OVR</span>
              </div>
              {rest.map((entry, index) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[1.6rem_1fr_2.5rem_2.5rem_2.5rem] items-center gap-2 border-b border-charcoal/5 px-3 py-2.5 font-sans text-sm text-charcoal"
                >
                  <span className="text-muted-foreground">{index + 4}</span>
                  <span className="truncate font-semibold">
                    {nameOf(profileById.get(entry.user_id))}
                  </span>
                  <span className="text-center font-heading text-base">
                    {entry.wins}
                  </span>
                  <span className="text-center">
                    {entry.goals_for - entry.goals_against}
                  </span>
                  <span className="text-center">{entry.best_overall}</span>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {/* Ações */}
      <section className="mt-10 flex flex-col gap-3">
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
          Voltar
        </Link>
      </section>
    </Shell>
  );
}
