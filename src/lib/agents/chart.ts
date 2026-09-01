import scalesData from '../../data/scales.json';
import { clamp, lerp, mean, sampleStdev, sigmoid, tanh } from '../stats';
import type { AgentOutput, Factor, PriceBar, Source, Ticker, Verdict } from '../../types';

export interface ChartAgentParams {
  bars: PriceBar[];
  ticker: Ticker;
  risk10Used: number;
  simulatedVolZ?: number; // for testing or acceptance checks
}

export async function runChartAgent(params: ChartAgentParams): Promise<AgentOutput> {
  const startTime = performance.now();

  const { bars, ticker, risk10Used, simulatedVolZ } = params;
  const window30 = bars.slice(-30);
  const n = window30.length;
  const lastBar = window30[n - 1];
  const bar5 = window30[Math.max(0, n - 6)];
  const bar20 = window30[Math.max(0, n - 21)];

  const r5 = (lastBar.close - bar5.close) / bar5.close;
  const r20 = (lastBar.close - bar20.close) / bar20.close;

  // 20-day SMA
  const slice20 = window30.slice(Math.max(0, n - 20)).map(b => b.close);
  const sma20 = mean(slice20);
  const ext = (lastBar.close - sma20) / sma20;

  // Prior 20-day volume std & mean
  const prior20Vols = window30.slice(Math.max(0, n - 21), n - 1).map(b => b.volume);
  const meanVol20 = mean(prior20Vols);
  const stdVol20 = sampleStdev(prior20Vols);
  const calculatedVolZ = stdVol20 > 0 ? (lastBar.volume - meanVol20) / stdVol20 : 0;
  const volZ = simulatedVolZ !== undefined ? simulatedVolZ : calculatedVolZ;

  const { sigma5, sigma20, sigmaExt } = scalesData;

  // Core scores
  const shortScore = tanh(r5 / sigma5);
  const trendScore = tanh(r20 / sigma20);
  const volumeScore = tanh(volZ / 2);

  const g = sigmoid((volZ - 1.0) / 0.45);
  const stretchFade = -tanh(ext / sigmaExt);
  const stretchChase = +tanh(ext / sigmaExt);
  const stretchBlend = (1 - g) * stretchFade + g * stretchChase;

  const fadePref = 1 - risk10Used / 10;
  const stretchScore = fadePref * stretchFade + (1 - fadePref) * stretchBlend;

  // Weight interpolation
  const t = risk10Used / 10;
  const cautious = { short: 0.12, trend: 0.28, volume: 0.14, stretch: 0.46 };
  const aggressive = { short: 0.36, trend: 0.18, volume: 0.36, stretch: 0.10 };

  const wRaw = {
    short: lerp(cautious.short, aggressive.short, t),
    trend: lerp(cautious.trend, aggressive.trend, t),
    volume: lerp(cautious.volume, aggressive.volume, t),
    stretch: lerp(cautious.stretch, aggressive.stretch, t),
  };
  const sumW = wRaw.short + wRaw.trend + wRaw.volume + wRaw.stretch;
  const w = {
    short: wRaw.short / sumW,
    trend: wRaw.trend / sumW,
    volume: wRaw.volume / sumW,
    stretch: wRaw.stretch / sumW,
  };

  const stance = shortScore * w.short + trendScore * w.trend + volumeScore * w.volume + stretchScore * w.stretch;

  let verdict: Verdict = "HOLD";
  if (stance > 0.25) {
    verdict = "BUY";
  } else if (stance < -0.25) {
    verdict = "AVOID";
  }

  const confidence = Math.round(clamp(50 + 40 * Math.abs(stance), 50, 90));

  const factors: Factor[] = [
    {
      id: "short_momentum",
      label: "Short Momentum (5d)",
      score: Number(shortScore.toFixed(3)),
      weight: Number(w.short.toFixed(3)),
      note: `r5=${(r5 * 100).toFixed(1)}% / σ5=${(sigma5 * 100).toFixed(2)}%`,
    },
    {
      id: "trend_20d",
      label: "Trend (20d)",
      score: Number(trendScore.toFixed(3)),
      weight: Number(w.trend.toFixed(3)),
      note: `r20=${(r20 * 100).toFixed(1)}% / σ20=${(sigma20 * 100).toFixed(2)}%`,
    },
    {
      id: "volume_pressure",
      label: "Volume Pressure",
      score: Number(volumeScore.toFixed(3)),
      weight: Number(w.volume.toFixed(3)),
      note: `volZ=${volZ >= 0 ? '+' : ''}${volZ.toFixed(2)} (g=${g.toFixed(2)})`,
    },
    {
      id: "stretch_reversion",
      label: "Mean Reversion / Stretch",
      score: Number(stretchScore.toFixed(3)),
      weight: Number(w.stretch.toFixed(3)),
      note: `ext=${(ext * 100).toFixed(1)}% vs SMA20 ₹${sma20.toFixed(1)}`,
    },
  ];

  const sourceQuote = `Last ₹${lastBar.close.toFixed(2)} · 5d ${(r5 * 100).toFixed(1)}% · 20d ${(r20 * 100).toFixed(1)}% · volZ ${volZ >= 0 ? '+' : ''}${volZ.toFixed(2)} · SMA20 ₹${sma20.toFixed(2)}`;
  const sources: Source[] = [
    {
      id: `${ticker.toLowerCase()}-tape`,
      title: `${ticker} 30-Day Tape Metric Strip`,
      kind: "chart",
      date: lastBar.date,
      quote: sourceQuote,
      ticker,
    },
  ];

  // Brief staged delay (90-160ms) for realistic agent feel
  await new Promise(resolve => setTimeout(resolve, 90 + Math.random() * 70));

  const latencyMs = Math.round(performance.now() - startTime);

  const heaviestFactor = [...factors].sort((a, b) => b.weight - a.weight)[0];
  const reason = `${heaviestFactor.label} weighted highest (${(heaviestFactor.weight * 100).toFixed(0)}%) with stance ${stance >= 0 ? '+' : ''}${stance.toFixed(2)}`;

  return {
    agent: "chart",
    name: "Tape",
    verdict,
    stance: Number(stance.toFixed(3)),
    confidence,
    reason,
    factors,
    sources,
    latencyMs,
    debug: {
      g: Number(g.toFixed(4)),
      sigma5,
      fadePref: Number(fadePref.toFixed(4)),
      volZ: Number(volZ.toFixed(3)),
      ext: Number(ext.toFixed(4)),
      stance: Number(stance.toFixed(4)),
    },
  };
}
