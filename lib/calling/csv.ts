"use client";

/**
 * CSV handling for Bulk Campaigns.
 *
 * Parsing and validation happen entirely in the browser: an uploaded contact
 * list is customer data, so it is never posted anywhere, written to disk or
 * logged while there is no backend to receive it securely.
 */
import type { CampaignContact } from "@/types/calling";
import { isValidEmail, isValidPhone, normalizePhone } from "./normalize";

/* ------------------------------------------------------------------ */
/* The Reyvoca contact format                                          */
/* ------------------------------------------------------------------ */

/** Fields a CSV column can be mapped onto. `phone` is the only required one. */
export const CONTACT_FIELDS = [
  "phone",
  "name",
  "email",
  "requirement",
  "language",
  "city",
  "source",
  "external_id",
  "notes",
] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

export const CONTACT_FIELD_LABELS: Record<ContactField, string> = {
  phone: "Phone",
  name: "Name",
  email: "Email",
  requirement: "Requirement",
  language: "Language",
  city: "City",
  source: "Source",
  external_id: "External ID",
  notes: "Notes",
};

/** Header spellings we recognise automatically when suggesting a mapping. */
const FIELD_ALIASES: Record<ContactField, string[]> = {
  phone: ["phone", "mobile", "phone number", "mobile number", "contact", "contact number", "number", "tel"],
  name: ["name", "full name", "customer name", "contact name", "first name", "lead name"],
  email: ["email", "email id", "e-mail", "email address", "mail"],
  requirement: ["requirement", "need", "enquiry", "inquiry", "interest", "property need", "notes on requirement"],
  language: ["language", "preferred language", "lang"],
  city: ["city", "location", "town", "area"],
  source: ["source", "lead source", "campaign source", "origin"],
  external_id: ["external_id", "external id", "lead id", "crm id", "record id", "id"],
  notes: ["notes", "note", "comment", "comments", "remarks"],
};

/** Safe, obviously fictional template offered as a download. */
export const CSV_TEMPLATE = [
  "name,phone,email,requirement,language,city,external_id,notes",
  "Demo Customer,+910000000001,demo1@example.com,Product enquiry,English,Hyderabad,DEMO-001,Demo record",
  "Sample Contact,+910000000002,demo2@example.com,Renewal question,English,Bengaluru,DEMO-002,Demo record",
  "Example Lead,+910000000003,demo3@example.com,Pricing information,Hindi,Pune,DEMO-003,Demo record",
].join("\n");

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

/** Row ids only need to be unique within one upload. */
const contactId = () =>
  `c_${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
  /** Rows that were entirely empty and skipped during parsing. */
  blankRows: number;
};

/**
 * Minimal RFC-4180 reader: handles quoted fields, escaped quotes and commas
 * inside quotes. Enough for contact lists, with no dependency added.
 */
export function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;
  let blankRows = 0;

  const pushValue = () => {
    row.push(value.trim());
    value = "";
  };
  const pushRow = () => {
    pushValue();
    if (row.every((cell) => cell === "")) blankRows += 1;
    else rows.push(row);
    row = [];
  };

  const normalized = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          value += '"';
          i += 1;
        } else inQuotes = false;
      } else value += char;
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ",") pushValue();
    else if (char === "\n") pushRow();
    else value += char;
  }
  if (value !== "" || row.length > 0) pushRow();

  const [headers = [], ...dataRows] = rows;
  return { headers, rows: dataRows, blankRows };
}

/** Best-guess mapping from the file's headers onto Reyvoca fields. */
export function suggestMapping(headers: string[]): Record<string, ContactField | ""> {
  const mapping: Record<string, ContactField | ""> = {};
  const taken = new Set<ContactField>();

  for (const header of headers) {
    const key = header.trim().toLowerCase();
    const match = CONTACT_FIELDS.find(
      (field) => !taken.has(field) && FIELD_ALIASES[field].includes(key),
    );
    if (match) {
      mapping[header] = match;
      taken.add(match);
    } else {
      mapping[header] = "";
    }
  }
  return mapping;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export type ValidationSummary = {
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
  blankRows: number;
  /** Counts keyed by the problem, for the breakdown list. */
  issues: { label: string; count: number }[];
};

export type ValidationResult = {
  contacts: CampaignContact[];
  summary: ValidationSummary;
};

/**
 * Turns mapped rows into contacts and explains every row that cannot be called.
 *
 * Invalid and duplicate rows are kept (so the user can see them) but marked so
 * they are never dialled.
 */
export function validateContacts(
  parsed: ParsedCsv,
  mapping: Record<string, ContactField | "">,
): ValidationResult {
  const columnFor = (field: ContactField) =>
    parsed.headers.findIndex((header) => mapping[header] === field);

  const index = {
    phone: columnFor("phone"),
    name: columnFor("name"),
    email: columnFor("email"),
    requirement: columnFor("requirement"),
    language: columnFor("language"),
    city: columnFor("city"),
    externalId: columnFor("external_id"),
    notes: columnFor("notes"),
  };

  const unmapped = parsed.headers
    .map((header, position) => ({ header, position }))
    .filter(({ header }) => !mapping[header]);

  const seenPhones = new Set<string>();
  const seenExternalIds = new Set<string>();
  const issues = new Map<string, number>();
  const note = (label: string) => issues.set(label, (issues.get(label) ?? 0) + 1);

  const at = (row: string[], position: number) =>
    position >= 0 ? (row[position] ?? "").trim() : "";

  let duplicates = 0;
  let invalid = 0;

  const contacts: CampaignContact[] = parsed.rows.map((row) => {
    const rawPhone = at(row, index.phone);
    const email = at(row, index.email);
    const externalId = at(row, index.externalId);

    // Unmapped columns are preserved rather than discarded.
    const metadata: Record<string, string> = {};
    for (const { header, position } of unmapped) {
      const cell = at(row, position);
      if (cell) metadata[header] = cell;
    }

    const contact: CampaignContact = {
      id: contactId(),
      name: at(row, index.name) || undefined,
      phone: rawPhone ? normalizePhone(rawPhone) : "",
      email: email || undefined,
      requirement: at(row, index.requirement) || undefined,
      language: at(row, index.language) || undefined,
      city: at(row, index.city) || undefined,
      externalId: externalId || undefined,
      notes: at(row, index.notes) || undefined,
      metadata: Object.keys(metadata).length ? metadata : undefined,
      status: "received",
    };

    if (!rawPhone) {
      contact.invalidReason = "Phone number required";
      note("Missing phone number");
      invalid += 1;
      return contact;
    }
    if (!isValidPhone(rawPhone)) {
      contact.invalidReason = "Phone number is not callable";
      note("Invalid phone format");
      invalid += 1;
      return contact;
    }
    if (seenPhones.has(contact.phone)) {
      contact.invalidReason = "Duplicate phone number";
      note("Duplicate phone number");
      duplicates += 1;
      return contact;
    }
    if (externalId && seenExternalIds.has(externalId)) {
      contact.invalidReason = "Duplicate external ID";
      note("Duplicate external ID");
      duplicates += 1;
      return contact;
    }

    // Email problems do not block a call — the number is what matters.
    if (email && !isValidEmail(email)) {
      contact.email = undefined;
      note("Invalid email (ignored)");
    }

    seenPhones.add(contact.phone);
    if (externalId) seenExternalIds.add(externalId);
    contact.status = "queued";
    return contact;
  });

  if (parsed.blankRows) issues.set("Blank rows skipped", parsed.blankRows);

  return {
    contacts,
    summary: {
      total: parsed.rows.length,
      valid: contacts.filter((contact) => !contact.invalidReason).length,
      duplicates,
      invalid,
      blankRows: parsed.blankRows,
      issues: [...issues.entries()].map(([label, count]) => ({ label, count })),
    },
  };
}

/** Triggers a download of the template without writing a file to the repo. */
export function downloadCsvTemplate(): void {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reyvoca-contacts-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
