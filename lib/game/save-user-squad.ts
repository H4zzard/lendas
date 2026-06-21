import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/lib/types";
import type { SimUserPlayer } from "@/lib/game/simulator";

export interface SaveUserSquadInput {
  userId: string;
  tournamentId: string;
  formation: string;
  playStyle: string;
  averageOverall: number;
  players: { player_id: string; slot_position: string }[];
}

export interface SaveUserSquadOk {
  userSquadId: string;
  userPlayers: SimUserPlayer[];
}

export interface SaveUserSquadErr {
  error: string;
  status: number;
}

/**
 * Valida a escalação e grava user_squad + user_squad_players.
 * Reutilizado por campanha (start) e Modo Amigos (create/join).
 */
export async function saveUserSquad(
  supabase: SupabaseClient,
  input: SaveUserSquadInput,
): Promise<SaveUserSquadOk | SaveUserSquadErr> {
  const { players } = input;

  if (!Array.isArray(players) || players.length !== 11) {
    return { error: "A escalação precisa ter exatamente 11 jogadores.", status: 400 };
  }

  const playerIds = players.map((p) => p.player_id);
  if (new Set(playerIds).size !== 11) {
    return { error: "Há jogadores duplicados na escalação.", status: 400 };
  }

  const { data: realPlayers } = await supabase
    .from("players")
    .select("*")
    .in("id", playerIds)
    .returns<Player[]>();
  if (!realPlayers || realPlayers.length !== 11) {
    return { error: "Alguns jogadores não foram encontrados.", status: 400 };
  }

  const playerById = new Map(realPlayers.map((p) => [p.id, p]));
  const userPlayers: SimUserPlayer[] = players.map((entry) => ({
    player: playerById.get(entry.player_id)!,
    slot_position: entry.slot_position,
  }));

  const { data: userSquad, error: squadError } = await supabase
    .from("user_squads")
    .insert({
      user_id: input.userId,
      tournament_id: input.tournamentId,
      formation: input.formation,
      play_style: input.playStyle,
      average_overall: Math.round(input.averageOverall),
    })
    .select("id")
    .single();
  if (squadError || !userSquad) {
    return { error: "Não foi possível salvar a escalação.", status: 500 };
  }

  const { error: spError } = await supabase.from("user_squad_players").insert(
    players.map((entry) => ({
      user_squad_id: userSquad.id,
      player_id: entry.player_id,
      slot_position: entry.slot_position,
    })),
  );
  if (spError) {
    return { error: "Não foi possível salvar os jogadores.", status: 500 };
  }

  return { userSquadId: userSquad.id, userPlayers };
}
