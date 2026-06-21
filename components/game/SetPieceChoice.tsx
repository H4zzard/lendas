"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Player } from "@/lib/types";
import { getPositionName } from "@/lib/game/positions";

interface SetPieceChoiceProps {
  choiceType: "penalty_taker" | "free_kick_taker";
  players: Player[];
  onChoose: (player: Player) => void;
}

/** Pontuação do batedor conforme o tipo de cobrança. */
function takerScore(
  player: Player,
  choiceType: "penalty_taker" | "free_kick_taker",
): number {
  if (choiceType === "penalty_taker") {
    return player.penalty ?? Math.round(player.shooting * 0.6 + player.overall * 0.4);
  }
  return player.set_piece ?? Math.round((player.shooting + player.passing) / 2);
}

export function SetPieceChoice({
  choiceType,
  players,
  onChoose,
}: SetPieceChoiceProps) {
  const isPenalty = choiceType === "penalty_taker";

  const sorted = useMemo(
    () =>
      [...players].sort((a, b) => takerScore(b, choiceType) - takerScore(a, choiceType)),
    [players, choiceType],
  );

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-charcoal/70 p-3 sm:items-center">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="paper-grain flex max-h-[90%] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border-2 border-gold/60 bg-background"
      >
        <div className="border-b border-charcoal/10 bg-field-dark px-5 py-4 text-paper">
          <span className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold">
            Momento decisivo
          </span>
          <h2 className="mt-1 font-heading text-3xl leading-none tracking-wide">
            {isPenalty ? "Pênalti para o seu time" : "Falta perigosa"}
          </h2>
          <p className="mt-1 font-sans text-sm text-paper/80">
            {isPenalty ? "Escolha o batedor" : "Quem vai para a cobrança?"}
          </p>
        </div>

        <ul className="flex flex-col gap-2 overflow-y-auto p-3">
          {sorted.map((player, index) => {
            const best = index === 0;
            const main = takerScore(player, choiceType);
            return (
              <li key={player.id}>
                <button
                  type="button"
                  onClick={() => onChoose(player)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    best
                      ? "border-gold bg-gold/15"
                      : "border-charcoal/10 bg-paper hover:border-field/60"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-charcoal/20 font-heading text-lg text-charcoal">
                    {player.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-sans text-sm font-bold text-charcoal">
                        {player.first_name}
                      </span>
                      {best && (
                        <span className="shrink-0 rounded bg-gold px-1.5 py-0.5 font-sans text-[0.55rem] font-bold uppercase tracking-wide text-charcoal">
                          Melhor opção
                        </span>
                      )}
                    </span>
                    <span className="block font-sans text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                      {getPositionName(player.position)} ·{" "}
                      {isPenalty
                        ? `PÊN ${player.penalty} · CHU ${player.shooting} · OVR ${player.overall}`
                        : `BOLA ${player.set_piece} · CHU ${player.shooting} · PAS ${player.passing}`}
                    </span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-charcoal font-heading text-xl text-paper">
                    {main}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}
