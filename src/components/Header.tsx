import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, BookOpen, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();
  const isArch = location.pathname === '/architecture';

  return (
    <header className="border-b border-[#202c3a] bg-[#0E161D]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-[#161b24] border border-[#262e3d] flex items-center justify-center text-zinc-300 group-hover:border-zinc-500 transition-colors">
              <Layers className="w-4 h-4 text-[#d4d8df]" />
            </div>
            <div>
              <span className="font-serif-title text-xl sm:text-2xl tracking-wide text-[#f0ede6] block leading-none">
                SECOND DESK
              </span>
              <span className="text-[10px] tracking-wider uppercase text-[#7a8292] font-mono-num block mt-0.5">
                V3 · HackVerse Sprint 1
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className={`px-3 py-2.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              !isArch
                ? 'bg-[#181e29] text-[#f0ede6] border border-[#2a3445]'
                : 'text-[#8e95a2] hover:text-[#e8e5de] hover:bg-[#121620]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Desk</span>
          </Link>
          <Link
            to="/architecture"
            className={`px-3 py-2.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isArch
                ? 'bg-[#181e29] text-[#f0ede6] border border-[#2a3445]'
                : 'text-[#8e95a2] hover:text-[#e8e5de] hover:bg-[#121620]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Architecture & Formulas</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
