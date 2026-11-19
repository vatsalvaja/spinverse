/**
 * TIGER CLASH audio engine (Web Audio, no sample files).
 *
 *   music : generative dark-fantasy battle bed (war drums, brass/choir pad, modal ostinato, distant gong)
 *   sfx   : every event has its own synthesized sound; roars, fire, victories and defeats are tracked as "voices"
 *           so a repeat call fades the previous one out and rounds never pile up on each other.
 * The context is created lazily and resumed from user gestures. Nothing here throws when audio is unavailable.
 */

type Side = "tiger" | "dragon";
type Family = "ui" | "tigerRoar" | "dragonRoar" | "fire" | "lightning" | "victory" | "defeat" | "announce" | "tie" | "fx";
type Src = OscillatorNode | AudioBufferSourceNode;
type Pts = [number, number][];

interface Voice {
  family: Family;
  out: GainNode;
  srcs: Src[];
  end: number;
}

interface RoarOpts {
  dur: number;
  attack: number;
  hold: number;
  peak: number;
  f: Pts;
  saws: number;
  spread: number;
  vib: number;
  formants: { f: Pts; q: number; g: number }[];
  amRate: number;
  amDepth: number;
  noiseF: number;
  noiseG: number;
  sub: number;
}

const MUSIC_LEVEL = 0.22;
const STEP = 60 / 90 / 4; // 16th note at 90 bpm
const MAX_VOICES = 28;
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** chord roots in semitones above D2, two bars each, four chords per 8-bar section */
const PROGS: number[][] = [
  [0, 1, 0, -2],
  [0, -4, -2, 1],
  [0, 3, 1, -2],
  [0, 0, -4, 1],
];
const SECTION_ORDER = [0, 1, 0, 2, 3, 1, 2, 3, 0, 3, 1, 2];
const SCALE = [0, 1, 3, 5, 7, 8, 10, 12, 13, 15]; // phrygian, with a couple of upper notes
const PATTERNS: number[][] = [
  [0, -1, -1, 2, -1, -1, 3, -1, 0, -1, -1, 2, -1, 4, -1, -1],
  [0, -1, 1, -1, 0, -1, -1, 3, -1, 2, -1, -1, 1, -1, 0, -1],
  [0, -1, -1, 0, 2, -1, -1, 3, -1, -1, 5, -1, 4, -1, 3, -1],
  [0, 1, -1, -1, 3, -1, 2, -1, 0, -1, -1, 5, -1, 3, -1, 2],
];

export class TigerClashAudio {
  musicOn = true;
  soundOn = true;
  onStateChange?: () => void;

  private ctx: AudioContext | null = null;
  private destroyed = false;
  private musicBus: GainNode | null = null;
  private musicDuck: GainNode | null = null;
  private musicIn: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private revShort: ConvolverNode | null = null;
  private revLong: ConvolverNode | null = null;
  private musicRev: ConvolverNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private voices: Voice[] = [];

  private musicRequested = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private dipTimer: ReturnType<typeof setTimeout> | null = null;
  private nextTime = 0;
  private stepIdx = 0;
  private energy = 0.25;
  private energyTarget = 0.25;

  get running(): boolean {
    return !!this.ctx && this.ctx.state === "running";
  }

  /* ------------------------------ context ------------------------------ */
  unlock(): void {
    if (this.destroyed || typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      let c: AudioContext;
      try {
        c = new AC();
      } catch {
        return;
      }
      this.ctx = c;
      const master = c.createGain();
      master.gain.value = 0.9;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 18;
      comp.ratio.value = 5;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      master.connect(comp);
      comp.connect(c.destination);

      this.musicBus = c.createGain();
      this.musicBus.gain.value = this.musicOn ? MUSIC_LEVEL : 0;
      this.musicBus.connect(master);
      this.musicDuck = c.createGain();
      this.musicDuck.connect(this.musicBus);
      this.musicIn = c.createGain();
      this.musicIn.connect(this.musicDuck);
      this.musicRev = c.createConvolver();
      this.musicRev.buffer = this.makeIR(c, 1.8, 2.8);
      this.musicRev.connect(this.musicIn);

      this.sfxBus = c.createGain();
      this.sfxBus.gain.value = this.soundOn ? 1 : 0;
      this.sfxBus.connect(master);
      this.buildReverbs(c);

      const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = nb;

      c.onstatechange = () => {
        this.onStateChange?.();
        if (c.state === "running" && this.musicRequested) this.startMusic();
      };
    }
    const c = this.ctx;
    if (c && c.state === "suspended") void c.resume().catch(() => {});
  }

  private makeIR(c: AudioContext, secs: number, decay: number): AudioBuffer {
    const len = Math.floor(c.sampleRate * secs);
    const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  private buildReverbs(c: AudioContext) {
    this.revShort?.disconnect();
    this.revLong?.disconnect();
    this.revShort = c.createConvolver();
    this.revShort.buffer = this.makeIR(c, 1.2, 3);
    this.revShort.connect(this.sfxBus!);
    this.revLong = c.createConvolver();
    this.revLong.buffer = this.makeIR(c, 3.2, 2.4);
    this.revLong.connect(this.sfxBus!);
  }

  suspend() {
    if (this.ctx?.state === "running") void this.ctx.suspend().catch(() => {});
  }
  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume().catch(() => {});
  }

  destroy() {
    this.destroyed = true;
    if (this.timer) clearInterval(this.timer);
    if (this.dipTimer) clearTimeout(this.dipTimer);
    this.timer = null;
    this.dipTimer = null;
    this.voices.forEach((v) => this.stopSrcs(v, 0));
    this.voices = [];
    const c = this.ctx;
    this.ctx = null;
    this.onStateChange = undefined;
    if (c) {
      c.onstatechange = null;
      void c.close().catch(() => {});
    }
  }

  /* ------------------------------ switches ------------------------------ */
  setMusic(on: boolean) {
    this.musicOn = on;
    const c = this.ctx;
    if (c && this.musicBus) {
      const t = c.currentTime;
      this.musicBus.gain.cancelScheduledValues(t);
      this.musicBus.gain.setTargetAtTime(on ? MUSIC_LEVEL : 0, t, on ? 0.2 : 0.04);
    }
    if (on) this.startMusic();
    else if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  setSound(on: boolean) {
    this.soundOn = on;
    if (!on) this.stopAllSfx();
    this.applySfxGain();
  }

  private applySfxGain() {
    const c = this.ctx;
    if (!c || !this.sfxBus) return;
    const t = c.currentTime;
    this.sfxBus.gain.cancelScheduledValues(t);
    this.sfxBus.gain.setTargetAtTime(this.soundOn ? 1 : 0, t, 0.01);
  }

  /** Hard-stop every sound effect, including reverb tails, so nothing from an earlier round can bleed into the next. */
  stopAllSfx() {
    const c = this.ctx;
    this.voices.forEach((v) => this.killVoice(v, 0.03));
    this.voices = [];
    if (!c || !this.sfxBus) return;
    const t = c.currentTime;
    this.sfxBus.gain.cancelScheduledValues(t);
    this.sfxBus.gain.setValueAtTime(this.sfxBus.gain.value, t);
    this.sfxBus.gain.linearRampToValueAtTime(0, t + 0.03);
    this.buildReverbs(c);
    if (this.dipTimer) clearTimeout(this.dipTimer);
    this.dipTimer = setTimeout(() => this.applySfxGain(), 120);
  }

  setMusicEnergy(level: number) {
    this.energyTarget = Math.min(1, Math.max(0, level));
  }

  duck(seconds: number) {
    const c = this.ctx;
    if (!c || !this.musicDuck) return;
    const t = c.currentTime;
    const g = this.musicDuck.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.3, t, 0.05);
    g.setTargetAtTime(1, t + Math.max(0.2, seconds), 0.4);
  }

  /* ------------------------------ voices ------------------------------ */
  private sfx(): AudioContext | null {
    const c = this.ctx;
    if (!c || !this.soundOn || !this.sfxBus || c.state === "closed") return null;
    return c;
  }

  private voice(family: Family, dur: number): Voice | null {
    const c = this.sfx();
    if (!c || !this.sfxBus) return null;
    if (family !== "ui" && family !== "fx") this.killFamily(family, 0.15);
    this.prune(c.currentTime);
    while (this.voices.length >= MAX_VOICES) {
      const old = this.voices.shift();
      if (old) this.killVoice(old, 0.05);
    }
    const out = c.createGain();
    out.gain.value = 1;
    out.connect(this.sfxBus);
    const v: Voice = { family, out, srcs: [], end: c.currentTime + dur + 0.2 };
    this.voices.push(v);
    return v;
  }

  private prune(now: number) {
    this.voices = this.voices.filter((v) => v.end > now);
  }

  private killFamily(family: Family, fade: number) {
    const keep: Voice[] = [];
    for (const v of this.voices) {
      if (v.family === family) this.killVoice(v, fade);
      else keep.push(v);
    }
    this.voices = keep;
  }

  private killVoice(v: Voice, fade: number) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    try {
      v.out.gain.cancelScheduledValues(t);
      v.out.gain.setValueAtTime(v.out.gain.value, t);
      v.out.gain.linearRampToValueAtTime(0, t + fade);
    } catch {}
    this.stopSrcs(v, fade + 0.03);
  }

  private stopSrcs(v: Voice, after: number) {
    const t = (this.ctx?.currentTime ?? 0) + after;
    v.srcs.forEach((s) => {
      try {
        s.stop(t);
      } catch {}
    });
  }

  private send(v: Voice, amount: number, long = false) {
    const c = this.ctx;
    const rev = long ? this.revLong : this.revShort;
    if (!c || !rev) return;
    const g = c.createGain();
    g.gain.value = amount;
    v.out.connect(g);
    g.connect(rev);
  }

  /* ------------------------------ primitives ------------------------------ */
  private ramp(p: AudioParam, t: number, pts: Pts) {
    p.setValueAtTime(pts[0][1], t + pts[0][0]);
    for (let i = 1; i < pts.length; i++) p.exponentialRampToValueAtTime(Math.max(0.0001, pts[i][1]), t + pts[i][0]);
  }

  private osc(v: Voice, type: OscillatorType, t: number, dur: number, f0: number, f1: number | undefined, dest: AudioNode, detune = 0): OscillatorNode {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== undefined && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    o.detune.value = detune;
    o.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
    v.srcs.push(o);
    return o;
  }

  private noise(v: Voice, t: number, dur: number, dest: AudioNode): AudioBufferSourceNode {
    const c = this.ctx!;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    s.connect(dest);
    s.start(t, Math.random() * 1.4);
    s.stop(t + dur + 0.05);
    v.srcs.push(s);
    return s;
  }

  private filter(type: BiquadFilterType, f: number, q = 1): BiquadFilterNode {
    const b = this.ctx!.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  }

  /** attack / hold / exponential decay envelope into a fresh gain node */
  private env(t: number, peak: number, attack: number, hold: number, decay: number, dest: AudioNode): GainNode {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(0.002, attack));
    g.gain.setValueAtTime(Math.max(0.0002, peak), t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + decay);
    g.connect(dest);
    return g;
  }

  /** a noise burst through a (swept) filter */
  private burst(v: Voice, t: number, dur: number, g: number, type: BiquadFilterType, f0: number, f1: number, q = 1, attack = 0.004) {
    const f = this.filter(type, f0, q);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const e = this.env(t, g, attack, 0, Math.max(0.01, dur - attack), v.out);
    f.connect(e);
    this.noise(v, t, dur, f);
  }

  private brass(v: Voice, t: number, f: number, dur: number, g: number, lp0: number, lp1: number, attack = 0.03) {
    const lp = this.filter("lowpass", lp0, 0.8);
    lp.frequency.setValueAtTime(lp0, t);
    lp.frequency.exponentialRampToValueAtTime(lp1, t + dur * 0.6);
    const e = this.env(t, g, attack, Math.max(0, dur - attack - 0.25), 0.25, v.out);
    lp.connect(e);
    this.osc(v, "sawtooth", t, dur, f, undefined, lp, -7);
    this.osc(v, "sawtooth", t, dur, f, undefined, lp, 7);
    this.osc(v, "square", t, dur, f / 2, undefined, lp);
  }

  private bell(v: Voice, t: number, f: number, g: number, dur = 1.6) {
    [1, 2.76, 5.4].forEach((r, i) => {
      const e = this.env(t, g / (i + 1), 0.004, 0, dur / (1 + i * 0.6), v.out);
      this.osc(v, "sine", t, dur, f * r, undefined, e);
    });
  }

  private tomSfx(v: Voice, t: number, f: number, g: number) {
    const e = this.env(t, g, 0.004, 0, 0.35, v.out);
    this.osc(v, "sine", t, 0.4, f, f * 0.5, e);
    this.burst(v, t, 0.09, g * 0.5, "lowpass", 500, 200);
  }

  /** the shared body of both roars: detuned saws through moving formants, growl AM, vibrato, rasp */
  private roarCore(v: Voice, t: number, o: RoarOpts) {
    const c = this.ctx!;
    const mix = c.createGain();
    const am = c.createGain();
    am.gain.value = 1 - o.amDepth;
    const lfo = c.createOscillator();
    lfo.frequency.value = o.amRate;
    const lg = c.createGain();
    lg.gain.value = o.amDepth;
    lfo.connect(lg);
    lg.connect(am.gain);
    lfo.start(t);
    lfo.stop(t + o.dur + 0.1);
    v.srcs.push(lfo);
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(o.peak, t + o.attack);
    env.gain.setValueAtTime(o.peak, t + o.attack + o.hold);
    env.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    mix.connect(am);
    am.connect(env);
    env.connect(v.out);

    const voiced = c.createGain();
    voiced.gain.value = 1 / Math.sqrt(o.saws);
    const vibLfo = c.createOscillator();
    vibLfo.frequency.value = 5.6;
    const vibG = c.createGain();
    vibG.gain.value = o.vib;
    vibLfo.connect(vibG);
    vibLfo.start(t);
    vibLfo.stop(t + o.dur + 0.1);
    v.srcs.push(vibLfo);
    for (let i = 0; i < o.saws; i++) {
      const s = c.createOscillator();
      s.type = "sawtooth";
      s.detune.value = (i - (o.saws - 1) / 2) * o.spread;
      this.ramp(s.frequency, t, o.f);
      vibG.connect(s.detune);
      s.connect(voiced);
      s.start(t);
      s.stop(t + o.dur + 0.05);
      v.srcs.push(s);
    }
    for (const fm of o.formants) {
      const bp = this.filter("bandpass", fm.f[0][1], fm.q);
      this.ramp(bp.frequency, t, fm.f);
      const g = c.createGain();
      g.gain.value = fm.g;
      voiced.connect(bp);
      bp.connect(g);
      g.connect(mix);
    }
    if (o.sub > 0) {
      const sg = c.createGain();
      sg.gain.value = o.sub;
      const so = c.createOscillator();
      so.type = "sine";
      this.ramp(so.frequency, t, o.f.map(([a, b]) => [a, b * 0.5] as [number, number]));
      so.connect(sg);
      sg.connect(mix);
      so.start(t);
      so.stop(t + o.dur + 0.05);
      v.srcs.push(so);
    }
    const nf = this.filter("bandpass", o.noiseF, 0.8);
    const ng = this.env(t, o.noiseG, o.attack, o.hold, o.dur - o.attack - o.hold, mix);
    nf.connect(ng);
    this.noise(v, t, o.dur, nf);
  }

  private start(): number {
    return (this.ctx?.currentTime ?? 0) + 0.015;
  }

  /* ------------------------------ interface sounds ------------------------------ */
  click() {
    const v = this.voice("ui", 0.1);
    if (!v) return;
    const t = this.start();
    const e = this.env(t, 0.16, 0.002, 0, 0.05, v.out);
    this.osc(v, "triangle", t, 0.06, 760, 520, e);
  }

  chip() {
    const v = this.voice("ui", 0.4);
    if (!v) return;
    const t = this.start();
    this.burst(v, t, 0.03, 0.5, "highpass", 4200, 4200, 0.7, 0.001);
    this.burst(v, t + 0.035, 0.03, 0.4, "highpass", 5200, 5200, 0.7, 0.001);
    const th = this.env(t, 0.3, 0.003, 0, 0.1, v.out);
    this.osc(v, "sine", t, 0.12, 320, 170, th);
    const ring = this.env(t + 0.012, 0.09, 0.002, 0, 0.22, v.out);
    this.osc(v, "sine", t + 0.012, 0.25, 2350, undefined, ring);
    this.send(v, 0.12);
  }

  select(side: Side | "tie") {
    if (side === "tiger" || side === "tie") this.selectTiger(side === "tie" ? 0.6 : 1);
    if (side === "dragon" || side === "tie") this.selectDragon(side === "tie" ? 0.6 : 1);
  }

  private selectTiger(k: number) {
    const v = this.voice("ui", 0.6);
    if (!v) return;
    const t = this.start();
    const lp = this.filter("lowpass", 800, 1.2);
    const e = this.env(t, 0.3 * k, 0.02, 0.05, 0.3, v.out);
    lp.connect(e);
    this.osc(v, "sawtooth", t, 0.4, 118, 84, lp);
    this.osc(v, "square", t, 0.4, 59, 42, lp);
    const gr = this.ctx!.createOscillator();
    gr.frequency.value = 34;
    const gg = this.ctx!.createGain();
    gg.gain.value = 0.12 * k;
    gr.connect(gg);
    gg.connect(e.gain);
    gr.start(t);
    gr.stop(t + 0.45);
    v.srcs.push(gr);
    const gold = this.env(t + 0.02, 0.1 * k, 0.003, 0, 0.35, v.out);
    this.osc(v, "triangle", t + 0.02, 0.4, 392, undefined, gold);
    this.send(v, 0.15);
  }

  private selectDragon(k: number) {
    const v = this.voice("ui", 0.7);
    if (!v) return;
    const t = this.start() + 0.01;
    const sh = this.env(t, 0.13 * k, 0.01, 0.05, 0.4, v.out);
    this.osc(v, "triangle", t, 0.5, 1046, 1568, sh);
    const sh2 = this.env(t + 0.05, 0.08 * k, 0.01, 0.03, 0.4, v.out);
    this.osc(v, "sine", t + 0.05, 0.5, 1568, 2093, sh2);
    this.burst(v, t, 0.4, 0.09 * k, "bandpass", 3200, 6800, 1.4, 0.05);
    this.send(v, 0.28, true);
  }

  tick(n: number) {
    const v = this.voice("ui", 0.2);
    if (!v) return;
    const t = this.start();
    const urgent = n <= 2;
    const e = this.env(t, urgent ? 0.28 : 0.16, 0.002, 0, urgent ? 0.1 : 0.06, v.out);
    this.osc(v, urgent ? "square" : "sine", t, 0.12, urgent ? 1320 : 880, urgent ? 1180 : 780, e);
    this.burst(v, t, 0.02, urgent ? 0.25 : 0.12, "highpass", 3000, 3000, 0.7, 0.001);
    if (urgent) {
      const lo = this.env(t, 0.3, 0.004, 0, 0.18, v.out);
      this.osc(v, "sine", t, 0.2, 98, 60, lo);
    }
  }

  lock() {
    const v = this.voice("fx", 0.9);
    if (!v) return;
    const t = this.start();
    const click = this.env(t, 0.2, 0.001, 0, 0.04, v.out);
    this.osc(v, "square", t, 0.05, 210, 120, click);
    this.burst(v, t, 0.05, 0.45, "highpass", 2500, 2500, 0.8, 0.001);
    const boom = this.env(t + 0.05, 0.7, 0.005, 0, 0.5, v.out);
    this.osc(v, "sine", t + 0.05, 0.55, 82, 33, boom);
    const ring = this.env(t + 0.03, 0.06, 0.002, 0, 0.3, v.out);
    this.osc(v, "sine", t + 0.03, 0.35, 1180, 1150, ring);
    this.send(v, 0.2);
  }

  /* ------------------------------ cards ------------------------------ */
  cardFlip() {
    const v = this.voice("fx", 0.4);
    if (!v) return;
    const t = this.start();
    this.burst(v, t, 0.16, 0.34, "bandpass", 1100, 4200, 0.9, 0.04);
    this.burst(v, t + 0.13, 0.04, 0.45, "highpass", 5200, 5200, 0.7, 0.001);
    const tap = this.env(t + 0.13, 0.12, 0.002, 0, 0.06, v.out);
    this.osc(v, "triangle", t + 0.13, 0.08, 520, 300, tap);
  }

  cardImpact() {
    const v = this.voice("fx", 1);
    if (!v) return;
    const t = this.start();
    const th = this.env(t, 0.7, 0.003, 0, 0.35, v.out);
    this.osc(v, "sine", t, 0.4, 125, 44, th);
    this.burst(v, t, 0.14, 0.4, "lowpass", 900, 220, 0.8, 0.002);
    [1760, 2349].forEach((f, i) => {
      const e = this.env(t + i * 0.03, 0.08, 0.002, 0, 0.5, v.out);
      this.osc(v, "triangle", t + i * 0.03, 0.55, f, undefined, e);
    });
    this.send(v, 0.2);
  }

  suspense() {
    const v = this.voice("fx", 1.9);
    if (!v) return;
    const t = this.start();
    const lp = this.filter("lowpass", 260, 1);
    lp.frequency.setValueAtTime(260, t);
    lp.frequency.exponentialRampToValueAtTime(1100, t + 1.6);
    const e = this.ctx!.createGain();
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(0.32, t + 1.5);
    e.gain.exponentialRampToValueAtTime(0.0001, t + 1.75);
    lp.connect(e);
    e.connect(v.out);
    this.osc(v, "sawtooth", t, 1.7, 55, 84, lp, -6);
    this.osc(v, "sawtooth", t, 1.7, 55, 84, lp, 6);
    // heartbeat that speeds up
    [0, 0.62, 1.1, 1.46].forEach((at, i) => {
      const g = 0.4 + i * 0.1;
      const a = this.env(t + at, g, 0.004, 0, 0.14, v.out);
      this.osc(v, "sine", t + at, 0.18, 72, 40, a);
      const b = this.env(t + at + 0.15, g * 0.6, 0.004, 0, 0.12, v.out);
      this.osc(v, "sine", t + at + 0.15, 0.16, 64, 38, b);
    });
    this.burst(v, t, 1.6, 0.14, "highpass", 500, 3200, 0.9, 1.2);
    this.send(v, 0.18);
  }

  /* ------------------------------ roars ------------------------------ */
  tigerRoar() {
    const v = this.voice("tigerRoar", 2.6);
    if (!v) return;
    const t = this.start();
    this.roarCore(v, t, {
      dur: 2.3,
      attack: 0.06,
      hold: 0.55,
      peak: 0.55,
      f: [[0, 250], [0.3, 215], [1.2, 140], [2.3, 85]],
      saws: 3,
      spread: 14,
      vib: 18,
      formants: [
        { f: [[0, 620], [0.4, 880], [1.6, 520], [2.3, 400]], q: 5, g: 0.9 },
        { f: [[0, 1150], [0.4, 1650], [1.6, 1000], [2.3, 800]], q: 6, g: 0.7 },
        { f: [[0, 2600], [2.3, 2400]], q: 7, g: 0.3 },
      ],
      amRate: 33,
      amDepth: 0.4,
      noiseF: 1900,
      noiseG: 0.45,
      sub: 0.35,
    });
    this.send(v, 0.22);
  }

  dragonRoar() {
    const v = this.voice("dragonRoar", 3.6);
    if (!v) return;
    const t = this.start();
    this.roarCore(v, t, {
      dur: 3.1,
      attack: 0.12,
      hold: 0.95,
      peak: 0.6,
      f: [[0, 95], [0.5, 78], [1.8, 52], [3.1, 34]],
      saws: 4,
      spread: 22,
      vib: 14,
      formants: [
        { f: [[0, 380], [0.6, 520], [2.2, 280], [3.1, 220]], q: 4, g: 1 },
        { f: [[0, 820], [0.6, 1100], [2.2, 640], [3.1, 500]], q: 5, g: 0.6 },
        { f: [[0, 1900], [3.1, 1500]], q: 6, g: 0.25 },
      ],
      amRate: 23,
      amDepth: 0.3,
      noiseF: 900,
      noiseG: 0.35,
      sub: 0.9,
    });
    // metallic screech riding over the roar
    const c = this.ctx!;
    const bp = this.filter("bandpass", 2000, 14);
    const se = c.createGain();
    se.gain.setValueAtTime(0.0001, t + 0.5);
    se.gain.exponentialRampToValueAtTime(0.1, t + 1.1);
    se.gain.setValueAtTime(0.1, t + 1.7);
    se.gain.exponentialRampToValueAtTime(0.0001, t + 2.9);
    bp.connect(se);
    se.connect(v.out);
    const sc = c.createOscillator();
    sc.type = "sawtooth";
    this.ramp(sc.frequency, t + 0.5, [[0, 1400], [0.7, 2300], [1.5, 1700], [2.4, 900]]);
    const wob = c.createOscillator();
    wob.frequency.value = 7;
    const wg = c.createGain();
    wg.gain.value = 260;
    wob.connect(wg);
    wg.connect(sc.detune);
    sc.connect(bp);
    sc.start(t + 0.5);
    sc.stop(t + 3);
    wob.start(t + 0.5);
    wob.stop(t + 3);
    v.srcs.push(sc, wob);
    this.send(v, 0.45, true);
  }

  /* ------------------------------ fire and lightning ------------------------------ */
  fireBlast(kind: "gold" | "blue") {
    const v = this.voice("fire", 3.3);
    if (!v) return;
    const t = this.start();
    const gold = kind === "gold";
    const c = this.ctx!;
    // the whoosh
    const f = this.filter(gold ? "lowpass" : "bandpass", gold ? 600 : 2400, gold ? 0.9 : 1.2);
    f.frequency.setValueAtTime(gold ? 600 : 2400, t);
    f.frequency.exponentialRampToValueAtTime(gold ? 2200 : 5200, t + 1.1);
    f.frequency.exponentialRampToValueAtTime(gold ? 500 : 3000, t + 3);
    const hp = this.filter("highpass", gold ? 120 : 1500, 0.7);
    const e = c.createGain();
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(gold ? 0.7 : 0.5, t + 0.45);
    e.gain.setValueAtTime(gold ? 0.7 : 0.5, t + 1.7);
    e.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    f.connect(hp);
    hp.connect(e);
    e.connect(v.out);
    this.noise(v, t, 3, f);
    // body rumble
    const lo = this.env(t, gold ? 0.35 : 0.22, 0.4, 1.3, 1.2, v.out);
    const lof = this.filter("lowpass", gold ? 260 : 400, 0.8);
    lof.connect(lo);
    this.noise(v, t, 3, lof);
    // crackle pops (gold) or electric sizzle (blue)
    const pops = gold ? 34 : 46;
    for (let i = 0; i < pops; i++) {
      const at = t + 0.2 + Math.random() * 2.5;
      if (gold) this.burst(v, at, rnd(0.008, 0.02), rnd(0.15, 0.4), "highpass", rnd(1800, 3600), 1800, 0.7, 0.001);
      else {
        const s = this.env(at, rnd(0.04, 0.09), 0.001, 0, 0.012, v.out);
        this.osc(v, "sine", at, 0.02, rnd(3000, 7500), rnd(2500, 8000), s);
      }
    }
    this.send(v, gold ? 0.2 : 0.3, true);
  }

  lightning() {
    const v = this.voice("lightning", 2);
    if (!v) return;
    const t = this.start();
    this.burst(v, t, 0.14, 0.9, "highpass", 3000, 1500, 0.7, 0.001);
    for (let i = 0; i < 7; i++) {
      const at = t + 0.06 + Math.random() * 0.5;
      this.burst(v, at, rnd(0.02, 0.07), rnd(0.2, 0.5), "bandpass", rnd(1800, 6000), rnd(900, 3000), 1.6, 0.001);
    }
    const r = this.env(t + 0.04, 0.6, 0.02, 0.2, 1.4, v.out);
    const lp = this.filter("lowpass", 170, 0.8);
    lp.connect(r);
    this.noise(v, t, 1.8, lp);
    const sub = this.env(t + 0.03, 0.5, 0.01, 0.1, 1.2, v.out);
    this.osc(v, "sine", t + 0.03, 1.4, 58, 32, sub);
    this.send(v, 0.2, true);
  }

  /* ------------------------------ victory, defeat, tie ------------------------------ */
  tigerVictory() {
    const v = this.voice("victory", 3);
    if (!v) return;
    const t = this.start();
    const chord = [146.8, 220, 293.7, 349.2];
    [0, 0.34, 0.68].forEach((at) => {
      chord.forEach((f) => this.brass(v, t + at, f, 0.3, 0.07, 2200, 1300, 0.015));
      this.tomSfx(v, t + at, 95, 0.55);
    });
    [146.8, 220, 293.7, 440, 587.3].forEach((f) => this.brass(v, t + 1.04, f, 1.5, 0.07, 2600, 1100, 0.05));
    this.tomSfx(v, t + 1.04, 70, 0.8);
    [1174.7, 1568, 1864.7, 2349.3].forEach((f, i) => this.bell(v, t + 1.1 + i * 0.1, f, 0.07, 1.4));
    this.burst(v, t + 1.04, 1.3, 0.12, "bandpass", 5000, 8000, 1.2, 0.02);
    this.send(v, 0.2);
    this.duck(2.8);
  }

  dragonVictory() {
    const v = this.voice("victory", 3);
    if (!v) return;
    const t = this.start();
    [73.4, 110, 146.8].forEach((f, i) => this.brass(v, t + i * 0.12, f, 2.4, 0.1, 500, 1500, 0.3));
    // choir-like pad
    const c = this.ctx!;
    const pad = this.env(t + 0.2, 0.12, 0.6, 1.3, 0.7, v.out);
    [[600, 4], [1000, 5], [2400, 6]].forEach(([ff, q]) => {
      const bp = this.filter("bandpass", ff, q);
      bp.connect(pad);
      [220, 329.6, 440].forEach((f) => {
        this.osc(v, "sawtooth", t + 0.2, 2.6, f, undefined, bp, -9);
        this.osc(v, "sawtooth", t + 0.2, 2.6, f, undefined, bp, 9);
      });
    });
    void c;
    [1568, 2093, 2637, 3136].forEach((f, i) => this.bell(v, t + i * 0.4, f, 0.06, 1.8));
    this.tomSfx(v, t, 55, 0.8);
    this.send(v, 0.35, true);
    this.duck(2.8);
  }

  defeat(side: Side) {
    const v = this.voice("defeat", 1.3);
    if (!v) return;
    const t = this.start();
    if (side === "tiger") {
      const lp = this.filter("lowpass", 900, 1);
      const e = this.env(t, 0.22, 0.04, 0.15, 0.7, v.out);
      lp.connect(e);
      const o = this.osc(v, "triangle", t, 0.95, 340, 115, lp);
      const vib = this.ctx!.createOscillator();
      vib.frequency.value = 7;
      const vg = this.ctx!.createGain();
      vg.gain.value = 30;
      vib.connect(vg);
      vg.connect(o.detune);
      vib.start(t);
      vib.stop(t + 1);
      v.srcs.push(vib);
    } else {
      const lp = this.filter("lowpass", 420, 1);
      const e = this.env(t, 0.3, 0.06, 0.2, 0.8, v.out);
      lp.connect(e);
      this.osc(v, "sawtooth", t, 1.1, 165, 44, lp);
      this.osc(v, "sine", t, 1.1, 82, 30, lp);
    }
    this.send(v, 0.2);
  }

  tieClash() {
    const v = this.voice("tie", 3);
    if (!v) return;
    const c = this.ctx!;
    const t = this.start();
    const rise = (type: OscillatorType, f0: number, f1: number, lp: number, pan: number, g: number) => {
      const p = c.createStereoPanner ? c.createStereoPanner() : null;
      const e = c.createGain();
      e.gain.setValueAtTime(0.0001, t);
      e.gain.exponentialRampToValueAtTime(g, t + 0.95);
      e.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
      const f = this.filter("lowpass", lp, 1);
      f.connect(e);
      if (p) {
        p.pan.value = pan;
        e.connect(p);
        p.connect(v.out);
      } else e.connect(v.out);
      this.osc(v, type, t, 1.05, f0, f1, f, -6);
      this.osc(v, type, t, 1.05, f0, f1, f, 6);
    };
    rise("sawtooth", 120, 900, 1800, -0.7, 0.2); // gold
    rise("triangle", 180, 1400, 3500, 0.7, 0.22); // blue
    const bt = t + 1.05;
    const boom = this.env(bt, 0.95, 0.004, 0, 0.9, v.out);
    this.osc(v, "sine", bt, 1, 96, 28, boom);
    this.burst(v, bt, 0.5, 0.7, "lowpass", 1200, 150, 0.8, 0.002);
    this.burst(v, bt, 1.3, 0.35, "bandpass", 3600, 220, 1, 0.01); // shockwave
    [392, 587.3, 784, 1175].forEach((f, i) => {
      const e = this.env(bt, 0.1, 0.01, 0, 1.2 - i * 0.15, v.out);
      this.osc(v, i % 2 ? "triangle" : "sawtooth", bt, 1.3, f, undefined, e);
    });
    this.send(v, 0.3, true);
    this.duck(2.5);
  }

  announce(kind: Side | "tie") {
    const v = this.voice("announce", 1.4);
    if (!v) return;
    const t = this.start();
    if (kind === "tiger") {
      [146.8, 220, 293.7].forEach((f) => this.brass(v, t, f, 0.7, 0.08, 1800, 1000, 0.02));
      this.tomSfx(v, t, 90, 0.6);
    } else if (kind === "dragon") {
      [73.4, 110, 164.8].forEach((f) => this.brass(v, t, f, 0.9, 0.09, 600, 1200, 0.12));
      this.bell(v, t + 0.05, 2093, 0.07, 1.2);
      this.tomSfx(v, t, 55, 0.6);
    } else {
      this.brass(v, t, 146.8, 0.8, 0.07, 1500, 900, 0.02);
      this.brass(v, t, 220, 0.8, 0.06, 2400, 1400, 0.02);
      this.bell(v, t + 0.1, 1568, 0.06, 1.1);
      this.tomSfx(v, t, 70, 0.5);
    }
    this.send(v, 0.22);
  }

  win() {
    const v = this.voice("fx", 1);
    if (!v) return;
    const t = this.start();
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => {
      const e = this.env(t + i * 0.08, 0.16, 0.004, 0, 0.45, v.out);
      this.osc(v, i % 2 ? "triangle" : "sine", t + i * 0.08, 0.5, f, undefined, e);
    });
    this.bell(v, t + 0.34, 2093, 0.05, 1);
    this.send(v, 0.18);
  }

  lose() {
    const v = this.voice("fx", 0.9);
    if (!v) return;
    const t = this.start();
    [330, 247].forEach((f, i) => {
      const lp = this.filter("lowpass", 900, 1);
      const e = this.env(t + i * 0.22, 0.14, 0.01, 0.05, 0.4, v.out);
      lp.connect(e);
      this.osc(v, "triangle", t + i * 0.22, 0.5, f, f * 0.96, lp);
    });
  }

  nextRound() {
    const v = this.voice("fx", 0.8);
    if (!v) return;
    const t = this.start();
    this.burst(v, t, 0.6, 0.2, "bandpass", 400, 2400, 0.9, 0.2);
    const e = this.env(t + 0.3, 0.07, 0.01, 0, 0.3, v.out);
    this.osc(v, "sine", t + 0.3, 0.35, 660, 880, e);
  }

  /* ------------------------------ music ------------------------------ */
  startMusic() {
    this.musicRequested = true;
    if (this.destroyed) return;
    if (!this.ctx) this.unlock();
    const c = this.ctx;
    if (!c || !this.musicOn || this.timer || c.state !== "running") return;
    this.nextTime = c.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 50);
  }

  private schedule() {
    const c = this.ctx;
    if (!c || !this.musicOn) return;
    this.energy += (this.energyTarget - this.energy) * 0.04;
    if (this.nextTime < c.currentTime - 0.5) this.nextTime = c.currentTime + 0.05;
    while (this.nextTime < c.currentTime + 0.3) {
      this.musicStep(this.stepIdx, this.nextTime);
      this.nextTime += STEP;
      this.stepIdx++;
    }
  }

  private musicStep(i: number, t: number) {
    const c = this.ctx;
    if (!c || !this.musicIn) return;
    const bar = Math.floor(i / 16);
    const s = i % 16;
    const section = Math.floor(bar / 8);
    const prog = PROGS[SECTION_ORDER[section % SECTION_ORDER.length]];
    const chord = Math.floor((bar % 8) / 2);
    const root = 38 + prog[chord];
    const e = this.energy;

    if (s === 0 && bar % 2 === 0) this.musicPad(t, root);
    if (s === 0 && bar % 8 === 0 && section > 0 && section % 2 === 1) this.musicGong(t);

    // war drums
    if (s === 0) this.musicTom(t, 62, 1);
    if (s === 8) this.musicTom(t, 70, 0.8);
    if ((s === 6 || s === 14) && e > 0.2) this.musicTom(t, 92, 0.3 + e * 0.35);
    if ((s === 4 || s === 12) && e > 0.45) this.musicTom(t, 110, 0.25 + e * 0.3);
    if (e > 0.7 && s % 2 === 0) this.musicShaker(t, 0.03 + (e - 0.7) * 0.08);

    // ostinato
    const pat = PATTERNS[(SECTION_ORDER[section % SECTION_ORDER.length] + Math.floor((bar % 8) / 4)) % PATTERNS.length];
    const idx = pat[s];
    if (idx >= 0 && (e > 0.35 || s % 4 === 0)) this.musicPluck(t, root + 24 + SCALE[idx % SCALE.length], 0.07 + e * 0.06, 900 + e * 1900);
  }

  private musicTom(t: number, f: number, g: number) {
    const c = this.ctx!;
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.6 * g, t + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    out.connect(this.musicIn!);
    const send = c.createGain();
    send.gain.value = 0.3;
    out.connect(send);
    send.connect(this.musicRev!);
    const o = c.createOscillator();
    o.frequency.setValueAtTime(f * 1.8, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.3);
    o.connect(out);
    o.start(t);
    o.stop(t + 0.45);
    const nf = this.filter("lowpass", 700, 0.7);
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.25 * g, t + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    nf.connect(ng);
    ng.connect(out);
    const n = c.createBufferSource();
    n.buffer = this.noiseBuf;
    n.connect(nf);
    n.start(t, Math.random() * 1.4);
    n.stop(t + 0.15);
  }

  private musicShaker(t: number, g: number) {
    const c = this.ctx!;
    const f = this.filter("highpass", 7000, 0.7);
    const e = c.createGain();
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(g, t + 0.003);
    e.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    f.connect(e);
    e.connect(this.musicIn!);
    const n = c.createBufferSource();
    n.buffer = this.noiseBuf;
    n.connect(f);
    n.start(t, Math.random() * 1.4);
    n.stop(t + 0.06);
  }

  private musicPluck(t: number, midi: number, g: number, cutoff: number) {
    const c = this.ctx!;
    const lp = this.filter("lowpass", cutoff, 1.4);
    lp.frequency.setValueAtTime(cutoff, t);
    lp.frequency.exponentialRampToValueAtTime(cutoff * 0.3, t + 0.22);
    const e = c.createGain();
    e.gain.setValueAtTime(0.0001, t);
    e.gain.exponentialRampToValueAtTime(g, t + 0.006);
    e.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    lp.connect(e);
    e.connect(this.musicIn!);
    const send = c.createGain();
    send.gain.value = 0.25;
    e.connect(send);
    send.connect(this.musicRev!);
    const f = mtof(midi);
    (["sawtooth", "square"] as OscillatorType[]).forEach((type, k) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = k ? f * 2 : f;
      o.detune.value = k ? 5 : -4;
      const og = c.createGain();
      og.gain.value = k ? 0.35 : 0.8;
      o.connect(og);
      og.connect(lp);
      o.start(t);
      o.stop(t + 0.34);
    });
  }

  private musicPad(t: number, root: number) {
    const c = this.ctx!;
    const dur = 2 * 16 * STEP;
    const e = this.energy;
    const peak = 0.05 + 0.03 * e;
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(peak, t + 1.4);
    env.gain.setValueAtTime(peak, t + dur - 0.2);
    env.gain.linearRampToValueAtTime(0.0001, t + dur + 1.2);
    const lp = this.filter("lowpass", 520, 0.7);
    lp.frequency.setValueAtTime(520, t);
    lp.frequency.linearRampToValueAtTime(1000 + e * 500, t + dur * 0.55);
    lp.frequency.linearRampToValueAtTime(560, t + dur + 1);
    const dry = c.createGain();
    dry.gain.value = 0.6;
    lp.connect(dry);
    dry.connect(env);
    [[650, 4, 0.5], [1050, 5, 0.4]].forEach(([ff, q, gg]) => {
      const bp = this.filter("bandpass", ff, q);
      const g = c.createGain();
      g.gain.value = gg;
      lp.connect(bp);
      bp.connect(g);
      g.connect(env);
    });
    env.connect(this.musicIn!);
    const send = c.createGain();
    send.gain.value = 0.3;
    env.connect(send);
    send.connect(this.musicRev!);
    [root + 12, root + 19, root + 24].forEach((m) => {
      [-8, 8].forEach((d) => {
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = mtof(m);
        o.detune.value = d;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 1.3);
      });
    });
  }

  private musicGong(t: number) {
    const c = this.ctx!;
    const out = c.createGain();
    out.connect(this.musicIn!);
    const send = c.createGain();
    send.gain.value = 0.4;
    out.connect(send);
    send.connect(this.musicRev!);
    [1, 1.47, 2.09, 2.57, 3.31, 4.16].forEach((r, i) => {
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05 / (i + 1), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5 - i * 0.4);
      g.connect(out);
      const o = c.createOscillator();
      o.frequency.value = 98 * r;
      o.connect(g);
      o.start(t);
      o.stop(t + 4.6);
    });
    const hp = this.filter("highpass", 5000, 0.7);
    const sg = c.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.012, t + 0.05);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    hp.connect(sg);
    sg.connect(out);
    const n = c.createBufferSource();
    n.buffer = this.noiseBuf;
    n.connect(hp);
    n.start(t, Math.random() * 1.4);
    n.stop(t + 3.1);
  }
}
