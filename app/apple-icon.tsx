import { ImageResponse } from "next/og";
import { brandColors } from "@/config/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const bars = [28, 72, 104, 56, 22];

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: brandColors.ink,
        }}
      >
        {bars.map((height, index) => (
          <div key={index} style={{ width: 14, height, borderRadius: 8, background: index === 2 ? brandColors.emberGlow : brandColors.surface }} />
        ))}
      </div>
    ),
    size,
  );
}
