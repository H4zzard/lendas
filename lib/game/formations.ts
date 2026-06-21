import type { PlayerPosition } from "@/lib/types";

/**
 * Formações disponíveis no MVP. Cada formação tem 11 slots, sempre começando
 * pelo goleiro. Os slots usam os códigos de posição em português.
 */
export interface Formation {
  id: string;
  name: string;
  style: string;
  slots: PlayerPosition[];
}

export const FORMATIONS: Formation[] = [
  {
    id: "4-3-3",
    name: "4-3-3 Ofensivo",
    style: "ofensivo",
    slots: ["GOL", "LD", "ZAG", "ZAG", "LE", "MC", "MC", "MEI", "PD", "CA", "PE"],
  },
  {
    id: "4-4-2",
    name: "4-4-2 Equilibrado",
    style: "equilibrado",
    slots: ["GOL", "LD", "ZAG", "ZAG", "LE", "VOL", "MC", "MC", "MEI", "CA", "CA"],
  },
  {
    id: "5-3-2",
    name: "5-3-2 Defensivo",
    style: "defensivo",
    slots: ["GOL", "LD", "ZAG", "ZAG", "ZAG", "LE", "VOL", "MC", "MEI", "CA", "CA"],
  },
];

/** Busca uma formação pelo seu id (ex.: "4-3-3"). */
export function getFormation(id: string): Formation | undefined {
  return FORMATIONS.find((formation) => formation.id === id);
}
