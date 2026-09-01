import React from 'react';
import type { WeatherSignal } from '../types';
import { TrendingUp, TrendingDown, Minus, Zap, Volume2, MessageSquare } from 'lucide-react';

interface WeatherPillsProps {
  signals: WeatherSignal[];
}

export const WeatherPills: React.FC<WeatherPillsProps> = ({ signals }) => {
  if (!signals || signals.length === 0) return null;

  const getIcon = (type: string, label: string) => {
    if (type === 'momentum') {
      if (label === 'BULLISH') return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      if (label === 'BEARISH') return <TrendingDown className="w-3.5 h-3.5 text-rose-400" />;
      return <Minus className="w-3.5 h-3.5 text-zinc-400" />;
    }
    if (type === 'volume') {
      if (label === 'SPIKE') return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      return <Volume2 className="w-3.5 h-3.5 text-zinc-400" />;
    }
    if (type === 'sentiment') {
      return <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />;
    }
    return null;
  };

  const getBadgeStyle = (label: string) => {
    switch (label) {
      case 'BULLISH':
      case 'POSITIVE':
        return 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300';
      case 'BEARISH':
      case 'NEGATIVE':
        return 'bg-rose-950/40 border-rose-800/50 text-rose-300';
      case 'SPIKE':
        return 'bg-amber-950/40 border-amber-800/50 text-amber-300';
      case 'QUIET':
        return 'bg-blue-950/30 border-blue-800/40 text-blue-300';
      default:
        return 'bg-[#181e28] border-[#293242] text-[#c2c8d2]';
    }
  };

  const getPlainEnglishReason = (type: string, label: string) => {
    if (type === 'momentum') {
      if (label === 'BULLISH') return 'Trending upwards recently.';
      if (label === 'BEARISH') return 'Trending downwards recently.';
      return 'Price action is flat or choppy.';
    }
    if (type === 'volume') {
      if (label === 'SPIKE') return 'Unusually high trading activity.';
      if (label === 'QUIET') return 'Very little trading activity.';
      return 'Typical trading activity.';
    }
    if (type === 'sentiment') {
      if (label === 'POSITIVE') return 'Recent news is mostly good.';
      if (label === 'NEGATIVE') return 'Recent news is mostly bad.';
      return 'Recent news is mixed or quiet.';
    }
    return '';
  };

  return (
    <div className="w-full">
      <div className="text-[11px] font-mono-num uppercase tracking-wider text-[#737c8c] mb-2 flex items-center justify-between">
        <span>Market Weather (Tape & Wire Baseline)</span>
        <span className="text-[10px] text-[#555e6e]">Shared baseline across ledgers</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {signals.map((sig) => (
          <div
            key={sig.type}
            className="bg-[#212A33] border border-[#2e3a47] rounded-lg p-3 md:p-4 flex flex-col justify-between hover:border-[#3d4d5e] transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                {getIcon(sig.type, sig.label)}
                <span className="text-xs font-medium uppercase tracking-wider text-[#9aa2b0]">
                  {sig.type}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold font-mono-num px-1.5 py-0.5 rounded border ${getBadgeStyle(sig.label)}`}>
                  {sig.label}
                </span>
                <span className="text-[10px] font-mono-num text-[#687282]">
                  {sig.confidence}%
                </span>
              </div>
            </div>
            <div className="text-xs text-[#dcd9d2] leading-snug">
              {getPlainEnglishReason(sig.type, sig.label)}
            </div>
            <div className="text-[10px] text-[#5e6675] truncate mt-1">
              {sig.source}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
