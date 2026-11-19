// TIGER CLASH cover art: a gold Tiger and an electric-blue Dragon face each other across a dark arena,
// two cards and a gold/blue energy spark between them. No text is rendered (fonts are unreliable here).
// Run on its own:  node scripts/art/tiger-clash.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { H, W, blurF, doc, lin, n, rad, rng } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dir = path.join(root, "public", "art", "tiger-clash");

const defs = [
  lin("bg", [[0, "#05070d"], [0.5, "#0b1020"], [1, "#12192e"]]),
  lin("floor", [[0, "#0a0e1c", 0], [0.4, "#0d1428", 0.9], [1, "#04060c", 1]]),
  rad("amberPool", [[0, "#ffb347", 0.55], [0.5, "#c2570c", 0.2], [1, "#5a2204", 0]]),
  rad("bluePool", [[0, "#5ee8ff", 0.55], [0.5, "#1590b8", 0.2], [1, "#0a3a5c", 0]]),
  lin("beamA", [[0, "#ffb347", 0.4], [1, "#ffb347", 0]], 0, 0, 0, 1),
  lin("beamB", [[0, "#5ee8ff", 0.4], [1, "#5ee8ff", 0]], 0, 0, 0, 1),
  lin("tiger", [[0, "#ffc766"], [0.45, "#e07a12"], [1, "#4a1c05"]], 0, 0, 0.2, 1),
  lin("dragon", [[0, "#1d4f86"], [0.5, "#0c2447"], [1, "#050c1c"]], 0, 0, 0.2, 1),
  lin("wing", [[0, "#2d8fd6", 0.85], [0.6, "#13497e", 0.8], [1, "#08203c", 0.7]], 0, 0, 0.3, 1),
  lin("cardGold", [[0, "#1a1f35"], [1, "#0a0d1a"]]),
  rad("spark", [[0, "#ffffff", 1], [0.2, "#ffe7a6", 0.85], [0.55, "#5ee8ff", 0.35], [1, "#5ee8ff", 0]]),
  rad("eyeA", [[0, "#fff6d0"], [0.5, "#ffb347"], [1, "#ff8a00", 0]]),
  rad("eyeB", [[0, "#e6fdff"], [0.5, "#5ee8ff"], [1, "#22d3ee", 0]]),
  blurF("b3", 3),
  blurF("b8", 8),
  blurF("b20", 20),
  blurF("b50", 50),
].join("");

/* ------------------------------- creatures ------------------------------- */
// Local coordinates ~400x320, facing right, drawn crouched and lunging.
const TIGER_BODY =
  "M40 170 C30 120 80 95 140 92 C190 88 225 95 255 105 C270 80 290 62 318 62 C335 62 345 74 348 88 L392 104 C398 112 394 124 384 128 L350 140 C335 160 312 168 290 160 C285 190 290 230 288 262 L296 300 L262 304 L258 270 C250 240 230 232 200 236 C170 240 140 238 125 232 L128 296 L96 300 L90 252 C70 240 52 215 40 170 Z";
const TIGER_TAIL = "M44 160 C0 140 -22 90 8 48 C20 32 38 44 30 62 C14 90 30 122 62 142 Z";
const TIGER_EARS = "M296 72 L302 36 L324 62 Z M326 66 L346 40 L352 76 Z";

function tiger() {
  const stripes = [
    "M150 92 C158 120 152 150 140 176",
    "M180 90 C190 120 184 154 174 182",
    "M212 94 C222 122 216 150 208 176",
    "M118 98 C124 128 118 158 108 184",
    "M86 112 C90 138 84 160 76 182",
    "M244 104 C252 130 246 156 238 178",
    "M296 86 C304 100 302 114 296 124",
    "M126 236 C134 250 132 270 126 290",
    "M262 262 C270 276 268 292 262 302",
    "M20 70 C26 80 28 90 24 100",
  ]
    .map((d) => `<path d="${d}" fill="none" stroke="#2a1004" stroke-width="11" stroke-linecap="round" opacity=".85"/>`)
    .join("");
  return `
  <g>
    <ellipse cx="190" cy="318" rx="210" ry="22" fill="#000" opacity=".55" filter="url(#b8)"/>
    <path d="${TIGER_BODY}${TIGER_TAIL}${TIGER_EARS}" fill="#ffb347" opacity=".9" filter="url(#b20)" transform="translate(0 -6)"/>
    <path d="${TIGER_TAIL}" fill="url(#tiger)"/>
    <path d="${TIGER_BODY}" fill="url(#tiger)"/>
    <path d="M240 100 L262 84 L256 112 L282 100 L272 132 L296 128 L284 158 L262 150 L250 176 L236 140 Z" fill="#ff9a2a" opacity=".9"/>
    <path d="${TIGER_EARS}" fill="#b9560d"/>
    <path d="M300 70 L304 46 L318 64 Z" fill="#2a1004" opacity=".7"/>
    ${stripes}
    <path d="M300 150 C330 160 360 142 384 128 L350 140 C335 160 312 168 290 160 Z" fill="#f7e2b0" opacity=".85"/>
    <path d="M350 138 L388 122 L384 150 C372 164 356 160 346 150 Z" fill="#3a0a06"/>
    <path d="M352 140 L386 126 L383 140 L356 148 Z" fill="#ff6a3a" opacity=".55"/>
    <path d="M366 132 l4 16 l5 -18 Z M352 142 l3 12 l5 -12 Z" fill="#fff6e0"/>
    <path d="M356 134 C366 132 376 128 384 124" fill="none" stroke="#1a0802" stroke-width="2.4" stroke-linecap="round"/>
    <path d="${TIGER_BODY}" fill="none" stroke="#ffd98a" stroke-width="3" stroke-linejoin="round" opacity=".85"/>
    <path d="M140 92 C190 88 225 95 255 105 C270 80 290 62 318 62" fill="none" stroke="#fff1c4" stroke-width="3.5" stroke-linecap="round" opacity=".9"/>
    <path d="M326 86 L352 96 L346 102 L324 94 Z" fill="#1a0802"/>
    <ellipse cx="338" cy="92" rx="14" ry="9" fill="url(#eyeA)" filter="url(#b3)"/>
    <ellipse cx="340" cy="92" rx="5.5" ry="3.4" fill="#fffbe6"/>
    <path d="M340 88 L344 96" stroke="#1a0802" stroke-width="2"/>
  </g>`;
}

// Dragon, facing left, wings spread. Local coordinates ~470x350.
const DRAGON_BODY =
  "M40 112 L92 94 C112 86 132 80 152 84 L192 62 L238 28 L216 76 L240 82 C254 92 258 110 254 128 C272 152 288 182 304 212 C324 244 364 252 404 250 C436 252 460 266 466 288 C470 312 446 330 420 326 C396 322 380 312 364 322 L330 346 L300 340 L306 312 C280 312 250 300 232 270 C216 238 192 196 150 160 L104 140 C86 142 64 136 40 112 Z";
const DRAGON_WING =
  "M262 196 C296 130 360 66 462 22 L452 74 C436 80 416 90 408 110 L420 150 C398 150 376 162 366 184 L346 218 C324 226 300 220 280 214 Z";

function dragon() {
  const bones = ["M262 196 L462 22", "M262 196 L408 110", "M270 204 L366 184", "M276 210 L346 218"]
    .map((d) => `<path d="${d}" fill="none" stroke="#7fe9ff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`)
    .join("");
  let scales = "";
  const r = rng(5);
  for (let i = 0; i < 40; i++) {
    const x = 160 + r() * 280;
    const y = 190 + r() * 120;
    scales += `<path d="M${n(x)} ${n(y)} q8 6 16 0" fill="none" stroke="#3aa8e6" stroke-width="1.6" opacity="${n(0.2 + r() * 0.35)}"/>`;
  }
  return `
  <g>
    <ellipse cx="260" cy="348" rx="230" ry="20" fill="#000" opacity=".55" filter="url(#b8)"/>
    <path d="M250 182 C282 100 336 40 410 -14 L400 48 C380 58 362 72 356 92 L366 130 C346 132 328 140 320 156 Z" fill="#0f4a80" opacity=".75" stroke="#5ee8ff" stroke-width="2"/>
    <path d="M250 182 L410 -14 M250 182 L356 92" fill="none" stroke="#5ee8ff" stroke-width="2.4" opacity=".7"/>
    <path d="${DRAGON_WING}" fill="#22d3ee" opacity=".55" filter="url(#b20)"/>
    <path d="${DRAGON_BODY}" fill="#22d3ee" opacity=".5" filter="url(#b20)"/>
    <path d="${DRAGON_WING}" fill="url(#wing)" stroke="#7fe9ff" stroke-width="2.4" stroke-linejoin="round"/>
    ${bones}
    <path d="${DRAGON_BODY}" fill="url(#dragon)"/>
    ${scales}
    <path d="M56 118 C90 122 120 128 150 150 C190 184 214 226 232 266" fill="none" stroke="#bfeeff" stroke-width="2" opacity=".4"/>
    <path d="${DRAGON_BODY}" fill="none" stroke="#5ee8ff" stroke-width="3.2" stroke-linejoin="round" opacity=".95"/>
    <path d="M152 84 L192 62 L238 28" fill="none" stroke="#e6fdff" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M192 62 L226 44 L214 66 Z" fill="#0a2748" stroke="#5ee8ff" stroke-width="1.6"/>
    <path d="M60 112 C80 118 102 120 124 116" fill="none" stroke="#04101e" stroke-width="3" stroke-linecap="round"/>
    <path d="M64 114 C80 122 98 128 120 122" fill="none" stroke="#5ee8ff" stroke-width="2" opacity=".8"/>
    <path d="M118 92 L150 98 L146 106 L116 100 Z" fill="#04101e"/>
    <ellipse cx="128" cy="97" rx="14" ry="9" fill="url(#eyeB)" filter="url(#b3)"/>
    <ellipse cx="127" cy="97" rx="5.5" ry="3.4" fill="#ffffff"/>
    <path d="M54 108 l6 -6 l6 6" fill="none" stroke="#bfeeff" stroke-width="2" opacity=".7"/>
    <path d="M40 112 C 20 108, 4 100, -16 90 C 4 110, 4 126, 40 124 Z" fill="#5ee8ff" opacity=".8" filter="url(#b3)"/>
    <path d="M44 116 l6 12 l5 -12 Z M64 120 l5 10 l4 -10 Z" fill="#e6fdff"/>
  </g>`;
}

/* --------------------------------- cards --------------------------------- */
const SPADE = "M0 -34 C 26 -10 40 6 40 20 C 40 34 22 40 10 30 C 12 40 14 46 20 52 L-20 52 C -14 46 -12 40 -10 30 C -22 40 -40 34 -40 20 C -40 6 -26 -10 0 -34 Z";
const DIAMOND = "M0 -40 L 30 0 L 0 40 L -30 0 Z";

function card(x, y, rot, edge, glow, pip, scale = 1) {
  return `
  <g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})">
    <rect x="-84" y="-118" width="168" height="236" rx="16" fill="${glow}" opacity=".5" filter="url(#b20)"/>
    <rect x="-80" y="-114" width="160" height="228" rx="14" fill="url(#cardGold)" stroke="${edge}" stroke-width="4"/>
    <rect x="-70" y="-104" width="140" height="208" rx="9" fill="none" stroke="${edge}" stroke-width="1.4" opacity=".6"/>
    <path d="${pip}" fill="${edge}" transform="scale(1.35)"/>
    <path d="${pip}" fill="${edge}" transform="translate(-52 -86) scale(.28)"/>
    <path d="${pip}" fill="${edge}" transform="translate(52 86) rotate(180) scale(.28)"/>
    <rect x="-80" y="-114" width="160" height="60" rx="14" fill="#ffffff" opacity=".05"/>
  </g>`;
}

function cards() {
  const arcs = [
    "M728 470 C 760 420, 790 480, 800 440",
    "M872 470 C 840 420, 810 480, 800 440",
    "M736 520 C 770 560, 790 500, 800 540",
    "M864 520 C 830 560, 810 500, 800 540",
  ];
  return `
    <g transform="translate(0 120)"><ellipse cx="800" cy="470" rx="190" ry="150" fill="url(#spark)" opacity=".9"/>
    ${card(742, 484, -9, "#f5a524", "#f5a524", SPADE)}
    ${card(858, 484, 9, "#22d3ee", "#22d3ee", DIAMOND)}
    ${arcs.map((d, i) => `<path d="${d}" fill="none" stroke="${i % 2 ? "#5ee8ff" : "#ffd37a"}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`).join("")}
    <circle cx="800" cy="470" r="34" fill="url(#spark)"/>
    <circle cx="800" cy="470" r="10" fill="#fff"/></g>`;
}

/* --------------------------------- layers --------------------------------- */
function back() {
  const r = rng(9);
  let embers = "";
  for (let i = 0; i < 90; i++) {
    const x = r() * W;
    const y = 200 + r() * 600;
    const gold = x < W / 2;
    embers += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.8 + r() * 2)}" fill="${gold ? "#ffb347" : "#5ee8ff"}" opacity="${n(0.2 + r() * 0.6)}"/>`;
  }
  let pillars = "";
  for (let i = 0; i < 9; i++) {
    const x = 120 + i * 170;
    const h = 260 + ((i * 53) % 120);
    pillars += `<rect x="${x}" y="${620 - h}" width="46" height="${h}" fill="#070b17" opacity=".95"/><rect x="${x - 6}" y="${620 - h - 10}" width="58" height="14" fill="#0a1020"/>`;
  }
  return doc(
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <ellipse cx="520" cy="420" rx="560" ry="380" fill="url(#amberPool)"/>
     <ellipse cx="1080" cy="420" rx="560" ry="380" fill="url(#bluePool)"/>
     <path d="M440 0 L180 640 L760 640 Z" fill="url(#beamA)" opacity=".5" filter="url(#b20)"/>
     <path d="M1160 0 L840 640 L1420 640 Z" fill="url(#beamB)" opacity=".5" filter="url(#b20)"/>
     ${pillars}
     <rect x="0" y="600" width="${W}" height="300" fill="url(#floor)"/>
     <ellipse cx="620" cy="650" rx="420" ry="46" fill="#ffb347" opacity=".18" filter="url(#b20)"/>
     <ellipse cx="1000" cy="650" rx="420" ry="46" fill="#5ee8ff" opacity=".18" filter="url(#b20)"/>
     ${embers}`,
    defs,
  );
}

function mid() {
  // tiger: head near x=700, dragon head near x=900, so both faces sit inside the portrait crop with the cards between them below
  return doc(
    `<g transform="translate(112 262) scale(1.45)">${tiger()}</g>
     <g transform="translate(850 196) scale(1.45)">${dragon()}</g>
     <ellipse cx="800" cy="440" rx="150" ry="90" fill="url(#spark)" opacity=".55"/>
     ${cards()}`,
    defs,
  );
}

function front() {
  const r = rng(77);
  let sparks = "";
  for (let i = 0; i < 70; i++) {
    const x = 380 + r() * 840;
    const y = 180 + r() * 620;
    sparks += `<rect x="${n(x)}" y="${n(y)}" width="${n(1.5 + r() * 3)}" height="${n(1.5 + r() * 3)}" fill="${r() < 0.5 ? "#ffd37a" : "#8cf0ff"}" opacity="${n(0.4 + r() * 0.6)}" transform="rotate(${n(r() * 90)} ${n(x)} ${n(y)})"/>`;
  }
  return doc(
    `<rect x="0" y="650" width="${W}" height="250" fill="#05070d" opacity=".55"/>
     <ellipse cx="800" cy="840" rx="900" ry="120" fill="#0a1226" opacity=".75" filter="url(#b50)"/>
     <ellipse cx="560" cy="800" rx="360" ry="50" fill="#ffb347" opacity=".14" filter="url(#b20)"/>
     <ellipse cx="1040" cy="800" rx="360" ry="50" fill="#5ee8ff" opacity=".14" filter="url(#b20)"/>
     ${sparks}
     <rect width="${W}" height="${H}" fill="none"/>`,
    defs,
  );
}

await mkdir(dir, { recursive: true });
const render = (svg) => sharp(Buffer.from(svg), { density: 72 }).resize(W, H).ensureAlpha().png().toBuffer();
const [b, m, f] = [await render(back()), await render(mid()), await render(front())];

await sharp(b).removeAlpha().webp({ quality: 74, effort: 5 }).toFile(path.join(dir, "back.webp"));
await sharp(m).webp({ quality: 78, alphaQuality: 82, effort: 5 }).toFile(path.join(dir, "mid.webp"));
await sharp(f).webp({ quality: 76, alphaQuality: 80, effort: 5 }).toFile(path.join(dir, "front.webp"));

const comp = await sharp(b).removeAlpha().composite([{ input: m }, { input: f }]).png().toBuffer();
await sharp(comp).resize(2752, 1536).webp({ quality: 80, effort: 5 }).toFile(path.join(dir, "poster.webp"));
await sharp(comp).resize(640, 360).webp({ quality: 74, effort: 5 }).toFile(path.join(dir, "thumb.webp"));
const prev = path.join(root, "scripts", "art", "_preview");
await mkdir(prev, { recursive: true });
await sharp(comp).resize(1000, 563).jpeg({ quality: 82 }).toFile(path.join(prev, "tiger-clash.jpg"));
console.log("tiger-clash art written to", dir);
