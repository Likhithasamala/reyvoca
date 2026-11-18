/**
 * The example calls behind the homepage.
 *
 * Each one tells the same story the product tells: somebody asks a question
 * somewhere public, Reyvoca rings them back before the interest cools, holds
 * the conversation, and files what it learned as a scored lead.
 *
 * One timeline drives the whole card. `at` and `until` are seconds from the
 * moment the enquiry lands, so the dial, the connect, the spoken words, the
 * captured fields and the verdict are all the same clock.
 *
 * Every name, number and figure here is sample script content. The card
 * labels itself an example, and none of it is a real customer or recording.
 */
export type Voice = "agent" | "contact";

export type CallLine = {
  s: Voice;
  t: string;
  at: number;
  /** When the turn ends. */
  until: number;
};

export type CallStep = { label: string; detail: string; at: number };

export type CallField = { label: string; value: string; at: number };

export type CallScript = {
  id: string;
  tab: string;
  /** Where the person asked, before anyone picked up the phone. */
  source: { channel: string; when: string; quote: string; after: string };
  agent: string;
  contact: { name: string; initials: string };
  /** Seconds: the agent starts dialling, then the line connects. */
  dialAt: number;
  connectAt: number;
  end: number;
  lines: CallLine[];
  steps: CallStep[];
  fields: CallField[];
  /** How the call was graded once it was over. */
  verdict: { label: string; note: string; score: number; at: number };
};

/** How long the finished card is held before the call runs again. */
export const HOLD = 4;

export const CALLS: CallScript[] = [
  {
    id: "real-estate",
    tab: "Real estate",
    source: {
      channel: "Instagram DM",
      when: "21:04, Saturday",
      quote: "Is the 2-bed on Harper St still free?",
      after: "after an Instagram DM",
    },
    agent: "Listings agent",
    contact: { name: "Anita S.", initials: "AS" },
    dialAt: 1.2,
    connectAt: 2.6,
    end: 29.5,
    lines: [
      { s: "agent", t: "Hi Anita, Reyvoca calling from Harper Lettings about the two-bed you messaged about.", at: 3, until: 7.6 },
      { s: "contact", t: "Yes — is it still available, and what's the rent?", at: 7.9, until: 11.2 },
      { s: "agent", t: "It is, $2,400 a month. Are you hoping to move soon?", at: 11.5, until: 16.4 },
      { s: "contact", t: "Within two months, ideally.", at: 16.7, until: 19.4 },
      { s: "agent", t: "Then I'll book you a viewing Saturday at 11 and text you the address.", at: 19.7, until: 24.4 },
      { s: "contact", t: "Perfect, thank you.", at: 24.7, until: 26.6 },
    ],
    steps: [
      { label: "Enquiry received", detail: "Instagram DM · 21:04", at: 0.2 },
      { label: "Agent calling", detail: "Workspace line", at: 1.2 },
      { label: "Connected", detail: "Conversation live", at: 2.6 },
      { label: "Outcome captured", detail: "Interested · viewing agreed", at: 25.2 },
      { label: "Viewing booked", detail: "Saturday 11:00 · address texted", at: 27 },
    ],
    fields: [
      { label: "Property", value: "2-bed · Harper St", at: 5.4 },
      { label: "Budget", value: "$2,400 / month", at: 14 },
      { label: "Timeline", value: "Within 2 months", at: 18.6 },
      { label: "Viewing", value: "Saturday 11:00", at: 22.8 },
    ],
    verdict: { label: "Hot lead", note: "Interested · viewing booked", score: 92, at: 27.4 },
  },
  {
    id: "recruitment",
    tab: "Recruitment",
    source: {
      channel: "Application form",
      when: "09:12, Tuesday",
      quote: "Applied for the evening support role",
      after: "after a careers application",
    },
    agent: "Screening agent",
    contact: { name: "Priya R.", initials: "PR" },
    dialAt: 1.2,
    connectAt: 2.6,
    end: 31.5,
    lines: [
      { s: "agent", t: "Hi Priya, Reyvoca calling about your application for the support role. Two minutes?", at: 3, until: 7.8 },
      { s: "contact", t: "Sure, go ahead.", at: 8.1, until: 10 },
      { s: "agent", t: "What's your notice period, and are you open to weekend shifts?", at: 10.3, until: 14.4 },
      { s: "contact", t: "Two weeks' notice, and weekends are fine.", at: 14.7, until: 17.8 },
      { s: "agent", t: "And the salary range you're after?", at: 18.1, until: 21 },
      { s: "contact", t: "Forty-five to fifty thousand.", at: 21.3, until: 23.8 },
      { s: "agent", t: "That's within band. I'll set your interview for Tuesday at 2.", at: 24.1, until: 28.4 },
    ],
    steps: [
      { label: "Application received", detail: "Careers form · 09:12", at: 0.2 },
      { label: "Agent calling", detail: "Workspace line", at: 1.2 },
      { label: "Connected", detail: "Conversation live", at: 2.6 },
      { label: "Outcome captured", detail: "Qualified · within band", at: 29 },
      { label: "Interview booked", detail: "Tuesday 14:00 · invite sent", at: 30.2 },
    ],
    fields: [
      { label: "Role", value: "Support · evening shift", at: 5.6 },
      { label: "Notice", value: "2 weeks", at: 16.2 },
      { label: "Weekends", value: "Available", at: 17.2 },
      { label: "Salary", value: "$45–50k · in band", at: 23.4 },
    ],
    verdict: { label: "Strong candidate", note: "Qualified · interview booked", score: 88, at: 30.4 },
  },
  {
    id: "appointments",
    tab: "Appointments",
    source: {
      channel: "WhatsApp",
      when: "07:52, Monday",
      quote: "Can I move Friday's clean?",
      after: "after a WhatsApp message",
    },
    agent: "Front desk agent",
    contact: { name: "Dev M.", initials: "DM" },
    dialAt: 1.2,
    connectAt: 2.6,
    end: 27.5,
    lines: [
      { s: "agent", t: "Hi Dev, Reyvoca calling from Spotless about moving Friday's clean.", at: 3, until: 7.4 },
      { s: "contact", t: "Yes — something's come up.", at: 7.7, until: 10.4 },
      { s: "agent", t: "Thursday at 9:30 or Monday at 3 are open. Which suits you?", at: 10.7, until: 15 },
      { s: "contact", t: "Thursday morning works.", at: 15.3, until: 17.6 },
      { s: "agent", t: "Done. You're moved to Thursday 9:30, and we'll text a reminder the night before.", at: 17.9, until: 22.6 },
      { s: "contact", t: "Great, thanks.", at: 22.9, until: 24.6 },
    ],
    steps: [
      { label: "Message received", detail: "WhatsApp · 07:52", at: 0.2 },
      { label: "Agent calling", detail: "Workspace line", at: 1.2 },
      { label: "Connected", detail: "Conversation live", at: 2.6 },
      { label: "Outcome captured", detail: "Kept · rescheduled", at: 25 },
      { label: "Appointment moved", detail: "Thursday 09:30 · reminder queued", at: 26 },
    ],
    fields: [
      { label: "Booking", value: "Friday clean · 11:00", at: 5.2 },
      { label: "Request", value: "Reschedule", at: 9.6 },
      { label: "New slot", value: "Thursday 09:30", at: 16.8 },
      { label: "Reminder", value: "Night before · SMS", at: 21.6 },
    ],
    verdict: { label: "Booking saved", note: "Kept · moved, not lost", score: 74, at: 26.2 },
  },
];

export const activeLineIndex = (call: CallScript, time: number): number => {
  for (let i = call.lines.length - 1; i >= 0; i--) {
    const line = call.lines[i];
    if (time >= line.at && time < line.until) return i;
  }
  return -1;
};

/** Index of the turn most recently spoken, whether or not it is still running. */
export const lastLineIndex = (call: CallScript, time: number): number => {
  let found = -1;
  call.lines.forEach((line, i) => {
    if (time >= line.at) found = i;
  });
  return found;
};

export const reachedStepIndex = (call: CallScript, time: number): number => {
  let found = -1;
  call.steps.forEach((step, i) => {
    if (time >= step.at) found = i;
  });
  return found;
};

export const capturedCount = (call: CallScript, time: number): number =>
  call.fields.reduce((n, field) => (time >= field.at ? n + 1 : n), 0);

/**
 * How many words of a turn have left the speaker's mouth by `time`. The last
 * sixth of each slot is silence, so a turn finishes a beat before the next.
 */
export const spokenWords = (line: CallLine, time: number, total: number): number => {
  const span = Math.max(0.4, (line.until - line.at) * 0.84);
  return Math.max(0, Math.min(total, Math.ceil(((time - line.at) / span) * total)));
};

/** Loudness of one voice, 0–1: up as a turn starts, down as it ends. */
export const voiceLevel = (call: CallScript, time: number, voice: Voice): number => {
  const index = activeLineIndex(call, time);
  if (index < 0) return 0;
  const line = call.lines[index];
  if (line.s !== voice) return 0;
  return Math.max(0, Math.min(1, (time - line.at) / 0.35) * Math.min(1, (line.until - time) / 0.4));
};

/** The score ticks up to its final value over the second after the verdict. */
export const scoreAt = (call: CallScript, time: number): number => {
  if (time < call.verdict.at) return 0;
  const progress = Math.min(1, (time - call.verdict.at) / 1.1);
  return Math.round(call.verdict.score * (1 - Math.pow(1 - progress, 3)));
};
