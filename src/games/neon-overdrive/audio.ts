/**
 * Neon Overdrive audio: everything is synthesised at runtime with Web Audio, no sample files.
 *
 * Music is a small synthwave/cyberpunk sequencer with a look-ahead scheduler. Three original tracks:
 *   base       112 BPM, F minor: pumping bass, gated pads, rolling arps, a lead in the drop
 *   overdrive  134 BPM, E minor: distorted bass, double-time hats, faster arps, riser fills
 *   celebrate  126 BPM, C major: fanfare lead, snare rolls, four-on-the-floor, for the big wins
 * Each track is a 16-bar form (groove, full, breakdown, drop) so it does not loop audibly.
 * Buses: music and sfx are switched independently. Music ducks under stings and announcer lines.
 */

export type MusicMode = "base" | "overdrive" | "celebrate";
type Wave = OscillatorType;
type Chord = { root: number; q: "m" | "M" };
interface Sec { prog: number; kick: boolean; hat: 0 | 1 | 2; clap: boolean; bass: boolean; arp: boolean; pad: boolean; lead: boolean; roll?: boolean }
interface Track {
  bpm: number;
  progs: Chord[][];
  sections: Sec[];
  bass: number[][];
  arp: number[][];
  lead: number[][];
  wave: { bass: Wave; arp: Wave; lead: Wave };
  dist: boolean;
  level: number;
}

const m = (root: number): Chord => ({ root, q: "m" });
const M = (root: number): Chord => ({ root, q: "M" });

const BASS_A = [1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0, 2, 0];
const BASS_B = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 2, 0, 1];
const BASS_C = [1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 2];
const ARP_A = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 2, 1];
const ARP_B = [0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 1, 3, 2, 3];
const ARP_C = [3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 4, 3];
const LEAD_A = [4, -1, -1, 3, -1, 2, -1, -1, 4, -1, 5, -1, 3, -1, -1, -1];
const LEAD_B = [-1, 2, -1, -1, 3, -1, 4, -1, -1, 5, -1, -1, 4, -1, 3, 2];
const LEAD_C = [5, -1, 4, -1, 3, -1, 4, -1, 5, -1, -1, 5, 6, -1, 5, -1];

const SEC_FLOW: Sec[] = [
  { prog: 0, kick: true, hat: 1, clap: false, bass: true, arp: false, pad: true, lead: false },
  { prog: 0, kick: true, hat: 2, clap: true, bass: true, arp: true, pad: true, lead: false },
  { prog: 1, kick: false, hat: 1, clap: false, bass: false, arp: true, pad: true, lead: true },
  { prog: 1, kick: true, hat: 2, clap: true, bass: true, arp: true, pad: true, lead: true, roll: true },
];

const TRACKS: Record<MusicMode, Track> = {
  base: {
    bpm: 112,
    progs: [
      [m(41), M(37), M(44), M(39)],
      [M(37), M(39), m(41), M(36)],
    ],
    sections: SEC_FLOW,
    bass: [BASS_A, BASS_B],
    arp: [ARP_A, ARP_B],
    lead: [LEAD_A, LEAD_B],
    wave: { bass: "sawtooth", arp: "square", lead: "sawtooth" },
    dist: false,
    level: 1,
  },
  overdrive: {
    bpm: 134,
    progs: [
      [m(40), M(36), M(43), M(38)],
      [M(36), M(38), m(40), M(35)],
    ],
    sections: [
      { prog: 0, kick: true, hat: 2, clap: true, bass: true, arp: true, pad: true, lead: false },
      { prog: 0, kick: true, hat: 2, clap: true, bass: true, arp: true, pad: true, lead: true },
      { prog: 1, kick: false, hat: 1, clap: false, bass: true, arp: true, pad: true, lead: true },
      { prog: 1, kick: true, hat: 2, clap: true, bass: true, arp: true, pad: true, lead: true, roll: true },
    ],
    bass: [BASS_C, BASS_B],
    arp: [ARP_C, ARP_A],
    lead: [LEAD_C, LEAD_A],
    wave: { bass: "sawtooth", arp: "sawtooth", lead: "square" },
    dist: true,
    level: 1.05,
  },
  celebrate: {
    bpm: 126,
    progs: [
      [M(36), M(43), m(45), M(41)],
      [M(41), M(43), M(36), M(36)],
    ],
    sections: [
      { prog: 0, kick: true, hat: 2, clap: true, bass: true, arp: true, pad: true, lead: true },
      { prog: 1, kick: true, hat: 2, clap: true, bass: true, arp: true, pad: true, lead: true, roll: true },
      { prog: 0, kick: true, hat: 2, clap: true, bass: true, arp: true, pad: true, lead: true },
      { prog: 1, kick: true, hat: 2, clap: true, bass: true, arp: true, pad: true, lead: true, roll: true },
    ],
    bass: [BASS_A, BASS_C],
    arp: [ARP_C, ARP_B],
    lead: [LEAD_C, LEAD_C],
    wave: { bass: "sawtooth", arp: "square", lead: "sawtooth" },
    dist: false,
    level: 1.05,
  },
};

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const MUSIC_LEVEL = 0.3;
const SPEAK: Record<string, string> = {
  big: "Big win!",
  super: "Super win!",
  mega: "Mega win!",
  jackpot: "Jackpot! Overdrive jackpot!",
  bonus: "Hold and respin!",
  overdrive: "Overdrive engaged!",
  grand: "Grand! Full grid!",
  collect: "Collecting cores.",
};
export type VoiceLine = keyof typeof SPEAK;

interface ToneOpts { type?: Wave; gain?: number; at?: number; to?: number; wet?: number; q?: number; cutoff?: number }

export class NeonAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private duckBus!: GainNode;
  private sfxBus!: GainNode;
  private padBus!: GainNode;
  private musicIn!: GainNode;
  private delayIn!: GainNode;
  private verbIn!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private shaper: WaveShaperNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step = 0;
  private playing = false;
  private mode: MusicMode = "base";
  private hum: { stop: () => void } | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private duckUntil = 0;

  musicOn = true;
  soundOn = true;

  /** Create the context; call from a user gesture (or on mount and hope it is allowed). */
  unlock(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      this.master.connect(comp).connect(ctx.destination);

      this.duckBus = ctx.createGain();
      this.duckBus.connect(this.master);
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.musicOn ? 1 : 0;
      this.musicBus.connect(this.duckBus);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = this.soundOn ? 1 : 0;
      this.sfxBus.connect(this.master);

      // music chain: dry + dotted-eighth delay; pads go through a pumping gain
      this.musicIn = ctx.createGain();
      this.musicIn.connect(this.musicBus);
      this.padBus = ctx.createGain();
      this.padBus.connect(this.musicIn);
      this.delayIn = ctx.createGain();
      const delay = ctx.createDelay(1.2);
      delay.delayTime.value = 0.402;
      const fb = ctx.createGain();
      fb.gain.value = 0.34;
      const dlp = ctx.createBiquadFilter();
      dlp.type = "lowpass";
      dlp.frequency.value = 2600;
      const wet = ctx.createGain();
      wet.gain.value = 0.3;
      this.delayIn.connect(delay);
      delay.connect(dlp).connect(fb).connect(delay);
      dlp.connect(wet).connect(this.musicIn);

      // short reverb for effects
      const conv = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 1.5);
      const imp = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = imp.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      conv.buffer = imp;
      this.verbIn = ctx.createGain();
      const verbOut = ctx.createGain();
      verbOut.gain.value = 0.5;
      this.verbIn.connect(conv).connect(verbOut).connect(this.sfxBus);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  get running() {
    return !!this.ctx && this.ctx.state === "running";
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setTargetAtTime(on ? 1 : 0, t, 0.15);
    if (on) this.startMusic();
  }
  setSound(on: boolean) {
    this.soundOn = on;
    if (!on) this.spinEnd();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sfxBus.gain.cancelScheduledValues(t);
    this.sfxBus.gain.setTargetAtTime(on ? 1 : 0, t, 0.05);
    if (!on && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }
  suspend() {
    if (this.ctx?.state === "running") void this.ctx.suspend().catch(() => {});
  }
  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume().catch(() => {});
  }

  /* ------------------------------------------------------------- music */
  startMusic() {
    const ctx = this.unlock();
    if (!ctx || this.playing) return;
    this.playing = true;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.12;
    this.musicIn.gain.cancelScheduledValues(ctx.currentTime);
    this.musicIn.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.musicIn.gain.linearRampToValueAtTime(MUSIC_LEVEL, ctx.currentTime + 2.2);
    this.timer = setInterval(() => this.pump(), 40);
  }
  stopMusic() {
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  /** Switch track. Takes effect at the next step; the bar counter restarts so the new track opens on its intro. */
  setMode(mode: MusicMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.step = 0;
    if (this.ctx) this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05);
  }
  duck(seconds: number, depth = 0.3) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.duckBus.gain;
    this.duckUntil = Math.max(this.duckUntil, t + seconds);
    g.cancelScheduledValues(t);
    g.setTargetAtTime(depth, t, 0.08);
    g.setTargetAtTime(1, this.duckUntil, 0.5);
  }

  private pump() {
    const ctx = this.ctx;
    if (!ctx || !this.playing) return;
    const tr = TRACKS[this.mode];
    const dur = 60 / tr.bpm / 4;
    let guard = 0;
    while (this.nextTime < ctx.currentTime + 0.2 && guard++ < 64) {
      this.scheduleStep(tr, this.step, this.nextTime, dur);
      this.nextTime += dur;
      this.step++;
    }
  }

  private scheduleStep(tr: Track, step: number, t: number, dur: number) {
    const bar = Math.floor(step / 16) % 16;
    const s = step % 16;
    const sec = tr.sections[Math.floor(bar / 4)];
    const chord = tr.progs[sec.prog][bar % 4];
    const third = chord.q === "m" ? 3 : 4;
    const variant = bar % 2;
    const beat = dur * 4;
    const lvl = tr.level;

    if (s === 0) {
      if (sec.pad) this.pad(t, chord, third, dur * 16);
      if (bar % 4 === 3 && Math.floor(bar / 4) % 2 === 0) this.riser(t, dur * 16, 0.05);
      if (bar % 4 === 0 && bar > 0) this.crash(t);
    }
    if (sec.kick && s % 4 === 0) {
      this.kick(t, 0.9 * lvl);
      this.padBus.gain.setValueAtTime(0.3, t);
      this.padBus.gain.linearRampToValueAtTime(1, t + beat * 0.92);
    }
    if (sec.roll && bar % 4 === 3 && s >= 8) {
      if (s % 2 === 0 || s >= 12) this.snare(t, 0.26 + (s - 8) * 0.02);
    } else if (sec.clap && (s === 4 || s === 12)) this.snare(t, 0.5);
    if (sec.hat) {
      if (s % 4 === 2) this.hat(t, true, 0.12 * lvl);
      else if (sec.hat === 2 || s % 2 === 0) this.hat(t, false, s % 2 ? 0.04 : 0.07);
    }
    if (sec.bass) {
      const p = tr.bass[variant][s];
      if (p) this.bass(t, chord.root + (p === 2 ? 12 : 0), dur * (p === 2 ? 0.8 : 1.4), tr);
    }
    if (sec.arp) {
      const idx = tr.arp[variant][s];
      const tones = [chord.root + 24, chord.root + 24 + third, chord.root + 31, chord.root + 36, chord.root + 36 + third];
      if (!(s % 4 === 3 && variant === 1)) this.arp(t, tones[idx], dur, tr, bar);
    }
    if (sec.lead) {
      const idx = tr.lead[(bar >> 1) % 2][s];
      if (idx >= 0) {
        const tones = [chord.root + 36, chord.root + 36 + third, chord.root + 43, chord.root + 48, chord.root + 48 + third, chord.root + 50, chord.root + 55];
        this.lead(t, tones[Math.min(idx, tones.length - 1)], dur * 2.2, tr);
      }
    }
  }

  /* ----------------------------------------------------- music instruments */
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
  private curve() {
    if (!this.shaper && this.ctx) {
      const sh = this.ctx.createWaveShaper();
      const n = 1024;
      const c = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(x * 3.2);
      }
      sh.curve = c;
      sh.oversample = "2x";
      this.shaper = sh;
    }
    return this.shaper;
  }

  private kick(t: number, v: number) {
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g).connect(this.musicIn);
    o.start(t);
    o.stop(t + 0.36);
    this.nz(this.musicIn, t, 0.02, 0.18 * v, "highpass", 3000, 0);
  }
  private snare(t: number, v: number) {
    this.nz(this.musicIn, t, 0.2, v * 0.55, "bandpass", 1900, 0, 0.7);
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.1);
    g.gain.setValueAtTime(v * 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(this.musicIn);
    o.start(t);
    o.stop(t + 0.14);
    this.nz(this.delayIn, t, 0.12, v * 0.12, "bandpass", 2400, 0);
  }
  private hat(t: number, open: boolean, v: number) {
    this.nz(this.musicIn, t, open ? 0.16 : 0.035, v, "highpass", 7200, 0);
  }
  private crash(t: number) {
    this.nz(this.musicIn, t, 1.3, 0.14, "highpass", 4500, 0);
  }
  private riser(t: number, dur: number, v: number) {
    const c = this.ctx!;
    const nb = this.noise();
    if (!nb) return;
    const src = c.createBufferSource();
    src.buffer = nb;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 2;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(7000, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + dur * 0.95);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.musicIn);
    src.start(t);
    src.stop(t + dur + 0.05);
  }
  private nz(bus: AudioNode, t: number, dur: number, v: number, type: BiquadFilterType, f0: number, f1: number, q = 0.9) {
    const c = this.ctx!;
    const nb = this.noise();
    if (!nb) return;
    const src = c.createBufferSource();
    src.buffer = nb;
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.value = f0;
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + Math.min(0.01, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(t, Math.random());
    src.stop(t + dur + 0.04);
  }
  private bass(t: number, midi: number, dur: number, tr: Track) {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = tr.wave.bass;
    o.frequency.value = hz(midi);
    const sub = c.createOscillator();
    sub.type = "sine";
    sub.frequency.value = hz(midi);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 6;
    f.frequency.setValueAtTime(220, t);
    f.frequency.exponentialRampToValueAtTime(tr.dist ? 1400 : 900, t + 0.025);
    f.frequency.exponentialRampToValueAtTime(190, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.34, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    const sh = tr.dist ? this.curve() : null;
    if (sh) {
      const pre = c.createGain();
      pre.gain.value = 0.7;
      f.connect(pre).connect(sh).connect(g);
    } else f.connect(g);
    sub.connect(g);
    g.connect(this.musicIn);
    o.start(t);
    sub.start(t);
    o.stop(t + dur + 0.05);
    sub.stop(t + dur + 0.05);
  }
  private arp(t: number, midi: number, dur: number, tr: Track, bar: number) {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = tr.wave.arp;
    o.frequency.value = hz(midi);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 4;
    const sweep = 1200 + ((Math.sin((bar / 16) * Math.PI * 2) + 1) / 2) * 3800;
    f.frequency.setValueAtTime(sweep, t);
    f.frequency.exponentialRampToValueAtTime(sweep * 0.3, t + dur * 1.4);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.085, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.5);
    o.connect(f).connect(g);
    g.connect(this.musicIn);
    const send = c.createGain();
    send.gain.value = 0.55;
    g.connect(send).connect(this.delayIn);
    o.start(t);
    o.stop(t + dur * 1.6);
  }
  private pad(t: number, chord: Chord, third: number, dur: number) {
    const c = this.ctx!;
    const notes = [chord.root + 24, chord.root + 24 + third, chord.root + 31];
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(500, t);
    f.frequency.linearRampToValueAtTime(2200, t + dur * 0.6);
    f.frequency.linearRampToValueAtTime(700, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.5);
    g.gain.setValueAtTime(0.08, t + dur - 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.2);
    f.connect(g).connect(this.padBus);
    notes.forEach((n) =>
      [-7, 7].forEach((det) => {
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = hz(n);
        o.detune.value = det;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 0.3);
      }),
    );
  }
  private lead(t: number, midi: number, dur: number, tr: Track) {
    const c = this.ctx!;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 3600;
    const lfo = c.createOscillator();
    lfo.frequency.value = 5.5;
    const lg = c.createGain();
    lg.gain.value = 9;
    lfo.connect(lg);
    [-6, 6].forEach((d) => {
      const o = c.createOscillator();
      o.type = tr.wave.lead;
      o.frequency.value = hz(midi);
      o.detune.value = d;
      lg.connect(o.detune);
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
    f.connect(g);
    g.connect(this.musicIn);
    const send = c.createGain();
    send.gain.value = 0.6;
    g.connect(send).connect(this.delayIn);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
  }

  /* ----------------------------------------------------------- effects */
  private tone(freq: number, dur: number, o: ToneOpts = {}) {
    const c = this.unlock();
    if (!c || !this.soundOn) return;
    const t = c.currentTime + (o.at ?? 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.12, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = osc;
    if (o.cutoff) {
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = o.cutoff;
      osc.connect(f);
      node = f;
    }
    node.connect(g).connect(this.sfxBus);
    if (o.wet) {
      const w = c.createGain();
      w.gain.value = o.wet;
      g.connect(w).connect(this.verbIn);
    }
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }
  private burst(dur: number, gain: number, from: number, to: number, at = 0, q = 0.9, type: BiquadFilterType = "bandpass", wet = 0) {
    const c = this.unlock();
    const nb = this.noise();
    if (!c || !nb || !this.soundOn) return;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = nb;
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.03, dur * 0.35));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    if (wet) {
      const w = c.createGain();
      w.gain.value = wet;
      g.connect(w).connect(this.verbIn);
    }
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  click() {
    this.tone(760, 0.05, { type: "triangle", gain: 0.07 });
    this.tone(1240, 0.03, { type: "square", gain: 0.02 });
  }
  boot() {
    this.tone(60, 1.4, { type: "sawtooth", gain: 0.1, to: 220, cutoff: 600 });
    this.burst(1.2, 0.1, 200, 6000, 0, 1.4, "bandpass", 0.2);
    [0, 0.18, 0.36, 0.54].forEach((d, i) => this.tone(660 * Math.pow(1.26, i), 0.2, { type: "square", gain: 0.03, at: 0.9 + d }));
    this.tone(110, 0.9, { type: "sine", gain: 0.25, at: 1.6, to: 40 });
  }

  spinStart() {
    const c = this.unlock();
    if (!c || !this.soundOn) return;
    this.spinEnd();
    this.burst(0.7, 0.16, 300, 3800, 0, 1.2, "bandpass", 0.15);
    this.tone(70, 0.7, { type: "sawtooth", gain: 0.07, to: 260, cutoff: 700 });
    // a rolling hum: detuned saws through a wobbling low-pass
    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    o1.type = o2.type = "sawtooth";
    o1.frequency.value = 55;
    o2.frequency.value = 55.8;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 420;
    const lfo = c.createOscillator();
    lfo.frequency.value = 7;
    const lg = c.createGain();
    lg.gain.value = 160;
    lfo.connect(lg).connect(f.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.linearRampToValueAtTime(0.06, c.currentTime + 0.3);
    o1.connect(f);
    o2.connect(f);
    f.connect(g).connect(this.sfxBus);
    o1.start();
    o2.start();
    lfo.start();
    this.hum = {
      stop: () => {
        const t = c.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setTargetAtTime(0.0001, t, 0.06);
        setTimeout(() => {
          try {
            o1.stop();
            o2.stop();
            lfo.stop();
          } catch {}
        }, 400);
      },
    };
    this.ticker = setInterval(() => this.tone(1000 + Math.random() * 500, 0.02, { type: "square", gain: 0.012 }), 75);
  }
  spinEnd() {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    this.hum?.stop();
    this.hum = null;
  }
  reelStop(i: number) {
    this.tone(150 - i * 8, 0.2, { type: "sine", gain: 0.26, to: 46 });
    this.tone(520 + i * 70, 0.07, { type: "sawtooth", gain: 0.05, to: 160, cutoff: 3000 });
    this.burst(0.07, 0.15, 3200, 900);
  }
  anticipate(seconds: number) {
    this.burst(seconds, 0.12, 400, 6500, 0, 2, "bandpass", 0.3);
    this.tone(200, seconds, { type: "sawtooth", gain: 0.05, to: 1200, cutoff: 1800 });
  }
  orbLand(count: number) {
    const notes = [880, 1109, 1319, 1568, 1760, 2093, 2349];
    const f = notes[Math.min(count, notes.length) - 1] ?? 880;
    this.tone(f, 0.7, { type: "sine", gain: 0.1, wet: 0.5 });
    this.tone(f * 2.01, 0.5, { type: "triangle", gain: 0.04, at: 0.03 });
    this.tone(95, 0.3, { type: "sine", gain: 0.3, to: 40 });
    this.burst(0.4, 0.05, 3000, 9000, 0, 1, "bandpass", 0.3);
  }
  orbLock(k: number) {
    const pent = [523, 587, 659, 784, 880, 1047, 1175, 1319];
    const f = pent[k % pent.length] * (k >= 8 ? 2 : 1);
    this.burst(0.14, 0.2, 2400, 7000, 0, 1.4);
    this.tone(180, 0.1, { type: "square", gain: 0.05, to: 1400 });
    this.tone(f, 0.5, { type: "triangle", gain: 0.1, wet: 0.4 });
    this.tone(70, 0.28, { type: "sine", gain: 0.34, to: 36 });
  }
  zap() {
    this.burst(0.18, 0.16, 6000, 1400, 0, 2.2);
    this.tone(1800, 0.12, { type: "sawtooth", gain: 0.04, to: 260, cutoff: 5000 });
  }
  respin() {
    this.burst(0.55, 0.14, 500, 4200, 0, 1.2, "bandpass", 0.2);
    this.tone(180, 0.5, { type: "sawtooth", gain: 0.05, to: 700, cutoff: 1500 });
  }
  charge(level: number) {
    this.tone(320 + level * 900, 0.25, { type: "sine", gain: 0.06, to: 480 + level * 1300, wet: 0.3 });
  }
  overdrive() {
    this.duck(3.4, 0.2);
    this.burst(1.6, 0.22, 150, 9000, 0, 1.6, "bandpass", 0.3);
    this.tone(50, 1.5, { type: "sawtooth", gain: 0.12, to: 440, cutoff: 900 });
    [0, 0.3, 0.6, 0.9, 1.2].forEach((d, i) => this.tone(330 * Math.pow(1.19, i * 2), 0.35, { type: "square", gain: 0.045, at: d, wet: 0.3 }));
    this.tone(48, 1.4, { type: "sine", gain: 0.4, at: 1.55, to: 30 });
    this.burst(0.9, 0.3, 4000, 100, 1.55, 0.8, "lowpass", 0.4);
    [110, 164.8, 220, 329.6].forEach((f) => this.tone(f, 1.2, { type: "sawtooth", gain: 0.07, at: 1.55, cutoff: 1600, wet: 0.4 }));
  }
  bonusTrigger() {
    this.duck(2.6, 0.25);
    [523, 659, 784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.55, { type: "square", gain: 0.05, at: i * 0.09, wet: 0.4, cutoff: 5000 }));
    this.tone(55, 0.9, { type: "sine", gain: 0.4, to: 30 });
    this.burst(0.8, 0.14, 800, 8000, 0, 1.2, "bandpass", 0.3);
  }
  collectTick(i: number) {
    const f = 440 * Math.pow(2, (i % 12) / 12) * (i >= 12 ? 2 : 1);
    this.zap();
    this.tone(f, 0.28, { type: "triangle", gain: 0.1, wet: 0.35 });
  }
  lineChime(k: number) {
    const base = [659, 784, 880, 988, 1175][k % 5];
    this.tone(base, 0.4, { type: "sine", gain: 0.1, wet: 0.3 });
    this.tone(base * 2, 0.3, { type: "triangle", gain: 0.04, at: 0.04 });
    this.burst(0.3, 0.05, 2000, 8000, 0, 1.2);
  }
  impact(n: number) {
    this.tone(70, 0.5, { type: "sine", gain: 0.12 + n * 0.07, to: 32 });
    this.burst(0.3, 0.05 + n * 0.03, 240, 60, 0, 0.8, "lowpass");
  }
  rumble(seconds: number, n: number) {
    const c = this.unlock();
    const nb = this.noise();
    if (!c || !nb || !this.soundOn) return;
    const t = c.currentTime;
    const end = t + Math.max(1.5, seconds);
    const src = c.createBufferSource();
    src.buffer = nb;
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 150;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09 + n * 0.04, t + 0.2);
    g.gain.setValueAtTime(0.09 + n * 0.04, end - 0.8);
    g.gain.linearRampToValueAtTime(0.0001, end);
    src.connect(lp).connect(g).connect(this.sfxBus);
    src.start(t);
    src.stop(end + 0.1);
    this.tone(40, end - t, { type: "sine", gain: 0.1 + n * 0.03 });
  }
  crackle(seconds: number, density = 8) {
    for (let i = 0; i < seconds * density; i++) {
      const at = Math.random() * seconds;
      this.burst(0.05 + Math.random() * 0.06, 0.05 + Math.random() * 0.05, 5000 + Math.random() * 4000, 1500, at, 3);
    }
  }
  tally() {
    this.tone(1318, 0.25, { type: "sine", gain: 0.08, wet: 0.3 });
    this.tone(1760, 0.3, { type: "sine", gain: 0.06, at: 0.07, wet: 0.3 });
    this.tone(2349, 0.4, { type: "sine", gain: 0.05, at: 0.14, wet: 0.4 });
  }
  /** Count-up ticks while the win amount runs. */
  countTicks(seconds: number) {
    const n = Math.min(40, Math.floor(seconds * 9));
    for (let i = 0; i < n; i++) this.tone(900 + (i / n) * 1500, 0.04, { type: "square", gain: 0.02, at: (i / n) * seconds });
  }
  sting(level: "win" | "big" | "super" | "mega" | "jackpot" | "bonus") {
    const chords: Record<string, number[][]> = {
      win: [[659, 784, 988]],
      bonus: [[523, 659, 784], [659, 784, 988], [784, 988, 1175]],
      big: [[523, 659, 784], [784, 988, 1175]],
      super: [[523, 659, 784], [659, 784, 988], [880, 1109, 1319]],
      mega: [[440, 554, 659], [554, 659, 831], [659, 831, 988], [880, 1109, 1319]],
      jackpot: [[392, 494, 587], [494, 587, 740], [587, 740, 880], [784, 988, 1175], [988, 1175, 1480]],
    };
    const seq = chords[level];
    if (level !== "win") this.duck(1.4 + seq.length * 0.3, 0.25);
    seq.forEach((ch, i) =>
      ch.forEach((f) => this.tone(f, 0.7, { type: "sawtooth", gain: 0.05, at: i * 0.17, cutoff: 3800, wet: 0.35 })),
    );
    if (level !== "win") this.tone(60, 0.8, { type: "sine", gain: 0.3, to: 30 });
    this.burst(0.8, 0.1, 500, 9000, 0, 1.2, "bandpass", 0.3);
  }

  /** Announcer: browser speech where available (low, robotic), otherwise a synthetic vocal stab. */
  voice(line: VoiceLine) {
    if (!this.soundOn) return;
    const text = SPEAK[line];
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    this.duck(1.8, 0.22);
    if (synth && typeof SpeechSynthesisUtterance !== "undefined") {
      try {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const voices = synth.getVoices();
        u.voice = voices.find((v) => /en[-_]US/i.test(v.lang) && /david|mark|guy|google us|male/i.test(v.name)) ?? voices.find((v) => /^en/i.test(v.lang)) ?? null;
        u.pitch = 0.45;
        u.rate = 0.9;
        u.volume = 0.95;
        synth.speak(u);
        return;
      } catch {}
    }
    [180, 150, 210].forEach((f, i) => this.tone(f, 0.22, { type: "sawtooth", gain: 0.09, at: i * 0.2, cutoff: 1100, wet: 0.3 }));
  }

  destroy() {
    this.spinEnd();
    this.stopMusic();
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    const c = this.ctx;
    this.ctx = null;
    if (c) setTimeout(() => void c.close().catch(() => {}), 800);
  }
}
