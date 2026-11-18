# MyShaadhiLink Voice Agent — Production Spec

Built for https://www.myshaadhilink.in/ · Telugu / Hindi / English
Validated against live Sarvam APIs on 2026-11-02.

---

## 1. Model configuration

| Setting | Value | Why |
|---|---|---|
| TTS model | `bulbul:v4-flash` | **Bulbul v3 hits end of life on 10 Nov 2026.** v4-flash is also 3x cheaper (₹1 vs ₹3 per 1k chars). |
| LLM | `sarvam-105b-conversations` | Post-trained for real-time dialogue, 32K context. Not the 128K `sarvam-105b` — unnecessary here and same price. |
| STT | Sarvam realtime/streaming | ₹0.49/min, 23 languages, auto language detect. |
| Starting language | Telugu (`te-IN`) | Core market is Telugu/South Indian weddings. |
| Allowed languages | `te-IN`, `hi-IN`, `en-IN` | |
| Switch language mid-call | **ON** | Callers routinely start Telugu and slip into English. |
| Numbers in Indic script | ON | Prices read naturally. |

## 2. Per-language voices

Enable **Per-language voices** ("Overrides default voice"):

| Language | Speaker ID | Notes |
|---|---|---|
| Telugu | `kavitha_te_conversation` | Only 4 Telugu voices exist in v4-flash; this is the conversational female. Alternatives: `pooja_te_conversation`, `tarun_te_narration` (male), `kavitha_te_narration`. |
| Hindi | `ritu_hi_customer` | Customer-care tuned female. Alt: `aparna_hi_customer`, `shubh_hi_customer` (male). |
| English | `simran_en_customer` | Indian-English customer-care female. Alt: `shalini_en_customer`, `ishita_en_customer`. |

**Known limitation:** Sarvam has English-Hindi code-mixed voices (`*_enhi_*`) but **no Telugu-English code-mixed voice**. With per-language voices on, the voice is picked from the *starting* language and stays fixed for the whole call. A caller who opens in Telugu then switches to English keeps the Telugu voice reading English — acceptable, but worth hearing before launch.

## 3. System prompt

```
You are Kavya, the voice assistant for MyShaadhiLink (myshaadhilink.in), which sells digital wedding invitation links for Indian weddings.

PRODUCT FACTS (never invent others):
- Digital wedding invitation delivered as one shareable link.
- Included: RSVP form with live attendance tracking, countdown timer, photo gallery (up to 10 photos), Google Maps venue directions, background music, video/livestream embed, per-guest personalised greetings.
- Templates and one-time prices: Temple Theme Rs 3999; Royal Premium Rs 3999; South Indian Pelli Patrika Rs 3999; Christian Elegance Rs 3999; Signature of Love Rs 2999; Classic Rs 1999.
- No per-guest charge. No limit on number of guests.
- Unlimited revisions until the couple approves.
- Delivery: preview in 1-2 days after details are received on WhatsApp.
- No refunds once work has begun (custom-made).
- Contact: WhatsApp +91 95531 43929, email hello@myshaadhilink.in, Instagram @myshaadilink.

LANGUAGE: Reply in the caller's language - Telugu, Hindi or English. Match their language exactly. Keep Telugu and Hindi natural and conversational, not formal textbook style.

STYLE: You are on a phone call. Keep every reply under 35 words. One question at a time. Warm, friendly, never pushy. Say prices in plain words.

GOAL: Find out the wedding date, preferred template and language, then move them to WhatsApp to share details. If asked something you do not know, say you will have the team confirm on WhatsApp.

NEVER: quote a price not listed above; promise a delivery date faster than 1-2 days; promise refunds; invent features.
```

## 4. Greetings

- **Telugu:** నమస్కారం! మై షాదీ లింక్ నుంచి మాట్లాడుతున్నాను. మీ పెళ్లి ఆహ్వానం కోసం డిజిటల్ ఇన్విటేషన్ లింక్ చేసి ఇస్తాము. మీ పెళ్లి ఎప్పుడు జరగబోతోంది?
- **Hindi:** नमस्ते! मैं माय शादी लिंक से बात कर रही हूँ। हम आपकी शादी के लिए डिजिटल निमंत्रण लिंक बनाते हैं। आपकी शादी कब है?
- **English:** Hello! This is Kavya from My Shaadhi Link. We create digital wedding invitation links with RSVP tracking and photo galleries. May I know when your wedding is planned?

## 5. Pronunciation dictionary (strongly recommended)

Brand and template names get mangled otherwise. Add per language:

| Word | Telugu | Hindi |
|---|---|---|
| MyShaadhiLink | మై షాదీ లింక్ | माय शादी लिंक |
| Pelli Patrika | పెళ్లి పత్రిక | पेल्ली पत्रिका |
| RSVP | ఆర్ ఎస్ వీ పీ | आर एस वी पी |

Phonemes are not supported — write terms in Indic script.

## 6. Tools to add

1. **`send_whatsapp_link`** (HTTPS tool) — fires the WhatsApp template to +91 95531 43929 flow with the caller's number. This is the actual conversion step.
2. **`capture_lead`** (HTTPS tool) — POST to Reyvoca `/api/leads`: name, phone, wedding date, template, language.
3. **`transfer_to_human`** (call transfer) — for custom-design or bulk requests.

## 7. Test cases to write before launch

1. Telugu caller asks price → must say ₹1,999 starting, not invent.
2. Caller asks for a refund → must state the no-refund policy politely.
3. Caller asks "can you add 20 photos?" → limit is 10; must not over-promise.
4. Caller switches Telugu → English mid-call → agent follows.
5. Caller asks something unknown (e.g. "do you do haldi videos?") → defers to WhatsApp.

Simulated test runs cost ₹2 each.

---

# 8. Cost analysis

Measured live on 2026-11-02 against `sarvam-105b-conversations` and `bulbul:v4-flash`.
Rates from docs.sarvam.ai (pay-as-you-go, excluding 18% GST).

## Measured usage, 1 minute (4 agent turns)

| Metric | Measured |
|---|---|
| Prompt tokens | 2,003 (1,480 cacheable system prompt) |
| Completion tokens | 132 |
| TTS characters | 588 (~147/reply) |
| STT audio | 1.0 min |

## Option A — build on raw Sarvam APIs (Reyvoca's path)

| Component | Rate | Cost/min |
|---|---|---|
| STT | Rs 0.49/min | **Rs 0.4900** |
| TTS (bulbul v4-flash) | Rs 1.00/1k chars | **Rs 0.5880** |
| LLM input | Rs 15/1M tok | **Rs 0.0300** |
| LLM output | Rs 60/1M tok | **Rs 0.0079** |
| Models subtotal | | Rs 1.1160 |
| Telephony (2 x 30s pulse) | Rs 0.20/pulse | Rs 0.4000 |
| **Total** | | **Rs 1.5160/min** |
| With GST | | Rs 1.7888/min |

TTS dominates. LLM is under 3% of the bill — prompt caching saves only Rs 0.015/min.

## Option B — Sarvam managed Voice Agent

Flat rate, no separate model/token charge.

| Component | Cost/min |
|---|---|
| Agent minute (PAYG) | Rs 3.5000 |
| Telephony | Rs 0.4000 |
| **Total** | **Rs 3.9000/min** |
| With GST | Rs 4.6020/min |

Managed = 2.6x DIY (+Rs 2.38/min).

## Monthly projection (3-min average call)

| Calls/mo | Minutes | DIY | Managed | Plan |
|---|---|---|---|---|
| 50 | 150 | Rs 227 | Rs 585 | PAYG |
| 100 | 300 | Rs 455 | Rs 1,170 | PAYG |
| 300 | 900 | Rs 1,364 | Rs 3,510 | PAYG |
| 1,000 | 3,000 | Rs 4,548 | Rs 11,199 | Pro (Rs 9,999 floor) |
| 3,000 | 9,000 | Rs 13,644 | Rs 32,850 | Pro |

Pro carries a Rs 9,999/month minimum. Below ~3,077 min/month, PAYG is cheaper.

## Margin

A 3-min call costs Rs 11.70 managed / Rs 4.55 DIY — **0.59% of a Rs 1,999 sale**.
At a 1-in-20 conversion rate, acquisition cost is Rs 234 per sale.

**Recommendation:** start on managed PAYG. Move to DIY past ~3,000 min/month.

## Other add-ons

- Phone number rental: Rs 59 / 30 days
- Simulated test run: Rs 2 each
- Call forwarding to PSTN: Rs 0.40/pulse; SIP: Rs 0.35/pulse
- Only connected calls are billed; each call rounds up to a whole minute
