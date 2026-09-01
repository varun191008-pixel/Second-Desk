import { retrieve } from '../retrieve';
import { clamp, lerp, tanh } from '../stats';
import type { AgentOutput, Factor, Source, Ticker, Verdict } from '../../types';

export interface FilingAgentParams {
  ticker: Ticker;
  risk10Used: number;
  filingsDown?: boolean;
}

interface LexiconEntry {
  phrase: string;
  weight: number;
}

const MARGINS_NEG: LexiconEntry[] = [
  { phrase: "not restoring", weight: 1.2 },
  { phrase: "cautious near-term margin", weight: 1.0 },
  { phrase: "compressed", weight: 1.0 },
  { phrase: "pressure", weight: 0.8 },
  { phrase: "margin band", weight: 0.6 },
];

const MARGINS_POS: LexiconEntry[] = [
  { phrase: "margin beat", weight: 1.1 },
  { phrase: "operating margin improved", weight: 1.0 },
  { phrase: "expanded", weight: 1.0 },
];

const GROWTH_NEG: LexiconEntry[] = [
  { phrase: "conversion into revenue is slower", weight: 1.0 },
  { phrase: "discretionary programs", weight: 0.8 },
  { phrase: "delayed", weight: 0.9 },
  { phrase: "delay", weight: 0.6 },
  { phrase: "weakness", weight: 0.5 },
];

const GROWTH_POS: LexiconEntry[] = [
  { phrase: "tcv", weight: 0.8 },
  { phrase: "booking", weight: 0.6 },
  { phrase: "raise", weight: 0.7 },
  { phrase: "resilient", weight: 0.5 },
  { phrase: "record", weight: 0.6 },
];

const BALANCE_NEG: LexiconEntry[] = [
  { phrase: "npa", weight: 1.0 },
  { phrase: "investigation", weight: 1.0 },
  { phrase: "provision", weight: 0.7 },
  { phrase: "debt", weight: 0.4 },
];

const BALANCE_POS: LexiconEntry[] = [
  { phrase: "free cash flow", weight: 0.8 },
  { phrase: "fcf", weight: 0.8 },
  { phrase: "stable", weight: 0.5 },
  { phrase: "cash", weight: 0.4 },
  { phrase: "credit-cost", weight: 0.4 },
];

const CAPITAL_POS: LexiconEntry[] = [
  { phrase: "buyback", weight: 1.2 },
  { phrase: "dividend", weight: 0.8 },
];

const CAPITAL_NEG: LexiconEntry[] = [
  { phrase: "dilution", weight: 1.0 },
];

function countOccurrences(text: string, phrase: string): number {
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  let count = 0;
  let pos = 0;
  while ((pos = lowerText.indexOf(lowerPhrase, pos)) !== -1) {
    count++;
    pos += lowerPhrase.length;
  }
  return count;
}

function scoreLexiconCategory(
  text: string,
  posEntries: LexiconEntry[],
  negEntries: LexiconEntry[],
  tokenCount: number
): { score: number; note: string } {
  let posSum = 0;
  let negSum = 0;
  const matches: string[] = [];

  for (const entry of posEntries) {
    const c = countOccurrences(text, entry.phrase);
    if (c > 0) {
      posSum += entry.weight * c;
      matches.push(`${entry.phrase}×${c}`);
    }
  }

  for (const entry of negEntries) {
    const c = countOccurrences(text, entry.phrase);
    if (c > 0) {
      negSum += entry.weight * c;
      matches.push(`${entry.phrase}×${c}`);
    }
  }

  const raw = (posSum - negSum) / Math.sqrt(Math.max(20, tokenCount));
  const score = tanh(3 * raw);
  const note = matches.length > 0 ? matches.join(', ') : 'no matches';

  return {
    score: Number(score.toFixed(3)),
    note,
  };
}

export async function runFilingAgent(params: FilingAgentParams): Promise<AgentOutput> {
  const startTime = performance.now();
  const { ticker, risk10Used, filingsDown } = params;

  if (filingsDown) {
    await new Promise(resolve => setTimeout(resolve, 80));
    return {
      agent: "filing",
      name: "Docket",
      verdict: "UNAVAILABLE",
      stance: 0,
      confidence: 0,
      reason: "Filings corpus unreachable. No filing-grounded claim will be issued.",
      factors: [
        { id: "margins", label: "Margin Guidance", score: 0, weight: 0.25, note: "corpus offline" },
        { id: "growth", label: "Growth / Demand", score: 0, weight: 0.25, note: "corpus offline" },
        { id: "balance", label: "Balance Sheet & Credit", score: 0, weight: 0.25, note: "corpus offline" },
        { id: "capital", label: "Capital Allocation", score: 0, weight: 0.25, note: "corpus offline" },
      ],
      sources: [],
      latencyMs: Math.round(performance.now() - startTime),
      degraded: true,
    };
  }

  const hits = retrieve(`${ticker} earnings margin guidance demand capex credit buyback NPA`, ticker, 2, false);
  const combinedText = hits.map(h => h.text).join(' ');
  const tokenCount = combinedText.trim().split(/\s+/).length;

  const margins = scoreLexiconCategory(combinedText, MARGINS_POS, MARGINS_NEG, tokenCount);
  const growth = scoreLexiconCategory(combinedText, GROWTH_POS, GROWTH_NEG, tokenCount);
  const balance = scoreLexiconCategory(combinedText, BALANCE_POS, BALANCE_NEG, tokenCount);
  const capital = scoreLexiconCategory(combinedText, CAPITAL_POS, CAPITAL_NEG, tokenCount);

  // Poles
  const t = risk10Used / 10;
  const cautious = { margins: 0.40, growth: 0.15, balance: 0.25, capital: 0.20 };
  const aggressive = { margins: 0.20, growth: 0.40, balance: 0.15, capital: 0.25 };

  const wRaw = {
    margins: lerp(cautious.margins, aggressive.margins, t),
    growth: lerp(cautious.growth, aggressive.growth, t),
    balance: lerp(cautious.balance, aggressive.balance, t),
    capital: lerp(cautious.capital, aggressive.capital, t),
  };
  const sumW = wRaw.margins + wRaw.growth + wRaw.balance + wRaw.capital;
  const w = {
    margins: wRaw.margins / sumW,
    growth: wRaw.growth / sumW,
    balance: wRaw.balance / sumW,
    capital: wRaw.capital / sumW,
  };

  const stance = margins.score * w.margins + growth.score * w.growth + balance.score * w.balance + capital.score * w.capital;

  let verdict: Verdict = "HOLD";
  if (stance <= -0.18) {
    verdict = "CAUTION";
  } else if (stance >= 0.28) {
    verdict = "BUY";
  }

  const confidence = Math.round(clamp(50 + 40 * Math.abs(stance), 50, 88));

  const factors: Factor[] = [
    {
      id: "margins",
      label: "Margin Outlook",
      score: margins.score,
      weight: Number(w.margins.toFixed(3)),
      note: margins.note,
    },
    {
      id: "growth",
      label: "Growth & Demand",
      score: growth.score,
      weight: Number(w.growth.toFixed(3)),
      note: growth.note,
    },
    {
      id: "balance",
      label: "Balance Sheet & Credit",
      score: balance.score,
      weight: Number(w.balance.toFixed(3)),
      note: balance.note,
    },
    {
      id: "capital",
      label: "Capital Allocation & Payout",
      score: capital.score,
      weight: Number(w.capital.toFixed(3)),
      note: capital.note,
    },
  ];

  const sources: Source[] = hits.length > 0 ? [
    {
      id: hits[0].id,
      title: hits[0].title,
      kind: hits[0].kind,
      date: hits[0].date,
      quote: hits[0].quote,
      ticker: hits[0].tickers[0],
    }
  ] : [];

  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 80));
  const latencyMs = Math.round(performance.now() - startTime);

  const reason = `Extracted ${hits.length} filings/transcripts: stance ${stance >= 0 ? '+' : ''}${stance.toFixed(2)} (${verdict})`;

  return {
    agent: "filing",
    name: "Docket",
    verdict,
    stance: Number(stance.toFixed(3)),
    confidence,
    reason,
    factors,
    sources,
    latencyMs,
  };
}
