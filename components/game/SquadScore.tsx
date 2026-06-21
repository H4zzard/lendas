"use client";

import type { SquadSlot } from "@/lib/game/scores";

interface SquadScoreProps {
  slots: SquadSlot[];
  count: number;
  averageOverall: number;
  attackScore: number;
  defenseScore: number;
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-charcoal/10 bg-paper py-3">
      <span className="font-heading text-3xl leading-none text-charcoal">
        {value > 0 ? value : "—"}
      </span>
      <span className="mt-1 font-sans text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function SquadScore({
  slots,
  count,
  averageOverall,
  attackScore,
  defenseScore,
}: SquadScoreProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-3xl tracking-wide text-charcoal">
          Box Score
        </h2>
        <span className="rounded-full bg-charcoal px-3 py-1 font-heading text-lg tracking-wide text-paper">
          {count}/11
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Overall" value={averageOverall} />
        <StatBox label="Ataque" value={attackScore} />
        <StatBox label="Defesa" value={defenseScore} />
      </div>

      <ul className="flex flex-col divide-y divide-charcoal/10 overflow-hidden rounded-xl border border-charcoal/10 bg-paper">
        {slots.map((slot) => (
          <li
            key={slot.index}
            className="flex items-center gap-3 px-3 py-2"
          >
            <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded bg-charcoal/10 font-sans text-[0.65rem] font-bold tracking-wide text-charcoal">
              {slot.position}
            </span>
            <span className="min-w-0 flex-1 truncate font-sans text-sm text-charcoal">
              {slot.player ? (
                <>
                  {slot.player.first_name}
                  {slot.outOfPosition && (
                    <span className="ml-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-cta">
                      fora de posição
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
            <span className="shrink-0 font-heading text-lg text-charcoal/80">
              {slot.player ? slot.player.overall : "—"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
