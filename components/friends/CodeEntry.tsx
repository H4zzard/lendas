"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CodeEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toLowerCase();
    if (!clean) return;
    router.push(`/friends/challenge/${clean}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Cole o código do desafio"
        className="h-12 flex-1 rounded-xl border border-charcoal/15 bg-paper px-4 font-sans text-base text-charcoal outline-none transition-colors focus:border-field"
      />
      <button
        type="submit"
        className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-charcoal px-5 font-heading text-lg tracking-wide text-paper transition-transform active:scale-[0.98]"
      >
        Entrar
      </button>
    </form>
  );
}
