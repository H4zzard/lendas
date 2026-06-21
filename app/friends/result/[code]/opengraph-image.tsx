import { ImageResponse } from "next/og";
import {
  buildFriendCardData,
  loadCompletedFriendChallengePublic,
} from "@/lib/friends/load-friend-challenge";

export const runtime = "nodejs";
export const alt = "Desafio entre amigos no Lendas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FIELD_DARK = "#0F3D2E";
const PAPER = "#FFFDF5";
const GOLD = "#C9A227";

export default async function FriendResultOG({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const loaded = await loadCompletedFriendChallengePublic(code);

  if (!loaded) {
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
          <div style={{ display: "flex", fontSize: 36, opacity: 0.8, marginTop: 12 }}>
            Desafie um amigo
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const d = buildFriendCardData(loaded);

  const TeamCol = (
    team: typeof d.creator,
    win: boolean,
    align: "flex-start" | "flex-end",
  ) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        alignItems: align,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 52,
          fontWeight: 800,
          color: win ? GOLD : PAPER,
        }}
      >
        {team.name}
      </div>
      <div style={{ display: "flex", fontSize: 24, color: PAPER, opacity: 0.6, marginTop: 6 }}>
        OVR {team.averageOverall}
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 14, alignItems: align }}>
        {team.topPlayers.map((p, i) => (
          <div key={i} style={{ display: "flex", fontSize: 28, color: PAPER, opacity: 0.85 }}>
            {p.first_name}
          </div>
        ))}
      </div>
    </div>
  );

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
            LEN<span style={{ color: GOLD }}>DAS</span>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: GOLD, letterSpacing: 3 }}>
            DESAFIO · {d.tournamentName.toUpperCase()}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            marginTop: 24,
          }}
        >
          <div style={{ display: "flex", fontSize: 150, fontWeight: 800 }}>
            {d.creatorScore}
          </div>
          <div style={{ display: "flex", fontSize: 90, color: GOLD }}>×</div>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 800 }}>
            {d.opponentScore}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignSelf: "center",
            backgroundColor: GOLD,
            color: "#141414",
            fontSize: 36,
            fontWeight: 800,
            padding: "10px 36px",
            borderRadius: 999,
          }}
        >
          {d.resultLabel}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            alignItems: "flex-end",
            gap: 24,
          }}
        >
          {TeamCol(d.creator, d.winner === "creator", "flex-start")}
          <div style={{ display: "flex", fontSize: 28, color: PAPER, opacity: 0.4, paddingBottom: 10 }}>
            VS
          </div>
          {TeamCol(d.opponent, d.winner === "opponent", "flex-end")}
        </div>
      </div>
    ),
    { ...size },
  );
}
