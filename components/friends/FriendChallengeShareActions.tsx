"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import type { FriendChallengeCardData } from "@/lib/types";
import { FriendChallengeCard } from "@/components/friends/FriendChallengeCard";

interface FriendChallengeShareActionsProps {
  data: FriendChallengeCardData;
  /** Caminho público do resultado (ex.: /friends/result/abc123). */
  resultPath: string;
}

export function FriendChallengeShareActions({
  data,
  resultPath,
}: FriendChallengeShareActionsProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}${resultPath}`);
  }, [resultPath]);

  async function handleDownload() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0F3D2E",
      });
      const link = document.createElement("a");
      link.download = `lendas-desafio-${data.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Não foi possível gerar a imagem. Use o link.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  async function handleShare() {
    const text = `${data.creator.name} ${data.creatorScore} x ${data.opponentScore} ${data.opponent.name} no Lendas!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Lendas — Desafio", text, url });
      } catch {
        // cancelado
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <FriendChallengeCard ref={cardRef} data={data} />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
        >
          Compartilhar resultado
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-12 items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-lg tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
          >
            Copiar link
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex h-12 items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-lg tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper disabled:opacity-70"
          >
            {downloading ? "Gerando…" : "Baixar card"}
          </button>
        </div>
      </div>
    </div>
  );
}
