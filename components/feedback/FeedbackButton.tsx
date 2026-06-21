"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/track-event";

type FeedbackType = "feedback" | "bug" | "idea";

const TYPES: { id: FeedbackType; label: string }[] = [
  { id: "feedback", label: "Feedback" },
  { id: "bug", label: "Bug" },
  { id: "idea", label: "Ideia" },
];

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Não atrapalhar a simulação da partida.
  if (pathname?.startsWith("/match/")) return null;

  async function handleSend() {
    if (!message.trim() || sending) return;
    setSending(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("feedback_reports").insert({
        user_id: user?.id ?? null,
        type,
        message: message.trim(),
        page_url: typeof window !== "undefined" ? window.location.pathname : null,
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      });

      if (error) {
        toast.error(
          user
            ? "Não foi possível enviar agora. Tente novamente."
            : "Entre no jogo para enviar feedback.",
        );
        setSending(false);
        return;
      }

      trackEvent("feedback_sent", { type });
      toast.success("Feedback enviado. Obrigado.");
      setMessage("");
      setOpen(false);
    } catch {
      toast.error("Não foi possível enviar agora. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full border border-charcoal/20 bg-paper px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider text-charcoal shadow-md transition-colors hover:bg-charcoal hover:text-paper"
      >
        Feedback
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/60 p-3 sm:items-center"
            onClick={() => !sending && setOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] overflow-hidden rounded-2xl border border-charcoal/15 bg-background"
            >
              <div className="border-b border-charcoal/10 bg-field-dark px-5 py-4 text-paper">
                <h2 className="font-heading text-3xl leading-none tracking-wide">
                  Conte para a gente
                </h2>
                <p className="mt-1 font-sans text-sm text-paper/80">
                  Sua opinião ajuda o Lendas a melhorar.
                </p>
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`rounded-lg border px-2 py-2 font-sans text-xs font-bold uppercase tracking-wider transition-colors ${
                        type === t.id
                          ? "border-field bg-field text-paper"
                          : "border-charcoal/15 bg-paper text-charcoal"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="O que você achou? O que podemos melhorar?"
                  className="resize-none rounded-xl border border-charcoal/15 bg-paper px-4 py-3 font-sans text-sm text-charcoal outline-none transition-colors focus:border-field"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={sending}
                    className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-charcoal/30 bg-transparent font-heading text-lg tracking-wide text-charcoal transition-colors hover:border-charcoal/80 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    className="flex h-12 flex-[1.4] items-center justify-center rounded-xl bg-cta font-heading text-lg tracking-wide text-paper transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {sending ? "Enviando…" : "Enviar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
