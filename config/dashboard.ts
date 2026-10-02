/**
 * Dashboard navigation and DEMO data.
 * Everything in `demo*` is illustrative sample data for Phase 1 UI only —
 * it is not fetched from, or written to, any service.
 */
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  PhoneCall,
  Phone,
  Plug,
  Settings,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DemoCall, DemoStat } from "@/types";

export type DashboardNavItem = {
  label: string;
  slug: string;
  icon: LucideIcon;
  description: string;
};

export const dashboardNav: DashboardNavItem[] = [
  { label: "Overview", slug: "", icon: LayoutDashboard, description: "Your workspace at a glance." },
  { label: "Agents", slug: "agents", icon: Bot, description: "Create and configure voice agents." },
  { label: "Phone Numbers", slug: "phone-numbers", icon: Phone, description: "Connect and route phone numbers." },
  { label: "Campaigns", slug: "campaigns", icon: Megaphone, description: "Schedule outbound calling campaigns." },
  { label: "Leads", slug: "leads", icon: Users, description: "Upload and manage lead lists." },
  { label: "Calls", slug: "calls", icon: PhoneCall, description: "Review calls, transcripts and recordings." },
  { label: "Analytics", slug: "analytics", icon: BarChart3, description: "Measure outcomes and agent performance." },
  { label: "Knowledge", slug: "knowledge", icon: BookOpen, description: "Manage the knowledge your agents use." },
  { label: "Integrations", slug: "integrations", icon: Plug, description: "Connect providers and business tools." },
  { label: "Billing", slug: "billing", icon: CreditCard, description: "Plans, usage and invoices." },
  { label: "Settings", slug: "settings", icon: Settings, description: "Workspace, team and security settings." },
];

export const dashboardHref = (slug: string) => (slug ? `/dashboard/${slug}` : "/dashboard");

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
