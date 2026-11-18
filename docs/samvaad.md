# Web calls on Sarvam Voice Agents (Samvaad)

Browser calls from the agent editor run entirely on Sarvam: speech recognition,
the model, the voice and turn-taking. Reyvoca supplies *who the agent is*.

Sarvam has no public API for creating agents, so Reyvoca does not create one
per customer agent. Instead, every Reyvoca agent runs on **one general-purpose
Sarvam agent**. At call start the browser seeds that agent's input variables
with the Reyvoca agent's name, instructions and languages, and overrides its
opening line and starting language. A customer's agent is callable the moment
it is saved.

## How a call flows

1. The editor asks `GET /api/calls/web` whether Sarvam is configured and gets
   the org, workspace and app ids (never the key).
2. The Sarvam browser SDK (`sarvam-conv-ai-sdk/browser`) requests a signed
   WebSocket URL from `/api/samvaad/orgs/…/apps/…/url`. That route adds
   `SAMVAAD_API_KEY` server-side and only signs for `SAMVAAD_APP_ID`.
3. The WebSocket goes straight to Sarvam. The start message carries
   `agent_variables`, `initial_bot_message` and `initial_language_name`.
4. Before connecting, `POST /api/calls/web` opens the call record and returns
   a tag (`reyvoca-call-<id>`). The browser sends it to Sarvam as
   `user_identifier`; `PATCH /api/calls/:id` closes the call with its duration.
5. `GET /api/calls/:id/transcript` finds Sarvam's record by that tag (analytics
   interactions API) and returns its transcript. Sarvam files a call 30–60 s
   after hang-up; until then the route answers `pending: true`. The web call
   panel polls it and shows the transcript when the call streamed none live.

## One-time setup of the Sarvam agent

On indus.sarvam.ai → Voice Agents, create an agent (for example
"Reyvoca Runtime") and configure:

**Variables → Input variables** — create these three, each with *Send to LLM*
left on:

| Name | Default value |
|---|---|
| `reyvoca_agent_name` | `Assistant` |
| `reyvoca_instructions` | `Be a helpful, concise voice assistant.` |
| `reyvoca_languages` | `English` |

**Instructions** — insert the variables with `@`:

> You are @reyvoca_agent_name, a voice agent on a live call.
> Follow these instructions from the business exactly; they define your role,
> knowledge and goals:
>
> @reyvoca_instructions
>
> Speak only in these languages: @reyvoca_languages. Reply in the caller's
> language when it is one of them. Keep replies short and conversational —
> this is a phone call, not a chat.

**Languages** — enable every language Reyvoca agents may use (English, Hindi,
Telugu, …). `initial_language_name` must be one of the agent's allowed
languages or Sarvam rejects the call.

**Welcome message** — anything; each call overrides it with the Reyvoca
agent's first message.

**Commit** a version. The browser connects to the latest committed version
unless `SAMVAAD_APP_VERSION` pins one; an agent with no committed version
cannot take calls.

Then copy the agent's id into `.env.local`:

```
SAMVAAD_APP_ID=<the agent id>
```

and restart `npm run dev`.

## Environment

| Variable | Purpose |
|---|---|
| `SAMVAAD_API_KEY` | Samvaad API key (Settings → API Key). Server-only |
| `SAMVAAD_ORG_ID` | Org id from the same page |
| `SAMVAAD_WORKSPACE_ID` | Workspace id from the same page |
| `SAMVAAD_APP_ID` | The general-purpose agent above |
| `SAMVAAD_APP_VERSION` | Optional: pin a committed version |

With any of the first four missing, the editor falls back to the in-browser
call pipeline in `components/dashboard/agents/web-call.tsx`.

## Known limits

- **Skip welcome** cannot be expressed per call; with it on, the Sarvam
  agent's own welcome message plays.
- Agent **tools** and the **inbound webhook** configured in Reyvoca are not
  passed to Sarvam yet. Sarvam tools live on the Sarvam agent.
- An agent only receives the `agent_variables` it defines. On an agent without
  the three `reyvoca_*` variables, the opening line still changes per call but
  the instructions do not — it behaves as whatever that agent was built for.

## Billing (prepaid credits)

Customers pay per agent minute from a prepaid wallet; 1 credit = ₹1, held in
paise. The per-minute price is Sarvam's rate plus Reyvoca's margin (defaults
₹3.50 + ₹3.00 = ₹6.50), set by an operator at `/admin/billing`. Customers only
ever see the total. Code: `lib/server/billing.ts`.

- **Start:** `POST /api/calls/web` refuses a call (402 `insufficient_credits`)
  unless one minute is affordable, and freezes the prices on the call. The
  signing relay re-checks the balance.
- **Live:** the browser calls `POST /api/calls/:id/meter` on connect and every
  10 s. Minutes are counted on the server clock and each is charged as it
  starts, matching Sarvam's round-up. When the next minute is unaffordable the
  reply says so and the browser hangs up just before the paid minute ends.
- **End:** `PATCH /api/calls/:id` charges through the last started minute.
- **Settle:** once Sarvam's record exists (transcript route, or the reconcile
  pass run by `GET /api/billing` and `GET /api/admin/billing`), the call is
  re-billed to Sarvam's own duration and the difference posted to the ledger.
  Calls whose browser vanished are closed after 2 min without a meter ping.
- **Credits in:** customers request a pack (`POST /api/billing/topup-requests`);
  an operator adds credits at `/admin/billing` after payment, which fulfils
  the request. Every wallet change is a ledger entry.
