// ROULETTE cover art: a dark luxury salon, a mahogany roulette wheel with a brass rim seen in perspective,
// red and black pockets with a green zero and an ivory ball, green felt in the foreground with gold lines and chips.
// No text is rendered. Run on its own:  node scripts/art/roulette.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { H, W, blurF, doc, lin, n, rad, rng, stoneF } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dir = path.join(root, "public", "art", "roulette");

const POCKETS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

const defs = [
  lin("room", [[0, "#050505"], [0.5, "#0d0a08"], [1, "#050505"]]),
  rad("warm", [[0, "#ffcf8a", 0.9], [0.3, "#e0912f", 0.35], [1, "#7a3e08", 0]]),
  rad("spot", [[0, "#ffd9a0", 0.5], [1, "#ffd9a0", 0]]),
  lin("wood", [[0, "#a2562a"], [0.5, "#5c2a12"], [1, "#25100a"]], 0, 0, 0, 1),
  lin("woodTop", [[0, "#c47a3d"], [0.5, "#74361a"], [1, "#3a180c"]], 0, 0, 1, 1),
  lin("brass", [[0, "#fff0b8"], [0.35, "#d9ab4a"], [0.7, "#8d6118"], [1, "#e8c46a"]], 0, 0, 1, 1),
  lin("brassV", [[0, "#fff0b8"], [0.5, "#c9962f"], [1, "#6b4710"]]),
  lin("felt", [[0, "#0d5a35"], [1, "#04281a"]]),
  rad("cone", [[0, "#f0cf78"], [0.4, "#a8742a"], [1, "#4a2a0c"]], 0.45, 0.4, 0.6),
  rad("ball", [[0, "#ffffff"], [0.6, "#e8e0cc"], [1, "#9a9078"]], 0.35, 0.3, 0.7),
  rad("chipR", [[0, "#e03a44"], [1, "#7c1018"]]),
  rad("chipK", [[0, "#3a3a44"], [1, "#0c0c10"]]),
  rad("chipB", [[0, "#3a6be0"], [1, "#12307c"]]),
  blurF("b4", 4),
  blurF("b10", 10),
  blurF("b30", 30),
  blurF("b60", 60),
  stoneF("grain", { freq: "0.004 0.09", oct: 4, scale: 1.2, k: 1.25, az: 235, el: 55, seed: 9 }),
].join("");

/* ------------------------------- the wheel ------------------------------- */
const CX = 800;
const CY = 410;
const RX = 360;
const RY = 150;
const pt = (a, r, lift = 0) => [CX + Math.sin(a) * RX * r, CY - Math.cos(a) * RY * r - lift];
const poly = (pts, attrs) => `<polygon points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(" ")}" ${attrs}/>`;

function wheel() {
  let pockets = "";
  let frets = "";
  for (let i = 0; i < 37; i++) {
    const a0 = ((i - 0.5) / 37) * Math.PI * 2;
    const a1 = ((i + 0.5) / 37) * Math.PI * 2;
    const num = POCKETS[i];
    const col = num === 0 ? "#12823f" : RED.has(num) ? "#b8222c" : "#0b0b0e";
    pockets += poly([pt(a0, 0.78), pt(a1, 0.78), pt(a1, 0.52), pt(a0, 0.52)], `fill="${col}"`);
    // the number band on the outside of the pockets
    pockets += poly([pt(a0, 0.86), pt(a1, 0.86), pt(a1, 0.78), pt(a0, 0.78)], `fill="#15110c" stroke="#caa44a" stroke-width=".8"`);
    const [fx0, fy0] = pt(a0, 0.86);
    const [fx1, fy1] = pt(a0, 0.52);
    frets += `<line x1="${n(fx0)}" y1="${n(fy0)}" x2="${n(fx1)}" y2="${n(fy1)}" stroke="#e4c06a" stroke-width="2"/>`;
    // a tiny light dash standing in for the printed number
    const [tx, ty] = pt((i / 37) * Math.PI * 2, 0.82);
    pockets += `<ellipse cx="${n(tx)}" cy="${n(ty)}" rx="3.2" ry="1.4" fill="#f3e6c4" opacity=".85"/>`;
  }
  const ring = (r, attrs) => `<ellipse cx="${CX}" cy="${CY}" rx="${n(RX * r)}" ry="${n(RY * r)}" ${attrs}/>`;
  return `
  <ellipse cx="${CX}" cy="${CY + 70}" rx="${RX * 1.18}" ry="${RY * 1.25}" fill="#000" opacity=".7" filter="url(#b30)"/>
  <!-- the wooden bowl: a lower rim shows its thickness -->
  <path d="M${CX - RX * 1.12} ${CY} L${CX - RX * 1.12} ${CY + 46} A${RX * 1.12} ${RY * 1.12} 0 0 0 ${CX + RX * 1.12} ${CY + 46} L${CX + RX * 1.12} ${CY} Z" fill="url(#wood)" filter="url(#grain)"/>
  ${ring(1.12, `fill="url(#woodTop)" filter="url(#grain)"`)}
  ${ring(1.12, `fill="none" stroke="url(#brass)" stroke-width="5"`)}
  ${ring(1.02, `fill="none" stroke="#2a1008" stroke-width="3"`)}
  <!-- the ball track -->
  ${ring(0.99, `fill="#2e140a"`)}
  ${ring(0.9, `fill="#c58848" opacity=".55"`)}
  ${ring(0.88, `fill="none" stroke="url(#brass)" stroke-width="3"`)}
  <!-- pockets and frets -->
  ${ring(0.86, `fill="#0b0b0e"`)}
  ${pockets}
  ${frets}
  ${ring(0.52, `fill="none" stroke="url(#brass)" stroke-width="3"`)}
  <!-- the cone and spindle -->
  ${ring(0.5, `fill="#3a1d0c"`)}
  ${ring(0.42, `fill="url(#cone)" filter="url(#grain)"`)}
  ${ring(0.42, `fill="none" stroke="#f0d78a" stroke-width="2"/>`.replace("/>", ""))}
  ${ring(0.22, `fill="url(#brass)"`)}
  <ellipse cx="${CX}" cy="${CY - 6}" rx="${RX * 0.15}" ry="${RY * 0.15}" fill="#f6dc94" opacity=".9"/>
  <!-- the turret -->
  <path d="M${CX - 10} ${CY - 4} L${CX - 6} ${CY - 120} L${CX + 6} ${CY - 120} L${CX + 10} ${CY - 4} Z" fill="url(#brassV)"/>
  <ellipse cx="${CX}" cy="${CY - 70}" rx="22" ry="8" fill="url(#brassV)"/>
  <ellipse cx="${CX}" cy="${CY - 124}" rx="15" ry="9" fill="url(#brassV)"/>
  <circle cx="${CX}" cy="${CY - 142}" r="12" fill="url(#brassV)"/>
  <circle cx="${CX - 4}" cy="${CY - 146}" r="4" fill="#fff6d0" opacity=".9"/>
  <!-- the ivory ball resting on the track, with its shadow -->
  <ellipse cx="${n(CX + RX * 0.5)}" cy="${n(CY - RY * 0.86 + 9)}" rx="9" ry="4" fill="#000" opacity=".5"/>
  <circle cx="${n(CX + RX * 0.5)}" cy="${n(CY - RY * 0.86)}" r="10" fill="url(#ball)"/>
  <circle cx="${n(CX + RX * 0.5 - 3)}" cy="${n(CY - RY * 0.86 - 3)}" r="3" fill="#fff" opacity=".9"/>
  `;
}

function chip(x, y, grad, edge, stack = 1) {
  let s = "";
  for (let i = stack - 1; i >= 0; i--) {
    const yy = y - i * 14;
    s += `<ellipse cx="${x}" cy="${yy + 12}" rx="60" ry="22" fill="${edge}"/>
    <rect x="${x - 60}" y="${yy}" width="120" height="12" fill="${edge}"/>
    <ellipse cx="${x}" cy="${yy}" rx="60" ry="22" fill="url(#${grad})"/>
    <ellipse cx="${x}" cy="${yy}" rx="46" ry="16" fill="none" stroke="#f3ead2" stroke-width="3" stroke-dasharray="14 10"/>
    <ellipse cx="${x}" cy="${yy}" rx="30" ry="10" fill="none" stroke="#f3ead2" stroke-width="1.5" opacity=".7"/>`;
  }
  return `<ellipse cx="${x}" cy="${y + 26}" rx="70" ry="16" fill="#000" opacity=".5" filter="url(#b10)"/>${s}`;
}

/* --------------------------------- layers --------------------------------- */
function back() {
  const r = rng(11);
  let bokeh = "";
  for (let i = 0; i < 46; i++) {
    const x = r() * W;
    const y = 30 + r() * 420;
    const rr = 8 + r() * 36;
    bokeh += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rr)}" fill="${r() < 0.7 ? "#ffc774" : "#ff9a52"}" opacity="${n(0.1 + r() * 0.35)}" filter="url(#b4)"/>`;
  }
  return doc(
    `<rect width="${W}" height="${H}" fill="url(#room)"/>
     <ellipse cx="800" cy="260" rx="760" ry="320" fill="url(#warm)" opacity=".28"/>
     <ellipse cx="260" cy="170" rx="260" ry="200" fill="url(#warm)" opacity=".4"/>
     <ellipse cx="1340" cy="170" rx="260" ry="200" fill="url(#warm)" opacity=".4"/>
     ${bokeh}
     <rect x="0" y="470" width="${W}" height="430" fill="#060505" opacity=".7"/>`,
    defs,
  );
}

function mid() {
  return doc(
    `<ellipse cx="800" cy="330" rx="520" ry="220" fill="url(#spot)" opacity=".55" filter="url(#b30)"/>
     ${wheel()}`,
    defs,
  );
}

function front() {
  const r = rng(5);
  let lines = "";
  for (let i = -6; i <= 6; i++) lines += `<line x1="${800 + i * 70}" y1="700" x2="${800 + i * 250}" y2="900" stroke="#caa44a" stroke-width="1.5" opacity=".35"/>`;
  return doc(
    `<path d="M0 690 L${W} 690 L${W} ${H} L0 ${H} Z" fill="url(#felt)"/>
     <path d="M0 690 L${W} 690" stroke="#e4c06a" stroke-width="4"/>
     <path d="M0 704 L${W} 704" stroke="#caa44a" stroke-width="1.5" opacity=".7"/>
     ${lines}
     <ellipse cx="800" cy="860" rx="780" ry="90" fill="#000" opacity=".4" filter="url(#b30)"/>
     ${chip(300, 760, "chipR", "#5a0c12", 4)}
     ${chip(450, 800, "chipK", "#050507", 2)}
     ${chip(1240, 770, "chipB", "#0c2260", 3)}
     ${chip(1110, 810, "chipR", "#5a0c12", 1)}
     <rect x="0" y="0" width="${W}" height="${H}" fill="none"/>`,
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
await sharp(comp).resize(1000, 563).jpeg({ quality: 82 }).toFile(path.join(prev, "roulette.jpg"));
console.log("roulette art written to", dir);
