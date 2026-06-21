import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin/is-admin";
import type { FeedbackReport } from "@/lib/types";

const STATUSES = ["new", "read", "in_review", "resolved", "ignored"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

interface PatchBody {
  status?: string;
  priority?: string;
  admin_note?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    update.status = body.status;
    if (body.status === "resolved") {
      update.resolved_at = new Date().toISOString();
      update.resolved_by = user.id;
    } else {
      update.resolved_at = null;
      update.resolved_by = null;
    }
  }

  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: "Prioridade inválida." }, { status: 400 });
    }
    update.priority = body.priority;
  }

  if (body.admin_note !== undefined) {
    update.admin_note = body.admin_note.trim() || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feedback_reports")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle<FeedbackReport>();

  if (error || !data) {
    return NextResponse.json(
      { error: "Não foi possível atualizar o feedback." },
      { status: 500 },
    );
  }

  return NextResponse.json({ feedback: data });
}
