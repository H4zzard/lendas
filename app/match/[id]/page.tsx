import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type {
  Match,
  Player,
  Squad,
  UserSquad,
  UserSquadPlayerWithPlayer,
} from "@/lib/types";
import { MatchSimulationClient } from "@/components/game/MatchSimulationClient";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-8">{children}</main>
    </div>
  );
}

function NotFound() {
  return (
    <Shell>
      <h1 className="font-heading text-4xl tracking-tight text-charcoal">
        Partida não encontrada
      </h1>
      <p className="mt-2 font-sans text-sm text-muted-foreground">
        Esta partida não existe ou não pertence a você.
      </p>
      <Link
        href="/play/world-cup"
        className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
      >
        ← Montar time
      </Link>
    </Shell>
  );
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS garante que só o dono do match consegue lê-lo.
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle<Match>();

  if (!match) {
    return <NotFound />;
  }

  // Escalação do usuário + jogadores
  const { data: userSquad } = await supabase
    .from("user_squads")
    .select("*")
    .eq("id", match.user_squad_id)
    .maybeSingle<UserSquad>();

  const { data: squadPlayers } = await supabase
    .from("user_squad_players")
    .select("*, player:players(*)")
    .eq("user_squad_id", match.user_squad_id)
    .returns<UserSquadPlayerWithPlayer[]>();

  // Adversário
  const { data: opponentSquad } = await supabase
    .from("squads")
    .select("*")
    .eq("id", match.opponent_squad_id ?? "")
    .maybeSingle<Squad>();

  const { data: opponentPlayers } = await supabase
    .from("players")
    .select("*")
    .eq("squad_id", match.opponent_squad_id ?? "")
    .order("overall", { ascending: false })
    .returns<Player[]>();

  return (
    <Shell>
      <MatchSimulationClient
        match={match}
        formationId={userSquad?.formation ?? "4-3-3"}
        userPlayers={squadPlayers ?? []}
        opponentName={opponentSquad?.display_name ?? "Adversário"}
        opponentCode={opponentSquad?.country_code ?? "ADV"}
        opponentPlayers={(opponentPlayers ?? []).slice(0, 11)}
      />
    </Shell>
  );
}
