import type { MatchEvent, MatchStats } from "@/lib/types";
import type { SimUserPlayer } from "@/lib/game/simulator";

export interface FriendTeam {
  players: SimUserPlayer[];
  averageOverall: number;
  attackScore: number;
  defenseScore: number;
}

export interface FriendMatchResult {
  creator_score: number;
  opponent_score: number;
  winner: "creator" | "opponent" | null;
  match_events: MatchEvent[];
  stats: MatchStats;
}

const ATTACK_SLOTS = ["CA", "SA", "PE", "PD", "MEI"];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function poisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function attacker(team: FriendTeam) {
  const atk = team.players.filter((p) => ATTACK_SLOTS.includes(p.slot_position));
  const pool = atk.length > 0 ? atk : team.players;
  return pool.length > 0 ? pick(pool).player : null;
}

/**
 * Simula um confronto direto entre dois times de usuários (Modo Amigos).
 * Sem etapa interativa: o resultado é direto. Empate é possível.
 */
export function simulateFriendMatch(
  creator: FriendTeam,
  opponent: FriendTeam,
): FriendMatchResult {
  const diff = (creator.averageOverall || 75) - (opponent.averageOverall || 75);

  let cLambda =
    1.25 + diff * 0.05 + (creator.attackScore - opponent.defenseScore) * 0.02;
  let oLambda =
    1.25 - diff * 0.05 + (opponent.attackScore - creator.defenseScore) * 0.02;
  cLambda = clamp(cLambda, 0.25, 4.5);
  oLambda = clamp(oLambda, 0.25, 4.5);

  const creatorScore = Math.min(7, poisson(cLambda));
  const opponentScore = Math.min(7, poisson(oLambda));

  const events: MatchEvent[] = [];
  let id = 0;
  const push = (e: Omit<MatchEvent, "id">) =>
    events.push({ id: `f${id++}`, ...e });

  push({
    minute: 1,
    type: "kickoff",
    team: "none",
    description: "Bola rolando! Desafio entre amigos.",
    x: 50,
    y: 50,
    target_x: 50,
    target_y: 50,
    is_goal: false,
  });

  const goals: { team: "user" | "opponent"; minute: number }[] = [];
  for (let i = 0; i < creatorScore; i++)
    goals.push({ team: "user", minute: randInt(3, 88) });
  for (let i = 0; i < opponentScore; i++)
    goals.push({ team: "opponent", minute: randInt(3, 88) });
  goals.sort((a, b) => a.minute - b.minute);

  for (const g of goals) {
    const scorer =
      g.team === "user" ? attacker(creator) : attacker(opponent);
    push({
      minute: g.minute,
      type: "goal",
      team: g.team,
      player_name: scorer?.first_name,
      player_number: scorer?.number,
      description: scorer
        ? `GOL! ${scorer.first_name} marca para ${g.team === "user" ? "o criador" : "o desafiante"}.`
        : "GOL!",
      x: 50,
      y: g.team === "user" ? 12 : 88,
      target_x: 50,
      target_y: g.team === "user" ? 5 : 95,
      is_goal: true,
    });
  }

  push({
    minute: 90,
    type: "fulltime",
    team: "none",
    description: "Fim de jogo!",
    x: 50,
    y: 50,
    target_x: 50,
    target_y: 50,
    is_goal: false,
  });

  const winner =
    creatorScore > opponentScore
      ? "creator"
      : creatorScore < opponentScore
        ? "opponent"
        : null;

  const stats: MatchStats = {
    creator_overall: creator.averageOverall,
    opponent_overall: opponent.averageOverall,
    creator_attack: creator.attackScore,
    opponent_attack: opponent.attackScore,
    creator_defense: creator.defenseScore,
    opponent_defense: opponent.defenseScore,
  };

  return {
    creator_score: creatorScore,
    opponent_score: opponentScore,
    winner,
    match_events: events,
    stats,
  };
}
