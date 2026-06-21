"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "saving" | "success" | "error";

interface ProfileFormProps {
  profileId: string;
  email: string;
  initialDisplayName: string;
  initialUsername: string;
}

export function ProfileForm({
  profileId,
  email,
  initialDisplayName,
  initialUsername,
}: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        username: cleanUsername || null,
      })
      .eq("id", profileId);

    if (error) {
      setStatus("error");
      setMessage(
        error.code === "23505"
          ? "Esse nome de usuário já está em uso."
          : "Não foi possível salvar. Tente novamente.",
      );
      return;
    }

    setUsername(cleanUsername);
    setStatus("success");
    setMessage("Perfil atualizado!");
    router.refresh();
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
            E-mail
          </span>
          <input
            type="email"
            value={email}
            disabled
            className="h-12 rounded-xl border border-charcoal/15 bg-muted px-4 font-sans text-base text-muted-foreground"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
            Nome de exibição
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Como você quer ser chamado"
            maxLength={40}
            className="h-12 rounded-xl border border-charcoal/15 bg-paper px-4 font-sans text-base text-charcoal outline-none transition-colors focus:border-field"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
            Nome de usuário
          </span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="apelido_unico"
            maxLength={24}
            className="h-12 rounded-xl border border-charcoal/15 bg-paper px-4 font-sans text-base text-charcoal outline-none transition-colors focus:border-field"
          />
          <span className="font-sans text-[0.7rem] text-muted-foreground">
            Apenas letras minúsculas, números e underscore.
          </span>
        </label>

        <button
          type="submit"
          disabled={status === "saving"}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-charcoal font-heading text-xl tracking-wide text-paper transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {status === "saving" ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 font-sans text-sm ${
            status === "success"
              ? "border-field/40 bg-field/10 text-field-dark"
              : "border-cta/40 bg-cta/10 text-cta"
          }`}
          role="status"
        >
          {message}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-charcoal/15 pt-6">
        <Link
          href="/play"
          className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98]"
        >
          Jogar agora
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-xl tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper disabled:opacity-70"
        >
          {loggingOut ? "Saindo…" : "Sair"}
        </button>
      </div>
    </div>
  );
}
