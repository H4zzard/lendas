"use client";

import { FORMATIONS } from "@/lib/game/formations";

interface FormationSelectorProps {
  value: string;
  onChange: (formationId: string) => void;
}

export function FormationSelector({ value, onChange }: FormationSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-charcoal/70">
        Formação
      </span>
      <div className="grid grid-cols-3 gap-2">
        {FORMATIONS.map((formation) => {
          const active = formation.id === value;
          return (
            <button
              key={formation.id}
              type="button"
              onClick={() => onChange(formation.id)}
              className={`flex flex-col items-center rounded-lg border px-2 py-2 transition-colors ${
                active
                  ? "border-field bg-field text-paper"
                  : "border-charcoal/15 bg-paper text-charcoal hover:border-field/50"
              }`}
            >
              <span className="font-heading text-2xl leading-none tracking-wide">
                {formation.id}
              </span>
              <span
                className={`mt-0.5 font-sans text-[0.6rem] uppercase tracking-wider ${
                  active ? "text-paper/80" : "text-muted-foreground"
                }`}
              >
                {formation.style}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
