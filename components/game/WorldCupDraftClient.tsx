"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics/track-event";
import type { Player } from "@/lib/types";
import { FORMATIONS, getFormation } from "@/lib/game/formations";
import {
  buildSlots,
  drawSquad,
  hasFreeCompatibleSlot,
  matchPlayerToSlot,
  type SquadWithPlayers,
} from "@/lib/game/draft";
import {
  calcAttackScore,
  calcAverageOverall,
  calcDefenseScore,
  type SquadSlot,
} from "@/lib/game/scores";
import { FormationSelector } from "@/components/game/FormationSelector";
import { PlayerPickList } from "@/components/game/PlayerPickList";
import { SquadField } from "@/components/game/SquadField";
import { SquadScore } from "@/components/game/SquadScore";

const TOTAL_SLOTS = 11;

interface WorldCupDraftClientProps {
  squads: SquadWithPlayers[];
  tournamentId: string;
  tournamentName?: string;
}

export function WorldCupDraftClient({
  squads,
  tournamentId,
  tournamentName = "Copa do Mundo",
}: WorldCupDraftClientProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [formationId, setFormationId] = useState(FORMATIONS[0].id);
  const [slots, setSlots] = useState<SquadSlot[]>(() =>
    buildSlots(FORMATIONS[0]),
  );
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [currentSquad, setCurrentSquad] = useState<SquadWithPlayers | null>(null);

  const formation = getFormation(formationId) ?? FORMATIONS[0];

  const count = slots.filter((slot) => slot.player !== null).length;
  const isComplete = count >= TOTAL_SLOTS;
  const averageOverall = calcAverageOverall(slots);
  const attackScore = calcAttackScore(slots);
  const defenseScore = calcDefenseScore(slots);

  const pickedIds = useMemo(
    () =>
      new Set(
        slots
          .filter((slot) => slot.player !== null)
          .map((slot) => slot.player!.id),
      ),
    [slots],
  );

  // Jogadores do squad sorteado que ainda não foram escalados.
  const availablePlayers = useMemo(() => {
    if (!currentSquad) return [];
    return [...currentSquad.players]
      .filter((player) => !pickedIds.has(player.id))
      .sort((a, b) => b.overall - a.overall);
  }, [currentSquad, pickedIds]);

  const selectedHasSlot = selectedPlayer
    ? hasFreeCompatibleSlot(selectedPlayer, slots)
    : false;

  // Métricas: início do draft (uma vez) e time completo.
  const squadCompletedTracked = useRef(false);
  useEffect(() => {
    trackEvent("draft_started", { tournament_id: tournamentId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (count >= TOTAL_SLOTS && !squadCompletedTracked.current) {
      squadCompletedTracked.current = true;
      trackEvent("squad_completed", { formation: formationId, averageOverall });
    } else if (count < TOTAL_SLOTS) {
      squadCompletedTracked.current = false;
    }
  }, [count, formationId, averageOverall]);

  function handleFormationChange(id: string) {
    if (id === formationId) return;
    if (count > 0) {
      const ok = window.confirm(
        "Trocar formação vai reiniciar sua escalação. Deseja continuar?",
      );
      if (!ok) return;
    }
    const next = getFormation(id) ?? FORMATIONS[0];
    setFormationId(id);
    setSlots(buildSlots(next));
    setSelectedPlayer(null);
  }

  function handleRoll() {
    if (isComplete) return;
    const squad = drawSquad(squads);
    if (!squad) {
      toast.error("Nenhuma seleção disponível.");
      return;
    }
    setCurrentSquad(squad);
    setSelectedPlayer(null);
  }

  function handleSelectPlayer(player: Player) {
    if (isComplete) return;
    if (!hasFreeCompatibleSlot(player, slots)) return;
    setSelectedPlayer(player);
    trackEvent("player_selected", {
      player_id: player.id,
      position: player.position,
    });
  }

  function handleSlotClick(index: number) {
    if (!selectedPlayer) return;
    const slot = slots[index];
    if (slot.player) return;

    const match = matchPlayerToSlot(selectedPlayer.position, slot.position);
    if (match === "none") return;

    const outOfPosition = match === "alternative";
    const player = selectedPlayer;

    setSlots((prev) =>
      prev.map((s) =>
        s.index === index ? { ...s, player, outOfPosition } : s,
      ),
    );
    setSelectedPlayer(null);
    setCurrentSquad(null);

    if (outOfPosition) {
      toast.warning("Jogador colocado fora da posição ideal.");
    }
  }

  function handleReset() {
    setSlots(buildSlots(formation));
    setSelectedPlayer(null);
    setCurrentSquad(null);
  }

  async function handleStartMatch() {
    if (!isComplete || starting) return;
    setStarting(true);

    const payload = {
      tournament_id: tournamentId,
      formation: formationId,
      play_style: formation.style,
      average_overall: averageOverall,
      attack_score: attackScore,
      defense_score: defenseScore,
      players: slots
        .filter((slot) => slot.player !== null)
        .map((slot) => ({
          player_id: slot.player!.id,
          slot_position: slot.position,
          is_out_of_position: slot.outOfPosition,
        })),
    };

    try {
      const res = await fetch("/api/matches/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao iniciar partida.");
        setStarting(false);
        return;
      }
      trackEvent("campaign_started", {
        campaign_run_id: data.campaign_run_id,
        formation: formationId,
        average_overall: averageOverall,
      });
      trackEvent("match_started", { match_id: data.match_id, stage: "grupos" });
      router.push(data.redirect_url);
    } catch {
      toast.error("Falha de conexão ao iniciar a partida.");
      setStarting(false);
    }
  }

  // Texto de orientação para o usuário.
  let guidance = "";
  if (!isComplete) {
    if (selectedPlayer) {
      guidance = selectedHasSlot
        ? "Agora toque em uma posição destacada no campo."
        : "Todas as posições compatíveis estão ocupadas.";
    } else if (currentSquad) {
      guidance = "Escolha um jogador da lista.";
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Topo */}
      <header className="flex flex-col items-center text-center">
        <span className="font-heading text-5xl leading-none tracking-tight text-charcoal">
          LEN<span className="text-field">DAS</span>
        </span>
        <span className="mt-1 font-sans text-xs font-bold uppercase tracking-[0.25em] text-field-dark">
          {tournamentName}
        </span>
        <span className="mt-3 rounded-full bg-charcoal px-4 py-1 font-heading text-xl tracking-wide text-paper">
          {count}/11
        </span>
      </header>

      {/* Controles */}
      <section className="flex flex-col gap-4">
        <FormationSelector value={formationId} onChange={handleFormationChange} />

        {!isComplete && (
          <button
            type="button"
            onClick={handleRoll}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
          >
            {currentSquad ? "Outra seleção" : "Rolar"}
          </button>
        )}

        {count > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="self-center font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-cta"
          >
            Recomeçar time
          </button>
        )}
      </section>

      {/* Card do sorteio + lista de jogadores */}
      {currentSquad && !isComplete && (
        <section className="flex flex-col gap-4">
          <div className="paper-grain overflow-hidden rounded-2xl border border-charcoal/15 bg-field-dark text-paper">
            <div className="border-b border-paper/15 px-5 py-2 font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold">
              Saiu
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-heading text-3xl leading-none tracking-tight">
                {currentSquad.display_name}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold font-heading text-2xl text-gold">
                {currentSquad.overall}
              </span>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-heading text-2xl tracking-wide text-charcoal">
              Escolha um jogador
            </h2>
            {availablePlayers.length > 0 ? (
              <PlayerPickList
                players={availablePlayers}
                slots={slots}
                selectedPlayerId={selectedPlayer?.id ?? null}
                onSelect={handleSelectPlayer}
              />
            ) : (
              <p className="rounded-xl border border-charcoal/10 bg-paper px-4 py-6 text-center font-sans text-sm text-muted-foreground">
                Todos os jogadores desta seleção já foram escalados. Sorteie
                outra seleção.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Campo */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-3xl tracking-wide text-charcoal">
            {formation.name}
          </h2>
        </div>

        {guidance && (
          <p
            className={`rounded-xl border px-4 py-2.5 text-center font-sans text-sm ${
              selectedPlayer && selectedHasSlot
                ? "border-field/40 bg-field/10 text-field-dark"
                : selectedPlayer && !selectedHasSlot
                  ? "border-cta/40 bg-cta/10 text-cta"
                  : "border-charcoal/10 bg-paper text-muted-foreground"
            }`}
          >
            {guidance}
          </p>
        )}

        <SquadField
          formationId={formationId}
          slots={slots}
          selectedPlayerPosition={selectedPlayer?.position ?? null}
          onSlotClick={handleSlotClick}
        />
      </section>

      {/* Box Score */}
      <SquadScore
        slots={slots}
        count={count}
        averageOverall={averageOverall}
        attackScore={attackScore}
        defenseScore={defenseScore}
      />

      {/* Iniciar partida */}
      {isComplete && (
        <section className="flex flex-col gap-3 border-t border-charcoal/15 pt-6">
          <p className="text-center font-sans text-sm text-field-dark">
            Time completo! Overall médio {averageOverall} · Ataque {attackScore}{" "}
            · Defesa {defenseScore}
          </p>
          <button
            type="button"
            onClick={handleStartMatch}
            disabled={starting}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-field font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(31,122,77,0.8)] transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {starting ? "Apitando o início…" : "Iniciar partida"}
          </button>
        </section>
      )}

      <Link
        href="/play"
        className="self-center font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-charcoal"
      >
        ← Trocar de modo
      </Link>
    </div>
  );
}
