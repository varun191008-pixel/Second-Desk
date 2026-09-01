[README (1).md](https://github.com/user-attachments/files/31685363/README.1.md)
# SecondDesk

A research desk for one retail investor.

Pick a **person** and a **stock**. Three agents read price, filings, and news. A Chair gives **one** action and shows how much worse the others are.

Same Infosys. A careful book and a risky book get **different** advice. If filings break, we still answer — we do **not** invent a quote.

**Sample data. Not live NSE. Not investment advice.**

HackVerse Sprint 1 · PS-01

---

## Try it

1. Pick **Asha** + **INFY** → Run desk.  
2. Switch to **Vikram**, same stock → Run again. The final advice should change.  
3. Turn on **Break filings**. Docket goes empty. Chair still works.  
4. Open **Riya** — too few trades, so no personal desk.  
5. Open **Architecture** for the math.

---

## People (samples)

| Who | Why |
|---|---|
| Asha | Careful, long-term book |
| Vikram | Aggressive, chases moves |
| Riya | Only 3 trades — we don’t pretend we know her |

You can upload a trade CSV to try your own book.

---

## Run on your machine

Need Node 18+.

```bash
npm install
npm run dev
```

Then open the URL it prints (`http://localhost:5173`).

```bash
npm run build
npm run preview
```

---

## What’s inside

- **Tape** — price / volume  
- **Docket** — earnings & SEBI notes + visible quote  
- **Wire** — news mood  
- **Chair** — one recommendation + the other three scored  

All local. No chatbot. No live market API.

---

## Disclaimer

Hackathon prototype. Do not trade on this.
