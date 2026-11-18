"use client";

import {
  Check,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Action } from "@/components/panel/action";
import { PageHeader } from "@/components/panel/page-header";
import { SectionTabs } from "@/components/panel/section-tabs";
import { cn } from "@/lib/cn";
import {
  PROVIDER_CATEGORIES,
  type ProviderCategory,
  type ProviderMeta,
} from "@/lib/providers/catalog";
import {
  deleteProviderKey,
  saveProviderKey,
  useProviders,
  type ProviderRecord,
} from "@/lib/providers/store";

const TAB_LABELS = PROVIDER_CATEGORIES.map((category) => category.label);

/** Brand-coloured monogram tile — consistent with the dashboard's icon tiles. */
function ProviderMark({ provider, size = 44 }: { provider: ProviderMeta; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-xl font-bold text-white"
      style={{ width: size, height: size, background: provider.color, fontSize: size * 0.42 }}
    >
      {provider.name[0]}
    </span>
  );
}

function ProviderCard({
  provider,
  records,
  onOpen,
}: {
  provider: ProviderMeta;
  records: ProviderRecord[];
  onOpen: () => void;
}) {
  const connected = records.length > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex flex-col items-start gap-3 rounded-xl border bg-surface p-4 text-left transition-colors hover:border-ink-subtle sm:p-5",
        connected ? "border-line-strong" : "border-line",
      )}
    >
      <div className="flex w-full items-start justify-between">
        <ProviderMark provider={provider} />
        {connected && (
          <span
            aria-hidden="true"
            className="mt-1 size-2 rounded-full"
            style={{ background: provider.color }}
          />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink">{provider.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">{provider.tag}</p>
      </div>
      {connected ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success-line bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
          {records.length} key{records.length !== 1 ? "s" : ""}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted transition-colors group-hover:border-line-strong">
          <Plus className="size-3" aria-hidden="true" /> Connect
        </span>
      )}
    </button>
  );
}

function KeyModal({
  category,
  provider,
  records,
  onClose,
}: {
  category: ProviderCategory;
  provider: ProviderMeta;
  records: ProviderRecord[];
  onClose: () => void;
}) {
  const [adding, setAdding] = useState(records.length === 0);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmFor, setConfirmFor] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!apiKey.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      // The server verifies the key against the provider before saving it.
      await saveProviderKey({
        providerType: category.key,
        providerName: provider.id,
        label: label.trim() || "Default",
        apiKey: apiKey.trim(),
        settings: extra,
      });
      setApiKey("");
      setLabel("");
      setExtra({});
      setAdding(false);
    } catch (cause) {
      setError((cause as Error).message);
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setConfirmFor(null);
    try {
      await deleteProviderKey(id);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={provider.name}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-float"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <ProviderMark provider={provider} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{provider.name}</p>
            <p className="truncate text-xs text-ink-muted">{provider.tag}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {error && (
            <div
              role="alert"
              className="mb-3 flex items-start justify-between gap-2 rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-xs text-danger"
            >
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss">
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-subtle uppercase">
            API keys
          </p>

          {records.length === 0 && !adding && (
            <p className="mt-2 text-sm text-ink-muted">No keys yet.</p>
          )}

          <div className="mt-2 space-y-2">
            {records.map((record) => (
              <div
                key={record.id}
                className="relative flex items-center gap-3 rounded-lg border border-line bg-surface-muted/50 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8125rem] font-medium text-ink">{record.label || "Default"}</p>
                  <code className="text-xs text-ink-subtle">{record.keyMasked || "••••"}</code>
                </div>
                {record.isValidated ? (
                  <span className="text-success" title="Validated">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="text-ink-subtle" title="Not verified">
                    <Clock className="size-4" aria-hidden="true" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmFor(record.id)}
                  aria-label={`Delete ${record.label || "key"}`}
                  className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>

                {confirmFor === record.id && (
                  <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-lg border border-line bg-surface p-3 shadow-lift">
                    <p className="text-sm font-semibold text-ink">Delete API key?</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Agents using this key will stop working. This can&rsquo;t be undone.
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <Action size="sm" variant="secondary" onClick={() => setConfirmFor(null)}>
                        Cancel
                      </Action>
                      <Action
                        size="sm"
                        className="bg-danger text-white hover:bg-danger"
                        onClick={() => remove(record.id)}
                      >
                        Delete key
                      </Action>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {adding ? (
            <form onSubmit={save} autoComplete="off" className="mt-4 space-y-3.5">
              <div>
                <label htmlFor="provider-key-label" className="mb-1.5 block text-[0.8125rem] font-medium text-ink">
                  Label
                </label>
                <input
                  id="provider-key-label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Production"
                  autoComplete="off"
                  className="block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="provider-key-value" className="mb-1.5 block text-[0.8125rem] font-medium text-ink">
                  API key
                </label>
                <div className="relative">
                  <input
                    id="provider-key-value"
                    type={show ? "text" : "password"}
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={provider.placeholder || "Enter key"}
                    autoComplete="new-password"
                    required
                    className="block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 pr-10 text-sm text-ink placeholder:text-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((value) => !value)}
                    aria-label={show ? "Hide key" : "Show key"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-subtle hover:text-ink"
                  >
                    {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              {(provider.extraFields ?? []).map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={`provider-extra-${field.name}`}
                    className="mb-1.5 block text-[0.8125rem] font-medium text-ink"
                  >
                    {field.label}
                  </label>
                  <input
                    id={`provider-extra-${field.name}`}
                    value={extra[field.name] ?? ""}
                    onChange={(event) =>
                      setExtra((value) => ({ ...value, [field.name]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                    autoComplete="off"
                    className="block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
                  />
                </div>
              ))}
              {provider.help && (
                <a
                  href={provider.help.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent-strong hover:underline"
                >
                  {provider.help.label}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Action type="submit" disabled={busy || !apiKey.trim()}>
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Verifying…
                    </>
                  ) : (
                    "Save key"
                  )}
                </Action>
                {records.length > 0 && (
                  <Action
                    variant="secondary"
                    onClick={() => {
                      setAdding(false);
                      setApiKey("");
                      setError("");
                    }}
                  >
                    Cancel
                  </Action>
                )}
              </div>
            </form>
          ) : (
            <Action variant="secondary" size="sm" className="mt-4" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" aria-hidden="true" /> Add key
            </Action>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProvidersView() {
  const { providers: records, ready, error } = useProviders();
  const [tab, setTab] = useState(TAB_LABELS[0]);
  const [openProvider, setOpenProvider] = useState<ProviderMeta | null>(null);

  const category =
    PROVIDER_CATEGORIES.find((entry) => entry.label === tab) ?? PROVIDER_CATEGORIES[0];
  const categoryRecords = records.filter((record) => record.providerType === category.key);
  const recordsFor = (providerId: string) =>
    categoryRecords.filter((record) => record.providerName === providerId);

  const connectedCount = new Set(categoryRecords.map((record) => record.providerName)).size;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Providers"
        description="The services every customer call runs on. Keys are verified with the provider, stored server-side and never shown again in full."
      />

      <p className="flex items-start gap-2 rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
        Operators only. Customer dashboards show the engine as live or pending and never name a vendor, so changing a
        provider here changes every workspace at once.
      </p>

      <SectionTabs
        tabs={TAB_LABELS}
        active={tab}
        onChange={(next) => {
          // Closing the modal on a tab switch keeps it from showing another category's records.
          setOpenProvider(null);
          setTab(next);
        }}
        label="Provider categories"
      />

      <div>
        <p className="text-sm leading-relaxed text-ink-muted text-pretty">
          {category.desc}
          {categoryRecords.length > 0 && (
            <span className="text-ink-subtle">
              {" "}
              · {connectedCount} connected · {categoryRecords.length} key
              {categoryRecords.length !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {!ready ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-[150px] rounded-xl border border-line bg-surface-muted/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {category.providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              records={recordsFor(provider.id)}
              onOpen={() => setOpenProvider(provider)}
            />
          ))}
        </div>
      )}

      {openProvider && (
        <KeyModal
          category={category}
          provider={openProvider}
          records={recordsFor(openProvider.id)}
          onClose={() => setOpenProvider(null)}
        />
      )}
    </div>
  );
}
