import React from 'react';
import type { StateVector } from '../../engine/quantumMath';
import type { SeparabilityResult } from '../../engine/quantumMath';
import { C, numQubits } from '../../engine/quantumMath';
import { GaugeHelper } from './GaugeHelper';

interface DCNProps {
  stateVector: StateVector;
  highlightIndex?: number | null;
  onHover?: (index: number | null) => void;
  showOverlays?: boolean;
  showSeparabilityPlanes?: boolean;
  separabilityResults?: SeparabilityResult[];
}

export const DimensionalCircleNotation: React.FC<DCNProps> = ({
  stateVector,
  highlightIndex = null,
  onHover,
  showOverlays = true,
  showSeparabilityPlanes = false,
  separabilityResults = [],
}) => {
  const nQ = numQubits(stateVector);

  const isQ1Sep = separabilityResults.find((r) => r.qubit === 1)?.isSeparable;
  const isQ2Sep = separabilityResults.find((r) => r.qubit === 2)?.isSeparable;
  const isQ3Sep = separabilityResults.find((r) => r.qubit === 3)?.isSeparable;

  if (nQ === 2) {
    return (
      <TwoQubitDCN
        stateVector={stateVector}
        highlightIndex={highlightIndex}
        onHover={onHover}
        showOverlays={showOverlays}
        showSeparabilityPlanes={showSeparabilityPlanes}
        isQ1Sep={isQ1Sep}
        isQ2Sep={isQ2Sep}
      />
    );
  }

  return (
    <ThreeQubitDCN
      stateVector={stateVector}
      highlightIndex={highlightIndex}
      onHover={onHover}
      showOverlays={showOverlays}
      showSeparabilityPlanes={showSeparabilityPlanes}
      isQ1Sep={isQ1Sep}
      isQ2Sep={isQ2Sep}
      isQ3Sep={isQ3Sep}
      separabilityResults={separabilityResults}
    />
  );
};

// ==========================================
// 2-Qubit DCN (2x2 Grid)
// ==========================================
interface TwoQubitDCNProps {
  stateVector: StateVector;
  highlightIndex: number | null;
  onHover?: (index: number | null) => void;
  showOverlays: boolean;
  showSeparabilityPlanes: boolean;
  isQ1Sep?: boolean;
  isQ2Sep?: boolean;
}

const TwoQubitDCN: React.FC<TwoQubitDCNProps> = ({
  stateVector,
  highlightIndex,
  onHover,
  showOverlays,
  showSeparabilityPlanes,
  isQ1Sep,
  isQ2Sep,
}) => {
  const R = 38;
  const col0X = 90;
  const col1X = 270;
  const row0Y = 80;
  const row1Y = 250;

  // 2-Qubit Node positions (Little-Endian: |q2 q1>)
  // Top-Left: |00> (index 0)
  // Top-Right: |01> (index 1)
  // Bottom-Left: |10> (index 2)
  // Bottom-Right: |11> (index 3)
  const nodePositions = [
    { x: col0X, y: row0Y, index: 0, label: '00' },
    { x: col1X, y: row0Y, index: 1, label: '01' },
    { x: col0X, y: row1Y, index: 2, label: '10' },
    { x: col1X, y: row1Y, index: 3, label: '11' },
  ];

  const midX = (col0X + col1X) / 2;
  const midY = (row0Y + row1Y) / 2;

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex justify-center">
        <svg viewBox="0 0 410 340" className="w-full max-w-[430px] h-auto select-none">
          {/* Axis Labels & Grid Lines */}
          <defs>
            <marker
              id="axis-arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
            </marker>
          </defs>

          {/* Qubit 1 Axis (Horizontal: 0 -> 1) */}
          <line
            x1={col0X}
            y1={24}
            x2={col1X + 40}
            y2={24}
            stroke="#64748b"
            strokeWidth="1.5"
            markerEnd="url(#axis-arrow)"
          />
          <text x={midX} y={16} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">
            Qubit #1 Axis (0 → 1)
          </text>
          <text x={col0X} y={38} textAnchor="middle" fontSize="10" fill="#64748b">
            q₁ = 0
          </text>
          <text x={col1X} y={38} textAnchor="middle" fontSize="10" fill="#64748b">
            q₁ = 1
          </text>

          {/* Qubit 2 Axis (Vertical: 0 -> 1) */}
          <line
            x1={24}
            y1={row0Y}
            x2={24}
            y2={row1Y + 40}
            stroke="#64748b"
            strokeWidth="1.5"
            markerEnd="url(#axis-arrow)"
          />
          <text
            x={14}
            y={midY}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#334155"
            transform={`rotate(-90 14 ${midY})`}
          >
            Qubit #2 Axis (0 → 1)
          </text>
          <text x={38} y={row0Y + 3} textAnchor="start" fontSize="10" fill="#64748b">
            q₂ = 0
          </text>
          <text x={38} y={row1Y + 3} textAnchor="start" fontSize="10" fill="#64748b">
            q₂ = 1
          </text>

          {/* Grid Lines Connecting States */}
          <line x1={col0X} y1={row0Y} x2={col1X} y2={row0Y} stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1={col0X} y1={row1Y} x2={col1X} y2={row1Y} stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1={col0X} y1={row0Y} x2={col0X} y2={row1Y} stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1={col1X} y1={row0Y} x2={col1X} y2={row1Y} stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Separability Plane Overlays */}
          {showSeparabilityPlanes && (
            <g className="transition-opacity duration-300">
              {/* Q1 Plane (Vertical cut) */}
              {isQ1Sep !== undefined && (
                <g>
                  <rect
                    x={midX - 16}
                    y={50}
                    width={32}
                    height={250}
                    fill={isQ1Sep ? '#10b981' : '#ef4444'}
                    fillOpacity="0.18"
                    stroke={isQ1Sep ? '#059669' : '#dc2626'}
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    rx="4"
                  />
                  <text
                    x={midX}
                    y={315}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={isQ1Sep ? '#059669' : '#dc2626'}
                  >
                    Q1 {isQ1Sep ? 'Separable ✓' : 'Entangled ✗'}
                  </text>
                </g>
              )}

              {/* Q2 Plane (Horizontal cut) */}
              {isQ2Sep !== undefined && (
                <g>
                  <rect
                    x={50}
                    y={midY - 16}
                    width={260}
                    height={32}
                    fill={isQ2Sep ? '#10b981' : '#ef4444'}
                    fillOpacity="0.18"
                    stroke={isQ2Sep ? '#059669' : '#dc2626'}
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    rx="4"
                  />
                  <text
                    x={322}
                    y={midY + 4}
                    textAnchor="start"
                    fontSize="10"
                    fontWeight="bold"
                    fill={isQ2Sep ? '#059669' : '#dc2626'}
                  >
                    Q2 {isQ2Sep ? 'Sep ✓' : 'Ent ✗'}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Circle Notation Nodes */}
          {nodePositions.map(({ x, y, index, label }) => {
            const c = stateVector[index];
            const mag = C.mag(c);
            const prob = C.mag2(c);
            const phi = C.phase(c);
            const innerR = Math.max(0, R * mag);
            const isHighlighted = highlightIndex === index;

            // Pointer calculation: 0 is UP (12 o'clock), CCW is positive
            const pointerX = x - R * Math.sin(phi);
            const pointerY = y - R * Math.cos(phi);

            return (
              <g
                key={index}
                className="cursor-pointer"
                onMouseEnter={() => onHover && onHover(index)}
                onMouseLeave={() => onHover && onHover(null)}
              >
                {/* Highlight Halo */}
                {isHighlighted && (
                  <circle
                    cx={x}
                    cy={y}
                    r={R + 7}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeDasharray="4 2"
                    className="animate-pulse"
                  />
                )}

                {/* Outer Unit Reference Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={R}
                  fill="#ffffff"
                  stroke={isHighlighted ? '#f59e0b' : '#94a3b8'}
                  strokeWidth={isHighlighted ? '2' : '1.5'}
                />

                {/* Crosshairs */}
                <line x1={x} y1={y - R} x2={x} y2={y + R} stroke="#f1f5f9" strokeWidth="1" />
                <line x1={x - R} y1={y} x2={x + R} y2={y} stroke="#f1f5f9" strokeWidth="1" />

                {/* Inner Filled Circle: Area proportional to |c_i|^2 */}
                {mag > 0.001 && (
                  <circle
                    cx={x}
                    cy={y}
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
                      x1={x}
                      y1={y}
                      x2={pointerX}
                      y2={pointerY}
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx={pointerX} cy={pointerY} r="3" fill="#0f172a" />
                  </g>
                )}

                <circle cx={x} cy={y} r="2.5" fill="#475569" />

                {/* Basis State Ket Label */}
                <text
                  x={x}
                  y={y + R + 18}
                  textAnchor="middle"
                  className={`text-[12px] font-mono select-none ${
                    isHighlighted ? 'font-bold fill-amber-600' : 'fill-slate-800 font-semibold'
                  }`}
                >
                  |{label}⟩
                </text>

                {/* Numerical Overlays */}
                {showOverlays && (
                  <text
                    x={x}
                    y={y + R + 31}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#0d9488"
                    fontWeight="bold"
                  >
                    {(prob * 100).toFixed(prob >= 0.099 ? 1 : 2)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <GaugeHelper compact />
    </div>
  );
};

// ==========================================
// 3-Qubit DCN (2x2x2 Cube Projection)
// ==========================================
interface ThreeQubitDCNProps {
  stateVector: StateVector;
  highlightIndex: number | null;
  onHover?: (index: number | null) => void;
  showOverlays: boolean;
  showSeparabilityPlanes: boolean;
  isQ1Sep?: boolean;
  isQ2Sep?: boolean;
  isQ3Sep?: boolean;
  separabilityResults?: SeparabilityResult[];
}

const ThreeQubitDCN: React.FC<ThreeQubitDCNProps> = ({
  stateVector,
  highlightIndex,
  onHover,
  showOverlays,
  showSeparabilityPlanes,
  isQ1Sep,
  isQ2Sep,
  isQ3Sep,
  separabilityResults = [],
}) => {
  const R = 27;

  // Front face (q3 = 0):
  const fCol0X = 70;
  const fCol1X = 230;
  const fRow0Y = 125;
  const fRow1Y = 275;

  // Depth offset for Back face (q3 = 1):
  const dx = 135;
  const dy = -60;

  // Back face (q3 = 1):
  const bCol0X = fCol0X + dx; // 205
  const bCol1X = fCol1X + dx; // 365
  const bRow0Y = fRow0Y + dy; // 65
  const bRow1Y = fRow1Y + dy; // 215

  // Basis states indexing: |q3 q2 q1>
  const nodes = [
    // Front face (q3 = 0)
    { x: fCol0X, y: fRow0Y, index: 0, label: '000', face: 'front' },
    { x: fCol1X, y: fRow0Y, index: 1, label: '001', face: 'front' },
    { x: fCol0X, y: fRow1Y, index: 2, label: '010', face: 'front' },
    { x: fCol1X, y: fRow1Y, index: 3, label: '011', face: 'front' },
    // Back face (q3 = 1)
    { x: bCol0X, y: bRow0Y, index: 4, label: '100', face: 'back' },
    { x: bCol1X, y: bRow0Y, index: 5, label: '101', face: 'back' },
    { x: bCol0X, y: bRow1Y, index: 6, label: '110', face: 'back' },
    { x: bCol1X, y: bRow1Y, index: 7, label: '111', face: 'back' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex justify-center">
        <svg viewBox="0 0 460 360" className="w-full max-w-[480px] h-auto select-none">
          <defs>
            <marker
              id="axis-arrow-3d"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
            </marker>
          </defs>

          {/* 3D Axis Legend */}
          <g transform="translate(15, 20)">
            {/* Q1: Horizontal */}
            <line x1="0" y1="20" x2="35" y2="20" stroke="#0284c7" strokeWidth="2" markerEnd="url(#axis-arrow-3d)" />
            <text x="40" y="23" fontSize="9" fontWeight="bold" fill="#0284c7">Q1 (Horiz)</text>

            {/* Q2: Vertical */}
            <line x1="0" y1="20" x2="0" y2="55" stroke="#059669" strokeWidth="2" markerEnd="url(#axis-arrow-3d)" />
            <text x="5" y="65" fontSize="9" fontWeight="bold" fill="#059669">Q2 (Vert)</text>

            {/* Q3: Depth */}
            <line x1="0" y1="20" x2="25" y2="5" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#axis-arrow-3d)" />
            <text x="28" y="5" fontSize="9" fontWeight="bold" fill="#7c3aed">Q3 (Depth)</text>
          </g>

          {/* Cube Edges */}
          {/* Back face edges (lighter) */}
          <line x1={bCol0X} y1={bRow0Y} x2={bCol1X} y2={bRow0Y} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={bCol0X} y1={bRow1Y} x2={bCol1X} y2={bRow1Y} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={bCol0X} y1={bRow0Y} x2={bCol0X} y2={bRow1Y} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={bCol1X} y1={bRow0Y} x2={bCol1X} y2={bRow1Y} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Connecting Depth Edges (front to back) */}
          <line x1={fCol0X} y1={fRow0Y} x2={bCol0X} y2={bRow0Y} stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1={fCol1X} y1={fRow0Y} x2={bCol1X} y2={bRow0Y} stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1={fCol0X} y1={fRow1Y} x2={bCol0X} y2={bRow1Y} stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1={fCol1X} y1={fRow1Y} x2={bCol1X} y2={bRow1Y} stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Front face edges */}
          <line x1={fCol0X} y1={fRow0Y} x2={fCol1X} y2={fRow0Y} stroke="#94a3b8" strokeWidth="1.75" />
          <line x1={fCol0X} y1={fRow1Y} x2={fCol1X} y2={fRow1Y} stroke="#94a3b8" strokeWidth="1.75" />
          <line x1={fCol0X} y1={fRow0Y} x2={fCol0X} y2={fRow1Y} stroke="#94a3b8" strokeWidth="1.75" />
          <line x1={fCol1X} y1={fRow0Y} x2={fCol1X} y2={fRow1Y} stroke="#94a3b8" strokeWidth="1.75" />

          {/* Separability Planes for 3Q */}
          {showSeparabilityPlanes && (
            <g className="transition-opacity duration-300">
              {/* Q3 Depth Plane (between front and back) */}
              {isQ3Sep !== undefined && (
                <polygon
                  points={`
                    ${(fCol0X + bCol0X) / 2},${(fRow0Y + bRow0Y) / 2}
                    ${(fCol1X + bCol1X) / 2},${(fRow0Y + bRow0Y) / 2}
                    ${(fCol1X + bCol1X) / 2},${(fRow1Y + bRow1Y) / 2}
                    ${(fCol0X + bCol0X) / 2},${(fRow1Y + bRow1Y) / 2}
                  `}
                  fill={isQ3Sep ? '#10b981' : '#ef4444'}
                  fillOpacity="0.22"
                  stroke={isQ3Sep ? '#059669' : '#dc2626'}
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}

              {/* Q1 Vertical Cut Plane */}
              {isQ1Sep !== undefined && (
                <polygon
                  points={`
                    ${(fCol0X + fCol1X) / 2},${fRow0Y}
                    ${(bCol0X + bCol1X) / 2},${bRow0Y}
                    ${(bCol0X + bCol1X) / 2},${bRow1Y}
                    ${(fCol0X + fCol1X) / 2},${fRow1Y}
                  `}
                  fill={isQ1Sep ? '#10b981' : '#ef4444'}
                  fillOpacity="0.2"
                  stroke={isQ1Sep ? '#059669' : '#dc2626'}
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}

              {/* Q2 Horizontal Cut Plane */}
              {isQ2Sep !== undefined && (
                <polygon
                  points={`
                    ${fCol0X},${(fRow0Y + fRow1Y) / 2}
                    ${fCol1X},${(fRow0Y + fRow1Y) / 2}
                    ${bCol1X},${(bRow0Y + bRow1Y) / 2}
                    ${bCol0X},${(bRow0Y + bRow1Y) / 2}
                  `}
                  fill={isQ2Sep ? '#10b981' : '#ef4444'}
                  fillOpacity="0.2"
                  stroke={isQ2Sep ? '#059669' : '#dc2626'}
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}
            </g>
          )}

          {/* Render Nodes (Back face first, then front face for proper z-order) */}
          {nodes.map(({ x, y, index, label, face }) => {
            const c = stateVector[index];
            const mag = C.mag(c);
            const prob = C.mag2(c);
            const phi = C.phase(c);
            const innerR = Math.max(0, R * mag);
            const isHighlighted = highlightIndex === index;

            const pointerX = x - R * Math.sin(phi);
            const pointerY = y - R * Math.cos(phi);

            return (
              <g
                key={index}
                className="cursor-pointer"
                onMouseEnter={() => onHover && onHover(index)}
                onMouseLeave={() => onHover && onHover(null)}
              >
                {/* Highlight Halo */}
                {isHighlighted && (
                  <circle
                    cx={x}
                    cy={y}
                    r={R + 6}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                    className="animate-pulse"
                  />
                )}

                {/* Outer Reference Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={R}
                  fill={face === 'back' ? '#f8fafc' : '#ffffff'}
                  stroke={isHighlighted ? '#f59e0b' : face === 'back' ? '#cbd5e1' : '#94a3b8'}
                  strokeWidth={isHighlighted ? '2' : '1.5'}
                />

                {/* Light crosshairs */}
                <line x1={x} y1={y - R} x2={x} y2={y + R} stroke="#f1f5f9" strokeWidth="1" />
                <line x1={x - R} y1={y} x2={x + R} y2={y} stroke="#f1f5f9" strokeWidth="1" />

                {/* Inner Filled Circle: Area proportional to |c_i|^2 */}
                {mag > 0.001 && (
                  <circle
                    cx={x}
                    cy={y}
                    r={innerR}
                    fill="#0d9488"
                    opacity={face === 'back' ? 0.75 : 0.9}
                    className="quantum-circle-inner"
                  />
                )}

                {/* Radial Phase Gauge Line */}
                {mag > 0.001 && (
                  <g className="quantum-phase-line">
                    <line
                      x1={x}
                      y1={y}
                      x2={pointerX}
                      y2={pointerY}
                      stroke="#0f172a"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <circle cx={pointerX} cy={pointerY} r="2.5" fill="#0f172a" />
                  </g>
                )}

                <circle cx={x} cy={y} r="2" fill="#475569" />

                {/* Ket Label */}
                <text
                  x={x}
                  y={y + R + 14}
                  textAnchor="middle"
                  className={`text-[11px] font-mono select-none ${
                    isHighlighted ? 'font-bold fill-amber-600' : 'fill-slate-800 font-semibold'
                  }`}
                >
                  |{label}⟩
                </text>

                {/* Numerical Overlays */}
                {showOverlays && (
                  <text
                    x={x}
                    y={y + R + 24}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#0d9488"
                    fontWeight="bold"
                  >
                    {(prob * 100).toFixed(prob >= 0.099 ? 1 : 2)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Plane status badges if enabled */}
      {showSeparabilityPlanes && separabilityResults.length > 0 && (
        <div className="flex items-center justify-center gap-3 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-700">Separability Planes:</span>
          {separabilityResults.map((r) => (
            <span
              key={r.qubit}
              className={`px-2 py-0.5 rounded-full font-medium ${
                r.isSeparable
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              Qubit #{r.qubit}: {r.isSeparable ? 'Separable ✓' : 'Entangled ✗'}
            </span>
          ))}
        </div>
      )}

      <GaugeHelper compact />
    </div>
  );
};
