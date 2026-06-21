import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  FriendChallenge,
  Player,
  PublicProfile,
  Tournament,
  UserSquad,
  UserSquadPlayerWithPlayer,
} from "@/lib/types";
import { ChallengeShareButtons } from "@/components/friends/ChallengeShareButtons";

export const metadata: Metadata = {
  title: "Lendas — Desafio entre amigos",
  description: "Monte seu 11 histórico e dispute um duelo direto no Lendas.",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-10">{children}</main>
    </div>
  );
}

function NotFound() {
  return (
    <Shell>
      <h1 className="font-heading text-4xl tracking-tight text-charcoal">
        Desafio não encontrado
      </h1>
      <Link
        href="/friends"
        className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
      >
        ← Modo Amigos
      </Link>
    </Shell>
  );
}

function nameOf(p: PublicProfile | null): string {
  return p?.display_name?.trim() || p?.username?.trim() || "Jogador";
}

interface TeamSummary {
  averageOverall: number;
  top: Player[];
}

function TeamBlock({
  title,
  name,
  team,
  highlight,
}: {
  title: string;
  name: string;
  team: TeamSummary | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? "border-gold/60 bg-gold/10" : "border-charcoal/10 bg-paper"
      }`}
    >
      <span className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.2em] text-field-dark">
        {title}
      </span>
      <div className="mt-0.5 flex items-baseline justify-between">
        <span className="truncate font-heading text-2xl tracking-wide text-charcoal">
          {name}
        </span>
        <span className="shrink-0 font-heading text-xl text-charcoal/70">
          OVR {team?.averageOverall ?? "—"}
        </span>
      </div>
      {team && team.top.length > 0 && (
        <p className="mt-1 truncate font-sans text-xs text-muted-foreground">
          {team.top.map((p) => p.first_name).join(" · ")}
        </p>
      )}
    </div>
  );
}

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: challenge } = await supabase
    .from("friend_challenges")
    .select("*")
    .eq("code", code)
    .maybeSingle<FriendChallenge>();
  if (!challenge) return <NotFound />;

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("name")
    .eq("id", challenge.tournament_id)
    .maybeSingle<Pick<Tournament, "name">>();
  const tournamentName = tournament?.name ?? "Campeonato";

  // Perfis (sem e-mail)
  const ids = [challenge.creator_id, challenge.opponent_id].filter(
    (id): id is string => Boolean(id),
  );
  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, username, display_name")
    .in("id", ids)
    .returns<PublicProfile[]>();
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const creatorName = nameOf(profileById.get(challenge.creator_id) ?? null);
  const opponentName = challenge.opponent_id
    ? nameOf(profileById.get(challenge.opponent_id) ?? null)
    : "Adversário";

  async function loadTeam(squadId: string | null): Promise<TeamSummary | null> {
    if (!squadId) return null;
    const { data: squad } = await supabase
      .from("user_squads")
      .select("average_overall")
      .eq("id", squadId)
      .maybeSingle<Pick<UserSquad, "average_overall">>();
    const { data: sp } = await supabase
      .from("user_squad_players")
      .select("*, player:players(*)")
      .eq("user_squad_id", squadId)
      .returns<UserSquadPlayerWithPlayer[]>();
    const top = [...(sp ?? [])]
      .filter((x) => x.player)
      .sort((a, b) => b.player.overall - a.player.overall)
      .slice(0, 3)
      .map((x) => x.player);
    return { averageOverall: squad?.average_overall ?? 0, top };
  }

  const isCreator = user.id === challenge.creator_id;

  const header = (
    <header className="flex flex-col items-center text-center">
      <span className="font-heading text-3xl leading-none tracking-tight text-charcoal">
        LEN<span className="text-field">DAS</span>
      </span>
      <span className="mt-1 font-sans text-xs font-bold uppercase tracking-[0.25em] text-field-dark">
        Modo Amigos · {tournamentName}
      </span>
      <span className="mt-0.5 font-sans text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
        #{challenge.code}
      </span>
    </header>
  );

  // ----------------------------------------------------------- cancelado
  if (challenge.status === "cancelled") {
    return (
      <Shell>
        {header}
        <p className="mt-10 rounded-xl border border-cta/40 bg-cta/10 px-4 py-6 text-center font-heading text-2xl tracking-wide text-cta">
          Desafio cancelado
        </p>
        <Link
          href="/friends"
          className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 font-heading text-lg tracking-wide text-charcoal hover:bg-charcoal hover:text-paper"
        >
          Voltar ao Modo Amigos
        </Link>
      </Shell>
    );
  }

  // ----------------------------------------------------------- concluído
  if (challenge.status === "completed") {
    const creatorTeam = await loadTeam(challenge.creator_user_squad_id);
    const opponentTeam = await loadTeam(challenge.opponent_user_squad_id);
    const cs = challenge.creator_score ?? 0;
    const os = challenge.opponent_score ?? 0;
    const outcome =
      challenge.winner_user_id === null
        ? "Empate"
        : challenge.winner_user_id === challenge.creator_id
          ? `${creatorName} venceu`
          : `${opponentName} venceu`;

    return (
      <Shell>
        {header}

        <div className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-charcoal/15 bg-field-dark px-6 py-8 text-paper">
          <span className="font-heading text-3xl tracking-wide text-gold">
            {outcome}
          </span>
          <div className="mt-2 flex items-center gap-4 font-heading text-6xl leading-none">
            <span>{cs}</span>
            <span className="text-gold">-</span>
            <span>{os}</span>
          </div>
          <div className="mt-1 flex w-full justify-between px-2 font-sans text-[0.65rem] uppercase tracking-wider text-paper/70">
            <span className="truncate">{creatorName}</span>
            <span className="truncate">{opponentName}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <TeamBlock
            title="Criador"
            name={creatorName}
            team={creatorTeam}
            highlight={challenge.winner_user_id === challenge.creator_id}
          />
          <TeamBlock
            title="Desafiante"
            name={opponentName}
            team={opponentTeam}
            highlight={challenge.winner_user_id === challenge.opponent_id}
          />
        </div>

        <div className="mt-6">
          <ChallengeShareButtons
            path={`/friends/challenge/${code}`}
            shareTitle="Lendas — Desafio entre amigos"
            shareText={`${creatorName} ${cs} x ${os} ${opponentName} no Lendas!`}
          />
        </div>

        <button
          type="button"
          disabled
          className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/20 font-heading text-lg tracking-wide text-muted-foreground"
        >
          Revanche · em breve
        </button>
        <Link
          href="/friends"
          className="mt-3 block text-center font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-charcoal"
        >
          Voltar ao Modo Amigos
        </Link>
      </Shell>
    );
  }

  // ----------------------------------------------------------- aguardando
  if (isCreator) {
    const creatorTeam = await loadTeam(challenge.creator_user_squad_id);
    return (
      <Shell>
        {header}
        <p className="mt-8 rounded-xl border border-field/40 bg-field/10 px-4 py-3 text-center font-heading text-2xl tracking-wide text-field-dark">
          Aguardando adversário
        </p>
        <p className="mt-2 text-center font-sans text-sm text-muted-foreground">
          Compartilhe o link abaixo. Quando alguém aceitar e montar o time, o
          resultado aparece aqui.
        </p>

        <div className="mt-6">
          <ChallengeShareButtons
            path={`/friends/challenge/${code}`}
            shareTitle="Lendas — Desafio entre amigos"
            shareText={`${creatorName} te desafiou no Lendas (${tournamentName})! Monte seu 11.`}
          />
        </div>

        <div className="mt-6">
          <TeamBlock title="Seu time" name={creatorName} team={creatorTeam} />
        </div>
      </Shell>
    );
  }

  // aguardando, visitante (potencial oponente)
  return (
    <Shell>
      {header}
      <p className="mt-8 rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-center font-heading text-2xl tracking-wide text-charcoal">
        Você foi desafiado
      </p>
      <p className="mt-2 text-center font-sans text-sm text-muted-foreground">
        {creatorName} montou um 11 em {tournamentName}. Monte o seu para disputar.
      </p>

      <Link
        href={`/friends/challenge/${code}/join`}
        className="mt-8 flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
      >
        Montar meu time
      </Link>
      <Link
        href="/friends"
        className="mt-3 block text-center font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-charcoal"
      >
        Voltar ao Modo Amigos
      </Link>
    </Shell>
  );
}
