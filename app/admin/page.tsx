import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin/is-admin";
import { stageLabel } from "@/lib/game/campaign";
import { FeedbackAdminPanel } from "@/components/admin/FeedbackAdminPanel";
import type {
  CampaignRun,
  FeedbackReport,
  PublicProfile,
  RankingEntry,
} from "@/lib/types";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-grain flex flex-1 flex-col bg-background">
      <main className="shell flex-1 px-5 pb-16 pt-10">{children}</main>
    </div>
  );
}

interface GameEventRow {
  id: string;
  user_id: string | null;
  event_name: string;
  event_data: Record<string, unknown>;
  page_url: string | null;
  created_at: string;
}

function fmt(date: string): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = await isAdmin(supabase);
  if (!admin) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <span className="font-heading text-5xl leading-none tracking-tight text-charcoal">
            LEN<span className="text-field">DAS</span>
          </span>
          <h1 className="mt-8 font-heading text-4xl tracking-wide text-charcoal">
            Acesso restrito
          </h1>
          <p className="mt-2 max-w-xs font-sans text-sm text-muted-foreground">
            Esta área é exclusiva para administradores.
          </p>
          <Link
            href="/"
            className="mt-8 flex h-12 w-full max-w-xs items-center justify-center rounded-xl border-2 border-charcoal/80 bg-transparent font-heading text-xl tracking-wide text-charcoal transition-colors hover:bg-charcoal hover:text-paper"
          >
            Voltar para início
          </Link>
        </div>
      </Shell>
    );
  }

  const since24h = new Date(Date.now() - 86400000).toISOString();
  const head = { count: "exact" as const, head: true };

  const [
    usersRes,
    campaignsRes,
    championsRes,
    matchesRes,
    feedbackRes,
    bugRes,
    sharesRes,
    events24hRes,
  ] = await Promise.all([
    supabase.from("public_profiles").select("id", head),
    supabase.from("campaign_runs").select("id", head),
    supabase.from("campaign_runs").select("id", head).eq("status", "champion"),
    supabase.from("matches").select("id", head),
    supabase.from("feedback_reports").select("id", head),
    supabase.from("feedback_reports").select("id", head).eq("type", "bug"),
    supabase.from("campaign_runs").select("id", head).eq("is_public", true),
    supabase.from("game_events").select("id", head).gte("created_at", since24h),
  ]);

  const usersCount = usersRes.count ?? 0;
  const campaignsCount = campaignsRes.count ?? 0;
  const championsCount = championsRes.count ?? 0;
  const matchesCount = matchesRes.count ?? 0;
  const feedbackCount = feedbackRes.count ?? 0;
  const bugCount = bugRes.count ?? 0;
  const sharesCount = sharesRes.count ?? 0;
  const events24hCount = events24hRes.count ?? 0;

  // Resumo de feedbacks
  const [newRes, openBugsRes, urgentRes, resolvedRes, ideasRes] =
    await Promise.all([
      supabase.from("feedback_reports").select("id", head).eq("status", "new"),
      supabase
        .from("feedback_reports")
        .select("id", head)
        .eq("type", "bug")
        .not("status", "in", '("resolved","ignored")'),
      supabase
        .from("feedback_reports")
        .select("id", head)
        .eq("priority", "urgent"),
      supabase
        .from("feedback_reports")
        .select("id", head)
        .eq("status", "resolved"),
      supabase.from("feedback_reports").select("id", head).eq("type", "idea"),
    ]);

  const feedbackSummary = [
    { label: "Novos", value: newRes.count ?? 0 },
    { label: "Bugs abertos", value: openBugsRes.count ?? 0 },
    { label: "Urgentes", value: urgentRes.count ?? 0 },
    { label: "Resolvidos", value: resolvedRes.count ?? 0 },
    { label: "Ideias", value: ideasRes.count ?? 0 },
  ];

  // Desafios entre amigos
  const [challengesRes, challengesDoneRes, { data: recentChallenges }] =
    await Promise.all([
      supabase.from("friend_challenges").select("id", head),
      supabase
        .from("friend_challenges")
        .select("id", head)
        .eq("status", "completed"),
      supabase
        .from("friend_challenges")
        .select(
          "id, code, status, tournament_id, creator_score, opponent_score, created_at, completed_at",
        )
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<
          {
            id: string;
            code: string;
            status: string;
            tournament_id: string;
            creator_score: number | null;
            opponent_score: number | null;
            created_at: string;
            completed_at: string | null;
          }[]
        >(),
    ]);

  const [
    { data: feedbacks },
    { data: recentEvents },
    { data: eventNames },
    { data: campaigns },
    { data: ranking },
  ] = await Promise.all([
    supabase
      .from("feedback_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<FeedbackReport[]>(),
    supabase
      .from("game_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<GameEventRow[]>(),
    supabase
      .from("game_events")
      .select("event_name")
      .order("created_at", { ascending: false })
      .limit(1000)
      .returns<{ event_name: string }[]>(),
    supabase
      .from("campaign_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<CampaignRun[]>(),
    supabase
      .from("ranking_entries")
      .select("*")
      .returns<RankingEntry[]>(),
  ]);

  // Torneios (id → nome) para rotular campanhas e ranking
  const { data: tournamentsData } = await supabase
    .from("tournaments")
    .select("id, name, slug")
    .returns<{ id: string; name: string; slug: string }[]>();
  const tournamentById = new Map(
    (tournamentsData ?? []).map((t) => [t.id, t]),
  );
  const tournamentLabel = (id: string) =>
    tournamentById.get(id)?.name ?? "—";

  // Nomes (sem e-mail) via public_profiles
  const userIds = new Set<string>();
  for (const f of feedbacks ?? []) if (f.user_id) userIds.add(f.user_id);
  for (const r of ranking ?? []) userIds.add(r.user_id);
  const profileById = new Map<string, PublicProfile>();
  if (userIds.size > 0) {
    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("id, username, display_name")
      .in("id", [...userIds])
      .returns<PublicProfile[]>();
    for (const p of profiles ?? []) profileById.set(p.id, p);
  }
  const nameOf = (id: string | null) => {
    if (!id) return "Anônimo";
    const p = profileById.get(id);
    return p?.display_name?.trim() || p?.username?.trim() || "Jogador";
  };
  const nameById: Record<string, string> = {};
  for (const [pid, p] of profileById) {
    nameById[pid] = p.display_name?.trim() || p.username?.trim() || "Jogador";
  }

  // Agrupamento de eventos por tipo
  const eventCounts = new Map<string, number>();
  for (const e of eventNames ?? []) {
    eventCounts.set(e.event_name, (eventCounts.get(e.event_name) ?? 0) + 1);
  }
  const groupedEvents = [...eventCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Top 10 ranking
  const topRanking = [...(ranking ?? [])]
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const gdA = a.goals_for - a.goals_against;
      const gdB = b.goals_for - b.goals_against;
      if (gdB !== gdA) return gdB - gdA;
      return b.goals_for - a.goals_for;
    })
    .slice(0, 10);

  const summary = [
    { label: "Usuários", value: usersCount },
    { label: "Campanhas", value: campaignsCount },
    { label: "Campeãs", value: championsCount },
    { label: "Partidas", value: matchesCount },
    { label: "Feedbacks", value: feedbackCount },
    { label: "Bugs", value: bugCount },
    { label: "Shares", value: sharesCount },
    { label: "Eventos 24h", value: events24hCount },
  ];

  return (
    <Shell>
      <header className="flex items-center justify-between">
        <div>
          <span className="font-heading text-3xl leading-none tracking-tight text-charcoal">
            LEN<span className="text-field">DAS</span>
          </span>
          <h1 className="font-heading text-4xl leading-none tracking-tight text-charcoal">
            Admin
          </h1>
        </div>
        <Link
          href="/"
          className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-charcoal"
        >
          Início
        </Link>
      </header>

      {/* Resumo */}
      <section className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {summary.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center rounded-xl border border-charcoal/15 bg-field-dark py-3 text-paper"
          >
            <span className="font-heading text-3xl leading-none text-gold">
              {s.value}
            </span>
            <span className="mt-1 font-sans text-[0.55rem] font-bold uppercase tracking-[0.12em] text-paper/70">
              {s.label}
            </span>
          </div>
        ))}
      </section>

      {/* Eventos por tipo */}
      <Section title="Eventos por tipo">
        <div className="flex flex-wrap gap-2">
          {groupedEvents.map(([name, qty]) => (
            <span
              key={name}
              className="rounded-lg border border-charcoal/10 bg-paper px-3 py-1.5 font-sans text-xs text-charcoal"
            >
              {name}
              <span className="ml-2 font-heading text-base text-field">{qty}</span>
            </span>
          ))}
          {groupedEvents.length === 0 && <Empty />}
        </div>
      </Section>

      {/* Feedbacks */}
      <Section title="Feedbacks">
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {feedbackSummary.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-xl border border-charcoal/10 bg-paper py-3"
            >
              <span className="font-heading text-2xl leading-none text-charcoal">
                {s.value}
              </span>
              <span className="mt-1 text-center font-sans text-[0.5rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <FeedbackAdminPanel feedbacks={feedbacks ?? []} nameById={nameById} />
      </Section>

      {/* Campanhas */}
      <Section title="Campanhas recentes">
        <div className="overflow-hidden rounded-xl border border-charcoal/10 bg-paper">
          <div className="grid grid-cols-[1fr_3.5rem_2.5rem_2.5rem] gap-2 border-b border-charcoal/10 px-3 py-2 font-sans text-[0.55rem] font-bold uppercase tracking-wide text-muted-foreground">
            <span>Status · Fase</span>
            <span className="text-center">GP-GS</span>
            <span className="text-center">Rk</span>
            <span className="text-center">Pub</span>
          </div>
          {(campaigns ?? []).map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_3.5rem_2.5rem_2.5rem] items-center gap-2 border-b border-charcoal/5 px-3 py-2 font-sans text-xs text-charcoal"
            >
              <span className="truncate">
                <StatusTag status={c.status} /> · {stageLabel(c.current_stage)}
                <span className="block text-[0.6rem] text-muted-foreground">
                  {tournamentLabel(c.tournament_id)}
                </span>
              </span>
              <span className="text-center">
                {c.goals_for}-{c.goals_against}
              </span>
              <span className="text-center">{c.ranking_applied ? "✓" : "—"}</span>
              <span className="text-center">{c.is_public ? "✓" : "—"}</span>
            </div>
          ))}
          {(campaigns ?? []).length === 0 && <Empty />}
        </div>
      </Section>

      {/* Desafios entre amigos */}
      <Section title="Desafios entre amigos">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center rounded-xl border border-charcoal/10 bg-paper py-3">
            <span className="font-heading text-2xl leading-none text-charcoal">
              {challengesRes.count ?? 0}
            </span>
            <span className="mt-1 font-sans text-[0.55rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Criados
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-charcoal/10 bg-paper py-3">
            <span className="font-heading text-2xl leading-none text-charcoal">
              {challengesDoneRes.count ?? 0}
            </span>
            <span className="mt-1 font-sans text-[0.55rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Concluídos
            </span>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-charcoal/10 bg-paper">
          {(recentChallenges ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 border-b border-charcoal/5 px-3 py-2 font-sans text-xs text-charcoal"
            >
              {c.status === "completed" ? (
                <a
                  href={`/friends/result/${c.code}`}
                  className="font-mono text-[0.65rem] text-field-dark underline"
                >
                  {c.code}
                </a>
              ) : (
                <span className="font-mono text-[0.65rem] text-muted-foreground">
                  {c.code}
                </span>
              )}
              <span className="flex-1 truncate">
                {tournamentLabel(c.tournament_id)}
              </span>
              {c.status === "completed" && (
                <span className="font-heading text-sm text-charcoal/70">
                  {c.creator_score}-{c.opponent_score}
                </span>
              )}
              <StatusTag status={c.status} />
            </div>
          ))}
          {(recentChallenges ?? []).length === 0 && <Empty />}
        </div>
      </Section>

      {/* Top 10 ranking (geral) */}
      <Section title="Top 10 ranking">
        <div className="overflow-hidden rounded-xl border border-charcoal/10 bg-paper">
          <div className="grid grid-cols-[1.4rem_1fr_2rem_2rem_2.5rem] gap-2 border-b border-charcoal/10 px-3 py-2 font-sans text-[0.55rem] font-bold uppercase tracking-wide text-muted-foreground">
            <span>#</span>
            <span>Jogador · Campeonato</span>
            <span className="text-center">V</span>
            <span className="text-center">Tít</span>
            <span className="text-center">OVR</span>
          </div>
          {topRanking.map((r, i) => (
            <div
              key={r.id}
              className="grid grid-cols-[1.4rem_1fr_2rem_2rem_2.5rem] items-center gap-2 border-b border-charcoal/5 px-3 py-2 font-sans text-sm text-charcoal"
            >
              <span className="text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 truncate font-semibold">
                {nameOf(r.user_id)}
                <span className="block text-[0.6rem] font-normal text-muted-foreground">
                  {tournamentLabel(r.tournament_id)}
                </span>
              </span>
              <span className="text-center font-heading text-base">{r.wins}</span>
              <span className="text-center">{r.championships}</span>
              <span className="text-center">{r.best_overall}</span>
            </div>
          ))}
          {topRanking.length === 0 && <Empty />}
        </div>
      </Section>

      {/* Eventos recentes */}
      <Section title="Eventos recentes">
        <ul className="flex flex-col gap-1.5">
          {(recentEvents ?? []).map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-2 rounded-lg border border-charcoal/10 bg-paper px-3 py-1.5"
            >
              <span className="shrink-0 rounded bg-charcoal/10 px-1.5 py-0.5 font-sans text-[0.6rem] font-bold text-charcoal">
                {e.event_name}
              </span>
              <span className="min-w-0 flex-1 truncate font-sans text-[0.65rem] text-muted-foreground">
                {e.page_url ?? ""}{" "}
                {Object.keys(e.event_data ?? {}).length > 0 &&
                  JSON.stringify(e.event_data).slice(0, 50)}
              </span>
              <span className="shrink-0 font-sans text-[0.6rem] text-muted-foreground">
                {fmt(e.created_at)}
              </span>
            </li>
          ))}
          {(recentEvents ?? []).length === 0 && <Empty />}
        </ul>
      </Section>
    </Shell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-heading text-2xl tracking-wide text-charcoal">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "text-field-dark",
    champion: "text-gold",
    eliminated: "text-cta",
    completed: "text-charcoal",
  };
  return <span className={`font-semibold ${map[status] ?? ""}`}>{status}</span>;
}

function Empty() {
  return (
    <p className="px-3 py-4 text-center font-sans text-sm text-muted-foreground">
      Nada por aqui ainda.
    </p>
  );
}
