"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Traduz erros do Supabase para mensagens claras. Em desenvolvimento mostra a
 * mensagem real para facilitar o debug; em produção usa textos amigáveis.
 */
function translateAuthError(error: { message?: string; status?: number }): string {
  const raw = error.message ?? "";
  const lower = raw.toLowerCase();

  if (
    error.status === 429 ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return "Aguarde alguns minutos antes de pedir outro link.";
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return "Digite um e-mail válido.";
  }
  if (lower.includes("redirect")) {
    return "Erro de redirecionamento. Tente novamente.";
  }

  if (process.env.NODE_ENV === "development" && raw) {
    return raw;
  }
  return "Não foi possível enviar o link mágico agora.";
}

/** Mensagem para erros vindos do callback via ?error=. */
function messageFromQuery(error: string | null): string {
  if (!error) return "";
  if (error === "callback_failed") {
    return "Erro ao concluir o login. Solicite um novo link mágico e abra-o neste navegador.";
  }
  return error;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(() =>
    messageFromQuery(searchParams.get("error")),
  );
  const [checking, setChecking] = useState(false);
  const [checkNote, setCheckNote] = useState("");

  // Se já estiver logado, vai direto para o jogo.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/play/world-cup");
      }
    });
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");
    setCheckNote("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(translateAuthError(error));
      return;
    }

    setStatus("success");
    setMessage(
      "Enviamos o link mágico. Abra o e-mail neste mesmo navegador ou copie o link e cole aqui.",
    );
  }

  async function handleVerify() {
    setChecking(true);
    setCheckNote("");
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      router.replace("/profile");
      return;
    }
    setChecking(false);
    setCheckNote(
      "Ainda não encontramos sua sessão. Confira se abriu o link no mesmo navegador.",
    );
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

        {/* Orientação importante sobre o mesmo navegador */}
        <p className="mt-5 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 font-sans text-sm text-charcoal">
          Abra o link mágico no mesmo navegador em que você pediu o acesso.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={checking}
              className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-lg tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper disabled:opacity-70"
            >
              {checking ? "Verificando…" : "Já cliquei no link, verificar login"}
            </button>

            {checkNote && (
              <p className="rounded-xl border border-cta/40 bg-cta/10 px-4 py-3 font-sans text-sm text-cta">
                {checkNote}
              </p>
            )}

            <p className="font-sans text-xs text-muted-foreground">
              Não recebeu? Verifique a caixa de spam ou aguarde alguns instantes
              antes de solicitar novamente.
            </p>
          </div>
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
