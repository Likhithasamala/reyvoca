import { ImageResponse } from "next/og";
import { brandColors } from "@/config/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The mark: five bars of a voice, symmetrical, the centre one in ember. */
const bars = [
  { height: 28, width: 15 },
  { height: 73, width: 17 },
  { height: 108, width: 17 },
  { height: 72, width: 17 },
  { height: 29, width: 15 },
];

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
          gap: 9,
          background: brandColors.ink,
        }}
      >
        {bars.map((bar, index) => (
          <div
            key={index}
            style={{
              width: bar.width,
              height: bar.height,
              borderRadius: bar.width / 2,
              background: index === 2 ? brandColors.emberGlow : brandColors.surface,
            }}
          />
        ))}
      </div>
    ),
    size,
  );
}
