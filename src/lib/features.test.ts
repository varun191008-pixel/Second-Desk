import { describe, it, expect } from 'vitest';
import { parseLedgerCsv, computeFeatures } from './features';
import scalesData from '../data/scales.json';
import ashaCsv from '../data/ledgers/asha.csv?raw';
import vikramCsv from '../data/ledgers/vikram.csv?raw';
import thinCsv from '../data/ledgers/thin.csv?raw';

describe('Features calculation on shipped ledgers', () => {
  it('calculates Asha features correctly: eligible true, risk10 in [1.5, 4.5], fadeRate > chaseRate', () => {
    const rows = parseLedgerCsv(ashaCsv);
    const features = computeFeatures(rows, scalesData.sigma5);

    expect(features.eligible).toBe(true);
    expect(features.nTrades).toBe(12);
    expect(features.fadeRate).toBeGreaterThan(features.chaseRate);
    expect(features.risk10).toBeGreaterThanOrEqual(1.5);
    expect(features.risk10).toBeLessThanOrEqual(4.5);
  });

  it('calculates Vikram features correctly: eligible true, risk10 in [6.0, 9.0], chaseRate > 0.4', () => {
    const rows = parseLedgerCsv(vikramCsv);
    const features = computeFeatures(rows, scalesData.sigma5);

    expect(features.eligible).toBe(true);
    expect(features.chaseRate).toBeGreaterThan(0.4);
    expect(features.risk10).toBeGreaterThanOrEqual(6.0);
    expect(features.risk10).toBeLessThanOrEqual(9.0);
  });

  it('calculates Thin features correctly: eligible false, nTrades === 3, turnover < 100000', () => {
    const rows = parseLedgerCsv(thinCsv);
    const features = computeFeatures(rows, scalesData.sigma5);

    expect(features.eligible).toBe(false);
    expect(features.nTrades).toBe(3);
    expect(features.turnover).toBeLessThan(100000);
  });
});
