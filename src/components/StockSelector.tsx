import React from 'react';
import type { PriceBar, Ticker } from '../types';
import { Sparkline } from './Sparkline';

interface StockSelectorProps {
  tickers: Ticker[];
  selectedTicker: Ticker;
  onSelectTicker: (ticker: Ticker) => void;
  pricesData: Record<Ticker, PriceBar[]>;
}

export const StockSelector: React.FC<StockSelectorProps> = ({
  tickers,
  selectedTicker,
  onSelectTicker,
  pricesData,
}) => {
  return (
    <div className="mb-6">
      <div className="text-xs font-mono-num uppercase tracking-wider text-[#798394] mb-2.5 flex items-center justify-between">
        <span>2. Select Equity Instrument</span>
        <span className="text-[10px] text-[#5b6474]">30-Day Simulated Universe Tape</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {tickers.map((t) => {
          const isSelected = t === selectedTicker;
          const bars = pricesData[t] || [];
          const lastBar = bars[bars.length - 1];
          const prevBar = bars[bars.length - 2];
          const lastClose = lastBar ? lastBar.close : 0;
          const d1Pct = (lastBar && prevBar) ? ((lastBar.close - prevBar.close) / prevBar.close) * 100 : 0;
          const closes = bars.map(b => b.close);

          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelectTicker(t)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#293644] border-zinc-400 ring-1 ring-zinc-400/30 shadow-md'
                  : 'bg-[#212A33] border-[#2e3a47] hover:border-[#3e4f62] hover:bg-[#26313d]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#f0ede6] font-mono-num">
                    {t}
                  </span>
                  <span className={`text-[10px] font-mono-num font-semibold px-1 py-0.2 rounded ${
                    d1Pct >= 0 ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                  }`}>
                    {d1Pct >= 0 ? '+' : ''}{d1Pct.toFixed(1)}%
                  </span>
                </div>

                <div className="text-sm font-semibold font-mono-num text-[#dcd7cb] mb-2">
                  ₹{lastClose.toFixed(2)}
                </div>
              </div>

              {/* Sparkline */}
              <div className="w-full h-8 mt-1 opacity-75">
                <Sparkline data={closes} height={32} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
