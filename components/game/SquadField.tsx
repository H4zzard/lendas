"use client";

import type { PlayerPosition } from "@/lib/types";
import type { SquadSlot } from "@/lib/game/scores";
import { matchPlayerToSlot, type SlotMatch } from "@/lib/game/draft";
import { getFieldLayout } from "@/lib/game/field-layout";

interface FieldSlotProps {
  slot: SquadSlot;
  match: SlotMatch;
  selecting: boolean;
  onClick: () => void;
}

function FieldSlot({ slot, match, selecting, onClick }: FieldSlotProps) {
  const player = slot.player;

  // Slot vazio
  if (!player) {
    const highlightable = selecting && match !== "none";
    const ringClass = !selecting
      ? "border-dashed border-paper/50 text-paper/70"
      : match === "exact"
        ? "border-solid border-gold bg-gold/25 text-paper ring-2 ring-gold/70 animate-pulse"
        : match === "alternative"
          ? "border-solid border-cta bg-cta/20 text-paper ring-2 ring-cta/60"
          : "border-dashed border-paper/25 text-paper/35";

    return (
      <button
        type="button"
        disabled={!highlightable}
        onClick={onClick}
        aria-label={`Posição ${slot.position}`}
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-sans text-[0.6rem] font-bold tracking-wide transition-transform ${ringClass} ${
          highlightable ? "cursor-pointer active:scale-95" : "cursor-default"
        }`}
      >
        {slot.position}
      </button>
    );
  }

  // Slot ocupado
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-paper font-heading text-lg text-charcoal shadow-md ${
            slot.outOfPosition ? "border-cta" : "border-gold"
          }`}
        >
          {player.number}
        </div>
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-heading text-[0.65rem] text-charcoal">
          {player.overall}
        </span>
      </div>
      <span className="max-w-[4.5rem] truncate rounded bg-charcoal/85 px-1.5 py-0.5 font-sans text-[0.55rem] font-semibold text-paper">
        {player.first_name}
      </span>
    </div>
  );
}

interface SquadFieldProps {
  formationId: string;
  slots: SquadSlot[];
  selectedPlayerPosition: PlayerPosition | null;
  onSlotClick: (index: number) => void;
}

export function SquadField({
  formationId,
  slots,
  selectedPlayerPosition,
  onSlotClick,
}: SquadFieldProps) {
  const layout = getFieldLayout(formationId);
  const selecting = selectedPlayerPosition !== null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-charcoal/20 bg-field shadow-[0_18px_40px_-22px_rgba(15,61,46,0.8)] aspect-[9/14]">
      {/* Marcações do campo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-3 rounded-lg border border-paper/25" />
        <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-paper/25" />
        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper/25" />
        {/* Grande área de cima */}
        <div className="absolute left-1/2 top-3 h-14 w-3/5 -translate-x-1/2 border border-t-0 border-paper/25" />
        <div className="absolute left-1/2 top-3 h-7 w-1/3 -translate-x-1/2 border border-t-0 border-paper/25" />
        {/* Grande área de baixo */}
        <div className="absolute bottom-3 left-1/2 h-14 w-3/5 -translate-x-1/2 border border-b-0 border-paper/25" />
        <div className="absolute bottom-3 left-1/2 h-7 w-1/3 -translate-x-1/2 border border-b-0 border-paper/25" />
      </div>

      {/* Listras do gramado */}
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:repeating-linear-gradient(0deg,transparent,transparent_30px,rgba(255,253,245,0.06)_30px,rgba(255,253,245,0.06)_60px)]" />

      {/* Slots posicionados por porcentagem */}
      {slots.map((slot, index) => {
        const coords = layout[index] ?? { x: 50, y: 50 };
        const match = selectedPlayerPosition
          ? matchPlayerToSlot(selectedPlayerPosition, slot.position)
          : "none";
        return (
          <div
            key={slot.index}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
          >
            <FieldSlot
              slot={slot}
              match={match}
              selecting={selecting}
              onClick={() => onSlotClick(index)}
            />
          </div>
        );
      })}
    </div>
  );
}
