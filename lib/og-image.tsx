import { ImageResponse } from "next/og";
import { brandColors } from "@/config/brand";
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
          background: brandColors.canvas,
          color: brandColors.ink,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: brandColors.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {bars.map((height, index) => (
              <div key={index} style={{ width: 7, height: height * 0.6, borderRadius: 4, background: index === 2 ? brandColors.emberGlow : brandColors.surface }} />
            ))}
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.05, maxWidth: 940 }}>
            AI voice agents that talk, understand and take action
          </div>
          <div style={{ fontSize: 30, color: brandColors.inkMuted }}>AI voice agents for real business conversations.</div>
        </div>
      </div>
    ),
    ogSize,
  );
}
