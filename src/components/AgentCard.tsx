import React, { useState } from 'react';
import type { AgentOutput } from '../types';
import { ChevronDown, ChevronUp, FileText, BarChart2, Radio, AlertTriangle } from 'lucide-react';

interface AgentCardProps {
  agent: AgentOutput;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const [showNumbers, setShowNumbers] = useState(window.innerWidth > 390 ? false : false);

  const getAgentIcon = (name: string) => {
    switch (name) {
      case 'Tape':
        return <BarChart2 className="w-4 h-4 text-blue-400" />;
      case 'Docket':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'Wire':
        return <Radio className="w-4 h-4 text-purple-400" />;
      default:
        return null;
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'BUY':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50';
      case 'AVOID':
        return 'bg-rose-950/40 text-rose-300 border-rose-800/50';
      case 'CAUTION':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/50';
      case 'UNAVAILABLE':
        return 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50';
      case 'HOLD':
      default:
        return 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50';
    }
  };

const getPlainEnglishLabel = (id: string, fallback: string) => {
    switch (id) {
      case 'short_momentum': return "Last 5 days";
      case 'trend_20d': return "Last 20 days";
      case 'volume_pressure': return "Trading Volume";
      case 'stretch_reversion': return "Price Stretch";
      case 'margins': return "Profit Margins";
      case 'growth': return "Growth Outlook";
      case 'balance': return "Financial Health";
      case 'capital': return "Cash Use";
      case 'wire_sentiment': return "News Tone";
      default: return fallback;
    }
  };

  const getPlainEnglishNote = (id: string, score: number) => {
    const isHigh = score > 0.4;
    const isLow = score < -0.4;
    switch (id) {
      case 'short_momentum': return isHigh ? "Up sharply, acting like a spike." : (isLow ? "Down sharply, a sudden drop." : "Up or down within normal bounds. This is calm.");
      case 'trend_20d': return isHigh ? "Strong upward trend." : (isLow ? "Strong downward trend." : "Choppy or flat trend.");
      case 'volume_pressure': return isHigh ? "Volume is unusually high." : (isLow ? "Very quiet volume." : "Volume is normal. Not a crowd.");
      case 'stretch_reversion': return isHigh ? "Price is a bit extended. Usually better not to chase." : (isLow ? "Price is stretched downwards." : "Price is hovering near average.");
      case 'margins': return isHigh ? "Margins looking very healthy." : (isLow ? "Margins are under pressure." : "Margins appear stable.");
      case 'growth': return isHigh ? "Strong demand signals." : (isLow ? "Growth seems to be slowing." : "Steady, expected growth.");
      case 'balance': return isHigh ? "Strong balance sheet." : (isLow ? "Debt or credit concerns." : "Healthy financials.");
      case 'capital': return isHigh ? "Good capital returns." : (isLow ? "Questionable cash allocation." : "Standard payout policy.");
      case 'wire_sentiment': return isHigh ? "News is very positive." : (isLow ? "News is notably negative." : "News is mixed or quiet.");
      default: return "Normal reading.";
    }
  };

  const getPlainReason = (reason: string) => {
    return reason
      .replace(/weighted highest \(\d+%\) with stance [+-]?\d+\.\d+/, "is the main driver here")
      .replace("Short Momentum (5d)", "The 5-day move")
      .replace("Trend (20d)", "The 20-day trend")
      .replace("Volume Pressure", "Trading volume")
      .replace("Mean Reversion / Stretch", "Price stretch");
  };

  return (
    <div className="bg-[#212A33] border border-[#2e3a47] rounded-xl p-4 md:p-5 flex flex-col justify-between hover:border-[#3d4d5e] transition-colors shadow-md">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1c222e] mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#161b24] border border-[#242c3b]">
              {getAgentIcon(agent.name)}
            </div>
            <div>
              <div className="text-sm font-semibold text-[#f0ede6] flex items-center gap-2">
                <span>{agent.name} Agent</span>
                {agent.degraded && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" /> Degraded
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono-num text-[#6a7384]">
                Latency: {agent.latencyMs}ms · Conf: {agent.confidence}%
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <button onClick={() => setShowNumbers(!showNumbers)} className="py-1.5 px-2 text-[10px] text-[#858e9f] hover:text-blue-400 transition-colors underline decoration-dotted underline-offset-2">
              {showNumbers ? 'Hide numbers' : 'Show numbers'}
            </button>
            <span className={`inline-block text-xs font-mono-num font-bold px-2 py-0.5 rounded border ${getVerdictBadge(agent.verdict)}`}>
              {agent.verdict}
            </span>
            {showNumbers && (
              <div className="text-[11px] font-mono-num text-[#858e9f]">
                Stance: {agent.stance >= 0 ? '+' : ''}{agent.stance.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Stance Indicator Bar (-1 to +1) */}
        {showNumbers && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] font-mono-num text-[#646e80] mb-1">
              <span>-1.0 (Avoid)</span>
              <span>0.0</span>
              <span>+1.0 (Buy)</span>
            </div>
            <div className="w-full h-1.5 bg-[#181d27] rounded-full relative overflow-hidden">
              <div
                className={`absolute top-0 bottom-0 rounded-full ${
                  agent.stance > 0 ? 'bg-emerald-500/80' : agent.stance < 0 ? 'bg-rose-500/80' : 'bg-zinc-500'
                }`}
                style={{
                  left: agent.stance >= 0 ? '50%' : `${50 + (agent.stance * 50)}%`,
                  width: `${Math.abs(agent.stance) * 50}%`,
                }}
              />
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-zinc-600 -translate-x-1/2"></div>
            </div>
          </div>
        )}

        {/* Sliders / Factors Section in details tag */}
        <details className="group mb-3 border border-[#1b212d] rounded-lg p-2.5 bg-[#0e1017]" open={true}>
          <summary className="cursor-pointer text-xs font-medium text-[#9da6b6] flex items-center justify-between select-none">
            <span className="font-mono-num uppercase tracking-wider text-[10px] text-[#717b8c]">
              Computed Factors ({agent.factors.length})
            </span>
            <span className="text-[10px] text-[#5b6474] group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>

          <div className="mt-2.5 space-y-2 pt-2 border-t border-[#181e2b]">
            {agent.factors.map((factor) => {
              const isHigh = factor.score > 0.4;
              const isLow = factor.score < -0.4;
              const barText = isHigh ? 'hot' : (isLow ? 'quiet' : 'normal');
              const barColor = isHigh ? 'bg-rose-500/80' : (isLow ? 'bg-blue-500/80' : 'bg-zinc-500/80');

              return (
                <div key={factor.id} className="text-xs">
                  <div className="flex justify-between items-center text-[11px] mb-0.5">
                    <span className="text-[#c6c3bc]">{showNumbers ? factor.label : getPlainEnglishLabel(factor.id, factor.label)}</span>
                    {showNumbers ? (
                      <div className="font-mono-num text-[#858f9f] space-x-1.5">
                        <span className="text-zinc-400 font-semibold">{factor.score >= 0 ? '+' : ''}{factor.score.toFixed(2)}</span>
                        <span className="text-[#596272]">w:{(factor.weight * 100).toFixed(0)}%</span>
                      </div>
                    ) : (
                      <span className="text-[10px] uppercase font-mono-num text-[#646e7f] tracking-wider">{barText}</span>
                    )}
                  </div>

                  {/* Factor Score Bar */}
                  {showNumbers ? (
                    <div className="w-full h-1 bg-[#141822] rounded relative mb-1">
                      <div
                        className="absolute top-0 bottom-0 rounded bg-[#414b5f]"
                        style={{
                          left: factor.score >= 0 ? '50%' : `${(factor.score + 1) * 50}%`,
                          width: `${Math.abs(factor.score) * 50}%`,
                        }}
                      />
                      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#2b3445]" />
                    </div>
                  ) : (
                    <div className="w-full h-1 bg-[#141822] rounded relative mb-1 overflow-hidden">
                      <div
                        className={`absolute top-0 bottom-0 rounded ${barColor}`}
                        style={{
                          left: isHigh ? '60%' : (isLow ? '10%' : '35%'),
                          width: '30%',
                        }}
                      />
                    </div>
                  )}

                  <div className={`text-[10px] ${showNumbers ? 'font-mono-num' : ''} text-[#646e7f] truncate`}>
                    {showNumbers ? factor.note : getPlainEnglishNote(factor.id, factor.score)}
                  </div>
                </div>
              );
            })}
          </div>
        </details>

        {/* Reason summary */}
        <div className="text-xs text-[#b8b5ad] leading-relaxed mb-3 bg-[#0d0f15] p-2 rounded border border-[#1a1f2c]">
          {showNumbers ? agent.reason : getPlainReason(agent.reason)}
        </div>
      </div>

      {/* Sources Citation */}
      {agent.sources && agent.sources.length > 0 && (
        <div className="pt-2.5 border-t border-[#1b212c]">
          <button
            type="button"
            onClick={() => setSourceExpanded(!sourceExpanded)}
            className="w-full py-1.5 text-left flex items-center justify-between text-[11px] text-[#798394] hover:text-[#bcc3d0] transition-colors"
          >
            <span className="font-mono-num uppercase tracking-wider text-[10px] flex items-center gap-1">
              <FileText className="w-3 h-3" /> Cited Source ({agent.sources[0].id})
            </span>
            {sourceExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {sourceExpanded && (
            <div className="mt-2 p-2 bg-[#090b0f] border border-[#1f2736] rounded text-xs text-[#c4c1b9] font-mono-num leading-normal">
              <div className="text-[10px] text-[#6f7888] mb-1 font-semibold">
                {agent.sources[0].title} · {agent.sources[0].date}
              </div>
              <p className="italic text-[#d2cec5]">
                "{agent.sources[0].quote}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
