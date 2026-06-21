"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import type { CampaignShareData } from "@/lib/types";
import { ShareCard } from "@/components/share/ShareCard";

interface ShareActionsProps {
  data: CampaignShareData;
  shareId: string;
}

export function ShareActions({ data, shareId }: ShareActionsProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/share/${shareId}`);
  }, [shareId]);

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
      link.download = "lendas-campanha.png";
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Não foi possível gerar a imagem. Use o link para compartilhar.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  async function handleShare() {
    const text = `${data.playerName} — ${data.resultLabel} em Lendas!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Lendas", text, url: shareUrl });
      } catch {
        // usuário cancelou — silencioso
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ShareCard ref={cardRef} data={data} />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
        >
          Compartilhar
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
