/**
 * Scripted conversations for the hero demonstration. Three scenarios, one per
 * vertical the product templates cover. Every timestamp (`at`) is seconds from
 * play; the component derives all state from elapsed time, so the timeline is
 * the single source of truth for messages, extracted fields and the action.
 *
 * All names, numbers and companies here are sample content for the simulation
 * and are labelled as simulated in the UI. Nothing is presented as a real
 * customer or a real call.
 */

export type Speaker = "agent" | "caller";

export type ScenarioMessage = {
  speaker: Speaker;
  text: string;
  /** Seconds from play at which the line lands. */
  at: number;
};

export type ExtractedField = {
  label: string;
  value: string;
  /** Seconds from play at which the field is captured. */
  at: number;
};

export type Scenario = {
  id: string;
  /** Short label on the scenario switch. */
  tab: string;
  /** The agent as it would be named in a workspace. */
  agent: string;
  direction: "Inbound" | "Outbound";
  /** Who is on the line, as the call header would show it. */
  counterpart: string;
  messages: ScenarioMessage[];
  fields: ExtractedField[];
  outcome: { label: string; at: number };
  action: { label: string; detail: string; at: number };
  /** Total runtime in seconds. */
  end: number;
};

export const CONNECT_AT = 1.2;

export const SCENARIOS: Scenario[] = [
  {
    id: "real-estate",
    tab: "Real estate",
    agent: "Listings desk",
    direction: "Inbound",
    counterpart: "Caller · Harper St enquiry",
    messages: [
      { speaker: "caller", text: "Hi — I'm calling about the two-bedroom on Harper Street. Is it still available?", at: 1.4 },
      { speaker: "agent", text: "It is. Are you hoping to move soon, and what monthly budget did you have in mind?", at: 6.2 },
      { speaker: "caller", text: "Within two months, ideally. Around $2,400 a month.", at: 10.4 },
      { speaker: "agent", text: "That fits this listing. I can book you a viewing on Saturday at 11 — does that work?", at: 14.2 },
      { speaker: "caller", text: "Saturday at 11 works for me.", at: 18.2 },
      { speaker: "agent", text: "Booked. You'll get a text with the address and the agent's name shortly.", at: 21.2 },
    ],
    fields: [
      { label: "Property", value: "2-bed · Harper St", at: 5 },
      { label: "Move-in", value: "Within 2 months", at: 12 },
      { label: "Budget", value: "$2,400 / month", at: 13 },
    ],
    outcome: { label: "Qualified", at: 16 },
    action: { label: "Viewing booked", detail: "Sat 11:00 · confirmation text sent · lead filed", at: 22.5 },
    end: 25,
  },
  {
    id: "recruitment",
    tab: "Recruitment",
    agent: "Candidate screening",
    direction: "Outbound",
    counterpart: "Priya · support role applicant",
    messages: [
      { speaker: "agent", text: "Hi Priya, calling about your application for the customer support role. Do you have two minutes?", at: 1.4 },
      { speaker: "caller", text: "Sure, go ahead.", at: 6.6 },
      { speaker: "agent", text: "What's your notice period, and are you open to weekend shifts?", at: 9 },
      { speaker: "caller", text: "Two weeks' notice, and weekends are fine.", at: 12.6 },
      { speaker: "agent", text: "Noted. And your expected salary range?", at: 15.8 },
      { speaker: "caller", text: "Around forty-five to fifty thousand.", at: 18.4 },
      { speaker: "agent", text: "That's within band. I'll set your interview with the hiring manager for Tuesday at 2 PM.", at: 21.4 },
    ],
    fields: [
      { label: "Notice period", value: "2 weeks", at: 13.4 },
      { label: "Weekend shifts", value: "Yes", at: 14.2 },
      { label: "Expected salary", value: "45–50k", at: 19.6 },
    ],
    outcome: { label: "Shortlisted", at: 22 },
    action: { label: "Interview scheduled", detail: "Tue 14:00 · invite sent · candidate shortlisted", at: 23.4 },
    end: 26,
  },
  {
    id: "appointments",
    tab: "Appointments",
    agent: "Clinic front desk",
    direction: "Inbound",
    counterpart: "Patient · reschedule request",
    messages: [
      { speaker: "caller", text: "I need to move my cleaning appointment this Friday — something's come up.", at: 1.4 },
      { speaker: "agent", text: "No problem. Dr. Rao has Thursday at 9:30 or Monday at 3 open. Which suits you?", at: 6.4 },
      { speaker: "caller", text: "Thursday morning works.", at: 11 },
      { speaker: "agent", text: "Done — you're moved to Thursday at 9:30. We'll text a reminder the evening before.", at: 14 },
      { speaker: "caller", text: "Great, thank you.", at: 18 },
    ],
    fields: [
      { label: "Request", value: "Reschedule cleaning", at: 5 },
      { label: "Old slot", value: "Friday", at: 5.8 },
      { label: "New slot", value: "Thu 09:30", at: 12.6 },
    ],
    outcome: { label: "Rebooked", at: 15 },
    action: { label: "Appointment moved", detail: "Thu 09:30 · calendar updated · reminder queued", at: 19.4 },
    end: 22,
  },
];
