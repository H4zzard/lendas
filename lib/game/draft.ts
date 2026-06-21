import type { Player, PlayerPosition, Squad } from "@/lib/types";
import type { Formation } from "@/lib/game/formations";
import type { SquadSlot } from "@/lib/game/scores";

/** Squad com seus jogadores já carregados (vindo do Supabase). */
export interface SquadWithPlayers extends Squad {
  players: Player[];
}

/**
 * Mapa de compatibilidade: para a posição natural do jogador (chave), quais
 * posições de slot ele aceita. A primeira da lista é sempre a posição exata;
 * as demais são alternativas (entram como "fora de posição").
 */
const COMPATIBILITY: Record<PlayerPosition, PlayerPosition[]> = {
  GOL: ["GOL"],
  LD: ["LD", "ZAG"],
  LE: ["LE", "ZAG"],
  ZAG: ["ZAG", "LD", "LE"],
  VOL: ["VOL", "MC", "ZAG"],
  MC: ["MC", "VOL", "MEI"],
  MEI: ["MEI", "MC", "PE", "PD"],
  PE: ["PE", "MEI", "CA"],
  PD: ["PD", "MEI", "CA"],
  SA: ["SA", "CA", "MEI", "PE", "PD"],
  CA: ["CA", "SA"],
};

export type SlotMatch = "exact" | "alternative" | "none";

/**
 * Classifica a relação entre a posição de um jogador e a de um slot:
 * - "exact": mesma posição;
 * - "alternative": posição compatível (entra fora da posição ideal);
 * - "none": incompatível.
 */
export function matchPlayerToSlot(
  playerPosition: PlayerPosition,
  slotPosition: PlayerPosition,
): SlotMatch {
  if (slotPosition === playerPosition) return "exact";
  if (COMPATIBILITY[playerPosition]?.includes(slotPosition)) return "alternative";
  return "none";
}

/** Monta os 11 slots vazios a partir de uma formação. */
export function buildSlots(formation: Formation): SquadSlot[] {
  return formation.slots.map((position, index) => ({
    index,
    position,
    player: null,
    outOfPosition: false,
  }));
}

/** Sorteia um squad aleatório dentre os disponíveis. */
export function drawSquad(squads: SquadWithPlayers[]): SquadWithPlayers | null {
  if (squads.length === 0) return null;
  return squads[Math.floor(Math.random() * squads.length)];
}

/**
 * Retorna os slots vazios compatíveis com a posição do jogador, já
 * classificados. Slots ocupados são ignorados.
 */
export function getCompatibleSlots(
  playerPosition: PlayerPosition,
  slots: SquadSlot[],
): { slot: SquadSlot; match: SlotMatch }[] {
  return slots
    .filter((slot) => slot.player === null)
    .map((slot) => ({
      slot,
      match: matchPlayerToSlot(playerPosition, slot.position),
    }))
    .filter((entry) => entry.match !== "none");
}

/** Há ao menos um slot vazio compatível para este jogador? */
export function hasFreeCompatibleSlot(
  player: Player,
  slots: SquadSlot[],
): boolean {
  return slots.some(
    (slot) =>
      slot.player === null &&
      matchPlayerToSlot(player.position, slot.position) !== "none",
  );
}

/**
 * Reconstrói os slots preenchidos a partir de uma formação e da lista de
 * jogadores salvos (cada um com a posição do slot em que foi escalado).
 * Usado no servidor (simulação) e na exibição da partida.
 */
export function reconstructSlots(
  formation: Formation,
  players: { player: Player; slot_position: string }[],
): SquadSlot[] {
  const slots = buildSlots(formation);
  for (const entry of players) {
    const slot = slots.find(
      (s) => s.player === null && s.position === entry.slot_position,
    );
    if (slot) {
      slot.player = entry.player;
      slot.outOfPosition = entry.player.position !== entry.slot_position;
    }
  }
  return slots;
}
