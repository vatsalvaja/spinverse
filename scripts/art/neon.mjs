import { W, H, rng, n, lerp, doc, lin, rad, blurF, stoneF, poly } from "./lib.mjs";

// Neon Overdrive: District Zero. A rain-slick canyon in one-point perspective. Vanishing point (800,470).
export const ORBS = [
  { x: 500, y: 772, r: 30, a: "#ff4fd8", b: "#7a1d8a" },
  { x: 650, y: 820, r: 36, a: "#6ff2ff", b: "#1b6bff" },
  { x: 800, y: 846, r: 42, a: "#fff0a8", b: "#ff8a1f" },
  { x: 950, y: 820, r: 36, a: "#9b5cff", b: "#3a1380" },
  { x: 1100, y: 772, r: 30, a: "#6ff2ff", b: "#1b6bff" },
];
export const FLICKER = [
  { x: 306, y: 330 },
  { x: 1316, y: 372 },
  { x: 486, y: 500 },
];

const CYAN = "#6ff2ff";
const MAG = "#ff4fd8";
const VIO = "#9b5cff";
const WARM = "#ffd98a";
const NEONS = [CYAN, MAG, VIO, "#ff9a3a"];

const VPX = 800;
const VPY = 470;
const WALL = 900;
const proj = (X, Y, s) => [VPX + X * s, VPY + Y * s, s];
const base = (s) => VPY + 420 * s; // street contact line at depth s

const defsCommon = () =>
  [
    blurF("b2", 2),
    blurF("b4", 4),
    blurF("b8", 8),
    blurF("b16", 16),
    blurF("b40", 40),
    stoneF("concrete", { freq: "0.02 0.05", oct: 3, scale: 1.0, k: 1.08, seed: 6, el: 65 }),
    `<filter id="streak" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2 14"/></filter>`,
  ].join("");

/** Build the street-facing canyon walls. Returns { draw, reflect, signs }. */
function canyon(seed) {
  const r = rng(seed);
  const S = Array.from({ length: 10 }, (_, k) => 1.45 * Math.pow(0.8, k)); // 1.45 … 0.19
  let draw = "";
  let reflect = "";
  let glowLines = "";
  const signs = [];
  const refl = (pts) => pts.map(([x, y, s]) => `${n(x)},${n(2 * base(s) - y)}`).join(" ");
  const pstr = (pts) => pts.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");

  for (let k = S.length - 2; k >= 0; k--) {
    for (const side of [-1, 1]) {
      const sa = S[k];
      const sb = S[k + 1];
      const off = r() * 120;
      const X = side * (WALL - off);
      const Hw = 420 + r() * 760 + (k < 3 ? 520 : 0);
      const tint = r();
      const baseCol = tint < 0.34 ? ["#150a3a", "#0a0522"] : tint < 0.67 ? ["#1c0b44", "#0b0526"] : ["#0e1240", "#070a26"];

      const A = proj(X, -Hw, sa);
      const B = proj(X, -Hw, sb);
      const C = proj(X, 420, sb);
      const D = proj(X, 420, sa);
      // front face (the end of the building facing the viewer), visible when a nearer building steps back
      const outer = proj(side * 1400, -Hw, sa);
      const outerB = proj(side * 1400, 420, sa);
      const face = `<polygon points="${pstr([A, outer, outerB, D])}" fill="#07031a"/>`;
      const facade = `<polygon points="${pstr([A, B, C, D])}" fill="url(#fac${tint < 0.34 ? 0 : tint < 0.67 ? 1 : 2})" filter="url(#concrete)"/>`;
      let g = face + facade;
      let gr = `<polygon points="${refl([A, B, C, D])}" fill="#0c0630"/>`;

      // windows in projective space
      const cols = 3 + Math.floor((1 / sb - 1 / sa) * 1.4);
      const rows = Math.floor((Hw + 380) / 64);
      for (let j = 0; j < rows; j++) {
        const Y = -Hw + 60 + j * 64;
        for (let i = 0; i < cols * 2; i++) {
          if (r() < 0.5) continue;
          const u0 = (i + 0.2) / (cols * 2);
          const u1 = (i + 0.62) / (cols * 2);
          const s0 = 1 / lerp(1 / sa, 1 / sb, u0);
          const s1 = 1 / lerp(1 / sa, 1 / sb, u1);
          const quad = [proj(X, Y, s0), proj(X, Y, s1), proj(X, Y + 30, s1), proj(X, Y + 30, s0)];
          const c = r() < 0.1 ? MAG : r() < 0.16 ? CYAN : r() < 0.26 ? "#8f7bff" : WARM;
          const op = n(0.22 + r() * 0.55);
          g += `<polygon points="${pstr(quad)}" fill="${c}" opacity="${op}"/>`;
          gr += `<polygon points="${refl(quad)}" fill="${c}" opacity="${op}"/>`;
        }
      }
      // neon edges + bands
      const nc = NEONS[Math.floor(r() * NEONS.length)];
      const edge = (p, q, w = 3, c = nc) => {
        glowLines += `<line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(q[0])}" y2="${n(q[1])}" stroke="${c}" stroke-width="${w * 3}" opacity=".65"/>`;
        g += `<line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(q[0])}" y2="${n(q[1])}" stroke="${c}" stroke-width="${w}"/><line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(q[0])}" y2="${n(q[1])}" stroke="#fff" stroke-opacity=".7" stroke-width="${n(w * 0.35)}"/>`;
        gr += `<line x1="${n(p[0])}" y1="${n(2 * base(p[2]) - p[1])}" x2="${n(q[0])}" y2="${n(2 * base(q[2]) - q[1])}" stroke="${c}" stroke-width="${w}" opacity=".9"/>`;
      };
      edge(A, D, 3.4 * Math.min(1.2, sa + 0.3));
      edge(A, B, 2.6);
      const bandY = -Hw * (0.25 + r() * 0.5);
      if (r() < 0.8) edge(proj(X, bandY, sa), proj(X, bandY, sb), 2.2, NEONS[Math.floor(r() * 4)]);
      // vertical neon sign strip
      if (r() < 0.55) {
        const u = 0.15 + r() * 0.5;
        const sv = 1 / lerp(1 / sa, 1 / sb, u);
        const top = -Hw * (0.2 + r() * 0.5);
        edge(proj(X, top, sv), proj(X, top + 300 + r() * 260, sv), 4, NEONS[Math.floor(r() * 4)]);
      }
      // billboard
      if (r() < 0.7 && sa < 1.2) {
        const u0 = 0.15;
        const u1 = 0.85;
        const s0 = 1 / lerp(1 / sa, 1 / sb, u0);
        const s1 = 1 / lerp(1 / sa, 1 / sb, u1);
        const Y0 = -Hw * (0.15 + r() * 0.45);
        const hh = 230 + r() * 120;
        const q = [proj(X, Y0, s0), proj(X, Y0, s1), proj(X, Y0 + hh, s1), proj(X, Y0 + hh, s0)];
        const c = NEONS[Math.floor(r() * 4)];
        glowLines += `<polygon points="${pstr(q)}" fill="${c}" opacity=".4"/>`;
        g += `<polygon points="${pstr(q)}" fill="#0a0420" stroke="${c}" stroke-width="3"/>`;
        const at = (a, b) => [lerp(lerp(q[0][0], q[1][0], a), lerp(q[3][0], q[2][0], a), b), lerp(lerp(q[0][1], q[1][1], a), lerp(q[3][1], q[2][1], a), b)];
        // abstract glyphs
        for (let t = 0; t < 4; t++) {
          const a0 = 0.08 + t * 0.22;
          const kind = Math.floor(r() * 4);
          const pts = kind === 0 ? [[a0, 0.2], [a0 + 0.14, 0.2], [a0 + 0.14, 0.8], [a0, 0.8], [a0, 0.2]] : kind === 1 ? [[a0, 0.8], [a0 + 0.07, 0.2], [a0 + 0.14, 0.8]] : kind === 2 ? [[a0, 0.5], [a0 + 0.14, 0.5], [a0 + 0.07, 0.2], [a0 + 0.07, 0.8]] : [[a0, 0.2], [a0 + 0.14, 0.5], [a0, 0.8]];
          g += `<polyline points="${pts.map(([a, b]) => at(a, b).map(n).join(",")).join(" ")}" fill="none" stroke="${t % 2 ? "#fff" : c}" stroke-width="${n(3.2 * Math.min(1.3, sa + 0.4))}" stroke-linejoin="round" stroke-linecap="round"/>`;
        }
        gr += `<polygon points="${refl(q)}" fill="${c}" opacity=".5"/>`;
        if (r() < 0.5) signs.push({ x: n((q[0][0] + q[2][0]) / 2), y: n((q[0][1] + q[2][1]) / 2) });
      }
      // roof gear: antennas
      if (r() < 0.6) {
        const sv = 1 / lerp(1 / sa, 1 / sb, 0.5);
        const p = proj(X, -Hw, sv);
        g += `<line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(p[0])}" y2="${n(p[1] - 150 * sv)}" stroke="#2a2060" stroke-width="${n(5 * sv)}"/><circle cx="${n(p[0])}" cy="${n(p[1] - 154 * sv)}" r="${n(5 * sv + 2)}" fill="#ff3a5a"/>`;
      }
      draw += g;
      reflect += gr;
    }
    // skybridges across the street at selected depths
    if (k === 6) {
      const s = S[k];
      const Y = -380 - (k === 6 ? 60 : 0);
      const q = [proj(-WALL, Y, s), proj(WALL, Y, s), proj(WALL, Y + 90, s), proj(-WALL, Y + 90, s)];
      draw += `<polygon points="${pstr(q)}" fill="#0e0830" stroke="${CYAN}" stroke-width="2.5"/><line x1="${n(q[0][0])}" y1="${n(q[0][1] + 6)}" x2="${n(q[1][0])}" y2="${n(q[1][1] + 6)}" stroke="${MAG}" stroke-width="3"/>`;
      for (let i = 0; i < 22; i++) draw += `<rect x="${n(lerp(q[0][0], q[1][0], i / 22) + 4)}" y="${n(q[0][1] + 28 * s)}" width="${n(18 * s)}" height="${n(26 * s)}" fill="${WARM}" opacity=".7"/>`;
      glowLines += `<line x1="${n(q[0][0])}" y1="${n(q[0][1] + 6)}" x2="${n(q[1][0])}" y2="${n(q[1][1] + 6)}" stroke="${MAG}" stroke-width="10" opacity=".55"/>`;
      reflect += `<polygon points="${refl(q)}" fill="#1a0a50"/>`;
    }
  }
  return { draw, reflect, glow: glowLines, signs };
}

export function layers() {
  const common = defsCommon();
  const facDefs = [
    lin("fac0", [[0, "#26115a"], [1, "#0a0522"]]),
    lin("fac1", [[0, "#2a1260"], [1, "#0b0526"]]),
    lin("fac2", [[0, "#142060"], [1, "#070a26"]]),
  ].join("");
  const cn = canyon(321);

  /* ======================= BACK ======================= */
  const rb = rng(9);
  let back = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  for (let i = 0; i < 70; i++) back += `<circle cx="${n(rb() * W)}" cy="${n(rb() * 380)}" r="${n(0.6 + rb() * 1.3)}" fill="#d6dcff" opacity="${n(0.3 + rb() * 0.5)}"/>`;
  back += `<ellipse cx="800" cy="600" rx="900" ry="260" fill="url(#hzGlow)"/>`;
  // ring moon
  back += `<circle cx="800" cy="270" r="250" fill="#9b5cff" opacity=".12" filter="url(#b40)"/>`;
  back += `<circle cx="800" cy="270" r="190" fill="url(#moon)"/>`;
  back += `<g clip-path="url(#moonClip)">${Array.from({ length: 16 }, (_, i) => `<rect x="600" y="${110 + i * 25}" width="400" height="${2 + (i % 4)}" fill="${MAG}" opacity="${n(0.1 + (i % 5) * 0.05)}"/>`).join("")}<circle cx="730" cy="230" r="62" fill="#5b2fb8" opacity=".4"/><circle cx="880" cy="330" r="40" fill="#5b2fb8" opacity=".35"/></g>`;
  back += `<clipPath id="moonClip"><circle cx="800" cy="270" r="188"/></clipPath>`;
  back += `<circle cx="800" cy="270" r="204" fill="none" stroke="url(#ring)" stroke-width="9"/><circle cx="800" cy="270" r="204" fill="none" stroke="url(#ring)" stroke-width="22" opacity=".35" filter="url(#b8)"/>`;
  back += `<circle cx="800" cy="270" r="238" fill="none" stroke="${CYAN}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="6 16"/><circle cx="800" cy="270" r="270" fill="none" stroke="${MAG}" stroke-opacity=".4" stroke-width="1.5" stroke-dasharray="34 24"/>`;
  // far skyline bands
  const skyline = (seed, y0, hmin, hmax, fill, win, op) => {
    const r = rng(seed);
    let o = `<g opacity="${op}">`;
    for (let x = -30; x < W + 30; ) {
      const w = 30 + r() * 70;
      const h = hmin + r() * (hmax - hmin);
      o += `<rect x="${n(x)}" y="${n(y0 - h)}" width="${n(w)}" height="${n(h + 160)}" fill="${fill}"/>`;
      if (r() < 0.3) o += `<line x1="${n(x + w / 2)}" y1="${n(y0 - h)}" x2="${n(x + w / 2)}" y2="${n(y0 - h - 30 - r() * 50)}" stroke="${fill}" stroke-width="3"/>`;
      for (let j = 0; j < Math.floor(h / 32); j++) for (let i = 0; i < Math.floor(w / 18); i++) if (r() < win) o += `<rect x="${n(x + 5 + i * 17)}" y="${n(y0 - h + 10 + j * 30)}" width="7" height="9" fill="${r() < 0.5 ? CYAN : r() < 0.5 ? MAG : WARM}" opacity="${n(0.3 + r() * 0.6)}"/>`;
      x += w + r() * 8;
    }
    return o + "</g>";
  };
  back += skyline(1, 640, 120, 360, "#160a45", 0.2, 0.9);
  back += `<rect y="380" width="${W}" height="300" fill="url(#fogA)"/>`;
  back += skyline(2, 650, 80, 240, "#0f0836", 0.25, 1);
  back += `<rect y="470" width="${W}" height="220" fill="url(#fogB)"/>`;
  // energy tower
  back += `<g><polygon points="788,650 812,650 806,150 794,150" fill="#0a0426" stroke="${CYAN}" stroke-width="2.5"/><polygon points="778,650 822,650 812,520 788,520" fill="#0a0426" stroke="${MAG}" stroke-width="2.5"/>${[200, 270, 340, 410, 480].map((y, i) => `<ellipse cx="800" cy="${y}" rx="${26 + i * 5}" ry="${6 + i}" fill="none" stroke="${NEONS[i % 4]}" stroke-width="3"/>`).join("")}<circle cx="800" cy="170" r="22" fill="#fff"/><circle cx="800" cy="170" r="70" fill="${CYAN}" opacity=".5" filter="url(#b16)"/><line x1="800" y1="150" x2="800" y2="-10" stroke="${CYAN}" stroke-width="4"/><line x1="800" y1="150" x2="800" y2="-10" stroke="${CYAN}" stroke-width="22" opacity=".3" filter="url(#b8)"/></g>`;
  // lightning arcs
  const rl = rng(14);
  [[800, 200, 480, 330], [800, 240, 1130, 360]].forEach(([x0, y0, x1, y1]) => {
    let pts = `${x0},${y0}`;
    for (let i = 1; i <= 9; i++) pts += ` ${n(lerp(x0, x1, i / 9) + (rl() - 0.5) * 36)},${n(lerp(y0, y1, i / 9) + (rl() - 0.5) * 36)}`;
    back += `<polyline points="${pts}" fill="none" stroke="${CYAN}" stroke-width="7" opacity=".5" filter="url(#b4)"/><polyline points="${pts}" fill="none" stroke="#fff" stroke-width="1.8"/>`;
  });
  back += `<rect y="560" width="${W}" height="340" fill="url(#fogC)"/>`;
  const backDefs =
    common +
    lin("sky", [[0, "#05011a"], [0.38, "#1a0a4a"], [0.62, "#58147c"], [0.8, "#c0267a"], [1, "#ff6a8a"]]) +
    rad("hzGlow", [[0, "#ff4fd8", 0.6], [1, "#ff4fd8", 0]]) +
    rad("moon", [[0, "#3a1380"], [1, "#0a0322"]], 0.5, 0.4, 0.7) +
    lin("ring", [[0, CYAN], [0.5, VIO], [1, MAG]], 0, 0, 1, 1) +
    lin("fogA", [[0, "#3a1890", 0], [1, "#a1239a", 0.5]]) +
    lin("fogB", [[0, "#3a1890", 0], [1, "#a1239a", 0.55]]) +
    lin("fogC", [[0, "#2a0e70", 0], [1, "#8a1f8a", 0.6]]);

  /* ======================= MID ======================= */
  let mid = `<g>${cn.glow}</g>`.replace("<g>", `<g filter="url(#b8)">`);
  mid += cn.draw;
  // neon light spill on facades
  mid += `<rect width="${W}" height="${H}" fill="url(#vigM)"/>`;
  const midDefs = common + facDefs + rad("vigM", [[0.45, "#000", 0], [1, "#04010f", 0.55]], 0.5, 0.5, 0.78);

  /* ======================= FRONT ======================= */
  const rf = rng(66);
  const sFar = 0.19;
  const streetPoly = [[VPX - WALL * sFar, base(sFar)], [VPX + WALL * sFar, base(sFar)], [VPX + WALL * 1.45, base(1.45)], [VPX - WALL * 1.45, base(1.45)]];
  let front = `<clipPath id="street"><polygon points="${streetPoly.map((p) => p.map(n).join(",")).join(" ")}"/></clipPath>`;
  front += `<polygon points="${streetPoly.map((p) => p.map(n).join(",")).join(" ")}" fill="url(#street)"/>`;
  front += `<g clip-path="url(#street)"><g filter="url(#streak)" opacity=".75">${cn.reflect}</g></g>`;
  front += `<polygon points="${streetPoly.map((p) => p.map(n).join(",")).join(" ")}" fill="url(#wet)"/>`;
  // lanes
  const lane = (X, col, w, dashed) => {
    let o = "";
    const steps = dashed ? 26 : 1;
    for (let i = 0; i < steps; i++) {
      const a = dashed ? sFar * Math.pow(1.45 / sFar, i / steps) : sFar;
      const b = dashed ? sFar * Math.pow(1.45 / sFar, (i + 0.5) / steps) : 1.45;
      const p = proj(X, 420, a);
      const q = proj(X, 420, b);
      o += `<line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(q[0])}" y2="${n(q[1])}" stroke="${col}" stroke-width="${n(w * (a + b))}" stroke-linecap="round"/>`;
    }
    return o;
  };
  front += `<g filter="url(#b4)" opacity=".8">${lane(0, MAG, 10, true)}${lane(-300, CYAN, 8, false)}${lane(300, CYAN, 8, false)}</g>` + lane(0, "#fff", 3, true) + lane(-300, "#bffcff", 2.4, false) + lane(300, "#bffcff", 2.4, false);
  // light trails of passing vehicles
  for (let i = 0; i < 9; i++) {
    const X = (rf() < 0.5 ? -1 : 1) * (60 + rf() * 560);
    const c = rf() < 0.5 ? "#ff3a5a" : rf() < 0.5 ? CYAN : "#ffb347";
    const a = sFar * (1 + rf() * 4);
    const b = a * (1.6 + rf() * 2.4);
    const p = proj(X, 400, a);
    const q = proj(X, 400, Math.min(1.45, b));
    front += `<line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(q[0])}" y2="${n(q[1])}" stroke="${c}" stroke-width="${n(14 * b)}" opacity=".35" filter="url(#b8)"/><line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(q[0])}" y2="${n(q[1])}" stroke="#fff" stroke-width="${n(2.4 * b)}" opacity=".85" stroke-linecap="round"/>`;
  }
  // puddles with ripples
  for (let i = 0; i < 9; i++) {
    const x = 120 + rf() * 1360;
    const y = 780 + rf() * 100;
    const rx = 40 + rf() * 120;
    front += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(rx * 0.13)}" fill="${NEONS[Math.floor(rf() * 4)]}" opacity=".18" filter="url(#b4)"/><ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx * 0.55)}" ry="${n(rx * 0.07)}" fill="none" stroke="#fff" stroke-opacity=".35"/>`;
  }
  // steam + foreground haze at the bottom
  front += `<rect y="${H - 160}" width="${W}" height="160" fill="url(#botShade)"/>`;
  front += `<rect width="${W}" height="${H}" fill="url(#vigF)"/>`;
  const frontDefs =
    common +
    lin("street", [[0, "#2a0a5a"], [0.4, "#12033c"], [1, "#05010f"]]) +
    lin("wet", [[0, "#ff4fd8", 0.22], [0.35, "#12033c", 0.25], [1, "#000", 0.35]]) +
    lin("botShade", [[0, "#000", 0], [1, "#04010f", 0.7]]) +
    rad("vigF", [[0.55, "#000", 0], [1, "#04010f", 0.55]], 0.5, 0.5, 0.8);

  return { back: doc(back, backDefs), mid: doc(mid, midDefs), front: doc(front, frontDefs), signs: cn.signs };
}
