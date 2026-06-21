import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Squad, GroupResult } from "@/lib/types";
import { generateMutualResult } from "@/lib/game/campaign";
import { saveUserSquad } from "@/lib/game/save-user-squad";
import {
  createAndSimulateMatch,
  loadSquadWithPlayers,
} from "@/lib/game/match-runner";

interface StartBody {
  tournament_id?: string;
  formation?: string;
  play_style?: string;
  average_overall?: number;
  attack_score?: number;
  defense_score?: number;
  players?: { player_id: string; slot_position: string; is_out_of_position?: boolean }[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: StartBody;
  try {
    body = (await request.json()) as StartBody;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const {
    tournament_id,
    formation,
    play_style,
    average_overall = 0,
    players,
  } = body;

  if (!tournament_id || !formation || !play_style || !Array.isArray(players)) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id")
    .eq("id", tournament_id)
    .maybeSingle();
  if (!tournament) {
    return NextResponse.json({ error: "Torneio não encontrado." }, { status: 404 });
  }

  // 1+2. user_squad + user_squad_players (helper compartilhado)
  const saved = await saveUserSquad(supabase, {
    userId: user.id,
    tournamentId: tournament_id,
    formation,
    playStyle: play_style,
    averageOverall: average_overall,
    players,
  });
  if ("error" in saved) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }
  const userSquad = { id: saved.userSquadId };
  const userPlayers = saved.userPlayers;

  // 3. Sortear 3 adversários do grupo
  const { data: allSquads } = await supabase
    .from("squads")
    .select("*")
    .eq("tournament_id", tournament_id)
    .returns<Squad[]>();
  if (!allSquads || allSquads.length < 3) {
    return NextResponse.json(
      { error: "Adversários insuficientes para a campanha." },
      { status: 500 },
    );
  }

  const groupOpponents = shuffle(allSquads).slice(0, 3);
  const groupOpponentIds = groupOpponents.map((s) => s.id);

  // Resultados fixos entre os adversários do grupo (jogos paralelos).
  const groupResults: GroupResult[] = [
    [0, 1],
    [0, 2],
    [1, 2],
  ].map(([a, b]) => {
    const r = generateMutualResult(groupOpponents[a].overall, groupOpponents[b].overall);
    return {
      home: groupOpponents[a].id,
      away: groupOpponents[b].id,
      home_score: r.home_score,
      away_score: r.away_score,
    };
  });

  // 4. campaign_run
  const { data: campaign, error: campaignError } = await supabase
    .from("campaign_runs")
    .insert({
      user_id: user.id,
      tournament_id,
      user_squad_id: userSquad.id,
      status: "active",
      current_stage: "grupos",
      bracket: {
        group_opponents: groupOpponentIds,
        group_results: groupResults,
      },
    })
    .select("id")
    .single();
  if (campaignError || !campaign) {
    return NextResponse.json(
      { error: "Não foi possível criar a campanha." },
      { status: 500 },
    );
  }

  // 5. Primeiro jogo da fase de grupos
  const firstOpponent = await loadSquadWithPlayers(supabase, groupOpponentIds[0]);
  if (!firstOpponent) {
    return NextResponse.json({ error: "Adversário indisponível." }, { status: 500 });
  }

  const created = await createAndSimulateMatch(supabase, {
    userId: user.id,
    campaignRunId: campaign.id,
    userSquadId: userSquad.id,
    tournamentId: tournament_id,
    formation,
    playStyle: play_style,
    userPlayers,
    opponentSquad: firstOpponent,
    opponentSquadId: groupOpponentIds[0],
    stage: "grupos",
    matchOrder: 1,
    isKnockout: false,
  });

  if ("error" in created) {
    return NextResponse.json({ error: created.error }, { status: 500 });
  }

  return NextResponse.json({
    match_id: created.matchId,
    campaign_run_id: campaign.id,
    redirect_url: `/match/${created.matchId}`,
  });
}
