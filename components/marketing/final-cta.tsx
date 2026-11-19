import type { ReactNode } from "react";
import { finalCta } from "@/config/marketing";
import { CinematicClose } from "@/components/marketing/cinematic-close";

/**
 * The designed close, as a scroll-driven scene: ivory and ink, then an ember
 * rising out of the floor, then night — with "could already be on a call."
 * revealed in white only once there is orange behind it to carry it.
 *
 * Anything passed as children rides the same night below the headline, so the
 * close and the booking section read as one surface rather than two blocks.
 *
 * The copy is untouched; this is the staging for it. The scene itself lives in
 * <CinematicClose/> so the same treatment can carry other marketing pages.
 */
export function FinalCta({ children }: { children?: ReactNode }) {
  return (
    <CinematicClose
      line1={finalCta.line1}
      line2={finalCta.line2}
      note={finalCta.note}
      cta={finalCta.cta}
      secondary={finalCta.secondary}
    >
      {children}
    </CinematicClose>
  );
}
