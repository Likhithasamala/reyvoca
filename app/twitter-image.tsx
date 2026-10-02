import { ogSize, renderOgImage } from "@/lib/og-image";

export const alt = "Reyvoca — AI voice agents for modern businesses";
export const size = ogSize;
export const contentType = "image/png";

export default function TwitterImage() {
  return renderOgImage();
}
