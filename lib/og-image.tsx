import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const ogSize = { width: 1200, height: 630 };

const bars = [22, 52, 80, 44, 18];

/** Shared social card used for OpenGraph and Twitter previews. */
export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 60%, #dbeafe 100%)",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {bars.map((height, index) => (
              <div key={index} style={{ width: 7, height: height * 0.6, borderRadius: 4, background: "#ffffff" }} />
            ))}
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.05, maxWidth: 940 }}>
            AI voice agents that talk, understand and take action
          </div>
          <div style={{ fontSize: 30, color: "#475569" }}>AI voice agents for real business conversations.</div>
        </div>
      </div>
    ),
    ogSize,
  );
}
