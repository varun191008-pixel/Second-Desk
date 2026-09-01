import React, { useState, useEffect, useCallback } from 'react';
import pricesData from '../data/prices.json';
import peopleData from '../data/people.json';
import { parseLedgerCsv, computeFeatures } from '../lib/features';
import { getLedgerCsv, runDesk } from '../lib/runDesk';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PersonSelector } from '../components/PersonSelector';
import { StockSelector } from '../components/StockSelector';
import { WeatherPills } from '../components/WeatherPills';
import { AgentCard } from '../components/AgentCard';
import { ChairCard } from '../components/ChairCard';
import { HoldingsTable } from '../components/HoldingsTable';
import { HoldWatchBar } from '../components/HoldWatchBar';
import { Banners } from '../components/Banners';
import type { DeskSession, Features, Person, PriceBar, Ticker } from '../types';
import { Play, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';

const TICKERS: Ticker[] = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS"];

export const HomePage: React.FC = () => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('asha');
  const [selectedTicker, setSelectedTicker] = useState<Ticker>('INFY');
  const [filingsDown, setFilingsDown] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentSession, setCurrentSession] = useState<DeskSession | null>(null);

  // Hold Watch State
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [watchDayIndex, setWatchDayIndex] = useState<number>(0);

  // Features cache per person
  const [featuresMap, setFeaturesMap] = useState<Record<string, Features>>({});

  const people = peopleData as Person[];
  const prices = pricesData as Record<Ticker, PriceBar[]>;

  // Load features for all people
  const refreshFeatures = useCallback(() => {
    const map: Record<string, Features> = {};
    for (const p of people) {
      const csv = getLedgerCsv(p.id);
      const rows = parseLedgerCsv(csv);
      map[p.id] = computeFeatures(rows);
    }
    setFeaturesMap(map);
  }, [people]);

  useEffect(() => {
    refreshFeatures();
  }, [refreshFeatures]);

  // Execute Desk Run
  const handleRunDesk = async (
    overridePersonId?: string,
    overrideTicker?: Ticker,
    overrideDayIndex?: number,
    overrideFilingsDown?: boolean
  ) => {
    setIsRunning(true);
    const pId = overridePersonId || selectedPersonId;
    const tick = overrideTicker || selectedTicker;
    const dIdx = overrideDayIndex !== undefined ? overrideDayIndex : watchDayIndex;
    const fDown = overrideFilingsDown !== undefined ? overrideFilingsDown : filingsDown;

    try {
      const session = await runDesk({
        personId: pId,
        ticker: tick,
        filingsDown: fDown,
        dayIndex: dIdx,
      });
      setCurrentSession(session);
    } catch (e) {
      console.error('Desk execution failed:', e);
    } finally {
      setIsRunning(false);
    }
  };

  // Quick switch between people
  const handleRerunWithPerson = (newPersonId: string) => {
    setSelectedPersonId(newPersonId);
    handleRunDesk(newPersonId, selectedTicker, watchDayIndex, filingsDown);
  };

  // Hold Watch handlers
  const handleToggleWatch = () => {
    if (!isWatching) {
      setIsWatching(true);
      setWatchDayIndex(0);
    } else {
      setIsWatching(false);
      setWatchDayIndex(0);
      handleRunDesk(selectedPersonId, selectedTicker, 0, filingsDown);
    }
  };

  const handleNextSession = () => {
    const nextIdx = Math.min(7, watchDayIndex + 1);
    setWatchDayIndex(nextIdx);
    handleRunDesk(selectedPersonId, selectedTicker, nextIdx, filingsDown);
  };

  const handleNextWeek = () => {
    setWatchDayIndex(5);
    handleRunDesk(selectedPersonId, selectedTicker, 5, filingsDown);
  };

  const handleResetWatch = () => {
    setWatchDayIndex(0);
    handleRunDesk(selectedPersonId, selectedTicker, 0, filingsDown);
  };

  const currentPerson = people.find(p => p.id === selectedPersonId) || people[0];

  return (
    <div className="min-h-screen flex flex-col text-[#e8e5de]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Desk Header / Wordmark hero */}
        <div className="mb-8 border-b border-[#1b2230] pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#121620] border border-[#222a3a] text-xs font-mono-num text-[#9da7b8] mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Deterministic Mathematical Architecture · No Stored Fit Snapshots</span>
              </div>
              <h1 className="font-serif-title text-3xl sm:text-5xl text-[#f7f5ef] tracking-tight leading-none mb-2">
                Simulated Equity Synthesis Desk
              </h1>
              <p className="text-xs sm:text-sm text-[#949dae] max-w-2xl leading-relaxed">
                Ground multi-agent tape momentum, regulatory filings sentiment, and news tone against retail ledger risk profiles to compute personalized action menus.
              </p>
            </div>

            {/* Run button on top for convenience */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleRunDesk()}
                disabled={isRunning}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#d6d9e0] hover:bg-[#eef1f6] text-zinc-950 font-semibold text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-800" />
                    <span>Computing Signals...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-zinc-950 text-zinc-950" />
                    <span>Run Desk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Selectors */}
        <div className="bg-[#212A33] border border-[#2e3a47] rounded-2xl p-4 sm:p-6 mb-8 shadow-lg">
          {/* Person Selector */}
          <PersonSelector
            people={people}
            selectedPersonId={selectedPersonId}
            onSelectPerson={(id) => setSelectedPersonId(id)}
            featuresMap={featuresMap}
            onLedgerUpdated={(pId) => {
              refreshFeatures();
              if (pId === selectedPersonId && currentSession) {
                handleRunDesk(pId);
              }
            }}
          />

          {/* Stock Selector */}
          <StockSelector
            tickers={TICKERS}
            selectedTicker={selectedTicker}
            onSelectTicker={(t) => {
              setSelectedTicker(t);
              setWatchDayIndex(0);
              setIsWatching(false);
            }}
            pricesData={prices}
          />

          {/* Feed Controls & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#1a212e]">
            {/* Break filings switch */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filingsDown}
                  onChange={(e) => {
                    setFilingsDown(e.target.checked);
                    if (currentSession) {
                      handleRunDesk(selectedPersonId, selectedTicker, watchDayIndex, e.target.checked);
                    }
                  }}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${filingsDown ? 'bg-amber-600' : 'bg-[#202735]'}`}></div>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-zinc-200 transition-transform ${filingsDown ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
              <div className="text-xs">
                <span className="font-medium text-[#f0ede6] block">Break filings feed</span>
                <span className="text-[11px] text-[#717b8c] font-mono-num">
                  Sever regulatory corpus to test degraded mode
                </span>
              </div>
            </label>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleRunDesk()}
              disabled={isRunning}
              className="px-8 py-3.5 rounded-xl bg-[#d6d9e0] hover:bg-[#eef1f6] text-zinc-950 font-bold text-xs sm:text-sm tracking-wide uppercase font-mono-num shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-800" />
                  <span>Computing Desk...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-zinc-800" />
                  <span>Run Desk ({selectedTicker})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RESULTS SECTION */}
        {currentSession ? (
          <div className="space-y-6">
            {/* Warning & Conflict Banners */}
            <Banners
              filingsDown={currentSession.docket.degraded || filingsDown}
              conflicts={currentSession.chief.conflicts}
            />

            {/* Hold Watch Bar if active */}
            {isWatching && (
              <HoldWatchBar
                ticker={currentSession.ticker}
                dayIndex={watchDayIndex}
                onNextSession={handleNextSession}
                onNextWeek={handleNextWeek}
                onReset={handleResetWatch}
              />
            )}

            {/* MOBILE LAYOUT (< 1024px) - Strictly Mobile First Order */}
            <div className="block lg:hidden space-y-6">
              {/* 1. Header Stamp: Simulation badge + ticker + last + person */}
              <div className="bg-[#11141b] border border-[#1e2533] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-base font-bold font-mono-num text-[#f5f2ec]">
                    {currentSession.ticker} · ₹{currentSession.lastClose.toFixed(2)}
                  </div>
                  <div className="text-xs text-[#8c96a7] font-mono-num">
                    Client: {currentSession.personName}
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded bg-[#181d28] border border-[#2c3547] text-[10px] font-mono-num uppercase text-[#abb4c4]">
                  Simulated
                </div>
              </div>

              {/* 2. CHAIR CARD FIRST ON MOBILE */}
              <ChairCard
                chief={currentSession.chief}
                person={currentPerson}
                ticker={currentSession.ticker}
                onRerunWithPerson={handleRerunWithPerson}
                onToggleWatch={handleToggleWatch}
                isWatching={isWatching}
              />

              {/* 3. Eligibility Chip */}
              <div className="bg-[#10131a] border border-[#1d2433] rounded-lg p-3 text-xs font-mono-num flex items-center justify-between">
                <span className="text-[#8c95a5]">Ledger Eligibility</span>
                <span className={currentSession.features.eligible ? "text-emerald-300 font-semibold" : "text-amber-300 font-semibold"}>
                  {currentSession.features.eligible ? `Personal ON (Risk ${currentSession.risk10Used.toFixed(1)}/10)` : "Thin Ledger · Neutral 5.0/10"}
                </span>
              </div>

              {/* 4. Weather 3 compact pills */}
              <WeatherPills signals={currentSession.weather} />

              {/* 5. Specialist Agent Cards (Tape, Docket, Wire) */}
              <div className="space-y-4">
                <div className="text-xs font-mono-num uppercase tracking-wider text-[#798394]">
                  Specialist Agents (3-Agent Panel)
                </div>
                <AgentCard agent={currentSession.tape} />
                <AgentCard agent={currentSession.docket} />
                <AgentCard agent={currentSession.wire} />
              </div>

              {/* 7. Holdings & Cash */}
              <HoldingsTable
                person={currentPerson}
                allPrices={prices}
                currentTicker={currentSession.ticker}
              />

              {/* 9. Desk Execution Stats */}
              <div className="bg-[#0e1117] border border-[#1c2230] rounded-xl p-3.5 text-xs font-mono-num text-[#7f8899] flex flex-wrap items-center justify-between gap-2">
                <span>Desk Latency: <strong className="text-zinc-300">{currentSession.latencyMs}ms</strong></span>
                <span>Portfolio HHI: <strong className="text-zinc-300">{currentSession.hhi}</strong></span>
                <span>Confidence: <strong className="text-zinc-300">{currentSession.chief.confidence}%</strong></span>
              </div>
            </div>

            {/* DESKTOP LAYOUT (>= 1024px) */}
            <div className="hidden lg:block space-y-6">
              {/* Weather row */}
              <WeatherPills signals={currentSession.weather} />

              {/* 3-Agent Columns (Tape, Docket, Wire) */}
              <div>
                <div className="text-xs font-mono-num uppercase tracking-wider text-[#798394] mb-3 flex items-center justify-between">
                  <span>Specialist Agent Deliberation</span>
                  <span className="text-[10px] text-[#5b6474]">Parallel execution via Promise.all</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <AgentCard agent={currentSession.tape} />
                  <AgentCard agent={currentSession.docket} />
                  <AgentCard agent={currentSession.wire} />
                </div>
              </div>

              {/* Chair Synthesis Card Large */}
              <ChairCard
                chief={currentSession.chief}
                person={currentPerson}
                ticker={currentSession.ticker}
                onRerunWithPerson={handleRerunWithPerson}
                onToggleWatch={handleToggleWatch}
                isWatching={isWatching}
              />

              {/* Holdings and Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <HoldingsTable
                    person={currentPerson}
                    allPrices={prices}
                    currentTicker={currentSession.ticker}
                  />
                </div>
                <div className="bg-[#11141b] border border-[#1e2533] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono-num uppercase tracking-wider text-[#7d8697] mb-3 pb-2 border-b border-[#1b222f]">
                      Desk Session Metrics
                    </div>
                    <div className="space-y-2.5 text-xs font-mono-num text-[#aba69c]">
                      <div className="flex justify-between">
                        <span className="text-[#6d7687]">Synthesis Latency</span>
                        <span className="text-[#e2ded5] font-semibold">{currentSession.latencyMs} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6d7687]">Portfolio HHI</span>
                        <span className="text-[#e2ded5] font-semibold">{currentSession.hhi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6d7687]">Max Concentration</span>
                        <span className="text-[#e2ded5] font-semibold">{currentSession.maxWeight}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6d7687]">System Confidence</span>
                        <span className="text-[#e2ded5] font-semibold">{currentSession.chief.confidence}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6d7687]">Personalization Bias</span>
                        <span className="text-[#e2ded5] font-semibold">
                          {currentSession.features.eligible ? `${currentSession.risk10Used.toFixed(1)}/10` : 'Default (5.0)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono-num text-[#5c6575] pt-3 border-t border-[#1a202d]">
                    Session ID: {currentSession.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state before running */
          <div className="border border-dashed border-[#1f2737] rounded-2xl p-12 text-center bg-[#0b0e14]">
            <div className="w-12 h-12 rounded-xl bg-[#141924] border border-[#252f42] text-zinc-400 mx-auto flex items-center justify-center mb-3">
              <Play className="w-5 h-5 ml-0.5 fill-zinc-400" />
            </div>
            <h3 className="font-serif-title text-2xl text-[#f0ede6] mb-1">
              Desk Standing By
            </h3>
            <p className="text-xs text-[#8c95a6] max-w-md mx-auto mb-5 leading-relaxed">
              Select a client profile and stock above, then click <strong className="text-zinc-200">Run Desk</strong> to generate market weather, specialist signals, and Chair synthesis.
            </p>
            <button
              type="button"
              onClick={() => handleRunDesk()}
              className="px-6 py-3.5 rounded-xl bg-[#d6d9e0] hover:bg-[#eef1f6] text-zinc-950 font-bold text-xs uppercase font-mono-num tracking-wide transition-all active:scale-95 shadow"
            >
              Run Desk ({selectedTicker} · {currentPerson.name.split(' ')[0]})
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
