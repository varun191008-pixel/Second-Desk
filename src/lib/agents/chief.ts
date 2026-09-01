import { computeCaps } from '../caps';
import type {
  ActionFit,
  ActionId,
  AgentOutput,
  ChiefOutput,
  Features,
  Motive,
  Person,
  PriceBar,
  Source,
  Ticker,
  Verdict
} from '../../types';

export interface ChiefAgentParams {
  ticker: Ticker;
  person: Person;
  features: Features;
  risk10Used: number;
  tape: AgentOutput;
  docket: AgentOutput;
  wire: AgentOutput;
  allPrices: Record<Ticker, PriceBar[]>;
  filingsDown?: boolean;
}

const VERDICT_MAP: Record<Verdict, number> = {
  BUY: 1.0,
  HOLD: 0.0,
  CAUTION: -0.6,
  AVOID: -1.0,
  UNAVAILABLE: 0.0,
};

export function runChiefAgent(params: ChiefAgentParams): ChiefOutput {
  const {
    ticker,
    person,
    features,
    risk10Used,
    tape,
    docket,
    wire,
    allPrices,
    filingsDown = false,
  } = params;

  const caps = computeCaps(features.eligible, risk10Used);

  // Agent weights
  const W_TAPE = 1.0;
  const W_DOCKET = 1.1;
  const W_WIRE = 0.7;

  let sumW = W_TAPE;
  let weightedSignalSum = W_TAPE * VERDICT_MAP[tape.verdict] * (tape.confidence / 100);

  if (!filingsDown && docket.verdict !== 'UNAVAILABLE') {
    sumW += W_DOCKET;
    weightedSignalSum += W_DOCKET * VERDICT_MAP[docket.verdict] * (docket.confidence / 100);
  }

  sumW += W_WIRE;
  weightedSignalSum += W_WIRE * VERDICT_MAP[wire.verdict] * (wire.confidence / 100);

  const blended = Number((weightedSignalSum / sumW + caps.bias).toFixed(3));

  // Conflict check: Tape vs Docket opposite signs
  const tapeSign = Math.sign(VERDICT_MAP[tape.verdict]);
  const docketSign = Math.sign(VERDICT_MAP[docket.verdict]);
  const isConflict = !filingsDown && docket.verdict !== 'UNAVAILABLE' && tapeSign !== 0 && docketSign !== 0 && (tapeSign * docketSign === -1);

  const conflicts: { title: string; detail: string }[] = [];
  if (isConflict) {
    conflicts.push({
      title: "Agent Conflict Detected",
      detail: `Tape is ${tape.verdict} (${tape.stance >= 0 ? '+' : ''}${tape.stance.toFixed(2)}) while Docket is ${docket.verdict} (${docket.stance >= 0 ? '+' : ''}${docket.stance.toFixed(2)}). Chair will not average this away.`,
    });
  }

  // Portfolio calculation (MUST use last close of each holding, not avg price)
  let totalStockMarketValue = 0;
  let tickerCurrentMv = 0;

  for (const h of person.holdings) {
    const bars = allPrices[h.ticker];
    const lastClose = bars && bars.length > 0 ? bars[bars.length - 1].close : h.avg;
    const mv = lastClose * h.qty;
    totalStockMarketValue += mv;
    if (h.ticker === ticker) {
      tickerCurrentMv = mv;
    }
  }

  const book = totalStockMarketValue + person.cash;
  const currentWeightTicker = book > 0 ? (tickerCurrentMv / book) : 0;
  const room = Math.max(0, caps.maxSingleName - currentWeightTicker);
  const cashW = book > 0 ? (person.cash / book) : 0;

  const smallPct = Math.min(caps.sizeCap * 0.5, room, cashW);
  const fullPct = Math.min(caps.sizeCap, room, cashW);

  // Veto if room < 0.5% or smallPct < 0.5%
  const veto = room < 0.005 || smallPct < 0.005;

  // Raw action scores
  let avoidRaw = 0.55 - 0.8 * blended;
  let holdRaw = 0.75 - 0.9 * Math.abs(blended);
  let smallRaw = 0.40 + 0.9 * blended;
  let fullRaw = 0.10 + 1.1 * blended;

  if (isConflict) {
    fullRaw -= 0.45;
    smallRaw -= 0.18;
  }

  if (filingsDown) {
    fullRaw -= 0.25;
    smallRaw -= 0.08;
    avoidRaw += 0.05;
  }

  if (veto) {
    smallRaw = -1.0;
    fullRaw = -1.0;
    avoidRaw += 0.25;
  }

  if (risk10Used < 4) {
    fullRaw -= 0.30;
    smallRaw -= 0.08;
  } else if (risk10Used > 6) {
    smallRaw += 0.10;
    avoidRaw -= 0.08;
  }

  // Linear scaling of fits to [30, 100] so max = 100
  const actions: { id: ActionId; raw: number; isVetoed: boolean }[] = [
    { id: "avoid", raw: avoidRaw, isVetoed: false },
    { id: "hold", raw: holdRaw, isVetoed: false },
    { id: "small_add", raw: smallRaw, isVetoed: veto },
    { id: "full_add", raw: fullRaw, isVetoed: veto },
  ];

  const nonVetoed = actions.filter(a => !a.isVetoed);
  const maxRaw = Math.max(...nonVetoed.map(a => a.raw));
  const minRaw = Math.min(...nonVetoed.map(a => a.raw));

  const fitsMap: Record<ActionId, number> = {
    avoid: 30,
    hold: 30,
    small_add: 10,
    full_add: 10,
  };

  for (const act of actions) {
    if (act.isVetoed) {
      fitsMap[act.id] = 10;
    } else {
      if (maxRaw === minRaw) {
        fitsMap[act.id] = 100;
      } else {
        const scaled = 30 + 70 * ((act.raw - minRaw) / (maxRaw - minRaw));
        fitsMap[act.id] = Math.round(scaled);
      }
    }
  }

  // Format labels with computed percentages
  const labelsMap: Record<ActionId, string> = {
    avoid: "Avoid name",
    hold: "Hold current lot",
    small_add: `Small add ${(smallPct * 100).toFixed(1)}%`,
    full_add: `Full add ${(fullPct * 100).toFixed(1)}%`,
  };

  const whyMap: Record<ActionId, string> = {
    avoid: "High divergence or risk-adjusted headwind recommends clearing exposure.",
    hold: "Current balance of signals warrants staying in position without allocating new risk.",
    small_add: `Controlled allocation of ${(smallPct * 100).toFixed(1)}% within portfolio single-name capacity.`,
    full_add: `High-conviction allocation of ${(fullPct * 100).toFixed(1)}% up to full sizing cap.`,
  };

  // Determine best action (with tie breaking within 2 points)
  const candidateList = [...actions].sort((a, b) => fitsMap[b.id] - fitsMap[a.id]);
  let best: ActionId = candidateList[0].id;

  const topFit = fitsMap[candidateList[0].id];
  const closeCandidates = candidateList.filter(c => Math.abs(fitsMap[c.id] - topFit) <= 2 && !c.isVetoed);

  if (closeCandidates.length > 1) {
    const conservativeOrder: ActionId[] = ["avoid", "hold", "small_add", "full_add"];
    const aggressiveOrder: ActionId[] = ["full_add", "small_add", "hold", "avoid"];
    const order = risk10Used < 5 ? conservativeOrder : aggressiveOrder;
    for (const opt of order) {
      if (closeCandidates.some(c => c.id === opt)) {
        best = opt;
        break;
      }
    }
  }

  // Ensure top candidate gets exactly fit 100
  fitsMap[best] = 100;

  const menu: ActionFit[] = (["avoid", "hold", "small_add", "full_add"] as ActionId[]).map(id => ({
    id,
    label: labelsMap[id],
    fit: fitsMap[id],
    gap: 100 - fitsMap[id],
    why: whyMap[id],
  }));

  // Build headline in plain English
  let headline = "";
  if (veto) {
    headline = `Concentration cap reached on ${ticker}: additions vetoed; ${best === 'avoid' ? 'Avoid/trim' : 'Hold'} recommended.`;
  } else if (isConflict) {
    headline = `Tape and filings split on ${ticker}: Chair favors ${labelsMap[best].toLowerCase()} with caution.`;
  } else if (best === "full_add") {
    headline = `Signals align favorably for ${ticker}: initiate full ${(fullPct * 100).toFixed(1)}% add.`;
  } else if (best === "small_add") {
    headline = `Controlled entry on ${ticker}: initiate small ${(smallPct * 100).toFixed(1)}% add.`;
  } else if (best === "hold") {
    headline = `Neutral stance on ${ticker}: maintain existing lot without adding capital.`;
  } else {
    headline = `Defensive posture on ${ticker}: avoid new risk allocation.`;
  }

  // 2-4 sentence why explanation
  const heaviestTapeFactor = [...tape.factors].sort((a, b) => b.weight - a.weight)[0];
  const docketSourceId = docket.sources.length > 0 ? docket.sources[0].id : (filingsDown ? "offline corpus" : "no filings cited");
  const secondBest = menu.filter(m => m.id !== best).sort((a, b) => a.gap - b.gap)[0];

  const why = `Tape heaviest factor is ${heaviestTapeFactor.label} (weight ${(heaviestTapeFactor.weight * 100).toFixed(0)}%), while Docket grounded reasoning cites ${docketSourceId}. Single-name capacity has ${(room * 100).toFixed(1)}% room remaining (current weight ${(currentWeightTicker * 100).toFixed(1)}% vs max ${(caps.maxSingleName * 100).toFixed(1)}%). Chair selects ${labelsMap[best]}; ${labelsMap[secondBest.id]} is ${secondBest.gap} points lower fit.`;

  // Personalization bullets
  const personalization: string[] = [
    `Ledger history: ${features.nTrades} trades, turnover ₹${features.turnover.toLocaleString('en-IN')}`,
    `Personal risk score: ${risk10Used.toFixed(1)}/10 (${features.eligible ? 'Personalized profile' : 'Default profile - thin ledger'})`,
    `Tape preference: ${(heaviestTapeFactor.weight * 100).toFixed(0)}% weight on ${heaviestTapeFactor.label}`,
    `Single-name concentration limit: ${(caps.maxSingleName * 100).toFixed(0)}% (room: ${(room * 100).toFixed(1)}%)`,
  ];

  // Motive hints (Motive MUST NOT change best or numeric fits)
  const smallAddGap = menu.find(m => m.id === "small_add")?.gap || 0;
  const fullAddGap = menu.find(m => m.id === "full_add")?.gap || 0;
  const avoidGap = menu.find(m => m.id === "avoid")?.gap || 0;
  const holdGap = menu.find(m => m.id === "hold")?.gap || 0;

  const motiveHint: Record<Motive, string> = {
    unsure: `Best fit is ${labelsMap[best]}.`,
    want_buy: (best === "small_add" || best === "full_add")
      ? "Your motive matches the desk."
      : (veto 
          ? `You want to buy, but additions are vetoed by portfolio caps. Desk prefers ${labelsMap[best]}.`
          : `You want to buy. Desk still prefers ${labelsMap[best]}. Least-bad buy is ${labelsMap.small_add} (−${smallAddGap}). Full add is −${fullAddGap}.`),
    dont_buy: (best === "avoid" || best === "hold")
      ? "Your motive matches the desk."
      : `You want to avoid/hold. Desk prefers ${labelsMap[best]}. Alternative defensive stance is ${labelsMap.hold} (−${holdGap}) or ${labelsMap.avoid} (−${avoidGap}).`,
  };

  const sources: Source[] = [];
  if (tape.sources.length > 0) sources.push(...tape.sources);
  if (!filingsDown && docket.sources.length > 0) sources.push(...docket.sources);
  if (wire.sources.length > 0) sources.push(...wire.sources);

  const warnings: string[] = [];
  if (filingsDown) {
    warnings.push("Filings corpus unreachable. Operating in degraded mode without regulatory filings grounding.");
  }
  if (veto) {
    warnings.push(`Position size limit reached for ${ticker}. Capital addition is disabled by portfolio safety rules.`);
  }

  // System confidence
  const conf = Math.round((tape.confidence * 0.4 + (filingsDown ? 0 : docket.confidence * 0.4) + wire.confidence * 0.2) / (filingsDown ? 0.6 : 1.0));

  return {
    best,
    headline,
    why,
    confidence: conf,
    blended,
    room: Number(room.toFixed(4)),
    veto,
    menu,
    motiveHint,
    conflicts,
    sources,
    personalization,
    warnings,
  };
}
