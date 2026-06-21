import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignRun, Match, RankingEntry } from "@/lib/types";

export interface CampaignRankingStats {
  wins: number;
  losses: number;
  draws: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  best_overall: number;
  championships: number;
}

/** Estatísticas finais de uma campanha, a partir das suas partidas. */
export function calculateCampaignRankingStats(
  campaign: Pick<CampaignRun, "status">,
  matches: Match[],
  averageOverall: number,
): CampaignRankingStats {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const match of matches) {
    goalsFor += match.user_score;
    goalsAgainst += match.opponent_score;
    if (match.user_score > match.opponent_score) wins += 1;
    else if (match.user_score === match.opponent_score) draws += 1;
    else losses += 1;
  }

  return {
    wins,
    losses,
    draws,
    goals_for: goalsFor,
    goals_against: goalsAgainst,
    goal_difference: goalsFor - goalsAgainst,
    best_overall: averageOverall,
    championships: campaign.status === "champion" ? 1 : 0,
  };
}

const TERMINAL_STATUSES = ["eliminated", "champion", "completed"];

export interface ApplyResult {
  applied: boolean;
  error?: string;
}

/**
 * Aplica o resultado de uma campanha encerrada ao ranking_entries do usuário.
 * Idempotente: usa um "claim" atômico em campaign_runs.ranking_applied para
 * garantir que cada campanha conte no ranking apenas uma vez, mesmo com
 * múltiplos cliques. Deve ser chamada server-side, em rota autenticada.
 */
export async function applyCampaignToRanking(
  supabase: SupabaseClient,
  campaignId: string,
  userId: string,
): Promise<ApplyResult> {
  const { data: campaign } = await supabase
    .from("campaign_runs")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle<CampaignRun>();

  if (!campaign) return { applied: false, error: "Campanha não encontrada." };
  if (campaign.user_id !== userId) return { applied: false, error: "Acesso negado." };
  if (!TERMINAL_STATUSES.includes(campaign.status)) return { applied: false };
  if (campaign.ranking_applied) return { applied: false };

  // Claim atômico: só prossegue quem conseguir virar false -> true.
  const { data: claimed } = await supabase
    .from("campaign_runs")
    .update({ ranking_applied: true, completed_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("ranking_applied", false)
    .select("id");

  if (!claimed || claimed.length === 0) {
    return { applied: false }; // já aplicado por outra requisição
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("campaign_run_id", campaignId)
    .returns<Match[]>();

  const { data: userSquad } = await supabase
    .from("user_squads")
    .select("average_overall")
    .eq("id", campaign.user_squad_id)
    .maybeSingle<{ average_overall: number }>();

  const stats = calculateCampaignRankingStats(
    campaign,
    matches ?? [],
    userSquad?.average_overall ?? 0,
  );

  const { data: existing } = await supabase
    .from("ranking_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("tournament_id", campaign.tournament_id)
    .maybeSingle<RankingEntry>();

  const next = {
    user_id: userId,
    tournament_id: campaign.tournament_id,
    wins: (existing?.wins ?? 0) + stats.wins,
    losses: (existing?.losses ?? 0) + stats.losses,
    goals_for: (existing?.goals_for ?? 0) + stats.goals_for,
    goals_against: (existing?.goals_against ?? 0) + stats.goals_against,
    best_overall: Math.max(existing?.best_overall ?? 0, stats.best_overall),
    campaigns_played: (existing?.campaigns_played ?? 0) + 1,
    championships: (existing?.championships ?? 0) + stats.championships,
    best_campaign_wins: Math.max(existing?.best_campaign_wins ?? 0, stats.wins),
    best_goal_difference: Math.max(
      existing?.best_goal_difference ?? 0,
      stats.goal_difference,
    ),
  };

  const { error } = await supabase
    .from("ranking_entries")
    .upsert(next, { onConflict: "user_id,tournament_id" });

  if (error) {
    return { applied: false, error: error.message };
  }

  return { applied: true };
}
