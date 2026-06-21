import type { Metadata } from "next";
import Link from "next/link";
import { loadShareCampaign } from "@/lib/share/load-share-campaign";
import { ShareActions } from "@/components/share/ShareActions";
import { TrackEvent } from "@/components/analytics/TrackEvent";

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
        Campanha não encontrada
      </h1>
      <p className="mt-2 font-sans text-sm text-muted-foreground">
        Este link não existe ou a campanha não está pública.
      </p>
      <Link
        href="/play/world-cup"
        className="mt-6 inline-block font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal underline"
      >
        Montar meu 11 →
      </Link>
    </Shell>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const share = await loadShareCampaign(shareId);

  if (!share) {
    return {
      title: "Lendas",
      description:
        "Monte seu 11 histórico, dispute uma Copa e entre no ranking das lendas.",
    };
  }

  const { shareData, status } = share;
  const name = shareData.playerName;
  const tournament = shareData.tournamentName;

  const title =
    status === "champion"
      ? `Lendas — Campeão de ${tournament}`
      : `Lendas — Campanha de ${name}`;

  const description =
    status === "champion"
      ? `${name} montou um 11 histórico e foi campeão em ${tournament} no Lendas.`
      : `${name} montou seu 11 histórico e ${shareData.resultLabel.toLowerCase()} em ${tournament} no Lendas.`;

  const ogImage = `/share/${shareId}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/share/${shareId}`,
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

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const share = await loadShareCampaign(shareId);

  if (!share) return <NotFound />;

  return (
    <Shell>
      <TrackEvent event="share_page_viewed" data={{ shareId }} />
      <header className="mb-6 text-center">
        <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.3em] text-field-dark">
          Campanha compartilhada
        </span>
      </header>

      <ShareActions data={share.shareData} shareId={shareId} />

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/play/world-cup"
          className="flex h-14 w-full items-center justify-center rounded-xl bg-field font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(31,122,77,0.8)] transition-transform active:scale-[0.98]"
        >
          Jogar agora
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
