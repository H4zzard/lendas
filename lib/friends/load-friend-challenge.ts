import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  FriendChallenge,
  FriendChallengeCardData,
  FriendTeamSummary,
  Player,
  PublicProfile,
  Tournament,
  UserSquad,
  UserSquadPlayerWithPlayer,
} from "@/lib/types";

export interface TeamSummary {
  averageOverall: number;
  top: Player[];
}

export interface LoadedFriendChallenge {
  challenge: FriendChallenge;
  tournamentName: string;
  creatorName: string;
  opponentName: string;
  creatorTeam: TeamSummary | null;
  opponentTeam: TeamSummary | null;
}

function nameOf(p: PublicProfile | undefined): string {
  return p?.display_name?.trim() || p?.username?.trim() || "Jogador";
}

async function loadTeam(
  supabase: SupabaseClient,
  squadId: string | null,
): Promise<TeamSummary | null> {
  if (!squadId) return null;
  const { data: squad } = await supabase
    .from("user_squads")
    .select("average_overall")
    .eq("id", squadId)
    .maybeSingle<Pick<UserSquad, "average_overall">>();
  const { data: sp } = await supabase
    .from("user_squad_players")
    .select("*, player:players(*)")
    .eq("user_squad_id", squadId)
    .returns<UserSquadPlayerWithPlayer[]>();
  const top = [...(sp ?? [])]
    .filter((x) => x.player)
    .sort((a, b) => b.player.overall - a.player.overall)
    .slice(0, 3)
    .map((x) => x.player);
  return { averageOverall: squad?.average_overall ?? 0, top };
}

/** Carrega um desafio por code com torneio, nomes públicos e times resumidos. */
export async function loadFriendChallengeByCode(
  supabase: SupabaseClient,
  code: string,
): Promise<LoadedFriendChallenge | null> {
  const { data: challenge } = await supabase
    .from("friend_challenges")
    .select("*")
    .eq("code", code)
    .maybeSingle<FriendChallenge>();
  if (!challenge) return null;

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("name")
    .eq("id", challenge.tournament_id)
    .maybeSingle<Pick<Tournament, "name">>();

  const ids = [challenge.creator_id, challenge.opponent_id].filter(
    (id): id is string => Boolean(id),
  );
  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, username, display_name")
    .in("id", ids)
    .returns<PublicProfile[]>();
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const [creatorTeam, opponentTeam] = await Promise.all([
    loadTeam(supabase, challenge.creator_user_squad_id),
    loadTeam(supabase, challenge.opponent_user_squad_id),
  ]);

  return {
    challenge,
    tournamentName: tournament?.name ?? "Campeonato",
    creatorName: nameOf(byId.get(challenge.creator_id)),
    opponentName: challenge.opponent_id
      ? nameOf(byId.get(challenge.opponent_id))
      : "Adversário",
    creatorTeam,
    opponentTeam,
  };
}

/** Versão pública: só retorna desafios completed (para a página/OG públicos). */
export async function loadCompletedFriendChallengePublic(
  code: string,
): Promise<LoadedFriendChallenge | null> {
  const supabase = await createClient();
  const loaded = await loadFriendChallengeByCode(supabase, code);
  if (!loaded || loaded.challenge.status !== "completed") return null;
  return loaded;
}

function toTeamSummary(
  name: string,
  team: TeamSummary | null,
): FriendTeamSummary {
  return {
    name,
    averageOverall: team?.averageOverall ?? 0,
    topPlayers: (team?.top ?? []).map((p) => ({
      first_name: p.first_name,
      position: p.position,
      number: p.number,
      overall: p.overall,
    })),
  };
}

/** Monta os dados do card a partir de um desafio carregado (completed). */
export function buildFriendCardData(
  loaded: LoadedFriendChallenge,
): FriendChallengeCardData {
  const { challenge } = loaded;
  const creatorScore = challenge.creator_score ?? 0;
  const opponentScore = challenge.opponent_score ?? 0;
  const winner =
    challenge.winner_user_id === null
      ? null
      : challenge.winner_user_id === challenge.creator_id
        ? "creator"
        : "opponent";
  const resultLabel =
    winner === null
      ? "Empate lendário"
      : winner === "creator"
        ? `Vitória de ${loaded.creatorName}`
        : `Vitória de ${loaded.opponentName}`;

  return {
    code: challenge.code,
    tournamentName: loaded.tournamentName,
    creator: toTeamSummary(loaded.creatorName, loaded.creatorTeam),
    opponent: toTeamSummary(loaded.opponentName, loaded.opponentTeam),
    creatorScore,
    opponentScore,
    winner,
    resultLabel,
  };
}
