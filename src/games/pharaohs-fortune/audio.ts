/**
 * Audio engine for Pharaoh's Fortune (Web Audio).
 *
 * Two independent buses, each with its own on/off switch:
 *   music  : the looping Egyptian background track
 *   sound  : effects, celebration stings and the announcer voice
 * While a voice line or sting plays, the music ducks so announcements stay clear.
 * The context is created on the first user gesture (browser rule) and files are fetched lazily.
 */
import { AUDIO_FILES, type StingName, type VoiceName } from "./audioManifest";

type Tone = { type?: OscillatorType; gain?: number; at?: number; to?: number };

const MUSIC_LEVEL = 0.26;
const MUSIC_DUCKED = 0.07;

export class PharaohAudio {
  private ctx: AudioContext | null = null;
  private musicBus: GainNode | null = null;
  private soundBus: GainNode | null = null;
  private voiceFx: GainNode | null = null;
  private cache = new Map<string, Promise<AudioBuffer | null>>();
  private bgm: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private duckUntil = 0;
  private whir: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private noiseBuf: AudioBuffer | null = null;

  musicOn = true;
  soundOn = true;

  /** Create the context. Call from a click or key press. */
  unlock(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      master.connect(comp).connect(ctx.destination);
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.musicOn ? 1 : 0;
      this.musicBus.connect(master);
      this.soundBus = ctx.createGain();
      this.soundBus.gain.value = this.soundOn ? 1 : 0;
      this.soundBus.connect(master);

      // announcer chain: a little body, a little air, a short slap echo
      const body = ctx.createBiquadFilter();
      body.type = "lowshelf";
      body.frequency.value = 220;
      body.gain.value = 5;
      const air = ctx.createBiquadFilter();
      air.type = "highshelf";
      air.frequency.value = 3800;
      air.gain.value = 4;
      const vcomp = ctx.createDynamicsCompressor();
      vcomp.threshold.value = -22;
      vcomp.ratio.value = 6;
      const echo = ctx.createDelay(0.5);
      echo.delayTime.value = 0.13;
      const fb = ctx.createGain();
      fb.gain.value = 0.3;
      const wet = ctx.createGain();
      wet.gain.value = 0.28;
      this.voiceFx = ctx.createGain();
      this.voiceFx.connect(body).connect(air).connect(vcomp).connect(this.soundBus);
      air.connect(echo);
      echo.connect(fb).connect(echo);
      echo.connect(wet).connect(this.soundBus);
      this.ctx = ctx;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (!this.ctx || !this.musicBus) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setTargetAtTime(on ? 1 : 0, t, 0.15);
    if (on) void this.startMusic();
  }

  setSound(on: boolean) {
    this.soundOn = on;
    if (!on) this.spinEnd();
    if (!this.ctx || !this.soundBus) return;
    const t = this.ctx.currentTime;
    this.soundBus.gain.cancelScheduledValues(t);
    this.soundBus.gain.setTargetAtTime(on ? 1 : 0, t, 0.05);
  }

  /** Pause everything when the tab is hidden. */
  suspend() {
    if (this.ctx?.state === "running") void this.ctx.suspend();
  }
  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  /** Start fetching the audio files so cues fire without a delay. */
  preload() {
    const all = [AUDIO_FILES.music.bgm, ...Object.values(AUDIO_FILES.stings), ...Object.values(AUDIO_FILES.voice)];
    all.forEach((u) => void this.load(u));
  }

  private load(url: string): Promise<AudioBuffer | null> {
    let p = this.cache.get(url);
    if (!p) {
      p = (async () => {
        const ctx = this.ctx;
        if (!ctx) return null;
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          return await ctx.decodeAudioData(await res.arrayBuffer());
        } catch {
          return null;
        }
      })();
      this.cache.set(url, p);
    }
    return p;
  }

  /* ------------------------------ music ------------------------------ */
  async startMusic() {
    const ctx = this.unlock();
    if (!ctx || !this.musicBus || this.bgm || !this.musicOn) return;
    const buf = await this.load(AUDIO_FILES.music.bgm);
    if (!buf || this.bgm || !this.musicOn) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.linearRampToValueAtTime(MUSIC_LEVEL, ctx.currentTime + 2.5);
    src.connect(gain).connect(this.musicBus);
    src.start();
    this.bgm = { src, gain };
  }

  stopMusic() {
    const b = this.bgm;
    if (!b || !this.ctx) return;
    this.bgm = null;
    const t = this.ctx.currentTime;
    b.gain.gain.cancelScheduledValues(t);
    b.gain.gain.setTargetAtTime(0.0001, t, 0.3);
    setTimeout(() => {
      try {
        b.src.stop();
      } catch {}
    }, 1500);
  }

  /** Pull the music down for `seconds` so a voice or sting can lead. */
  private duck(seconds: number) {
    if (!this.ctx || !this.bgm) return;
    const t = this.ctx.currentTime;
    const g = this.bgm.gain.gain;
    this.duckUntil = Math.max(this.duckUntil, t + seconds);
    g.cancelScheduledValues(t);
    g.setTargetAtTime(MUSIC_DUCKED, t, 0.12);
    g.setTargetAtTime(MUSIC_LEVEL, this.duckUntil, 0.6);
  }

  /* --------------------------- voice and stings --------------------------- */
  private async playFile(url: string, bus: AudioNode, gain: number, duckFor: boolean): Promise<number> {
    const ctx = this.unlock();
    if (!ctx || !this.soundOn) return 0;
    const buf = await this.load(url);
    if (!buf) return 0;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(bus);
    src.start();
    if (duckFor) this.duck(buf.duration + 0.3);
    return buf.duration;
  }

  voice(name: VoiceName) {
    if (!this.voiceFx) this.unlock();
    if (this.voiceFx) void this.playFile(AUDIO_FILES.voice[name], this.voiceFx, 1.5, true);
  }

  sting(name: StingName) {
    if (!this.soundBus) this.unlock();
    if (this.soundBus) void this.playFile(AUDIO_FILES.stings[name], this.soundBus, 0.85, true);
  }

  /* --------------------------- synthesised effects --------------------------- */
  private tone(freq: number, dur: number, o: Tone = {}) {
    const c = this.unlock();
    if (!c || !this.soundBus || !this.soundOn) return;
    const t = c.currentTime + (o.at ?? 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.12, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.soundBus);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  private noiseBuffer(): AudioBuffer | null {
    const c = this.ctx;
    if (!c) return null;
    if (!this.noiseBuf) {
      const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
    }
    return this.noiseBuf;
  }

  private burst(dur: number, gain: number, from: number, to: number, at = 0, q = 0.9) {
    const c = this.unlock();
    const nb = this.noiseBuffer();
    if (!c || !nb || !this.soundBus || !this.soundOn) return;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = nb;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.soundBus);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  click() {
    this.tone(680, 0.05, { type: "triangle", gain: 0.07 });
    this.tone(1020, 0.03, { type: "square", gain: 0.02 });
  }

  /** Reel whirr: filtered noise that wobbles, plus a soft ratchet of ticks. Ends with spinEnd(). */
  spinStart() {
    const c = this.unlock();
    const nb = this.noiseBuffer();
    if (!c || !nb || !this.soundBus || !this.soundOn) return;
    this.spinEnd();
    const src = c.createBufferSource();
    src.buffer = nb;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 520;
    f.Q.value = 1.4;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.25);
    const lfo = c.createOscillator();
    lfo.frequency.value = 9;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(g.gain);
    lfo.start();
    src.connect(f).connect(g).connect(this.soundBus);
    src.start();
    this.whir = { src, gain: g };
    this.tone(110, 0.55, { type: "sawtooth", gain: 0.05, to: 240 });
    this.burst(0.5, 0.12, 400, 2800);
    this.ticker = setInterval(() => this.tone(900 + Math.random() * 300, 0.018, { type: "square", gain: 0.012 }), 70);
  }

  spinEnd() {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    const w = this.whir;
    this.whir = null;
    if (w && this.ctx) {
      const t = this.ctx.currentTime;
      w.gain.gain.cancelScheduledValues(t);
      w.gain.gain.setTargetAtTime(0.0001, t, 0.08);
      setTimeout(() => {
        try {
          w.src.stop();
        } catch {}
      }, 400);
    }
  }

  reelStop(index: number) {
    this.tone(150 - index * 7, 0.2, { type: "sine", gain: 0.26, to: 46 });
    this.tone(420 - index * 20, 0.06, { type: "triangle", gain: 0.1 });
    this.burst(0.06, 0.16, 2200, 700);
  }

  scatter(count: number) {
    const notes = [880, 1109, 1319, 1760, 2093];
    for (let i = 0; i < Math.min(count + 1, notes.length); i++) this.tone(notes[i], 0.55, { type: "triangle", gain: 0.07, at: i * 0.07 });
    this.burst(0.5, 0.05, 3000, 7000);
  }

  coins(n = 6, spread = 0.7) {
    for (let i = 0; i < n; i++) {
      const at = Math.random() * spread;
      const f = 2300 + Math.random() * 1800;
      this.tone(f, 0.22, { type: "sine", gain: 0.05, at });
      this.tone(f * 1.51, 0.18, { type: "sine", gain: 0.03, at });
    }
  }

  lineChime(step: number) {
    const base = [659, 784, 880, 988, 1175][step % 5];
    this.tone(base, 0.4, { type: "sine", gain: 0.1 });
    this.tone(base * 2, 0.3, { type: "triangle", gain: 0.04, at: 0.04 });
  }

  /** Low cabinet thump for shakes. Strength 1 to 4. */
  impact(strength: number) {
    this.tone(70, 0.45, { type: "sine", gain: 0.12 + strength * 0.07, to: 34 });
    this.burst(0.25, 0.05 + strength * 0.03, 220, 60);
  }

  /** Deep rumble under a major-win quake: sub-bass with a shuddering low noise bed. */
  rumble(seconds: number, strength: number) {
    const c = this.unlock();
    const nb = this.noiseBuffer();
    if (!c || !nb || !this.soundBus || !this.soundOn) return;
    const t = c.currentTime;
    const end = t + Math.max(1.5, seconds);
    const src = c.createBufferSource();
    src.buffer = nb;
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 140;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.1 + strength * 0.05, t + 0.15);
    g.gain.setValueAtTime(0.1 + strength * 0.05, end - 0.8);
    g.gain.linearRampToValueAtTime(0.0001, end);
    const lfo = c.createOscillator();
    lfo.frequency.value = 11 + strength * 2;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.05 + strength * 0.02;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(lp).connect(g).connect(this.soundBus);
    src.start(t);
    src.stop(end + 0.1);
    lfo.start(t);
    lfo.stop(end + 0.1);
    this.tone(42, end - t, { type: "sine", gain: 0.1 + strength * 0.03 });
  }

  /** Short bell run for the counter tick at the end of a count-up. */
  tally() {
    this.tone(1318, 0.25, { type: "sine", gain: 0.07 });
    this.tone(1760, 0.3, { type: "sine", gain: 0.05, at: 0.07 });
  }

  destroy() {
    this.spinEnd();
    this.stopMusic();
    const c = this.ctx;
    this.ctx = null;
    if (c) setTimeout(() => void c.close(), 1600);
  }
}
