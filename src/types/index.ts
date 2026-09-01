export type Ticker = "RELIANCE" | "TCS" | "INFY" | "HDFCBANK" | "TATAMOTORS";
export type Verdict = "BUY" | "HOLD" | "AVOID" | "CAUTION" | "UNAVAILABLE";
export type ActionId = "avoid" | "hold" | "small_add" | "full_add";
export type Motive = "unsure" | "want_buy" | "dont_buy";

export interface Factor {
  id: string;
  label: string;
  score: number;
  weight: number;
  note: string;
  raw?: string;
}

export interface Source {
  id: string;
  title: string;
  kind: string;
  date: string;
  quote: string;
  ticker?: Ticker;
}

export interface Features {
  nTrades: number;
  turnover: number;
  eligible: boolean;
  chaseRate: number;
  fadeRate: number;
  cutRate: number;
  shortHold: number;
  holdDaysMed: number;
  risk10: number;
}

export interface AgentOutput {
  agent: "chart" | "filing" | "mood";
  name: "Tape" | "Docket" | "Wire";
  verdict: Verdict;
  stance: number;
  confidence: number;
  reason: string;
  factors: Factor[];
  sources: Source[];
  latencyMs: number;
  degraded?: boolean;
  debug?: Record<string, number | string>;
}

export interface ActionFit {
  id: ActionId;
  label: string;
  fit: number;
  gap: number;
  why: string;
}

export interface ChiefOutput {
  best: ActionId;
  headline: string;
  why: string;
  confidence: number;
  blended: number;
  room: number;
  veto: boolean;
  menu: ActionFit[];
  motiveHint: Record<Motive, string>;
  conflicts: { title: string; detail: string }[];
  sources: Source[];
  personalization: string[];
  warnings: string[];
}

export interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Scales {
  sigma5: number;
  sigma20: number;
  sigmaExt: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  kind: "transcript" | "filing" | "sebi" | "news";
  date: string;
  tickers: Ticker[];
  text: string;
  quote: string;
}

export interface HeadlineItem {
  id: string;
  ticker: Ticker;
  date: string;
  text: string;
  polarity: -1 | 0 | 1;
}

export interface Holding {
  ticker: Ticker;
  qty: number;
  avg: number;
}

export interface Person {
  id: string;
  name: string;
  age: number;
  bio: string;
  cash: number;
  holdings: Holding[];
}

export interface LedgerRow {
  date: string;
  ticker: Ticker;
  side: "buy" | "sell";
  qty: number;
  price: number;
  r5: number;
  volz: number;
  note?: string;
}

export interface WeatherSignal {
  type: "momentum" | "volume" | "sentiment";
  label: "BULLISH" | "BEARISH" | "NEUTRAL" | "SPIKE" | "QUIET" | "NORMAL" | "POSITIVE" | "NEGATIVE" | "MIXED";
  confidence: number;
  reason: string;
  source: string;
}

export interface DeskSession {
  id: string;
  timestamp: number;
  personId: string;
  personName: string;
  ticker: Ticker;
  lastClose: number;
  chief: ChiefOutput;
  tape: AgentOutput;
  docket: AgentOutput;
  wire: AgentOutput;
  weather: WeatherSignal[];
  features: Features;
  risk10Used: number;
  latencyMs: number;
  hhi: number;
  maxWeight: number;
  dayIndex: number;
}
