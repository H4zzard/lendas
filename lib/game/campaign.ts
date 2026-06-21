import type {
  CampaignStage,
  GroupResult,
  GroupTableRow,
  Match,
} from "@/lib/types";

/** Ordem das fases de mata-mata. */
const KNOCKOUT_ORDER: CampaignStage[] = ["oitavas", "quartas", "semi", "final"];

/** Rótulos amigáveis das fases. */
export const STAGE_LABELS: Record<string, string> = {
  grupos: "Grupos",
  oitavas: "Oitavas",
  quartas: "Quartas",
  semi: "Semifinal",
  final: "Final",
  encerrada: "Encerrada",
};

export function stageLabel(stage: string | null | undefined): string {
  if (!stage) return "Partida";
  return STAGE_LABELS[stage] ?? stage;
}

/** Próxima fase do mata-mata, ou null se já for a final. */
export function getNextStage(current: string): CampaignStage | null {
  const index = KNOCKOUT_ORDER.indexOf(current as CampaignStage);
  if (index < 0 || index >= KNOCKOUT_ORDER.length - 1) return null;
  return KNOCKOUT_ORDER[index + 1];
}

/** Resolve se o usuário avançou num jogo de mata-mata (empate: maior overall, com vantagem do usuário). */
export function resolveKnockout(match: Match): boolean {
  if (match.user_score > match.opponent_score) return true;
  if (match.user_score < match.opponent_score) return false;
  const userOverall = Number(match.stats?.user_overall ?? 0);
  const oppOverall = Number(match.stats?.opponent_overall ?? 0);
  return userOverall >= oppOverall;
}

interface OpponentInfo {
  id: string;
  name: string;
  code: string;
}

/**
 * Calcula a classificação do grupo (4 times: usuário + 3 adversários).
 * Usa os jogos reais do usuário + os resultados fixos entre os adversários.
 */
export function calculateGroupTable(
  userGroupMatches: Match[],
  opponents: OpponentInfo[],
  mutualResults: GroupResult[],
): GroupTableRow[] {
  const rows = new Map<string, GroupTableRow>();

  const userKey = "__user__";
  rows.set(userKey, {
    squad_id: null,
    name: "Seu time",
    code: "VOCÊ",
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    points: 0,
    is_user: true,
  });

  for (const opp of opponents) {
    rows.set(opp.id, {
      squad_id: opp.id,
      name: opp.name,
      code: opp.code,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      points: 0,
      is_user: false,
    });
  }

  const apply = (row: GroupTableRow | undefined, gf: number, ga: number) => {
    if (!row) return;
    row.played += 1;
    row.goals_for += gf;
    row.goals_against += ga;
    if (gf > ga) {
      row.wins += 1;
      row.points += 3;
    } else if (gf === ga) {
      row.draws += 1;
      row.points += 1;
    } else {
      row.losses += 1;
    }
  };

  // Jogos do usuário
  for (const match of userGroupMatches) {
    const oppRow = match.opponent_squad_id
      ? rows.get(match.opponent_squad_id)
      : undefined;
    apply(rows.get(userKey), match.user_score, match.opponent_score);
    apply(oppRow, match.opponent_score, match.user_score);
  }

  // Jogos entre os adversários
  for (const result of mutualResults) {
    apply(rows.get(result.home), result.home_score, result.away_score);
    apply(rows.get(result.away), result.away_score, result.home_score);
  }

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goals_for - a.goals_against;
    const gdB = b.goals_for - b.goals_against;
    if (gdB !== gdA) return gdB - gdA;
    return b.goals_for - a.goals_for;
  });
}

/** Usuário classificado se terminar em 1º ou 2º. */
export function hasQualifiedFromGroup(table: GroupTableRow[]): boolean {
  const index = table.findIndex((row) => row.is_user);
  return index >= 0 && index < 2;
}

/** Escolhe um adversário ainda não enfrentado (se possível). */
export function chooseNextOpponent<T extends { id: string }>(
  squads: T[],
  alreadyPlayedIds: string[],
): T | null {
  const pool = squads.filter((squad) => !alreadyPlayedIds.includes(squad.id));
  const source = pool.length > 0 ? pool : squads;
  if (source.length === 0) return null;
  return source[Math.floor(Math.random() * source.length)];
}

/** Gera um placar simples entre dois adversários, com base nos overalls. */
export function generateMutualResult(
  overallHome: number,
  overallAway: number,
): { home_score: number; away_score: number } {
  const diff = (overallHome - overallAway) / 14;
  const homeLambda = Math.max(0.2, 1.3 + diff);
  const awayLambda = Math.max(0.2, 1.3 - diff);
  const sample = (lambda: number) => {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k += 1;
      p *= Math.random();
    } while (p > L);
    return Math.min(5, k - 1);
  };
  return { home_score: sample(homeLambda), away_score: sample(awayLambda) };
}

/** Rótulo do desfecho da campanha (Campeão, Vice-campeão, Eliminado nas Oitavas...). */
export function getCampaignResultLabel(
  status: string,
  matches: Match[],
): string {
  if (status === "champion") return "Campeão";

  const knockout = matches.filter((m) => m.is_knockout);
  if (knockout.length === 0) return "Eliminado na fase de grupos";

  const last = knockout[knockout.length - 1];
  switch (last.stage) {
    case "final":
      return "Vice-campeão";
    case "semi":
      return "Eliminado na Semi";
    case "quartas":
      return "Eliminado nas Quartas";
    case "oitavas":
      return "Eliminado nas Oitavas";
    default:
      return "Campanha encerrada";
  }
}

export interface CampaignSummary {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export function buildCampaignSummary(matches: Match[]): CampaignSummary {
  const summary: CampaignSummary = {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };
  for (const match of matches) {
    summary.played += 1;
    summary.goalsFor += match.user_score;
    summary.goalsAgainst += match.opponent_score;
    if (match.user_score > match.opponent_score) summary.wins += 1;
    else if (match.user_score === match.opponent_score) summary.draws += 1;
    else summary.losses += 1;
  }
  return summary;
}
