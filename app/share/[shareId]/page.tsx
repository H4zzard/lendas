import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type {
  CampaignRun,
  CampaignShareData,
  Match,
  PublicProfile,
  RankingEntry,
  UserSquad,
  UserSquadPlayerWithPlayer,
} from "@/lib/types";
import {
  buildCampaignSummary,
  getCampaignResultLabel,
} from "@/lib/game/campaign";
import { ShareActions } from "@/components/share/ShareActions";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-10">{children}</main>
    </div>
  );
}

function NotFound() {
  return (
    <Shell>
      <h1 className="font-heading text-4xl tracking-tight text-charcoal">
        Campanha não encontrada
      </h1>
      <p className="mt-2 font-sans text-sm text-muted-foreground">
        Este link não existe ou a campanha não está pública.
      </p>
      <Link
        href="/play/world-cup"
        className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
      >
        Montar meu 11 →
      </Link>
    </Shell>
  );
}

function sealFor(resultLabel: string): string {
  if (resultLabel === "Campeão") return "CAMPEÃO";
  if (resultLabel === "Vice-campeão") return "VICE";
  return "ELIMINADO";
}

function phraseFor(status: string, resultLabel: string): string {
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

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaign_runs")
    .select("*")
    .eq("public_share_id", shareId)
    .eq("is_public", true)
    .maybeSingle<CampaignRun>();

  if (!campaign) return <NotFound />;

  const { data: matchesData } = await supabase
    .from("matches")
    .select("*")
    .eq("campaign_run_id", campaign.id)
    .order("match_order", { ascending: true })
    .returns<Match[]>();
  const matches = matchesData ?? [];

  const { data: userSquad } = await supabase
    .from("user_squads")
    .select("*")
    .eq("id", campaign.user_squad_id)
    .maybeSingle<UserSquad>();

  const { data: squadPlayers } = await supabase
    .from("user_squad_players")
    .select("*, player:players(*)")
    .eq("user_squad_id", campaign.user_squad_id)
    .returns<UserSquadPlayerWithPlayer[]>();

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("id, username, display_name")
    .eq("id", campaign.user_id)
    .maybeSingle<PublicProfile>();

  // Posição no ranking (se existir)
  let rankingPosition: number | null = null;
  const { data: rankingData } = await supabase
    .from("ranking_entries")
    .select("*")
    .eq("tournament_id", campaign.tournament_id)
    .returns<RankingEntry[]>();
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

  const summary = buildCampaignSummary(matches);
  const resultLabel = getCampaignResultLabel(campaign.status, matches);

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

  const data: CampaignShareData = {
    playerName:
      profile?.display_name?.trim() ||
      profile?.username?.trim() ||
      "Jogador anônimo",
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

  return (
    <Shell>
      <header className="mb-6 text-center">
        <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.3em] text-field-dark">
          Campanha compartilhada
        </span>
      </header>

      <ShareActions data={data} shareId={shareId} />

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/play/world-cup"
          className="flex h-14 w-full items-center justify-center rounded-xl bg-field font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(31,122,77,0.8)] transition-transform active:scale-[0.98]"
        >
          Montar meu 11
        </Link>
        <Link
          href="/ranking"
          className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-xl tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
        >
          Ver ranking
        </Link>
      </div>
    </Shell>
  );
}
