import type { PlayerPosition } from "@/lib/types";

/**
 * Mapa de códigos de posição (português) para o nome completo exibido na UI.
 * Estrutura preparada para futura internacionalização — por enquanto só PT-BR.
 */
export const POSITION_NAMES: Record<PlayerPosition, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro",
  LE: "Lateral Esquerdo",
  LD: "Lateral Direito",
  VOL: "Volante",
  MC: "Meio Campo",
  MEI: "Meia",
  PE: "Ponta Esquerda",
  PD: "Ponta Direita",
  SA: "Segundo Atacante",
  CA: "Centroavante",
};

/**
 * Lista ordenada de posições (do gol ao ataque), para uso em filtros e UI.
 */
export const POSITIONS_ORDERED: PlayerPosition[] = [
  "GOL",
  "ZAG",
  "LD",
  "LE",
  "VOL",
  "MC",
  "MEI",
  "PE",
  "PD",
  "SA",
  "CA",
];

/** Retorna o nome completo de uma posição a partir do seu código. */
export function getPositionName(position: PlayerPosition): string {
  return POSITION_NAMES[position];
}
