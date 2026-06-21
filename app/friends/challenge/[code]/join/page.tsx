import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FriendChallenge, Tournament } from "@/lib/types";
import { TournamentDraftPage } from "@/components/game/TournamentDraftPage";

function NotFound() {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-10">
        <h1 className="font-heading text-4xl tracking-tight text-charcoal">
          Desafio não encontrado
        </h1>
        <Link
          href="/friends"
          className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
        >
          ← Modo Amigos
        </Link>
      </main>
    </div>
  );
}

export default async function JoinChallengePage({
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
  if (challenge.status !== "waiting" || challenge.creator_id === user.id) {
    redirect(`/friends/challenge/${code}`);
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("slug")
    .eq("id", challenge.tournament_id)
    .maybeSingle<Pick<Tournament, "slug">>();

  if (!tournament) return <NotFound />;

  return (
    <TournamentDraftPage
      slug={tournament.slug}
      submitUrl={`/api/friends/challenges/${code}/join`}
      submitLabel="Enviar time e jogar"
      loadingLabel="Simulando o duelo…"
    />
  );
}
