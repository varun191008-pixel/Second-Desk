import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface BannersProps {
  filingsDown?: boolean;
  conflicts?: { title: string; detail: string }[];
}

export const Banners: React.FC<BannersProps> = ({ filingsDown, conflicts }) => {
  return (
    <div className="space-y-3 mb-5">
      {filingsDown && (
        <div className="bg-amber-950/40 border-l-4 border-amber-500 p-3.5 rounded-r-lg flex items-start gap-3 text-amber-200 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold uppercase tracking-wider text-[11px] font-mono-num text-amber-300">
              Degraded Mode · Filings Feed Severed
            </div>
            <div className="mt-0.5 text-amber-200/90 font-mono-num">
              Regulatory filings corpus unreachable. Docket agent is UNAVAILABLE (sources=[]). Chair operates on Tape & Wire signals only with defensive penalty.
            </div>
          </div>
        </div>
      )}

      {conflicts && conflicts.length > 0 && (
        <div className="bg-rose-950/40 border-l-4 border-rose-500 p-3.5 rounded-r-lg flex items-start gap-3 text-rose-200 text-xs sm:text-sm">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold uppercase tracking-wider text-[11px] font-mono-num text-rose-300">
              Agent Conflict Warning
            </div>
            <div className="mt-0.5 text-rose-200/90 font-mono-num">
              {conflicts[0].detail}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
