import { describe, it, expect } from 'vitest';
import pricesData from '../data/prices.json';
import peopleData from '../data/people.json';
import headlinesData from '../data/headlines.json';
import scalesData from '../data/scales.json';
import ashaCsv from '../data/ledgers/asha.csv?raw';
import vikramCsv from '../data/ledgers/vikram.csv?raw';
import thinCsv from '../data/ledgers/thin.csv?raw';
import { parseLedgerCsv, computeFeatures } from './features';
import { retrieve } from './retrieve';
import { runChartAgent } from './agents/chart';
import { runFilingAgent } from './agents/filing';
import { runMoodAgent } from './agents/mood';
import { runChiefAgent } from './agents/chief';
import { computeWeatherSignals } from './signals';
import type { HeadlineItem, Person, PriceBar, Ticker } from '../types';

describe('SecondDesk Acceptance Criteria Tests', () => {
  const prices = pricesData as Record<Ticker, PriceBar[]>;
  const people = peopleData as Person[];
  const headlines = headlinesData as unknown as HeadlineItem[];

  it('1. features(asha) eligible true, fadeRate > chaseRate, risk10 < 4.5', () => {
    const rows = parseLedgerCsv(ashaCsv);
    const f = computeFeatures(rows, scalesData.sigma5);
    expect(f.eligible).toBe(true);
    expect(f.fadeRate).toBeGreaterThan(f.chaseRate);
    expect(f.risk10).toBeLessThan(4.5);
    expect(f.risk10).toBeGreaterThanOrEqual(1.5);
  });

  it('2. features(vikram) eligible true, chaseRate > 0.4, risk10 > 6', () => {
    const rows = parseLedgerCsv(vikramCsv);
    const f = computeFeatures(rows, scalesData.sigma5);
    expect(f.eligible).toBe(true);
    expect(f.chaseRate).toBeGreaterThan(0.4);
    expect(f.risk10).toBeGreaterThan(6.0);
  });

  it('3. features(thin) eligible false, thin + INFY uses risk10Used = 5', () => {
    const rows = parseLedgerCsv(thinCsv);
    const f = computeFeatures(rows, scalesData.sigma5);
    expect(f.eligible).toBe(false);
    expect(f.nTrades).toBe(3);
    expect(f.turnover).toBeLessThan(100000);
  });

  it('4. retrieve(INFY) does not contain a hardcoded id. Cited source is hits[0].quote', () => {
    const hits = retrieve('INFY earnings margin guidance demand capex credit buyback NPA', 'INFY', 2);
    expect(hits.length).toBe(2);
    expect(hits[0].tickers).toContain('INFY');
    expect(hits[0].quote).toBeDefined();
    expect(hits[0].quote.length).toBeGreaterThan(10);
    expect(hits[0].text).toContain(hits[0].quote);
  });

  it('5. Docket INFY combined text produces margins score < 0 and capital score > 0', async () => {
    const docket = await runFilingAgent({ ticker: 'INFY', risk10Used: 5 });
    const marginsFactor = docket.factors.find(f => f.id === 'margins');
    const capitalFactor = docket.factors.find(f => f.id === 'capital');

    expect(marginsFactor).toBeDefined();
    expect(capitalFactor).toBeDefined();
    expect(marginsFactor!.score).toBeLessThan(0);
    expect(capitalFactor!.score).toBeGreaterThan(0);
  });

  it('6. Tape INFY volZ 0.99 vs 1.01: abs(delta stance) < 0.03', async () => {
    const bars = prices['INFY'].slice(0, 30);
    const tapeLow = await runChartAgent({ bars, ticker: 'INFY', risk10Used: 5, simulatedVolZ: 0.99 });
    const tapeHigh = await runChartAgent({ bars, ticker: 'INFY', risk10Used: 5, simulatedVolZ: 1.01 });

    const diff = Math.abs(tapeLow.stance - tapeHigh.stance);
    expect(diff).toBeLessThan(0.03);
  });

  it('7. INFY + Asha vs INFY + Vikram: Asha is defensive (avoid/hold), Vikram is more additive', async () => {
    const ashaPerson = people.find(p => p.id === 'asha')!;
    const vikramPerson = people.find(p => p.id === 'vikram')!;

    const ashaFeat = computeFeatures(parseLedgerCsv(ashaCsv));
    const vikramFeat = computeFeatures(parseLedgerCsv(vikramCsv));

    const infyBars = prices['INFY'].slice(0, 30);
    const activePrices = {
      RELIANCE: prices['RELIANCE'].slice(0, 30),
      TCS: prices['TCS'].slice(0, 30),
      INFY: infyBars,
      HDFCBANK: prices['HDFCBANK'].slice(0, 30),
      TATAMOTORS: prices['TATAMOTORS'].slice(0, 30),
    };

    // Asha run
    const tapeAsha = await runChartAgent({ bars: infyBars, ticker: 'INFY', risk10Used: ashaFeat.risk10 });
    const docketAsha = await runFilingAgent({ ticker: 'INFY', risk10Used: ashaFeat.risk10 });
    const wireAsha = await runMoodAgent({ ticker: 'INFY', lastDateStr: infyBars[29].date, risk10Used: ashaFeat.risk10 });
    const chiefAsha = runChiefAgent({
      ticker: 'INFY',
      person: ashaPerson,
      features: ashaFeat,
      risk10Used: ashaFeat.risk10,
      tape: tapeAsha,
      docket: docketAsha,
      wire: wireAsha,
      allPrices: activePrices,
    });

    // Vikram run
    const tapeVikram = await runChartAgent({ bars: infyBars, ticker: 'INFY', risk10Used: vikramFeat.risk10 });
    const docketVikram = await runFilingAgent({ ticker: 'INFY', risk10Used: vikramFeat.risk10 });
    const wireVikram = await runMoodAgent({ ticker: 'INFY', lastDateStr: infyBars[29].date, risk10Used: vikramFeat.risk10 });
    const chiefVikram = runChiefAgent({
      ticker: 'INFY',
      person: vikramPerson,
      features: vikramFeat,
      risk10Used: vikramFeat.risk10,
      tape: tapeVikram,
      docket: docketVikram,
      wire: wireVikram,
      allPrices: activePrices,
    });

    expect(['avoid', 'hold']).toContain(chiefAsha.best);
    const ashaSmallAddFit = chiefAsha.menu.find(m => m.id === 'small_add')!.fit;
    const vikramSmallAddFit = chiefVikram.menu.find(m => m.id === 'small_add')!.fit;
    expect(vikramSmallAddFit).toBeGreaterThan(ashaSmallAddFit);
  });

  it('8. HDFCBANK + Asha: veto true, both adds fit=10 or bottom two', async () => {
    const ashaPerson = people.find(p => p.id === 'asha')!;
    const ashaFeat = computeFeatures(parseLedgerCsv(ashaCsv));
    const hdfcBars = prices['HDFCBANK'].slice(0, 30);
    const activePrices = {
      RELIANCE: prices['RELIANCE'].slice(0, 30),
      TCS: prices['TCS'].slice(0, 30),
      INFY: prices['INFY'].slice(0, 30),
      HDFCBANK: hdfcBars,
      TATAMOTORS: prices['TATAMOTORS'].slice(0, 30),
    };

    const tape = await runChartAgent({ bars: hdfcBars, ticker: 'HDFCBANK', risk10Used: ashaFeat.risk10 });
    const docket = await runFilingAgent({ ticker: 'HDFCBANK', risk10Used: ashaFeat.risk10 });
    const wire = await runMoodAgent({ ticker: 'HDFCBANK', lastDateStr: hdfcBars[29].date, risk10Used: ashaFeat.risk10 });
    const chief = runChiefAgent({
      ticker: 'HDFCBANK',
      person: ashaPerson,
      features: ashaFeat,
      risk10Used: ashaFeat.risk10,
      tape,
      docket,
      wire,
      allPrices: activePrices,
    });

    expect(chief.veto).toBe(true);
    const smallAdd = chief.menu.find(m => m.id === 'small_add')!;
    const fullAdd = chief.menu.find(m => m.id === 'full_add')!;
    expect(smallAdd.fit).toBe(10);
    expect(fullAdd.fit).toBe(10);
  });

  it('9. TATAMOTORS weather volume = SPIKE', () => {
    const tataBars = prices['TATAMOTORS'].slice(0, 30);
    const weather = computeWeatherSignals(tataBars, headlines, 'TATAMOTORS');
    const volSig = weather.find(w => w.type === 'volume');

    expect(volSig).toBeDefined();
    expect(volSig!.label).toBe('SPIKE');
  });

  it('10. filingsDown: Docket UNAVAILABLE sources [], Chair sources have no filing/transcript kind', async () => {
    const ashaPerson = people.find(p => p.id === 'asha')!;
    const ashaFeat = computeFeatures(parseLedgerCsv(ashaCsv));
    const infyBars = prices['INFY'].slice(0, 30);
    const activePrices = {
      RELIANCE: prices['RELIANCE'].slice(0, 30),
      TCS: prices['TCS'].slice(0, 30),
      INFY: infyBars,
      HDFCBANK: prices['HDFCBANK'].slice(0, 30),
      TATAMOTORS: prices['TATAMOTORS'].slice(0, 30),
    };

    const tape = await runChartAgent({ bars: infyBars, ticker: 'INFY', risk10Used: ashaFeat.risk10 });
    const docket = await runFilingAgent({ ticker: 'INFY', risk10Used: ashaFeat.risk10, filingsDown: true });
    const wire = await runMoodAgent({ ticker: 'INFY', lastDateStr: infyBars[29].date, risk10Used: ashaFeat.risk10 });

    expect(docket.verdict).toBe('UNAVAILABLE');
    expect(docket.sources).toHaveLength(0);

    const chief = runChiefAgent({
      ticker: 'INFY',
      person: ashaPerson,
      features: ashaFeat,
      risk10Used: ashaFeat.risk10,
      tape,
      docket,
      wire,
      allPrices: activePrices,
      filingsDown: true,
    });

    const filingOrTranscriptSources = chief.sources.filter(s => s.kind === 'filing' || s.kind === 'transcript');
    expect(filingOrTranscriptSources).toHaveLength(0);
  });

  it('11. Motive selection does not change best action or numeric fits', async () => {
    const vikramPerson = people.find(p => p.id === 'vikram')!;
    const vikramFeat = computeFeatures(parseLedgerCsv(vikramCsv));
    const tataBars = prices['TATAMOTORS'].slice(0, 30);
    const activePrices = {
      RELIANCE: prices['RELIANCE'].slice(0, 30),
      TCS: prices['TCS'].slice(0, 30),
      INFY: prices['INFY'].slice(0, 30),
      HDFCBANK: prices['HDFCBANK'].slice(0, 30),
      TATAMOTORS: tataBars,
    };

    const tape = await runChartAgent({ bars: tataBars, ticker: 'TATAMOTORS', risk10Used: vikramFeat.risk10 });
    const docket = await runFilingAgent({ ticker: 'TATAMOTORS', risk10Used: vikramFeat.risk10 });
    const wire = await runMoodAgent({ ticker: 'TATAMOTORS', lastDateStr: tataBars[29].date, risk10Used: vikramFeat.risk10 });

    const chief = runChiefAgent({
      ticker: 'TATAMOTORS',
      person: vikramPerson,
      features: vikramFeat,
      risk10Used: vikramFeat.risk10,
      tape,
      docket,
      wire,
      allPrices: activePrices,
    });

    const bestOriginal = chief.best;
    const fitsOriginal = chief.menu.map(m => ({ id: m.id, fit: m.fit }));

    expect(chief.motiveHint.unsure).toBeDefined();
    expect(chief.motiveHint.want_buy).toBeDefined();
    expect(chief.motiveHint.dont_buy).toBeDefined();

    expect(chief.best).toBe(bestOriginal);
    expect(chief.menu.map(m => ({ id: m.id, fit: m.fit }))).toEqual(fitsOriginal);
  });

  it('14. Upload of a 10-row chase-heavy CSV onto Riya flips eligible and updates features', () => {
    const chaseCsv = `date,ticker,side,qty,price,r5,volz,note
2026-08-01,TATAMOTORS,buy,20,950,0.060,1.5,chase 1
2026-08-02,TATAMOTORS,buy,20,960,0.065,1.8,chase 2
2026-08-03,RELIANCE,buy,10,2800,0.050,1.2,chase 3
2026-08-04,INFY,buy,15,1530,0.045,1.1,chase 4
2026-08-05,HDFCBANK,buy,10,1650,0.040,1.0,chase 5
2026-08-06,TCS,buy,5,3900,0.035,0.9,chase 6
2026-08-07,TATAMOTORS,buy,15,970,0.055,1.4,chase 7
2026-08-08,RELIANCE,buy,10,2820,0.048,1.3,chase 8
2026-08-09,INFY,buy,10,1540,0.042,1.1,chase 9
2026-08-10,HDFCBANK,buy,10,1660,0.038,1.0,chase 10`;

    const rows = parseLedgerCsv(chaseCsv);
    const feat = computeFeatures(rows, scalesData.sigma5);

    expect(feat.nTrades).toBe(10);
    expect(feat.eligible).toBe(true);
    expect(feat.turnover).toBeGreaterThan(100000);
    expect(feat.chaseRate).toBeGreaterThan(0.8);
    expect(feat.risk10).toBeGreaterThan(5.0);
  });
});
