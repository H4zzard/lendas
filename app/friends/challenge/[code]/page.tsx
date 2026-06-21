import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  buildFriendCardData,
  loadFriendChallengeByCode,
  type TeamSummary,
} from "@/lib/friends/load-friend-challenge";
import { ChallengeShareButtons } from "@/components/friends/ChallengeShareButtons";
import { FriendChallengeShareActions } from "@/components/friends/FriendChallengeShareActions";

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

function TeamBlock({
  title,
  name,
  team,
}: {
  title: string;
  name: string;
  team: TeamSummary | null;
}) {
  return (
    <div className="rounded-xl border border-charcoal/10 bg-paper p-3">
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

  const loaded = await loadFriendChallengeByCode(supabase, code);
  if (!loaded) return <NotFound />;

  const { challenge, tournamentName, creatorName, creatorTeam } = loaded;
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
    const cardData = buildFriendCardData(loaded);
    return (
      <Shell>
        {header}
        <div className="mt-6">
          <FriendChallengeShareActions
            data={cardData}
            resultPath={`/friends/result/${code}`}
          />
        </div>
        <Link
          href={`/friends/result/${code}`}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border-2 border-field bg-field/10 font-heading text-lg tracking-wide text-field-dark transition-colors hover:bg-field hover:text-paper"
        >
          Abrir resultado público
        </Link>
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

  // ----------------------------------------------------------- aguardando (criador)
  if (isCreator) {
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

  // ----------------------------------------------------------- aguardando (visitante)
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
