/** Sonidos y música originales sintetizados con Web Audio API (sin archivos externos). */

export type Sfx =
  | 'shoot'
  | 'hit'
  | 'crit'
  | 'explode'
  | 'levelup'
  | 'pickup'
  | 'coin'
  | 'chest'
  | 'transform'
  | 'beam'
  | 'hurt'
  | 'boss'
  | 'dodge'
  | 'capsule'
  | 'warning'
  | 'punch';

const MIN_GAP: Partial<Record<Sfx, number>> = { hit: 45, pickup: 35, coin: 50, shoot: 60, punch: 50 };

class AudioService {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private last = new Map<Sfx, number>();
  private sfxVolume = 0.7;
  private musicVolume = 0.35;
  private musicTimer: number | null = null;
  private nextNoteTime = 0;
  private step = 0;

  /** Debe llamarse tras un gesto del usuario (los navegadores bloquean el audio antes). */
  ensure(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain.connect(this.ctx.destination);
      this.applyVolumes();
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setVolumes(sfx: number, music: number): void {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume * 0.5;
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume * 0.25;
  }

  private tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0, out?: GainNode): void {
    const ctx = this.ctx;
    const dest = out ?? this.sfxGain;
    if (!ctx || !dest) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, freq: number, vol: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || !this.noiseBuf) return;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.2), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfxGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  play(name: Sfx): void {
    if (!this.ctx || this.sfxVolume <= 0) return;
    const now = performance.now();
    const gap = MIN_GAP[name] ?? 20;
    if (now - (this.last.get(name) ?? 0) < gap) return;
    this.last.set(name, now);
    switch (name) {
      case 'shoot': this.tone(900, 380, 0.09, 'square', 0.12); break;
      case 'punch': this.noise(0.07, 1800, 0.25); this.tone(220, 90, 0.06, 'square', 0.12); break;
      case 'hit': this.noise(0.05, 2500, 0.18); break;
      case 'crit': this.noise(0.08, 4000, 0.3); this.tone(1200, 600, 0.08, 'square', 0.12); break;
      case 'explode': this.noise(0.5, 1200, 0.5); this.tone(120, 40, 0.4, 'sawtooth', 0.25); break;
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, f, 0.14, 'square', 0.15, i * 0.08)); break;
      case 'pickup': this.tone(1300, 1800, 0.05, 'sine', 0.12); break;
      case 'coin': this.tone(1600, 1600, 0.05, 'square', 0.08); this.tone(2100, 2100, 0.08, 'square', 0.08, 0.05); break;
      case 'chest': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, f * 1.01, 0.18, 'triangle', 0.2, i * 0.07)); break;
      case 'transform': this.noise(1.0, 3000, 0.35); this.tone(110, 880, 1.0, 'sawtooth', 0.2); break;
      case 'beam': this.tone(200, 1400, 0.35, 'sawtooth', 0.15); this.noise(0.5, 2500, 0.2, 0.1); break;
      case 'hurt': this.tone(300, 80, 0.2, 'square', 0.2); break;
      case 'boss': [110, 104, 98].forEach((f, i) => this.tone(f, f, 0.35, 'sawtooth', 0.25, i * 0.3)); break;
      case 'dodge': this.tone(2000, 400, 0.12, 'sine', 0.18); break;
      case 'capsule': this.noise(0.25, 2000, 0.25); this.tone(600, 1200, 0.12, 'triangle', 0.15); break;
      case 'warning': this.tone(880, 880, 0.1, 'square', 0.12); this.tone(880, 880, 0.1, 'square', 0.12, 0.15); break;
    }
  }

  startMusic(): void {
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 100);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  /** Bucle original en La menor, 140 BPM: bajo + arpegio. */
  private scheduleMusic(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const eighth = 60 / 140 / 2;
    const bass = [110, 110, 87.3, 87.3, 98, 98, 82.4, 82.4];
    const arps = [
      [440, 523, 659, 523],
      [349, 440, 523, 440],
      [392, 494, 587, 494],
      [330, 415, 494, 415],
    ];
    while (this.nextNoteTime < ctx.currentTime + 0.3) {
      const bar = Math.floor(this.step / 8) % 8;
      const delay = this.nextNoteTime - ctx.currentTime;
      if (this.step % 2 === 0) this.tone(bass[bar], bass[bar], eighth * 1.8, 'square', 0.18, delay, this.musicGain);
      const arp = arps[Math.floor(bar / 2) % 4];
      this.tone(arp[this.step % 4] , arp[this.step % 4], eighth * 0.9, 'triangle', 0.1, delay, this.musicGain);
      this.nextNoteTime += eighth;
      this.step++;
    }
  }
}

export const audio = new AudioService();
