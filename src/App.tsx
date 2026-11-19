import { useState, useCallback, useMemo } from 'react';
import {
  Atom,
  BookOpen,
  FlaskConical,
  LayoutGrid,
  Columns2,
  Eye,
  Box,
  Globe2,
  BarChart3,
} from 'lucide-react';
import type { StateVector } from './engine/quantumMath';
import type { SeparabilityResult } from './engine/quantumMath';
import {
  makeZeroState,
  normalize,
  PRESET_STATES,
  checkAllSeparabilities,
} from './engine/quantumMath';

import { CircleNotation } from './components/visualizations/CircleNotation';
import { DimensionalCircleNotation } from './components/visualizations/DimensionalCircleNotation';
import { Quantum3DHypercube } from './components/visualizations/Quantum3DHypercube';
import { BlochSphere3D } from './components/visualizations/BlochSphere3D';
import { QuantumAnalyticsGraphs } from './components/visualizations/QuantumAnalyticsGraphs';
import { DiracNotation } from './components/sandbox/DiracNotation';
import { AmplitudeEditor } from './components/sandbox/AmplitudeEditor';
import { GateSandbox } from './components/sandbox/GateSandbox';
import { InteractiveControlsBar } from './components/sandbox/InteractiveControlsBar';
import { QuizPanel } from './components/quiz/QuizPanel';

type VizMode = 'split' | '3d' | 'bloch' | 'graphs' | 'cn' | 'dcn';
type AppTab = 'workspace' | 'quiz';

export default function App() {
  // --- Core State ---
  const [nQubits, setNQubits] = useState(2);
  const [stateVector, setStateVector] = useState<StateVector>(
    () => PRESET_STATES[0].vector
  );
  const [vizMode, setVizMode] = useState<VizMode>('split');
  const [activeTab, setActiveTab] = useState<AppTab>('workspace');
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [autoNormalize, setAutoNormalize] = useState(true);
  const [showSeparabilityPlanes, setShowSeparabilityPlanes] = useState(false);

  // --- History ---
  const [history, setHistory] = useState<StateVector[]>(() => [PRESET_STATES[0].vector]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const separabilityResults = useMemo(
    () => checkAllSeparabilities(stateVector),
    [stateVector]
  );

  const pushState = useCallback(
    (sv: StateVector) => {
      setStateVector(sv);
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        return [...trimmed, sv];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleStateChange = useCallback(
    (sv: StateVector) => {
      const finalSv = autoNormalize ? normalize(sv) : sv;
      pushState(finalSv);
    },
    [autoNormalize, pushState]
  );

  const handlePresetLoad = useCallback(
    (preset: (typeof PRESET_STATES)[number]) => {
      setNQubits(preset.nQubits);
      pushState(preset.vector);
    },
    [pushState]
  );

  const handleQubitCountChange = useCallback(
    (n: number) => {
      setNQubits(n);
      const zeroState = makeZeroState(n);
      pushState(zeroState);
    },
    [pushState]
  );

  const handleQuizLoadState = useCallback(
    (sv: StateVector, nQ: number) => {
      setNQubits(nQ);
      pushState(sv);
      setActiveTab('workspace');
    },
    [pushState]
  );

  const handleHistoryRestore = useCallback(
    (index: number) => {
      if (index >= 0 && index < history.length) {
        setHistoryIndex(index);
        setStateVector(history[index]);
      }
    },
    [history]
  );

  const handleSeparabilityChange = useCallback(
    (_results: SeparabilityResult[]) => {
      // Results are computed via useMemo, this callback is for the toggle
    },
    []
  );

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ====== HEADER ====== */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                <Atom className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Quantum State Visualiser
                </h1>
                <p className="text-xs text-slate-500">
                  Multi-Qubit QIS Interactive Learning &amp; Simulation Platform
                </p>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Qubit Count Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => handleQubitCountChange(2)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    nQubits === 2
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  2 Qubits
                </button>
                <button
                  onClick={() => handleQubitCountChange(3)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    nQubits === 3
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  3 Qubits
                </button>
              </div>

              {/* Viz Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
                <button
                  onClick={() => setVizMode('split')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    vizMode === 'split'
                      ? 'bg-white text-teal-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Side-by-side CN and DCN"
                >
                  <Columns2 className="w-3.5 h-3.5" /> Split (CN+DCN)
                </button>
                <button
                  onClick={() => setVizMode('3d')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    vizMode === '3d'
                      ? 'bg-white text-cyan-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="3D WebGL Quantum Hypercube"
                >
                  <Box className="w-3.5 h-3.5 text-cyan-600" /> 3D Hypercube
                </button>
                <button
                  onClick={() => setVizMode('bloch')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    vizMode === 'bloch'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Reduced Density Matrix Bloch Spheres"
                >
                  <Globe2 className="w-3.5 h-3.5 text-indigo-600" /> Bloch Spheres
                </button>
                <button
                  onClick={() => setVizMode('graphs')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    vizMode === 'graphs'
                      ? 'bg-white text-teal-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Probability Spectrum & Polar Phase Radar"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Analytics Graphs
                </button>
                <button
                  onClick={() => setVizMode('dcn')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    vizMode === 'dcn'
                      ? 'bg-white text-teal-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Dimensional Circle Notation (2D/3D SVG)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> DCN
                </button>
                <button
                  onClick={() => setVizMode('cn')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    vizMode === 'cn'
                      ? 'bg-white text-teal-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Circle Notation (1D Row)"
                >
                  <Eye className="w-3.5 h-3.5" /> CN
                </button>
              </div>

              {/* Overlay Toggle */}
              <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOverlays}
                  onChange={(e) => setShowOverlays(e.target.checked)}
                  className="rounded border-slate-300 text-teal-500 focus:ring-teal-500"
                />
                Overlays
              </label>
            </div>
          </div>

          {/* Preset States Bar */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Presets:
            </span>
            {PRESET_STATES.filter(
              (p) => p.nQubits === nQubits
            ).map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetLoad(preset)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 hover:border-teal-300 transition-colors"
                title={preset.description}
              >
                {preset.shortName}
              </button>
            ))}
            {/* Show presets for the other qubit count too, dimmed */}
            {PRESET_STATES.filter(
              (p) => p.nQubits !== nQubits
            ).map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetLoad(preset)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-400 hover:bg-teal-50 hover:text-teal-700 border border-slate-100 hover:border-teal-300 transition-colors"
                title={`${preset.description} (switches to ${preset.nQubits}Q)`}
              >
                {preset.shortName} ({preset.nQubits}Q)
              </button>
            ))}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex gap-6 mt-1">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-1.5 px-1 py-2 text-sm transition-colors ${
                activeTab === 'workspace' ? 'tab-active' : 'tab-inactive'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Sandbox & Visualiser
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 px-1 py-2 text-sm transition-colors ${
                activeTab === 'quiz' ? 'tab-active' : 'tab-inactive'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Misconception Quiz
            </button>
          </div>
        </div>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        {activeTab === 'workspace' ? (
          <div className="space-y-5">
            {/* Interactive Control & Evolution Simulator Bar */}
            <InteractiveControlsBar
              stateVector={stateVector}
              onStateChange={handleStateChange}
              separabilityResults={separabilityResults}
            />

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
              {/* ---- Left: Visualization + Dirac Notation ---- */}
              <div className="space-y-6">
              {/* Dirac Notation Display */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  Dirac Notation
                </h2>
                <DiracNotation
                  stateVector={stateVector}
                  highlightIndex={highlightIndex}
                  onHover={setHighlightIndex}
                />
              </div>

              {/* Visualizations Container */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                    {vizMode === '3d'
                      ? '3D Quantum Hypercube (WebGL 360° Interactive)'
                      : vizMode === 'bloch'
                      ? 'Individual Qubit 3D Bloch Spheres'
                      : vizMode === 'graphs'
                      ? 'Quantum Probability & Polar Phase Radar'
                      : vizMode === 'cn'
                      ? 'Circle Notation (CN Linear Row)'
                      : vizMode === 'dcn'
                      ? 'Dimensional Circle Notation (DCN)'
                      : 'Dual Representation: Circle Notation + Dimensional Circle Notation'}
                  </h2>

                  <span className="text-xs font-mono text-slate-500">
                    System Dimension: 2^{nQubits} = {1 << nQubits} Basis States
                  </span>
                </div>

                {vizMode === '3d' ? (
                  <Quantum3DHypercube
                    stateVector={stateVector}
                    highlightIndex={highlightIndex}
                    onHover={setHighlightIndex}
                    showSeparabilityPlanes={showSeparabilityPlanes}
                    separabilityResults={separabilityResults}
                  />
                ) : vizMode === 'bloch' ? (
                  <BlochSphere3D stateVector={stateVector} />
                ) : vizMode === 'graphs' ? (
                  <QuantumAnalyticsGraphs
                    stateVector={stateVector}
                    highlightIndex={highlightIndex}
                    onHover={setHighlightIndex}
                  />
                ) : vizMode === 'split' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                        Circle Notation (Linear Row)
                      </h3>
                      <CircleNotation
                        stateVector={stateVector}
                        highlightIndex={highlightIndex}
                        onHover={setHighlightIndex}
                        showOverlays={showOverlays}
                      />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                        Dimensional Circle Notation (Grid / Hypercube)
                      </h3>
                      <DimensionalCircleNotation
                        stateVector={stateVector}
                        highlightIndex={highlightIndex}
                        onHover={setHighlightIndex}
                        showOverlays={showOverlays}
                        showSeparabilityPlanes={showSeparabilityPlanes}
                        separabilityResults={separabilityResults}
                      />
                    </div>
                  </div>
                ) : vizMode === 'cn' ? (
                  <CircleNotation
                    stateVector={stateVector}
                    highlightIndex={highlightIndex}
                    onHover={setHighlightIndex}
                    showOverlays={showOverlays}
                  />
                ) : (
                  <DimensionalCircleNotation
                    stateVector={stateVector}
                    highlightIndex={highlightIndex}
                    onHover={setHighlightIndex}
                    showOverlays={showOverlays}
                    showSeparabilityPlanes={showSeparabilityPlanes}
                    separabilityResults={separabilityResults}
                  />
                )}
              </div>

              {/* Amplitude Editor */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Amplitude Editor
                </h2>
                <AmplitudeEditor
                  stateVector={stateVector}
                  onChange={handleStateChange}
                  autoNormalize={autoNormalize}
                  onAutoNormalizeChange={setAutoNormalize}
                />
              </div>

              {/* State History */}
              {history.length > 1 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    State History
                  </h2>
                  <div className="flex gap-1.5 flex-wrap">
                    {history.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handleHistoryRestore(i)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium border transition-colors ${
                          i === historyIndex
                            ? 'bg-teal-50 border-teal-300 text-teal-700'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ---- Right Sidebar: Gate Sandbox ---- */}
            <div className="space-y-6">
              <GateSandbox
                stateVector={stateVector}
                nQubits={nQubits}
                onStateChange={handleStateChange}
                onSeparabilityChange={handleSeparabilityChange}
                showSeparabilityPlanes={showSeparabilityPlanes}
                onShowSeparabilityPlanesChange={setShowSeparabilityPlanes}
              />
            </div>
          </div>
        </div>
        ) : (
          /* ---- Quiz Tab ---- */
          <QuizPanel onLoadState={handleQuizLoadState} />
        )}
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1600px] mx-auto px-4 py-4 text-center text-xs text-slate-500">
          Quantum Information Science (QIS) Interactive Education Platform · 
          Dual-Representation DeFT Framework ·
          Circle Notation &amp; Dimensional 3D Hypercube
        </div>
      </footer>
    </div>
  );
}
