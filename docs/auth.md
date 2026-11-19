# Authentication

Reyvoca's own email-and-password authentication, plus Google sign-in. No
third-party auth service, no extra npm dependency: `node:crypto` does the
cryptography and the file-backed store in `lib/server/db.ts` holds the rows.

## How it works, in one paragraph

A password is never stored. On sign-up it goes through **scrypt** with a fresh
16-byte random salt, and only `scrypt$64$<salt>$<hash>` is kept
(`lib/server/password.ts`). On sign-in the typed password is put through the
same function with the stored salt and compared with `timingSafeEqual`, so the
comparison takes the same time whether it fails on the first byte or the last.
A match issues a 32-byte random session token, sent to the browser in an
httpOnly cookie; the database keeps only its SHA-256
(`lib/server/session.ts`). That design means a stolen database yields neither
passwords nor usable cookies, and because each session is a row it can be
revoked — which is what "sign out of all other devices" actually does.

## The flows

| Flow | Entry | Route |
| --- | --- | --- |
| Sign up | `/get-started` | `POST /api/auth/sign-up` |
| Sign in | `/signin` | `POST /api/auth/sign-in` |
| Sign out | any header | `POST /api/auth/sign-out` |
| Confirm email | emailed link | `GET /api/auth/verify-email?token=` |
| Resend confirmation | `/verify-email` | `POST /api/auth/verify-email` |
| Forgot password | `/forgot-password` | `POST /api/auth/password-reset` |
| Set new password | emailed link → `/reset-password?token=` | `POST /api/auth/password-reset/confirm` |
| Change password | `/account` | `POST /api/auth/password` |
| Change email (2 steps) | `/account` | `PATCH /api/auth/account` |
| Edit profile | `/account` | `PATCH /api/auth/account` |
| Signed-in devices | `/account` | `GET`/`DELETE /api/auth/sessions` |
| Delete account | `/account` | `DELETE /api/auth/account` |
| Google sign-in | `/signin` | `/api/auth/google/start` → `/callback` |

## The decisions worth knowing

**Sign-up is open to anyone.** It creates the account with the address
unconfirmed and signs the person in anyway; the unconfirmed state shows as a
banner on `/requests` and `/account` rather than a wall. Blocking a new
account until it fetches an email is the pattern that loses people at the door.

**Every failure message is the same.** Wrong email, wrong password, locked
out: all answer "Incorrect email or password." The reset endpoint answers
identically whether or not an account exists. Saying more would turn either
endpoint into a way to discover who has an account here.

**Lockout counts two keys.** Failed sign-ins are counted against the email and
the client IP (`lib/server/rate-limit.ts`). Email alone would let anyone lock a
victim out of their own account on demand; IP alone would let one attacker
spread guesses across many accounts. Eight failures pause that key for fifteen
minutes, a correct password clears the count, and a successful reset or
password change clears it too, so nobody is left serving a lockout they have
already resolved.

**Emailed links are single-use, hashed and short-lived**
(`lib/server/tokens.ts`). Only the SHA-256 is stored, issuing a new link voids
the previous one, and redemption is marked inside the same transaction that
reads it, so two clicks cannot both win. Reset links last 30 minutes,
confirmation links 24 hours. The reset endpoint checks the link, then validates
the new password, and only *then* spends the token — so a mistyped password
does not cost someone their link.

**Changing a password revokes every other session.** If the reason for the
change was that somebody else got in, their cookie has to stop working too.
A "your password was changed" email goes out every time, which is how an
account takeover gets noticed.

**Changing an email takes two steps.** Asking only sends a confirmation link to
the new address; nothing changes until that link is clicked, and the old
address is then told. One unlocked laptop should not be enough to move an
account to someone else's mailbox.

**Google sign-in is the authorization-code flow with PKCE**
(`lib/server/oauth/google.ts`). `state` is the CSRF check, `nonce` ties the
identity token to the request that started it, and the token is accepted only
if the issuer, audience, expiry and nonce all check out *and* Google says the
address is verified. A Google sign-in whose email matches an existing account
**links** to it rather than creating a duplicate — safe precisely because
Google asserts the address.

**`proxy.ts` is an optimisation, not the lock.** It only asks whether a
session cookie exists, never whether it is valid, because it runs on every
request including prefetches and must not touch the database. The real checks
are `requireUser()` in API routes and `currentSession()` in protected pages.

## Email

`lib/server/mail.ts` sends through [Resend](https://resend.com) when
`RESEND_API_KEY` is set, over its HTTP API — no SDK.

With no key set, **nothing is sent**: the link is printed to the terminal
running `next dev` and listed in the operator mailbox at `/admin/mailbox`, so
every flow can be walked end to end on a laptop. Once Resend is configured the
links are deliberately *not* recorded — a live reset link in a log is a live
reset link in the wrong hands — and only the delivery record remains.

See `.env.example` for the variables and the exact Google console settings.

## Storage

Accounts, sessions, tokens, rate-limit counters, the security log and the mail
log all live in `.data/reyvoca.json`, which is gitignored. `lib/server/db.ts`
exposes only `read` and `mutate`, so moving to Postgres means rewriting that
one file.

**Before deploying:** a JSON file does not survive serverless hosting, where
the filesystem is read-only and every request may run on a different instance.
Accounts would vanish. Swap the store for a real database (Neon, Supabase,
anything Postgres) before the first real customer signs up.

## Testing it locally

```bash
npm run dev
# create an account at http://localhost:3000/get-started
# then open /admin/mailbox and click the confirmation link
```

Sign-in lockout, the reset flow and device revocation can all be exercised the
same way, with `/admin/mailbox` standing in for an inbox.
