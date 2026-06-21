"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  FeedbackPriority,
  FeedbackReport,
  FeedbackStatus,
} from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  feedback: "Feedback",
  bug: "Bug",
  idea: "Ideia",
};
const STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  read: "Lido",
  in_review: "Em análise",
  resolved: "Resolvido",
  ignored: "Ignorado",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as FeedbackStatus[];
const PRIORITY_OPTIONS = Object.keys(PRIORITY_LABELS) as FeedbackPriority[];

function fmt(date: string): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FilterRow({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-lg border px-2.5 py-1 font-sans text-[0.7rem] font-bold uppercase tracking-wide transition-colors ${
            value === o.id
              ? "border-field bg-field text-paper"
              : "border-charcoal/15 bg-paper text-charcoal"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FeedbackItem({
  feedback,
  authorName,
}: {
  feedback: FeedbackReport;
  authorName: string;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status);
  const [priority, setPriority] = useState<FeedbackPriority>(feedback.priority);
  const [note, setNote] = useState(feedback.admin_note ?? "");
  const [resolvedAt, setResolvedAt] = useState(feedback.resolved_at);
  const [saving, setSaving] = useState(false);

  const dirty =
    status !== feedback.status ||
    priority !== feedback.priority ||
    (note.trim() || null) !== (feedback.admin_note ?? null);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority, admin_note: note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao atualizar.");
        return;
      }
      feedback.status = data.feedback.status;
      feedback.priority = data.feedback.priority;
      feedback.admin_note = data.feedback.admin_note;
      feedback.resolved_at = data.feedback.resolved_at;
      setResolvedAt(data.feedback.resolved_at);
      toast.success("Feedback atualizado.");
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setSaving(false);
    }
  }

  const priorityColor =
    priority === "urgent"
      ? "border-cta text-cta"
      : priority === "high"
        ? "border-gold text-charcoal"
        : "border-charcoal/15 text-charcoal";

  return (
    <li className="rounded-xl border border-charcoal/10 bg-paper p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-wide ${
            feedback.type === "bug"
              ? "bg-cta/15 text-cta"
              : feedback.type === "idea"
                ? "bg-gold/20 text-charcoal"
                : "bg-field/15 text-field-dark"
          }`}
        >
          {TYPE_LABELS[feedback.type] ?? feedback.type}
        </span>
        <span className="font-sans text-[0.65rem] text-muted-foreground">
          {authorName} · {fmt(feedback.created_at)}
        </span>
      </div>

      <p className="mt-2 font-sans text-sm text-charcoal">{feedback.message}</p>
      {feedback.page_url && (
        <p className="mt-1 font-sans text-[0.65rem] text-muted-foreground">
          {feedback.page_url}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground">
            Status
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
            className="h-9 rounded-lg border border-charcoal/15 bg-background px-2 font-sans text-sm text-charcoal outline-none focus:border-field"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground">
            Prioridade
          </span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
            className={`h-9 rounded-lg border bg-background px-2 font-sans text-sm outline-none focus:border-field ${priorityColor}`}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Nota interna (visível só para admins)"
        className="mt-2 w-full resize-none rounded-lg border border-charcoal/15 bg-background px-3 py-2 font-sans text-sm text-charcoal outline-none focus:border-field"
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="font-sans text-[0.65rem] text-muted-foreground">
          {resolvedAt ? `Resolvido em ${fmt(resolvedAt)}` : ""}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="rounded-lg bg-charcoal px-4 py-1.5 font-heading text-sm tracking-wide text-paper transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </li>
  );
}

interface FeedbackAdminPanelProps {
  feedbacks: FeedbackReport[];
  nameById: Record<string, string>;
}

export function FeedbackAdminPanel({
  feedbacks,
  nameById,
}: FeedbackAdminPanelProps) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return feedbacks.filter((f) => {
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (priorityFilter !== "all" && f.priority !== priorityFilter) return false;
      if (q && !f.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [feedbacks, typeFilter, statusFilter, priorityFilter, search]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-xl border border-charcoal/10 bg-paper p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar na mensagem…"
          className="h-9 rounded-lg border border-charcoal/15 bg-background px-3 font-sans text-sm text-charcoal outline-none focus:border-field"
        />
        <FilterRow
          options={[
            { id: "all", label: "Todos" },
            { id: "feedback", label: "Feedback" },
            { id: "bug", label: "Bug" },
            { id: "idea", label: "Ideia" },
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <FilterRow
          options={[
            { id: "all", label: "Status" },
            ...STATUS_OPTIONS.map((s) => ({ id: s, label: STATUS_LABELS[s] })),
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterRow
          options={[
            { id: "all", label: "Prioridade" },
            ...PRIORITY_OPTIONS.map((p) => ({ id: p, label: PRIORITY_LABELS[p] })),
          ]}
          value={priorityFilter}
          onChange={setPriorityFilter}
        />
      </div>

      <p className="font-sans text-xs text-muted-foreground">
        {filtered.length} de {feedbacks.length} feedbacks
      </p>

      <ul className="flex flex-col gap-2">
        {filtered.map((f) => (
          <FeedbackItem
            key={f.id}
            feedback={f}
            authorName={f.user_id ? (nameById[f.user_id] ?? "Jogador") : "Anônimo"}
          />
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-charcoal/10 bg-paper px-3 py-6 text-center font-sans text-sm text-muted-foreground">
            Nenhum feedback com esses filtros.
          </li>
        )}
      </ul>
    </div>
  );
}
