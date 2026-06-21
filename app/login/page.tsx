"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "success" | "error";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(searchParams.get("error") ?? "");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(
        "Não foi possível enviar o link mágico. Verifique o e-mail e tente novamente.",
      );
      return;
    }

    setStatus("success");
    setMessage("Enviamos um link mágico para seu e-mail.");
  }

  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-10 pt-10">
        <Link
          href="/"
          className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-charcoal"
        >
          ← Voltar
        </Link>

        <header className="mt-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-paper px-3 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-field-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-cta" />
            Acesso
          </span>
          <h1 className="font-heading text-5xl leading-none tracking-tight text-charcoal">
            Entrar no Lendas
          </h1>
          <p className="mt-2 font-sans text-sm text-muted-foreground">
            Informe seu e-mail e enviaremos um link mágico para você acessar sem
            senha.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
              E-mail
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={status === "loading" || status === "success"}
              placeholder="voce@email.com"
              className="h-12 rounded-xl border border-charcoal/15 bg-paper px-4 font-sans text-base text-charcoal outline-none transition-colors focus:border-field disabled:opacity-60"
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-cta font-heading text-2xl tracking-wide text-paper shadow-[0_10px_24px_-10px_rgba(239,59,36,0.8)] transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {status === "loading" ? "Enviando…" : "Receber link mágico"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-5 rounded-xl border px-4 py-3 font-sans text-sm ${
              status === "success"
                ? "border-field/40 bg-field/10 text-field-dark"
                : "border-cta/40 bg-cta/10 text-cta"
            }`}
            role="status"
          >
            {message}
          </div>
        )}

        {status === "success" && (
          <p className="mt-4 font-sans text-xs text-muted-foreground">
            Não recebeu? Verifique a caixa de spam ou aguarde alguns instantes
            antes de solicitar novamente.
          </p>
        )}
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
