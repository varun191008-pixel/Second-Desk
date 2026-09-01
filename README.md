[Uploading README (2).md…]()
# SecondDesk

**A research desk for one Indian retail investor — not a chatbot taped to a candlestick.**

Pick a person and a stock. Three specialists read the **tape**, the **filings**, and the **wires**. A Chair turns that into **one suggested action** and shows **how much worse** the other three legal moves are.

Same Infosys print. Asha’s retirement book and Vikram’s aggressive book do **not** get the same stamp. Sources stay on the glass. If the filings folder goes dark, the desk still speaks — and **refuses to invent a quote**.

**Live demo:** https://YOUR-SITE.netlify.app

> Bundled sample tape. **Not live NSE. Not investment advice.** HackVerse Sprint 1 · PS-01
> Multi-Agent Autonomous Financial Intelligence System for Retail Investors.

---

## Why this exists

Retail tools usually do one of two things: a generic “BUY 72%” gauge, or a chatbot that cannot show its work.

SecondDesk is a **tiny desk**:

1. What the market is doing (weather)
2. What three named agents think
3. One final recommendation
4. **Why** — quote, slider, ledger, cap
5. Proof that **safe and aggressive are not a paint toggle** — they are different books

If you can click that without the site dying, you have hit the problem statement. Everything below is how we hit it without a live exchange feed.

---

## 60-second demo (say this out loud)

1. “This is SecondDesk. Same data a fund would use, explained for one person.”
2. **Asha + INFY → Run.** Weather. Tape. Docket: pin the Europe margin sentence. Chair: likely **Avoid / Hold**, full add sitting at the bottom.
3. **Vikram + INFY → Run.** Same candles, same quote, **different Chair order** (small add is allowed to win).
4. **Break filings feed.** Yellow warning. Docket sources `[]`. Chair still has four rows. If the Europe sentence is still cited, we failed.
5. **Riya.** Three trades. Banner: not enough history. We do **not** call her aggressive.
6. **Architecture.** Sliders, gate, “fit ≠ probability,” NSE close not a 12-hour ping.

Optional: **Hold this name → Next session.** The 100 can walk after a new official close.

---

## Standout points (what is not a template dashboard)

| Standout | What judges actually see |
|---|---|
| **Same stock, two books** | INFY + Asha ≠ INFY + Vikram. Required by the PS; we made it the demo. |
| **Chair is a menu, not a stamp** | Best = 100. Hold −14, Small add −29, Full add −62. If she *wants* to buy, we tag the least-bad add — we do not flip Avoid to Buy. |
| **Personality is computed** | CSV ledger → chase / fade / cut / hold-days → `risk10` → weights and caps. Not a Safe/Risky radio. |
| **History gate** | 8 trades **or** ₹1 lakh turnover. Below that: general desk. Riya exists to show we will not hallucinate a personality. |
| **Filings-down is a feature** | Docket `UNAVAILABLE`, empty sources, no invented paragraph. Chair uses tape + wire only. |
| **Cap veto** | Asha already ~overweight HDFC → both add rows die even if the chart is fine. Book beats tape. |
| **No 0.99 / 1.01 light switch** | Volume confirmation is a sigmoid. Stretch blends; it does not flip. |
| **No answer sheet** | We do not type “Avoid 100 / Hold 86”. The formula prints whatever it prints. Tests check **order**. |
| **Fit is not a forecast** | “How well this action matches this book.” Never “chance INFY goes up.” |
| **Show your work** | Default UI is plain English. **Show numbers** / Architecture reveal `r5`, σ, weights. |
| **Hold is a subscription** | After Hold, Chair re-scores on the next session (NSE close), not every 12 hours. |
| **Honest ticker** | CSS marquee of five bundled prints, labelled **SAMPLE TAPE**. No Yahoo, no NSE socket. |

---

## How a run works

```
User picks INFY + Asha (or Vikram, or Riya, or an uploaded book)
        │
        ▼
 ① WEATHER     momentum / volume / sentiment     (same for everyone)
        │
        ▼
 ② Promise.all
        Tape (prices)   Docket (filings)   Wire (news)
        │
        ▼
 ③ CHAIR       blend + this person's cap + bias
               Avoid | Hold | Small add | Full add
        │
        ▼
 ④ optional HOLD WATCH    next official close → menu can walk
```

Three agent files. One boss. No fifth “AI.”

---

## The three people (sample clients, not logins)

| Person | Book (mark-to-market) | What the ledger is for |
|---|---|---|
| **Asha Menon**, 58 | HDFC 120 + TCS 40 + cash ₹4.2L | Quiet buys, sells into strength, long holds → low `risk10`, Stretch loud, 22%→3% caps interpolated |
| **Vikram Rao**, 26 | Tata 180 + Reliance 35 + INFY 20 + cash ₹1.85L | Buys after hot 5-days, cuts losers fast → high `risk10`, Volume + 5-day loud, 35% / 8% caps |
| **Riya Shah**, 31 | Tiny INFY, 3 fills, ~₹23k | **Ineligible.** Mid weights, bias 0, banner. The product saying “I don’t know you yet.” |

Upload `date,ticker,side,qty,price` (optional `r5,volz` at fill). Features recompute in the browser. No KYC.

**Gate:** `n_trades ≥ 8` **OR** `turnover ≥ ₹1,00,000`. Always shown as a chip.

---

## Agent contracts

### Weather (not an agent)

Three pills from the same bars/headlines for every person:

- Momentum — 5-day and 20-day
- Volume — spike vs that name’s own 20-day volume (Tata is the spike demo)
- Sentiment — mean of tagged headlines

Never says buy or sell.

### Tape — `src/lib/agents/chart.ts`

Folder: OHLCV only. Forbidden: the word “margin,” SEBI, quotes.

Four sliders, scores in (−1, +1), weights interpolated from `risk10`:

| Slider | Cautious pole | Aggressive pole |
|---|---|---|
| 5-day | quiet | loud |
| 20-day | louder | quieter |
| Volume | quiet | loud |
| Stretch | loud (extended = bad) | quiet; extension + busy volume can count as a breakout |

Stretch is a **blend** driven by `g = 1 / (1 + e^(-(volZ−1)/0.45))`. `volZ` 0.99 vs 1.01 must not jump the verdict.

Scales `σ5`, `σ20`, `σext` are **computed from the bundled 30-day file**, not typed to make INFY look calm.

### Docket — `src/lib/agents/filing.ts`

Folder: ten documents (transcripts, filings, SEBI, wires).

Retrieve: ticker hit + tf-idf cosine. **No** `if INFY return q1-call`. The first hit’s **quote field** is what the UI cites.

Lexicon counts (compressed, not restoring, buyback, NPA, …) → `tanh`. Combined text can fire margins **and** capital.

If **Break filings**: verdict `UNAVAILABLE`, confidence 0, `sources = []`, grey sliders, reason: we will not issue a filing-grounded claim.

### Wire — `src/lib/agents/mood.ts`

14-day recency-weighted mean of **pre-tagged** polarities (−1 / 0 / +1) in `headlines.json`. The engine does not invent mood. Chair weight 0.7 — news cannot outvote a live filing. That is a choice.

### Chair — `src/lib/agents/chief.ts`

Maps BUY / HOLD / CAUTION / AVOID / skip UNAVAILABLE. Weighted blend + ledger bias.

Four raw fits, scaled so the **best is 100**. Vetoed adds sit at the floor.

| Row | Meaning |
|---|---|
| Avoid | Don’t add. Think about trimming if they already sit in it. |
| Hold | Do nothing new. |
| Small add | Half of *this* person’s cap, also limited by cash and room-to-cap |
| Full add | Full cap, same limits |

Portfolio math is one definition: `qty × last close / (book + cash)`. **Mark-to-market, not avg cost.** Adds cannot exceed remaining cap **or** cash.

**Motive** (Unsure / I want to buy / I don’t) changes the **sentence**, never the numbers. Asha does not get a Buy because she wanted one.

Conflict banner if Tape and Docket disagree: Chair will not average it into a fake 62%.

---

## Hold watch (time)

Hold is not a grave. It is a subscription to a moving menu.

We do **not** ping every 12 hours. Tape is a **daily bar** engine.

| Note | When (IST) | What may move the 100 |
|---|---|---|
| Pre-open | 8:30–8:50 | Wire / a night filing only. Today’s bar does not exist yet. |
| Post-close | 4:15–4:45 | New official close → Tape + Chair. This is the daily walk. |
| Weekly | Friday 17:00–18:00 | Tape + Wire + Docket retrieve + mark-to-market caps |

Sprint UI: **Next session** / **Next week** over bundled forward bars. No socket.

Docket cannot grow a quote because price moved. Cap still wins after a green week.

---

## Sample tape (bundled)

| Ticker | Last ₹ | Point of the name |
|---|---|---|
| RELIANCE | 2,847.30 | Clean-ish tape + filing |
| TCS | 3,912.55 | Soft IT |
| INFY | 1,548.90 | Quiet tape vs ugly Europe quote — the main split |
| HDFCBANK | 1,672.10 | Fine weather, Asha **cap veto** |
| TATAMOTORS | 978.45 | Volume **spike**; Vikram already overweight |

Ten documents include INFY Q1 call, INFY buyback, TCS call, RIL AGM, HDFC credit, Tata JLR, SEBI F&O note, FII flow, IT wire, auto volume.

---

## UI notes

Dark blotter, graph-paper grid, mint action colour. Ticker under the nav is **SAMPLE TAPE**.

Default language is English sentences (“Up 1.8% in 5 days. This is calm.”). Engine print lives under **Show numbers**.

Chair card always carries **SIMULATED · sample tape · not advice**.

Mobile: Chair first. No sideways scroll at 390px. Sliders collapsed until opened.

---

## Stack

Vite · React · TypeScript · Tailwind. All intelligence is **pure functions** in `src/lib`. No backend, no auth, no LangChain, no Pinecone, no live APIs.

```
src/data/            prices.json, documents.json, headlines.json, people.json, ledgers/*.csv
src/lib/features.ts  ledger → features → risk10 + eligibility
src/lib/retrieve.ts  local tf-idf
src/lib/agents/      chart.ts, filing.ts, mood.ts, chief.ts
src/lib/runDesk.ts   Promise.all then Chair
```

---

## Run locally

Node 18+.

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

```bash
npm run build
npm run preview
```

---

## Deploy

Static site. `npm run build` → upload **`dist`** to [Netlify Drop](https://app.netlify.com/drop) (or import this repo on Vercel).

SPA fallback (`public/_redirects`):

```
/*    /index.html   200
```

---

## What we refused to build

Live NSE, a real vector DB, Google-login in front of the demo, KYC, brokerage, ten agents, a mobile app, a 12-hour cron, canned Chair pixels (Avoid 100 / Hold 86).

Sample data that survives 2:55 beats a live feed that dies at 2:55.

---

## Disclaimer

Hackathon prototype. Every number traces to a file in `src/data/` or a formula in `src/lib`. Do not trade on it. If Docket is dark, there is no filing on the Chair card — by design.
