import React from 'react';
import type { StateVector } from '../../engine/quantumMath';
import { C, numQubits, basisLabel } from '../../engine/quantumMath';
import { BarChart3, Compass, Info } from 'lucide-react';

interface QuantumAnalyticsGraphsProps {
  stateVector: StateVector;
  highlightIndex?: number | null;
  onHover?: (index: number | null) => void;
}

export const QuantumAnalyticsGraphs: React.FC<QuantumAnalyticsGraphsProps> = ({
  stateVector,
  highlightIndex = null,
  onHover,
}) => {
  const nQ = numQubits(stateVector);

  // Compute Shannon Entropy of measurement probabilities: S = -sum p*log2(p)
  let entropy = 0;
  stateVector.forEach((c) => {
    const p = C.mag2(c);
    if (p > 1e-9) {
      entropy -= p * Math.log2(p);
    }
  });

  const maxEntropy = nQ; // log2(2^n) = n

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* =========================================
          GRAPH 1: Probability Spectrum Bar Chart
      ========================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Measurement Probability Spectrum (|c|²)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Entropy: {entropy.toFixed(2)} / {maxEntropy} bits
          </span>
        </div>

        {/* Animated Bar Chart */}
        <div className="space-y-2.5 pt-1">
          {stateVector.map((c, i) => {
            const prob = C.mag2(c);
            const percent = (prob * 100).toFixed(1);
            const isHighlighted = highlightIndex === i;
            const label = basisLabel(i, nQ);

            return (
              <div
                key={i}
                onMouseEnter={() => onHover && onHover(i)}
                onMouseLeave={() => onHover && onHover(null)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isHighlighted ? 'bg-amber-50 ring-1 ring-amber-400' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1 font-mono">
                  <span
                    className={`font-bold ${
                      isHighlighted ? 'text-amber-700' : 'text-slate-800'
                    }`}
                  >
                    |{label}⟩
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">r = {C.mag(c).toFixed(2)}</span>
                    <span className="font-bold text-teal-700">{percent}%</span>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isHighlighted
                        ? 'bg-amber-500 shadow-sm'
                        : prob > 0.001
                        ? 'bg-teal-500'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${Math.max(prob > 0.001 ? 1 : 0, prob * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Sum of probabilities ∑P = 100%. Equal heights = uniform superposition.</span>
        </div>
      </div>

      {/* =========================================
          GRAPH 2: Polar Phase Radar Spectrum
      ========================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Polar Phase Radar (Unified Circle)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">12:00 = 0 · CCW = +φ</span>
        </div>

        {/* Polar SVG Diagram */}
        <div className="flex justify-center items-center py-2">
          <svg viewBox="0 0 260 260" className="w-full max-w-[260px] h-auto select-none">
            <defs>
              <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </radialGradient>
            </defs>

            {/* Background Radar Rings */}
            <circle cx="130" cy="130" r="105" fill="url(#radar-bg)" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="130" cy="130" r="75" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="130" cy="130" r="45" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />

            {/* Crosshairs */}
            <line x1="130" y1="20" x2="130" y2="240" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="20" y1="130" x2="240" y2="130" stroke="#cbd5e1" strokeWidth="1" />

            {/* Radar Reference Labels */}
            <text x="130" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">
              0 (12:00)
            </text>
            <text x="12" y="133" textAnchor="start" fontSize="8" fontWeight="bold" fill="#0d9488">
              +π/2
            </text>
            <text x="130" y="254" textAnchor="middle" fontSize="8" fill="#64748b">
              ±π
            </text>
            <text x="248" y="133" textAnchor="end" fontSize="8" fill="#64748b">
              -π/2
            </text>

            {/* State Phase Vectors */}
            {stateVector.map((c, i) => {
              const mag = C.mag(c);
              if (mag < 0.005) return null;
              const phi = C.phase(c);
              const isHighlighted = highlightIndex === i;

              // Convention: 12 o'clock is 0. CCW is positive angle.
              const maxR = 100;
              const r = maxR * mag;
              const tipX = 130 - r * Math.sin(phi);
              const tipY = 130 - r * Math.cos(phi);

              const color = isHighlighted ? '#f59e0b' : '#0d9488';

              return (
                <g
                  key={i}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => onHover && onHover(i)}
                  onMouseLeave={() => onHover && onHover(null)}
                >
                  {/* Vector Line */}
                  <line
                    x1="130"
                    y1="130"
                    x2={tipX}
                    y2={tipY}
                    stroke={color}
                    strokeWidth={isHighlighted ? '3.5' : '2'}
                    strokeLinecap="round"
                  />
                  {/* Vector Tip */}
                  <circle
                    cx={tipX}
                    cy={tipY}
                    r={isHighlighted ? '5' : '3.5'}
                    fill={color}
                  />
                  {/* Label */}
                  <text
                    x={tipX + (tipX > 130 ? 6 : -6)}
                    y={tipY + (tipY > 130 ? 10 : -6)}
                    textAnchor={tipX > 130 ? 'start' : 'end'}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill={isHighlighted ? '#b45309' : '#334155'}
                  >
                    |{basisLabel(i, nQ)}⟩
                  </text>
                </g>
              );
            })}

            {/* Center Origin Pivot */}
            <circle cx="130" cy="130" r="3" fill="#0f172a" />
          </svg>
        </div>

        <div className="text-[11px] text-slate-500 text-center border-t border-slate-100 pt-2 font-mono">
          Vectors combine magnitude (length) &amp; quantum phase angle (direction)
        </div>
      </div>
    </div>
  );
};

