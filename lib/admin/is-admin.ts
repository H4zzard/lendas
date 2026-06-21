import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifica, server-side, se o usuário autenticado é admin (está em app_admins).
 * Usa a policy "app_admins_select_own": o usuário só consegue ler a própria
 * linha, então um resultado significa que ele é admin. Retorna false em erro.
 */
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return Boolean(data);
}
