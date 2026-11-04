import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#0c1626",
          color: "#f1ece3",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            width: 320,
            height: 56,
            padding: "0 10px",
            borderRadius: 999,
            background: "#000",
            marginBottom: 56,
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg, #7c5cff, #00d4ff)" }} />
          <div style={{ fontSize: 22, color: "#c9c9d2", fontFamily: "sans-serif" }}>github.com/Sahaj1207</div>
        </div>
        <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: -2 }}>{site.name}</div>
        <div style={{ fontSize: 36, marginTop: 24, color: "#c3c8d2", fontFamily: "sans-serif" }}>
          Software engineer · AI-native apps, desktop tools &amp; mobile
        </div>
        <div style={{ fontSize: 24, marginTop: 40, color: "#8796ad", fontFamily: "sans-serif" }}>
          FLOAT · PIE · VERITY · MotherTongue Books · HARIKA
        </div>
      </div>
    ),
    size,
  );
}
