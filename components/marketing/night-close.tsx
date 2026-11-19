import type { ReactNode } from "react";

/**
 * The night ground on its own — the closing scene's dark, with none of its
 * words.
 *
 * <CinematicClose/> cannot be reused where its headline is not wanted: the
 * ivory -> orange -> night sequence is driven by the scroll runway of "Your
 * next enquiry", so taking the headline away takes the effect with it. The
 * product pages want only the ground the homepage's booking form already
 * stands on, which is this.
 *
 * Flat #160E09 and nothing warm laid over it, for the reason
 * <CinematicClose/> gives where it closes the night over the ember: orange at
 * low alpha on this dark reads as maroon. The ember is the headline's moment.
 * Below it the ground is black and orange is left to signal inside the
 * content — which, here, is the accent on the form's own ticks and button.
 *
 * `data-night-close` marks this as one of the dark grounds, as the cinematic
 * scene marks itself. The footer no longer reads that hook — it carries its
 * own ember on every page now — so this is a marker rather than a mechanism.
 *
 * No motion library and no client boundary: the ground is a colour, and
 * whatever rides it brings its own CSS `.reveal` on a view() timeline.
 */
export function NightClose({ children }: { children?: ReactNode }) {
  return (
    <div data-night-close className="bg-[#160e09]">
      {children}
    </div>
  );
}
