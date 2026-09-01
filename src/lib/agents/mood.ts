import headlinesData from '../../data/headlines.json';
import { clamp, lerp } from '../stats';
import type { AgentOutput, Factor, HeadlineItem, Source, Ticker, Verdict } from '../../types';

export interface MoodAgentParams {
  ticker: Ticker;
  lastDateStr: string;
  risk10Used: number;
  headlines?: HeadlineItem[];
}

export async function runMoodAgent(params: MoodAgentParams): Promise<AgentOutput> {
  const startTime = performance.now();
  const { ticker, lastDateStr, risk10Used, headlines = (headlinesData as HeadlineItem[]) } = params;

  const lastDate = new Date(lastDateStr).getTime();

  // Filter headlines within 14 days of last price date
  const matched = headlines.filter(h => {
    if (h.ticker !== ticker) return false;
    const hDate = new Date(h.date).getTime();
    const daysAgo = (lastDate - hDate) / (1000 * 60 * 60 * 24);
    return daysAgo >= 0 && daysAgo <= 14;
  });

  // Sort matched by date descending (newest first)
  matched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let totalWeight = 0;
  let weightedPolaritySum = 0;

  for (const h of matched) {
    const hDate = new Date(h.date).getTime();
    const daysAgo = Math.max(0, (lastDate - hDate) / (1000 * 60 * 60 * 24));
    const recencyWeight = Math.pow(0.5, daysAgo / 7);
    totalWeight += recencyWeight;
    weightedPolaritySum += h.polarity * recencyWeight;
  }

  let raw = totalWeight > 0 ? (weightedPolaritySum / totalWeight) : 0;

  // Personal risk moderation
  const t = risk10Used / 10;
  if (raw > 0) {
    raw *= lerp(0.55, 1.00, t);
  } else if (raw < 0) {
    raw *= lerp(1.00, 0.65, t);
  }

  let verdict: Verdict = "HOLD";
  if (raw > 0.35) {
    verdict = "BUY";
  } else if (raw < -0.35) {
    verdict = "AVOID";
  }

  const confidence = Math.round(clamp(52 + 30 * Math.abs(raw), 52, 80));

  const factors: Factor[] = [
    {
      id: "wire_sentiment",
      label: "Recency-Weighted Wire Tone",
      score: Number(raw.toFixed(3)),
      weight: 1.0,
      note: `${matched.length} headlines in 14d window (half-life 7d)`,
    },
  ];

  const sources: Source[] = matched.length > 0 ? [
    {
      id: matched[0].id,
      title: `${ticker} Wire Feed`,
      kind: "news",
      date: matched[0].date,
      quote: matched[0].text,
      ticker,
    }
  ] : [];

  await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 60));
  const latencyMs = Math.round(performance.now() - startTime);

  const reason = `Wire tone score ${raw >= 0 ? '+' : ''}${raw.toFixed(2)} based on ${matched.length} recent news events`;

  return {
    agent: "mood",
    name: "Wire",
    verdict,
    stance: Number(raw.toFixed(3)),
    confidence,
    reason,
    factors,
    sources,
    latencyMs,
  };
}
