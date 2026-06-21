import { createClient } from "@/lib/supabase/server";
import type { Player, Squad, Tournament } from "@/lib/types";
import type { SquadWithPlayers } from "@/lib/game/draft";

/**
 * Carrega um torneio pelo slug com seus squads e jogadores agrupados.
 * Genérico: serve Copa do Mundo, Clubes do Brasil e futuros modos.
 */
export async function loadTournamentDraft(slug: string): Promise<{
  tournament: Tournament | null;
  squads: SquadWithPlayers[];
}> {
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Tournament>();

  if (!tournament) return { tournament: null, squads: [] };

  const { data: squads } = await supabase
    .from("squads")
    .select("*")
    .eq("tournament_id", tournament.id)
    .order("overall", { ascending: false })
    .returns<Squad[]>();

  const squadIds = (squads ?? []).map((s) => s.id);
  const { data: players } =
    squadIds.length > 0
      ? await supabase
          .from("players")
          .select("*")
          .in("squad_id", squadIds)
          .returns<Player[]>()
      : { data: [] as Player[] };

  const playersBySquad = new Map<string, Player[]>();
  for (const player of players ?? []) {
    const list = playersBySquad.get(player.squad_id) ?? [];
    list.push(player);
    playersBySquad.set(player.squad_id, list);
  }

  const squadsWithPlayers: SquadWithPlayers[] = (squads ?? [])
    .map((squad) => ({ ...squad, players: playersBySquad.get(squad.id) ?? [] }))
    .filter((squad) => squad.players.length > 0);

  return { tournament, squads: squadsWithPlayers };
}
