import type { StateVector } from '../../engine/quantumMath';
import { numQubits, basisLabel, C } from '../../engine/quantumMath';

interface StateHistoryProps {
  history: StateVector[];
  currentIndex: number;
  onRestore: (index: number) => void;
}

/** Compact summary: show non-zero basis labels. */
function summarize(sv: StateVector): string {
  const nQ = numQubits(sv);
  const labels: string[] = [];
  for (let i = 0; i < sv.length; i++) {
    if (C.mag(sv[i]) > 1e-10) {
      labels.push(`|${basisLabel(i, nQ)}⟩`);
    }
  }
  if (labels.length === 0) return '0';
  if (labels.length <= 4) return labels.join(' + ');
  return `${labels.slice(0, 3).join(' + ')} + … (${labels.length} terms)`;
}

export default function StateHistory({
  history,
  currentIndex,
  onRestore,
}: StateHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-1">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
        State History
      </h4>
      <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
        {history.map((sv, idx) => {
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={idx}
              onClick={() => onRestore(idx)}
              className={`w-full text-left rounded px-2 py-1 text-xs transition-colors ${
                isCurrent
                  ? 'bg-indigo-100 text-indigo-800 font-semibold ring-1 ring-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="font-mono text-[10px] text-slate-400 mr-1.5">
                #{idx + 1}
              </span>
              <span className="font-mono">{summarize(sv)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
