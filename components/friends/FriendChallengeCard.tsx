import { forwardRef } from "react";
import type { FriendChallengeCardData, FriendTeamSummary } from "@/lib/types";

function TeamColumn({
  team,
  win,
  align,
}: {
  team: FriendTeamSummary;
  win: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-1 flex-col ${align === "right" ? "items-end text-right" : "items-start text-left"}`}
    >
      <span
        className={`truncate font-heading text-2xl leading-none tracking-wide ${win ? "text-gold" : "text-paper"}`}
      >
        {team.name}
      </span>
      <span className="mt-1 font-sans text-[0.6rem] uppercase tracking-wider text-paper/60">
        OVR {team.averageOverall}
      </span>
      <div className="mt-2 flex flex-col gap-0.5">
        {team.topPlayers.map((p, i) => (
          <span key={i} className="font-sans text-[0.7rem] text-paper/80">
            {p.first_name}
          </span>
        ))}
      </div>
    </div>
  );
}

interface FriendChallengeCardProps {
  data: FriendChallengeCardData;
}

/** Card visual compartilhável do resultado de um desafio entre amigos. */
export const FriendChallengeCard = forwardRef<
  HTMLDivElement,
  FriendChallengeCardProps
>(function FriendChallengeCard({ data }, ref) {
  return (
    <div
      ref={ref}
      className="paper-grain mx-auto w-full max-w-[380px] overflow-hidden rounded-2xl border-2 border-gold/60 bg-field-dark text-paper"
    >
      <div className="flex flex-col gap-5 px-6 py-7">
        <div className="flex flex-col items-center text-center">
          <span className="font-heading text-5xl leading-none tracking-tight">
            LEN<span className="text-gold">DAS</span>
          </span>
          <span className="mt-1 font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-paper/60">
            Desafio entre amigos · {data.tournamentName}
          </span>
        </div>

        {/* Placar */}
        <div className="flex items-center justify-center gap-4">
          <span className="font-heading text-7xl leading-none">
            {data.creatorScore}
          </span>
          <span className="font-heading text-4xl text-gold">×</span>
          <span className="font-heading text-7xl leading-none">
            {data.opponentScore}
          </span>
        </div>

        <div className="rounded-full bg-gold/15 py-1.5 text-center font-heading text-xl tracking-wide text-gold">
          {data.resultLabel}
        </div>

        {/* Times */}
        <div className="flex items-start gap-3 border-t border-paper/15 pt-4">
          <TeamColumn
            team={data.creator}
            win={data.winner === "creator"}
            align="left"
          />
          <span className="self-center font-sans text-[0.6rem] font-bold uppercase tracking-wider text-paper/40">
            vs
          </span>
          <TeamColumn
            team={data.opponent}
            win={data.winner === "opponent"}
            align="right"
          />
        </div>

        <p className="border-t border-paper/15 pt-4 text-center font-heading text-base tracking-wide text-gold">
          Monte seu 11 e desafie um amigo
        </p>
      </div>
    </div>
  );
});
