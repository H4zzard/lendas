import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveUserSquad } from "@/lib/game/save-user-squad";

interface CreateBody {
  tournament_id?: string;
  formation?: string;
  play_style?: string;
  average_overall?: number;
  players?: { player_id: string; slot_position: string }[];
}

function generateCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { tournament_id, formation, play_style, average_overall = 0, players } = body;
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

  // Cria o desafio (com retry em caso de colisão de code).
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();
    const { data: challenge, error } = await supabase
      .from("friend_challenges")
      .insert({
        code,
        tournament_id,
        creator_id: user.id,
        creator_user_squad_id: saved.userSquadId,
        status: "waiting",
        shared_at: new Date().toISOString(),
      })
      .select("id, code")
      .single();

    if (!error && challenge) {
      return NextResponse.json({
        code: challenge.code,
        challenge_id: challenge.id,
        redirect_url: `/friends/challenge/${challenge.code}`,
      });
    }
    if (error?.code !== "23505") {
      return NextResponse.json(
        { error: "Não foi possível criar o desafio." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: "Não foi possível gerar um código único." },
    { status: 500 },
  );
}
