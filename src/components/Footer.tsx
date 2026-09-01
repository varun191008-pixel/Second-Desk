import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#202c3a] bg-[#0E161D]/90 py-6 px-4 text-center mt-12">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#707887]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
          <span>Simulated desk for HackVerse. Sample tape. Not investment advice.</span>
        </div>
        <div className="font-mono-num text-[11px] text-[#555d6c]">
          Pure Computational Engine · Zero Stored Fits
        </div>
      </div>
    </footer>
  );
};
