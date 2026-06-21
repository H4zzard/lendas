import { ImageResponse } from "next/og";
import { loadShareCampaign } from "@/lib/share/load-share-campaign";

export const runtime = "nodejs";
export const alt = "Campanha no Lendas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Paleta Lendas
const FIELD_DARK = "#0F3D2E";
const PAPER = "#FFFDF5";
const GOLD = "#C9A227";
const CTA = "#EF3B24";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const share = await loadShareCampaign(shareId);

  // Fallback: imagem padrão de marca
  if (!share) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: FIELD_DARK,
            color: PAPER,
          }}
        >
          <div style={{ display: "flex", fontSize: 140, fontWeight: 800, letterSpacing: -2 }}>
            LEN<span style={{ color: GOLD }}>DAS</span>
          </div>
          <div style={{ display: "flex", fontSize: 36, color: PAPER, opacity: 0.8, marginTop: 12 }}>
            Monte seu 11 histórico
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const d = share.shareData;
  const isChampion = d.statusSeal === "CAMPEÃO";
  const sealBg = isChampion ? GOLD : CTA;
  const sealColor = isChampion ? "#141414" : PAPER;
  const gd = `${d.goalDifference >= 0 ? "+" : ""}${d.goalDifference}`;

  const stats: { label: string; value: string }[] = [
    { label: "VITÓRIAS", value: String(d.wins) },
    { label: "GOLS", value: String(d.goalsFor) },
    { label: "SOFRIDOS", value: String(d.goalsAgainst) },
    { label: "SALDO", value: gd },
    { label: "OVERALL", value: String(d.averageOverall) },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: FIELD_DARK,
          color: PAPER,
          padding: "56px 64px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, letterSpacing: -2 }}>
            LEN<span style={{ color: GOLD }}>DAS</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: sealBg,
              color: sealColor,
              fontSize: 40,
              fontWeight: 800,
              padding: "10px 32px",
              borderRadius: 999,
              letterSpacing: 1,
            }}
          >
            {d.statusSeal}
          </div>
        </div>

        {/* Jogador + resultado */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
          <div style={{ display: "flex", fontSize: 30, color: GOLD, letterSpacing: 4 }}>
            {d.tournamentName.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 800,
              marginTop: 4,
              maxWidth: 1000,
            }}
          >
            {d.playerName}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: PAPER, opacity: 0.85, marginTop: 2 }}>
            {d.resultLabel}
            {d.rankingPosition ? ` · #${d.rankingPosition} no ranking` : ""}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginTop: 30 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 196,
                padding: "18px 0",
                borderRadius: 18,
                border: "1px solid rgba(255,253,245,0.18)",
                backgroundColor: "rgba(255,253,245,0.05)",
              }}
            >
              <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: s.label === "OVERALL" ? GOLD : PAPER }}>
                {s.value}
              </div>
              <div style={{ display: "flex", fontSize: 22, color: PAPER, opacity: 0.6, letterSpacing: 1, marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Top 3 + CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", fontSize: 24, color: GOLD, letterSpacing: 3 }}>
              TRIO DE OURO
            </div>
            {d.topPlayers.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 32 }}>
                <span style={{ display: "flex", color: GOLD, fontWeight: 800, width: 30 }}>
                  {i + 1}
                </span>
                <span style={{ display: "flex", fontWeight: 700 }}>{p.first_name}</span>
                <span style={{ display: "flex", color: PAPER, opacity: 0.6, fontSize: 24 }}>
                  {p.position}
                </span>
                <span style={{ display: "flex", color: PAPER, fontWeight: 800 }}>
                  {p.overall}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: GOLD,
              color: "#141414",
              fontSize: 30,
              fontWeight: 800,
              padding: "16px 30px",
              borderRadius: 16,
              letterSpacing: 1,
            }}
          >
            Monte seu 11 histórico
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
