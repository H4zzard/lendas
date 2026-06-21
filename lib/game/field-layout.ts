/**
 * Coordenadas (x%, y%) de cada slot por formação. y=0 é o ataque (topo) e
 * y=100 é o próprio gol (base) — campo visto de cima, no sentido vertical.
 * Os índices seguem a ordem dos slots em lib/game/formations.ts.
 */
export interface FieldCoord {
  x: number;
  y: number;
}

export const FIELD_LAYOUTS: Record<string, FieldCoord[]> = {
  "4-3-3": [
    { x: 50, y: 93 }, // GOL
    { x: 84, y: 72 }, // LD
    { x: 62, y: 76 }, // ZAG
    { x: 38, y: 76 }, // ZAG
    { x: 16, y: 72 }, // LE
    { x: 30, y: 50 }, // MC
    { x: 70, y: 50 }, // MC
    { x: 50, y: 42 }, // MEI
    { x: 82, y: 20 }, // PD
    { x: 50, y: 15 }, // CA
    { x: 18, y: 20 }, // PE
  ],
  "4-4-2": [
    { x: 50, y: 93 }, // GOL
    { x: 84, y: 72 }, // LD
    { x: 62, y: 76 }, // ZAG
    { x: 38, y: 76 }, // ZAG
    { x: 16, y: 72 }, // LE
    { x: 18, y: 48 }, // VOL
    { x: 40, y: 50 }, // MC
    { x: 60, y: 50 }, // MC
    { x: 82, y: 48 }, // MEI
    { x: 35, y: 18 }, // CA
    { x: 65, y: 18 }, // CA
  ],
  "5-3-2": [
    { x: 50, y: 93 }, // GOL
    { x: 88, y: 70 }, // LD
    { x: 69, y: 74 }, // ZAG
    { x: 50, y: 76 }, // ZAG
    { x: 31, y: 74 }, // ZAG
    { x: 12, y: 70 }, // LE
    { x: 25, y: 48 }, // VOL
    { x: 50, y: 44 }, // MC
    { x: 75, y: 48 }, // MEI
    { x: 35, y: 18 }, // CA
    { x: 65, y: 18 }, // CA
  ],
};

export function getFieldLayout(formationId: string): FieldCoord[] {
  return FIELD_LAYOUTS[formationId] ?? FIELD_LAYOUTS["4-3-3"];
}
