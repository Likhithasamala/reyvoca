/**
 * The two ways a Reyvoca call can start — the whole Products menu.
 *
 * Instant and Bulk are the only two modes the site sells, and each one gets a
 * page that answers the two questions a visitor actually has: *what is this*,
 * and *where will I see it once you hand the workspace over*. Both pages are
 * driven from this file so the definitions can never drift apart.
 *
 * `workspace` describes where the module sits in the workspace Reyvoca builds
 * for a client. It is drawn as a diagram, never linked: clients do not sign
 * themselves up, so there is no public door into the workspace.
 */

export type LeadModeSlug = "instant-leads" | "bulk-leads";

export type FlowStep = {
  /** "01" … "05". Shown as a numeral, so it carries the order. */
  number: string;
  title: string;
  detail: string;
};

/**
 * The three-step explainer drawn on the product page. Three, not five: the
 * long version is a wall of prose, and the picture carries what the words
 * were doing. `visual` is resolved in the component — config holds no JSX.
 */
export type ExplainerStep = {
  number: string;
  title: string;
  description: string;
};

export type WorkspaceGroup = {
  title: string;
  items: { label: string; mark?: "primary" | "results" }[];
};

export type WorkspacePanel = {
  /** The screen's own title, as it reads in the workspace. */
  title: string;
  status: string;
  /** Three figures across the top of the screen. */
  tiles: { label: string; value: string }[];
  /** The table underneath, abbreviated to three rows. */
  rows: { name: string; detail: string; state: "live" | "done" | "waiting" }[];
};

export type LeadMode = {
  slug: LeadModeSlug;
  /** Menu and nav label. */
  label: string;
  /** What the module is called inside the workspace, when it differs. */
  workspaceLabel: string;
  /** One line for the Products menu. */
  menuDescription: string;
  /** <title> for the page: what a buyer would actually search for. */
  title: string;
  /** Meta description: a promise, 70–160 characters. */
  metaDescription: string;
  heading: string;
  intro: string;
  /** The plain-English definition. The point of the page. */
  definition: string;
  /** The same thing in one short line, for the top of the page. */
  oneLine: string;
  /** When a business should reach for this mode. */
  bestFor: string[];
  flowLabel: string;
  flow: FlowStep[];
  /** The same story as `flow`, cut to three steps and drawn. */
  explainer: ExplainerStep[];
  workspace: {
    /** Breadcrumb through the workspace sidebar, e.g. Calling → Instant Leads. */
    path: string[];
    /** What the screen is for, in one sentence. */
    summary: string;
    groups: WorkspaceGroup[];
    panel: WorkspacePanel;
    /** Where the finished calls are read back. */
    resultsNote: string;
  };
};

/** The workspace sidebar, with Inbound left out: the site sells two modes. */
const workspaceGroups = (active: "instant" | "bulk"): WorkspaceGroup[] => [
  {
    title: "Overview",
    items: [{ label: "Dashboard" }, { label: "My Agents" }],
  },
  {
    title: "Calling",
    items: [
      { label: "Instant Leads", mark: active === "instant" ? "primary" : undefined },
      { label: "Bulk Campaigns", mark: active === "bulk" ? "primary" : undefined },
    ],
  },
  {
    title: "Results & Setup",
    items: [
      { label: "Leads & Results", mark: "results" },
      { label: "Performance" },
      { label: "Usage & Billing" },
    ],
  },
];

export const leadModes: LeadMode[] = [
  {
    slug: "instant-leads",
    label: "Instant Leads",
    workspaceLabel: "Instant Leads",
    menuDescription: "A lead lands and the agent rings it straight back.",
    title: "Instant lead calling — a call back in seconds",
    metaDescription:
      "Reyvoca rings every new enquiry back within seconds — website forms, Meta lead ads, CRM and webhooks — qualifies the caller and books the next step.",
    heading: "One enquiry in. One call out. Within seconds.",
    intro:
      "Instant Leads is for the enquiry that just arrived. The moment it lands, your agent rings that person back — while they are still holding the phone they filled the form on.",
    definition:
      "An instant lead is a single enquiry that has only just come in — someone submitted your website form, replied to a Meta ad, or was created in your CRM. Reyvoca is told the moment it happens, and the agent places one call straight away. Nothing is scheduled, nothing waits in a list: the lead's arrival is what starts the call.",
    oneLine: "One new enquiry, called back immediately.",
    bestFor: [
      "Enquiries from ads and website forms, where the first business to call usually wins the customer",
      "Anything that arrives outside office hours and would otherwise sit until morning",
      "Qualifying before a person spends time on it — budget, intent, locality, language",
    ],
    explainer: [
      {
        number: "01",
        title: "New lead arrives",
        description: "A customer submits an enquiry from any connected source.",
      },
      {
        number: "02",
        title: "Reyvoca calls instantly",
        description: "Your AI agent starts the conversation within seconds.",
      },
      {
        number: "03",
        title: "Result captured",
        description: "The result is saved automatically and ready for the next action.",
      },
    ],
    flowLabel: "What happens to one instant lead",
    flow: [
      {
        number: "01",
        title: "The enquiry arrives",
        detail:
          "Your website form, a Meta lead ad, your CRM or a webhook from your own system tells Reyvoca a new person is interested.",
      },
      {
        number: "02",
        title: "It is checked",
        detail:
          "The number is validated, duplicates are spotted and anyone on the Do Not Call list is dropped — before anything dials.",
      },
      {
        number: "03",
        title: "The agent calls",
        detail:
          "Seconds later, not hours. No queue and no schedule, because there is only one lead to ring.",
      },
      {
        number: "04",
        title: "The conversation happens",
        detail:
          "Your agent opens in the caller's language, answers what they ask, qualifies them and books the next step.",
      },
      {
        number: "05",
        title: "The result is written down",
        detail:
          "Outcome, transcript and recording are saved on that lead, with a retry queued if nobody picked up.",
      },
    ],
    workspace: {
      path: ["Calling", "Instant Leads"],
      summary:
        "One screen: the lead source you connected, the agent that answers for it, and every instant lead as it happens.",
      groups: workspaceGroups("instant"),
      panel: {
        title: "Instant Leads",
        status: "Active",
        tiles: [
          { label: "Leads today", value: "18" },
          { label: "Avg. time to call", value: "7s" },
          { label: "Qualified", value: "11" },
        ],
        rows: [
          { name: "Ramesh Kumar", detail: "Meta Lead Ad · 00:06", state: "live" },
          { name: "Sravani Rao", detail: "Website form · Qualified", state: "done" },
          { name: "Imran Sheikh", detail: "CRM · Retry at 18:40", state: "waiting" },
        ],
      },
      resultsNote:
        "Finished instant calls are read back under Leads & Results, filtered to the Instant channel — the same table bulk calls land in.",
    },
  },
  {
    slug: "bulk-leads",
    label: "Bulk Leads",
    workspaceLabel: "Bulk Campaigns",
    menuDescription: "Work a whole list on a schedule, with retry rules.",
    title: "Bulk lead calling — a whole list on a schedule",
    metaDescription:
      "Upload a CSV or a CRM segment and Reyvoca's voice agent works the whole list inside your calling hours, retries no-answers and records every outcome.",
    heading: "One list in. Calls out on your schedule.",
    intro:
      "Bulk Leads is for the contacts you already have. You hand over a list, set the hours and the pace, and the agent works through it — retrying the ones that did not pick up.",
    definition:
      "A bulk lead is one row in a list you already own — a CSV export, a CRM segment, last quarter's enquiries, a renewals sheet. You upload the list once and it becomes a campaign: Reyvoca validates every row, then calls them in order inside your calling hours, a set number at a time. You start the campaign, so you decide when the calling happens.",
    oneLine: "A list you already have, called through on your schedule.",
    bestFor: [
      "Old enquiries nobody got around to calling back",
      "Renewals, reminders and follow-ups that go out on a fixed date",
      "Finding out which half of a cold list is still worth a person's time",
    ],
    explainer: [
      {
        number: "01",
        title: "Upload your list",
        description: "Upload a structured CSV containing the people you want Reyvoca to call.",
      },
      {
        number: "02",
        title: "Reyvoca calls automatically",
        description: "Your selected AI agent works through the list automatically.",
      },
      {
        number: "03",
        title: "Watch results live",
        description: "See campaign progress and results update as calls finish.",
      },
    ],
    flowLabel: "What happens to a bulk list",
    flow: [
      {
        number: "01",
        title: "You upload the list",
        detail: "A CSV from your CRM, your spreadsheet, or an export from wherever the contacts live.",
      },
      {
        number: "02",
        title: "Columns are mapped",
        detail:
          "You say which column is the name, the number, the language, and anything else the agent should know before it speaks.",
      },
      {
        number: "03",
        title: "The list is validated",
        detail:
          "Bad numbers, duplicates and Do Not Call entries are removed, and you see the final count before a single call is placed.",
      },
      {
        number: "04",
        title: "The campaign runs",
        detail:
          "Calls go out at the pace you set, only inside your calling hours, with retries for whoever did not answer. You can pause it at any point.",
      },
      {
        number: "05",
        title: "Every result is written down",
        detail:
          "Each row ends with an outcome, a transcript and a recording, and the campaign shows you the totals as it goes.",
      },
    ],
    workspace: {
      path: ["Calling", "Bulk Campaigns"],
      summary:
        "Every campaign on one screen — drafts, what is running now, and the progress of each list as it is worked through.",
      groups: workspaceGroups("bulk"),
      panel: {
        title: "Bulk Campaigns",
        status: "1 running",
        tiles: [
          { label: "In this list", value: "247" },
          { label: "Called", value: "163" },
          { label: "Qualified", value: "41" },
        ],
        rows: [
          { name: "October enquiries", detail: "Running · 163 of 247", state: "live" },
          { name: "Policy renewals — Q3", detail: "Completed · 312 calls", state: "done" },
          { name: "Dealership walk-ins", detail: "Scheduled · tomorrow 10:00", state: "waiting" },
        ],
      },
      resultsNote:
        "Finished campaign calls are read back under Leads & Results, filtered to the Bulk channel — the same table instant calls land in.",
    },
  },
];

export const getLeadMode = (slug: LeadModeSlug) => leadModes.find((mode) => mode.slug === slug)!;

export const leadModeHref = (slug: LeadModeSlug) => `/products/${slug}` as const;

/**
 * Instant against bulk, side by side. Shown on both pages: whichever one a
 * visitor clicked, the question they ask next is how the other differs.
 */
export const leadModeComparison: { aspect: string; instant: string; bulk: string }[] = [
  {
    aspect: "What starts the call",
    instant: "The enquiry arriving. Reyvoca is told, and dials.",
    bulk: "You do. The campaign runs when you schedule it.",
  },
  {
    aspect: "How many at once",
    instant: "One — this person, right now.",
    bulk: "A whole list, hundreds of rows at a time.",
  },
  {
    aspect: "Timing",
    instant: "Seconds after the lead lands, day or night.",
    bulk: "Paced through your calling hours until the list is done.",
  },
  {
    aspect: "Where the contacts come from",
    instant: "Website form, Meta lead ad, CRM or your own webhook.",
    bulk: "A CSV upload or a segment out of your CRM.",
  },
  {
    aspect: "How it is set up",
    instant: "Connect the source once; it then runs by itself.",
    bulk: "Per campaign — upload, map, check, start.",
  },
  {
    aspect: "Where you see it",
    instant: "Calling → Instant Leads",
    bulk: "Calling → Bulk Campaigns",
  },
];
