// Synthesises the original Pharaoh's Fortune music and celebration stings into WAV files.
// Pure Node, no dependencies:   node scripts/audio/music.mjs
// Output: public/audio/pharaohs-fortune/music/*.wav
//
// Everything is composed here in the D Hijaz (Phrygian dominant) scale: Karplus-Strong plucked strings
// (oud-like), a darbuka groove, drones, finger cymbals and synthesised brass for the stings.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SR = 22050;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "audio", "pharaohs-fortune", "music");
fs.mkdirSync(OUT, { recursive: true });

const hz = (semisFromA4) => 440 * Math.pow(2, semisFromA4 / 12);
// D Hijaz: D Eb F# G A Bb C, three octaves from D4 (index 0..20)
const D4 = hz(-7);
const HIJAZ = [0, 1, 4, 5, 7, 8, 10];
const SCALE = Array.from({ length: 21 }, (_, i) => D4 * Math.pow(2, (Math.floor(i / 7) * 12 + HIJAZ[i % 7]) / 12));

let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

class Track {
  constructor(seconds) {
    this.len = Math.ceil(seconds * SR);
    this.d = new Float32Array(this.len);
  }
  add(t, arr, gain = 1) {
    const s = Math.floor(t * SR);
    for (let i = 0; i < arr.length; i++) {
      const j = s + i;
      if (j >= this.len) break;
      if (j >= 0) this.d[j] += arr[i] * gain;
    }
  }
}

const env = (i, n, a, r) => {
  const t = i / SR;
  const dur = n / SR;
  return Math.min(1, t / a) * Math.min(1, Math.max(0, (dur - t) / r));
};

// plucked string (Karplus-Strong)
function pluck(freq, dur, bright = 0.5) {
  const n = Math.floor(dur * SR);
  const N = Math.max(2, Math.round(SR / freq));
  const line = new Float32Array(N);
  for (let i = 0; i < N; i++) line[i] = rnd() * bright + Math.sin((i / N) * Math.PI * 2) * (1 - bright);
  const out = new Float32Array(n);
  let p = 0;
  for (let i = 0; i < n; i++) {
    const a = line[p];
    const b = line[(p + 1) % N];
    out[i] = a;
    line[p] = (a + b) * 0.5 * 0.9965;
    p = (p + 1) % N;
  }
  return out;
}

// brass-like tone: stacked harmonics with a filter that opens on the attack
function brass(freq, dur, vib = 0.004) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  const harmonics = Math.min(14, Math.floor(SR / 2 / freq));
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const open = Math.min(1, t / 0.12);
    const f = freq * (1 + vib * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t / 0.3));
    let s = 0;
    for (let k = 1; k <= harmonics; k++) s += (Math.sin(2 * Math.PI * f * k * t) / k) * Math.pow(open, k * 0.35);
    out[i] = s * 0.5 * env(i, n, 0.03, 0.18);
  }
  return out;
}

function soft(freq, dur) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(2 * Math.PI * freq * 2 * t) + 0.12 * Math.sin(2 * Math.PI * freq * 3 * t)) * env(i, n, 0.6, 0.9) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 0.35 * t));
  }
  return out;
}

function dum(dur = 0.3) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (52 + 95 * Math.exp(-t * 28))) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 11);
  }
  return out;
}

function tek(dur = 0.07, tone = 0.5) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const x = rnd();
    lp += (x - lp) * tone;
    out[i] = (x - lp) * Math.exp((-i / n) * 6);
  }
  return out;
}

function ping(freq, dur = 2) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  const partials = [1, 2.76, 5.4, 8.93];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    partials.forEach((p, k) => (s += Math.sin(2 * Math.PI * freq * p * t) * Math.exp(-t * (2.2 + k * 1.6)) / (k + 1)));
    out[i] = s;
  }
  return out;
}

function wash(dur, lo = 0.5) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const x = rnd();
    lp += (x - lp) * lo;
    out[i] = (x - lp) * Math.pow(Math.sin((i / n) * Math.PI * 0.5), 2);
  }
  return out;
}

// Schroeder reverb
function reverb(tr, mix = 0.22) {
  const dry = tr.d.slice();
  const combs = [0.0297, 0.0371, 0.0411, 0.0437].map((s) => ({ buf: new Float32Array(Math.floor(s * SR)), p: 0 }));
  const out = new Float32Array(tr.len);
  for (let i = 0; i < tr.len; i++) {
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.p];
      c.buf[c.p] = dry[i] + y * 0.78;
      c.p = (c.p + 1) % c.buf.length;
      s += y;
    }
    out[i] = s * 0.25;
  }
  for (let i = 0; i < tr.len; i++) tr.d[i] = dry[i] * (1 - mix) + out[i] * mix * 1.6;
}

function finish(tr, name, peak = 0.9, fade = 0.04) {
  let max = 0.0001;
  for (let i = 0; i < tr.len; i++) max = Math.max(max, Math.abs(tr.d[i]));
  const g = peak / max;
  const buf = Buffer.alloc(44 + tr.len * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + tr.len * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(tr.len * 2, 40);
  const f = Math.floor(fade * SR);
  for (let i = 0; i < tr.len; i++) {
    const edge = fade ? Math.min(1, (tr.len - i) / f) : 1;
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(tr.d[i] * g * edge * 32767))), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(name.padEnd(22), (buf.length / 1024).toFixed(0).padStart(6), "KB", (tr.len / SR).toFixed(1) + "s");
}

/* ------------------------------ background loop ------------------------------ */
{
  const BPM = 104;
  const beat = 60 / BPM;
  const eighth = beat / 2;
  const bars = 16;
  const loopLen = bars * 4 * beat;
  const tail = 3;
  const tr = new Track(loopLen + tail);

  const phrases = [
    "4 5 4 3 2 3 4 . 5 6 5 4 3 2 1 . 2 3 4 5 4 3 2 . 1 0 1 2 . . . .",
    "4 5 4 3 2 3 4 . 5 6 7 6 5 4 3 . 2 3 4 5 6 5 4 . 3 2 1 0 . . . .",
    "7 6 5 6 7 8 7 . 6 5 4 5 6 7 6 . 5 4 3 4 5 6 5 . 4 3 2 1 0 . . .",
    "4 5 4 3 2 3 4 . 5 6 5 4 3 2 1 . 2 1 0 1 2 3 2 . 0 . . . . . . .",
  ];
  phrases.forEach((ph, pi) => {
    ph.split(" ").forEach((tok, si) => {
      if (tok === ".") return;
      const t = pi * 8 * eighth * 4 + si * eighth;
      const f = SCALE[Number(tok)];
      tr.add(t, pluck(f, eighth * 3.2, 0.45), 0.5);
      if (pi === 2) tr.add(t, pluck(f * 2, eighth * 2, 0.7), 0.1);
    });
  });

  // drone + slow bass movement
  for (let b = 0; b < bars; b += 4) {
    tr.add(b * 4 * beat, soft(SCALE[0] / 2, 4 * 4 * beat * 0.5 + 1.4), 0.2);
    tr.add(b * 4 * beat, soft(SCALE[4] / 2, 4 * 4 * beat * 0.5 + 1.4), 0.12);
    tr.add((b + 2) * 4 * beat, soft(SCALE[0] / 2, 4 * 4 * beat * 0.5 + 1.4), 0.2);
  }
  for (let b = 0; b < bars; b++) {
    const root = b % 4 === 3 ? SCALE[1] / 2 : SCALE[0] / 2;
    tr.add(b * 4 * beat, pluck(root, beat * 1.8, 0.2), 0.45);
    tr.add((b * 4 + 2) * beat, pluck(root * 1.5, beat * 1.4, 0.2), 0.25);
  }

  // darbuka maqsum: Dum Tek . Tek Dum . Tek .
  const groove = ["D", "T", ".", "T", "D", ".", "T", "."];
  for (let b = 0; b < bars; b++)
    groove.forEach((g, i) => {
      const t = b * 4 * beat + i * eighth;
      if (g === "D") tr.add(t, dum(), 0.55);
      if (g === "T") tr.add(t, tek(0.07, 0.4), 0.28);
    });
  for (let b = 0; b < bars; b += 2) tr.add(b * 4 * beat + 3.5 * beat, tek(0.05, 0.3), 0.14);
  for (let b = 8; b < bars; b += 4) tr.add(b * 4 * beat, ping(SCALE[7], 2.4), 0.22);

  reverb(tr, 0.26);
  // fold the reverb tail onto the start so the loop is seamless
  const loop = new Track(loopLen);
  for (let i = 0; i < tr.len; i++) loop.d[i % loop.len] += tr.d[i];
  finish(loop, "bgm-hijaz-loop.wav", 0.8, 0);
}

/* ---------------------------------- stings ---------------------------------- */
const N = (i, oct = 0) => SCALE[i] * Math.pow(2, oct);
const chordHit = (tr, t, freqs, dur, g) => freqs.forEach((f) => tr.add(t, brass(f, dur), g));
const roll = (tr, t, dur, from = 0.1, to = 0.6, step = 0.055) => {
  for (let x = 0; x < dur; x += step) tr.add(t + x, tek(0.05, 0.35), from + (to - from) * (x / dur));
};

// small win: a bright run of plucks and a bell
{
  const tr = new Track(2.4);
  [7, 9, 11, 12].forEach((d, i) => tr.add(i * 0.11, pluck(SCALE[d], 0.8, 0.6), 0.5));
  tr.add(0.4, ping(SCALE[7] * 2, 1.8), 0.35);
  reverb(tr, 0.28);
  finish(tr, "sting-nice.wav");
}

// big win
{
  const tr = new Track(5);
  roll(tr, 0, 1.1);
  tr.add(1.1, dum(0.5), 0.9);
  chordHit(tr, 1.1, [N(0, -1), N(4, -1), N(0)], 0.7, 0.5);
  [[1.7, 7], [2.0, 6], [2.3, 5], [2.6, 7]].forEach(([t, d]) => tr.add(t, brass(N(d), 0.3), 0.55));
  chordHit(tr, 2.9, [N(0), N(2), N(4), N(7)], 1.8, 0.5);
  [4, 5, 7, 9, 11, 12, 11, 9].forEach((d, i) => tr.add(2.9 + i * 0.1, pluck(SCALE[d], 0.7, 0.6), 0.4));
  tr.add(2.9, ping(SCALE[7] * 2, 2), 0.4);
  reverb(tr, 0.3);
  finish(tr, "sting-big.wav");
}

// super win
{
  const tr = new Track(6.5);
  roll(tr, 0, 1.5, 0.1, 0.7, 0.045);
  tr.add(1.5, dum(0.6), 1);
  chordHit(tr, 1.5, [N(0, -1), N(4, -1), N(0), N(4)], 0.8, 0.55);
  [[2.1, 4], [2.4, 5], [2.7, 4], [3.0, 3], [3.3, 5], [3.6, 7]].forEach(([t, d]) => tr.add(t, brass(N(d), 0.32), 0.55));
  chordHit(tr, 4.0, [N(0, -1), N(2), N(4), N(7), N(9)], 2.3, 0.55);
  for (let i = 0; i < 14; i++) tr.add(4.0 + i * 0.09, pluck(SCALE[(5 + (i % 7))], 0.8, 0.6), 0.4);
  tr.add(4.0, wash(2.2, 0.6), 0.25);
  tr.add(4.0, ping(SCALE[7] * 2, 2.4), 0.4);
  reverb(tr, 0.32);
  finish(tr, "sting-super.wav");
}

// mega win
{
  const tr = new Track(8);
  roll(tr, 0, 2, 0.1, 0.8, 0.04);
  tr.add(2, dum(0.7), 1);
  tr.add(2, wash(1.5, 0.7), 0.3);
  chordHit(tr, 2, [N(0, -1), N(4, -1), N(0), N(4), N(7)], 1, 0.55);
  [[2.7, 7], [3.0, 8], [3.3, 7], [3.6, 6], [3.9, 7], [4.2, 9]].forEach(([t, d]) => tr.add(t, brass(N(d), 0.34), 0.55));
  for (let i = 0; i < 20; i++) tr.add(2.7 + i * 0.075, pluck(SCALE[3 + (i % 8)], 0.7, 0.6), 0.3);
  tr.add(4.6, dum(0.7), 1);
  chordHit(tr, 4.6, [N(0, -1), N(2), N(4), N(7), N(9), N(11)], 3, 0.6);
  tr.add(4.6, wash(3, 0.55), 0.3);
  [7, 9, 11, 12, 14, 12, 11, 9, 7].forEach((d, i) => tr.add(4.6 + i * 0.12, ping(SCALE[d], 1.6), 0.18));
  reverb(tr, 0.34);
  finish(tr, "sting-mega.wav");
}

// jackpot
{
  const tr = new Track(11);
  roll(tr, 0, 2.6, 0.08, 0.9, 0.035);
  tr.add(0.5, wash(2.2, 0.8), 0.25);
  tr.add(2.6, dum(0.9), 1);
  tr.add(2.6, wash(2.5, 0.5), 0.35);
  chordHit(tr, 2.6, [N(0, -2), N(0, -1), N(4, -1), N(0), N(4), N(7)], 1.4, 0.55);
  const fan = [[3.4, 7], [3.7, 7], [4.0, 8], [4.3, 7], [4.6, 6], [4.9, 7], [5.2, 9], [5.5, 11]];
  fan.forEach(([t, d]) => tr.add(t, brass(N(d), 0.38), 0.6));
  for (let i = 0; i < 28; i++) tr.add(3.4 + i * 0.075, pluck(SCALE[2 + (i % 9)], 0.7, 0.6), 0.28);
  tr.add(6.2, dum(0.9), 1);
  tr.add(6.2, wash(4.6, 0.45), 0.4);
  chordHit(tr, 6.2, [N(0, -2), N(0, -1), N(2, -1), N(4, -1), N(0), N(2), N(4), N(7), N(9), N(11)], 4.4, 0.6);
  [7, 9, 11, 12, 14, 12, 11, 9, 7, 9, 11, 12, 14, 16].forEach((d, i) => tr.add(6.2 + i * 0.16, ping(SCALE[d], 2), 0.2));
  for (let i = 0; i < 6; i++) tr.add(6.2 + i * 0.7, ping(SCALE[7] * 2, 2.5), 0.2);
  reverb(tr, 0.36);
  finish(tr, "sting-jackpot.wav");
}

// free spins: shimmering rise
{
  const tr = new Track(4.5);
  [0, 2, 3, 4, 6, 7, 9, 11, 12].forEach((d, i) => tr.add(i * 0.17, pluck(SCALE[d], 1.2, 0.6), 0.45));
  tr.add(0.2, soft(SCALE[0], 3.8), 0.3);
  tr.add(1.6, wash(2.4, 0.7), 0.2);
  [12, 14, 16, 17].forEach((d, i) => tr.add(1.7 + i * 0.12, ping(SCALE[d] * 2, 2.2), 0.2));
  chordHit(tr, 1.7, [N(0), N(2), N(4), N(7)], 1.8, 0.4);
  reverb(tr, 0.38);
  finish(tr, "sting-free-spins.wav");
}
