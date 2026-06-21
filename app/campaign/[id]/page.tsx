import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CampaignRun, Match, Squad, UserSquad } from "@/lib/types";
import {
  buildCampaignSummary,
  calculateGroupTable,
  hasQualifiedFromGroup,
  resolveKnockout,
  stageLabel,
} from "@/lib/game/campaign";
import { NextMatchButton } from "@/components/game/NextMatchButton";
import { CreateShareButton } from "@/components/share/CreateShareButton";
import { TrackEvent } from "@/components/analytics/TrackEvent";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-10">{children}</main>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  active: "Em andamento",
  eliminated: "Eliminado",
  champion: "Campeão",
  completed: "Encerrada",
};

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaign_runs")
    .select("*")
    .eq("id", id)
    .maybeSingle<CampaignRun>();

  if (!campaign) {
    return (
      <Shell>
        <h1 className="font-heading text-4xl tracking-tight text-charcoal">
          Campanha não encontrada
        </h1>
        <Link
          href="/play/world-cup"
          className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
        >
          ← Montar time
        </Link>
      </Shell>
    );
  }

  const { data: matchesData } = await supabase
    .from("matches")
    .select("*")
    .eq("campaign_run_id", campaign.id)
    .order("match_order", { ascending: true })
    .returns<Match[]>();
  const matches = matchesData ?? [];

  const { data: squadsData } = await supabase
    .from("squads")
    .select("*")
    .eq("tournament_id", campaign.tournament_id)
    .returns<Squad[]>();
  const squadById = new Map((squadsData ?? []).map((s) => [s.id, s]));

  const { data: userSquad } = await supabase
    .from("user_squads")
    .select("*")
    .eq("id", campaign.user_squad_id)
    .maybeSingle<UserSquad>();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("name")
    .eq("id", campaign.tournament_id)
    .maybeSingle<{ name: string }>();
  const tournamentName = tournament?.name ?? "Campeonato";

  const groupMatches = matches.filter((m) => m.stage === "grupos");
  const knockoutMatches = matches.filter((m) => m.is_knockout);
  const last = matches[matches.length - 1];
  const summary = buildCampaignSummary(matches);

  // Classificação do grupo (mostra durante e após a fase de grupos).
  const opponents = (campaign.bracket?.group_opponents ?? [])
    .map((oid) => squadById.get(oid))
    .filter((s): s is Squad => Boolean(s))
    .map((s) => ({ id: s.id, name: s.display_name, code: s.country_code }));
  const groupTable =
    groupMatches.length > 0
      ? calculateGroupTable(
          groupMatches,
          opponents,
          campaign.bracket?.group_results ?? [],
        )
      : [];

  // Decisão de qual botão exibir (read-only; a rota faz a mutação real).
  let actionLabel: string | null = null;
  const isTerminal = campaign.status !== "active";

  if (!isTerminal) {
    if (groupMatches.length < 3) {
      actionLabel = "Próximo jogo";
    } else if (knockoutMatches.length === 0) {
      actionLabel = hasQualifiedFromGroup(groupTable)
        ? "Próximo jogo"
        : "Finalizar campanha";
    } else if (last) {
      const advanced = resolveKnockout(last);
      actionLabel =
        !advanced || last.stage === "final" ? "Finalizar campanha" : "Próximo jogo";
    }
  }

  const statusLabel = STATUS_LABEL[campaign.status] ?? campaign.status;
  const statusColor =
    campaign.status === "champion"
      ? "text-gold"
      : campaign.status === "eliminated"
        ? "text-cta"
        : "text-field-dark";

  return (
    <Shell>
      {isTerminal && (
        <TrackEvent
          event="campaign_finished"
          data={{ status: campaign.status, campaign_id: campaign.id }}
        />
      )}
      <header className="flex flex-col items-center text-center">
        <span className="font-heading text-3xl leading-none tracking-tight text-charcoal">
          LEN<span className="text-field">DAS</span>
        </span>
        <h1 className="mt-2 font-heading text-5xl leading-none tracking-tight text-charcoal">
          A campanha
        </h1>
        <span className="mt-1 font-sans text-xs font-bold uppercase tracking-[0.25em] text-field-dark">
          {tournamentName}
        </span>
        <span className="mt-0.5 font-sans text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
          #{campaign.id.slice(0, 8)}
        </span>
        <span
          className={`mt-3 rounded-full border border-charcoal/15 bg-paper px-4 py-1 font-heading text-xl tracking-wide ${statusColor}`}
        >
          {statusLabel} · {stageLabel(campaign.current_stage)}
        </span>
      </header>

      {/* Resumo */}
      <section className="mt-8 grid grid-cols-4 gap-2">
        <Stat label="Vitórias" value={summary.wins} />
        <Stat label="Gols pró" value={summary.goalsFor} />
        <Stat label="Sofridos" value={summary.goalsAgainst} />
        <Stat label="Jogos" value={summary.played} />
      </section>

      {/* Jogos */}
      <section className="mt-8">
        <h2 className="mb-3 font-heading text-3xl tracking-wide text-charcoal">
          Jogos
        </h2>
        <ul className="flex flex-col gap-2">
          {matches.map((match) => {
            const opp = match.opponent_squad_id
              ? squadById.get(match.opponent_squad_id)
              : undefined;
            const win = match.user_score > match.opponent_score;
            const draw = match.user_score === match.opponent_score;
            return (
              <li key={match.id}>
                <Link
                  href={`/result/${match.id}`}
                  className="flex items-center gap-3 rounded-xl border border-charcoal/10 bg-paper px-3 py-3"
                >
                  <span className="w-16 shrink-0 font-sans text-[0.6rem] font-bold uppercase tracking-wide text-field-dark">
                    {stageLabel(match.stage)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-sans text-sm font-semibold text-charcoal">
                    {opp?.display_name ?? "Adversário"}
                  </span>
                  <span className="shrink-0 font-heading text-2xl tracking-wide text-charcoal">
                    {match.user_score}-{match.opponent_score}
                  </span>
                  <span
                    className={`w-6 shrink-0 text-center font-heading text-lg ${
                      win ? "text-field" : draw ? "text-gold" : "text-cta"
                    }`}
                  >
                    {win ? "V" : draw ? "E" : "D"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Classificação do grupo */}
      {groupTable.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-3xl tracking-wide text-charcoal">
            Grupo
          </h2>
          <div className="overflow-hidden rounded-xl border border-charcoal/10 bg-paper">
            <div className="grid grid-cols-[1.6rem_1fr_2rem_2rem_2.5rem] gap-2 border-b border-charcoal/10 px-3 py-2 font-sans text-[0.6rem] font-bold uppercase tracking-wide text-muted-foreground">
              <span>#</span>
              <span>Time</span>
              <span className="text-center">J</span>
              <span className="text-center">SG</span>
              <span className="text-center">Pts</span>
            </div>
            {groupTable.map((row, index) => (
              <div
                key={row.squad_id ?? "user"}
                className={`grid grid-cols-[1.6rem_1fr_2rem_2rem_2.5rem] items-center gap-2 px-3 py-2 font-sans text-sm ${
                  row.is_user ? "bg-field/10 font-bold text-charcoal" : "text-charcoal"
                } ${index === 1 ? "border-b-2 border-dashed border-field/40" : "border-b border-charcoal/5"}`}
              >
                <span className="text-muted-foreground">{index + 1}</span>
                <span className="truncate">{row.name}</span>
                <span className="text-center">{row.played}</span>
                <span className="text-center">
                  {row.goals_for - row.goals_against}
                </span>
                <span className="text-center font-heading text-base">
                  {row.points}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-sans text-[0.7rem] text-muted-foreground">
            Os dois primeiros avançam para as oitavas.
          </p>
        </section>
      )}

      {/* Ações */}
      <section className="mt-10 flex flex-col gap-3">
        {actionLabel && (
          <NextMatchButton campaignId={campaign.id} label={actionLabel} />
        )}
        {isTerminal && campaign.ranking_applied && (
          <p className="flex items-center justify-center gap-2 rounded-xl border border-field/40 bg-field/10 px-4 py-2.5 text-center font-sans text-sm font-semibold text-field-dark">
            ✓ Ranking atualizado
          </p>
        )}
        {isTerminal && (
          <div className="rounded-2xl border border-charcoal/10 bg-paper p-4">
            <h3 className="mb-3 text-center font-heading text-2xl tracking-wide text-charcoal">
              Compartilhe sua campanha
            </h3>
            <CreateShareButton
              campaignId={campaign.id}
              initialShareId={campaign.public_share_id}
              initialIsPublic={campaign.is_public}
            />
          </div>
        )}
        {isTerminal && (
          <Link
            href="/ranking"
            className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
          >
            Ver ranking
          </Link>
        )}
        {isTerminal && last && (
          <Link
            href={`/result/${last.id}`}
            className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-xl tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
          >
            Ver resultado final
          </Link>
        )}
        <Link
          href="/play/world-cup"
          className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-xl tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
        >
          Jogar de novo
        </Link>
      </section>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-charcoal/10 bg-paper py-3">
      <span className="font-heading text-2xl leading-none text-charcoal">
        {value}
      </span>
      <span className="mt-1 font-sans text-[0.55rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
