"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface CreateShareButtonProps {
  campaignId: string;
  initialShareId: string | null;
  initialIsPublic: boolean;
}

export function CreateShareButton({
  campaignId,
  initialShareId,
  initialIsPublic,
}: CreateShareButtonProps) {
  const [shareId, setShareId] = useState<string | null>(
    initialIsPublic ? initialShareId : null,
  );
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const shareUrl = shareId ? `${origin}/share/${shareId}` : "";

  async function handleGenerate() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao gerar o link.");
        setLoading(false);
        return;
      }
      setShareId(data.public_share_id);
      toast.success("Link público gerado!");
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setLoading(false);
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
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Lendas", url: shareUrl });
      } catch {
        // cancelado
      }
    } else {
      handleCopy();
    }
  }

  if (!shareId) {
    return (
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="flex h-14 w-full items-center justify-center rounded-xl bg-gold font-heading text-2xl tracking-wide text-charcoal shadow-[0_10px_24px_-10px_rgba(201,162,39,0.8)] transition-transform active:scale-[0.98] disabled:opacity-70"
      >
        {loading ? "Gerando…" : "Gerar link público"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="truncate rounded-xl border border-charcoal/15 bg-paper px-4 py-3 text-center font-sans text-sm text-charcoal">
        {shareUrl || `…/share/${shareId}`}
      </div>
      <button
        type="button"
        onClick={handleShare}
        className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
      >
        Compartilhar campanha
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-12 items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-lg tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
        >
          Copiar link
        </button>
        <Link
          href={`/share/${shareId}`}
          className="flex h-12 items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-lg tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
        >
          Abrir página
        </Link>
      </div>
    </div>
  );
}
