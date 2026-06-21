"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NextMatchButtonProps {
  campaignId: string;
  label: string;
  variant?: "primary" | "outline";
}

export function NextMatchButton({
  campaignId,
  label,
  variant = "primary",
}: NextMatchButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/next-match`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao avançar a campanha.");
        setLoading(false);
        return;
      }
      router.push(data.redirect_url);
      router.refresh();
    } catch {
      toast.error("Falha de conexão.");
      setLoading(false);
    }
  }

  const base =
    "flex h-14 w-full items-center justify-center rounded-xl font-heading text-2xl tracking-wide transition-transform active:scale-[0.98] disabled:opacity-70";
  const styles =
    variant === "primary"
      ? "bg-cta text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)]"
      : "border-2 border-charcoal/80 bg-transparent text-charcoal hover:bg-charcoal hover:text-paper";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${base} ${styles}`}
    >
      {loading ? "Carregando…" : label}
    </button>
  );
}
