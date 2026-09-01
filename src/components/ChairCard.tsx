import React, { useState } from 'react';
import type { ActionId, ChiefOutput, Motive, Person, Ticker } from '../types';
import { CheckCircle2, Shield, Eye, AlertOctagon, UserCheck, ArrowRight, Bookmark } from 'lucide-react';

interface ChairCardProps {
  chief: ChiefOutput;
  person: Person;
  ticker: Ticker;
  onRerunWithPerson?: (newPersonId: string) => void;
  onToggleWatch?: () => void;
  isWatching?: boolean;
}

export const ChairCard: React.FC<ChairCardProps> = ({
  chief,
  person,
  ticker,
  onRerunWithPerson,
  onToggleWatch,
  isWatching = false,
}) => {
  const [motive, setMotive] = useState<Motive>("unsure");

  // Determine other eligible person for comparison button
  const otherPersonId = person.id === 'asha' ? 'vikram' : 'asha';
  const otherPersonName = person.id === 'asha' ? 'Vikram Rao' : 'Asha Menon';

  const getBestActionBadge = (best: ActionId) => {
    switch (best) {
      case 'full_add':
        return 'bg-emerald-900/60 text-emerald-200 border-emerald-600/70';
      case 'small_add':
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-700/60';
      case 'avoid':
        return 'bg-rose-950/60 text-rose-200 border-rose-700/70';
      case 'hold':
      default:
        return 'bg-zinc-800 text-zinc-200 border-zinc-600';
    }
  };

  return (
    <div className="bg-[#212A33] border-2 border-[#38485a] rounded-xl p-5 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Top Bar with SIMULATED stamp */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#1f2737] mb-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#d4d8df]" />
          <span className="text-xs font-mono-num font-semibold uppercase tracking-wider text-[#9aa4b7]">
            {ticker} Chair Synthesis Desk
          </span>
          <span className="text-xs text-[#5f687a]">·</span>
          <span className="text-xs font-mono-num text-[#858f9f]">
            Confidence: {chief.confidence}%
          </span>
        </div>

        {/* Mandatory Stamp */}
        <div className="px-2.5 py-1 rounded bg-[#181d28] border border-[#2e384c] text-[10px] font-mono-num tracking-wider uppercase text-[#c2c8d4] flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>SIMULATED · sample tape · not advice</span>
        </div>
      </div>

      {/* Main Chair Decision Stamp */}
      <div className="mb-6">
        <div className="flex flex-wrap items-baseline gap-3 mb-2">
          <span className="text-xs font-mono-num text-[#7b8596] uppercase tracking-wider">
            Consensus Action:
          </span>
          <span className={`text-sm sm:text-base font-mono-num font-bold px-3 py-1 rounded-md border tracking-wide uppercase ${getBestActionBadge(chief.best)}`}>
            {chief.menu.find(m => m.id === chief.best)?.label || chief.best}
          </span>
          {chief.veto && (
            <span className="text-xs font-mono-num text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" /> Concentration Cap Active
            </span>
          )}
        </div>

        {/* Serif Headline */}
        <h2 className="font-serif-title text-2xl md:text-4xl text-[#f5f2eb] leading-tight mt-2 mb-3">
          {chief.headline}
        </h2>

        {/* Why 2-4 sentences */}
        <p className="text-xs sm:text-sm text-[#b8b4ab] leading-relaxed font-sans bg-[#0c0e14] p-3.5 rounded-lg border border-[#1b2230]">
          {chief.why}
        </p>
      </div>

      {/* Action Menu (4 options) */}
      <div className="mb-6">
        <div className="text-xs font-mono-num uppercase tracking-wider text-[#798394] mb-2.5 flex items-center justify-between">
          <span>Action Fit Menu & Relative Gaps</span>
        </div>

        <div className="space-y-2">
          {chief.menu.map((act) => {
            const isBest = act.id === chief.best;
            return (
              <div
                key={act.id}
                className={`p-3 rounded-lg border transition-all ${
                  isBest
                    ? 'bg-[#151a24] border-zinc-500 shadow-md ring-1 ring-zinc-500/30'
                    : 'bg-[#0d0f15] border-[#1a202d] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {isBest ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-700 flex items-center justify-center text-[9px] font-mono-num text-zinc-500 shrink-0">
                        -
                      </div>
                    )}
                    <span className={`text-xs font-semibold ${isBest ? 'text-[#f0ede6]' : 'text-[#a39f97]'}`}>
                      {act.label}
                    </span>
                    {isBest && (
                      <span className="text-[10px] font-mono-num uppercase tracking-wider bg-zinc-700 text-zinc-200 px-1.5 py-0.2 rounded">
                        Best Choice
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono-num">
                    {!isBest && (
                      <span className="text-[11px] text-[#858e9f] font-medium">
                        {act.gap} worse
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-[#171c26] rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isBest ? 'bg-[#d0d4dd]' : 'bg-[#3b4456]'
                    }`}
                    style={{ width: `${act.fit}%` }}
                  />
                </div>

                <div className="text-[11px] text-[#788294] font-mono-num">
                  {act.why}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motive Segmented Control */}
      <div className="mb-6 bg-[#0c0e14] border border-[#1b2230] rounded-xl p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-mono-num uppercase tracking-wider text-[#8e98aa]">
            Test User Motive (Does Not Alter Fit)
          </span>
          <span className="text-[10px] text-[#5e6777] font-mono-num">
            Interactive alignment filter
          </span>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#141822] p-1 rounded-lg border border-[#202735] mb-2.5">
          {(
            [
              { id: "unsure", label: "Unsure / Neutral" },
              { id: "want_buy", label: "I want to buy" },
              { id: "dont_buy", label: "I want to avoid/hold" },
            ] as { id: Motive; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMotive(tab.id)}
              className={`py-2 px-2 rounded text-[11px] font-medium transition-all text-center ${
                motive === tab.id
                  ? 'bg-[#252e3e] text-[#f0ede6] border border-[#3b475e] shadow-sm'
                  : 'text-[#7d8697] hover:text-[#c4cbd8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Motive Advice */}
        <div className="text-xs text-[#ded9ce] font-mono-num bg-[#11151e] p-2.5 rounded border border-[#1d2433] flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#8a95a8] shrink-0" />
          <span>{chief.motiveHint[motive]}</span>
        </div>
      </div>

      {/* Personalization & Ledger Footprint */}
      <div className="mb-6 pt-4 border-t border-[#1d2434]">
        <div className="text-xs font-mono-num uppercase tracking-wider text-[#798395] mb-2 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-[#9da7b8]" />
          <span>Ledger & Risk Footprint</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#a9a59c] font-mono-num">
          {chief.personalization.map((item, idx) => (
            <div key={idx} className="bg-[#0e1017] p-2 rounded border border-[#191f2b] flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#5d6778]"></span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#1d2434]">
        {onRerunWithPerson && (
          <button
            type="button"
            onClick={() => onRerunWithPerson(otherPersonId)}
            className="text-xs font-medium text-[#c0c6d2] hover:text-[#f0ede6] bg-[#161b24] hover:bg-[#1f2633] border border-[#273041] px-3 py-3 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Compare with {otherPersonName}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {onToggleWatch && (
          <button
            type="button"
            onClick={onToggleWatch}
            className={`text-xs font-medium px-3.5 py-3 rounded-lg transition-colors flex items-center gap-1.5 border ${
              isWatching
                ? 'bg-amber-950/50 text-amber-200 border-amber-700/60'
                : 'bg-[#181d27] text-[#e0dcd5] border-[#293244] hover:bg-[#222938]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isWatching ? 'Hold Watch Active' : 'Hold this name (Watch)'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
