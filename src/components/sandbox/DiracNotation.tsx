import React, { useMemo } from 'react';
import katex from 'katex';
import type { StateVector } from '../../engine/quantumMath';
import { C, numQubits, basisLabel, formatAmplitude } from '../../engine/quantumMath';

interface DiracNotationProps {
  stateVector: StateVector;
  highlightIndex?: number | null;
  onHover?: (index: number | null) => void;
}

export const DiracNotation: React.FC<DiracNotationProps> = ({
  stateVector,
  highlightIndex = null,
  onHover,
}) => {
  const nQ = numQubits(stateVector);

  const renderedPrefix = useMemo(() => {
    try {
      return katex.renderToString('|\\psi\\rangle = ', { throwOnError: false });
    } catch {
      return '|ψ⟩ = ';
    }
  }, []);

  // Filter terms with non-zero amplitude
  const activeTerms = useMemo(() => {
    const list: {
      index: number;
      label: string;
      c: (typeof stateVector)[0];
      tex: string;
      isNegative: boolean;
    }[] = [];

    stateVector.forEach((c, i) => {
      if (C.mag(c) < 1e-6) return;
      const ampStr = formatAmplitude(c);
      const label = basisLabel(i, nQ);
      const isNeg = ampStr.startsWith('-');
      const cleanAmp = isNeg ? ampStr.slice(1) : ampStr;
      const tex = `${cleanAmp}|${label}\\rangle`;

      list.push({
        index: i,
        label,
        c,
        tex,
        isNegative: isNeg,
      });
    });

    return list;
  }, [stateVector, nQ]);

  if (activeTerms.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-slate-500 font-mono text-sm">
        <span>|ψ⟩ = 0 (Null state vector)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-y-2 text-slate-800 text-base md:text-lg select-none p-3 bg-slate-50/70 border border-slate-100 rounded-lg">
      <span
        dangerouslySetInnerHTML={{ __html: renderedPrefix }}
        className="mr-1 text-slate-900 font-semibold"
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {activeTerms.map((term, idx) => {
          const isHighlighted = highlightIndex === term.index;
          let renderedHtml = '';
          try {
            renderedHtml = katex.renderToString(term.tex, { throwOnError: false });
          } catch {
            renderedHtml = term.tex;
          }

          const signSymbol = idx === 0 ? (term.isNegative ? '-' : '') : term.isNegative ? '-' : '+';

          return (
            <div key={term.index} className="inline-flex items-center">
              {signSymbol && (
                <span className="mx-1 text-slate-500 font-medium">{signSymbol}</span>
              )}
              <span
                onMouseEnter={() => onHover && onHover(term.index)}
                onMouseLeave={() => onHover && onHover(null)}
                className={`px-2 py-1 rounded-md cursor-pointer transition-all duration-150 inline-flex items-center ${
                  isHighlighted
                    ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400 font-semibold shadow-xs'
                    : 'hover:bg-teal-50 hover:text-teal-900'
                }`}
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
