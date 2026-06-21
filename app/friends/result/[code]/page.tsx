import type { Metadata } from "next";
import Link from "next/link";
import {
  buildFriendCardData,
  loadCompletedFriendChallengePublic,
} from "@/lib/friends/load-friend-challenge";
import { FriendChallengeShareActions } from "@/components/friends/FriendChallengeShareActions";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-12 pt-10">{children}</main>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const loaded = await loadCompletedFriendChallengePublic(code);

  if (!loaded) {
    return {
      title: "Lendas",
      description:
        "Monte seu 11 histórico, dispute uma Copa e desafie amigos no Lendas.",
    };
  }

  const title = `Lendas — ${loaded.creatorName} x ${loaded.opponentName}`;
  const description = `${loaded.creatorName} desafiou ${loaded.opponentName} no modo amigos do Lendas. Veja o resultado.`;
  const ogImage = `/friends/result/${code}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/friends/result/${code}`,
      siteName: "Lendas",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function FriendResultPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const loaded = await loadCompletedFriendChallengePublic(code);

  if (!loaded) {
    return (
      <Shell>
        <h1 className="font-heading text-4xl tracking-tight text-charcoal">
          Resultado não encontrado
        </h1>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          Este desafio não existe ou ainda não foi disputado.
        </p>
        <Link
          href="/friends"
          className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
        >
          Modo Amigos →
        </Link>
      </Shell>
    );
  }

  const data = buildFriendCardData(loaded);

  return (
    <Shell>
      <header className="mb-6 text-center">
        <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.3em] text-field-dark">
          Desafio compartilhado
        </span>
      </header>

      <FriendChallengeShareActions
        data={data}
        resultPath={`/friends/result/${code}`}
      />

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/friends"
          className="flex h-14 w-full items-center justify-center rounded-xl bg-field font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(31,122,77,0.8)] transition-transform active:scale-[0.98]"
        >
          Jogar também
        </Link>
        <Link
          href="/ranking"
          className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-xl tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
        >
          Ver ranking
        </Link>
      </div>
    </Shell>
  );
}
