import React from 'react';
import { FastForward, Play, RotateCcw, Clock } from 'lucide-react';
import type { Ticker } from '../types';

interface HoldWatchBarProps {
  ticker: Ticker;
  dayIndex: number;
  maxDays?: number;
  onNextSession: () => void;
  onNextWeek: () => void;
  onReset: () => void;
}

export const HoldWatchBar: React.FC<HoldWatchBarProps> = ({
  ticker,
  dayIndex,
  maxDays = 7,
  onNextSession,
  onNextWeek,
  onReset,
}) => {
  return (
    <div className="bg-[#121620] border border-amber-900/40 rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono-num font-bold uppercase tracking-wider text-amber-300">
            Hold Watch Active: {ticker} (Step +{dayIndex} of {maxDays})
          </span>
        </div>
        <div className="text-[11px] font-mono-num text-[#858f9f]">
          Simulating post-close 4:15-4:45 IST and Friday weekly cadence
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onNextSession}
          disabled={dayIndex >= maxDays}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e2636] hover:bg-[#283348] text-[#f0ede6] border border-[#333f57] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 text-amber-400" />
          <span>Next session (+1 day)</span>
        </button>

        <button
          type="button"
          onClick={onNextWeek}
          disabled={dayIndex >= 5}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e2636] hover:bg-[#283348] text-[#f0ede6] border border-[#333f57] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <FastForward className="w-3.5 h-3.5 text-amber-400" />
          <span>Next week (+5 days)</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={dayIndex === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161922] hover:bg-[#202532] text-[#8e97a8] hover:text-[#d0d6e2] border border-[#242b3b] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Tape</span>
        </button>
      </div>
    </div>
  );
};
