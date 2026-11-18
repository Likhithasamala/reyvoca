/**
 * Industry pages.
 *
 * One agent, described in the vocabulary of each business that buys it. These
 * are the handful of industries Reyvoca actually sells into — the set is meant
 * to grow one entry at a time, with real copy each time, rather than being
 * generated across every trade at once.
 *
 * Nothing here claims deployments or customer counts that do not exist. Each
 * page describes what the agent does on a call and ends at the same place the
 * rest of the site does: a booked demo.
 */

export type Industry = {
  slug: string;
  /** Short label for grids and nav. */
  name: string;
  /** One line under the name in the grid. */
  tagline: string;
  /** The page's own headline. */
  headline: string;
  /** The lead paragraph under the headline. */
  intro: string;
  /** What goes wrong today, in the operator's own words. */
  problems: string[];
  /** What the agent does on a call, in order. */
  handles: { title: string; detail: string }[];
  /** The languages this trade most often needs first. */
  languages: string[];
  /** The sentence that closes the page above the demo form. */
  close: string;
};

export const industries: Industry[] = [
  {
    slug: "clinics",
    name: "Clinics & dental",
    tagline: "Appointments booked while the front desk is with a patient.",
    headline: "Your front desk is with a patient. The phone still rings.",
    intro:
      "Clinics lose appointments to a busy line, not to a competitor. A caller who reaches voicemail at 11am rarely calls back at 4pm — they call the next clinic. A voice agent answers every line at once, in the caller's own language, and books into the same slots your staff do.",
    problems: [
      "Reception is with a patient, so the second and third callers hear a ring-out.",
      "Evening and Sunday enquiries land in a voicemail nobody plays back.",
      "Staff repeat the same four questions — timings, fees, location, parking — all day.",
      "Walk-ins get priority over the phone, so the phone quietly loses.",
    ],
    handles: [
      {
        title: "Answers every line at once",
        detail:
          "Ten callers at 11am are ten conversations, not nine busy tones. Nobody waits and nobody is put on hold.",
      },
      {
        title: "Quotes only what you told it",
        detail:
          "Timings, consultation fees, which doctors sit which days. If the answer is not in its instructions it says so and offers a callback rather than inventing one.",
      },
      {
        title: "Takes the appointment",
        detail:
          "Name, reason for visit, preferred day, phone number — read back for confirmation before anything is written down.",
      },
      {
        title: "Flags what needs a human",
        detail:
          "Anything clinical, an upset caller, or a question it cannot ground in your instructions comes to you with the full transcript attached.",
      },
    ],
    languages: ["English", "Hindi", "Telugu"],
    close:
      "Bring us a week of your call log and we will tell you how many of those calls an agent could have handled.",
  },
  {
    slug: "real-estate",
    name: "Real estate",
    tagline: "Every portal enquiry called back within seconds.",
    headline: "The site visit goes to whoever calls back first.",
    intro:
      "A buyer enquiring on a property portal usually enquires on four listings at once. The agent who reaches them first gets the site visit; everyone else gets a dead number a day later. Reyvoca calls the moment the enquiry lands, qualifies budget and locality, and hands you the ones worth your Saturday.",
    problems: [
      "Portal leads arrive faster than the team can dial them.",
      "By the time a lead is called back, three competitors already have.",
      "Half the enquiries are nowhere near the budget for the listing.",
      "Nobody logs what was said, so the follow-up starts from zero.",
    ],
    handles: [
      {
        title: "Calls within seconds of the enquiry",
        detail:
          "Not within the hour, and not when someone gets to the list. The moment the lead lands, while the buyer is still looking at the listing.",
      },
      {
        title: "Qualifies before you spend a Saturday",
        detail:
          "Budget range, preferred locality, possession timeline, loan or self-funded, and whether they are the decision-maker.",
      },
      {
        title: "Books the site visit",
        detail: "Offers the slots you are actually free and confirms the time back to the buyer.",
      },
      {
        title: "Writes the handover",
        detail:
          "Every call ends with a transcript, a summary and the structured outcome, so your closer opens with context instead of questions.",
      },
    ],
    languages: ["English", "Hindi", "Telugu", "Marathi"],
    close: "Give us your portal feed and we will show you what a sixty-second callback does to your site-visit rate.",
  },
  {
    slug: "education",
    name: "Education & coaching",
    tagline: "Admission enquiries answered the evening they come in.",
    headline: "Admission season is three weeks. Your counsellors are six people.",
    intro:
      "Enquiries arrive in a burst and go cold in a day. Counsellor time is the bottleneck, and most of it is spent on the same questions about fees, batches and eligibility rather than on the parents who are genuinely close to enrolling.",
    problems: [
      "Enquiry volume triples in admission season and the team does not.",
      "Parents enquire at 9pm, counsellors call at 11am the next day.",
      "The same fee and batch-timing questions are answered hundreds of times.",
      "Nobody knows which enquiries were never called at all.",
    ],
    handles: [
      {
        title: "Takes the evening rush",
        detail: "Enquiries that arrive after hours are spoken to that evening, not queued for the morning.",
      },
      {
        title: "Answers the standard questions",
        detail:
          "Course structure, batch timings, fee and instalment options, eligibility — exactly as you have written them, never improvised.",
      },
      {
        title: "Separates serious from browsing",
        detail:
          "Which course, which city, whether the student has finished the prerequisite, and how soon they intend to start.",
      },
      {
        title: "Books the counsellor slot",
        detail: "Your counsellors open their day with a calendar of parents who already want to enrol.",
      },
    ],
    languages: ["English", "Hindi", "Telugu", "Tamil"],
    close: "Tell us your admission timeline and we will build the agent before your next intake opens.",
  },
  {
    slug: "automotive",
    name: "Automotive dealerships",
    tagline: "Test drives booked and service reminders that actually connect.",
    headline: "The enquiry came in on Sunday. Your showroom opens Monday.",
    intro:
      "Car buyers research in the evening and on weekends, which is exactly when a showroom is least able to pick up. Service reminders have the opposite problem — they are made by people who would rather be doing anything else, so they do not get made.",
    problems: [
      "Weekend and late-evening enquiries wait until the showroom reopens.",
      "Test-drive bookings are taken on paper and lost between shifts.",
      "Service-due reminders need hundreds of outbound calls nobody wants to make.",
      "Finance and exchange questions get vague answers that cost trust.",
    ],
    handles: [
      {
        title: "Takes the after-hours enquiry",
        detail: "Variant, colour, on-road price, availability — answered when the buyer asks, not when you open.",
      },
      {
        title: "Books the test drive",
        detail: "Preferred model, preferred day, licence in hand, and a confirmation read back before it is booked.",
      },
      {
        title: "Runs service reminders",
        detail:
          "The whole due list, called on a schedule with your own retry rules, and the slot confirmed on the call.",
      },
      {
        title: "Hands finance to a person",
        detail:
          "Exchange valuation and loan eligibility are human conversations. The agent collects the details and passes them on rather than guessing.",
      },
    ],
    languages: ["English", "Hindi", "Telugu", "Kannada"],
    close: "Send us a month of missed calls and we will show you the test drives in them.",
  },
  {
    slug: "insurance",
    name: "Insurance",
    tagline: "Renewals chased without a floor full of dialers.",
    headline: "A renewal missed by a week is a policy lost for a year.",
    intro:
      "Renewal calling is high volume, low complexity and relentlessly repetitive — which is why it is done badly almost everywhere. An agent works the whole due list on schedule, in the policyholder's language, and escalates the moment a real question arrives.",
    problems: [
      "The renewal list is longer than the calling team, every single month.",
      "Lapsed policies are noticed after they lapse, not before.",
      "Policyholders answer in their own language and the caller cannot follow.",
      "No record of who was reached, who said what, or who to try again.",
    ],
    handles: [
      {
        title: "Works the due list on schedule",
        detail: "Calling windows, retry rules and a do-not-call list you control, so nobody is rung twice in a day.",
      },
      {
        title: "Speaks the policyholder's language",
        detail:
          "The call opens in the language on file and switches mid-conversation if the person answers in another one.",
      },
      {
        title: "Confirms intent clearly",
        detail: "Renewing, not renewing, or wants to talk to an advisor — captured as a structured outcome, not a note.",
      },
      {
        title: "Never improvises a policy detail",
        detail:
          "Coverage, claims and premium changes go to a licensed human. The agent is there to reach people, not to advise them.",
      },
    ],
    languages: ["English", "Hindi", "Telugu", "Bengali"],
    close: "Bring one month of renewals and we will run them as a pilot before you commit to anything.",
  },
  {
    slug: "retail",
    name: "Retail & D2C",
    tagline: "Order confirmations and COD checks, without the call centre.",
    headline: "Every unconfirmed COD order is a van going out on a guess.",
    intro:
      "Cash-on-delivery works right up until the customer is not home, or never meant to buy. Confirming orders by phone fixes it, but it is thousands of near-identical calls a month — the exact shape of work worth handing to an agent.",
    problems: [
      "COD orders ship unconfirmed and come back as returns.",
      "Confirmation calling is too much volume to staff and too dull to retain staff for.",
      "Delivery questions arrive all day and repeat themselves endlessly.",
      "Customers answer in a language the confirmation script was not written in.",
    ],
    handles: [
      {
        title: "Confirms the order before it ships",
        detail: "Item, amount, address and a clear yes before a van is loaded.",
      },
      {
        title: "Catches the address problem early",
        detail: "A wrong pin code or an unreachable landmark surfaces on the call, not at the doorstep.",
      },
      {
        title: "Answers the where-is-my-order call",
        detail: "Grounded in the status you give it — never a reassuring guess about a parcel it cannot see.",
      },
      {
        title: "Escalates refunds to a person",
        detail: "Money going back to a customer is a human decision. The agent gathers the details and hands over.",
      },
    ],
    languages: ["English", "Hindi", "Tamil", "Gujarati"],
    close: "Share a week of COD orders and we will show you the returns a confirmation call removes.",
  },
];

export const getIndustry = (slug: string) => industries.find((industry) => industry.slug === slug);
