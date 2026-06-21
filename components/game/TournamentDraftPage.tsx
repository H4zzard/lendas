import Link from "next/link";
import { loadTournamentDraft } from "@/lib/game/load-tournament-draft";
import { WorldCupDraftClient } from "@/components/game/WorldCupDraftClient";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-10">{children}</main>
    </div>
  );
}

function Unavailable({ message }: { message: string }) {
  return (
    <Shell>
      <h1 className="font-heading text-4xl tracking-tight text-charcoal">
        Modo indisponível
      </h1>
      <p className="mt-2 font-sans text-sm text-muted-foreground">{message}</p>
      <Link
        href="/play"
        className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
      >
        ← Voltar
      </Link>
    </Shell>
  );
}

interface TournamentDraftPageProps {
  slug: string;
  submitUrl?: string;
  submitLabel?: string;
  loadingLabel?: string;
}

/** Página de montagem reutilizável por qualquer torneio (campanha ou desafio). */
export async function TournamentDraftPage({
  slug,
  submitUrl,
  submitLabel,
  loadingLabel,
}: TournamentDraftPageProps) {
  const { tournament, squads } = await loadTournamentDraft(slug);

  if (!tournament) {
    return (
      <Unavailable message="Não encontramos o torneio. Verifique se o seed foi aplicado no Supabase." />
    );
  }
  if (squads.length === 0) {
    return (
      <Unavailable message="As seleções e jogadores ainda não foram carregados. Aplique o seed no Supabase." />
    );
  }

  return (
    <Shell>
      <WorldCupDraftClient
        squads={squads}
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        submitUrl={submitUrl}
        submitLabel={submitLabel}
        loadingLabel={loadingLabel}
      />
    </Shell>
  );
}
