import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Match, UserSquad } from "@/lib/types";
import { stageLabel } from "@/lib/game/campaign";
import { CreateShareButton } from "@/components/share/CreateShareButton";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-10">{children}</main>
    </div>
  );
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle<Match>();

  if (!match) {
    return (
      <Shell>
        <h1 className="font-heading text-4xl tracking-tight text-charcoal">
          Resultado indisponível
        </h1>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          Não encontramos esta partida.
        </p>
        <Link
          href="/play/world-cup"
          className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
        >
          ← Montar time
        </Link>
      </Shell>
    );
  }

  const { data: userSquad } = await supabase
    .from("user_squads")
    .select("average_overall")
    .eq("id", match.user_squad_id)
    .maybeSingle<Pick<UserSquad, "average_overall">>();

  // Campanha (para destaque de campeã/encerrada e compartilhamento)
  let campaignStatus: string | null = null;
  let campaignShare: {
    id: string;
    public_share_id: string | null;
    is_public: boolean;
  } | null = null;
  if (match.campaign_run_id) {
    const { data: campaign } = await supabase
      .from("campaign_runs")
      .select("id, status, public_share_id, is_public")
      .eq("id", match.campaign_run_id)
      .maybeSingle<{
        id: string;
        status: string;
        public_share_id: string | null;
        is_public: boolean;
      }>();
    campaignStatus = campaign?.status ?? null;
    if (campaign) {
      campaignShare = {
        id: campaign.id,
        public_share_id: campaign.public_share_id,
        is_public: campaign.is_public,
      };
    }
  }

  const campaignEnded =
    campaignStatus === "champion" ||
    campaignStatus === "eliminated" ||
    campaignStatus === "completed";

  const isWin = match.user_score > match.opponent_score;
  const isDraw = match.user_score === match.opponent_score;
  const outcome = isWin ? "Vitória" : isDraw ? "Empate" : "Derrota";
  const outcomeColor = isWin
    ? "text-field"
    : isDraw
      ? "text-gold"
      : "text-cta";

  return (
    <Shell>
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="font-heading text-3xl leading-none tracking-tight text-charcoal">
          LEN<span className="text-field">DAS</span>
        </span>

        {match.campaign_run_id && (
          <span className="rounded-full border border-charcoal/15 bg-paper px-4 py-1 font-sans text-[0.65rem] font-bold uppercase tracking-[0.25em] text-field-dark">
            {stageLabel(match.stage)}
          </span>
        )}

        {campaignStatus === "champion" && (
          <span className="rounded-full bg-gold px-5 py-1.5 font-heading text-xl tracking-wide text-charcoal">
            🏆 Campanha campeã
          </span>
        )}
        {campaignStatus === "eliminated" && (
          <span className="rounded-full border border-cta/50 bg-cta/10 px-5 py-1.5 font-heading text-xl tracking-wide text-cta">
            Campanha encerrada
          </span>
        )}

        <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-charcoal/15 bg-field-dark px-6 py-10 text-paper">
          <span
            className={`font-heading text-6xl leading-none tracking-tight ${outcomeColor}`}
          >
            {outcome}
          </span>
          <div className="mt-3 flex items-center gap-4 font-heading text-7xl leading-none">
            <span>{match.user_score}</span>
            <span className="text-gold">-</span>
            <span>{match.opponent_score}</span>
          </div>
          <span className="mt-2 font-sans text-[0.65rem] uppercase tracking-[0.25em] text-paper/60">
            Placar final
          </span>
        </div>

        <div className="grid w-full grid-cols-3 gap-2">
          <Stat label="Gols pró" value={match.user_score} />
          <Stat label="Gols sofridos" value={match.opponent_score} />
          <Stat label="Overall" value={userSquad?.average_overall ?? 0} />
        </div>

        {campaignEnded && campaignShare && (
          <div className="w-full rounded-2xl border border-charcoal/10 bg-paper p-4 text-left">
            <h3 className="mb-3 text-center font-heading text-2xl tracking-wide text-charcoal">
              Compartilhe sua campanha
            </h3>
            <CreateShareButton
              campaignId={campaignShare.id}
              initialShareId={campaignShare.public_share_id}
              initialIsPublic={campaignShare.is_public}
            />
          </div>
        )}

        <div className="mt-2 flex w-full flex-col gap-3">
          {match.campaign_run_id ? (
            <>
              <Link
                href={`/campaign/${match.campaign_run_id}`}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
              >
                Continuar campanha
              </Link>
              <Link
                href="/ranking"
                className="flex h-11 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-lg tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
              >
                Ver ranking
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/play/world-cup"
                className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
              >
                Jogar de novo
              </Link>
              <Link
                href="/ranking"
                className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-xl tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
              >
                Ver ranking
              </Link>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-charcoal/10 bg-paper py-4">
      <span className="font-heading text-3xl leading-none text-charcoal">
        {value}
      </span>
      <span className="mt-1 font-sans text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
