import scalesData from '../data/scales.json';
import { clamp } from './stats';
import type { Features, LedgerRow, Ticker } from '../types';

export const MIN_TRADES = 8;
export const MIN_TURNOVER = 100_000;

export function parseLedgerCsv(csvText: string): LedgerRow[] {
  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: LedgerRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 5) continue;

    const rowObj: Record<string, string> = {};
    header.forEach((h, idx) => {
      rowObj[h] = cols[idx] || '';
    });

    const date = rowObj['date'] || cols[0];
    const ticker = (rowObj['ticker'] || cols[1]).toUpperCase() as Ticker;
    const side = (rowObj['side'] || cols[2]).toLowerCase() as "buy" | "sell";
    const qty = Number(rowObj['qty'] || cols[3]) || 0;
    const price = Number(rowObj['price'] || cols[4]) || 0;
    // If r5 or volz missing, treat as 0 (no chase credit)
    const r5 = rowObj['r5'] !== undefined && rowObj['r5'] !== '' ? Number(rowObj['r5']) : (cols[5] !== undefined && cols[5] !== '' ? Number(cols[5]) : 0);
    const volz = rowObj['volz'] !== undefined && rowObj['volz'] !== '' ? Number(rowObj['volz']) : (cols[6] !== undefined && cols[6] !== '' ? Number(cols[6]) : 0);
    const note = rowObj['note'] || cols[7] || '';

    if (qty > 0 && price > 0) {
      rows.push({
        date,
        ticker,
        side,
        qty,
        price,
        r5: isNaN(r5) ? 0 : r5,
        volz: isNaN(volz) ? 0 : volz,
        note,
      });
    }
  }

  return rows;
}

export function computeFeatures(rows: LedgerRow[], sigma5: number = scalesData.sigma5): Features {
  const nTrades = rows.length;
  if (nTrades === 0) {
    return {
      nTrades: 0,
      turnover: 0,
      eligible: false,
      chaseRate: 0,
      fadeRate: 0,
      cutRate: 0,
      shortHold: 0,
      holdDaysMed: 0,
      risk10: 5,
    };
  }

  let turnover = 0;
  let buyCount = 0;
  let chaseBuys = 0;
  let sellCount = 0;
  let fadeSells = 0;
  let cutSells = 0;
  let loserSells = 0;

  // FIFO queues per ticker: array of { date: string, qty: number, price: number }
  const queues: Record<string, { date: string; qty: number; price: number }[]> = {};
  const closedHoldDays: number[] = [];

  for (const row of rows) {
    turnover += row.qty * row.price;

    if (row.side === 'buy') {
      buyCount++;
      if (row.r5 > sigma5) {
        chaseBuys++;
      }
      if (!queues[row.ticker]) {
        queues[row.ticker] = [];
      }
      queues[row.ticker].push({
        date: row.date,
        qty: row.qty,
        price: row.price,
      });
    } else if (row.side === 'sell') {
      sellCount++;
      // A sell is a fade into strength if r5 > 0.025 or note indicates sold into strength
      if (row.r5 > 0.025 || (row.note && row.note.toLowerCase().includes('strength'))) {
        fadeSells++;
      }

      let remainingSellQty = row.qty;
      let totalCostClosed = 0;
      let totalSharesClosed = 0;
      let maxHoldDaysForTrade = 0;

      const tickerQueue = queues[row.ticker] || [];
      const sellDate = new Date(row.date).getTime();

      while (remainingSellQty > 0 && tickerQueue.length > 0) {
        const lot = tickerQueue[0];
        const buyDate = new Date(lot.date).getTime();
        const days = Math.max(1, Math.round((sellDate - buyDate) / (1000 * 60 * 60 * 24)));
        maxHoldDaysForTrade = Math.max(maxHoldDaysForTrade, days);

        if (lot.qty <= remainingSellQty) {
          totalCostClosed += lot.qty * lot.price;
          totalSharesClosed += lot.qty;
          remainingSellQty -= lot.qty;
          closedHoldDays.push(days);
          tickerQueue.shift();
        } else {
          totalCostClosed += remainingSellQty * lot.price;
          totalSharesClosed += remainingSellQty;
          lot.qty -= remainingSellQty;
          remainingSellQty = 0;
          closedHoldDays.push(days);
        }
      }

      if (totalSharesClosed > 0) {
        const avgBuy = totalCostClosed / totalSharesClosed;
        const returnPct = row.price / avgBuy - 1;
        if (returnPct < 0) {
          loserSells++;
          if (maxHoldDaysForTrade <= 10) {
            cutSells++;
          }
        }
      }
    }
  }

  const chaseRate = buyCount > 0 ? chaseBuys / buyCount : 0;
  // fadeRate relative to trades for defensive baseline scaling
  const fadeRate = nTrades > 0 ? fadeSells / nTrades : 0;
  const cutRate = loserSells > 0 ? cutSells / loserSells : (sellCount > 0 ? cutSells / sellCount : 0);

  let holdDaysMed = 30;
  if (closedHoldDays.length > 0) {
    closedHoldDays.sort((a, b) => a - b);
    const mid = Math.floor(closedHoldDays.length / 2);
    holdDaysMed = closedHoldDays.length % 2 !== 0 
      ? closedHoldDays[mid] 
      : (closedHoldDays[mid - 1] + closedHoldDays[mid]) / 2;
  }

  const shortHold = clamp((14 - holdDaysMed) / 14, 0, 1);
  const eligible = nTrades >= MIN_TRADES || turnover >= MIN_TURNOVER;

  const agg = 0.35 * chaseRate + 0.25 * cutRate + 0.20 * (1 - fadeRate) + 0.20 * shortHold;
  const risk10 = Number((10 * clamp(agg, 0, 1)).toFixed(2));

  return {
    nTrades,
    turnover,
    eligible,
    chaseRate: Number(chaseRate.toFixed(4)),
    fadeRate: Number(fadeRate.toFixed(4)),
    cutRate: Number(cutRate.toFixed(4)),
    shortHold: Number(shortHold.toFixed(4)),
    holdDaysMed,
    risk10,
  };
}
