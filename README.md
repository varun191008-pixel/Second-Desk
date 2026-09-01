# SecondDesk

A research desk for one Indian retail investor.

Pick a person and a stock. Three agents read price, filings, and news. A Chair gives one suggested action and shows how much worse the other three moves are.

Same Infosys. Asha (careful) and Vikram (aggressive) get different advice. Sources stay visible. If filings break, the desk still answers and does not invent a quote.

Live demo: https://YOUR-SITE.netlify.app

Sample tape. Not live NSE. Not investment advice.
HackVerse Sprint 1 · PS-01 Multi-Agent Financial Intelligence.

## Try it (60 seconds)

1. Asha + INFY → Run desk. Open the Docket quote. Look at Chair.
2. Vikram + INFY → Run again. The Chair order should change.
3. Break filings. Docket empty. Chair still has four rows.
4. Riya — 3 trades, so no personal desk.
5. Architecture — formulas and “fit ≠ probability.”

Optional: Hold this name → Next session. The top recommendation can move after a new close.

## How it works

Person + ticker → weather (momentum / volume / news, same for everyone) → Tape + Docket + Wire in parallel → Chair menu (Avoid | Hold | Small add | Full add).

Tape reads 30-day prices and runs four sliders: 5-day, 20-day, volume, stretch.
Docket reads 10 fake SEBI / earnings notes, retrieves a quote, and scores margins, growth, balance, buyback.
Wire reads headlines for news mood and cannot outvote a filing.
Chair reads the three notes plus this person’s book. Best fit = 100. The others show the gap.

Weather is not an agent and never says buy/sell. Chair is a menu, not a vibe score. Motive (“I want to buy”) only changes the sentence — it cannot steal the 100.

## Why three people

Personality is computed from a trade CSV, not a Safe/Risky switch.

Asha: long-hold ledger → defensive weights, tight cap.
Vikram: breakout ledger → louder 5-day and volume.
Riya: 3 trades / about ₹23k — below the gate.

Gate: 8 trades or ₹1 lakh turnover. Below that we show a general desk and say so. Upload date,ticker,side,qty,price to try your own book.

HDFC + Asha is the cap veto demo: weather can be fine, adds still die because she already owns too much.

## Standouts

Same stock, two books, two Chair orders.
Filings-down → no fake quote.
Stretch uses a smooth volume blend (no 0.99 / 1.01 flip).
We do not type canned scores like Avoid 100 / Hold 86.
“100” means fit for this book, not chance the price goes up.
Ticker bar is a CSS loop of five bundled prints, labelled SAMPLE TAPE.
Hold-watch follows the NSE close, not a 12-hour ping.
Default UI is plain English; raw r5 / sigma sit under Show numbers.

## Sample names

RELIANCE, TCS, INFY, HDFCBANK, TATAMOTORS.

INFY is the main split (quiet tape vs Europe margin quote). Tata is the volume spike. HDFC is Asha’s concentration test.

## Stack

Vite, React, TypeScript, Tailwind. All math in src/lib. No backend, no auth, no LangChain, no live APIs.

Folders: src/data (prices, documents, headlines, people, ledgers), src/lib/agents (tape, docket, wire, chair), src/lib/features.ts.

## Run locally

Need Node 18+.

npm install
npm run dev

Open the URL it prints (http://localhost:5173).

npm run build
npm run preview

Deploy: upload the dist folder to Netlify. For extra routes add public/_redirects with: /*    /index.html   200

## What we did not build

Live NSE, a real vector DB, login in front of the demo, brokerage, ten agents.

## Disclaimer

Hackathon prototype. Do not trade on this. If Docket is dark, there is no filing on the Chair card — by design.
