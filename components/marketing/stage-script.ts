/**
 * The scripted calls behind the homepage stage.
 *
 * One timeline drives everything on screen: the room's light, the waveform,
 * the pipeline, the captioned words and the fields the agent captures. `at`
 * and `until` are seconds from the moment the line opens.
 *
 * Every name, figure and company here is sample script content for a
 * demonstration. The stage labels itself as scripted, and none of it is
 * presented as a real call or a real customer.
 */
export type Voice = "agent" | "caller";

export type StageLine = {
  s: Voice;
  t: string;
  at: number;
  /** When the caption leaves the screen. */
  until: number;
};

/** One of the four states the agent moves through while the call runs. */
export type StageStep = { label: string; at: number };

/** A field pulled out of the conversation while it is still happening. */
export type StageField = { label: string; value: string; at: number };

export type StageCall = {
  id: string;
  tab: string;
  end: number;
  /** Who is on the other end. */
  caller: { title: string; sub: string; initials?: string };
  desk: string;
  direction: "Inbound" | "Outbound";
  /** The headline promise: how fast the line was picked up. */
  pickup: string;
  lines: StageLine[];
  steps: StageStep[];
  fields: StageField[];
  outcome: { title: string; detail: string; at: number };
};

/** The call connects at the same moment in every scenario. */
export const CONNECT_AT = 1.1;

export const STAGE_CALLS: StageCall[] = [
  {
    id: "real-estate",
    tab: "Real estate",
    end: 27.5,
    caller: { title: "+1 (415) 555-0182", sub: "Unknown number" },
    desk: "Listings desk",
    direction: "Inbound",
    pickup: "answered in 0.4s",
    lines: [
      { s: "caller", t: "Hi, I'm calling about the two-bedroom on Harper Street. Is it still available?", at: 1.4, until: 5.6 },
      { s: "agent", t: "It is. Are you hoping to move soon, and what monthly budget did you have in mind?", at: 5.9, until: 10.4 },
      { s: "caller", t: "Within two months, ideally. Around $2,400 a month.", at: 10.7, until: 14.2 },
      { s: "agent", t: "That fits this listing. I can book you a viewing on Saturday at 11. Does that work?", at: 14.5, until: 19.2 },
      { s: "caller", t: "Saturday at 11 works for me.", at: 19.5, until: 21.9 },
      { s: "agent", t: "Booked. You'll get a text with the address and the agent's name shortly.", at: 22.2, until: 26.6 },
    ],
    steps: [
      { label: "Listening", at: CONNECT_AT },
      { label: "Reading the intent", at: 10.9 },
      { label: "Taking the action", at: 15.6 },
      { label: "Filed to the workspace", at: 23.2 },
    ],
    fields: [
      { label: "Property", value: "2-bed · Harper St", at: 4.4 },
      { label: "Timeline", value: "Within 2 months", at: 12.2 },
      { label: "Budget", value: "$2,400 / month", at: 13.6 },
      { label: "Viewing", value: "Saturday 11:00", at: 20.6 },
    ],
    outcome: {
      title: "Lead captured",
      detail: "Viewing booked · confirmation texted · filed to the Harper St listing",
      at: 23.4,
    },
  },
  {
    id: "recruitment",
    tab: "Recruitment",
    end: 28.5,
    caller: { title: "Priya R.", sub: "Applied Tuesday", initials: "PR" },
    desk: "Candidate screening",
    direction: "Outbound",
    pickup: "connected in 1.2s",
    lines: [
      { s: "agent", t: "Hi Priya, calling about your application for the support role. Do you have two minutes?", at: 1.4, until: 6.2 },
      { s: "caller", t: "Sure, go ahead.", at: 6.5, until: 8.4 },
      { s: "agent", t: "What's your notice period, and are you open to weekend shifts?", at: 8.7, until: 12.8 },
      { s: "caller", t: "Two weeks' notice, and weekends are fine.", at: 13.1, until: 16.2 },
      { s: "agent", t: "Noted. And the salary range you're looking for?", at: 16.5, until: 19.6 },
      { s: "caller", t: "Around forty-five to fifty thousand.", at: 19.9, until: 22.4 },
      { s: "agent", t: "That's within band. I'll set your interview for Tuesday at 2.", at: 22.7, until: 27.4 },
    ],
    steps: [
      { label: "Listening", at: CONNECT_AT },
      { label: "Reading the intent", at: 13.3 },
      { label: "Taking the action", at: 20.1 },
      { label: "Filed to the workspace", at: 24.4 },
    ],
    fields: [
      { label: "Role", value: "Support · shift work", at: 3.4 },
      { label: "Notice", value: "2 weeks", at: 14.6 },
      { label: "Weekends", value: "Available", at: 15.6 },
      { label: "Salary", value: "$45–50k · in band", at: 21.6 },
    ],
    outcome: {
      title: "Candidate screened",
      detail: "Interview set for Tuesday 14:00 · scorecard added to the pipeline",
      at: 24.6,
    },
  },
  {
    id: "appointments",
    tab: "Appointments",
    end: 23.5,
    caller: { title: "+1 (415) 555-0147", sub: "Repeat customer" },
    desk: "Front desk",
    direction: "Inbound",
    pickup: "answered in 0.3s",
    lines: [
      { s: "caller", t: "I need to move my cleaning appointment this Friday. Something's come up.", at: 1.4, until: 5.8 },
      { s: "agent", t: "No problem. Thursday at 9:30 or Monday at 3 are open. Which suits you?", at: 6.1, until: 10.8 },
      { s: "caller", t: "Thursday morning works.", at: 11.1, until: 13.4 },
      { s: "agent", t: "Done. You're moved to Thursday at 9:30, and we'll text a reminder the night before.", at: 13.7, until: 18.8 },
      { s: "caller", t: "Great, thank you.", at: 19.1, until: 21.2 },
    ],
    steps: [
      { label: "Listening", at: CONNECT_AT },
      { label: "Reading the intent", at: 4.2 },
      { label: "Taking the action", at: 9.4 },
      { label: "Filed to the workspace", at: 14.8 },
    ],
    fields: [
      { label: "Booking", value: "Friday clean · 11:00", at: 3.2 },
      { label: "Request", value: "Reschedule", at: 5.2 },
      { label: "New slot", value: "Thursday 09:30", at: 12.4 },
      { label: "Reminder", value: "Night before · SMS", at: 17.2 },
    ],
    outcome: {
      title: "Appointment moved",
      detail: "Thursday 09:30 confirmed · reminder queued · calendar updated",
      at: 15.0,
    },
  },
];

export const activeLineIndex = (call: StageCall, time: number): number => {
  for (let i = call.lines.length - 1; i >= 0; i--) {
    const line = call.lines[i];
    if (time >= line.at && time < line.until) return i;
  }
  return -1;
};

/** Index of the line most recently spoken, whether or not it is still up. */
export const lastLineIndex = (call: StageCall, time: number): number => {
  let found = -1;
  call.lines.forEach((line, i) => {
    if (time >= line.at) found = i;
  });
  return found;
};

/** Index of the last pipeline step reached, or -1 before the first. */
export const reachedStepIndex = (call: StageCall, time: number): number => {
  let found = -1;
  call.steps.forEach((step, i) => {
    if (time >= step.at) found = i;
  });
  return found;
};

/** How many fields the agent has pulled out of the call by now. */
export const capturedCount = (call: StageCall, time: number): number =>
  call.fields.reduce((n, field) => (time >= field.at ? n + 1 : n), 0);

/**
 * How many words of a line have left the speaker's mouth by `time`. The last
 * sixth of each line's slot is silence, so the caption finishes a beat before
 * the next voice starts — the way real speech lands.
 */
export const spokenWords = (line: StageLine, time: number, total: number): number => {
  const span = Math.max(0.4, (line.until - line.at) * 0.84);
  const progress = (time - line.at) / span;
  return Math.max(0, Math.min(total, Math.ceil(progress * total)));
};

/**
 * Loudness of one voice at `time`, 0–1. It rises as a line starts and falls as
 * it ends, so the waveform and the room's light mean "someone is talking"
 * rather than "decoration is happening".
 */
export const voiceLevel = (call: StageCall, time: number, voice: Voice): number => {
  const index = activeLineIndex(call, time);
  if (index < 0) return 0;
  const line = call.lines[index];
  if (line.s !== voice) return 0;
  const into = time - line.at;
  const left = line.until - time;
  return Math.max(0, Math.min(1, into / 0.35) * Math.min(1, left / 0.4));
};
