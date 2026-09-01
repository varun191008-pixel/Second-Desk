import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { getStoredSessions } from '../lib/runDesk';
import type { DeskSession } from '../types';
import { BookOpen, Cpu, ShieldCheck, Database, Layers, Clock, Award, Compass } from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const [sessions, setSessions] = useState<DeskSession[]>([]);

  useEffect(() => {
    setSessions(getStoredSessions());
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-[#e8e5de]">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero */}
        <div className="mb-10 pb-6 border-b border-[#1b2230]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#121620] border border-[#222a3a] text-xs font-mono-num text-[#9da7b8] mb-3">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>Mathematical Specification & System Anatomy</span>
          </div>
          <h1 className="font-serif-title text-3xl sm:text-5xl text-[#f7f5ef] tracking-tight leading-tight mb-3">
            System Architecture & Pure Computation
          </h1>
          <p className="text-xs sm:text-sm text-[#9da5b5] max-w-3xl leading-relaxed">
            SecondDesk V3 executes completely deterministic mathematical formulas across specialist agents and the Chair synthesis desk. No hardcoded ticker rules, no stored fit snapshots, and no opaque external LLM embeddings.
          </p>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-[#212A33] border border-[#2e3a47] rounded-xl p-4 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
            <h4 className="text-xs font-bold font-mono-num text-[#f0ede6] uppercase mb-1">
              Zero Hardcoded Fits
            </h4>
            <p className="text-xs text-[#8e97a8] leading-relaxed">
              Every score, fit gap, and verdict is computed in real-time from prices, filings lexicons, and ledger CSVs. Safe vs Risky profile is derived mathematically.
            </p>
          </div>

          <div className="bg-[#212A33] border border-[#2e3a47] rounded-xl p-4 shadow-sm">
            <Compass className="w-5 h-5 text-blue-400 mb-2" />
            <h4 className="text-xs font-bold font-mono-num text-[#f0ede6] uppercase mb-1">
              Fit ≠ Probability
            </h4>
            <p className="text-xs text-[#8e97a8] leading-relaxed">
              Action fit measures alignment with client risk appetite and portfolio constraints under current market conditions, not price prediction probability.
            </p>
          </div>

          <div className="bg-[#212A33] border border-[#2e3a47] rounded-xl p-4 shadow-sm">
            <Clock className="w-5 h-5 text-amber-400 mb-2" />
            <h4 className="text-xs font-bold font-mono-num text-[#f0ede6] uppercase mb-1">
              Market Cadence
            </h4>
            <p className="text-xs text-[#8e97a8] leading-relaxed">
              Designed around NSE market phases: Pre-open 8:30-8:50 IST (news), Post-close 4:15-4:45 IST (Tape + Chair), and Friday weekly sync. No 12-hour background pings.
            </p>
          </div>
        </div>

        {/* Section 1: Gate & Ledger Features */}
        <section className="mb-12 bg-[#212A33] border border-[#2e3a47] rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center gap-2.5 mb-4 text-[#d4d8df]">
            <Database className="w-5 h-5" />
            <h2 className="text-lg sm:text-xl font-bold font-serif-title">
              1. Ledger Gate & Behavioral Feature Extraction
            </h2>
          </div>

          <p className="text-xs text-[#a2aab8] leading-relaxed mb-4">
            A user's past execution ledger is parsed with strict FIFO matching. If the account does not meet the minimum experience threshold, personal weights are disabled and a neutral baseline (5.0/10) is enforced.
          </p>

          <div className="bg-[#07090d] border border-[#19202c] rounded-xl p-4 font-mono-num text-xs text-[#c9c5bc] space-y-3 mb-4">
            <div>
              <span className="text-[#646e80]">// Eligibility Gate:</span><br />
              <code>MIN_TRADES = 8</code><br />
              <code>MIN_TURNOVER = ₹1,00,000</code><br />
              <code>eligible = (nTrades &gt;= MIN_TRADES) || (turnover &gt;= MIN_TURNOVER)</code>
            </div>

            <div>
              <span className="text-[#646e80]">// Behavioral Metrics:</span><br />
              <code>chaseRate = count(buy.r5 &gt; sigma5) / totalBuys</code><br />
              <code>fadeRate = count(sell.r5 &gt; 0.025) / totalTrades</code><br />
              <code>cutRate = count(sell.pnl &lt; 0 &amp;&amp; holdDays &lt;= 10) / losingSells</code><br />
              <code>shortHold = clamp((14 - holdDaysMed) / 14, 0, 1)</code>
            </div>

            <div>
              <span className="text-[#646e80]">// Aggression & Risk Scaling:</span><br />
              <code>agg = 0.35 * chaseRate + 0.25 * cutRate + 0.20 * (1 - fadeRate) + 0.20 * shortHold</code><br />
              <code>risk10 = 10 * clamp(agg, 0, 1)</code><br />
              <code>risk10Used = eligible ? risk10 : 5.0</code>
            </div>
          </div>
        </section>

        {/* Section 2: Tape Agent Math */}
        <section className="mb-12 bg-[#212A33] border border-[#2e3a47] rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center gap-2.5 mb-4 text-[#d4d8df]">
            <Layers className="w-5 h-5" />
            <h2 className="text-lg sm:text-xl font-bold font-serif-title">
              2. Tape Agent: Non-Linear Price & Volume Dynamics
            </h2>
          </div>

          <p className="text-xs text-[#a2aab8] leading-relaxed mb-4">
            The Tape Agent scales returns against universe standard deviations (<code className="text-zinc-300">sigma5, sigma20, sigmaExt</code>) and uses a smooth sigmoid gate <code className="text-zinc-300">g</code> to prevent abrupt threshold cliffs when volume spikes occur.
          </p>

          <div className="bg-[#07090d] border border-[#19202c] rounded-xl p-4 font-mono-num text-xs text-[#c9c5bc] space-y-3">
            <div>
              <code>shortScore = tanh(r5 / sigma5)</code><br />
              <code>trendScore = tanh(r20 / sigma20)</code><br />
              <code>volumeScore = tanh(volZ / 2)</code>
            </div>
            <div>
              <code>g = sigmoid((volZ - 1.0) / 0.45)</code><br />
              <code>stretchFade = -tanh(ext / sigmaExt)</code><br />
              <code>stretchChase = +tanh(ext / sigmaExt)</code><br />
              <code>stretchBlend = (1 - g) * stretchFade + g * stretchChase</code><br />
              <code>fadePref = 1 - risk10Used / 10</code><br />
              <code>stretchScore = fadePref * stretchFade + (1 - fadePref) * stretchBlend</code>
            </div>
            <div>
              <span className="text-[#646e80]">// Poles Interpolation:</span><br />
              <code>cautious = &#123; short: 0.12, trend: 0.28, volume: 0.14, stretch: 0.46 &#125;</code><br />
              <code>aggressive = &#123; short: 0.36, trend: 0.18, volume: 0.36, stretch: 0.10 &#125;</code><br />
              <code>w = normalize(lerp(cautious, aggressive, risk10Used / 10))</code><br />
              <code>stance = sum(score_i * w_i)</code>
            </div>
          </div>
        </section>

        {/* Section 3: Docket Agent Lexicon & TF-IDF */}
        <section className="mb-12 bg-[#212A33] border border-[#2e3a47] rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center gap-2.5 mb-4 text-[#d4d8df]">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-lg sm:text-xl font-bold font-serif-title">
              3. Docket Agent: Phrase-First Lexicon & Degraded Mode
            </h2>
          </div>

          <p className="text-xs text-[#a2aab8] leading-relaxed mb-4">
            Docket retrieves top-2 documents via TF-IDF cosine similarity. It scores four categories (Margins, Growth, Balance Sheet, Capital Allocation) using phrase-first multi-word matching normalized by token root length.
          </p>

          <div className="bg-[#07090d] border border-[#19202c] rounded-xl p-4 font-mono-num text-xs text-[#c9c5bc] space-y-3">
            <div>
              <code>raw = (sum(pos_i * count_i) - sum(neg_i * count_i)) / sqrt(max(20, tokenCount))</code><br />
              <code>categoryScore = tanh(3 * raw)</code>
            </div>
            <div>
              <span className="text-[#646e80]">// Degraded Mode:</span><br />
              If filingsDown is active, Docket returns <code className="text-amber-300">UNAVAILABLE</code> with confidence 0 and empty sources list. Chair automatically applies a defensive risk penalty without inventing quotes.
            </div>
          </div>
        </section>

        {/* Section 4: Chair Synthesis & Scaler */}
        <section className="mb-12 bg-[#212A33] border border-[#2e3a47] rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center gap-2.5 mb-4 text-[#d4d8df]">
            <Award className="w-5 h-5" />
            <h2 className="text-lg sm:text-xl font-bold font-serif-title">
              4. Chair Synthesis: Blending, Concentration Veto & Linear Scaling
            </h2>
          </div>

          <p className="text-xs text-[#a2aab8] leading-relaxed mb-4">
            The Chair combines specialist signals with confidence weighting and client bias. Concentration limits enforce single-name capacity caps. Non-vetoed actions are scaled linearly to [30, 100] with the top option pinned to 100.
          </p>

          <div className="bg-[#07090d] border border-[#19202c] rounded-xl p-4 font-mono-num text-xs text-[#c9c5bc] space-y-3">
            <div>
              <code>blended = (1.0*Tape + 1.1*Docket + 0.7*Wire) / sumW + bias</code><br />
              <code>room = max(0, maxSingleName - currentWeight)</code><br />
              <code>veto = (room &lt; 0.5%) || (smallPct &lt; 0.5%)</code>
            </div>
            <div>
              <span className="text-[#646e80]">// Linear Fit Scaling:</span><br />
              <code>fit = 30 + 70 * ((raw - minRaw) / (maxRaw - minRaw))</code><br />
              <code>vetoed_fit = 10</code><br />
              <code>gap = 100 - fit</code>
            </div>
          </div>
        </section>

        {/* Past Sessions History */}
        <section className="bg-[#212A33] border border-[#2e3a47] rounded-2xl p-6 sm:p-8 shadow-md">
          <h2 className="text-lg sm:text-xl font-bold font-serif-title text-[#d4d8df] mb-4">
            Recent Desk Runs ({sessions.length})
          </h2>

          {sessions.length > 0 ? (
            <div className="space-y-2 font-mono-num text-xs">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#080a0e] border border-[#18202d] rounded-lg p-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#f0ede6]">{s.ticker}</span>
                    <span className="text-[#8c95a5]">{s.personName}</span>
                    <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                      {s.chief.best.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[#798394] text-[11px]">
                    <span>{s.latencyMs}ms</span>
                    <span>Conf: {s.chief.confidence}%</span>
                    <span>{new Date(s.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#70798a] font-mono-num">
              No previous runs in session history yet. Run a desk on the Home page to populate.
            </p>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};
