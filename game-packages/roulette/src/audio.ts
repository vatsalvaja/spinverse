/**
 * ROULETTE audio (Web Audio, no asset files).
 *
 * Two buses with their own switches:
 *   music : a quiet luxury-lounge bed (brushes, walking bass, Rhodes-style chords, vibes, room tone, glass clinks)
 *   sound : the wheel, ball, chips, result chimes and win/lose stings
 * The context is created lazily and may stay suspended until a user gesture; `onStateChange` lets the UI show an
 * "enable sound" prompt, and the music starts by itself the moment the context is allowed to run.
 * Everything is synthesised; nothing here has been auditioned, so levels and timbres are first-pass.
 */

const MUSIC_LEVEL = 0.2;
const MUSIC_DUCKED = 0.07;
const BPM = 76;
const STEP = 60 / BPM / 2; // one eighth note, in seconds
const SWING = STEP * 0.22; // off-beat eighths land a little late
const LOOKAHEAD = 0.25;
const MAX_LIVE = 120; // soft cap on simultaneously live sources

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** A chord: bass root (MIDI) and semitone offsets from it: root, 3rd, 5th, 7th, extension. */
interface Chord {
  root: number;
  v: number[];
}
const C = (root: number, v: number[]): Chord => ({ root, v });
// four chords per section, two bars each; the sections are walked in a longer order so the bed keeps changing
const PROGRESSIONS: Chord[][] = [
  [C(38, [0, 3, 7, 10, 14]), C(43, [0, 4, 7, 10, 14]), C(36, [0, 4, 7, 11, 14]), C(45, [0, 4, 7, 10, 15])],
  [C(41, [0, 4, 7, 11, 14]), C(40, [0, 3, 7, 10, 14]), C(38, [0, 3, 7, 10, 14]), C(43, [0, 5, 7, 10, 14])],
  [C(36, [0, 4, 7, 11, 14]), C(45, [0, 4, 7, 10, 14]), C(38, [0, 3, 7, 10, 17]), C(43, [0, 4, 7, 10, 14])],
  [C(34, [0, 4, 7, 11, 14]), C(43, [0, 3, 7, 10, 14]), C(36, [0, 3, 7, 10, 14]), C(41, [0, 4, 7, 10, 14])],
];
const SECTION_ORDER = [0, 1, 2, 1, 3, 0, 2, 3];
const COMP_PATTERNS = [[0, 5], [0, 3, 6], [1, 5], [0, 4, 7]];

const chordAt = (bar: number): Chord => {
  const idx = Math.floor(bar / 2);
  const section = Math.floor(idx / 4);
  return PROGRESSIONS[SECTION_ORDER[section % SECTION_ORDER.length]][idx % 4];
};

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  at?: number;
  to?: number;
  attack?: number;
  lp?: number;
  out?: AudioNode;
  voice?: Voice;
  /** register with the sfx set so stopAllSfx can silence it (default true) */
  sfx?: boolean;
  /** level sent to the music reverb */
  send?: number;
  detune?: number;
}
interface NoiseOpts {
  type?: BiquadFilterType;
  f0: number;
  f1?: number;
  q?: number;
  at?: number;
  attack?: number;
  out?: AudioNode;
  voice?: Voice;
  sfx?: boolean;
}
/** A group of sources that share an output gain, so a whole sound can be faded out at once. */
interface Voice {
  out: GainNode;
  srcs: AudioScheduledSourceNode[];
}
/** A continuous sound with parameters that follow a 0..1 speed. */
interface Loop {
  out: GainNode;
  srcs: AudioScheduledSourceNode[];
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  aux: OscillatorNode | null;
  auxGain: GainNode | null;
  quietSince: number;
}

export class RouletteAudio {
  musicOn = true;
  soundOn = true;
  onStateChange?: () => void;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step = 0;
  private wantMusic = false;
  private duckUntil = 0;
  private clinkAt = 0;
  private murmur: AudioScheduledSourceNode[] = [];
  private live = 0;
  private active = new Set<AudioScheduledSourceNode>();
  private families = new Map<string, Voice[]>();
  private wheel: Loop | null = null;
  private ball: Loop | null = null;

  get running(): boolean {
    return !!this.ctx && this.ctx.state === "running";
  }

  /** Create the context (client only) and ask it to run. Safe to call repeatedly; call it from user gestures. */
  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      comp.attack.value = 0.005;
      comp.release.value = 0.25;
      master.connect(comp).connect(ctx.destination);
      this.master = master;

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.musicOn ? 1 : 0;
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = MUSIC_LEVEL;
      this.musicBus.connect(this.musicGain).connect(master);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = this.soundOn ? 1 : 0;
      this.sfxBus.connect(master);

      // a warm room for the keys and vibes: generated impulse response, darkened
      const len = Math.floor(ctx.sampleRate * 2.4);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
      }
      const conv = ctx.createConvolver();
      conv.buffer = ir;
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 3200;
      const wet = ctx.createGain();
      wet.gain.value = 0.55;
      this.reverbSend = ctx.createGain();
      this.reverbSend.connect(tone).connect(conv).connect(wet).connect(this.musicBus);

      const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      this.noiseBuf = nb;

      ctx.onstatechange = () => {
        if (ctx.state === "running" && this.wantMusic && this.musicOn) this.beginScheduler();
        this.onStateChange?.();
      };
      this.ctx = ctx;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (this.ctx && this.musicBus) {
      const t = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(t);
      this.musicBus.gain.setTargetAtTime(on ? 1 : 0, t, 0.05); // fully down within ~150ms
    }
    if (on) this.startMusic();
  }

  setSound(on: boolean) {
    this.soundOn = on;
    if (!on) this.stopAllSfx();
    if (this.ctx && this.sfxBus) {
      const t = this.ctx.currentTime;
      this.sfxBus.gain.cancelScheduledValues(t);
      this.sfxBus.gain.setTargetAtTime(on ? 1 : 0, t, 0.03);
    }
  }

  /** Begin the background music (idempotent). If the context is still locked it starts the moment it is allowed. */
  startMusic() {
    this.wantMusic = true;
    this.unlock();
    if (this.running && this.musicOn) this.beginScheduler();
  }

  /** Pull the music down for `seconds` so a stinger can lead. */
  duck(seconds: number) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    const g = this.musicGain.gain;
    this.duckUntil = Math.max(this.duckUntil, t + seconds);
    g.cancelScheduledValues(t);
    g.setTargetAtTime(MUSIC_DUCKED, t, 0.06);
    g.setTargetAtTime(MUSIC_LEVEL, this.duckUntil, 0.5);
  }

  suspend() {
    if (this.ctx?.state === "running") void this.ctx.suspend().catch(() => {});
  }
  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume().catch(() => {});
  }

  /** Hard-stop every sound effect that is playing, including the wheel and ball loops. */
  stopAllSfx() {
    this.active.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already ended */
      }
    });
    this.active.clear();
    this.families.clear();
    this.wheel = null;
    this.ball = null;
  }

  destroy() {
    this.wantMusic = false;
    this.stopScheduler();
    this.stopAllSfx();
    const c = this.ctx;
    this.ctx = null;
    this.master = this.musicBus = this.musicGain = this.sfxBus = this.reverbSend = null;
    if (c) {
      c.onstatechange = null;
      void c.close().catch(() => {});
    }
  }

  /* ------------------------------ plumbing ------------------------------ */
  private ready(): AudioContext | null {
    const c = this.ctx;
    if (!c || !this.sfxBus || c.state !== "running" || !this.soundOn) return null;
    return c;
  }

  private track<T extends AudioScheduledSourceNode>(s: T, sfx: boolean): T {
    this.live++;
    if (sfx) this.active.add(s);
    s.addEventListener("ended", () => {
      this.live--;
      this.active.delete(s);
    });
    return s;
  }

  private noiseSource(loop: boolean, sfx: boolean): AudioBufferSourceNode | null {
    const c = this.ctx;
    if (!c || !this.noiseBuf) return null;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = loop;
    return this.track(s, sfx);
  }

  /** A new voice in a family; any earlier voice in the same family is faded out first so sounds never stack up. */
  private beginVoice(family: string): Voice | null {
    const c = this.ctx;
    if (!c || !this.sfxBus) return null;
    this.fadeFamily(family);
    const out = c.createGain();
    out.gain.value = 1;
    out.connect(this.sfxBus);
    const v: Voice = { out, srcs: [] };
    this.families.set(family, [v]);
    return v;
  }

  private fadeFamily(family: string, fade = 0.15) {
    const c = this.ctx;
    const list = this.families.get(family);
    if (!c || !list) return;
    const t = c.currentTime;
    for (const v of list) {
      v.out.gain.cancelScheduledValues(t);
      v.out.gain.setTargetAtTime(0, t, fade / 3);
      for (const s of v.srcs) {
        try {
          s.stop(t + fade + 0.05);
        } catch {
          /* already ended */
        }
      }
    }
    this.families.delete(family);
  }

  /** One enveloped oscillator note. */
  private tone(freq: number, dur: number, o: ToneOpts = {}) {
    const c = this.ctx;
    if (!c || this.live > MAX_LIVE) return;
    const sfx = o.sfx ?? true;
    const out = o.out ?? o.voice?.out ?? this.sfxBus;
    if (!out) return;
    const t = c.currentTime + (o.at ?? 0);
    const osc = this.track(c.createOscillator(), sfx);
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = c.createGain();
    const attack = o.attack ?? 0.006;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain ?? 0.1), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = osc;
    if (o.lp) {
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = o.lp;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(out);
    if (o.send && this.reverbSend) {
      const s = c.createGain();
      s.gain.value = o.send;
      g.connect(s).connect(this.reverbSend);
    }
    osc.start(t);
    osc.stop(t + dur + 0.04);
    o.voice?.srcs.push(osc);
  }

  /** One enveloped, filtered noise burst. */
  private noise(dur: number, gain: number, o: NoiseOpts) {
    const c = this.ctx;
    if (!c || this.live > MAX_LIVE) return;
    const sfx = o.sfx ?? true;
    const out = o.out ?? o.voice?.out ?? this.sfxBus;
    const src = this.noiseSource(false, sfx);
    if (!out || !src) return;
    const t = c.currentTime + (o.at ?? 0);
    const f = c.createBiquadFilter();
    f.type = o.type ?? "bandpass";
    f.Q.value = o.q ?? 0.9;
    f.frequency.setValueAtTime(o.f0, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    const g = c.createGain();
    const attack = Math.min(o.attack ?? 0.004, dur * 0.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(out);
    src.start(t, rand(0, 1.5));
    src.stop(t + dur + 0.05);
    o.voice?.srcs.push(src);
  }

  /* ------------------------------ music ------------------------------ */
  private beginScheduler() {
    const c = this.ctx;
    if (!c || this.timer) return;
    this.nextTime = c.currentTime + 0.1;
    this.clinkAt = c.currentTime + rand(7, 16);
    this.startMurmur();
    this.timer = setInterval(() => this.tick(), 25);
  }

  private stopScheduler() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stopMurmur();
  }

  private tick() {
    const c = this.ctx;
    if (!c || !this.musicOn) return this.stopScheduler();
    if (c.state !== "running") return;
    if (this.nextTime < c.currentTime - 0.5) this.nextTime = c.currentTime + 0.05; // after a stall, don't burst
    while (this.nextTime < c.currentTime + LOOKAHEAD) {
      this.scheduleStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step++;
    }
    if (c.currentTime > this.clinkAt) {
      this.clink(0);
      this.clinkAt = c.currentTime + rand(12, 30);
    }
  }

  private scheduleStep(step: number, tStep: number) {
    const c = this.ctx;
    if (!c) return;
    const s = step % 8;
    const bar = Math.floor(step / 8);
    const t = tStep - c.currentTime + (s % 2 ? SWING : 0); // relative to now, as the helpers expect
    const chord = chordAt(bar);
    const secondBar = bar % 2 === 1;
    const hash = (bar * 37 + Math.floor(bar / 8) * 11) % 7;

    // walking bass: one note per beat, ending each bar on an approach note into the next chord
    if (s % 2 === 0) {
      const third = chord.v[1];
      let note = chord.root;
      if (s === 2) note = chord.root + (secondBar ? 7 : third);
      else if (s === 4) note = chord.root + (secondBar ? third : 7);
      else if (s === 6) {
        const next = chordAt(bar + 1).root;
        note = next > chord.root ? next - 1 : next + 1;
        while (note > chord.root + 9) note -= 12;
        while (note < chord.root - 9) note += 12;
      }
      this.bass(note, t, s === 0 ? 0.2 : 0.15);
    }

    // rootless chord comping, rolled, on a pattern that changes bar to bar
    const pattern = COMP_PATTERNS[(hash + (secondBar ? 1 : 0)) % COMP_PATTERNS.length];
    if (pattern.includes(s)) {
      const notes = chord.v.slice(1).map((o) => {
        let m = chord.root + 12 + o;
        while (m < 55) m += 12;
        return m;
      });
      notes.forEach((m, i) => this.rhodes(m, t + i * 0.014, (pattern[0] === s ? 0.03 : 0.021) * (1 - i * 0.06), s === pattern[0] ? 2.2 : 1.1));
    }

    // vibes: a short motif in the third and fourth bar of some phrases
    if ((bar % 8 === 3 || bar % 8 === 7) && (s === 1 || s === 4 || s === 6)) {
      const off = chord.v[(s * 3) % 5];
      this.vibe(Math.min(96, chord.root + 36 + off), t, 0.03);
    }

    // brushes: feathered kick, swish on 2 and 4, a whisper of hat on the off-beats
    if (s === 0 || s === 4) this.tone(60, 0.2, { to: 38, gain: 0.07, out: this.musicBus ?? undefined, sfx: false, attack: 0.004, at: t });
    if (s === 2 || s === 6) this.noise(0.17, 0.05, { f0: 3200, f1: 2400, q: 0.7, at: t, attack: 0.02, out: this.musicBus ?? undefined, sfx: false });
    if (s % 2 === 0) this.noise(0.08, 0.016, { type: "highpass", f0: 6500, q: 0.5, at: t, out: this.musicBus ?? undefined, sfx: false });
    else if ((bar + s) % 3 !== 0) this.noise(0.05, 0.012, { type: "highpass", f0: 8000, q: 0.5, at: t, out: this.musicBus ?? undefined, sfx: false });
  }

  private bass(midi: number, at: number, gain: number) {
    const out = this.musicBus ?? undefined;
    this.tone(hz(midi), 0.55, { type: "sine", gain, at, attack: 0.012, lp: 420, out, sfx: false });
    this.tone(hz(midi), 0.4, { type: "triangle", gain: gain * 0.4, at, attack: 0.012, lp: 380, out, sfx: false });
  }

  /** An electric-piano style note: a soft fundamental, a decaying octave and a brief bell-like tine. */
  private rhodes(midi: number, at: number, gain: number, dur: number) {
    const out = this.musicBus ?? undefined;
    const f = hz(midi);
    this.tone(f, dur, { gain, at, attack: 0.006, lp: 2600, out, sfx: false, send: 0.5 });
    this.tone(f * 2, dur * 0.5, { gain: gain * 0.32, at, attack: 0.005, lp: 3000, out, sfx: false });
    this.tone(f * 4, 0.12, { gain: gain * 0.1, at, attack: 0.003, out, sfx: false });
  }

  private vibe(midi: number, at: number, gain: number) {
    const out = this.musicBus ?? undefined;
    const f = hz(midi);
    this.tone(f, 2.2, { gain, at, attack: 0.004, out, sfx: false, send: 0.7 });
    this.tone(f * 3.98, 0.7, { gain: gain * 0.22, at, attack: 0.003, out, sfx: false, send: 0.5 });
  }

  /** A distant glass touching glass, somewhere across the room. */
  private clink(at: number) {
    const out = this.musicBus ?? undefined;
    const base = rand(3000, 4200);
    this.tone(base, 0.4, { gain: 0.02, at, attack: 0.002, out, sfx: false, send: 0.8 });
    this.tone(base * 1.51, 0.28, { gain: 0.013, at: at + 0.01, attack: 0.002, out, sfx: false, send: 0.8 });
  }

  /** Room tone: a very quiet drifting murmur under the music. */
  private startMurmur() {
    const c = this.ctx;
    if (!c || !this.musicBus || this.murmur.length) return;
    for (const [freq, level, rate] of [[520, 0.012, 0.07], [1250, 0.006, 0.11]] as const) {
      const src = this.noiseSource(true, false);
      if (!src) continue;
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = freq;
      f.Q.value = 0.6;
      const g = c.createGain();
      g.gain.value = level;
      const lfo = this.track(c.createOscillator(), false);
      lfo.frequency.value = rate;
      const lg = c.createGain();
      lg.gain.value = freq * 0.35;
      lfo.connect(lg).connect(f.frequency);
      src.connect(f).connect(g).connect(this.musicBus);
      src.start(0, rand(0, 1));
      lfo.start();
      this.murmur.push(src, lfo);
    }
  }

  private stopMurmur() {
    for (const s of this.murmur) {
      try {
        s.stop();
      } catch {
        /* already ended */
      }
    }
    this.murmur = [];
  }

  /* ------------------------------ sound effects ------------------------------ */
  click() {
    if (!this.ready()) return;
    this.tone(880, 0.04, { type: "triangle", gain: 0.05 });
    this.noise(0.02, 0.03, { type: "highpass", f0: 4000 });
  }

  /** A chip landing on felt: a dry clay clack on top of a soft thud. */
  chip(pitch = 1, gain = 1) {
    if (!this.ready()) return;
    const p = pitch * rand(0.92, 1.08);
    this.noise(0.03, 0.1 * gain, { f0: 2600 * p, q: 3 });
    this.tone(1850 * p, 0.045, { type: "triangle", gain: 0.07 * gain });
    this.tone(2750 * p, 0.03, { type: "sine", gain: 0.035 * gain });
    this.tone(190 * p, 0.07, { to: 90, gain: 0.09 * gain, attack: 0.003 });
  }

  chipStack() {
    if (!this.ready()) return;
    for (let i = 0; i < 4; i++) setTimeout(() => this.chip(0.92 + i * 0.05, 0.8), i * rand(45, 70));
  }

  undo() {
    if (!this.ready()) return;
    this.chip(0.78, 0.75);
    this.noise(0.12, 0.03, { f0: 2200, f1: 900, at: 0.02 });
  }

  /** Chips swept off the table: a short rattle and a swish. */
  clear() {
    if (!this.ready()) return;
    this.noise(0.38, 0.07, { f0: 3000, f1: 800, q: 0.7, attack: 0.03 });
    for (let i = 0; i < 8; i++) {
      const at = 0.02 + i * 0.04 + rand(0, 0.02);
      this.noise(0.02, 0.06 * (1 - i * 0.08), { f0: rand(2000, 3200), q: 3, at });
      this.tone(rand(1500, 2300), 0.03, { type: "triangle", gain: 0.03 * (1 - i * 0.08), at });
    }
  }

  error() {
    if (!this.ready()) return;
    this.tone(165, 0.24, { type: "triangle", to: 118, gain: 0.08, lp: 500, attack: 0.01 });
    this.tone(124, 0.28, { type: "sine", to: 92, gain: 0.06, attack: 0.01, at: 0.02 });
  }

  /** SPIN pressed: a soft bell, then the wheel being launched. */
  spinStart() {
    const v = this.ready() ? this.beginVoice("launch") : null;
    if (!v) return;
    this.tone(880, 0.9, { gain: 0.04, attack: 0.004, voice: v });
    this.tone(1320, 0.6, { gain: 0.016, attack: 0.004, voice: v });
    this.noise(1.1, 0.12, { f0: 380, f1: 2400, q: 0.8, at: 0.08, attack: 0.35, voice: v });
    this.tone(74, 0.7, { to: 48, gain: 0.1, at: 0.08, attack: 0.04, voice: v });
    for (let i = 0; i < 6; i++) this.tone(rand(1400, 2000), 0.025, { type: "triangle", gain: 0.03, at: 0.2 + i * 0.07, voice: v });
  }

  /* ---- wheel: a continuous mechanical whirr whose rate and pitch follow speed ---- */
  wheelUpdate(speed: number) {
    const c = this.ready();
    if (!c) return;
    const s = clamp(speed, 0, 1);
    if (!this.wheel) {
      if (s < 0.03) return;
      this.wheel = this.makeWheel(c);
      if (!this.wheel) return;
    }
    const w = this.wheel;
    const t = c.currentTime;
    const level = s < 0.02 ? 0 : 0.03 + 0.1 * Math.pow(s, 0.7);
    w.out.gain.setTargetAtTime(level, t, 0.08);
    w.filter.frequency.setTargetAtTime(260 + s * 900, t, 0.08);
    w.lfo.frequency.setTargetAtTime(4 + s * 30, t, 0.1);
    w.aux?.frequency.setTargetAtTime(52 + s * 70, t, 0.1);
    w.auxGain?.gain.setTargetAtTime(s < 0.02 ? 0 : 0.35, t, 0.1);
    if (s < 0.02) {
      if (!w.quietSince) w.quietSince = t;
      else if (t - w.quietSince > 1.2) this.killLoop(w, "wheel");
    } else w.quietSince = 0;
  }

  private makeWheel(c: AudioContext): Loop | null {
    const src = this.noiseSource(true, true);
    if (!src || !this.sfxBus) return null;
    const out = c.createGain();
    out.gain.value = 0;
    out.connect(this.sfxBus);
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.9;
    filter.frequency.value = 300;
    const amp = c.createGain();
    amp.gain.value = 0.55;
    const lfo = this.track(c.createOscillator(), true);
    lfo.type = "sawtooth"; // each cycle is a ramp and a drop, which reads as a ratchet tick
    lfo.frequency.value = 6;
    const lg = c.createGain();
    lg.gain.value = 0.4;
    lfo.connect(lg).connect(amp.gain);
    src.connect(filter).connect(amp).connect(out);
    const hum = this.track(c.createOscillator(), true);
    hum.type = "triangle";
    hum.frequency.value = 55;
    const humGain = c.createGain();
    humGain.gain.value = 0.35;
    hum.connect(humGain).connect(out);
    src.start(0, rand(0, 1));
    lfo.start();
    hum.start();
    return { out, srcs: [src, lfo, hum], filter, lfo, aux: hum, auxGain: humGain, quietSince: 0 };
  }

  wheelStop() {
    const c = this.ctx;
    const w = this.wheel;
    if (!c || !w) return;
    this.killLoop(w, "wheel", 0.5);
  }

  /* ---- ball: noise rolling on the wooden track, rhythm and brightness follow speed ---- */
  ballRoll(on: boolean) {
    const c = this.ctx;
    if (!on) {
      if (this.ball) this.killLoop(this.ball, "ball", 0.35);
      return;
    }
    if (!this.ready() || !c || this.ball) return;
    const src = this.noiseSource(true, true);
    const rumble = this.noiseSource(true, true);
    if (!src || !rumble || !this.sfxBus) return;
    const out = c.createGain();
    out.gain.value = 0;
    out.connect(this.sfxBus);
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.value = 2200;
    const amp = c.createGain();
    amp.gain.value = 0.6;
    const lfo = this.track(c.createOscillator(), true);
    lfo.type = "sine"; // one swell per lap round the track
    lfo.frequency.value = 3;
    const lg = c.createGain();
    lg.gain.value = 0.35;
    lfo.connect(lg).connect(amp.gain);
    src.connect(filter).connect(amp).connect(out);
    // a faint low rumble under it, with a slow wobble in the brightness
    const low = c.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 240;
    const lowGain = c.createGain();
    lowGain.gain.value = 0.5;
    rumble.connect(low).connect(lowGain).connect(out);
    const wobble = this.track(c.createOscillator(), true);
    wobble.frequency.value = 0.7;
    const wg = c.createGain();
    wg.gain.value = 180;
    wobble.connect(wg).connect(filter.frequency);
    src.start(0, rand(0, 1));
    rumble.start(0, rand(0, 1));
    lfo.start();
    wobble.start();
    this.ball = { out, srcs: [src, rumble, lfo, wobble], filter, lfo, aux: null, auxGain: null, quietSince: 0 };
  }

  ballUpdate(speed: number) {
    const c = this.ctx;
    const b = this.ball;
    if (!c || !b || !this.soundOn || c.state !== "running") return;
    const s = clamp(speed, 0, 1);
    const t = c.currentTime;
    b.out.gain.setTargetAtTime(0.02 + 0.11 * Math.pow(s, 0.8), t, 0.08);
    b.filter.frequency.setTargetAtTime(1400 + s * 2600, t, 0.1);
    b.lfo.frequency.setTargetAtTime(1.5 + s * 12, t, 0.12);
  }

  private killLoop(l: Loop, which: "wheel" | "ball", fade = 0.4) {
    const c = this.ctx;
    if (which === "wheel") this.wheel = null;
    else this.ball = null;
    if (!c) return;
    const t = c.currentTime;
    l.out.gain.cancelScheduledValues(t);
    l.out.gain.setTargetAtTime(0, t, fade / 3);
    for (const s of l.srcs) {
      try {
        s.stop(t + fade + 0.1);
      } catch {
        /* already ended */
      }
    }
  }

  /** The ball hitting a deflector: a bright wooden-ivory tick, harder with strength. */
  ballBounce(strength: number) {
    if (!this.ready()) return;
    const k = clamp(strength, 0, 1);
    const p = rand(0.9, 1.1);
    const g = 0.05 + 0.14 * k;
    this.noise(0.012 + 0.01 * k, g, { type: "highpass", f0: 2800 + k * 1800, q: 0.6, attack: 0.001 });
    this.tone((2600 + k * 1000) * p, 0.03, { gain: g * 0.55, attack: 0.001 });
    this.tone(880 * p, 0.045, { type: "triangle", gain: g * 0.5, to: 620 * p, attack: 0.001 });
  }

  /** The ball settling into its pocket: a few quick diminishing ticks, then a soft click. */
  ballLand() {
    if (!this.ready()) return;
    const gaps = [0, 0.07, 0.125, 0.165, 0.195];
    gaps.forEach((at, i) => {
      const k = 1 - i * 0.17;
      this.noise(0.012, 0.11 * k, { type: "highpass", f0: 3000, q: 0.6, at, attack: 0.001 });
      this.tone(rand(2300, 3000) * (1 - i * 0.05), 0.025, { gain: 0.07 * k, at, attack: 0.001 });
    });
    this.tone(720, 0.04, { type: "triangle", gain: 0.07, at: 0.25, to: 500, attack: 0.001 });
    this.tone(150, 0.08, { to: 80, gain: 0.09, at: 0.25, attack: 0.003 });
  }

  /** The result chime. Red is warm, black is cooler and lower, green gets a little sparkle on top. */
  reveal(color: "red" | "black" | "green") {
    const v = this.ready() ? this.beginVoice("sting") : null;
    if (!v) return;
    this.duck(1.4);
    const sets = { red: [65, 69, 72, 76], black: [53, 57, 60, 64], green: [72, 76, 79, 84] } as const;
    const gain = color === "black" ? 0.055 : 0.05;
    sets[color].forEach((m, i) => this.chime(m, i * 0.045, gain * (1 - i * 0.08), v, color === "black" ? 2.1 : 1.7));
    if (color === "green") for (let i = 0; i < 7; i++) this.tone(rand(3200, 5600), 0.3, { gain: 0.016, at: 0.12 + i * 0.07, attack: 0.002, voice: v });
  }

  /** A bell-like note: a sine with an inharmonic overtone that dies away faster. */
  private chime(midi: number, at: number, gain: number, v: Voice, decay: number) {
    const f = hz(midi);
    this.tone(f, decay, { gain, at, attack: 0.005, voice: v });
    this.tone(f * 2.76, decay * 0.4, { gain: gain * 0.25, at, attack: 0.003, voice: v });
    this.tone(f * 5.4, decay * 0.15, { gain: gain * 0.08, at, attack: 0.002, voice: v });
  }

  win(amount: number) {
    const v = this.ready() ? this.beginVoice("sting") : null;
    if (!v) return;
    this.duck(2.2);
    const a = Math.max(0, amount);
    const notes = a < 50 ? 3 : a < 500 ? 5 : 7;
    const scale = [84, 88, 91, 93, 96, 100, 103]; // bright pentatonic run
    for (let i = 0; i < notes; i++) this.chime(scale[i] - 12, 0.1 + i * 0.09, 0.04, v, 1.4);
    const clacks = Math.min(8, 2 + Math.floor(Math.log10(a + 1) * 2.5));
    for (let i = 0; i < clacks; i++) setTimeout(() => this.chip(1 + i * 0.03, 0.85), 80 + i * 70);
    if (a >= 500) [60, 64, 67, 72].forEach((m, i) => this.tone(hz(m), 1.8, { gain: 0.03, at: 0.2 + i * 0.03, attack: 0.25, lp: 1800, voice: v }));
  }

  lose() {
    const v = this.ready() ? this.beginVoice("sting") : null;
    if (!v) return;
    this.tone(230, 0.8, { type: "triangle", to: 150, gain: 0.05, lp: 520, attack: 0.04, voice: v });
    this.tone(116, 0.9, { to: 82, gain: 0.04, attack: 0.05, voice: v });
  }

  /** Last round's bets going back on the table. */
  repeat() {
    if (!this.ready()) return;
    this.chip(1, 0.9);
    setTimeout(() => this.chip(1.08, 0.9), 55);
  }
}
