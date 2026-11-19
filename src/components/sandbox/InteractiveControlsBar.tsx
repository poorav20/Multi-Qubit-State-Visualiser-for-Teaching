import React, { useEffect, useRef, useState } from 'react';
import type { StateVector } from '../../engine/quantumMath';
import type { SeparabilityResult } from '../../engine/quantumMath';
import {
  makeZeroState,
  makeEqualSuperposition,
  makeRandomState,
  evolveStatePhase,
  numQubits,
} from '../../engine/quantumMath';
import { quantumAudio } from '../../engine/quantumAudio';
import {
  Play,
  Pause,
  Shuffle,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Gauge,
  Flame,
  CheckCircle,
} from 'lucide-react';

interface InteractiveControlsBarProps {
  stateVector: StateVector;
  onStateChange: (sv: StateVector) => void;
  separabilityResults: SeparabilityResult[];
}

export const InteractiveControlsBar: React.FC<InteractiveControlsBarProps> = ({
  stateVector,
  onStateChange,
  separabilityResults,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(quantumAudio.enabled);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const nQ = numQubits(stateVector);

  // Check overall entanglement status
  const allSeparable = separabilityResults.every((r) => r.isSeparable);
  const someSeparable = separabilityResults.some((r) => r.isSeparable);

  // Time evolution loop
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // Advance phase by speed * dt * 1.5 rad/s
      onStateChange(evolveStatePhase(stateVector, dt * speed * 1.5));
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, speed, stateVector, onStateChange]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    quantumAudio.enabled = next;
    if (next) {
      quantumAudio.playGateSound('H');
    }
  };

  const handleRandomize = () => {
    const nextState = makeRandomState(nQ);
    onStateChange(nextState);
    quantumAudio.playGateSound('H');
  };

  const handleEqualSuperposition = () => {
    const nextState = makeEqualSuperposition(nQ);
    onStateChange(nextState);
    quantumAudio.playGateSound('H');
  };

  const handleResetZero = () => {
    const nextState = makeZeroState(nQ);
    onStateChange(nextState);
    quantumAudio.playGateSound('X');
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex items-center justify-between flex-wrap gap-3">
      {/* Left: Dynamic Time Evolution Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
          <Gauge className="w-4 h-4 text-teal-600" />
          <span>Phase Evolution:</span>
        </span>

        {/* Play / Pause Toggle */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
          title="Continuously rotate quantum phases under Hamiltonian time evolution"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Evolution</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Animate Phase (U(t))</span>
            </>
          )}
        </button>

        {/* Speed Selector */}
        {isPlaying && (
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 text-[11px] font-medium text-slate-600">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  speed === s ? 'bg-white text-teal-800 font-bold shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Middle: State Generators */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={handleRandomize}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 hover:border-teal-300 transition-colors"
          title="Generate a random normalized multi-qubit state with arbitrary phases"
        >
          <Shuffle className="w-3.5 h-3.5 text-slate-500" />
          <span>Random State</span>
        </button>

        <button
          onClick={handleEqualSuperposition}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 hover:border-teal-300 transition-colors"
          title="Set state to uniform Hadamard superposition (|++⟩ or |+++⟩)"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Uniform Superposition</span>
        </button>

        <button
          onClick={handleResetZero}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
          title="Reset to ground computational basis state |00...0⟩"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset |0...0⟩</span>
        </button>
      </div>

      {/* Right: Quantum Entanglement & Audio Badges */}
      <div className="flex items-center gap-3">
        {/* Entanglement Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            allSeparable
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
              : someSeparable
              ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
              : 'bg-purple-50 text-purple-800 border-purple-300 shadow-2xs animate-pulse'
          }`}
          title="Live entanglement assessment across all qubit planes"
        >
          {allSeparable ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fully Separable</span>
            </>
          ) : someSeparable ? (
            <>
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Partially Entangled</span>
            </>
          ) : (
            <>
              <Flame className="w-3.5 h-3.5 text-purple-600" />
              <span>Entangled State</span>
            </>
          )}
        </div>

        {/* Audio Feedback Toggle */}
        <button
          onClick={handleToggleSound}
          className={`p-1.5 rounded-xl border transition-colors ${
            soundEnabled
              ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-2xs'
              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
          }`}
          title={soundEnabled ? 'Mute Quantum Audio' : 'Enable Quantum Audio Chimes'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

