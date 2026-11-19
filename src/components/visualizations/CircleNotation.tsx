import React from 'react';
import type { StateVector } from '../../engine/quantumMath';
import { C, numQubits, basisLabel } from '../../engine/quantumMath';
import { GaugeHelper } from './GaugeHelper';

interface CircleNotationProps {
  stateVector: StateVector;
  highlightIndex?: number | null;
  onHover?: (index: number | null) => void;
  showOverlays?: boolean;
}

export const CircleNotation: React.FC<CircleNotationProps> = ({
  stateVector,
  highlightIndex = null,
  onHover,
  showOverlays = true,
}) => {
  const nQ = numQubits(stateVector);
  const nStates = stateVector.length;

  const R = nStates === 4 ? 44 : 36;
  const paddingX = 40;
  const spacingX = nStates === 4 ? 120 : 80;
  const totalWidth = paddingX * 2 + (nStates - 1) * spacingX;
  const totalHeight = 170;
  const cy = 75;

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="w-full h-auto min-w-[500px]"
          style={{ maxHeight: '200px' }}
        >
          {stateVector.map((c, i) => {
            const cx = paddingX + i * spacingX;
            const mag = C.mag(c);
            const prob = C.mag2(c);
            const phi = C.phase(c);
            const innerR = Math.max(0, R * mag);

            // Phase gauge convention:
            // 0 = straight UP (12 o'clock)
            // +φ = Counterclockwise rotation
            // SVG coords: x = cx - R*sin(phi), y = cy - R*cos(phi)
            const pointerX = cx - R * Math.sin(phi);
            const pointerY = cy - R * Math.cos(phi);

            const isHighlighted = highlightIndex === i;
            const label = basisLabel(i, nQ);

            return (
              <g
                key={i}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => onHover && onHover(i)}
                onMouseLeave={() => onHover && onHover(null)}
              >
                {/* Highlight Halo */}
                {isHighlighted && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={R + 7}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeDasharray="4 2"
                    className="animate-pulse"
                  />
                )}

                {/* Outer Unit Circle (Reference for Prob = 1) */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={R}
                  fill="#f8fafc"
                  stroke={isHighlighted ? '#f59e0b' : '#94a3b8'}
                  strokeWidth={isHighlighted ? '2' : '1.5'}
                />

                {/* Light crosshair for reference */}
                <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="#f1f5f9" strokeWidth="1" />
                <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="#f1f5f9" strokeWidth="1" />

                {/* Inner Filled Circle: Area proportional to |c_i|^2 */}
                {mag > 0.001 && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={innerR}
                    fill="#0d9488"
                    opacity={0.85}
                    className="quantum-circle-inner"
                  />
                )}

                {/* Radial Phase Gauge Line */}
                {mag > 0.001 && (
                  <g className="quantum-phase-line">
                    <line
                      x1={cx}
                      y1={cy}
                      x2={pointerX}
                      y2={pointerY}
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx={pointerX} cy={pointerY} r="3" fill="#0f172a" />
                  </g>
                )}

                {/* Center Pivot Point */}
                <circle cx={cx} cy={cy} r="2.5" fill="#475569" />

                {/* Basis State Ket Label */}
                <text
                  x={cx}
                  y={cy + R + 22}
                  textAnchor="middle"
                  className={`text-[13px] font-mono select-none ${
                    isHighlighted ? 'font-bold fill-amber-600' : 'fill-slate-800 font-semibold'
                  }`}
                >
                  |{label}⟩
                </text>

                {/* Live Numerical Overlay (Probability & Phase) */}
                {showOverlays && (
                  <g className="select-none">
                    <text
                      x={cx}
                      y={cy + R + 37}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#0d9488"
                      fontWeight="bold"
                    >
                      P = {(prob * 100).toFixed(prob >= 0.099 ? 1 : 2)}%
                    </text>
                    <text
                      x={cx}
                      y={cy + R + 49}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                    >
                      {mag > 0.001
                        ? `φ = ${(phi / Math.PI).toFixed(2)}π`
                        : 'mag = 0'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mini Gauge convention helper footer */}
      <GaugeHelper compact />
    </div>
  );
};
