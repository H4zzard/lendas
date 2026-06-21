import { createClient } from "@/lib/supabase/server";
import type {
  CampaignRun,
  CampaignShareData,
  Match,
  PublicProfile,
  RankingEntry,
  Tournament,
  UserSquad,
  UserSquadPlayerWithPlayer,
} from "@/lib/types";
import {
  buildCampaignSummary,
  getCampaignResultLabel,
} from "@/lib/game/campaign";

export interface ShareCampaign {
  campaign: CampaignRun;
  tournament: Tournament | null;
  publicProfile: PublicProfile | null;
  status: string;
  shareData: CampaignShareData;
}

/** Selo curto exibido no card/imagem. */
export function sealFor(resultLabel: string): string {
  if (resultLabel === "Campeão") return "CAMPEÃO";
  if (resultLabel === "Vice-campeão") return "VICE";
  return "ELIMINADO";
}

/** Frase de efeito conforme o desfecho. */
export function phraseFor(status: string, resultLabel: string): string {
  if (status === "champion") return "Campanha lendária.";
  if (
    resultLabel.includes("Quartas") ||
    resultLabel.includes("Semi") ||
    resultLabel === "Vice-campeão"
  ) {
    return "Meu 11 histórico chegou longe.";
  }
  return "Monte seu 11 e tente me superar.";
}

/**
 * Carrega os dados de uma campanha pública (is_public = true) a partir do
 * public_share_id. Reutilizado pela página /share, pelo generateMetadata e
 * pela imagem Open Graph. Respeita as policies públicas e nunca expõe e-mail
 * (o nome vem da view public_profiles). Retorna null se não existir/for privada.
 */
export async function loadShareCampaign(
  shareId: string,
): Promise<ShareCampaign | null> {
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaign_runs")
    .select("*")
    .eq("public_share_id", shareId)
    .eq("is_public", true)
    .maybeSingle<CampaignRun>();

  if (!campaign) return null;

  const [
    { data: matchesData },
    { data: userSquad },
    { data: squadPlayers },
    { data: profile },
    { data: tournament },
    { data: rankingData },
  ] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .eq("campaign_run_id", campaign.id)
      .order("match_order", { ascending: true })
      .returns<Match[]>(),
    supabase
      .from("user_squads")
      .select("*")
      .eq("id", campaign.user_squad_id)
      .maybeSingle<UserSquad>(),
    supabase
      .from("user_squad_players")
      .select("*, player:players(*)")
      .eq("user_squad_id", campaign.user_squad_id)
      .returns<UserSquadPlayerWithPlayer[]>(),
    supabase
      .from("public_profiles")
      .select("id, username, display_name")
      .eq("id", campaign.user_id)
      .maybeSingle<PublicProfile>(),
    supabase
      .from("tournaments")
      .select("*")
      .eq("id", campaign.tournament_id)
      .maybeSingle<Tournament>(),
    supabase
      .from("ranking_entries")
      .select("*")
      .eq("tournament_id", campaign.tournament_id)
      .returns<RankingEntry[]>(),
  ]);

  const matches = matchesData ?? [];
  const summary = buildCampaignSummary(matches);
  const resultLabel = getCampaignResultLabel(campaign.status, matches);

  // Posição no ranking (se disponível).
  let rankingPosition: number | null = null;
  if (rankingData && rankingData.length > 0) {
    const sorted = [...rankingData].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const gdA = a.goals_for - a.goals_against;
      const gdB = b.goals_for - b.goals_against;
      if (gdB !== gdA) return gdB - gdA;
      return b.goals_for - a.goals_for;
    });
    const index = sorted.findIndex((r) => r.user_id === campaign.user_id);
    if (index >= 0) rankingPosition = index + 1;
  }

  const topPlayers = [...(squadPlayers ?? [])]
    .filter((sp) => sp.player)
    .sort((a, b) => b.player.overall - a.player.overall)
    .slice(0, 3)
    .map((sp) => ({
      first_name: sp.player.first_name,
      position: sp.player.position,
      number: sp.player.number,
      overall: sp.player.overall,
    }));

  const playerName =
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    "Jogador anônimo";

  const shareData: CampaignShareData = {
    playerName,
    statusSeal: sealFor(resultLabel),
    resultLabel,
    wins: summary.wins,
    goalsFor: summary.goalsFor,
    goalsAgainst: summary.goalsAgainst,
    goalDifference: summary.goalsFor - summary.goalsAgainst,
    averageOverall: userSquad?.average_overall ?? 0,
    topPlayers,
    phrase: phraseFor(campaign.status, resultLabel),
    rankingPosition,
  };

  return {
    campaign,
    tournament: tournament ?? null,
    publicProfile: profile ?? null,
    status: campaign.status,
    shareData,
  };
}
