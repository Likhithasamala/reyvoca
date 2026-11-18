/**
 * The languages a Reyvoca agent can hold a call in.
 *
 * This list is not aspirational: it mirrors what the voice engine actually
 * reports at `GET /api/engine`, which is the same set the agent editor offers.
 * If the engine gains a language, add it here; never the other way round.
 */

export type CallLanguage = {
  /** The name the engine and the agent editor both use. */
  name: string;
  /** Written in its own script. */
  native: string;
  /** Where it is the language a caller will answer in. */
  region: string;
};

export const callLanguages: CallLanguage[] = [
  { name: "English", native: "English", region: "All India" },
  { name: "Hindi", native: "हिन्दी", region: "North & Central India" },
  { name: "Telugu", native: "తెలుగు", region: "Telangana & Andhra Pradesh" },
  { name: "Tamil", native: "தமிழ்", region: "Tamil Nadu" },
  { name: "Kannada", native: "ಕನ್ನಡ", region: "Karnataka" },
  { name: "Marathi", native: "मराठी", region: "Maharashtra" },
  { name: "Bengali", native: "বাংলা", region: "West Bengal" },
  { name: "Gujarati", native: "ગુજરાતી", region: "Gujarat" },
  { name: "Malayalam", native: "മലയാളം", region: "Kerala" },
  { name: "Punjabi", native: "ਪੰਜਾਬੀ", region: "Punjab" },
  { name: "Odia", native: "ଓଡ଼ିଆ", region: "Odisha" },
];

/**
 * What the languages section promises, kept narrow on purpose.
 *
 * The agent starts a call in the language you set and may move to any other
 * language you allowed it — mid-call, without being asked twice.
 */
export const languagesSection = {
  id: "languages",
  eyebrow: "Languages",
  heading: "Your customer answers in their language.",
  subheading: "So does the agent.",
  body: "Set the language a call opens in and the ones it may move to. When a caller switches mid-sentence, the agent follows — the voice and the listening both change with it, not just the words.",
  note: "Every language above is one the voice engine reports today, not a roadmap.",
};
