import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/lib/types";
import { FORMATIONS, getFormation } from "@/lib/game/formations";
import { reconstructSlots, type SquadWithPlayers } from "@/lib/game/draft";
import {
  calcAttackScore,
  calcAverageOverall,
  calcDefenseScore,
} from "@/lib/game/scores";
import { simulateMatch, type SimUserPlayer } from "@/lib/game/simulator";

export interface CreateMatchParams {
  userId: string;
  campaignRunId: string;
  userSquadId: string;
  tournamentId: string;
  formation: string;
  playStyle: string;
  userPlayers: SimUserPlayer[];
  opponentSquad: SquadWithPlayers;
  opponentSquadId: string;
  stage: string;
  matchOrder: number;
  isKnockout: boolean;
}

/** Carrega um squad com seus jogadores (para servir de adversário). */
export async function loadSquadWithPlayers(
  supabase: SupabaseClient,
  squadId: string,
): Promise<SquadWithPlayers | null> {
  const { data: squad } = await supabase
    .from("squads")
    .select("*")
    .eq("id", squadId)
    .maybeSingle();
  if (!squad) return null;

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("squad_id", squadId)
    .returns<Player[]>();

  return { ...squad, players: players ?? [] } as SquadWithPlayers;
}

/**
 * Simula e grava uma partida vinculada a uma campanha.
 * Recalcula overall/ataque/defesa a partir dos jogadores reais, garantindo
 * consistência sem depender de valores enviados pelo client.
 */
export async function createAndSimulateMatch(
  supabase: SupabaseClient,
  params: CreateMatchParams,
): Promise<{ matchId: string } | { error: string }> {
  const formation = getFormation(params.formation) ?? FORMATIONS[0];
  const slots = reconstructSlots(formation, params.userPlayers);

  const averageOverall = calcAverageOverall(slots);
  const attackScore = calcAttackScore(slots);
  const defenseScore = calcDefenseScore(slots);

  const result = simulateMatch({
    userPlayers: params.userPlayers,
    opponentSquad: params.opponentSquad,
    formation: params.formation,
    playStyle: params.playStyle,
    averageOverall,
    attackScore,
    defenseScore,
  });

  const { data: match, error } = await supabase
    .from("matches")
    .insert({
      user_id: params.userId,
      user_squad_id: params.userSquadId,
      tournament_id: params.tournamentId,
      opponent_squad_id: params.opponentSquadId,
      user_score: result.user_score,
      opponent_score: result.opponent_score,
      user_won: result.user_won,
      match_events: result.match_events,
      stats: result.stats,
      campaign_run_id: params.campaignRunId,
      stage: params.stage,
      match_order: params.matchOrder,
      is_knockout: params.isKnockout,
    })
    .select("id")
    .single();

  if (error || !match) {
    return { error: "Não foi possível salvar a partida." };
  }

  return { matchId: match.id };
}
