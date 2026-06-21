"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type {
  Match,
  MatchEvent,
  Player,
  SetPieceOutcome,
  UserSquadPlayerWithPlayer,
} from "@/lib/types";
import { FORMATIONS, getFormation } from "@/lib/game/formations";
import { buildSlots } from "@/lib/game/draft";
import { getFieldLayout, FIELD_LAYOUTS } from "@/lib/game/field-layout";
import { SetPieceChoice } from "@/components/game/SetPieceChoice";
import { trackEvent } from "@/lib/analytics/track-event";

const CODE_DISPLAY: Record<string, string> = { DEU: "GER" };
const displayCode = (code: string) => CODE_DISPLAY[code] ?? code;

const userDispY = (y: number) => 44 + y * 0.54;
const oppDispY = (y: number) => 56 - y * 0.54;

const SPEEDS = [
  { id: "lento", label: "Lento", ms: 4500 },
  { id: "normal", label: "Normal", ms: 3000 },
  { id: "rapido", label: "Rápido", ms: 1500 },
  { id: "ultra", label: "Ultra", ms: 600 },
] as const;

interface Resolution {
  chosenName: string;
  chosenNumber: number;
  outcome: SetPieceOutcome;
  scored: boolean;
  text: string;
}

/** Resolve o lance respeitando o is_goal predeterminado (mantém placar coerente). */
function resolveTaker(event: MatchEvent, player: Player): Resolution {
  const name = player.first_name;
  if (event.is_goal) {
    return {
      chosenName: name,
      chosenNumber: player.number,
      outcome: "goal",
      scored: true,
      text: `${name} bateu com categoria. GOL!`,
    };
  }
  const r = Math.random();
  const outcome: SetPieceOutcome = r < 0.45 ? "save" : r < 0.8 ? "miss" : "post";
  const text =
    outcome === "save"
      ? `${name} cobrou, mas o goleiro defendeu.`
      : outcome === "miss"
        ? `${name} mandou para fora.`
        : `${name} acertou a trave.`;
  return { chosenName: name, chosenNumber: player.number, outcome, scored: false, text };
}

interface MatchSimulationClientProps {
  match: Match;
  tournamentName: string;
  formationId: string;
  userPlayers: UserSquadPlayerWithPlayer[];
  opponentName: string;
  opponentCode: string;
  opponentPlayers: Player[];
}

export function MatchSimulationClient({
  match,
  tournamentName,
  formationId,
  userPlayers,
  opponentName,
  opponentCode,
  opponentPlayers,
}: MatchSimulationClientProps) {
  const events = match.match_events;
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [speedMs, setSpeedMs] = useState<number>(3000);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});

  const userSlots = useMemo(() => {
    const formation = getFormation(formationId) ?? FORMATIONS[0];
    const slots = buildSlots(formation);
    const layout = getFieldLayout(formationId);
    for (const usp of userPlayers) {
      const slot = slots.find(
        (s) => s.player === null && s.position === usp.slot_position,
      );
      if (slot) slot.player = usp.player;
    }
    return slots.map((slot, i) => ({ ...slot, coord: layout[i] ?? { x: 50, y: 50 } }));
  }, [formationId, userPlayers]);

  const userTeamPlayers = useMemo(
    () => userSlots.map((s) => s.player).filter((p): p is Player => p !== null),
    [userSlots],
  );

  const oppLayout = FIELD_LAYOUTS["4-3-3"];

  // Métrica: partida concluída (uma vez).
  useEffect(() => {
    if (!finished) return;
    trackEvent("match_finished", {
      match_id: match.id,
      user_score: match.user_score,
      opponent_score: match.opponent_score,
      user_won: match.user_won,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const current = events[idx];

  // Evento interativo aguardando escolha do batedor.
  const isPending = (event: MatchEvent) =>
    Boolean(
      event.interactive &&
        event.requires_choice &&
        event.team === "user" &&
        !resolutions[event.id] &&
        userTeamPlayers.length > 0,
    );
  const pending = !finished && isPending(current);

  // Avanço automático (pausa em evento interativo; resolve sozinho se não há jogadores).
  useEffect(() => {
    if (finished) return;
    if (idx >= events.length - 1) {
      setFinished(true);
      return;
    }
    const cur = events[idx];

    if (isPending(cur)) return; // aguardando escolha — modal aberto

    // Sem jogadores carregados: resolve automaticamente para não travar/quebrar o placar.
    if (
      cur.interactive &&
      cur.requires_choice &&
      cur.team === "user" &&
      !resolutions[cur.id] &&
      userTeamPlayers.length === 0
    ) {
      setResolutions((prev) => ({
        ...prev,
        [cur.id]: {
          chosenName: "",
          chosenNumber: 0,
          outcome: cur.is_goal ? "goal" : "miss",
          scored: cur.is_goal,
          text: cur.description,
        },
      }));
      return;
    }

    const resolvedGoal = cur.interactive && resolutions[cur.id]?.scored;
    const duration =
      cur.type === "goal" || resolvedGoal ? speedMs + speedMs * 0.4 : speedMs;
    const timer = setTimeout(
      () => setIdx((i) => Math.min(i + 1, events.length - 1)),
      duration,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, finished, speedMs, events, resolutions, userTeamPlayers.length]);

  // Placar: no fim usa o salvo (garante coerência); durante o jogo, derivado.
  const { scoreUser, scoreOpp } = useMemo(() => {
    if (finished) {
      return { scoreUser: match.user_score, scoreOpp: match.opponent_score };
    }
    let u = 0;
    let o = 0;
    for (let i = 0; i <= idx; i++) {
      const e = events[i];
      if (!e.is_goal) continue;
      if (e.interactive && !resolutions[e.id]) continue; // gol interativo ainda não resolvido
      if (e.team === "user") u += 1;
      else if (e.team === "opponent") o += 1;
    }
    return { scoreUser: u, scoreOpp: o };
  }, [idx, events, finished, resolutions, match.user_score, match.opponent_score]);

  const resolution = resolutions[current.id];
  const ball = { x: current.target_x, y: current.target_y };
  const goalShown = current.is_goal && (!current.interactive || resolution?.scored);
  const narration = pending
    ? "Momento decisivo."
    : resolution
      ? resolution.text
      : current.description;
  const highlightNumber = pending
    ? undefined
    : current.team === "user"
      ? (resolution?.chosenNumber ?? current.player_number)
      : undefined;

  const recent = events.slice(0, idx + 1).slice(-5).reverse();
  const moveSec = Math.max(0.25, Math.min((speedMs / 1000) * 0.55, 0.9));

  function handleChoose(player: Player) {
    setResolutions((prev) => ({
      ...prev,
      [current.id]: resolveTaker(current, player),
    }));
  }

  function handleSkip() {
    setIdx(events.length - 1);
    setFinished(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col items-center text-center">
        <span className="font-heading text-3xl leading-none tracking-tight text-charcoal">
          LEN<span className="text-field">DAS</span>
        </span>
        <span className="mt-1 font-sans text-[0.65rem] font-bold uppercase tracking-[0.25em] text-field-dark">
          {tournamentName}
        </span>
      </header>

      <div className="paper-grain flex items-center justify-between rounded-2xl border border-charcoal/15 bg-field-dark px-5 py-4 text-paper">
        <span className="font-heading text-2xl tracking-wide text-gold">VOCÊ</span>
        <div className="flex items-center gap-3 font-heading text-5xl leading-none">
          <motion.span
            key={`u-${scoreUser}`}
            initial={{ scale: 1.6, color: "#C9A227" }}
            animate={{ scale: 1, color: "#FFFDF5" }}
            transition={{ duration: 0.4 }}
          >
            {scoreUser}
          </motion.span>
          <span className="text-gold">-</span>
          <motion.span
            key={`o-${scoreOpp}`}
            initial={{ scale: 1.6, color: "#C9A227" }}
            animate={{ scale: 1, color: "#FFFDF5" }}
            transition={{ duration: 0.4 }}
          >
            {scoreOpp}
          </motion.span>
        </div>
        <span className="font-heading text-2xl tracking-wide text-paper/90">
          {displayCode(opponentCode)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <span className="rounded-full bg-charcoal px-3 py-0.5 font-heading text-lg tracking-wide text-paper">
          {current.minute}&apos;
        </span>
        <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {opponentName}
        </span>
      </div>

      {!finished && (
        <div className="flex items-center gap-2">
          <span className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.18em] text-charcoal/70">
            Velocidade
          </span>
          <div className="grid flex-1 grid-cols-4 gap-1.5">
            {SPEEDS.map((speed) => {
              const active = speed.ms === speedMs;
              return (
                <button
                  key={speed.id}
                  type="button"
                  onClick={() => setSpeedMs(speed.ms)}
                  className={`rounded-lg border px-1 py-1.5 font-sans text-[0.65rem] font-bold uppercase tracking-wide transition-colors ${
                    active
                      ? "border-field bg-field text-paper"
                      : "border-charcoal/15 bg-paper text-charcoal"
                  }`}
                >
                  {speed.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Campo */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-charcoal/20 bg-field shadow-[0_18px_40px_-22px_rgba(15,61,46,0.8)] aspect-[9/14]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-3 rounded-lg border border-paper/25" />
          <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-paper/25" />
          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper/25" />
          <div className="absolute left-1/2 top-3 h-14 w-3/5 -translate-x-1/2 border border-t-0 border-paper/25" />
          <div className="absolute bottom-3 left-1/2 h-14 w-3/5 -translate-x-1/2 border border-b-0 border-paper/25" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:repeating-linear-gradient(0deg,transparent,transparent_30px,rgba(255,253,245,0.06)_30px,rgba(255,253,245,0.06)_60px)]" />

        {oppLayout.map((coord, i) => {
          const opp = opponentPlayers[i];
          return (
            <div
              key={`opp-${i}`}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${coord.x}%`, top: `${oppDispY(coord.y)}%` }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-paper/40 bg-charcoal/60 font-heading text-xs text-paper/80">
                {opp?.number ?? "•"}
              </div>
            </div>
          );
        })}

        {userSlots.map((slot) => {
          const player = slot.player;
          const highlighted =
            highlightNumber !== undefined && player?.number === highlightNumber;
          return (
            <div
              key={slot.index}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
              style={{
                left: `${slot.coord.x}%`,
                top: `${userDispY(slot.coord.y)}%`,
              }}
            >
              <motion.div
                animate={{
                  scale: highlighted ? 1.18 : 1,
                  boxShadow: highlighted
                    ? "0 0 0 3px rgba(239,59,36,0.6)"
                    : "0 4px 6px -2px rgba(20,20,20,0.4)",
                }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 bg-paper font-heading text-base text-charcoal ${
                  highlighted ? "border-cta" : "border-gold"
                }`}
              >
                {player?.number ?? "—"}
              </motion.div>
              {player && (
                <span className="max-w-[3.8rem] truncate rounded bg-charcoal/85 px-1 py-0.5 font-sans text-[0.5rem] font-semibold text-paper">
                  {player.first_name}
                </span>
              )}
            </div>
          );
        })}

        <motion.div
          className="absolute z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper shadow-[0_0_0_2px_rgba(20,20,20,0.6)]"
          animate={{ left: `${ball.x}%`, top: `${ball.y}%` }}
          transition={{ duration: moveSec, ease: "easeInOut" }}
        />

        {/* Escolha do batedor */}
        {pending && current.choice_type && (
          <SetPieceChoice
            choiceType={current.choice_type}
            players={userTeamPlayers}
            onChoose={handleChoose}
          />
        )}
      </div>

      {/* Narração */}
      <div className="relative min-h-[3.5rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.id}-${resolution ? "r" : "p"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: goalShown ? [1, 1.05, 1] : 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`rounded-xl border px-4 py-3 text-center font-sans text-sm ${
              goalShown
                ? "border-gold bg-gold/15 font-bold text-charcoal"
                : pending
                  ? "border-cta/40 bg-cta/10 font-bold text-cta"
                  : "border-charcoal/10 bg-paper text-charcoal"
            }`}
          >
            {narration}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Últimos lances */}
      <ul className="flex flex-col gap-1.5">
        {recent.map((event) => {
          const res = resolutions[event.id];
          const text = res ? res.text : event.description;
          const showGoal = event.is_goal && (!event.interactive || res?.scored);
          return (
            <li
              key={event.id}
              className="flex items-center gap-3 rounded-lg border border-charcoal/10 bg-paper px-3 py-1.5"
            >
              <span className="w-8 shrink-0 font-heading text-base text-charcoal/70">
                {event.minute}&apos;
              </span>
              <span className="min-w-0 flex-1 truncate font-sans text-xs text-charcoal">
                {text}
              </span>
              {showGoal && (
                <span className="shrink-0 rounded bg-gold px-1.5 py-0.5 font-heading text-[0.65rem] text-charcoal">
                  GOL
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Controles */}
      <div className="flex flex-col gap-3 pt-2">
        {!finished ? (
          <button
            type="button"
            onClick={handleSkip}
            className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-xl tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
          >
            Pular partida
          </button>
        ) : (
          <Link
            href={`/result/${match.id}`}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
          >
            Resultado
          </Link>
        )}
      </div>
    </div>
  );
}
