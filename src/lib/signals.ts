import { clamp, mean, sampleStdev } from './stats';
import type { PriceBar, HeadlineItem, Ticker, WeatherSignal } from '../types';

export function computeWeatherSignals(
  bars: PriceBar[],
  headlines: HeadlineItem[],
  ticker: Ticker
): WeatherSignal[] {
  // Use 30-bar window (or last 30 bars if more)
  const window30 = bars.slice(-30);
  const n = window30.length;
  const lastBar = window30[n - 1];
  const bar5 = window30[Math.max(0, n - 6)];
  const bar20 = window30[Math.max(0, n - 21)];

  const r5 = (lastBar.close - bar5.close) / bar5.close;
  const r20 = (lastBar.close - bar20.close) / bar20.close;

  // volZ vs prior 20-day volume
  const prior20Bars = window30.slice(Math.max(0, n - 21), n - 1);
  const prior20Vols = prior20Bars.map(b => b.volume);
  const meanVol20 = mean(prior20Vols);
  const stdVol20 = sampleStdev(prior20Vols);
  const volZ = stdVol20 > 0 ? (lastBar.volume - meanVol20) / stdVol20 : 0;

  // 1. Momentum Signal
  let momLabel: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  if (r5 > 0.03 && r20 > 0) {
    momLabel = "BULLISH";
  } else if (r5 < -0.03 && r20 < 0) {
    momLabel = "BEARISH";
  }

  const momMetric = clamp(Math.max(Math.abs(r5), Math.abs(r20) / 2) / 0.10, 0, 1);
  const momConf = Math.round(clamp(52 + 28 * momMetric, 52, 80));
  const momReason = `5d return ${(r5 * 100).toFixed(1)}%, 20d return ${(r20 * 100).toFixed(1)}%`;
  const momSource = `30-day price tape: close ₹${lastBar.close.toFixed(2)}`;

  // 2. Volume Signal
  let volLabel: "SPIKE" | "QUIET" | "NORMAL" = "NORMAL";
  if (volZ > 1.5) {
    volLabel = "SPIKE";
  } else if (volZ < -1.0) {
    volLabel = "QUIET";
  }

  const volMetric = clamp(Math.abs(volZ) / 3.0, 0, 1);
  const volConf = Math.round(clamp(52 + 28 * volMetric, 52, 80));
  const volReason = `Volume z-score is ${volZ >= 0 ? '+' : ''}${volZ.toFixed(2)} vs prior 20d mean (${(lastBar.volume / 1000000).toFixed(2)}M shs)`;
  const volSource = `Volume filter: 20d mean ${(meanVol20 / 1000000).toFixed(2)}M`;

  // 3. Sentiment Signal
  // Filter headlines within 14 days of last price date
  const lastDate = new Date(lastBar.date).getTime();
  const recentHeadlines = headlines.filter(h => {
    if (h.ticker !== ticker) return false;
    const hDate = new Date(h.date).getTime();
    const daysAgo = (lastDate - hDate) / (1000 * 60 * 60 * 24);
    return daysAgo >= 0 && daysAgo <= 14;
  });

  const polarities = recentHeadlines.map(h => h.polarity);
  const meanPol = polarities.length > 0 ? mean(polarities) : 0;

  let sentLabel: "POSITIVE" | "NEGATIVE" | "MIXED" = "MIXED";
  if (meanPol > 0.3) {
    sentLabel = "POSITIVE";
  } else if (meanPol < -0.3) {
    sentLabel = "NEGATIVE";
  }

  const sentMetric = clamp(Math.abs(meanPol), 0, 1);
  const sentConf = Math.round(clamp(52 + 28 * sentMetric, 52, 80));
  const sentReason = `14d mean headline polarity is ${meanPol >= 0 ? '+' : ''}${meanPol.toFixed(2)} across ${recentHeadlines.length} items`;
  const sentSource = recentHeadlines.length > 0 ? `Wire: ${recentHeadlines[0].text.slice(0, 60)}...` : 'Wire: No recent news wire';

  return [
    {
      type: "momentum",
      label: momLabel,
      confidence: momConf,
      reason: momReason,
      source: momSource,
    },
    {
      type: "volume",
      label: volLabel,
      confidence: volConf,
      reason: volReason,
      source: volSource,
    },
    {
      type: "sentiment",
      label: sentLabel,
      confidence: sentConf,
      reason: sentReason,
      source: sentSource,
    },
  ];
}
