import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Player, Squad, Tournament } from "@/lib/types";
import type { SquadWithPlayers } from "@/lib/game/draft";
import { WorldCupDraftClient } from "@/components/game/WorldCupDraftClient";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-10">{children}</main>
    </div>
  );
}

export default async function WorldCupPage() {
  const supabase = await createClient();

  // 1. Tournament Copa do Mundo
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", "world-cup")
    .maybeSingle<Tournament>();

  if (!tournament) {
    return (
      <Shell>
        <h1 className="font-heading text-4xl tracking-tight text-charcoal">
          Copa do Mundo indisponível
        </h1>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          Não encontramos o torneio. Verifique se o seed foi aplicado no
          Supabase.
        </p>
        <Link
          href="/play"
          className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
        >
          ← Voltar
        </Link>
      </Shell>
    );
  }

  // 2. Squads do torneio
  const { data: squads } = await supabase
    .from("squads")
    .select("*")
    .eq("tournament_id", tournament.id)
    .order("overall", { ascending: false })
    .returns<Squad[]>();

  // 3. Players de todos os squads
  const squadIds = (squads ?? []).map((squad) => squad.id);
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .in("squad_id", squadIds)
    .returns<Player[]>();

  // Agrupa jogadores por squad.
  const playersBySquad = new Map<string, Player[]>();
  for (const player of players ?? []) {
    const list = playersBySquad.get(player.squad_id) ?? [];
    list.push(player);
    playersBySquad.set(player.squad_id, list);
  }

  const squadsWithPlayers: SquadWithPlayers[] = (squads ?? [])
    .map((squad) => ({
      ...squad,
      players: playersBySquad.get(squad.id) ?? [],
    }))
    .filter((squad) => squad.players.length > 0);

  if (squadsWithPlayers.length === 0) {
    return (
      <Shell>
        <h1 className="font-heading text-4xl tracking-tight text-charcoal">
          Nenhuma seleção disponível
        </h1>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          As seleções e jogadores ainda não foram carregados. Aplique o
          seed.sql no Supabase.
        </p>
        <Link
          href="/play"
          className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
        >
          ← Voltar
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <WorldCupDraftClient
        squads={squadsWithPlayers}
        tournamentId={tournament.id}
      />
    </Shell>
  );
}
