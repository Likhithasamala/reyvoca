"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useReduced } from "./opening";

const EASE = [0.16, 1, 0.3, 1] as const;

type Note = { id: string; time: string; text: string; sub: string };

/** Nine at night, nobody free: the enquiries pile up where no one sees them. */
const DARK_NOTES: Note[] = [
  { id: "missed", time: "21:04", text: "Missed call", sub: "Nobody free to pick it up." },
  { id: "dm", time: "18:30", text: "3 unread DMs", sub: "Still unread at closing time." },
  { id: "ask", time: "21:10", text: "“Any update on the Harper St lead?”", sub: "Nobody can answer him." },
];

/** The switch is on: the same evening, handled. */
const LIT_NOTES: Note[] = [
  { id: "missed", time: "21:04", text: "Called back in 6 seconds", sub: "While the enquiry was still warm." },
  { id: "dm", time: "21:05", text: "3 DMs answered", sub: "All three handled on the phone." },
  { id: "ask", time: "21:06", text: "“Viewing booked, Saturday 11.”", sub: "Filed to the workspace." },
];

/**
 * Where each note is pinned on the picture once the room is wide enough to be
 * written on: beside the thing it belongs to — the phone that rang, the screen
 * nobody updated, the manager asking. The percentages are worked back from the
 * drawing's own 960×540 grid at the aspect the frame takes from `lg` (2/1,
 * which crops 30 units off the top and the bottom), so each note holds its
 * spot in the room at every width rather than drifting across it. Narrower
 * than that the room cannot carry them and they bank up along its foot.
 */
const SPOTS: Record<string, string> = {
  // Over the desk, just above the phone.
  missed: "lg:absolute lg:top-[51%] lg:left-[7.3%] lg:w-[18.5%]",
  // In the clear air above the monitor.
  dm: "lg:absolute lg:top-[12.5%] lg:left-[49%] lg:w-[18.5%]",
  // Over the manager's head, where the question comes from.
  ask: "lg:absolute lg:top-[12.5%] lg:right-[10.4%] lg:w-[18.5%]",
};

/**
 * The argument, as one picture with a switch on it.
 *
 * Off: a real evening in a small business — the phone rings into an empty
 * room, the messages stack up, and the person who has to answer for them has
 * nothing to say. On: the same evening with Reyvoca on the line. Nothing here
 * is a stock photograph; the room is drawn, and the switch is yours to flip.
 */
export function Lights() {
  const reduced = useReduced();
  const [on, setOn] = useState(false);
  const [touched, setTouched] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  // The picture opens as you come down to it: small while it is still a thing
  // in the distance, full size by the time its top reaches the top of the
  // screen. The whole height of the viewport is the travel, so the growth is
  // something you watch happen rather than something that is already over.
  const { scrollYProgress } = useScroll({ target: shellRef, offset: ["start end", "start start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);

  // The payoff shows itself once, shortly after the frame is on screen. After
  // that the switch belongs to the visitor.
  useEffect(() => {
    const node = frameRef.current;
    if (!node || touched || reduced) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          timer = setTimeout(() => setOn(true), 2600);
          observer.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [touched, reduced]);

  const notes = on ? LIT_NOTES : DARK_NOTES;

  const flip = () => {
    setTouched(true);
    setOn((value) => !value);
  };

  return (
    <section
      id="lights"
      aria-label="The same evening, with Reyvoca on the line and without it"
      className="lights-ground relative isolate overflow-hidden pb-24 lg:pb-32"
    >
      {/* The seam: cream burning down through ember into the night. Its top
          padding comes from .lights-ground, derived from the band's length, so
          the ramp finishes before the picture starts. */}
      <div aria-hidden="true" className="stage-grain absolute inset-0 z-[2]" />

      <div ref={shellRef} className="relative z-[3] mt-2 w-full px-5 sm:px-8">
        <motion.div
          style={reduced ? undefined : { scale, transformOrigin: "center center", willChange: "transform" }}
          className="scene-frame mx-auto max-w-[68rem] rounded-[1.5rem] p-2"
        >
          <div
            ref={frameRef}
            className="relative aspect-[4/3] overflow-hidden rounded-[1.125rem] bg-night sm:aspect-[16/10] lg:aspect-[2/1]"
          >
            <OfficeScene on={on} />

            {/* Everything the evening amounts to is written on the picture
                itself: the count down on the desk, each note beside whoever
                it belongs to, and the switch that changes all of them. */}
            <div className="absolute top-0 right-0 z-[2] p-3 lg:top-auto lg:bottom-0 lg:p-5">
              <Switch on={on} onFlip={flip} />
            </div>

            {/* Until the room is wide enough to be written on, the same text
                banks up over a scrim along the foot of the picture: one
                column on a phone, the three notes side by side above it. */}
            <div className="absolute inset-x-0 bottom-0 z-[1] flex flex-col gap-2 bg-gradient-to-t from-night via-night/85 to-transparent px-3.5 pt-16 pb-3.5 sm:gap-3 sm:px-5 sm:pt-20 sm:pb-5 lg:contents">
              <Tally on={on} />

              <ul className="grid gap-1.5 sm:grid-cols-3 sm:gap-5 lg:contents">
                <AnimatePresence initial={false} mode="popLayout">
                  {notes.map((note, index) => (
                    <motion.li
                      key={`${on ? "on" : "off"}-${note.id}`}
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.45, delay: reduced ? 0 : index * 0.07, ease: EASE }}
                      className={cn(
                        "min-w-0 lg:rounded-xl lg:bg-night/85 lg:p-3",
                        SPOTS[note.id],
                      )}
                    >
                      <Note note={note} on={on} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* The night lets go again before the plans */}
      <div
        aria-hidden="true"
        className="lights-close absolute inset-x-0 bottom-0 z-[2] h-20 lg:h-24"
      />
    </section>
  );
}

/**
 * The count, which is the whole argument in six words. It sits on the front
 * of the desk, the one broad empty surface in the room, opposite the switch.
 */
function Tally({ on: lit }: { on: boolean }) {
  return (
    <div
      aria-live="polite"
      className="min-w-0 lg:absolute lg:bottom-[4%] lg:left-[3%] lg:max-w-[40%]"
    >
      <p
        className={cn(
          "text-[clamp(1rem,1.6vw,1.3125rem)] leading-tight font-semibold tracking-[-0.012em] transition-colors duration-700",
          lit ? "text-white" : "text-accent-glow",
        )}
      >
        {lit ? "9 enquiries · 9 called back" : "9 enquiries · 0 called back"}
      </p>
      <p
        className={cn(
          "mt-1 hidden max-w-[44ch] text-[0.875rem] leading-snug transition-colors duration-700 sm:block lg:text-[0.9375rem]",
          lit ? "text-night-text" : "text-night-muted",
        )}
      >
        {lit
          ? "Every one answered, qualified and booked in — and the team got a note about each."
          : "The phone rang after hours. By morning the interest has cooled."}
      </p>
    </div>
  );
}

/**
 * One note, pinned beside whoever it belongs to. Narrow screens get the time
 * and the headline on one line; the frame is only big enough to carry the
 * second line once there is room for the note to become a card on the wall.
 */
function Note({ note, on }: { note: Note; on: boolean }) {
  return (
    <>
      <p className="flex items-baseline gap-2 sm:block">
        <span
          className={cn(
            "shrink-0 text-[0.75rem] tabular-nums transition-colors lg:text-[0.8125rem]",
            on ? "text-accent-glow" : "text-night-muted",
          )}
        >
          {note.time}
        </span>
        <span className="min-w-0 text-[0.875rem] leading-snug font-medium text-white sm:mt-1 sm:block sm:text-[0.9375rem]">
          {note.text}
        </span>
      </p>
      <p className="mt-0.5 hidden text-[0.875rem] leading-snug text-night-text sm:block">{note.sub}</p>
    </>
  );
}

/** The switch itself: a rocker you can actually flip. */
function Switch({ on, onFlip, light = false }: { on: boolean; onFlip: () => void; light?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onFlip}
      className={cn(
        "inline-flex shrink-0 items-center gap-3 rounded-full py-2 pr-4 pl-2 transition-colors",
        light
          ? on
            ? "bg-ink text-white"
            : "bg-surface-muted text-ink-muted hover:text-ink"
          : on
            ? "bg-white text-ink"
            : "bg-night-raised text-night-text hover:text-white",
      )}
    >
      <span
        className={cn(
          "relative grid h-9 w-7 place-items-start rounded-md p-1 transition-colors",
          on ? "bg-accent/25" : light ? "bg-line" : "bg-night",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-4 w-5 rounded-[3px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            on ? "translate-y-0 bg-accent" : light ? "translate-y-3 bg-line-strong" : "translate-y-3 bg-night-line",
          )}
        />
      </span>
      <span className="text-[1rem] font-semibold whitespace-nowrap">Reyvoca {on ? "on" : "off"}</span>
    </button>
  );
}

/**
 * The room, drawn.
 *
 * It is one close shot rather than a wide one, so the two people in it read
 * as people: the woman who has been on the phone all evening, and the manager
 * who only ever sees the number at the end of the week. Everything that
 * changes between the two states is an opacity or a transform on a group —
 * their faces included — so flipping the switch is one continuous movement
 * rather than two pictures swapping.
 */
function OfficeScene({ on }: { on: boolean }) {
  const skin = "#d9b89a";
  const skinShade = "#c49b78";
  const hair = "#2b221d";

  return (
    <svg
      viewBox="0 0 960 540"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 size-full"
    >
      <defs>
        <linearGradient id="lightCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2895c" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#e4501c" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#e4501c" stopOpacity="0" />
        </linearGradient>
        <filter id="soften" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <radialGradient id="bulb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd2b8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#e4501c" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Room */}
      <rect width="960" height="540" fill="#1c1714" />
      <rect y="300" width="960" height="240" fill="#171310" />

      {/* Window onto the evening */}
      <g opacity="0.9">
        <rect x="46" y="96" width="170" height="150" rx="8" fill="#241f1a" />
        <rect x="58" y="108" width="146" height="126" rx="4" fill="#0e0c0b" />
        <rect x="124" y="108" width="4" height="126" fill="#241f1a" />
        <rect x="58" y="168" width="146" height="4" fill="#241f1a" />
        <circle cx="86" cy="134" r="2" fill="#d6d0c7" opacity="0.5" />
        <circle cx="174" cy="146" r="1.6" fill="#d6d0c7" opacity="0.35" />
      </g>

      {/* Clock: a little after nine */}
      <g>
        <circle cx="898" cy="120" r="30" fill="#241f1a" />
        <circle cx="898" cy="120" r="30" fill="none" stroke="#3b352f" strokeWidth="2" />
        <rect x="896.5" y="101" width="3" height="21" rx="1.5" fill="#a39b91" />
        <rect x="882" y="118.5" width="16" height="3" rx="1.5" fill="#a39b91" />
        <circle cx="898" cy="120" r="2.5" fill="#d6d0c7" />
      </g>

      {/* Pendant lamp, and the light it throws */}
      <g>
        <rect x="348" y="0" width="3" height="42" fill="#3b352f" />
        <path d="M310 42 h80 l22 40 h-124 Z" fill="#2a231e" />
        <circle cx="350" cy="88" r="34" fill="url(#bulb)" className="scene-part" opacity={on ? 1 : 0} />
        <path d="M292 82 h116 l206 348 h-528 Z" fill="url(#lightCone)" filter="url(#soften)" className="scene-part" opacity={on ? 1 : 0} />
      </g>

      {/* The screen she is meant to be keeping up to date */}
      <g>
        <rect x="510" y="266" width="182" height="134" rx="10" fill="#241f1a" />
        <rect x="521" y="277" width="160" height="112" rx="5" fill="#100e0d" />
        <rect x="586" y="400" width="30" height="24" fill="#241f1a" />
        <g className="scene-part" opacity={on ? 1 : 0.12}>
          <rect x="533" y="290" width="54" height="7" rx="3.5" fill="#e4501c" />
          <rect x="533" y="307" width="136" height="6" rx="3" fill="#3b352f" />
          <rect x="533" y="321" width="112" height="6" rx="3" fill="#3b352f" />
          <rect x="533" y="335" width="128" height="6" rx="3" fill="#3b352f" />
          <rect x="533" y="349" width="96" height="6" rx="3" fill="#3b352f" />
          <circle cx="662" cy="366" r="11" fill="#e4501c" opacity="0.9" />
          <path d="M657 366 l4 4 l7 -8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </g>

      {/* The manager, who only ever sees the number at the end of the week */}
      <g
        className="scene-part"
        style={{ transformOrigin: "790px 440px", transform: on ? "translateY(0)" : "translateY(4px)" }}
      >
        <rect x="770" y="372" width="16" height="60" rx="7" fill="#241f1a" />
        <rect x="796" y="372" width="16" height="60" rx="7" fill="#241f1a" />
        <rect x="754" y="266" width="72" height="124" rx="28" fill="#3b342d" />
        <rect x="781" y="244" width="18" height="26" rx="8" fill="#b08a6a" />
        <ellipse cx="790" cy="212" rx="38" ry="44" fill="#c9a685" />
        <ellipse cx="752" cy="214" rx="7" ry="10" fill="#bb9678" />
        <ellipse cx="828" cy="214" rx="7" ry="10" fill="#bb9678" />
        <path
          d="M752 208 C752 170 768 150 790 150 C812 150 828 170 828 208 C822 184 810 174 790 176 C770 178 758 190 752 208 Z"
          fill="#241c17"
        />
        <circle cx="776" cy="211" r="3.6" fill="#2b2016" />
        <circle cx="804" cy="211" r="3.6" fill="#2b2016" />
        <g className="scene-part" opacity={on ? 0 : 1}>
          <path d="M766 197 L786 203" stroke="#241c17" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M814 197 L794 203" stroke="#241c17" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M778 238 Q790 231 802 238" fill="none" stroke="#8a5742" strokeWidth="3.4" strokeLinecap="round" />
        </g>
        <g className="scene-part" opacity={on ? 1 : 0}>
          <path d="M766 199 Q776 194 786 198" fill="none" stroke="#241c17" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M814 199 Q804 194 794 198" fill="none" stroke="#241c17" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M778 232 Q790 242 802 232" fill="none" stroke="#8a5742" strokeWidth="3.4" strokeLinecap="round" />
        </g>
        <g className="scene-part" opacity={on ? 0 : 1}>
          <rect
            x="732"
            y="282"
            width="16"
            height="58"
            rx="8"
            fill="#3b342d"
            style={{ transformOrigin: "740px 288px", transform: "rotate(34deg)" }}
          />
          <rect
            x="832"
            y="282"
            width="16"
            height="58"
            rx="8"
            fill="#3b342d"
            style={{ transformOrigin: "840px 288px", transform: "rotate(-34deg)" }}
          />
        </g>
        <g className="scene-part" opacity={on ? 1 : 0}>
          <rect x="738" y="292" width="16" height="46" rx="8" fill="#3b342d" />
          <rect x="826" y="292" width="16" height="46" rx="8" fill="#3b342d" />
          <rect x="738" y="306" width="104" height="70" rx="8" fill="#ded6c9" />
          <rect x="750" y="318" width="48" height="6" rx="3" fill="#6b645b" />
          <rect x="750" y="331" width="72" height="6" rx="3" fill="#6b645b" />
          <path
            d="M750 362 l18 -13 l16 8 l24 -21"
            fill="none"
            stroke="#e4501c"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* The person who has been holding the phone all evening */}
      <g
        className="scene-part"
        style={{
          transformOrigin: "350px 440px",
          transform: on ? "translateY(0) rotate(0deg)" : "translateY(8px) rotate(3deg)",
        }}
      >
        <rect x="236" y="330" width="228" height="120" rx="26" fill="#1f1b17" />
        <path d="M270 300 L270 200 A80 80 0 0 1 430 200 L430 300 Q430 318 414 318 L286 318 Q270 318 270 300 Z" fill={hair} />

        <path d="M255 450 L255 372 Q255 322 307 312 L393 312 Q445 322 445 372 L445 450 Z" fill="#4a423a" />
        <rect x="330" y="250" width="40" height="60" rx="16" fill={skinShade} />
        <path d="M323 314 L350 350 L377 314 Z" fill={skinShade} />

        <ellipse cx="286" cy="206" rx="10" ry="15" fill={skinShade} />
        <ellipse cx="414" cy="206" rx="10" ry="15" fill={skinShade} />
        <path
          d="M288 196 C288 150 312 126 350 126 C388 126 412 150 412 196 C412 232 395 262 369 274 C357 280 343 280 331 274 C305 262 288 232 288 196 Z"
          fill={skin}
        />
        <ellipse cx="307" cy="228" rx="14" ry="8" fill="#e4501c" className="scene-part" opacity={on ? 0.16 : 0} />
        <ellipse cx="393" cy="228" rx="14" ry="8" fill="#e4501c" className="scene-part" opacity={on ? 0.16 : 0} />

        <ellipse cx="321" cy="202" rx="13" ry="8.5" fill="#fdfbf7" />
        <ellipse cx="379" cy="202" rx="13" ry="8.5" fill="#fdfbf7" />
        <circle cx="321" cy="203" r="5.6" fill="#4a362a" />
        <circle cx="379" cy="203" r="5.6" fill="#4a362a" />
        <circle cx="321" cy="203" r="2.5" fill="#17100c" />
        <circle cx="379" cy="203" r="2.5" fill="#17100c" />
        <circle cx="318.6" cy="200.4" r="1.7" fill="#ffffff" />
        <circle cx="376.6" cy="200.4" r="1.7" fill="#ffffff" />
        <ellipse cx="321" cy="195" rx="13.6" ry="9" fill={skin} className="scene-part" opacity={on ? 0 : 1} />
        <ellipse cx="379" cy="195" rx="13.6" ry="9" fill={skin} className="scene-part" opacity={on ? 0 : 1} />

        <g className="scene-part" opacity={on ? 0 : 1}>
          <path d="M307 191 Q321 184 335 179" fill="none" stroke="#3a2c22" strokeWidth="4.4" strokeLinecap="round" />
          <path d="M393 191 Q379 184 365 179" fill="none" stroke="#3a2c22" strokeWidth="4.4" strokeLinecap="round" />
          <path d="M331 258 Q350 250 369 258" fill="none" stroke="#8a4b3a" strokeWidth="5" strokeLinecap="round" />
        </g>
        <g className="scene-part" opacity={on ? 1 : 0}>
          <path d="M307 187 Q321 178 335 184" fill="none" stroke="#3a2c22" strokeWidth="4.4" strokeLinecap="round" />
          <path d="M393 187 Q379 178 365 184" fill="none" stroke="#3a2c22" strokeWidth="4.4" strokeLinecap="round" />
          <path d="M329 250 Q350 270 371 250" fill="none" stroke="#8a4b3a" strokeWidth="5" strokeLinecap="round" />
        </g>

        <path d="M350 213 L350 230 Q350 236 357 236" fill="none" stroke={skinShade} strokeWidth="3.4" strokeLinecap="round" opacity="0.75" />

        <path
          d="M288 194 C288 146 312 122 350 122 C388 122 412 146 412 194 C405 170 391 156 371 160 C347 166 315 170 296 186 C292 189 289 191 288 194 Z"
          fill={hair}
        />

        <path d="M284 200 C284 118 416 118 416 200" fill="none" stroke="#4a443c" strokeWidth="11" strokeLinecap="round" />
        <rect x="271" y="186" width="22" height="42" rx="11" fill="#4a443c" />
        <rect x="407" y="186" width="22" height="42" rx="11" fill="#4a443c" />
        <path d="M282 226 C271 268 297 284 317 282" fill="none" stroke="#4a443c" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="323" cy="282" rx="13" ry="8" fill="#5b544a" />
        <circle cx="335" cy="282" r="4.5" className="scene-part" fill={on ? "#e4501c" : "#332c26"} />
      </g>

      {/* The desk, in front of everything */}
      <rect x="0" y="424" width="960" height="22" rx="6" fill="#332c26" />
      <rect x="0" y="446" width="960" height="94" fill="#201b17" />

      {/* The phone. Off: ringing into a room where nobody is free. */}
      <g>
        <rect x="150" y="400" width="88" height="24" rx="8" fill="#241f1a" />
        <rect x="155" y="388" width="78" height="16" rx="8" fill="#3a332c" />
        <g className="scene-part" opacity={on ? 0 : 1}>
          <path d="M130 388 a22 22 0 0 0 0 28" fill="none" stroke="#e4501c" strokeWidth="3.4" strokeLinecap="round" />
          <path
            d="M118 378 a35 35 0 0 0 0 48"
            fill="none"
            stroke="#e4501c"
            strokeWidth="3.4"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>
        <g className="scene-part" opacity={on ? 1 : 0}>
          <circle cx="194" cy="366" r="15" fill="#e4501c" opacity="0.22" />
          <rect x="187" y="360" width="3.4" height="12" rx="1.7" fill="#f2895c" />
          <rect x="193" y="355" width="3.4" height="22" rx="1.7" fill="#f2895c" />
          <rect x="199" y="362" width="3.4" height="8" rx="1.7" fill="#f2895c" />
        </g>
      </g>

      {/* Paper: a backlog, or a list that has been worked through */}
      <g className="scene-part" style={{ transformOrigin: "500px 412px", transform: on ? "rotate(0deg)" : "rotate(-6deg)" }}>
        <rect x="462" y="410" width="78" height="14" rx="4" fill="#3b352f" />
        <rect
          x="458"
          y="400"
          width="78"
          height="14"
          rx="4"
          fill="#4a443c"
          className="scene-part"
          style={{ transformOrigin: "497px 407px", transform: on ? "rotate(0deg)" : "rotate(6deg)" }}
        />
        <rect
          x="466"
          y="390"
          width="78"
          height="14"
          rx="4"
          fill="#5b544a"
          className="scene-part"
          style={{ transformOrigin: "505px 397px", transform: on ? "rotate(0deg)" : "rotate(-10deg)" }}
        />
      </g>

      {/* The room is simply darker when no one is answering */}
      <rect width="960" height="540" fill="#0b0908" className="scene-part" opacity={on ? 0 : 0.3} />
    </svg>
  );
}
