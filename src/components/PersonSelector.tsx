import React, { useState } from 'react';
import type { Features, Person } from '../types';
import { User, Upload, Check, AlertCircle } from 'lucide-react';
import { CsvUploadModal } from './CsvUploadModal';

interface PersonSelectorProps {
  people: Person[];
  selectedPersonId: string;
  onSelectPerson: (id: string) => void;
  featuresMap: Record<string, Features>;
  onLedgerUpdated: (personId: string, newFeatures: Features) => void;
}

export const PersonSelector: React.FC<PersonSelectorProps> = ({
  people,
  selectedPersonId,
  onSelectPerson,
  featuresMap,
  onLedgerUpdated,
}) => {
  const [uploadModalPerson, setUploadModalPerson] = useState<Person | null>(null);

  return (
    <div className="mb-6">
      <div className="text-xs font-mono-num uppercase tracking-wider text-[#798394] mb-2.5 flex items-center justify-between">
        <span>1. Select Portfolio Profile (Ledger Grounding)</span>
        <span className="text-[10px] text-[#5b6474]">Defensive / Aggressive computed from trades</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {people.map((p) => {
          const isSelected = p.id === selectedPersonId;
          const feat = featuresMap[p.id];

          return (
            <div
              key={p.id}
              onClick={() => onSelectPerson(p.id)}
              className={`cursor-pointer rounded-xl p-4 border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#293644] border-zinc-400 ring-1 ring-zinc-400/30 shadow-lg'
                  : 'bg-[#212A33] border-[#2e3a47] hover:border-[#3e4f62] hover:bg-[#26313d]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-zinc-700 text-zinc-100' : 'bg-[#181e2a] text-[#8e98aa]'}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#f0ede6] leading-none">
                        {p.name}
                      </h4>
                      <span className="text-[11px] text-[#717b8c] font-mono-num">
                        Age {p.age} · Cash ₹{(p.cash / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-zinc-600 text-zinc-100 flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Bio */}
                <p className="text-xs text-[#a9a59b] leading-relaxed mb-3">
                  {p.bio}
                </p>
              </div>

              <div>
                {/* Eligibility Chip */}
                {feat && (
                  <div className="mb-3">
                    <div
                      className={`text-[11px] font-mono-num px-2.5 py-1 rounded-md border flex items-center justify-between ${
                        feat.eligible
                          ? 'bg-[#111722] border-[#202c42] text-[#9eb0cc]'
                          : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                      }`}
                    >
                      <span>
                        {feat.nTrades} trades · ₹{(feat.turnover / 1000).toFixed(0)}k
                      </span>
                      <span className="font-semibold">
                        {feat.eligible ? `Risk ${feat.risk10}/10` : 'Default (5.0/10)'}
                      </span>
                    </div>
                    {!feat.eligible && (
                      <div className="text-[10px] text-amber-400/80 font-mono-num mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Need 8 trades or ₹1L for personal weights</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadModalPerson(p);
                  }}
                  className="w-full text-xs font-mono-num text-[#858f9f] hover:text-[#e0dcd5] bg-[#121620] hover:bg-[#1a202c] border border-[#1e2535] py-2.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload CSV Ledger</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {uploadModalPerson && (
        <CsvUploadModal
          personId={uploadModalPerson.id}
          personName={uploadModalPerson.name}
          isOpen={true}
          onClose={() => setUploadModalPerson(null)}
          onSuccess={(newFeats) => {
            onLedgerUpdated(uploadModalPerson.id, newFeats);
            setUploadModalPerson(null);
          }}
        />
      )}
    </div>
  );
};
