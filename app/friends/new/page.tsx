import { redirect } from "next/navigation";
import { TournamentDraftPage } from "@/components/game/TournamentDraftPage";

const VALID = ["world-cup", "brazil-clubs", "europe-legends"];

export default async function NewChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  if (!mode || !VALID.includes(mode)) {
    redirect("/friends");
  }

  return (
    <TournamentDraftPage
      slug={mode!}
      submitUrl="/api/friends/challenges/create"
      submitLabel="Criar desafio"
      loadingLabel="Criando desafio…"
    />
  );
}
