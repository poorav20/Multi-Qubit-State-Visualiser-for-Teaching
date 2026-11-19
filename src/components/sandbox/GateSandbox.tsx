import React, { useState } from 'react';
import type { StateVector } from '../../engine/quantumMath';
import type { SeparabilityResult } from '../../engine/quantumMath';
import {
  applyX,
  applyZ,
  applyH,
  applyCNOT,
  partialMeasurement,
  checkAllSeparabilities,
} from '../../engine/quantumMath';
import { quantumAudio } from '../../engine/quantumAudio';
import {
  Zap,
  Activity,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface GateSandboxProps {
  stateVector: StateVector;
  nQubits: number;
  onStateChange: (sv: StateVector) => void;
  onSeparabilityChange?: (results: SeparabilityResult[]) => void;
  showSeparabilityPlanes: boolean;
  onShowSeparabilityPlanesChange: (v: boolean) => void;
}

export const GateSandbox: React.FC<GateSandboxProps> = ({
  stateVector,
  nQubits,
  onStateChange,
  showSeparabilityPlanes,
  onShowSeparabilityPlanesChange,
}) => {
  // Gate selections
  const [singleQubitTarget, setSingleQubitTarget] = useState<number>(1);
  const [cnotControl, setCnotControl] = useState<number>(2);
  const [cnotTarget, setCnotTarget] = useState<number>(1);

  // Measurement state
  const [measuringQubit, setMeasuringQubit] = useState<number | null>(null);
  const [measurementData, setMeasurementData] = useState<{
    qubit: number;
    prob0: number;
    prob1: number;
    stateAfter0: StateVector;
    stateAfter1: StateVector;
  } | null>(null);

  // Separability analysis
  const separabilityResults = checkAllSeparabilities(stateVector);

  // Single Qubit Gate Handlers
  const handleApplyX = () => {
    quantumAudio.playGateSound('X');
    onStateChange(applyX(stateVector, singleQubitTarget));
  };
  const handleApplyZ = () => {
    quantumAudio.playGateSound('Z');
    onStateChange(applyZ(stateVector, singleQubitTarget));
  };
  const handleApplyH = () => {
    quantumAudio.playGateSound('H');
    onStateChange(applyH(stateVector, singleQubitTarget));
  };

  // CNOT Handler
  const handleApplyCNOT = () => {
    if (cnotControl === cnotTarget) return;
    quantumAudio.playGateSound('CNOT');
    onStateChange(applyCNOT(stateVector, cnotControl, cnotTarget));
  };

  // Measurement Handlers
  const handleMeasureInspect = (q: number) => {
    const res = partialMeasurement(stateVector, q);
    setMeasuringQubit(q);
    setMeasurementData({
      qubit: q,
      prob0: res.prob0,
      prob1: res.prob1,
      stateAfter0: res.stateAfter0,
      stateAfter1: res.stateAfter1,
    });
  };

  const handleCollapse = (outcome: 0 | 1) => {
    if (!measurementData) return;
    quantumAudio.playCollapseSound();
    const nextState = outcome === 0 ? measurementData.stateAfter0 : measurementData.stateAfter1;
    onStateChange(nextState);
    setMeasurementData(null);
    setMeasuringQubit(null);
  };

  const availableQubits = Array.from({ length: nQubits }, (_, i) => i + 1);

  return (
    <div className="space-y-5">
      {/* =========================================
          SECTION 1: Single-Qubit Gates
      ========================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Single-Qubit Unitary Gates
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Target Qubit:</span>
            <select
              value={singleQubitTarget}
              onChange={(e) => setSingleQubitTarget(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-semibold text-teal-800"
            >
              {availableQubits.map((q) => (
                <option key={q} value={q}>
                  Qubit #{q}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* X Gate */}
          <button
            onClick={handleApplyX}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg transition-all group shadow-2xs"
          >
            <span className="font-mono text-base font-bold text-slate-800 group-hover:text-teal-700">
              X_{singleQubitTarget}
            </span>
            <span className="text-[10px] text-slate-500">Bit Flip (NOT)</span>
          </button>

          {/* Z Gate */}
          <button
            onClick={handleApplyZ}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg transition-all group shadow-2xs"
          >
            <span className="font-mono text-base font-bold text-slate-800 group-hover:text-teal-700">
              Z_{singleQubitTarget}
            </span>
            <span className="text-[10px] text-slate-500">Phase Flip (π)</span>
          </button>

          {/* Hadamard Gate */}
          <button
            onClick={handleApplyH}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg transition-all group shadow-2xs"
          >
            <span className="font-mono text-base font-bold text-slate-800 group-hover:text-teal-700">
              H_{singleQubitTarget}
            </span>
            <span className="text-[10px] text-slate-500">Superposition</span>
          </button>
        </div>
      </div>

      {/* =========================================
          SECTION 2: Multi-Qubit CNOT Gate
      ========================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Controlled-NOT (CNOT)
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-slate-500">Control (c):</span>
            <select
              value={cnotControl}
              onChange={(e) => setCnotControl(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-medium text-slate-700"
            >
              {availableQubits.map((q) => (
                <option key={q} value={q}>
                  Qubit #{q}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-slate-500">Target (t):</span>
            <select
              value={cnotTarget}
              onChange={(e) => setCnotTarget(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-medium text-slate-700"
            >
              {availableQubits.map((q) => (
                <option key={q} value={q}>
                  Qubit #{q}
                </option>
              ))}
            </select>
          </div>
        </div>

        {cnotControl === cnotTarget && (
          <p className="text-[11px] text-rose-500 italic">
            Control and Target must be different qubits.
          </p>
        )}

        <button
          onClick={handleApplyCNOT}
          disabled={cnotControl === cnotTarget}
          className={`w-full py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors ${
            cnotControl === cnotTarget
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <span>Apply CNOT (Control: Q{cnotControl} → Target: Q{cnotTarget})</span>
        </button>
      </div>

      {/* =========================================
          SECTION 3: Partial Measurement Simulator
      ========================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Activity className="w-4 h-4 text-teal-600" />
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Partial Projective Measurement
          </h3>
        </div>

        <p className="text-[11px] text-slate-500">
          Calculates marginal probabilities $P(q=0)$ and $P(q=1)$, then projects &amp; renormalizes.
        </p>

        <div className="flex gap-2">
          {availableQubits.map((q) => (
            <button
              key={q}
              onClick={() => handleMeasureInspect(q)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                measuringQubit === q
                  ? 'bg-teal-500 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Measure Q#{q}
            </button>
          ))}
        </div>

        {measurementData && (
          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg space-y-2 text-xs">
            <div className="font-semibold text-teal-900 flex justify-between">
              <span>Marginals for Qubit #{measurementData.qubit}:</span>
              <span className="text-[10px] text-teal-700 font-normal">
                (Sums inner circle areas)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-white rounded border border-teal-100">
                <div className="text-slate-500 text-[10px]">P(q = 0)</div>
                <div className="text-sm font-bold text-teal-800">
                  {(measurementData.prob0 * 100).toFixed(1)}%
                </div>
                <button
                  onClick={() => handleCollapse(0)}
                  disabled={measurementData.prob0 < 1e-6}
                  className={`mt-1.5 w-full py-1 text-[11px] rounded font-semibold transition-colors ${
                    measurementData.prob0 < 1e-6
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  Collapse → 0
                </button>
              </div>

              <div className="p-2 bg-white rounded border border-teal-100">
                <div className="text-slate-500 text-[10px]">P(q = 1)</div>
                <div className="text-sm font-bold text-teal-800">
                  {(measurementData.prob1 * 100).toFixed(1)}%
                </div>
                <button
                  onClick={() => handleCollapse(1)}
                  disabled={measurementData.prob1 < 1e-6}
                  className={`mt-1.5 w-full py-1 text-[11px] rounded font-semibold transition-colors ${
                    measurementData.prob1 < 1e-6
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  Collapse → 1
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================
          SECTION 4: Entanglement & Separability Inspector
      ========================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Separability &amp; Symmetry Inspector
            </h3>
          </div>

          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showSeparabilityPlanes}
              onChange={(e) => onShowSeparabilityPlanesChange(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>Show Planes</span>
          </label>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Symmetry ratio analysis: checks whether parallel edge ratios{' '}
          <span className="font-mono text-slate-700">c₁ / c₀</span> are constant across each qubit axis.
        </p>

        <div className="space-y-2.5">
          {separabilityResults.map((r) => (
            <div
              key={r.qubit}
              className={`p-3 rounded-xl text-xs font-medium border space-y-2 transition-all ${
                r.isSeparable
                  ? 'bg-emerald-50/70 text-emerald-950 border-emerald-300'
                  : 'bg-rose-50/70 text-rose-950 border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {r.isSeparable ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold text-slate-800">Qubit #{r.qubit} Axis</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    r.isSeparable
                      ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-200 text-rose-900 border border-rose-300'
                  }`}
                >
                  {r.isSeparable ? 'SEPARABLE ✓' : 'ENTANGLED ✗'}
                </span>
              </div>

              {/* Edge Ratios Breakdown */}
              {r.ratios && r.ratios.length > 0 && (
                <div className="bg-white/80 rounded-lg p-2 border border-slate-200/80 space-y-1 font-mono text-[11px]">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-semibold">
                    Parallel-Edge Ratios (c₁ / c₀):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-700">
                    {r.ratios.map((edge, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 px-2 py-0.5 rounded">
                        <span className="text-slate-500">{edge.pairLabel}:</span>
                        <span className="font-bold text-slate-900">{edge.ratioStr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pedagogical Explanation */}
              <p className="text-[11px] leading-tight text-slate-600">
                {r.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
