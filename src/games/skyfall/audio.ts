/**
 * SKYFALL audio (Web Audio, no asset files).
 *
 * Two buses with their own switches: music (a generative navy/cyan electronic bed) and sound (effects and stingers).
 * The context is created lazily and may stay suspended until the first user gesture; `onStateChange` lets the UI
 * show an "enable sound" prompt, and music starts by itself as soon as the context is allowed to run.
 */
const MUSIC_LEVEL = 0.2;
const MUSIC_DUCKED = 0.06;
const BPM = 104;
const STEP = 60 / BPM / 4; // one sixteenth note, in seconds
const LOOKAHEAD = 0.2;
const MAX_VOICES = 48;

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type Chord = { root: number; tones: number[] };
const minor = (root: number): Chord => ({ root, tones: [0, 3, 7, 10] });
const major = (root: number): Chord => ({ root, tones: [0, 4, 7, 11] });
// four-chord progressions, two bars per chord; the song walks through them in sections so it keeps evolving
const PROGRESSIONS: Chord[][] = [
  [minor(57), major(53), major(48), major(55)],
  [minor(57), major(55), major(53), minor(52)],
  [minor(50), major(58), major(53), major(48)],
];
const SECTION_ORDER = [0, 1, 0, 2, 1, 2];

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  at?: number;
  to?: number;
  attack?: number;
}
interface Flight {
  gain: GainNode;
  wind: AudioBufferSourceNode;
  windFilter: BiquadFilterNode;
  windGain: GainNode;
  hum: OscillatorNode;
  hum2: OscillatorNode;
  humFilter: BiquadFilterNode;
  stopped: boolean;
}

export class SkyfallAudio {
  musicOn = true;
  soundOn = true;
  onStateChange?: () => void;

  private ctx: AudioContext | null = null;
  private musicBus: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private arpSend: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step = 0;
  private wantMusic = false;
  private energy = 0;
  private energyTarget = 0;
  private duckUntil = 0;
  private voices = 0;
  private flight: Flight | null = null;
  private lastFlightUpdate = 0;

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

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.musicOn ? 1 : 0;
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = MUSIC_LEVEL;
      this.musicBus.connect(this.musicGain).connect(master);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = this.soundOn ? 1 : 0;
      this.sfxBus.connect(master);

      // pad filter and the arp's feedback delay (dotted eighth)
      this.padFilter = ctx.createBiquadFilter();
      this.padFilter.type = "lowpass";
      this.padFilter.frequency.value = 600;
      this.padFilter.Q.value = 0.7;
      this.padFilter.connect(this.musicBus);
      const delay = ctx.createDelay(1);
      delay.delayTime.value = STEP * 3;
      const fb = ctx.createGain();
      fb.gain.value = 0.38;
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 2600;
      const wet = ctx.createGain();
      wet.gain.value = 0.4;
      this.arpSend = ctx.createGain();
      this.arpSend.connect(delay);
      delay.connect(tone).connect(fb).connect(delay);
      tone.connect(wet).connect(this.musicBus);

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
      this.musicBus.gain.setTargetAtTime(on ? 1 : 0, t, 0.15);
    }
    if (on) this.startMusic();
  }

  setSound(on: boolean) {
    this.soundOn = on;
    if (!on) this.flightStop();
    if (this.ctx && this.sfxBus) {
      const t = this.ctx.currentTime;
      this.sfxBus.gain.cancelScheduledValues(t);
      this.sfxBus.gain.setTargetAtTime(on ? 1 : 0, t, 0.05);
    }
  }

  /** Begin the background music (idempotent). If the context is still locked it starts the moment it is allowed. */
  startMusic() {
    this.wantMusic = true;
    this.unlock();
    if (this.running && this.musicOn) this.beginScheduler();
  }

  /** 0..1: more arp, more hats and a brighter pad while the aircraft climbs. */
  setMusicEnergy(level: number) {
    this.energyTarget = clamp(level, 0, 1);
  }

  /** Pull the music down for `seconds` so a stinger can lead. */
  duck(seconds: number) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    const g = this.musicGain.gain;
    this.duckUntil = Math.max(this.duckUntil, t + seconds);
    g.cancelScheduledValues(t);
    g.setTargetAtTime(MUSIC_DUCKED, t, 0.06);
    g.setTargetAtTime(MUSIC_LEVEL, this.duckUntil, 0.45);
  }

  suspend() {
    if (this.ctx?.state === "running") void this.ctx.suspend().catch(() => {});
  }
  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume().catch(() => {});
  }

  destroy() {
    this.wantMusic = false;
    this.stopScheduler();
    this.flightStop();
    const c = this.ctx;
    this.ctx = null;
    if (c) {
      c.onstatechange = null;
      void c.close().catch(() => {});
    }
  }

  /* ------------------------------ music ------------------------------ */
  private beginScheduler() {
    const c = this.ctx;
    if (!c || this.timer) return;
    this.nextTime = c.currentTime + 0.08;
    this.timer = setInterval(() => this.tick(), 25);
  }
  private stopScheduler() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick() {
    const c = this.ctx;
    if (!c || !this.musicOn) return this.stopScheduler();
    if (c.state !== "running") return;
    this.energy += (this.energyTarget - this.energy) * 0.06;
    this.padFilter?.frequency.setTargetAtTime(520 + this.energy * 2100, c.currentTime, 0.2);
    if (this.nextTime < c.currentTime - 0.5) this.nextTime = c.currentTime + 0.05; // after a long stall, don't burst
    while (this.nextTime < c.currentTime + LOOKAHEAD) {
      this.scheduleStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step++;
    }
  }

  private scheduleStep(step: number, t: number) {
    const bar = Math.floor(step / 16);
    const chordIdx = Math.floor(bar / 2);
    const section = Math.floor(chordIdx / 4);
    const prog = PROGRESSIONS[SECTION_ORDER[section % SECTION_ORDER.length]];
    const chord = prog[chordIdx % 4];
    const s = step % 16;
    const e = this.energy;

    if (step % 32 === 0) this.pad(chord, t);
    if (s === 0 || (s === 10 && bar % 2 === 1)) this.sub(chord.root - 24, t, s === 0 ? 0.5 : 0.35);
    if (s % 4 === 0) this.kick(t, 0.32 + e * 0.12);
    if (s % 4 === 2 || (e > 0.45 && s % 2 === 1)) this.hat(t, 0.025 + e * 0.03);

    // arp: sparse while waiting, busier in flight; the pattern flips every other eight-bar section
    const dense = e > 0.2;
    if (dense ? s % 2 === 0 : s % 4 === 0) {
      const pat = section % 2 === 0 ? [0, 1, 2, 3, 2, 1, 3, 2] : [0, 2, 1, 3, 1, 2, 3, 1];
      const n = pat[(s >> 1) % pat.length];
      const tone = chord.tones[n % chord.tones.length] + (n > 1 ? 24 : 12);
      this.pluck(hz(chord.root + tone), t, 0.035 + e * 0.04);
    }
  }

  private mix(node: AudioNode, bus: AudioNode | null) {
    if (bus) node.connect(bus);
  }

  private pad(chord: Chord, t: number) {
    const c = this.ctx;
    if (!c) return;
    const dur = STEP * 32;
    for (const iv of chord.tones.slice(0, 3)) {
      for (const detune of [-7, 7]) {
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = hz(chord.root + 12 + iv);
        o.detune.value = detune;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.035, t + 1.4);
        g.gain.setValueAtTime(0.035, t + dur - 0.2);
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.2);
        o.connect(g);
        this.mix(g, this.padFilter);
        o.start(t);
        o.stop(t + dur + 1.3);
      }
    }
  }

  private sub(midi: number, t: number, level: number) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = hz(midi);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + STEP * 7);
    o.connect(g);
    this.mix(g, this.musicBus);
    o.start(t);
    o.stop(t + STEP * 7 + 0.05);
  }

  private kick(t: number, level: number) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.13);
    const g = c.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g);
    this.mix(g, this.musicBus);
    o.start(t);
    o.stop(t + 0.25);
  }

  private hat(t: number, level: number) {
    const c = this.ctx;
    const nb = this.noise();
    if (!c || !nb) return;
    const src = c.createBufferSource();
    src.buffer = nb;
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7200;
    const g = c.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(f).connect(g);
    this.mix(g, this.musicBus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + 0.07);
  }

  private pluck(freq: number, t: number, level: number) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g);
    this.mix(g, this.musicBus);
    this.mix(g, this.arpSend);
    o.start(t);
    o.stop(t + 0.22);
  }

  /* --------------------------- effect helpers --------------------------- */
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

  private ready(): AudioContext | null {
    return this.ctx && this.sfxBus && this.soundOn && this.ctx.state === "running" && this.voices < MAX_VOICES ? this.ctx : null;
  }

  private tone(freq: number, dur: number, o: ToneOpts = {}) {
    const c = this.ready();
    if (!c || !this.sfxBus) return;
    const t = c.currentTime + (o.at ?? 0);
    const osc = c.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.1, t + (o.attack ?? 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.sfxBus);
    this.voices++;
    osc.onended = () => (this.voices = Math.max(0, this.voices - 1));
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  private burst(dur: number, gain: number, from: number, to: number, o: { type?: BiquadFilterType; at?: number; q?: number; peak?: number } = {}) {
    const c = this.ready();
    const nb = this.noise();
    if (!c || !nb || !this.sfxBus) return;
    const t = c.currentTime + (o.at ?? 0);
    const src = c.createBufferSource();
    src.buffer = nb;
    const f = c.createBiquadFilter();
    f.type = o.type ?? "bandpass";
    f.Q.value = o.q ?? 0.9;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain();
    const peak = clamp(o.peak ?? 0.12, 0.01, 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * peak);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    this.voices++;
    src.onended = () => (this.voices = Math.max(0, this.voices - 1));
    src.start(t, Math.random() * 1.2);
    src.stop(t + dur + 0.05);
  }

  /* -------------------------------- effects -------------------------------- */
  click() {
    this.tone(700, 0.05, { type: "triangle", gain: 0.06 });
    this.tone(1100, 0.03, { gain: 0.025 });
  }
  bet() {
    this.tone(520, 0.08, { type: "triangle", gain: 0.08 });
    this.tone(780, 0.11, { type: "triangle", gain: 0.08, at: 0.06 });
  }
  cancel() {
    this.tone(520, 0.14, { type: "triangle", gain: 0.07, to: 300 });
  }
  countdown(n: number) {
    if (n <= 1) {
      this.tone(1320, 0.26, { gain: 0.1 });
      this.tone(660, 0.26, { type: "triangle", gain: 0.05 });
    } else this.tone(880, 0.07, { type: "triangle", gain: 0.07 });
  }

  /** Turbine spool-up. */
  engineStart() {
    const c = this.ready();
    if (!c || !this.sfxBus) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(55, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 1.3);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(2400, t + 1.3);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.9);
    g.gain.linearRampToValueAtTime(0.0001, t + 1.4);
    o.connect(f).connect(g).connect(this.sfxBus);
    this.voices++;
    o.onended = () => (this.voices = Math.max(0, this.voices - 1));
    o.start(t);
    o.stop(t + 1.45);
    this.burst(1.3, 0.05, 300, 2600, { q: 1.2, peak: 0.7 });
  }

  /** Whoosh and rising thrust. */
  takeoff() {
    this.burst(1.5, 0.2, 280, 3400, { type: "lowpass", q: 0.7, peak: 0.45 });
    this.tone(90, 1.5, { type: "sawtooth", gain: 0.07, to: 230, attack: 0.3 });
    this.tone(48, 1.4, { gain: 0.16, to: 92, attack: 0.2 });
  }

  /* continuous flying ambience: wind plus an engine hum that rise with the multiplier */
  flightStart() {
    const c = this.ready();
    const nb = this.noise();
    if (!c || !nb || !this.sfxBus || this.flight) return;
    const t = c.currentTime;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(1, t + 0.5);
    gain.connect(this.sfxBus);
    const wind = c.createBufferSource();
    wind.buffer = nb;
    wind.loop = true;
    const windFilter = c.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 500;
    windFilter.Q.value = 0.8;
    const windGain = c.createGain();
    windGain.gain.value = 0.05;
    wind.connect(windFilter).connect(windGain).connect(gain);
    const humFilter = c.createBiquadFilter();
    humFilter.type = "lowpass";
    humFilter.frequency.value = 600;
    const humGain = c.createGain();
    humGain.gain.value = 0.045;
    const hum = c.createOscillator();
    hum.type = "sawtooth";
    hum.frequency.value = 70;
    const hum2 = c.createOscillator();
    hum2.type = "square";
    hum2.frequency.value = 35.4;
    hum.connect(humFilter);
    hum2.connect(humFilter);
    humFilter.connect(humGain).connect(gain);
    wind.start();
    hum.start();
    hum2.start();
    this.flight = { gain, wind, windFilter, windGain, hum, hum2, humFilter, stopped: false };
    this.lastFlightUpdate = 0;
  }

  flightUpdate(mult: number) {
    const f = this.flight;
    const c = this.ctx;
    if (!f || !c || f.stopped) return;
    const t = c.currentTime;
    if (t - this.lastFlightUpdate < 0.04) return;
    this.lastFlightUpdate = t;
    const x = clamp(Math.log(Math.max(1, mult)) / Math.log(30), 0, 1);
    f.hum.frequency.setTargetAtTime(70 + x * 170, t, 0.12);
    f.hum2.frequency.setTargetAtTime(35.4 + x * 85, t, 0.12);
    f.humFilter.frequency.setTargetAtTime(500 + x * 2400, t, 0.15);
    f.windFilter.frequency.setTargetAtTime(420 + x * 2800, t, 0.15);
    f.windGain.gain.setTargetAtTime(0.05 + x * 0.09, t, 0.15);
  }

  flightStop() {
    const f = this.flight;
    const c = this.ctx;
    if (!f) return;
    this.flight = null;
    f.stopped = true;
    if (!c) return;
    const t = c.currentTime;
    f.gain.gain.cancelScheduledValues(t);
    f.gain.gain.setTargetAtTime(0.0001, t, 0.08);
    setTimeout(() => {
      for (const n of [f.wind, f.hum, f.hum2]) {
        try {
          n.stop();
        } catch {}
      }
      try {
        f.gain.disconnect();
      } catch {}
    }, 450);
  }

  cashout(mult: number) {
    const base = 880 * (1 + clamp(Math.log(Math.max(1, mult)) / Math.log(40), 0, 1) * 0.35);
    [1, 1.25, 1.5, 2].forEach((m, i) => this.tone(base * m, 0.5, { type: "triangle", gain: 0.075, at: i * 0.06 }));
    for (let i = 0; i < 6; i++) this.tone(2400 + Math.random() * 2400, 0.14, { gain: 0.028, at: 0.1 + Math.random() * 0.35 });
    this.duck(0.9);
  }

  crash() {
    this.burst(1.0, 0.5, 2400, 160, { type: "lowpass", q: 0.6, peak: 0.04 });
    this.tone(120, 0.8, { gain: 0.5, to: 32, attack: 0.01 });
    this.burst(1.6, 0.06, 5200, 900, { type: "highpass", at: 0.15, q: 0.5, peak: 0.1 });
    for (let i = 0; i < 5; i++) this.tone(1300 + Math.random() * 2600, 0.45, { type: "square", gain: 0.014, at: 0.1 + i * 0.14 + Math.random() * 0.08 });
    this.duck(1.8);
  }

  roundTransition() {
    this.burst(0.9, 0.07, 300, 2600, { q: 1.1, peak: 0.6 });
    this.tone(220, 0.9, { type: "triangle", gain: 0.05, to: 660, attack: 0.3 });
  }

  results(win: boolean) {
    if (win) [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, { type: "triangle", gain: 0.07, at: i * 0.09 }));
    else {
      this.tone(330, 0.5, { gain: 0.08, to: 247 });
      this.tone(247, 0.55, { gain: 0.07, to: 196, at: 0.14 });
    }
  }
}
