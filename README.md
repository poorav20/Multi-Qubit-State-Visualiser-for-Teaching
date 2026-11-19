# Multi-Qubit State Visualiser

An interactive, browser-based learning tool for exploring two- and three-qubit quantum states. The app connects state-vector notation to geometric visualisations and lets learners experiment with common gates and measurements.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## Features

- Explore preset or custom two- and three-qubit state vectors.
- Compare Dirac notation with Circle Notation and Dimensional Circle Notation.
- View states in an interactive 3D hypercube and reduced-state Bloch spheres.
- Apply single-qubit X, Z, and H gates, CNOT, and partial measurements.
- Inspect probability and phase analytics, state history, and guided quiz questions.
- Run locally in the browser; no backend or quantum hardware is required.

## Getting started

### Requirements

- Node.js 22.12 or later (or Node.js 20.19 or later)
- npm

### Install and run

```bash
git clone https://github.com/<owner>/<repository>.git
cd <repository>
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

### Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with hot reload. |
| `npm run lint` | Run Oxlint. |
| `npm run build` | Type-check and create the production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |

## Project layout

```text
src/
├── components/
│   ├── quiz/              # Diagnostic quiz UI
│   ├── sandbox/           # State editor, notation, gates, and history
│   └── visualizations/    # 2D and 3D state visualisations
├── data/                  # Quiz content
├── engine/                # Quantum state math and audio helpers
├── App.tsx                # Application state and workspace
└── main.tsx               # React entry point
```

The quantum math engine is implemented in TypeScript. React coordinates the shared state across visualisations; Three.js renders the 3D views, KaTeX formats equations, and Tailwind CSS provides styling.

## Notes

This project is an educational simulator, not a quantum-hardware interface. Its visual conventions and diagnostics are intended to support learning and should not be treated as a substitute for formal instruction or independent verification of quantum calculations.

## References

- Ainsworth, S. (2006). “DeFT: A conceptual framework for considering learning with multiple representations.” *Learning and Instruction*, 16(3), 183–198.
- Bley, J. et al. (2024). “Visualizing quantum states: A pilot study on problem solving in quantum information science education.” [arXiv:2406.16556](https://arxiv.org/abs/2406.16556).
- Nielsen, M. A. & Chuang, I. L. (2010). *Quantum Computation and Quantum Information*. Cambridge University Press.

## License

Distributed under the MIT License. See [LICENSE](./LICENSE) for details.
