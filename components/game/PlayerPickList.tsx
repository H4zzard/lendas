"use client";

import type { Player } from "@/lib/types";
import type { SquadSlot } from "@/lib/game/scores";
import { getPositionName } from "@/lib/game/positions";
import { hasFreeCompatibleSlot } from "@/lib/game/draft";

interface PlayerPickListProps {
  players: Player[];
  slots: SquadSlot[];
  selectedPlayerId: string | null;
  onSelect: (player: Player) => void;
}

export function PlayerPickList({
  players,
  slots,
  selectedPlayerId,
  onSelect,
}: PlayerPickListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {players.map((player) => {
        const elite = player.overall >= 88;
        const canPlace = hasFreeCompatibleSlot(player, slots);
        const selected = player.id === selectedPlayerId;

        return (
          <li key={player.id}>
            <button
              type="button"
              disabled={!canPlace}
              aria-pressed={selected}
              onClick={() => onSelect(player)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                selected
                  ? "border-field bg-field/10 ring-2 ring-field/60"
                  : "border-charcoal/10 bg-paper hover:border-field/60 hover:bg-field/5"
              } ${!canPlace ? "cursor-not-allowed opacity-45" : ""}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-charcoal/20 font-heading text-lg text-charcoal">
                {player.number}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-sans text-sm font-bold text-charcoal">
                  {player.first_name}
                  {selected && (
                    <span className="ml-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-field">
                      selecionado
                    </span>
                  )}
                </span>
                <span className="block font-sans text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  {player.position} · {getPositionName(player.position)}
                  {!canPlace && (
                    <span className="ml-1.5 font-semibold text-cta">
                      sem posição livre
                    </span>
                  )}
                </span>
              </span>

              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-heading text-xl ${
                  elite ? "bg-gold text-charcoal" : "bg-charcoal/10 text-charcoal"
                }`}
              >
                {player.overall}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
