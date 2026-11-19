import React from 'react';
import type { StateVector } from '../../engine/quantumMath';
import { C, numQubits, basisLabel, normalize, normSquared } from '../../engine/quantumMath';
import { SlidersHorizontal, RefreshCw } from 'lucide-react';

interface AmplitudeEditorProps {
  stateVector: StateVector;
  onChange: (sv: StateVector) => void;
  autoNormalize: boolean;
  onAutoNormalizeChange: (v: boolean) => void;
}

const PHASE_OPTIONS: { label: string; value: number }[] = [
  { label: '0 (12:00)', value: 0 },
  { label: '+π/6 (+30°)', value: Math.PI / 6 },
  { label: '+π/4 (+45°)', value: Math.PI / 4 },
  { label: '+π/3 (+60°)', value: Math.PI / 3 },
  { label: '+π/2 (+90°, 9:00)', value: Math.PI / 2 },
  { label: '+2π/3 (+120°)', value: (2 * Math.PI) / 3 },
  { label: '+3π/4 (+135°)', value: (3 * Math.PI) / 4 },
  { label: '+5π/6 (+150°)', value: (5 * Math.PI) / 6 },
  { label: '±π (180°, 6:00)', value: Math.PI },
  { label: '-5π/6 (-150°)', value: (-5 * Math.PI) / 6 },
  { label: '-3π/4 (-135°)', value: (-3 * Math.PI) / 4 },
  { label: '-2π/3 (-120°)', value: (-2 * Math.PI) / 3 },
  { label: '-π/2 (-90°, 3:00)', value: -Math.PI / 2 },
  { label: '-π/3 (-60°)', value: -Math.PI / 3 },
  { label: '-π/4 (-45°)', value: -Math.PI / 4 },
  { label: '-π/6 (-30°)', value: -Math.PI / 6 },
];

export const AmplitudeEditor: React.FC<AmplitudeEditorProps> = ({
  stateVector,
  onChange,
  autoNormalize,
  onAutoNormalizeChange,
}) => {
  const nQ = numQubits(stateVector);
  const currentNormSq = normSquared(stateVector);

  const handleMagnitudeChange = (index: number, newMag: number) => {
    const updated = [...stateVector];
    const currentPhi = C.phase(stateVector[index]);
    updated[index] = C.fromPolar(newMag, currentPhi);
    onChange(autoNormalize ? normalize(updated) : updated);
  };

  const handlePhaseChange = (index: number, newPhi: number) => {
    const updated = [...stateVector];
    const currentMag = C.mag(stateVector[index]);
    // If magnitude is 0, give it a default 0.5 so phase change is noticeable
    const mag = currentMag < 1e-4 ? 0.5 : currentMag;
    updated[index] = C.fromPolar(mag, newPhi);
    onChange(autoNormalize ? normalize(updated) : updated);
  };

  const handleManualNormalize = () => {
    onChange(normalize(stateVector));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Basis Amplitudes &amp; Phases
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoNormalize}
              onChange={(e) => onAutoNormalizeChange(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>Auto-Normalize (∑|c|² = 1)</span>
          </label>

          {!autoNormalize && (
            <button
              onClick={handleManualNormalize}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Normalize (Now: {currentNormSq.toFixed(2)})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
        {stateVector.map((c, i) => {
          const mag = C.mag(c);
          const phi = C.phase(c);
          const prob = C.mag2(c);
          const label = basisLabel(i, nQ);

          // Find closest matching phase option
          const matchedPhase = PHASE_OPTIONS.reduce((prev, curr) =>
            Math.abs(curr.value - phi) < Math.abs(prev.value - phi) ? curr : prev
          );

          return (
            <div
              key={i}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  |{label}⟩
                </span>
                <span className="text-[11px] font-medium text-teal-700">
                  |c|² = {(prob * 100).toFixed(1)}% (r = {mag.toFixed(3)})
                </span>
              </div>

              {/* Magnitude Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Magnitude r:</span>
                  <span className="font-mono">{mag.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={mag}
                  onChange={(e) => handleMagnitudeChange(i, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Phase Dropdown */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Phase φ:</span>
                  <span className="font-mono">{(phi / Math.PI).toFixed(2)}π</span>
                </div>
                <select
                  value={matchedPhase.value}
                  onChange={(e) => handlePhaseChange(i, parseFloat(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                >
                  {PHASE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
