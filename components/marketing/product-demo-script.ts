/**
 * Timeline for the hero call simulation. `at` values are seconds from the
 * start of the animation; the UI derives every state from elapsed time.
 */
export type Speaker = "agent" | "customer";

export const demoAgent = { name: "Sales Agent", direction: "Outbound call", contact: "Sarah · Demo request" };

export const demoSteps = [
  { label: "Lead selected", at: 0 },
  { label: "Calling", at: 1 },
  { label: "Connected", at: 3 },
  { label: "Conversation", at: 4 },
  { label: "Action captured", at: 19 },
];

export const CONNECTED_AT = 3;

export const demoMessages: { speaker: Speaker; text: string; at: number }[] = [
  { speaker: "agent", text: "Hi Sarah, I'm calling from Acme about your demo request. Is now a good time?", at: 5 },
  { speaker: "customer", text: "Yes, I have a few minutes.", at: 8 },
  { speaker: "agent", text: "Perfect. What are you mainly looking to automate?", at: 11 },
  { speaker: "customer", text: "Inbound customer calls, mostly.", at: 14 },
  { speaker: "agent", text: "Great — I'll schedule a product demo with our team for Thursday.", at: 17 },
];

/** Seconds the typing indicator shows before each message lands. */
export const TYPING_LEAD = 1.2;

export const demoOutcomes = [
  { label: "Qualified lead", at: 15 },
  { label: "Demo scheduled", at: 19 },
  { label: "CRM updated", at: 21 },
];

export const DEMO_END = 23;
