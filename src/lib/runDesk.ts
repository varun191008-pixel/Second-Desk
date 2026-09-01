import pricesData from '../data/prices.json';
import peopleData from '../data/people.json';
import ashaCsv from '../data/ledgers/asha.csv?raw';
import vikramCsv from '../data/ledgers/vikram.csv?raw';
import thinCsv from '../data/ledgers/thin.csv?raw';
import { parseLedgerCsv, computeFeatures } from './features';
import { computeWeatherSignals } from './signals';
import { runChartAgent } from './agents/chart';
import { runFilingAgent } from './agents/filing';
import { runMoodAgent } from './agents/mood';
import { runChiefAgent } from './agents/chief';
import headlinesData from '../data/headlines.json';
import type {
  DeskSession,
  HeadlineItem,
  Person,
  PriceBar,
  Ticker,
} from '../types';

export const INITIAL_LEDGERS: Record<string, string> = {
  asha: ashaCsv,
  vikram: vikramCsv,
  thin: thinCsv,
};

export function getLedgerCsv(personId: string): string {
  const key = `seconddesk.ledger.${personId}`;
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  return INITIAL_LEDGERS[personId] || '';
}

export function saveLedgerCsv(personId: string, csvContent: string): void {
  const key = `seconddesk.ledger.${personId}`;
  localStorage.setItem(key, csvContent);
}

export function getStoredSessions(): DeskSession[] {
  try {
    const raw = localStorage.getItem('seconddesk.sessions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: DeskSession): void {
  try {
    const existing = getStoredSessions();
    const updated = [session, ...existing.filter(s => s.id !== session.id)].slice(0, 20);
    localStorage.setItem('seconddesk.sessions', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}

export interface RunDeskOptions {
  personId: string;
  ticker: Ticker;
  filingsDown?: boolean;
  dayIndex?: number; // 0 to 7 (0 is current 30-bar window, 1-7 forward bars)
  customPrices?: Record<Ticker, PriceBar[]>;
}

export async function runDesk(options: RunDeskOptions): Promise<DeskSession> {
  const startTime = performance.now();
  const { personId, ticker, filingsDown = false, dayIndex = 0, customPrices } = options;

  // Retrieve person data
  const people = peopleData as Person[];
  const person = people.find(p => p.id === personId) || people[0];

  // Retrieve ledger and compute features
  const csvText = getLedgerCsv(personId);
  const ledgerRows = parseLedgerCsv(csvText);
  const features = computeFeatures(ledgerRows);

  // If !eligible: callers MUST pass risk10Used = 5 into agents
  const risk10Used = features.eligible ? features.risk10 : 5.0;

  // Construct price slice for current ticker & universe based on dayIndex
  // 30-bar window shifted to include forward close (drop oldest)
  const fullPrices = customPrices || (pricesData as Record<Ticker, PriceBar[]>);
  const activePriceMap: Record<Ticker, PriceBar[]> = {} as Record<Ticker, PriceBar[]>;

  for (const t of Object.keys(fullPrices) as Ticker[]) {
    const allBars = fullPrices[t];
    // Start index = dayIndex, length = 30 bars
    const startIdx = Math.min(dayIndex, Math.max(0, allBars.length - 30));
    activePriceMap[t] = allBars.slice(startIdx, startIdx + 30);
  }

  const currentBars = activePriceMap[ticker];
  const lastBar = currentBars[currentBars.length - 1];

  // Compute Weather signals
  const headlines = headlinesData as unknown as HeadlineItem[];
  const weather = computeWeatherSignals(currentBars, headlines, ticker);

  // Run Tape, Docket, Wire in parallel using Promise.all
  const [tape, docket, wire] = await Promise.all([
    runChartAgent({
      bars: currentBars,
      ticker,
      risk10Used,
    }),
    runFilingAgent({
      ticker,
      risk10Used,
      filingsDown,
    }),
    runMoodAgent({
      ticker,
      lastDateStr: lastBar.date,
      risk10Used,
    }),
  ]);

  // Run Chief Agent
  const chief = runChiefAgent({
    ticker,
    person,
    features,
    risk10Used,
    tape,
    docket,
    wire,
    allPrices: activePriceMap,
    filingsDown,
  });

  const latencyMs = Math.round(performance.now() - startTime);

  // Compute Portfolio Metrics: HHI = sum(weight^2), maxWeight
  let totalStockMv = 0;
  const holdingWeights: number[] = [];

  for (const h of person.holdings) {
    const bars = activePriceMap[h.ticker];
    const close = bars && bars.length > 0 ? bars[bars.length - 1].close : h.avg;
    const mv = close * h.qty;
    totalStockMv += mv;
    holdingWeights.push(mv);
  }

  const totalBook = totalStockMv + person.cash;
  const weights = totalBook > 0 ? holdingWeights.map(mv => mv / totalBook) : [];
  if (totalBook > 0 && person.cash > 0) {
    weights.push(person.cash / totalBook);
  }

  const hhi = Number(weights.reduce((sum, w) => sum + (w * 100) ** 2, 0).toFixed(0));
  const maxWeight = weights.length > 0 ? Number((Math.max(...weights) * 100).toFixed(1)) : 0;

  const session: DeskSession = {
    id: `desk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    personId: person.id,
    personName: person.name,
    ticker,
    lastClose: lastBar.close,
    chief,
    tape,
    docket,
    wire,
    weather,
    features,
    risk10Used,
    latencyMs,
    hhi,
    maxWeight,
    dayIndex,
  };

  saveSession(session);
  return session;
}
