"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ChallengeShareButtonsProps {
  path: string;
  shareTitle: string;
  shareText: string;
}

export function ChallengeShareButtons({
  path,
  shareTitle,
  shareText,
}: ChallengeShareButtonsProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
      } catch {
        // cancelado
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="truncate rounded-xl border border-charcoal/15 bg-paper px-4 py-3 text-center font-sans text-sm text-charcoal">
        {url || path}
      </div>
      <button
        type="button"
        onClick={handleShare}
        className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
      >
        Compartilhar
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-lg tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
      >
        Copiar link
      </button>
    </div>
  );
}
