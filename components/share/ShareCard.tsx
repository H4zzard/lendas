import { forwardRef } from "react";
import type { CampaignShareData } from "@/lib/types";

interface ShareCardProps {
  data: CampaignShareData;
}

/**
 * Card visual compartilhável da campanha. Presentational e com ref, para ser
 * exportado como imagem (html-to-image) pelo ShareActions.
 */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ data }, ref) {
    const isChampion = data.statusSeal === "CAMPEÃO";
    return (
      <div
        ref={ref}
        className="paper-grain mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border-2 border-gold/60 bg-field-dark text-paper"
      >
        <div className="flex flex-col gap-5 px-6 py-7">
          {/* Cabeçalho */}
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-5xl leading-none tracking-tight text-paper">
              LEN<span className="text-gold">DAS</span>
            </span>
            <span className="mt-1 font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-paper/60">
              {data.tournamentName}
            </span>
          </div>

          {/* Selo */}
          <div className="flex flex-col items-center gap-1">
            <span
              className={`rounded-full px-6 py-1.5 font-heading text-3xl tracking-wide ${
                isChampion ? "bg-gold text-charcoal" : "bg-cta text-paper"
              }`}
            >
              {data.statusSeal}
            </span>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-paper/70">
              {data.resultLabel}
            </span>
          </div>

          {/* Jogador */}
          <div className="text-center">
            <span className="block truncate font-heading text-3xl leading-none tracking-wide text-gold">
              {data.playerName}
            </span>
            {data.rankingPosition && (
              <span className="mt-1 block font-sans text-[0.65rem] uppercase tracking-wider text-paper/60">
                #{data.rankingPosition} no ranking
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Vitórias" value={data.wins} />
            <Stat label="Gols" value={data.goalsFor} />
            <Stat label="Sofridos" value={data.goalsAgainst} />
            <Stat label="Overall" value={data.averageOverall} highlight />
          </div>

          {/* Top 3 */}
          <div className="flex flex-col gap-1.5">
            <span className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.25em] text-gold">
              Trio de ouro
            </span>
            {data.topPlayers.map((player, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-paper/15 bg-paper/5 px-3 py-1.5"
              >
                <span className="w-5 font-heading text-lg text-gold">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-sans text-sm font-bold text-paper">
                  {player.first_name}
                </span>
                <span className="font-sans text-[0.6rem] uppercase tracking-wider text-paper/60">
                  {player.position}
                </span>
                <span className="font-heading text-lg text-paper">
                  {player.overall}
                </span>
              </div>
            ))}
          </div>

          {/* Frase + CTA */}
          <div className="border-t border-paper/15 pt-4 text-center">
            <p className="font-heading text-xl leading-tight tracking-wide text-paper">
              “{data.phrase}”
            </p>
            <p className="mt-2 font-sans text-[0.65rem] font-bold uppercase tracking-[0.25em] text-gold">
              Monte seu 11 em Lendas
            </p>
          </div>
        </div>
      </div>
    );
  },
);

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-paper/15 bg-paper/5 py-2">
      <span
        className={`font-heading text-2xl leading-none ${
          highlight ? "text-gold" : "text-paper"
        }`}
      >
        {value}
      </span>
      <span className="mt-0.5 font-sans text-[0.5rem] font-bold uppercase tracking-wider text-paper/60">
        {label}
      </span>
    </div>
  );
}
