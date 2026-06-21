import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defesa extra além do proxy.
  if (!user) {
    redirect("/login");
  }

  const profile = await ensureProfile(supabase, user);

  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-10 pt-10">
        <Link
          href="/"
          className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-charcoal"
        >
          ← Início
        </Link>

        <header className="mt-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-paper px-3 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-field-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-field" />
            Jogador
          </span>
          <h1 className="font-heading text-5xl leading-none tracking-tight text-charcoal">
            Seu perfil
          </h1>
          <p className="mt-2 font-sans text-sm text-muted-foreground">
            {user.email}
            {joinedAt ? ` · entrou em ${joinedAt}` : ""}
          </p>
        </header>

        {profile ? (
          <ProfileForm
            profileId={profile.id}
            email={user.email ?? ""}
            initialDisplayName={profile.display_name ?? ""}
            initialUsername={profile.username ?? ""}
          />
        ) : (
          <p className="mt-8 rounded-xl border border-cta/40 bg-cta/10 px-4 py-3 font-sans text-sm text-cta">
            Não foi possível carregar seu perfil. Recarregue a página.
          </p>
        )}
      </main>
    </div>
  );
}
