// SKYFALL cover art: a midnight city, a rising cyan trail and an original delta-wing aircraft.
// No text is rendered (fonts are unreliable here); the in-game title is set in the UI.
// Run on its own:  node scripts/art/skyfall.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { H, W, blurF, doc, lin, n, rad, rng } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dir = path.join(root, "public", "art", "skyfall");

/** One layer of lit towers. Windows are scattered deterministically. */
function towers({ seed, x0, x1, base, minH, maxH, minW, maxW, fill, win, winChance = 0.4, antenna = true }) {
  const r = rng(seed);
  let out = "";
  let wins = "";
  let x = x0;
  while (x < x1) {
    const w = minW + r() * (maxW - minW);
    const h = minH + r() * (maxH - minH);
    const top = base - h;
    out += `<rect x="${n(x)}" y="${n(top)}" width="${n(w)}" height="${n(h + 4)}" fill="${fill}"/>`;
    if (r() < 0.35) out += `<rect x="${n(x + w * 0.2)}" y="${n(top - 14)}" width="${n(w * 0.6)}" height="16" fill="${fill}"/>`;
    if (antenna && r() < 0.3) out += `<rect x="${n(x + w / 2 - 1)}" y="${n(top - 40)}" width="2" height="42" fill="${fill}"/><circle cx="${n(x + w / 2)}" cy="${n(top - 42)}" r="2.4" fill="#ff5d6c"/>`;
    const step = 14;
    for (let wy = top + 12; wy < base - 8; wy += step) {
      for (let wx = x + 7; wx < x + w - 8; wx += step - 2) {
        if (r() < winChance) {
          const c = win[Math.floor(r() * win.length)];
          wins += `<rect x="${n(wx)}" y="${n(wy)}" width="4" height="6" fill="${c}" opacity="${n(0.45 + r() * 0.5)}"/>`;
        }
      }
    }
    x += w + 2 + r() * 8;
  }
  return out + wins;
}

/** The aircraft, nose pointing +x at the origin. About 170 units long. */
function aircraft() {
  return `
  <g>
    <ellipse cx="-70" cy="0" rx="120" ry="16" fill="url(#cyanBloom)" opacity=".7"/>
    <path d="M70 0 L-52 -62 L-34 -22 L-60 -14 L-60 14 L-34 22 L-52 62 Z" fill="url(#hull)" stroke="#e6c170" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M70 0 L-34 -22 L-60 -14 L-30 -4 Z" fill="#16294f" opacity=".85"/>
    <path d="M70 0 L-30 4 L-60 14 L-34 22 Z" fill="#050d22" opacity=".8"/>
    <path d="M62 0 L-44 -48" stroke="#e6c170" stroke-width="1.1" opacity=".8" fill="none"/>
    <path d="M62 0 L-44 48" stroke="#e6c170" stroke-width="1.1" opacity=".5" fill="none"/>
    <path d="M44 0 L8 -6 L8 6 Z" fill="#7df4ff" opacity=".9"/>
    <path d="M44 0 L10 -3 L26 -1.2 Z" fill="#ffffff" opacity=".7"/>
    <g>
      <rect x="-70" y="-30" width="22" height="9" rx="3" fill="#0a1530" stroke="#e6c170" stroke-width="1"/>
      <rect x="-70" y="21" width="22" height="9" rx="3" fill="#0a1530" stroke="#e6c170" stroke-width="1"/>
      <circle cx="-72" cy="-25.5" r="6" fill="url(#engine)"/>
      <circle cx="-72" cy="25.5" r="6" fill="url(#engine)"/>
      <path d="M-76 -25.5 L-150 -25.5 L-76 -21 Z" fill="url(#flame)"/>
      <path d="M-76 25.5 L-150 25.5 L-76 30 Z" fill="url(#flame)"/>
    </g>
  </g>`;
}

const defsCommon = [
  lin("sky", [[0, "#02060f"], [0.45, "#071836"], [0.78, "#0d3a63"], [1, "#12708a"]]),
  rad("horizon", [[0, "#3be8ff", 0.55], [0.5, "#1590b8", 0.22], [1, "#0a3a5c", 0]]),
  rad("moon", [[0, "#e9fbff", 0.9], [0.18, "#bfeeff", 0.45], [1, "#bfeeff", 0]]),
  rad("cyanBloom", [[0, "#7df4ff", 0.9], [1, "#22d3ee", 0]]),
  rad("engine", [[0, "#ffffff"], [0.4, "#7df4ff"], [1, "#22d3ee"]]),
  lin("hull", [[0, "#2a3f73"], [0.5, "#0f1d40"], [1, "#050c20"]], 0, 0, 1, 1),
  lin("flame", [[0, "#22d3ee", 0], [1, "#bdf8ff", 0.95]], 0, 0, 1, 0),
  lin("trail", [[0, "#22d3ee", 0], [0.55, "#22d3ee", 0.55], [1, "#d9fdff", 1]], 0, 1, 1, 0),
  lin("haze", [[0, "#0b3c5e", 0], [0.7, "#0f6f8a", 0.45], [1, "#0b3c5e", 0]]),
  lin("hazeDark", [[0, "#050b1c", 0], [1, "#050b1c", 0.95]]),
  blurF("b4", 4),
  blurF("b12", 12),
  blurF("b40", 40),
].join("");

function back() {
  const r = rng(11);
  let stars = "";
  for (let i = 0; i < 260; i++) {
    const y = Math.pow(r(), 1.6) * 560;
    stars += `<circle cx="${n(r() * W)}" cy="${n(y)}" r="${n(0.5 + r() * 1.3)}" fill="#e8fbff" opacity="${n(0.25 + r() * 0.7)}"/>`;
  }
  const cloud = (cx, cy, s, o) =>
    `<g opacity="${o}" filter="url(#b12)"><ellipse cx="${cx}" cy="${cy}" rx="${220 * s}" ry="${26 * s}" fill="#1c5a86"/><ellipse cx="${cx + 90 * s}" cy="${cy - 14 * s}" rx="${150 * s}" ry="${22 * s}" fill="#24739c"/></g>`;
  return doc(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>
     <ellipse cx="800" cy="640" rx="900" ry="260" fill="url(#horizon)"/>
     <circle cx="1180" cy="190" r="170" fill="url(#moon)"/>
     ${stars}
     ${cloud(300, 330, 1.2, 0.35)}${cloud(1320, 420, 1.4, 0.3)}${cloud(760, 520, 1, 0.28)}${cloud(1500, 250, 0.9, 0.25)}`,
    defsCommon,
  );
}

function mid() {
  const far = towers({ seed: 21, x0: -20, x1: W + 20, base: 800, minH: 180, maxH: 340, minW: 30, maxW: 74, fill: "#0a1a3a", win: ["#e6c170", "#7df4ff", "#bfeeff"], winChance: 0.22 });
  const trailPath = "M 420 790 C 600 780, 800 640, 1010 300";
  return doc(
    `<g opacity=".92">${far}</g>
     <rect x="0" y="540" width="${W}" height="260" fill="url(#haze)"/>
     <path d="${trailPath}" fill="none" stroke="#22d3ee" stroke-width="22" stroke-linecap="round" opacity=".28" filter="url(#b12)"/>
     <path d="${trailPath}" fill="none" stroke="url(#trail)" stroke-width="6" stroke-linecap="round"/>
     <path d="${trailPath}" fill="none" stroke="#eaffff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
     <g transform="translate(1030 270) rotate(-62) scale(1.55)">${aircraft()}</g>`,
    defsCommon,
  );
}

function front() {
  const left = towers({ seed: 31, x0: -30, x1: 470, base: 900, minH: 260, maxH: 560, minW: 70, maxW: 150, fill: "#050b1c", win: ["#e6c170", "#e6c170", "#7df4ff"], winChance: 0.34 });
  const right = towers({ seed: 37, x0: 1130, x1: W + 30, base: 900, minH: 240, maxH: 520, minW: 70, maxW: 150, fill: "#050b1c", win: ["#e6c170", "#7df4ff", "#7df4ff"], winChance: 0.34 });
  const low = towers({ seed: 41, x0: 470, x1: 1130, base: 900, minH: 60, maxH: 150, minW: 50, maxW: 110, fill: "#040918", win: ["#e6c170", "#7df4ff"], winChance: 0.3, antenna: false });
  return doc(
    `${left}${right}${low}
     <rect x="0" y="690" width="${W}" height="210" fill="url(#hazeDark)"/>
     <ellipse cx="800" cy="900" rx="720" ry="90" fill="#22d3ee" opacity=".16" filter="url(#b40)"/>`,
    defsCommon,
  );
}

await mkdir(dir, { recursive: true });
const render = (svg) => sharp(Buffer.from(svg), { density: 72 }).resize(W, H).ensureAlpha().png().toBuffer();
const [b, m, f] = [await render(back()), await render(mid()), await render(front())];

await sharp(b).removeAlpha().webp({ quality: 74, effort: 5 }).toFile(path.join(dir, "back.webp"));
await sharp(m).webp({ quality: 76, alphaQuality: 80, effort: 5 }).toFile(path.join(dir, "mid.webp"));
await sharp(f).webp({ quality: 76, alphaQuality: 80, effort: 5 }).toFile(path.join(dir, "front.webp"));

const comp = await sharp(b).removeAlpha().composite([{ input: m }, { input: f }]).png().toBuffer();
await sharp(comp).resize(2752, 1536).webp({ quality: 80, effort: 5 }).toFile(path.join(dir, "poster.webp"));
await sharp(comp).resize(640, 360).webp({ quality: 74, effort: 5 }).toFile(path.join(dir, "thumb.webp"));
await sharp(comp).resize(1000, 563).jpeg({ quality: 82 }).toFile(path.join(root, "scripts", "art", "_preview", "skyfall.jpg")).catch(async () => {
  await mkdir(path.join(root, "scripts", "art", "_preview"), { recursive: true });
  await sharp(comp).resize(1000, 563).jpeg({ quality: 82 }).toFile(path.join(root, "scripts", "art", "_preview", "skyfall.jpg"));
});
console.log("skyfall art written to", dir);
