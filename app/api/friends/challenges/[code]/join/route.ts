import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  FriendChallenge,
  UserSquad,
  UserSquadPlayerWithPlayer,
} from "@/lib/types";
import type { SimUserPlayer } from "@/lib/game/simulator";
import { FORMATIONS, getFormation } from "@/lib/game/formations";
import { reconstructSlots } from "@/lib/game/draft";
import {
  calcAttackScore,
  calcAverageOverall,
  calcDefenseScore,
} from "@/lib/game/scores";
import { saveUserSquad } from "@/lib/game/save-user-squad";
import {
  simulateFriendMatch,
  type FriendTeam,
} from "@/lib/game/friend-match-simulator";

interface JoinBody {
  formation?: string;
  play_style?: string;
  average_overall?: number;
  players?: { player_id: string; slot_position: string }[];
}

function teamScores(formation: string, players: SimUserPlayer[]): FriendTeam {
  const f = getFormation(formation) ?? FORMATIONS[0];
  const slots = reconstructSlots(f, players);
  return {
    players,
    averageOverall: calcAverageOverall(slots),
    attackScore: calcAttackScore(slots),
    defenseScore: calcDefenseScore(slots),
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: challenge } = await supabase
    .from("friend_challenges")
    .select("*")
    .eq("code", code)
    .maybeSingle<FriendChallenge>();
  if (!challenge) {
    return NextResponse.json({ error: "Desafio não encontrado." }, { status: 404 });
  }
  if (challenge.status !== "waiting") {
    return NextResponse.json(
      { error: "Este desafio não está mais aberto.", redirect_url: `/friends/challenge/${code}` },
      { status: 409 },
    );
  }
  if (challenge.creator_id === user.id) {
    return NextResponse.json(
      { error: "Você não pode entrar no seu próprio desafio." },
      { status: 403 },
    );
  }
  if (!challenge.creator_user_squad_id) {
    return NextResponse.json({ error: "Time do criador ausente." }, { status: 409 });
  }

  let body: JoinBody;
  try {
    body = (await request.json()) as JoinBody;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { formation, play_style, average_overall = 0, players } = body;
  if (!formation || !play_style || !Array.isArray(players)) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  // Salva o time do oponente
  const saved = await saveUserSquad(supabase, {
    userId: user.id,
    tournamentId: challenge.tournament_id,
    formation,
    playStyle: play_style,
    averageOverall: average_overall,
    players,
  });
  if ("error" in saved) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  // Carrega o time do criador (via policy de desafio waiting)
  const { data: creatorSquad } = await supabase
    .from("user_squads")
    .select("*")
    .eq("id", challenge.creator_user_squad_id)
    .maybeSingle<UserSquad>();
  const { data: creatorSquadPlayers } = await supabase
    .from("user_squad_players")
    .select("*, player:players(*)")
    .eq("user_squad_id", challenge.creator_user_squad_id)
    .returns<UserSquadPlayerWithPlayer[]>();

  if (!creatorSquad || !creatorSquadPlayers || creatorSquadPlayers.length !== 11) {
    return NextResponse.json(
      { error: "Não foi possível carregar o time do criador." },
      { status: 500 },
    );
  }

  const creatorPlayers: SimUserPlayer[] = creatorSquadPlayers.map((sp) => ({
    player: sp.player,
    slot_position: sp.slot_position,
  }));

  const creatorTeam = teamScores(creatorSquad.formation, creatorPlayers);
  const opponentTeam = teamScores(formation, saved.userPlayers);

  const result = simulateFriendMatch(creatorTeam, opponentTeam);

  const winnerUserId =
    result.winner === "creator"
      ? challenge.creator_id
      : result.winner === "opponent"
        ? user.id
        : null;

  // Cria o match (user_id = oponente, que respeita matches_insert_own)
  const { data: match } = await supabase
    .from("matches")
    .insert({
      user_id: user.id,
      user_squad_id: saved.userSquadId,
      tournament_id: challenge.tournament_id,
      opponent_squad_id: null,
      user_score: result.opponent_score,
      opponent_score: result.creator_score,
      user_won: result.winner === "opponent",
      match_events: result.match_events,
      stats: result.stats,
      stage: "amigos",
      match_order: 1,
      is_knockout: true,
    })
    .select("id")
    .single();

  // Completa o desafio
  const { error: updateError } = await supabase
    .from("friend_challenges")
    .update({
      opponent_id: user.id,
      opponent_user_squad_id: saved.userSquadId,
      match_id: match?.id ?? null,
      creator_score: result.creator_score,
      opponent_score: result.opponent_score,
      winner_user_id: winnerUserId,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", challenge.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Não foi possível concluir o desafio." },
      { status: 500 },
    );
  }

  return NextResponse.json({ redirect_url: `/friends/challenge/${code}` });
}
