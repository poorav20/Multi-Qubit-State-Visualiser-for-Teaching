import type { StateVector } from '../engine/quantumMath';
import { C } from '../engine/quantumMath';

export interface QuizOption {
  id: string;
  text: string;
  latex?: string;
}

export interface QuizQuestion {
  id: number;
  title: string;
  category: string;
  nQubits: number;
  stateVector: StateVector;
  questionText: string;
  questionLatex: string;
  options: QuizOption[];
  correctOptionId: string;
  misconceptionMap: Record<string, string>;
  feedbackCorrect: string;
  feedbackByOption: Record<string, string>;
  visualCue: string;
}

const SQRT3_INV = 1 / Math.sqrt(3);
const SQRT2_3 = Math.sqrt(2) / Math.sqrt(3);

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ==========================================
  // QUESTION 1: Gauge Convention & Phase Direction
  // ==========================================
  {
    id: 1,
    title: 'Phase Gauge Convention & Direction',
    category: 'Gauge Conventions',
    nQubits: 2,
    // Paper Benchmark State
    stateVector: [
      C.of(1 / 3, 0),                                // |00>
      C.fromPolar(1 / 3, Math.PI / 2),               // |01> (+pi/2)
      C.fromPolar(SQRT3_INV, -Math.PI / 4),          // |10> (-pi/4)
      C.of(-2 / 3, 0),                               // |11> (pi or -2/3)
    ],
    questionText:
      'In the Circle Notation for state |10⟩ with amplitude (1/√3)·e^(-iπ/4), in which direction does the phase gauge pointer point?',
    questionLatex:
      '\\text{Given the term } \\frac{1}{\\sqrt{3}}e^{-i\\pi/4}|10\\rangle, \\text{ where does the phase gauge pointer point in Circle Notation?}',
    options: [
      {
        id: 'A',
        text: 'Top-Right / 1:30 position (rotated 45° clockwise from 12 o\'clock)',
      },
      {
        id: 'B',
        text: 'Top-Left / 10:30 position (rotated 45° counterclockwise from 12 o\'clock)',
      },
      {
        id: 'C',
        text: 'Bottom-Right / 4:30 position (rotated 45° clockwise from 3 o\'clock polar axis)',
      },
      {
        id: 'D',
        text: 'Straight Right / 3 o\'clock position (zero phase standard polar)',
      },
    ],
    correctOptionId: 'A',
    misconceptionMap: {
      B: 'Counterclockwise sign error: rotated CCW for a negative angle (-π/4) instead of CW.',
      C: 'Polar plane misconception: assumed 0 phase is at 3 o\'clock (standard Cartesian polar angle) instead of 12 o\'clock.',
      D: 'Zero-phase anchor error: assumed zero phase is fixed at 3 o\'clock without applying the phase angle.',
    },
    feedbackCorrect:
      'Correct! In Circle Notation, zero phase points straight UP at 12 o\'clock. Positive phase (+φ) rotates counterclockwise, so a negative phase of -π/4 rotates 45° clockwise, pointing to Top-Right (1:30).',
    feedbackByOption: {
      A: 'Spot on! 12 o\'clock is φ = 0; negative angles rotate clockwise, placing -π/4 at 1:30 (Top-Right).',
      B: 'Common mistake! In Circle Notation, positive angles (+φ) rotate counterclockwise. A negative phase (-π/4) must rotate clockwise from 12 o\'clock.',
      C: 'Standard Cartesian misconception! Unlike traditional math polar coordinates where θ=0 is at 3 o\'clock (positive x-axis), Circle Notation fixes φ=0 at 12 o\'clock (straight up).',
      D: 'This confuses standard Cartesian polar zero (3 o\'clock) with Circle Notation and ignores the -π/4 angle completely.',
    },
    visualCue:
      'Look at the Gauge Convention Helper in the top/bottom: 12:00 = 0, Left (9:00) = +π/2, and Right (1:30–3:00) = negative phases.',
  },

  // ==========================================
  // QUESTION 2: Measurement Probability (|c|² vs |c|)
  // ==========================================
  {
    id: 2,
    title: 'Measurement Probability: Area vs. Radius',
    category: 'Probability & Born Rule',
    nQubits: 2,
    stateVector: [
      C.of(1 / Math.sqrt(5), 0), // |00>: prob = 1/5 = 0.20
      C.of(2 / Math.sqrt(5), 0), // |01>: prob = 4/5 = 0.80
      C.zero(),                  // |10>: prob = 0
      C.zero(),                  // |11>: prob = 0
    ],
    questionText:
      'For the state |ψ⟩ = (1/√5)|00⟩ + (2/√5)|01⟩, compare the measurement probabilities of observing |01⟩ versus |00⟩.',
    questionLatex:
      '|\\psi\\rangle = \\frac{1}{\\sqrt{5}}|00\\rangle + \\frac{2}{\\sqrt{5}}|01\\rangle. \\quad \\text{How much more likely is measuring } |01\\rangle \\text{ than } |00\\rangle?',
    options: [
      {
        id: 'A',
        text: '2 times as likely, because the amplitude of |01⟩ is twice that of |00⟩ (2/√5 vs 1/√5)',
      },
      {
        id: 'B',
        text: '4 times as likely, because measurement probability is proportional to |c|² (circle area)',
      },
      {
        id: 'C',
        text: '√2 times as likely, by the root ratio of quantum amplitudes',
      },
      {
        id: 'D',
        text: 'Equally likely, because both states are in a coherent superposition',
      },
    ],
    correctOptionId: 'B',
    misconceptionMap: {
      A: 'Amplitude-Linear Misconception: Confusing probability P = |c|² with raw amplitude |c| (or inner radius with area).',
      C: 'Inverted square root confusion: taking the square root of the ratio instead of squaring.',
      D: 'Coherence fallacy: assuming any non-zero superposition treats states equally.',
    },
    feedbackCorrect:
      'Correct! The Born rule states P(i) = |c_i|². While the amplitude (circle radius) is 2× larger (2/√5 vs 1/√5), the measurement probability (circle area) is (2/√5)² / (1/√5)² = (4/5) / (1/5) = 4× as likely.',
    feedbackByOption: {
      A: 'This is the classic amplitude vs. probability misconception. The inner circle radius is 2× larger, but the AREA (probability) scales as r², giving 4×!',
      B: 'Excellent! The inner teal disk area directly encodes the Born rule probability |c|². Area scales quadratically with radius: (2× radius → 4× area).',
      C: 'Incorrect. Remember Born\'s rule: probabilities are the square of magnitudes, not the square root.',
      D: 'Incorrect. Superposition coefficients directly determine non-equal likelihoods.',
    },
    visualCue:
      'In Circle Notation, the area of the inner disk of |01⟩ is four times the area of |00⟩ (80% vs 20%), visually clarifying Born\'s rule.',
  },

  // ==========================================
  // QUESTION 3: Qubit Ordering & Gate Axis (X₂ vs X₁)
  // ==========================================
  {
    id: 3,
    title: 'Qubit Ordering & Gate Action (X₂)',
    category: 'Qubit Indexing & Unitaries',
    nQubits: 2,
    // Pure state |01> (q2=0, q1=1)
    stateVector: [
      C.zero(), // |00>
      C.one(),  // |01> (q2=0, q1=1)
      C.zero(), // |10>
      C.zero(), // |11>
    ],
    questionText:
      'Given the state |ψ⟩ = |01⟩ in little-endian ordering |q₂ q₁⟩ (where q₁ is the rightmost bit), what is the resulting state after applying the Pauli X₂ gate?',
    questionLatex:
      '\\text{Applying } X_2 \\text{ to } |q_2 q_1\\rangle = |01\\rangle \\text{ produces which state?}',
    options: [
      {
        id: 'A',
        text: '|11⟩ (bit flip on the leftmost qubit q₂: 0 → 1)',
        latex: '|11\\rangle',
      },
      {
        id: 'B',
        text: '|00⟩ (bit flip on the rightmost qubit q₁: 1 → 0)',
        latex: '|00\\rangle',
      },
      {
        id: 'C',
        text: '|10⟩ (both qubits swapped)',
        latex: '|10\\rangle',
      },
      {
        id: 'D',
        text: '|01⟩ (no change because control qubit is not active)',
        latex: '|01\\rangle',
      },
    ],
    correctOptionId: 'A',
    misconceptionMap: {
      B: 'Endianness inversion: mistaking q₂ for the rightmost bit (applying X₁ instead of X₂).',
      C: 'SWAP confusion: treating X₂ as a two-qubit SWAP gate.',
      D: 'Controlled-gate confusion: confusing single-qubit X₂ with CNOT₂₁ and assuming it requires a control condition.',
    },
    feedbackCorrect:
      'Correct! In the standard little-endian notation |q₂ q₁⟩, Qubit #1 is the rightmost bit and Qubit #2 is the leftmost bit. Applying X₂ flips q₂ from 0 to 1, transforming |01⟩ into |11⟩ (a vertical step down in 2-qubit DCN).',
    feedbackByOption: {
      A: 'Perfect! Qubit #2 corresponds to the first/leftmost digit in |q₂ q₁⟩. Flipping 0 → 1 yields |11⟩.',
      B: 'Qubit index confusion! Qubit #1 is the rightmost bit. Flipping that would give |00⟩, which corresponds to applying X₁, not X₂.',
      C: 'Single-qubit X only flips the designated qubit\'s bit along its axis; it does not swap both qubits.',
      D: 'X₂ is an unconditional single-qubit NOT gate, not a controlled CNOT gate.',
    },
    visualCue:
      'In DCN, Qubit #1 runs horizontally (left-right) and Qubit #2 runs vertically (top-down). Applying X₂ moves straight down from |01⟩ (Top-Right) to |11⟩ (Bottom-Right).',
  },

  // ==========================================
  // QUESTION 4: Hadamard Gate on Multi-Qubit Superpositions (H₂)
  // ==========================================
  {
    id: 4,
    title: 'Hadamard Action on Entangled Terms (H₂)',
    category: 'Multi-Qubit Superposition',
    nQubits: 2,
    // Multi-qubit superposition state with relative phase
    stateVector: [
      C.of(SQRT3_INV, 0),                           // |00>
      C.zero(),                                      // |01>
      C.zero(),                                      // |10>
      C.fromPolar(SQRT2_3, Math.PI / 4),             // |11>
    ],
    questionText:
      'Consider the state |ψ⟩ = (1/√3)|00⟩ + (√(2/3)·e^(iπ/4))|11⟩. If we apply the Hadamard gate H₂ (to Qubit #2), what happens to the two terms along the vertical Q₂ axis?',
    questionLatex:
      '|\\psi\\rangle = \\frac{1}{\\sqrt{3}}|00\\rangle + \\sqrt{\\frac{2}{3}}e^{i\\pi/4}|11\\rangle. \\quad \\text{What does } H_2|\\psi\\rangle \\text{ produce?}',
    options: [
      {
        id: 'A',
        text: 'Each basis state splits along the Q₂ axis: H₂|00⟩ = (|00⟩+|10⟩)/√2 and H₂|11⟩ = (|01⟩-|11⟩)/√2 with a π phase flip on the |11⟩ component.',
      },
      {
        id: 'B',
        text: 'The state immediately becomes an equal uniform superposition of all four basis states with identical phases.',
      },
      {
        id: 'C',
        text: 'H₂ acts on the rightmost bit, splitting |00⟩ into (|00⟩+|01⟩)/√2.',
      },
      {
        id: 'D',
        text: 'H₂ cannot act on an entangled state without first measuring it.',
      },
    ],
    correctOptionId: 'A',
    misconceptionMap: {
      B: 'Uniformity fallacy: assuming Hadamard always creates a 1/2 uniform distribution regardless of initial amplitudes or phases.',
      C: 'Qubit target confusion: applying Hadamard to Q₁ (horizontal axis) instead of Q₂ (vertical axis).',
      D: 'Measurement prerequisite fallacy: believing unitary operations cannot act on entangled states.',
    },
    feedbackCorrect:
      'Correct! By linearity, H₂ acts independently on each qubit-2 column: H₂|0,q₁⟩ = (|0,q₁⟩ + |1,q₁⟩)/√2 and H₂|1,q₁⟩ = (|0,q₁⟩ - |1,q₁⟩)/√2. The minus sign represents an essential e^(iπ) phase flip on the |11⟩ component!',
    feedbackByOption: {
      A: 'Exactly right! H₂ operates along the vertical Q₂ axis. |00⟩ splits into |00⟩ and |10⟩ with equal phases, while |11⟩ splits into |01⟩ and |11⟩ with a relative π phase shift.',
      B: 'Common misconception from the paper! Because the initial amplitudes were unequal (1/√3 vs √(2/3)) and had relative phase e^(iπ/4), the result is not uniform.',
      C: 'That would be H₁ acting on the rightmost bit (horizontal axis). H₂ acts on the leftmost bit (vertical axis).',
      D: 'Unitary gates are fully reversible linear operators that act on arbitrary entangled states without measurement.',
    },
    visualCue:
      'In DCN, H₂ splits disks vertically along columns: column q₁=0 splits between rows q₂=0 and q₂=1, and column q₁=1 does the same with a phase reversal pointer on |11⟩.',
  },

  // ==========================================
  // QUESTION 5: Post-Measurement State & Renormalization
  // ==========================================
  {
    id: 5,
    title: 'Partial Measurement & Renormalization',
    category: 'Quantum Measurement',
    nQubits: 2,
    // State: 1/2|00> + sqrt(3)/2|10>
    stateVector: [
      C.of(0.5, 0),                      // |00>: prob = 0.25
      C.zero(),                          // |01>: prob = 0
      C.of(Math.sqrt(3) / 2, 0),         // |10>: prob = 0.75
      C.zero(),                          // |11>: prob = 0
    ],
    questionText:
      'In a state with amplitudes c₀₀ = 1/2 and c₁₀ = √3/2, you measure Qubit #2 and obtain the outcome 0. What is the normalized state vector after measurement?',
    questionLatex:
      '|\\psi\\rangle = \\frac{1}{2}|00\\rangle + \\frac{\\sqrt{3}}{2}|10\\rangle. \\quad \\text{Measure } q_2 = 0. \\text{ What is the post-measurement state?}',
    options: [
      {
        id: 'A',
        text: '|00⟩ (renormalized to amplitude 1 and probability 100%)',
        latex: '|00\\rangle',
      },
      {
        id: 'B',
        text: '(1/2)|00⟩ (surviving term kept with its original amplitude without renormalization)',
        latex: '\\frac{1}{2}|00\\rangle',
      },
      {
        id: 'C',
        text: '(1/√2)(|00⟩ + |10⟩) (both states reset to equal probabilities)',
        latex: '\\frac{1}{\\sqrt{2}}(|00\\rangle + |10\\rangle)',
      },
      {
        id: 'D',
        text: 'The state is destroyed and replaced with classical bit 0',
      },
    ],
    correctOptionId: 'A',
    misconceptionMap: {
      B: 'Renormalization neglect: retaining the original pre-measurement amplitude (total probability would only be 25%).',
      C: 'Equalization error: assuming collapse creates equal probabilities among all possible states.',
      D: 'State annihilation error: confusing quantum wavefunction collapse with destruction of quantum state space.',
    },
    feedbackCorrect:
      'Correct! Since the outcome is q₂ = 0, all components with q₂ = 1 (like |10⟩) are projected out. The only surviving basis state is |00⟩. Renormalizing by 1/√P(q₂=0) = 1/√(1/4) = 2 yields amplitude (1/2)·2 = 1, so the state is |00⟩ with 100% probability.',
    feedbackByOption: {
      A: 'Correct! The state collapses to the q₂=0 subspace and renormalizes so the total probability of remaining states equals 1.',
      B: 'Students frequently forget renormalization! If the state remained (1/2)|00⟩, total probability would sum to 1/4 instead of 1.',
      C: 'Measurement projects onto the eigenspace of the measured outcome; |10⟩ has q₂=1 and cannot survive an outcome of q₂=0.',
      D: 'Partial measurement preserves the quantum state of unmeasured degrees of freedom, collapsed and renormalized.',
    },
    visualCue:
      'In Circle Notation, after measuring q₂=0, the |10⟩ circle shrinks to zero, and the |00⟩ inner disk expands to fill the entire outer circle (radius R, area 1).',
  },

  // ==========================================
  // QUESTION 6: Phase Entanglement vs. Separability
  // ==========================================
  {
    id: 6,
    title: 'Phase Entanglement & Symmetry Ratios',
    category: 'Entanglement & Separability',
    nQubits: 2,
    // Phase-entangled state: 1/2 (|00> + |01> + |10> - |11>)
    stateVector: [
      C.of(0.5, 0),  // |00>
      C.of(0.5, 0),  // |01>
      C.of(0.5, 0),  // |10>
      C.of(-0.5, 0), // |11> (phase = pi)
    ],
    questionText:
      'Consider the state |ψ⟩ = 1/2 (|00⟩ + |01⟩ + |10⟩ - |11⟩). All four basis states have identical magnitude (1/2) and measurement probability (25%). Is this state separable or entangled?',
    questionLatex:
      '|\\psi\\rangle = \\frac{1}{2}(|00\\rangle + |01\\rangle + |10\\rangle - |11\\rangle). \\quad \\text{Is this state separable or entangled?}',
    options: [
      {
        id: 'A',
        text: 'Entangled, because the ratio of amplitudes along Qubit 1 varies between rows: c₀₁/c₀₀ = +1, but c₁₁/c₁₀ = -1 (phase entanglement).',
      },
      {
        id: 'B',
        text: 'Separable, because all four inner circles have the exact same size/area (equal 25% probabilities).',
      },
      {
        id: 'C',
        text: 'Separable, because there are no imaginary "i" components in the state.',
      },
      {
        id: 'D',
        text: 'Entangled, but only if we measure Qubit 1 first to create the entanglement.',
      },
    ],
    correctOptionId: 'A',
    misconceptionMap: {
      B: 'Magnitude-Only Fallacy: Believing that equal probabilities imply product/separable state, ignoring quantum relative phases.',
      C: 'Real-number confusion: assuming entanglement requires imaginary numbers rather than a negative phase (-1 = e^(iπ)).',
      D: 'Dynamic entanglement misconception: assuming entanglement is a process that only occurs during measurement.',
    },
    feedbackCorrect:
      'Correct! This is the canonical "Phase Entangled State". Even though all magnitudes are identical (|c_i| = 1/2), checking the ratio of amplitudes across parallel edges reveals c₀₁/c₀₀ = +1 whereas c₁₁/c₁₀ = -1. Because the complex ratios are not constant across axes, the state cannot be factored into (a|0⟩+b|1⟩)⊗(c|0⟩+d|1⟩).',
    feedbackByOption: {
      A: 'Masterful! In DCN, comparing the top edge (|00⟩→|01⟩) with the bottom edge (|10⟩→|11⟩) shows the phase pointer flips direction (12:00 vs 6:00), immediately revealing phase entanglement!',
      B: 'The primary misconception identified in the research! Equal circle areas do NOT mean a state is separable. Relative phases can create maximal entanglement.',
      C: 'The factor -1 equals e^(iπ), which is a legitimate complex phase rotation of 180°!',
      D: 'Entanglement is an intrinsic static geometric property of the state vector, independent of whether an observer performs a measurement.',
    },
    visualCue:
      'Toggle "Inspect Separability Planes" in DCN: both Q1 and Q2 axes highlight in RED because the phase pointers point UP for |00⟩, |01⟩, |10⟩ but DOWN for |11⟩.',
  },
];
