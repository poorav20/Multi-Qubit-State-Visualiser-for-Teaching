// ============================================================================
// Quantum Math Engine
// Complex arithmetic, state vectors, gates, measurement, separability
// ============================================================================

// --- Complex Number ---
export interface Complex {
  re: number;
  im: number;
}

export const C = {
  of: (re: number, im: number = 0): Complex => ({ re, im }),
  zero: (): Complex => ({ re: 0, im: 0 }),
  one: (): Complex => ({ re: 1, im: 0 }),
  fromPolar: (r: number, phi: number): Complex => ({
    re: r * Math.cos(phi),
    im: r * Math.sin(phi),
  }),
  add: (a: Complex, b: Complex): Complex => ({
    re: a.re + b.re,
    im: a.im + b.im,
  }),
  sub: (a: Complex, b: Complex): Complex => ({
    re: a.re - b.re,
    im: a.im - b.im,
  }),
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),
  scale: (a: Complex, s: number): Complex => ({
    re: a.re * s,
    im: a.im * s,
  }),
  conj: (a: Complex): Complex => ({ re: a.re, im: -a.im }),
  mag2: (a: Complex): number => a.re * a.re + a.im * a.im,
  mag: (a: Complex): number => Math.sqrt(C.mag2(a)),
  phase: (a: Complex): number => Math.atan2(a.im, a.re),
  eq: (a: Complex, b: Complex, eps = 1e-10): boolean =>
    Math.abs(a.re - b.re) < eps && Math.abs(a.im - b.im) < eps,
  isZero: (a: Complex, eps = 1e-10): boolean =>
    Math.abs(a.re) < eps && Math.abs(a.im) < eps,
  div: (a: Complex, b: Complex): Complex => {
    const d = C.mag2(b);
    return {
      re: (a.re * b.re + a.im * b.im) / d,
      im: (a.im * b.re - a.re * b.im) / d,
    };
  },
  neg: (a: Complex): Complex => ({ re: -a.re, im: -a.im }),
};

// --- State Vector ---
export type StateVector = Complex[];

export function numQubits(sv: StateVector): number {
  return Math.log2(sv.length);
}

export function makeZeroState(n: number): StateVector {
  const sv: StateVector = Array.from({ length: 2 ** n }, () => C.zero());
  sv[0] = C.one();
  return sv;
}

export function makeEqualSuperposition(n: number): StateVector {
  const dim = 2 ** n;
  const amp = 1 / Math.sqrt(dim);
  return Array.from({ length: dim }, () => C.of(amp, 0));
}

export function makeRandomState(n: number): StateVector {
  const dim = 2 ** n;
  const raw: StateVector = Array.from({ length: dim }, () => {
    // Generate random magnitude and random phase in [-pi, pi]
    const r = Math.random() > 0.3 ? Math.random() : 0;
    const phi = (Math.random() * 2 - 1) * Math.PI;
    return C.fromPolar(r, phi);
  });
  return normalize(raw);
}

export function evolveStatePhase(sv: StateVector, deltaT: number): StateVector {
  // Apply a dynamic phase rotation U(t) = exp(-i H t)
  // Each basis state i gets a natural phase frequency omega_i proportional to its Hamming weight
  return sv.map((c, i) => {
    const r = C.mag(c);
    if (r < 1e-6) return c;
    const currentPhi = C.phase(c);
    const weight = (i.toString(2).match(/1/g) || []).length + 1;
    const nextPhi = currentPhi + weight * deltaT;
    return C.fromPolar(r, nextPhi);
  });
}

export function normSquared(sv: StateVector): number {
  return sv.reduce((acc, c) => acc + C.mag2(c), 0);
}

export function normalize(sv: StateVector): StateVector {
  const ns = normSquared(sv);
  if (ns < 1e-15) return sv;
  const factor = 1 / Math.sqrt(ns);
  return sv.map((c) => C.scale(c, factor));
}

export function isNormalized(sv: StateVector, eps = 1e-8): boolean {
  return Math.abs(normSquared(sv) - 1) < eps;
}

// --- Basis Label ---
export function basisLabel(index: number, nQubits: number): string {
  return index.toString(2).padStart(nQubits, '0');
}

// --- Gate Matrices ---
// All gates operate on the full state vector by targeting specific qubits.
// Qubit numbering: q1 is the LEAST significant bit (rightmost).

const SQRT2_INV = 1 / Math.sqrt(2);

// Pauli X (NOT) gate
export function applyX(sv: StateVector, targetQubit: number): StateVector {
  const n = sv.length;
  const tBit = targetQubit - 1; // 0-indexed bit position
  const result: StateVector = [...sv];
  const visited = new Set<number>();

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue;
    const j = i ^ (1 << tBit); // flip the target bit
    visited.add(i);
    visited.add(j);
    result[i] = sv[j];
    result[j] = sv[i];
  }
  return result;
}

// Pauli Z gate
export function applyZ(sv: StateVector, targetQubit: number): StateVector {
  const tBit = targetQubit - 1;
  return sv.map((c, i) => {
    if ((i >> tBit) & 1) {
      return C.neg(c); // multiply by -1 if target bit is 1
    }
    return c;
  });
}

// Hadamard gate
export function applyH(sv: StateVector, targetQubit: number): StateVector {
  const n = sv.length;
  const tBit = targetQubit - 1;
  const result: StateVector = Array.from({ length: n }, () => C.zero());
  const visited = new Set<number>();

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue;
    const j = i ^ (1 << tBit);
    visited.add(i);
    visited.add(j);

    // Determine which of i, j has tBit=0 and which has tBit=1
    const i0 = (i >> tBit) & 1 ? j : i; // index with tBit=0
    const i1 = (i >> tBit) & 1 ? i : j; // index with tBit=1

    // H|0> = (|0> + |1>) / sqrt(2)
    // H|1> = (|0> - |1>) / sqrt(2)
    result[i0] = C.scale(C.add(sv[i0], sv[i1]), SQRT2_INV);
    result[i1] = C.scale(C.sub(sv[i0], sv[i1]), SQRT2_INV);
  }
  return result;
}

// CNOT gate
export function applyCNOT(
  sv: StateVector,
  controlQubit: number,
  targetQubit: number
): StateVector {
  const cBit = controlQubit - 1;
  const tBit = targetQubit - 1;
  const n = sv.length;
  const result: StateVector = [...sv];

  for (let i = 0; i < n; i++) {
    if ((i >> cBit) & 1) {
      // control qubit is 1 → flip target
      const j = i ^ (1 << tBit);
      if (i < j) {
        result[i] = sv[j];
        result[j] = sv[i];
      }
    }
  }
  return result;
}

// --- Partial Measurement ---
export interface MeasurementResult {
  prob0: number;
  prob1: number;
  stateAfter0: StateVector;
  stateAfter1: StateVector;
}

export function partialMeasurement(
  sv: StateVector,
  targetQubit: number
): MeasurementResult {
  const tBit = targetQubit - 1;
  const n = sv.length;

  let prob0 = 0;
  let prob1 = 0;

  for (let i = 0; i < n; i++) {
    const p = C.mag2(sv[i]);
    if ((i >> tBit) & 1) {
      prob1 += p;
    } else {
      prob0 += p;
    }
  }

  // Post-measurement states (projected & renormalized)
  const stateAfter0: StateVector = sv.map((c, i) =>
    (i >> tBit) & 1 ? C.zero() : c
  );
  const stateAfter1: StateVector = sv.map((c, i) =>
    (i >> tBit) & 1 ? c : C.zero()
  );

  return {
    prob0,
    prob1,
    stateAfter0: prob0 > 1e-15 ? normalize(stateAfter0) : stateAfter0,
    stateAfter1: prob1 > 1e-15 ? normalize(stateAfter1) : stateAfter1,
  };
}

// --- Separability Check ---
// Check if qubit `q` is separable from the rest by checking
// constant complex ratios across the qubit axis.
export interface EdgeRatioInfo {
  pairLabel: string;
  ratioStr: string;
}

export interface SeparabilityResult {
  qubit: number;
  isSeparable: boolean;
  ratios: EdgeRatioInfo[];
  explanation: string;
}

function formatComplexRatio(c: Complex | { re: number; im: number }): string {
  if (c.re === Infinity) return '∞ (c₀ = 0)';
  if (Math.abs(c.re) < 1e-6 && Math.abs(c.im) < 1e-6) return '0.00';
  
  const mag = Math.sqrt(c.re * c.re + c.im * c.im);
  const phi = Math.atan2(c.im, c.re);

  if (Math.abs(phi) < 0.02) return mag.toFixed(2);
  if (Math.abs(Math.abs(phi) - Math.PI) < 0.02) return `-${mag.toFixed(2)}`;
  if (Math.abs(phi - Math.PI / 2) < 0.02) return `${mag.toFixed(2)}i`;
  if (Math.abs(phi + Math.PI / 2) < 0.02) return `-${mag.toFixed(2)}i`;

  const deg = Math.round((phi * 180) / Math.PI);
  return `${mag.toFixed(2)}∠${deg}°`;
}

export function checkSeparability(
  sv: StateVector,
  targetQubit: number,
  eps = 1e-6
): SeparabilityResult {
  const tBit = targetQubit - 1;
  const n = sv.length;
  const nQ = Math.round(Math.log2(n));

  // For each pair of basis states that differ only in targetQubit,
  // check if the ratio c(bit=1) / c(bit=0) is constant.
  let refRatio: Complex | { re: number; im: number } | null = null;
  let isSeparable = true;
  const ratios: EdgeRatioInfo[] = [];

  for (let i = 0; i < n; i++) {
    if ((i >> tBit) & 1) continue; // only iterate over bit=0 states
    const j = i | (1 << tBit); // corresponding bit=1 state

    const c0 = sv[i];
    const c1 = sv[j];
    const pairLabel = `|${basisLabel(i, nQ)}⟩ → |${basisLabel(j, nQ)}⟩`;

    if (C.isZero(c0) && C.isZero(c1)) {
      ratios.push({ pairLabel, ratioStr: '0 / 0 (null)' });
      continue; // both zero, skip
    }

    if (C.isZero(c0) || C.isZero(c1)) {
      const currentRatio = C.isZero(c0) ? { re: Infinity, im: 0 } : C.zero();
      ratios.push({ pairLabel, ratioStr: formatComplexRatio(currentRatio) });

      if (refRatio === null) {
        refRatio = currentRatio;
      } else {
        if (refRatio.re === Infinity) {
          if (!C.isZero(c0)) isSeparable = false;
        } else if (C.isZero(refRatio as Complex)) {
          if (!C.isZero(c1)) isSeparable = false;
        } else {
          isSeparable = false;
        }
      }
      continue;
    }

    const ratio = C.div(c1, c0);
    ratios.push({ pairLabel, ratioStr: formatComplexRatio(ratio) });

    if (refRatio === null) {
      refRatio = ratio;
    } else if (refRatio.re === Infinity || C.isZero(refRatio as Complex)) {
      isSeparable = false;
    } else {
      if (!C.eq(ratio, refRatio as Complex, eps)) {
        isSeparable = false;
      }
    }
  }

  // Cross-verify with reduced density matrix purity
  const bloch = computeBlochVector(sv, targetQubit);
  if (!bloch.isPure) {
    isSeparable = false;
  }

  const explanation = isSeparable
    ? `All parallel-edge amplitude ratios across Qubit #${targetQubit} are equal (${ratios.filter(r => r.ratioStr !== '0 / 0 (null)')[0]?.ratioStr || 'constant'}), confirming this axis factors into an unentangled product state.`
    : `Parallel-edge amplitude ratios differ across Qubit #${targetQubit} edges (${ratios.map(r => r.ratioStr).filter(s => s !== '0 / 0 (null)').join(' vs ')}), generating phase/amplitude entanglement.`;

  return { qubit: targetQubit, isSeparable, ratios, explanation };
}

export function checkAllSeparabilities(sv: StateVector): SeparabilityResult[] {
  const nQ = numQubits(sv);
  return Array.from({ length: nQ }, (_, i) => checkSeparability(sv, i + 1));
}

// --- Bloch Vector & Reduced Density Matrix ---
export interface BlochVector {
  x: number;
  y: number;
  z: number;
  length: number;
  purity: number; // Tr(rho^2) = (1 + |r|^2)/2 in [0.5, 1.0]
  isPure: boolean;
}

export function computeBlochVector(sv: StateVector, targetQubit: number): BlochVector {
  const tBit = targetQubit - 1;
  const n = sv.length;

  // Compute 2x2 reduced density matrix rho_q = Tr_{rest}(|psi><psi|)
  let rho00 = 0;
  let rho11 = 0;
  let rho01 = C.zero();

  for (let i = 0; i < n; i++) {
    const bit = (i >> tBit) & 1;
    const mag2 = C.mag2(sv[i]);

    if (bit === 0) {
      rho00 += mag2;
      // Pair with bit=1 state having same other bits
      const pairedIdx = i | (1 << tBit);
      // rho_{01} += c_0 * conj(c_1)
      const c0 = sv[i];
      const c1 = sv[pairedIdx];
      rho01 = C.add(rho01, C.mul(c0, C.conj(c1)));
    } else {
      rho11 += mag2;
    }
  }

  // Bloch components:
  // r_x = 2 * Re(rho01)
  // r_y = -2 * Im(rho01)
  // r_z = rho00 - rho11
  const x = 2 * rho01.re;
  const y = -2 * rho01.im;
  const z = rho00 - rho11;
  const len = Math.sqrt(x * x + y * y + z * z);
  const purity = (1 + len * len) / 2;

  return {
    x: Math.abs(x) < 1e-6 ? 0 : x,
    y: Math.abs(y) < 1e-6 ? 0 : y,
    z: Math.abs(z) < 1e-6 ? 0 : z,
    length: len,
    purity,
    isPure: len > 0.999,
  };
}

// --- Pretty Formatting Helpers ---

const KNOWN_FRACTIONS: [number, string][] = [
  [1, '1'],
  [1 / Math.sqrt(2), '\\frac{1}{\\sqrt{2}}'],
  [1 / 2, '\\frac{1}{2}'],
  [1 / 3, '\\frac{1}{3}'],
  [2 / 3, '\\frac{2}{3}'],
  [1 / Math.sqrt(3), '\\frac{1}{\\sqrt{3}}'],
  [Math.sqrt(2) / Math.sqrt(3), '\\frac{\\sqrt{2}}{\\sqrt{3}}'],
  [1 / (2 * Math.sqrt(2)), '\\frac{1}{2\\sqrt{2}}'],
  [1 / Math.sqrt(5), '\\frac{1}{\\sqrt{5}}'],
  [2 / Math.sqrt(5), '\\frac{2}{\\sqrt{5}}'],
  [Math.sqrt(3) / 2, '\\frac{\\sqrt{3}}{2}'],
];

export function formatMagnitude(r: number): string {
  if (Math.abs(r) < 1e-10) return '0';
  for (const [val, tex] of KNOWN_FRACTIONS) {
    if (Math.abs(Math.abs(r) - val) < 1e-8) return tex;
  }
  return r.toFixed(4);
}

const KNOWN_PHASES: [number, string][] = [
  [0, ''],
  [Math.PI / 6, 'e^{i\\pi/6}'],
  [Math.PI / 4, 'e^{i\\pi/4}'],
  [Math.PI / 3, 'e^{i\\pi/3}'],
  [Math.PI / 2, 'e^{i\\pi/2}'],
  [2 * Math.PI / 3, 'e^{i2\\pi/3}'],
  [3 * Math.PI / 4, 'e^{i3\\pi/4}'],
  [5 * Math.PI / 6, 'e^{i5\\pi/6}'],
  [Math.PI, 'e^{i\\pi}'],
  [-Math.PI / 6, 'e^{-i\\pi/6}'],
  [-Math.PI / 4, 'e^{-i\\pi/4}'],
  [-Math.PI / 3, 'e^{-i\\pi/3}'],
  [-Math.PI / 2, 'e^{-i\\pi/2}'],
  [-2 * Math.PI / 3, 'e^{-i2\\pi/3}'],
  [-3 * Math.PI / 4, 'e^{-i3\\pi/4}'],
  [-5 * Math.PI / 6, 'e^{-i5\\pi/6}'],
];

export function formatPhase(phi: number): string {
  // Normalize to [-pi, pi]
  while (phi > Math.PI) phi -= 2 * Math.PI;
  while (phi < -Math.PI) phi += 2 * Math.PI;

  for (const [val, tex] of KNOWN_PHASES) {
    if (Math.abs(phi - val) < 1e-8) return tex;
  }
  return `e^{i \\cdot ${phi.toFixed(3)}}`;
}

export function formatAmplitude(c: Complex): string {
  const r = C.mag(c);
  if (r < 1e-10) return '0';
  const phi = C.phase(c);

  const magStr = formatMagnitude(r);
  const phaseStr = formatPhase(phi);

  // Special case: phase is exactly pi → coefficient is negative real
  if (Math.abs(Math.abs(phi) - Math.PI) < 1e-8) {
    return `-${magStr}`;
  }

  if (!phaseStr) return magStr;
  if (magStr === '1') return phaseStr;
  return `${magStr}${phaseStr}`;
}

export function formatStateKet(sv: StateVector): string {
  const nQ = numQubits(sv);
  const terms: string[] = [];

  for (let i = 0; i < sv.length; i++) {
    const c = sv[i];
    if (C.mag(c) < 1e-10) continue;
    const ampStr = formatAmplitude(c);
    const label = basisLabel(i, nQ);
    terms.push(`${ampStr}|${label}\\rangle`);
  }

  if (terms.length === 0) return '0';

  let result = terms[0];
  for (let k = 1; k < terms.length; k++) {
    if (terms[k].startsWith('-')) {
      result += ` - ${terms[k].slice(1)}`;
    } else {
      result += ` + ${terms[k]}`;
    }
  }
  return `|\\psi\\rangle = ${result}`;
}

// --- Preset States ---
export interface PresetState {
  name: string;
  shortName: string;
  nQubits: number;
  vector: StateVector;
  description: string;
}

export const PRESET_STATES: PresetState[] = [
  {
    name: 'Superposition Benchmark (2Q)',
    shortName: 'Benchmark',
    nQubits: 2,
    description:
      '|ψ⟩ = ⅓|00⟩ + ⅓·e^(iπ/2)|01⟩ + 1/√3·e^(-iπ/4)|10⟩ − ⅔|11⟩',
    vector: [
      C.of(1 / 3, 0), // |00⟩
      C.fromPolar(1 / 3, Math.PI / 2), // |01⟩
      C.fromPolar(1 / Math.sqrt(3), -Math.PI / 4), // |10⟩
      C.of(-2 / 3, 0), // |11⟩  (-2/3 is real negative)
    ],
  },
  {
    name: 'Bell State Φ⁺',
    shortName: 'Bell Φ⁺',
    nQubits: 2,
    description: '|Φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)',
    vector: [
      C.of(SQRT2_INV, 0), // |00⟩
      C.zero(), // |01⟩
      C.zero(), // |10⟩
      C.of(SQRT2_INV, 0), // |11⟩
    ],
  },
  {
    name: 'Phase-Entangled State',
    shortName: 'Phase-Entangled',
    nQubits: 2,
    description: '½(|00⟩ + |01⟩ + |10⟩ − |11⟩)',
    vector: [
      C.of(0.5, 0), // |00⟩
      C.of(0.5, 0), // |01⟩
      C.of(0.5, 0), // |10⟩
      C.of(-0.5, 0), // |11⟩
    ],
  },
  {
    name: 'GHZ State (3Q)',
    shortName: 'GHZ',
    nQubits: 3,
    description: '|GHZ⟩ = 1/√2 (|000⟩ + |111⟩)',
    vector: [
      C.of(SQRT2_INV, 0), // |000⟩
      C.zero(), // |001⟩
      C.zero(), // |010⟩
      C.zero(), // |011⟩
      C.zero(), // |100⟩
      C.zero(), // |101⟩
      C.zero(), // |110⟩
      C.of(SQRT2_INV, 0), // |111⟩
    ],
  },
  {
    name: 'Partially Separable State (3Q)',
    shortName: 'Partial Sep.',
    nQubits: 3,
    description:
      'Separable in Q1, entangled in Q2 & Q3',
    vector: [
      C.of(0.5, 0), // |000⟩
      C.fromPolar(0.5, Math.PI / 2), // |001⟩
      C.fromPolar(1 / (2 * Math.sqrt(2)), Math.PI / 2), // |010⟩
      C.of(-1 / (2 * Math.sqrt(2)), 0), // |011⟩
      C.zero(), // |100⟩
      C.zero(), // |101⟩
      C.of(-1 / (2 * Math.sqrt(2)), 0), // |110⟩
      C.fromPolar(1 / (2 * Math.sqrt(2)), -Math.PI / 2), // |111⟩
    ],
  },
];

