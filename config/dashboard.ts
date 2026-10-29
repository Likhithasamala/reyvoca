/**
 * DEMO data for the marketing site's workspace preview.
 *
 * The dashboard's own navigation lives in `config/dashboard-nav.ts` and its
 * example data in `config/dashboard-demo.ts`. Everything here exists only to
 * render the product mockup inside the public homepage.
 */
import { Bot, CalendarCheck, PhoneCall, Target } from "lucide-react";
import type { DemoCall, DemoStat } from "@/types";

export const demoWorkspace = { name: "Acme Demo", user: { name: "Demo User", initials: "DU" } };

export const demoStats: DemoStat[] = [
  { label: "Calls today", value: "248", change: "+12%", icon: PhoneCall },
  { label: "Active agents", value: "6", change: "+1", icon: Bot },
  { label: "Appointments", value: "37", change: "+8%", icon: CalendarCheck },
  { label: "Qualified leads", value: "64", change: "+15%", icon: Target },
];

export const demoCalls: DemoCall[] = [
  { id: "c1", customer: "Sarah Mitchell", agent: "Sales Qualifier", duration: "3:42", outcome: "Appointment", time: "10:24 AM" },
  { id: "c2", customer: "Rahul Verma", agent: "Renewal Assistant", duration: "2:15", outcome: "Qualified", time: "10:11 AM" },
  { id: "c3", customer: "Elena García", agent: "Support Agent", duration: "1:08", outcome: "Callback", time: "9:58 AM" },
  { id: "c4", customer: "James Okafor", agent: "Sales Qualifier", duration: "0:46", outcome: "Not interested", time: "9:47 AM" },
  { id: "c5", customer: "Priya Nair", agent: "Booking Agent", duration: "2:57", outcome: "Appointment", time: "9:30 AM" },
];

/** Calls per day for the last 7 days — demo only. */
export const demoWeeklyCalls = [
  { day: "Mon", calls: 182 },
  { day: "Tue", calls: 214 },
  { day: "Wed", calls: 198 },
  { day: "Thu", calls: 236 },
  { day: "Fri", calls: 261 },
  { day: "Sat", calls: 124 },
  { day: "Sun", calls: 248 },
];
