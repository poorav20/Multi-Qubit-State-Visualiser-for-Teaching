import React from 'react';
import { HelpCircle } from 'lucide-react';

interface GaugeHelperProps {
  compact?: boolean;
}

export const GaugeHelper: React.FC<GaugeHelperProps> = ({ compact = false }) => {
  const size = compact ? 90 : 130;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;

  // Phase Gauge convention:
  // 0 points straight UP (12 o'clock)
  // Positive angles rotate COUNTERCLOCKWISE
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 shadow-xs text-slate-700">
      <div className="flex items-center gap-1.5 mb-1.5 font-semibold text-xs text-slate-800">
        <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
        <span>Phase Gauge Convention</span>
      </div>

      <div className="flex items-center gap-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
          <defs>
            <marker
              id="gauge-arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0d9488" />
            </marker>
          </defs>

          {/* Reference Circle */}
          <circle cx={cx} cy={cy} r={r} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
          
          {/* Axis ticks */}
          <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#e2e8f0" strokeWidth="1" />
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#e2e8f0" strokeWidth="1" />

          {/* Zero phase pointer (12 o'clock, straight UP) */}
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - r}
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="3" fill="#0f172a" />

          {/* CCW positive direction arc */}
          <path
            d={`M ${cx} ${cy - r * 0.65} A ${r * 0.65} ${r * 0.65} 0 0 0 ${cx - r * 0.65} ${cy}`}
            fill="none"
            stroke="#0d9488"
            strokeWidth="1.75"
            markerEnd="url(#gauge-arrow)"
          />

          {/* Labels */}
          {/* 12 o'clock = 0 */}
          <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a">
            0 (12:00)
          </text>
          {/* 9 o'clock = +π/2 */}
          <text x={cx - r - 4} y={cy + 3} textAnchor="end" fontSize="8" fontWeight="600" fill="#0d9488">
            +π/2
          </text>
          {/* 6 o'clock = ±π */}
          <text x={cx} y={cy + r + 11} textAnchor="middle" fontSize="8" fill="#64748b">
            ±π
          </text>
          {/* 3 o'clock = -π/2 */}
          <text x={cx + r + 4} y={cy + 3} textAnchor="start" fontSize="8" fill="#64748b">
            -π/2
          </text>
        </svg>

        <div className="text-[11px] leading-tight space-y-1 text-slate-600">
          <p>
            <strong className="text-slate-800">12 o'clock = 0:</strong> Zero phase points straight UP.
          </p>
          <p>
            <strong className="text-teal-700">Counterclockwise = +φ:</strong> E.g., <span className="font-mono text-teal-800">+π/2</span> points Left (9 o'clock).
          </p>
          <p>
            <strong className="text-slate-800">Area = |c|²:</strong> Teal disk area = probability.
          </p>
        </div>
      </div>
    </div>
  );
};
