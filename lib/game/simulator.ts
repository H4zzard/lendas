import type { Player, MatchEvent, MatchEventType, MatchStats } from "@/lib/types";
import type { SquadWithPlayers } from "@/lib/game/draft";

export interface SimUserPlayer {
  player: Player;
  slot_position: string;
}

export interface SimulateMatchInput {
  userPlayers: SimUserPlayer[];
  opponentSquad: SquadWithPlayers;
  formation: string;
  playStyle: string;
  averageOverall: number;
  attackScore: number;
  defenseScore: number;
}

export interface SimulateMatchResult {
  user_score: number;
  opponent_score: number;
  user_won: boolean;
  stats: MatchStats;
  match_events: MatchEvent[];
}

// ---------------------------------------------------------------------------
// Utilitários de aleatoriedade
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Amostragem de Poisson (algoritmo de Knuth). */
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

// ---------------------------------------------------------------------------
// Coordenadas dos lances (y=0 topo/ataque do usuário, y=100 base/gol do usuário)
// ---------------------------------------------------------------------------

interface Coords {
  x: number;
  y: number;
  target_x: number;
  target_y: number;
}

function coordsFor(team: "user" | "opponent" | "none", type: MatchEventType): Coords {
  // Usuário ataca para cima (y pequeno); adversário ataca para baixo (y grande).
  const attackTop = team === "user";

  switch (type) {
    case "kickoff":
      return { x: 50, y: 50, target_x: 50, target_y: 50 };
    case "pass": {
      const fromY = attackTop ? rand(55, 72) : rand(28, 45);
      const toY = attackTop ? rand(35, 52) : rand(48, 65);
      return { x: rand(30, 70), y: fromY, target_x: rand(30, 70), target_y: toY };
    }
    case "shot":
      return attackTop
        ? { x: rand(38, 62), y: 26, target_x: 50, target_y: 10 }
        : { x: rand(38, 62), y: 74, target_x: 50, target_y: 90 };
    case "save":
      return attackTop
        ? { x: rand(40, 60), y: 18, target_x: 50, target_y: 8 }
        : { x: rand(40, 60), y: 82, target_x: 50, target_y: 92 };
    case "penalty":
      return attackTop
        ? { x: 50, y: 20, target_x: 50, target_y: 6 }
        : { x: 50, y: 80, target_x: 50, target_y: 94 };
    case "free_kick":
      return attackTop
        ? { x: rand(40, 60), y: 28, target_x: 50, target_y: 8 }
        : { x: rand(40, 60), y: 72, target_x: 50, target_y: 92 };
    case "goal":
      return attackTop
        ? { x: rand(42, 58), y: 18, target_x: 50, target_y: 5 }
        : { x: rand(42, 58), y: 82, target_x: 50, target_y: 95 };
    case "foul":
      return { x: rand(25, 75), y: rand(35, 65), target_x: rand(25, 75), target_y: rand(35, 65) };
    default:
      return { x: 50, y: 50, target_x: 50, target_y: 50 };
  }
}

// ---------------------------------------------------------------------------
// Seleção de jogadores para os lances
// ---------------------------------------------------------------------------

const ATTACK_SLOTS = ["CA", "SA", "PE", "PD", "MEI"];

function userAttacker(userPlayers: SimUserPlayer[]): Player {
  const attackers = userPlayers.filter((p) =>
    ATTACK_SLOTS.includes(p.slot_position),
  );
  const pool = attackers.length > 0 ? attackers : userPlayers;
  return pick(pool).player;
}

function opponentAttacker(opponent: SquadWithPlayers): Player | null {
  if (opponent.players.length === 0) return null;
  const attackers = opponent.players.filter((p) =>
    ATTACK_SLOTS.includes(p.position),
  );
  const pool = attackers.length > 0 ? attackers : opponent.players;
  return pick(pool);
}

function describe(
  type: MatchEventType,
  team: "user" | "opponent" | "none",
  name: string | undefined,
): string {
  const who = name ?? "O time";
  switch (type) {
    case "kickoff":
      return "Bola rolando! Começa a partida.";
    case "pass":
      return `${who} troca passes e arma a jogada.`;
    case "shot":
      return `${who} arrisca o chute!`;
    case "save":
      return "Defesaça do goleiro!";
    case "foul":
      return `Falta dura no meio de campo.`;
    case "penalty":
      return "Pênalti marcado!";
    case "goal":
      return `GOL! ${who} balança as redes!`;
    case "halftime":
      return "Fim do primeiro tempo.";
    case "fulltime":
      return "Fim de jogo!";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Simulação principal
// ---------------------------------------------------------------------------

export function simulateMatch(input: SimulateMatchInput): SimulateMatchResult {
  const {
    userPlayers,
    opponentSquad,
    playStyle,
    averageOverall,
    attackScore,
    defenseScore,
  } = input;

  const userOverall = averageOverall || 75;
  const oppOverall = opponentSquad.overall || 75;
  const diff = userOverall - oppOverall;

  // Expectativa de gols (lambda) de cada lado.
  let userLambda = 1.3 + diff * 0.045 + (attackScore - 78) * 0.02;
  let oppLambda = 1.3 - diff * 0.045 + (78 - defenseScore) * 0.02;

  if (playStyle === "ofensivo") {
    userLambda += 0.45;
    oppLambda += 0.4;
  } else if (playStyle === "defensivo") {
    userLambda -= 0.4;
    oppLambda -= 0.55;
  }

  userLambda = clamp(userLambda, 0.2, 4.2);
  oppLambda = clamp(oppLambda, 0.15, 4.0);

  const userScore = Math.min(6, poisson(userLambda));
  const oppScore = Math.min(6, poisson(oppLambda));

  // -----------------------------------------------------------------------
  // Geração de eventos
  // -----------------------------------------------------------------------
  type RawEvent = Omit<MatchEvent, "id">;
  const middle: RawEvent[] = [];

  const makeGoal = (team: "user" | "opponent") => {
    const player =
      team === "user" ? userAttacker(userPlayers) : opponentAttacker(opponentSquad);
    const c = coordsFor(team, "goal");
    middle.push({
      minute: randInt(3, 88),
      type: "goal",
      team,
      player_name: player?.first_name,
      player_number: player?.number,
      description: describe("goal", team, player?.first_name),
      ...c,
      is_goal: true,
    });
  };

  // Lances interativos do usuário (pênalti / falta perigosa a favor).
  // O resultado (is_goal) é predeterminado aqui para manter o placar final
  // coerente; a escolha do batedor no client dramatiza o lance e a narração.
  let userGoalsRemaining = userScore;
  const setPieceCount = randInt(0, 2);
  for (let i = 0; i < setPieceCount; i++) {
    const isPenalty = Math.random() < 0.5;
    const type: MatchEventType = isPenalty ? "penalty" : "free_kick";
    let isGoal = false;
    if (userGoalsRemaining > 0 && Math.random() < 0.6) {
      isGoal = true;
      userGoalsRemaining -= 1;
    }
    const c = coordsFor("user", type);
    middle.push({
      minute: randInt(5, 86),
      type,
      team: "user",
      description: isPenalty
        ? "Pênalti para o seu time!"
        : "Falta perigosa para o seu time!",
      ...c,
      is_goal: isGoal,
      interactive: true,
      requires_choice: true,
      choice_type: isPenalty ? "penalty_taker" : "free_kick_taker",
      resolved: false,
    });
  }

  // Gols restantes do usuário (lances normais) + gols do adversário.
  for (let i = 0; i < userGoalsRemaining; i++) makeGoal("user");
  for (let i = 0; i < oppScore; i++) makeGoal("opponent");

  // Eventos de preenchimento (não-gol).
  const totalGoals = userScore + oppScore;
  const targetTotal = randInt(13, 19);
  const fillerCount = Math.max(4, targetTotal - totalGoals);
  const fillerTypes: MatchEventType[] = [
    "pass",
    "pass",
    "shot",
    "shot",
    "save",
    "foul",
    "foul",
  ];

  for (let i = 0; i < fillerCount; i++) {
    const type = pick(fillerTypes);
    const team: "user" | "opponent" = Math.random() < 0.5 ? "user" : "opponent";
    const player =
      team === "user" ? userAttacker(userPlayers) : opponentAttacker(opponentSquad);
    const c = coordsFor(team, type);
    middle.push({
      minute: randInt(2, 89),
      type,
      team,
      player_name: player?.first_name,
      player_number: player?.number,
      description: describe(type, team, player?.first_name),
      ...c,
      is_goal: false,
    });
  }

  // Intervalo.
  middle.push({
    minute: 45,
    type: "halftime",
    team: "none",
    description: describe("halftime", "none", undefined),
    x: 50,
    y: 50,
    target_x: 50,
    target_y: 50,
    is_goal: false,
  });

  middle.sort((a, b) => a.minute - b.minute);

  const kickoff: RawEvent = {
    minute: 1,
    type: "kickoff",
    team: "none",
    description: describe("kickoff", "none", undefined),
    x: 50,
    y: 50,
    target_x: 50,
    target_y: 50,
    is_goal: false,
  };

  const fulltime: RawEvent = {
    minute: 90,
    type: "fulltime",
    team: "none",
    description: describe("fulltime", "none", undefined),
    x: 50,
    y: 50,
    target_x: 50,
    target_y: 50,
    is_goal: false,
  };

  const ordered: RawEvent[] = [kickoff, ...middle, fulltime];
  const match_events: MatchEvent[] = ordered.map((event, index) => ({
    id: `e${index}`,
    ...event,
  }));

  // -----------------------------------------------------------------------
  // Estatísticas
  // -----------------------------------------------------------------------
  let possessionUser = Math.round(50 + diff * 0.6);
  if (playStyle === "ofensivo") possessionUser += 4;
  if (playStyle === "defensivo") possessionUser -= 6;
  possessionUser = clamp(possessionUser, 32, 68);

  const stats: MatchStats = {
    possession_user: possessionUser,
    possession_opponent: 100 - possessionUser,
    shots_user: userScore + randInt(3, 8),
    shots_opponent: oppScore + randInt(2, 7),
    on_target_user: userScore + randInt(1, 4),
    on_target_opponent: oppScore + randInt(1, 3),
    fouls_user: randInt(5, 14),
    fouls_opponent: randInt(5, 14),
    user_overall: userOverall,
    opponent_overall: oppOverall,
    attack_score: attackScore,
    defense_score: defenseScore,
  };

  return {
    user_score: userScore,
    opponent_score: oppScore,
    user_won: userScore > oppScore,
    stats,
    match_events,
  };
}
