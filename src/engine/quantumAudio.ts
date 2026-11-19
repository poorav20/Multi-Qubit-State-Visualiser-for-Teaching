// ============================================================================
// Quantum Audio Synthesizer (Web Audio API)
// Provides clean, subtle auditory feedback for quantum gate operations
// ============================================================================

class QuantumAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a harmonic chime for single-qubit gates
  public playGateSound(gateType: 'X' | 'Z' | 'H' | 'CNOT') {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    let freq = 440;
    if (gateType === 'X') freq = 523.25; // C5 (Bit flip)
    if (gateType === 'Z') freq = 659.25; // E5 (Phase flip)
    if (gateType === 'H') freq = 587.33; // D5 (Superposition)
    if (gateType === 'CNOT') freq = 783.99; // G5 (Entanglement)

    osc.type = gateType === 'H' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // If Hadamard, add a frequency sweep up
    if (gateType === 'H') {
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    }

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Resonant collapse sound for measurement
  public playCollapseSound() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.start(now);
    osc.stop(now + 0.28);
  }
}

export const quantumAudio = new QuantumAudioEngine();

