import type { FC } from 'react';
import type { Person, PriceBar, Ticker } from '../types';
import { Wallet } from 'lucide-react';

interface HoldingsTableProps {
  person: Person;
  allPrices: Record<Ticker, PriceBar[]>;
  currentTicker: Ticker;
}

export const HoldingsTable: FC<HoldingsTableProps> = ({
  person,
  allPrices,
  currentTicker,
}) => {
  // Calculate market values using last close
  let totalStockMv = 0;
  const holdingRows = person.holdings.map((h) => {
    const bars = allPrices[h.ticker];
    const lastClose = bars && bars.length > 0 ? bars[bars.length - 1].close : h.avg;
    const mv = lastClose * h.qty;
    totalStockMv += mv;
    const pnlPct = ((lastClose - h.avg) / h.avg) * 100;
    return {
      ...h,
      lastClose,
      mv,
      pnlPct,
    };
  });

  const totalBook = totalStockMv + person.cash;

  return (
    <div className="bg-[#212A33] border border-[#2e3a47] rounded-xl p-4 sm:p-5 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1c222e] mb-3.5">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#9aa4b7]" />
          <span className="text-xs font-mono-num font-bold uppercase tracking-wider text-[#d0d6e2]">
            {person.name}'s Portfolio Book (Marked to Last Close)
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono-num">
          <span className="text-[#8892a3]">
            Cash: <span className="text-[#f0ede6] font-semibold">₹{person.cash.toLocaleString('en-IN')}</span>
          </span>
          <span className="text-[#8892a3]">
            Book: <span className="text-[#f0ede6] font-semibold">₹{Math.round(totalBook).toLocaleString('en-IN')}</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono-num">
          <thead>
            <tr className="border-b border-[#181e2a] text-[#6d7687] uppercase text-[10px]">
              <th className="pb-2">Asset</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2">Avg Buy</th>
              <th className="pb-2">Last Close</th>
              <th className="pb-2">Market Val</th>
              <th className="pb-2">Weight</th>
              <th className="pb-2 text-right">Unrealized</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#151a24] text-[#c6c3bb]">
            {holdingRows.map((row) => {
              const weight = totalBook > 0 ? (row.mv / totalBook) * 100 : 0;
              const isTarget = row.ticker === currentTicker;

              return (
                <tr
                  key={row.ticker}
                  className={`hover:bg-[#151922] transition-colors ${
                    isTarget ? 'bg-[#151a24] font-semibold text-[#f5f2eb]' : ''
                  }`}
                >
                  <td className="py-2 flex items-center gap-1.5">
                    {isTarget && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    <span>{row.ticker}</span>
                  </td>
                  <td className="py-2 text-[#9da5b3]">{row.qty}</td>
                  <td className="py-2 text-[#9da5b3]">₹{row.avg.toFixed(2)}</td>
                  <td className="py-2 text-[#ded9ce]">₹{row.lastClose.toFixed(2)}</td>
                  <td className="py-2 text-[#ded9ce]">₹{Math.round(row.mv).toLocaleString('en-IN')}</td>
                  <td className="py-2 text-[#8b95a6]">{weight.toFixed(1)}%</td>
                  <td className={`py-2 text-right ${row.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.pnlPct >= 0 ? '+' : ''}{row.pnlPct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}

            {/* Cash row */}
            <tr className="text-[#8892a3]">
              <td className="py-2">CASH (INR)</td>
              <td className="py-2">-</td>
              <td className="py-2">-</td>
              <td className="py-2">-</td>
              <td className="py-2">₹{person.cash.toLocaleString('en-IN')}</td>
              <td className="py-2">{((person.cash / totalBook) * 100).toFixed(1)}%</td>
              <td className="py-2 text-right">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
