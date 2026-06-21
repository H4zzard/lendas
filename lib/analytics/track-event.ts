import { createClient } from "@/lib/supabase/client";

/**
 * Registra um evento de uso em game_events. Client-side.
 * Falha silenciosamente: nunca deve quebrar a UX. Só registra para usuários
 * autenticados (a RLS exige auth.uid() = user_id).
 */
export async function trackEvent(
  eventName: string,
  eventData: Record<string, unknown> = {},
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("game_events").insert({
      user_id: user.id,
      event_name: eventName,
      event_data: eventData,
      page_url: typeof window !== "undefined" ? window.location.pathname : null,
    });
  } catch {
    // silencioso por design
  }
}
