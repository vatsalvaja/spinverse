import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rng, n, lin, rad } from "./lib.mjs";

// The vault door: brushed spun-steel, gold inlay, hex bolts and a glass display window. 1000x1000.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dir = path.join(root, "public", "art", "vault");
await mkdir(dir, { recursive: true });
const C = 500;

const wrap = (body, defs) => `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><defs>${defs}</defs>${body}</svg>`;
const defsBase =
  lin("steel", [[0, "#f4f1ea"], [0.18, "#9da1ad"], [0.42, "#3b3e4a"], [0.62, "#8c909e"], [0.8, "#2a2c36"], [1, "#12131a"]], 0.15, 0, 0.85, 1) +
  lin("steelDark", [[0, "#5b5f6c"], [0.5, "#20222b"], [1, "#0b0c12"]], 0.2, 0, 0.8, 1) +
  lin("gold", [[0, "#fff6d0"], [0.3, "#f0c85e"], [0.62, "#b8832a"], [1, "#6a470f"]], 0.1, 0, 0.9, 1) +
  lin("goldRev", [[0, "#6a470f"], [0.4, "#c0892e"], [0.75, "#f6d97a"], [1, "#fff6d0"]], 0.1, 0, 0.9, 1) +
  rad("face", [[0, "#3a3d4a"], [0.7, "#1a1c25"], [1, "#0c0d13"]], 0.38, 0.32, 0.85) +
  rad("glass", [[0, "#1c1708"], [0.7, "#07060a"], [1, "#020204"]], 0.4, 0.35, 0.8) +
  rad("bolt", [[0, "#ffffff"], [0.35, "#b4b8c6"], [1, "#2a2c36"]], 0.32, 0.28, 0.8) +
  `<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
   <filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
   <filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.9" numOctaves="2" seed="3" result="nz"/><feColorMatrix in="nz" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.35 0" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in" result="gi"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gi"/></feMerge></filter>`;

const r = rng(77);
// concentric brushing: many hairline circles with varied opacity
const brushed = (r0, r1, count, light) =>
  Array.from({ length: count }, () => {
    const rr = r0 + r() * (r1 - r0);
    return `<circle cx="${C}" cy="${C}" r="${n(rr)}" fill="none" stroke="${r() < 0.5 ? "#fff" : "#000"}" stroke-opacity="${n(r() * light)}" stroke-width="${n(0.5 + r() * 1.2)}"/>`;
  }).join("");

let door = "";
door += `<ellipse cx="${C}" cy="${C + 30}" rx="470" ry="470" fill="#000" opacity=".55" filter="url(#b)"/>`;
// outer rim
door += `<circle cx="${C}" cy="${C}" r="486" fill="url(#steel)"/>`;
door += `<g clip-path="url(#rim)"><circle cx="${C}" cy="${C}" r="486" fill="none"/>${brushed(420, 486, 260, 0.35)}</g>`;
door += `<circle cx="${C}" cy="${C}" r="486" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/><circle cx="${C}" cy="${C}" r="470" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="3"/>`;
// tick ring
door += `<circle cx="${C}" cy="${C}" r="454" fill="#0d0e14"/>`;
for (let i = 0; i < 120; i++) {
  const major = i % 10 === 0;
  door += `<line x1="${C}" y1="${C - 452}" x2="${C}" y2="${C - (major ? 424 : 438)}" stroke="${major ? "#f0c85e" : "#b4b8c6"}" stroke-width="${major ? 4 : 2}" opacity="${major ? 0.95 : 0.6}" transform="rotate(${i * 3} ${C} ${C})"/>`;
}
// gold inlay
door += `<circle cx="${C}" cy="${C}" r="410" fill="none" stroke="url(#gold)" stroke-width="16"/><circle cx="${C}" cy="${C}" r="402" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/><circle cx="${C}" cy="${C}" r="418" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>`;
// bolt ring plate
door += `<circle cx="${C}" cy="${C}" r="396" fill="url(#steelDark)"/>`;
door += `<g clip-path="url(#plate)">${brushed(330, 396, 150, 0.25)}</g>`;
for (let i = 0; i < 16; i++) {
  const a = (i * 360) / 16;
  door += `<g transform="rotate(${a} ${C} ${C}) translate(${C} ${C - 366})">
    <circle r="23" fill="#000" opacity=".55" cx="3" cy="5" filter="url(#b2)"/>
    <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="url(#bolt)" stroke="#000" stroke-opacity=".6" stroke-width="1.5"/>
    <circle r="9" fill="#1a1c25" stroke="#fff" stroke-opacity=".3"/>
    <path d="M-12,-14 L2,-20" stroke="#fff" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}
// door face with engraved arcs
door += `<circle cx="${C}" cy="${C}" r="326" fill="url(#face)" filter="url(#grain)"/>`;
door += `<g clip-path="url(#faceClip)">${brushed(0, 326, 260, 0.22)}</g>`;
door += `<circle cx="${C}" cy="${C}" r="326" fill="none" stroke="url(#goldRev)" stroke-width="5"/><circle cx="${C}" cy="${C}" r="316" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="2"/>`;
for (const [a0, a1] of [[20, 100], [140, 220], [260, 340]]) {
  const p = (deg, rr) => [C + rr * Math.cos(((deg - 90) * Math.PI) / 180), C + rr * Math.sin(((deg - 90) * Math.PI) / 180)];
  const [x0, y0] = p(a0, 282);
  const [x1, y1] = p(a1, 282);
  door += `<path d="M${n(x0)},${n(y0)} A282,282 0 0 1 ${n(x1)},${n(y1)}" fill="none" stroke="url(#gold)" stroke-width="7" stroke-linecap="round"/><path d="M${n(x0)},${n(y0)} A282,282 0 0 1 ${n(x1)},${n(y1)}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2" transform="translate(2 3)"/>`;
}
// display window: gold bezel + glass
door += `<circle cx="${C}" cy="${C}" r="232" fill="#000" opacity=".6" filter="url(#b)"/>`;
door += `<circle cx="${C}" cy="${C}" r="226" fill="url(#gold)"/><circle cx="${C}" cy="${C}" r="214" fill="url(#goldRev)"/><circle cx="${C}" cy="${C}" r="204" fill="#0b0b10"/>`;
door += `<circle cx="${C}" cy="${C}" r="196" fill="url(#glass)"/>`;
for (let i = 0; i < 60; i++) door += `<line x1="${C}" y1="${C - 190}" x2="${C}" y2="${C - 180}" stroke="#f0c85e" stroke-opacity=".5" stroke-width="2" transform="rotate(${i * 6} ${C} ${C})"/>`;
door += `<path d="M${C - 150},${C - 90} A180,180 0 0 1 ${C + 40},${C - 176}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="16" stroke-linecap="round"/>`;
door += `<ellipse cx="${C - 70}" cy="${C - 110}" rx="90" ry="40" fill="#fff" opacity=".07" transform="rotate(-30 ${C - 70} ${C - 110})"/>`;
// global specular sweep
door += `<circle cx="${C}" cy="${C}" r="486" fill="url(#sweep)"/>`;

const doorDefs =
  defsBase +
  `<clipPath id="rim"><path d="M${C},${C} m-486,0 a486,486 0 1,0 972,0 a486,486 0 1,0 -972,0 M${C},${C} m-420,0 a420,420 0 1,1 840,0 a420,420 0 1,1 -840,0" clip-rule="evenodd"/></clipPath>` +
  `<clipPath id="plate"><circle cx="${C}" cy="${C}" r="396"/></clipPath><clipPath id="faceClip"><circle cx="${C}" cy="${C}" r="326"/></clipPath>` +
  `<linearGradient id="sweep" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>`;

// handle wheel: spokes with ball knobs and a ring, rotated by CSS
let wheel = `<circle cx="${C}" cy="${C}" r="350" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="22" transform="translate(4 6)" filter="url(#b2)"/>`;
wheel += `<circle cx="${C}" cy="${C}" r="350" fill="none" stroke="url(#gold)" stroke-width="20"/><circle cx="${C}" cy="${C}" r="341" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="2"/><circle cx="${C}" cy="${C}" r="359" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`;
for (let i = 0; i < 6; i++) {
  wheel += `<g transform="rotate(${i * 60} ${C} ${C})">
    <rect x="${C - 12}" y="${C - 345}" width="24" height="122" rx="12" fill="#000" opacity=".5" transform="translate(5 7)" filter="url(#b2)"/>
    <rect x="${C - 12}" y="${C - 345}" width="24" height="122" rx="12" fill="url(#gold)"/>
    <rect x="${C - 12}" y="${C - 345}" width="9" height="122" rx="4.5" fill="#fff" opacity=".4"/>
    <circle cx="${C}" cy="${C - 372}" r="30" fill="#000" opacity=".5" transform="translate(5 7)" filter="url(#b2)"/>
    <circle cx="${C}" cy="${C - 372}" r="28" fill="url(#gold)"/><circle cx="${C - 8}" cy="${C - 382}" r="8" fill="#fff" opacity=".85"/>
  </g>`;
}
const wheelDefs = defsBase;

const toWebp = async (svg, file, q) => sharp(Buffer.from(svg)).resize(1000, 1000).webp({ quality: q, alphaQuality: 90, effort: 5 }).toFile(path.join(dir, file));
await toWebp(wrap(door, doorDefs), "door.webp", 84);
await toWebp(wrap(wheel, wheelDefs), "wheel.webp", 84);
await sharp(Buffer.from(wrap(door + wheel, doorDefs + wheelDefs.replace(/<linearGradient id="(steel|steelDark|gold|goldRev)"/g, '<linearGradient id="$1x"')))).resize(500, 500).flatten({ background: "#222" }).jpeg({ quality: 80 }).toFile(path.join(root, "scripts", "art", "_preview", "vault.jpg"));
console.log("baked vault");
