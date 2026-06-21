import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

/**
 * Gera um username a partir da parte antes do @ do e-mail, em minúsculas e
 * removendo caracteres inválidos. Mantém apenas letras, números e underscore.
 */
function sanitizeUsername(email: string | undefined | null): string {
  const local = (email ?? "").split("@")[0].toLowerCase();
  const cleaned = local.replace(/[^a-z0-9_]/g, "");
  return cleaned || "jogador";
}

/**
 * Garante que existe um profile para o usuário autenticado.
 * - Se já existir, retorna o profile sem duplicar.
 * - Se não existir, cria com id/email/username/display_name derivados do e-mail.
 *
 * Recebe um client Supabase já autenticado como o próprio usuário, de modo que
 * as políticas de RLS (insert/select do próprio profile) sejam respeitadas.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<Profile | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return existing as Profile;
  }

  const displayName = (user.email ?? "").split("@")[0] || "Jogador";
  const baseUsername = sanitizeUsername(user.email);
  let username = baseUsername;

  // Tenta inserir; em caso de colisão de username (unique), tenta com sufixo.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? null,
        username,
        display_name: displayName,
      })
      .select("*")
      .single();

    if (!error) {
      return data as Profile;
    }

    // 23505 = unique_violation (username já em uso)
    if (error.code === "23505") {
      username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
      continue;
    }

    // Outro erro: interrompe e cai no fallback abaixo.
    break;
  }

  // Fallback: pode ter sido criado em paralelo (ex.: callback + página).
  const { data: fallback } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (fallback as Profile) ?? null;
}
