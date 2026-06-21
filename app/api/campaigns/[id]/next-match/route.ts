import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  CampaignRun,
  Match,
  Player,
  Squad,
  UserSquad,
  UserSquadPlayerWithPlayer,
} from "@/lib/types";
import type { SimUserPlayer } from "@/lib/game/simulator";
import {
  calculateGroupTable,
  chooseNextOpponent,
  getNextStage,
  hasQualifiedFromGroup,
  resolveKnockout,
} from "@/lib/game/campaign";
import {
  createAndSimulateMatch,
  loadSquadWithPlayers,
} from "@/lib/game/match-runner";
import { applyCampaignToRanking } from "@/lib/game/ranking";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Não autenticado." }, 401);

  // Campanha (RLS garante posse)
  const { data: campaign } = await supabase
    .from("campaign_runs")
    .select("*")
    .eq("id", id)
    .maybeSingle<CampaignRun>();
  if (!campaign) return json({ error: "Campanha não encontrada." }, 404);

  // Já encerrada → nada a fazer
  if (campaign.status !== "active") {
    return json({ redirect_url: `/campaign/${campaign.id}` });
  }

  // Partidas da campanha
  const { data: matchesData } = await supabase
    .from("matches")
    .select("*")
    .eq("campaign_run_id", campaign.id)
    .order("match_order", { ascending: true })
    .returns<Match[]>();
  const matches = matchesData ?? [];

  // Escalação do usuário
  const { data: userSquad } = await supabase
    .from("user_squads")
    .select("*")
    .eq("id", campaign.user_squad_id)
    .maybeSingle<UserSquad>();
  if (!userSquad) return json({ error: "Escalação não encontrada." }, 404);

  const { data: squadPlayers } = await supabase
    .from("user_squad_players")
    .select("*, player:players(*)")
    .eq("user_squad_id", campaign.user_squad_id)
    .returns<UserSquadPlayerWithPlayer[]>();

  const userPlayers: SimUserPlayer[] = (squadPlayers ?? []).map((sp) => ({
    player: sp.player,
    slot_position: sp.slot_position,
  }));

  const { data: allSquads } = await supabase
    .from("squads")
    .select("*")
    .eq("tournament_id", campaign.tournament_id)
    .returns<Squad[]>();
  const squads = allSquads ?? [];

  const groupMatches = matches.filter((m) => m.stage === "grupos");
  const knockoutMatches = matches.filter((m) => m.is_knockout);
  const playedOpponentIds = matches
    .map((m) => m.opponent_squad_id)
    .filter((id): id is string => Boolean(id));
  const groupOpponentIds = campaign.bracket?.group_opponents ?? [];

  // Helper para criar a próxima partida vinculada à campanha.
  async function createMatch(
    opponentId: string,
    stage: string,
    matchOrder: number,
    isKnockout: boolean,
  ) {
    const opponentSquad = await loadSquadWithPlayers(supabase, opponentId);
    if (!opponentSquad) return null;
    const created = await createAndSimulateMatch(supabase, {
      userId: user!.id,
      campaignRunId: campaign!.id,
      userSquadId: campaign!.user_squad_id,
      tournamentId: campaign!.tournament_id,
      formation: userSquad!.formation,
      playStyle: userSquad!.play_style,
      userPlayers,
      opponentSquad,
      opponentSquadId: opponentId,
      stage,
      matchOrder,
      isKnockout,
    });
    return created;
  }

  // -------------------------------------------------------------------
  // CASO A: ainda faltam jogos de grupo
  // -------------------------------------------------------------------
  if (groupMatches.length < 3) {
    const order = groupMatches.length + 1;
    const opponentId = groupOpponentIds[order - 1];
    if (!opponentId) return json({ error: "Adversário de grupo ausente." }, 500);

    const created = await createMatch(opponentId, "grupos", order, false);
    if (!created || "error" in created) {
      return json({ error: "Falha ao criar próximo jogo." }, 500);
    }
    return json({ redirect_url: `/match/${created.matchId}` });
  }

  // -------------------------------------------------------------------
  // CASO B: grupo terminou, decidir classificação
  // -------------------------------------------------------------------
  if (knockoutMatches.length === 0) {
    const opponents = groupOpponentIds
      .map((oid) => squads.find((s) => s.id === oid))
      .filter((s): s is Squad => Boolean(s))
      .map((s) => ({ id: s.id, name: s.display_name, code: s.country_code }));

    const table = calculateGroupTable(
      groupMatches,
      opponents,
      campaign.bracket?.group_results ?? [],
    );
    const userRow = table.find((r) => r.is_user);
    const qualified = hasQualifiedFromGroup(table);

    // Persistir tabela + estatísticas do grupo
    await supabase
      .from("campaign_runs")
      .update({
        group_table: table,
        group_points: userRow?.points ?? 0,
        group_wins: userRow?.wins ?? 0,
        group_draws: userRow?.draws ?? 0,
        group_losses: userRow?.losses ?? 0,
        goals_for: userRow?.goals_for ?? 0,
        goals_against: userRow?.goals_against ?? 0,
        current_stage: qualified ? "oitavas" : "encerrada",
        status: qualified ? "active" : "eliminated",
      })
      .eq("id", campaign.id);

    if (!qualified) {
      await applyCampaignToRanking(supabase, campaign.id, user.id);
      return json({ redirect_url: `/campaign/${campaign.id}` });
    }

    const opponent = chooseNextOpponent(squads, playedOpponentIds);
    if (!opponent) return json({ error: "Sem adversário para o mata-mata." }, 500);

    const created = await createMatch(opponent.id, "oitavas", 4, true);
    if (!created || "error" in created) {
      return json({ error: "Falha ao criar as oitavas." }, 500);
    }
    return json({ redirect_url: `/match/${created.matchId}` });
  }

  // -------------------------------------------------------------------
  // CASO C: mata-mata em andamento, avaliar último jogo
  // -------------------------------------------------------------------
  const last = matches[matches.length - 1];
  const advanced = resolveKnockout(last);

  if (!advanced) {
    await supabase
      .from("campaign_runs")
      .update({ status: "eliminated", current_stage: "encerrada" })
      .eq("id", campaign.id);
    await applyCampaignToRanking(supabase, campaign.id, user.id);
    return json({ redirect_url: `/campaign/${campaign.id}` });
  }

  if (last.stage === "final") {
    await supabase
      .from("campaign_runs")
      .update({ status: "champion", current_stage: "encerrada" })
      .eq("id", campaign.id);
    await applyCampaignToRanking(supabase, campaign.id, user.id);
    return json({ redirect_url: `/campaign/${campaign.id}` });
  }

  const nextStage = getNextStage(String(last.stage));
  if (!nextStage) {
    await supabase
      .from("campaign_runs")
      .update({ status: "champion", current_stage: "encerrada" })
      .eq("id", campaign.id);
    await applyCampaignToRanking(supabase, campaign.id, user.id);
    return json({ redirect_url: `/campaign/${campaign.id}` });
  }

  const opponent = chooseNextOpponent(squads, playedOpponentIds);
  if (!opponent) return json({ error: "Sem adversário disponível." }, 500);

  const created = await createMatch(
    opponent.id,
    nextStage,
    (last.match_order ?? 3) + 1,
    true,
  );
  if (!created || "error" in created) {
    return json({ error: "Falha ao criar o próximo jogo." }, 500);
  }

  await supabase
    .from("campaign_runs")
    .update({ current_stage: nextStage })
    .eq("id", campaign.id);

  return json({ redirect_url: `/match/${created.matchId}` });
}
