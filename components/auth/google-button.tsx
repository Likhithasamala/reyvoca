const GOOGLE_PATH = "/api/auth/google/start";

type GoogleButtonProps = {
  /** False when GOOGLE_CLIENT_ID / SECRET are unset; the button then explains. */
  enabled: boolean;
  /** Where to land after signing in, carried through the Google round trip. */
  next?: string;
  label?: string;
};

/**
 * "Continue with Google."
 *
 * A plain link, not a fetch: OAuth is a full-page journey to Google and back,
 * so there is nothing for JavaScript to do here. That also means it works
 * before the page has hydrated.
 */
export function GoogleButton({ enabled, next, label = "Continue with Google" }: GoogleButtonProps) {
  const href = next ? `${GOOGLE_PATH}?next=${encodeURIComponent(next)}` : GOOGLE_PATH;

  return (
    <>
      {enabled ? (
        <a
          href={href}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-line-strong bg-surface text-[0.9375rem] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-surface-muted"
        >
          <GoogleMark />
          {label}
        </a>
      ) : (
        <>
          <button
            type="button"
            disabled
            aria-describedby="google-unconfigured"
            className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-full border border-line-strong bg-surface text-[0.9375rem] font-medium text-ink opacity-70"
          >
            <GoogleMark />
            {label}
          </button>
          <p id="google-unconfigured" className="mt-2 text-center text-xs text-ink-subtle">
            Google sign-in needs its credentials configured.
          </p>
        </>
      )}

      <div className="my-6 flex items-center gap-3 text-xs text-ink-subtle" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.55 10.55 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
