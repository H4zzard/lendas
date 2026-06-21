import type { Player, PlayerPosition } from "@/lib/types";

/** Posições consideradas de ataque para o cálculo de força ofensiva. */
export const ATTACK_POSITIONS: PlayerPosition[] = ["PE", "PD", "CA", "SA", "MEI"];

/** Posições consideradas de defesa para o cálculo de força defensiva. */
export const DEFENSE_POSITIONS: PlayerPosition[] = ["GOL", "ZAG", "LE", "LD", "VOL"];

/** Um slot da formação: posição fixa + jogador opcional. */
export interface SquadSlot {
  index: number;
  position: PlayerPosition;
  player: Player | null;
  outOfPosition: boolean;
}

function filledSlots(slots: SquadSlot[]): SquadSlot[] {
  return slots.filter((slot) => slot.player !== null);
}

/** Overall médio dos jogadores já escolhidos (parcial enquanto incompleto). */
export function calcAverageOverall(slots: SquadSlot[]): number {
  const players = filledSlots(slots).map((slot) => slot.player!);
  if (players.length === 0) return 0;
  const total = players.reduce((sum, player) => sum + player.overall, 0);
  return Math.round(total / players.length);
}

/**
 * Força de ataque: média de (shooting + pace + passing) / 3 dos jogadores
 * posicionados em slots ofensivos (PE, PD, CA, SA, MEI).
 */
export function calcAttackScore(slots: SquadSlot[]): number {
  const attackers = filledSlots(slots).filter((slot) =>
    ATTACK_POSITIONS.includes(slot.position),
  );
  if (attackers.length === 0) return 0;
  const total = attackers.reduce((sum, slot) => {
    const p = slot.player!;
    return sum + (p.shooting + p.pace + p.passing) / 3;
  }, 0);
  return Math.round(total / attackers.length);
}

/**
 * Força de defesa: média de (defending + physical + overall) / 3 dos jogadores
 * posicionados em slots defensivos (GOL, ZAG, LE, LD, VOL).
 */
export function calcDefenseScore(slots: SquadSlot[]): number {
  const defenders = filledSlots(slots).filter((slot) =>
    DEFENSE_POSITIONS.includes(slot.position),
  );
  if (defenders.length === 0) return 0;
  const total = defenders.reduce((sum, slot) => {
    const p = slot.player!;
    return sum + (p.defending + p.physical + p.overall) / 3;
  }, 0);
  return Math.round(total / defenders.length);
}
