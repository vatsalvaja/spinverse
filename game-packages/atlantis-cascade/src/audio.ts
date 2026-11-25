/**
 * Atlantis Cascade audio. Every sound is synthesised at runtime with the Web Audio API, so there are no audio files.
 *
 * Music is generative: a lookahead scheduler plays one bar at a time and chooses chords, arpeggio shapes, bells,
 * bubbles and the odd whale call as it goes, so the underwater theme drifts instead of looping a fixed clip.
 * Two switches (music, sound) each persist their own setting. Big wins get their own fanfare and the background
 * music ducks underneath it. Browsers only allow audio after a gesture, so nothing is audible until the player
 * touches the page; start() is safe to call early and simply waits.
 */

type Wave = OscillatorType;
interface ToneOpts {
  type?: Wave;
  gain?: number;
  at?: number;
  to?: number;
  attack?: number;
  wet?: number;
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/* D Lydian: D E F# G# A B C# */
const CHORDS: Record<string, { pad: number[]; bass: number; arp: number[] }> = {
  D: { pad: [50, 57, 61, 66], bass: 38, arp: [62, 66, 69, 73, 74, 78] },
  E: { pad: [52, 59, 66, 68], bass: 40, arp: [64, 68, 71, 76, 78, 80] },
  F: { pad: [54, 61, 64, 69], bass: 42, arp: [66, 69, 73, 76, 78, 81] },
  G: { pad: [55, 62, 66, 73], bass: 43, arp: [67, 71, 74, 78, 79, 83] },
  B: { pad: [59, 62, 66, 69], bass: 35, arp: [59, 62, 66, 69, 73, 74] },
  A: { pad: [57, 64, 68, 73], bass: 33, arp: [57, 61, 64, 69, 73, 76] },
};
const PROGRESSIONS = [
  ["D", "E", "F", "G"],
  ["D", "B", "G", "A"],
  ["G", "D", "E", "B"],
  ["D", "A", "B", "G"],
  ["F", "G", "D", "E"],
];
const BELL_SCALE = [74, 76, 78, 80, 81, 83, 85, 86];
const PENTA = [74, 76, 78, 81, 83, 86];
const ARP_SHAPES = [
  [0, 1, 2, 3, 4, 3, 2, 1],
  [0, 2, 1, 3, 2, 4, 3, 5],
  [5, 4, 3, 2, 3, 1, 2, 0],
  [0, 1, 2, 1, 3, 2, 4, 2],
  [0, 3, 1, 4, 2, 5, 3, 1],
];

const MUSIC_BASE = 1;
const MUSIC_DUCKED = 0.16;

export type CelebrateLevel = "big" | "super" | "mega" | "jackpot";

export class AtlantisAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicIn!: GainNode;
  private musicSw!: GainNode;
  private musicWetSw!: GainNode;
  private sfxIn!: GainNode;
  private sfxSw!: GainNode;
  private sfxWetSw!: GainNode;
  private celeIn!: GainNode;
  private celeSw!: GainNode;
  private celeWetSw!: GainNode;
  private convolver!: ConvolverNode;
  private noiseBuf: AudioBuffer | null = null;

  private sched: ReturnType<typeof setInterval> | null = null;
  private nextBar = 0;
  private barNo = 0;
  private prog = PROGRESSIONS[0];
  private nextWhale = 0;
  private wash: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private riser: { stop: () => void } | null = null;
  private celeTimer: ReturnType<typeof setTimeout> | null = null;
  private duckTimer: ReturnType<typeof setTimeout> | null = null;
  private mode: "normal" | "bonus" = "normal";
  private wantMusic = false;

  musicOn = true;
  soundOn = true;

  /* ------------------------------ lifecycle ------------------------------ */
  /** Creates the context. The context starts suspended until the first user gesture resumes it. */
  unlock(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.85;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 18;
      comp.ratio.value = 4;
      comp.attack.value = 0.01;
      comp.release.value = 0.3;
      this.master.connect(comp).connect(ctx.destination);

      this.convolver = ctx.createConvolver();
      this.convolver.buffer = this.makeImpulse(ctx, 3.6);
      const revOut = ctx.createGain();
      revOut.gain.value = 0.9;
      this.convolver.connect(revOut).connect(this.master);

      const bus = (dry: number, wet: number, on: boolean) => {
        const input = ctx.createGain();
        const drySw = ctx.createGain();
        const wetSend = ctx.createGain();
        const wetSw = ctx.createGain();
        wetSend.gain.value = wet;
        drySw.gain.value = on ? 1 : 0;
        wetSw.gain.value = on ? 1 : 0;
        input.gain.value = dry;
        input.connect(drySw).connect(this.master);
        input.connect(wetSend).connect(wetSw).connect(this.convolver);
        return { input, drySw, wetSw };
      };
      const m = bus(MUSIC_BASE, 0.5, this.musicOn);
      this.musicIn = m.input;
      this.musicSw = m.drySw;
      this.musicWetSw = m.wetSw;
      const s = bus(1, 0.28, this.soundOn);
      this.sfxIn = s.input;
      this.sfxSw = s.drySw;
      this.sfxWetSw = s.wetSw;
      const cs = ctx.createGain();
      cs.gain.value = this.musicOn ? 1 : 0;
      cs.connect(this.master);
      this.celeSw = cs;
      const cw = ctx.createGain();
      cw.gain.value = this.musicOn ? 1 : 0;
      cw.connect(this.convolver);
      this.celeWetSw = cw;
      this.celeIn = this.makeCeleBus();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** A fresh input for one fanfare, so cutting a fanfare short is just fading and dropping its input. */
  private makeCeleBus(): GainNode {
    const c = this.ctx as AudioContext;
    const input = c.createGain();
    const wet = c.createGain();
    wet.gain.value = 0.32;
    input.connect(this.celeSw);
    input.connect(wet).connect(this.celeWetSw);
    return input;
  }

  /** True once the browser lets sound play. */
  get running() {
    return this.ctx?.state === "running";
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const g of [this.musicSw, this.musicWetSw, this.celeSw, this.celeWetSw]) {
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(on ? 1 : 0, t, 0.25);
    }
  }

  setSound(on: boolean) {
    this.soundOn = on;
    if (!on && typeof window !== "undefined") window.speechSynthesis?.cancel();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const g of [this.sfxSw, this.sfxWetSw]) {
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(on ? 1 : 0, t, 0.05);
    }
  }

  suspend() {
    if (this.ctx?.state === "running") void this.ctx.suspend();
  }
  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume().catch(() => {});
  }

  destroy() {
    this.stopMusic();
    this.stopCelebration();
    this.riser?.stop();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    const c = this.ctx;
    this.ctx = null;
    if (c) setTimeout(() => void c.close().catch(() => {}), 1200);
  }

  /* ------------------------------ helpers ------------------------------ */
  private makeImpulse(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        lp += (Math.random() * 2 - 1 - lp) * (0.55 - t * 0.4); // darker as it decays: water swallows the highs
        d[i] = lp * Math.pow(1 - t, 2.6) * 1.6;
      }
    }
    return buf;
  }

  private noise(): AudioBuffer | null {
    const c = this.ctx;
    if (!c) return null;
    if (!this.noiseBuf) {
      const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
    }
    return this.noiseBuf;
  }

  /** One enveloped oscillator into `dest`. */
  private voice(dest: AudioNode, freq: number, dur: number, o: ToneOpts = {}): void {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + (o.at ?? 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const a = o.attack ?? 0.006;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain ?? 0.1), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private tone(freq: number, dur: number, o: ToneOpts = {}) {
    if (!this.ctx) return;
    this.voice(this.sfxIn, freq, dur, o);
  }

  private hiss(dest: AudioNode, dur: number, gain: number, from: number, to: number, at = 0, q = 0.9, type: BiquadFilterType = "bandpass") {
    const c = this.ctx;
    const nb = this.noise();
    if (!c || !nb) return;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = nb;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + Math.min(0.05, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  private burst(dur: number, gain: number, from: number, to: number, at = 0, q = 0.9, type: BiquadFilterType = "bandpass") {
    if (this.ctx) this.hiss(this.sfxIn, dur, gain, from, to, at, q, type);
  }

  /* ------------------------------ music ------------------------------ */
  async startMusic() {
    this.wantMusic = true;
    const c = this.unlock();
    if (!c || this.sched) return;
    this.nextBar = c.currentTime + 0.25;
    this.nextWhale = c.currentTime + 14;
    this.startWash();
    this.sched = setInterval(() => this.pump(), 140);
  }

  stopMusic() {
    this.wantMusic = false;
    if (this.sched) clearInterval(this.sched);
    this.sched = null;
    const w = this.wash;
    this.wash = null;
    if (w && this.ctx) {
      w.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
      setTimeout(() => {
        try {
          w.src.stop();
        } catch {}
      }, 1800);
    }
  }

  /** "bonus" tightens the tempo and adds drums and faster arpeggios. */
  setMode(mode: "normal" | "bonus") {
    this.mode = mode;
  }

  private pump() {
    const c = this.ctx;
    if (!c || !this.wantMusic) return;
    if (c.state !== "running" || !this.musicOn) {
      this.nextBar = c.currentTime + 0.25;
      return;
    }
    while (this.nextBar < c.currentTime + 1.6) {
      const beat = this.mode === "bonus" ? 0.7 : 0.96;
      this.scheduleBar(this.nextBar, beat);
      this.nextBar += beat * 4;
    }
  }

  private startWash() {
    const c = this.ctx;
    const nb = this.noise();
    if (!c || !nb || this.wash) return;
    const src = c.createBufferSource();
    src.buffer = nb;
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 340;
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.linearRampToValueAtTime(0.06, c.currentTime + 3);
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.09;
    const lg = c.createGain();
    lg.gain.value = 0.03;
    lfo.connect(lg).connect(g.gain);
    lfo.start();
    src.connect(lp).connect(g).connect(this.musicIn);
    src.start();
    this.wash = { src, gain: g };
  }

  private pad(t: number, notes: number[], len: number) {
    const c = this.ctx;
    if (!c) return;
    notes.forEach((m, i) => {
      for (const det of [-7, 7]) {
        const osc = c.createOscillator();
        osc.type = i % 2 ? "triangle" : "sawtooth";
        osc.frequency.value = mtof(m);
        osc.detune.value = det;
        const lp = c.createBiquadFilter();
        lp.type = "lowpass";
        lp.Q.value = 0.4;
        lp.frequency.setValueAtTime(500, t);
        lp.frequency.linearRampToValueAtTime(1300, t + len * 0.6);
        lp.frequency.linearRampToValueAtTime(600, t + len + 1);
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.017, t + 1.5);
        g.gain.setValueAtTime(0.017, t + len - 0.3);
        g.gain.linearRampToValueAtTime(0.0001, t + len + 1.8);
        osc.connect(lp).connect(g).connect(this.musicIn);
        osc.start(t);
        osc.stop(t + len + 2);
      }
    });
  }

  private pluck(t: number, midi: number, vel: number) {
    const c = this.ctx;
    if (!c) return;
    const f = mtof(midi);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(4200, t);
    lp.frequency.exponentialRampToValueAtTime(900, t + 1.2);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06 * vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    for (const [mul, lvl, type] of [[1, 1, "triangle"], [2, 0.32, "sine"], [3.01, 0.1, "sine"]] as [number, number, Wave][]) {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = f * mul;
      const og = c.createGain();
      og.gain.value = lvl;
      o.connect(og).connect(lp);
      o.start(t);
      o.stop(t + 1.8);
    }
    lp.connect(g).connect(this.musicIn);
  }

  private bell(t: number, midi: number, vel: number) {
    const c = this.ctx;
    if (!c) return;
    const f = mtof(midi);
    const car = c.createOscillator();
    const mod = c.createOscillator();
    const mg = c.createGain();
    const g = c.createGain();
    car.frequency.value = f;
    mod.frequency.value = f * 3.51;
    mg.gain.setValueAtTime(f * 1.6, t);
    mg.gain.exponentialRampToValueAtTime(f * 0.02, t + 2.2);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05 * vel, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
    mod.connect(mg).connect(car.frequency);
    car.connect(g).connect(this.musicIn);
    car.start(t);
    mod.start(t);
    car.stop(t + 3.5);
    mod.stop(t + 3.5);
  }

  private boom(t: number, vel: number) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(96, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.45);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2 * vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g).connect(this.musicIn);
    o.start(t);
    o.stop(t + 0.75);
  }

  private blip(t: number) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    const f = 420 + Math.random() * 700;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 2, t + 0.07);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.028, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g).connect(this.musicIn);
    o.start(t);
    o.stop(t + 0.12);
  }

  private whale(t: number) {
    const c = this.ctx;
    if (!c) return;
    const base = 95 + Math.random() * 30;
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    o.type = "sine";
    o2.type = "triangle";
    for (const [osc, mul] of [[o, 1], [o2, 1.5]] as [OscillatorNode, number][]) {
      osc.frequency.setValueAtTime(base * mul, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.7 * mul, t + 2.2);
      osc.frequency.exponentialRampToValueAtTime(base * 1.15 * mul, t + 5);
    }
    const vib = c.createOscillator();
    vib.frequency.value = 4.6;
    const vg = c.createGain();
    vg.gain.value = 3.5;
    vib.connect(vg);
    vg.connect(o.frequency);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06, t + 1.6);
    g.gain.linearRampToValueAtTime(0.0001, t + 5.2);
    const g2 = c.createGain();
    g2.gain.value = 0.45;
    o.connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(g).connect(this.musicIn);
    for (const x of [o, o2, vib]) {
      x.start(t);
      x.stop(t + 5.4);
    }
  }

  private scheduleBar(t: number, beat: number) {
    const c = this.ctx;
    if (!c) return;
    if (this.barNo % 4 === 0) this.prog = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
    const key = this.prog[this.barNo % 4];
    const ch = CHORDS[key];
    const len = beat * 4;
    const bonus = this.mode === "bonus";

    this.pad(t, ch.pad, len);

    // sub bass swell, with an octave shadow
    this.voice(this.musicIn, mtof(ch.bass), len + 0.5, { gain: 0.1, attack: len * 0.35 });
    this.voice(this.musicIn, mtof(ch.bass + 12), len, { type: "triangle", gain: 0.03, attack: len * 0.4 });

    // harp arpeggio
    const shape = ARP_SHAPES[(this.barNo + Math.floor(Math.random() * 3)) % ARP_SHAPES.length];
    const steps = bonus ? 16 : 8;
    const stepLen = len / steps;
    for (let i = 0; i < steps; i++) {
      if (!bonus && Math.random() < 0.13) continue;
      const idx = shape[i % shape.length];
      const lift = bonus && i % 2 ? 12 : 0;
      this.pluck(t + i * stepLen + (Math.random() * 0.012 - 0.004), ch.arp[idx % ch.arp.length] + lift, (i % 4 === 0 ? 1 : 0.65) * (0.8 + Math.random() * 0.3));
    }

    // glass bells from the scale
    if (Math.random() < (bonus ? 0.9 : 0.55)) {
      const n = Math.random() < 0.4 ? 2 : 1;
      for (let i = 0; i < n; i++) this.bell(t + beat * (0.5 + Math.floor(Math.random() * 6) * 0.5), (bonus ? PENTA : BELL_SCALE)[Math.floor(Math.random() * (bonus ? PENTA.length : BELL_SCALE.length))], 0.7 + Math.random() * 0.4);
    }

    // drums: a deep pulse, a quicker one in bonus
    this.boom(t, 1);
    if (bonus) {
      this.boom(t + beat * 2, 0.8);
      this.boom(t + beat * 3.5, 0.5);
      for (let i = 0; i < 8; i++) this.hiss(this.musicIn, 0.06, i % 2 ? 0.05 : 0.025, 7000, 5000, i * beat * 0.5 + 0, 0.6, "highpass");
    } else if (this.barNo % 2) {
      this.boom(t + beat * 2.5, 0.4);
    }

    // living water
    const blips = Math.floor(Math.random() * 4);
    for (let i = 0; i < blips; i++) this.blip(t + Math.random() * len);
    if (t > this.nextWhale) {
      this.whale(t + 0.4);
      this.nextWhale = t + 28 + Math.random() * 22;
    }
    this.barNo++;
  }

  /** Pull the background music down for `seconds`, then bring it back. */
  duck(seconds: number) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const g = this.musicIn.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(MUSIC_DUCKED, t, 0.12);
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      if (!this.ctx) return;
      const n = this.ctx.currentTime;
      this.musicIn.gain.cancelScheduledValues(n);
      this.musicIn.gain.setTargetAtTime(MUSIC_BASE, n, 0.7);
    }, seconds * 1000);
  }

  /* ------------------------------ sound effects ------------------------------ */
  click() {
    this.tone(540, 0.07, { type: "sine", gain: 0.08, to: 900 });
    this.burst(0.03, 0.03, 4000, 3000, 0, 0.6, "highpass");
  }

  /** The old symbols are swept away and the new ones rain down. */
  spinStart() {
    if (!this.ctx) return;
    this.burst(0.7, 0.2, 180, 1500, 0, 0.8);
    this.tone(120, 0.6, { type: "sine", gain: 0.1, to: 260 });
    for (let i = 0; i < 6; i++) this.tone(700 + Math.random() * 600, 0.08, { gain: 0.03, at: 0.1 + i * 0.08, to: 1600 });
  }

  land(col: number) {
    this.tone(190 - col * 7, 0.2, { gain: 0.15, to: 70 });
    this.burst(0.14, 0.07, 900, 260, 0, 0.7, "lowpass");
    this.tone(1250 + col * 90, 0.06, { type: "triangle", gain: 0.022 });
  }

  scatterLand(n: number) {
    const notes = [880, 1109, 1319, 1760, 2093, 2637];
    const f = notes[Math.min(n, notes.length - 1)];
    this.tone(f, 0.9, { type: "triangle", gain: 0.1 });
    this.tone(f * 1.003, 0.9, { type: "sine", gain: 0.07 });
    this.tone(f * 2, 0.7, { type: "sine", gain: 0.03, at: 0.04 });
    this.burst(0.5, 0.04, 4000, 9000);
  }

  /** A rising shimmer while the last scatter is still in doubt. Returns when done; stop() cuts it short. */
  anticipate(seconds: number) {
    const c = this.ctx;
    if (!c) return;
    this.riser?.stop();
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(1100, t + seconds);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(300, t);
    lp.frequency.exponentialRampToValueAtTime(4200, t + seconds);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06, t + seconds * 0.9);
    g.gain.linearRampToValueAtTime(0.0001, t + seconds + 0.2);
    const trem = c.createOscillator();
    trem.frequency.setValueAtTime(5, t);
    trem.frequency.linearRampToValueAtTime(18, t + seconds);
    const tg = c.createGain();
    tg.gain.value = 0.03;
    trem.connect(tg).connect(g.gain);
    o.connect(lp).connect(g).connect(this.sfxIn);
    o.start(t);
    trem.start(t);
    o.stop(t + seconds + 0.3);
    trem.stop(t + seconds + 0.3);
    this.hiss(this.sfxIn, seconds, 0.07, 800, 7000, 0, 1.2);
    this.riser = {
      stop: () => {
        g.gain.cancelScheduledValues(c.currentTime);
        g.gain.setTargetAtTime(0.0001, c.currentTime, 0.04);
        this.riser = null;
      },
    };
  }
  stopAnticipation() {
    this.riser?.stop();
  }

  /** A glassy note that climbs as a cluster is lit up. */
  highlight(i: number) {
    const f = [659, 740, 880, 988, 1109, 1319][i % 6];
    this.tone(f, 0.55, { gain: 0.09 });
    this.tone(f * 2, 0.4, { type: "triangle", gain: 0.03, at: 0.03 });
  }

  /** Symbols burst into bubbles. Pitch climbs with every cascade so a chain feels like it is building. */
  pop(step: number, size: number) {
    if (!this.ctx) return;
    this.burst(0.16, 0.13, 2200, 700, 0, 0.9);
    const n = Math.min(10, 3 + Math.floor(size / 2));
    for (let i = 0; i < n; i++) {
      const f = 500 + Math.random() * 1100;
      this.tone(f, 0.08, { gain: 0.05, at: Math.random() * 0.26, to: f * 1.9 });
    }
    const base = 523.25 * Math.pow(1.0595, Math.min(24, step * 2));
    this.tone(base, 1, { gain: 0.11 });
    this.tone(base * 2.005, 0.7, { type: "triangle", gain: 0.04, at: 0.02 });
    this.tone(base * 1.5, 0.8, { gain: 0.04, at: 0.07 });
  }

  /** The cascade multiplier ticks up. */
  multiplier(m: number) {
    this.burst(0.4, 0.1, 300, 3200, 0, 0.8);
    this.tone(220, 0.4, { type: "triangle", gain: 0.08, to: 440 + m * 40 });
    if (m >= 3) {
      for (const [mul, lvl, dur] of [[1, 0.1, 2], [2.76, 0.05, 1.4], [5.4, 0.025, 0.9]] as [number, number, number][]) this.tone(98 * mul, dur, { gain: lvl, at: 0.12 });
    }
  }

  tally() {
    this.tone(1318, 0.25, { gain: 0.07 });
    this.tone(1760, 0.3, { gain: 0.05, at: 0.07 });
    this.tone(2349, 0.4, { gain: 0.04, at: 0.14 });
  }

  tick() {
    this.tone(2200 + Math.random() * 500, 0.03, { type: "triangle", gain: 0.018 });
  }

  /** Pearls and coins pattering down. */
  pearls(n = 8, spread = 0.8) {
    for (let i = 0; i < n; i++) {
      const at = Math.random() * spread;
      const f = 2000 + Math.random() * 2400;
      this.tone(f, 0.2, { gain: 0.04, at });
      this.tone(f * 1.505, 0.15, { gain: 0.025, at });
    }
  }

  impact(strength: number) {
    this.tone(78, 0.6, { gain: 0.14 + strength * 0.06, to: 30 });
    this.burst(0.3, 0.05 + strength * 0.03, 260, 55, 0, 0.7, "lowpass");
  }

  rumble(seconds: number, strength: number) {
    const c = this.ctx;
    const nb = this.noise();
    if (!c || !nb) return;
    const t = c.currentTime;
    const end = t + Math.max(1.4, seconds);
    const src = c.createBufferSource();
    src.buffer = nb;
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 130;
    const g = c.createGain();
    const lvl = 0.1 + strength * 0.04;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(lvl, t + 0.2);
    g.gain.setValueAtTime(lvl, end - 0.8);
    g.gain.linearRampToValueAtTime(0.0001, end);
    src.connect(lp).connect(g).connect(this.sfxIn);
    src.start(t);
    src.stop(end + 0.1);
    this.tone(40, end - t, { gain: 0.08 + strength * 0.03, attack: 0.3 });
  }

  /** Free spins: the portal opens. */
  bonus() {
    if (!this.ctx) return;
    this.duck(6);
    this.impact(3);
    for (const [mul, lvl, dur] of [[1, 0.16, 3.4], [2.76, 0.08, 2.4], [5.4, 0.04, 1.6], [8.9, 0.02, 1]] as [number, number, number][]) this.tone(73.4 * mul, dur, { gain: lvl });
    this.hiss(this.sfxIn, 2.6, 0.14, 120, 5200, 0.1, 0.9);
    // choir swell on a D major lift
    this.choir([293.66, 369.99, 440, 587.33], 4.2, 0.9);
    [0, 0.18, 0.36, 0.54, 0.72, 0.9].forEach((at, i) => this.tone(587.33 * Math.pow(1.122, i), 1.4, { type: "triangle", gain: 0.07, at: 0.6 + at }));
  }

  portal() {
    if (!this.ctx) return;
    this.hiss(this.sfxIn, 2.2, 0.16, 3600, 160, 0, 1.4);
    this.tone(660, 2, { type: "sawtooth", gain: 0.04, to: 90 });
    this.tone(990, 2, { type: "triangle", gain: 0.03, to: 130 });
  }

  /** Soft vowel-like voices, for awe. */
  choir(freqs: number[], seconds: number, level = 1) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    freqs.forEach((f, i) => {
      for (const det of [-9, 9]) {
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.detune.value = det;
        const f1 = c.createBiquadFilter();
        f1.type = "bandpass";
        f1.frequency.value = 800;
        f1.Q.value = 4;
        const f2 = c.createBiquadFilter();
        f2.type = "bandpass";
        f2.frequency.value = 1250;
        f2.Q.value = 5;
        const mix = c.createGain();
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.045 * level, t + seconds * 0.4);
        g.gain.linearRampToValueAtTime(0.0001, t + seconds);
        mix.gain.value = 1;
        o.connect(f1).connect(mix);
        o.connect(f2).connect(mix);
        mix.connect(g).connect(this.celeIn);
        o.start(t + i * 0.03);
        o.stop(t + seconds + 0.1);
      }
    });
  }

  /* ------------------------------ celebration ------------------------------ */
  /** Triumphant fanfare, longer for bigger wins. Returns its length in seconds. */
  celebrate(level: CelebrateLevel): number {
    const c = this.ctx;
    if (!c) return 0;
    if (this.celeTimer) this.stopCelebration();
    const bars = { big: 3, super: 4, mega: 5, jackpot: 6 }[level];
    const beat = level === "jackpot" ? 0.46 : 0.5;
    const len = bars * beat * 4 + 1.6;
    this.duck(len + 0.6);
    const t0 = c.currentTime + 0.05;
    const roots = [62, 69, 59, 67]; // D A B G (major-flavoured for triumph)
    const triads: number[][] = [[0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7]];
    for (let b = 0; b < bars; b++) {
      const lift = level !== "big" && b >= Math.floor(bars / 2) ? 2 : 0;
      const root = roots[b % 4] + lift;
      const bt = t0 + b * beat * 4;
      // brass-ish stabs
      [0, 1.5, 2, 3].forEach((q, qi) => {
        const at = bt + q * beat;
        triads[b % 4].forEach((iv) => this.brass(at, root + iv, beat * (qi === 3 ? 1.9 : 0.8)));
      });
      // strings pad
      triads[b % 4].forEach((iv) => this.stringNote(bt, root - 12 + iv, beat * 4));
      // timpani
      this.timpani(bt, 1);
      this.timpani(bt + beat * 2, 0.8);
      if (level === "mega" || level === "jackpot") {
        this.timpani(bt + beat * 3, 0.7);
        this.timpani(bt + beat * 3.5, 0.6);
      }
      // sparkling run
      for (let i = 0; i < 8; i++) {
        const sc = [0, 2, 4, 7, 9, 12, 14, 16][i];
        this.sparkle(bt + i * beat * 0.5, root + 12 + sc, 0.6 + 0.04 * i);
      }
    }
    // final chord + crash
    const end = t0 + bars * beat * 4;
    [0, 4, 7, 12].forEach((iv) => this.brass(end, roots[0] + (bars >= 6 ? 2 : 0) + iv, 1.5));
    this.hiss(this.celeIn, 1.8, 0.2, 9000, 3000, end - c.currentTime, 0.5, "highpass");
    this.tone(98, 3, { gain: 0.14 });
    if (level !== "big") this.pearls(14 + bars * 3, bars * beat * 3);
    this.celeTimer = setTimeout(() => {
      this.celeTimer = null;
    }, len * 1000);
    return len;
  }

  stopCelebration() {
    const c = this.ctx;
    if (!c) return;
    if (this.celeTimer) clearTimeout(this.celeTimer);
    this.celeTimer = null;
    // everything scheduled for the fanfare feeds celeIn: fade it out, drop it, and open a fresh one
    const old = this.celeIn;
    old.gain.cancelScheduledValues(c.currentTime);
    old.gain.setTargetAtTime(0.0001, c.currentTime, 0.3);
    setTimeout(() => {
      try {
        old.disconnect();
      } catch {}
    }, 2200);
    // bring the background music back up
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.duckTimer = null;
    this.musicIn.gain.cancelScheduledValues(c.currentTime);
    this.musicIn.gain.setTargetAtTime(MUSIC_BASE, c.currentTime + 0.3, 0.8);
    this.celeIn = this.makeCeleBus();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  private brass(t: number, midi: number, dur: number) {
    const c = this.ctx;
    if (!c) return;
    const f = mtof(midi);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 1;
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.linearRampToValueAtTime(2600, t + 0.09);
    lp.frequency.linearRampToValueAtTime(1100, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.034, t + 0.04);
    g.gain.setValueAtTime(0.03, t + Math.max(0.05, dur - 0.12));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.1);
    for (const det of [-8, 8]) {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.15);
    }
    lp.connect(g).connect(this.celeIn);
  }

  private stringNote(t: number, midi: number, dur: number) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = mtof(midi);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1100;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.02, t + 0.5);
    g.gain.setValueAtTime(0.02, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4);
    o.connect(lp).connect(g).connect(this.celeIn);
    o.start(t);
    o.stop(t + dur + 0.5);
  }

  private timpani(t: number, vel: number) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(62, t + 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2 * vel, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(g).connect(this.celeIn);
    o.start(t);
    o.stop(t + 0.85);
    this.hiss(this.celeIn, 0.1, 0.06 * vel, 1800, 500, t - c.currentTime, 0.8);
  }

  private sparkle(t: number, midi: number, vel: number) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = mtof(midi);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03 * vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(this.celeIn);
    o.start(t);
    o.stop(t + 0.55);
  }

  /** Announcer line. Uses the browser's speech voice when there is one; the choir swell covers when there is not. */
  say(text: string) {
    if (!this.soundOn || typeof window === "undefined") return;
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.78;
      u.pitch = 0.5;
      u.volume = 0.9;
      const voices = synth.getVoices();
      const pick = voices.find((v) => /david|daniel|male|alex|fred|mark|google uk english male/i.test(v.name) && v.lang.startsWith("en")) ?? voices.find((v) => v.lang.startsWith("en"));
      if (pick) u.voice = pick;
      synth.speak(u);
    } catch {}
  }
}
