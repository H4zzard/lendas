import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CampaignRun } from "@/lib/types";

const TERMINAL = ["eliminated", "champion", "completed"];

function generateShareId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function POST(
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

  const { data: campaign } = await supabase
    .from("campaign_runs")
    .select("*")
    .eq("id", id)
    .maybeSingle<CampaignRun>();

  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  }
  if (campaign.user_id !== user.id) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  if (!TERMINAL.includes(campaign.status)) {
    return NextResponse.json(
      { error: "A campanha precisa estar encerrada para compartilhar." },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;

  // Já compartilhada → reutiliza o código existente.
  if (campaign.is_public && campaign.public_share_id) {
    return NextResponse.json({
      public_share_id: campaign.public_share_id,
      share_url: `${origin}/share/${campaign.public_share_id}`,
      campaign_id: id,
    });
  }

  // Gera código curto (reaproveita um já existente se houver).
  let shareId = campaign.public_share_id ?? generateShareId();

  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase
      .from("campaign_runs")
      .update({
        is_public: true,
        public_share_id: shareId,
        shared_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      return NextResponse.json({
        public_share_id: shareId,
        share_url: `${origin}/share/${shareId}`,
        campaign_id: id,
      });
    }

    // 23505 = colisão de unique no public_share_id → tenta outro código.
    if (error.code === "23505") {
      shareId = generateShareId();
      continue;
    }

    return NextResponse.json(
      { error: "Não foi possível gerar o link público." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: "Não foi possível gerar um código único." },
    { status: 500 },
  );
}
