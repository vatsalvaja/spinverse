import { W, H, rng, n, lerp, doc, lin, rad, blurF, stoneF, poly } from "./lib.mjs";

// Atlantis Cascade: a drowned kingdom seen along its grand avenue. Vanishing point (800,500).
export const CRYSTAL = { x: 800, y: 176 };
export const PEARL = { x: 800, y: 782 };

const defsCommon = () =>
  [
    lin("glassV", [[0, "#6ff0e4"], [0.5, "#1c92b4"], [1, "#06304f"]]),
    lin("glassH", [[0, "#04294a"], [0.5, "#2fb9c6"], [1, "#04294a"]], 0, 0, 1, 0),
    lin("glassL", [[0, "#04294a"], [0.55, "#1c92b4"], [1, "#8ff7ee"]], 0, 0, 1, 0),
    lin("glassR", [[0, "#8ff7ee"], [0.45, "#1c92b4"], [1, "#04294a"]], 0, 0, 1, 0),
    lin("gold", [[0, "#fff3c4"], [0.5, "#e3b951"], [1, "#8a5f14"]], 0, 0, 1, 1),
    lin("stoneA", [[0, "#0b3f62"], [1, "#04213a"]]),
    stoneF("stone", { freq: "0.012 0.03", scale: 1.3, k: 1.1, seed: 12, el: 60, az: 300 }),
    blurF("b3", 3),
    blurF("b8", 8),
    blurF("b16", 16),
    blurF("b30", 30),
    blurF("b60", 60),
  ].join("");

function windows(r, x, y, w, h, cols, rows, lit = 0.5, col = "#ffe9a8") {
  let o = "";
  const cw = w / cols;
  const ch = h / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const on = r() < lit;
      o += `<rect x="${n(x + i * cw + cw * 0.22)}" y="${n(y + j * ch + ch * 0.2)}" width="${n(cw * 0.56)}" height="${n(ch * 0.55)}" rx="${n(cw * 0.2)}" fill="${on ? col : "#06324f"}" opacity="${on ? n(0.55 + r() * 0.45) : 0.7}"/>`;
    }
  }
  return o;
}

function dome(cx, y, rx, ry, id) {
  const ribs = [-0.7, -0.35, 0, 0.35, 0.7].map((k) => `<path d="M${n(cx + k * rx)},${n(y)} Q${n(cx + k * rx * 0.55)},${n(y - ry * 0.9)} ${n(cx)},${n(y - ry)}" stroke="#bffcf5" stroke-opacity=".45" stroke-width="1.6" fill="none"/>`).join("");
  return `<path d="M${n(cx - rx)},${n(y)} A${rx},${ry} 0 0 1 ${n(cx + rx)},${n(y)}Z" fill="url(#${id})" stroke="#bffcf5" stroke-opacity=".7" stroke-width="2"/>${ribs}<path d="M${n(cx - rx * 0.8)},${n(y - ry * 0.25)} Q${n(cx - rx * 0.4)},${n(y - ry * 0.85)} ${n(cx)},${n(y - ry * 0.98)}" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}

/** A glass tower with tapered walls, ring bands and glowing windows. */
function tower(r, cx, base, top, wBase, wTop, grad, rings, lit = 0.5) {
  const hw0 = wBase / 2;
  const hw1 = wTop / 2;
  let o = `<g filter="url(#stone)"><polygon points="${n(cx - hw0)},${n(base)} ${n(cx - hw1)},${n(top)} ${n(cx + hw1)},${n(top)} ${n(cx + hw0)},${n(base)}" fill="url(#${grad})"/></g>`;
  for (let i = 1; i <= rings; i++) {
    const t = i / (rings + 1);
    const y = lerp(base, top, t);
    const hw = lerp(hw0, hw1, t);
    o += `<ellipse cx="${n(cx)}" cy="${n(y)}" rx="${n(hw + 8)}" ry="${n(hw * 0.12 + 2)}" fill="#0a4a6a" stroke="#9ff8ef" stroke-opacity=".75" stroke-width="2"/>`;
    o += windows(r, cx - hw * 0.7, y + 8, hw * 1.4, (base - top) / (rings + 1) - 20, 5, 3, lit);
  }
  o += `<line x1="${n(cx - hw1)}" y1="${n(top)}" x2="${n(cx - hw0)}" y2="${n(base)}" stroke="#d9fffa" stroke-opacity=".5" stroke-width="2"/>`;
  return o;
}

function coralTree(r, x, y, ang, len, wid, depth, col, tips) {
  if (depth === 0 || len < 6) {
    tips.push([x, y, col]);
    return "";
  }
  const x2 = x + Math.cos(ang) * len;
  const y2 = y + Math.sin(ang) * len;
  const cx = (x + x2) / 2 + (r() - 0.5) * len * 0.3;
  const cy = (y + y2) / 2 + (r() - 0.5) * len * 0.3;
  let o = `<path d="M${n(x)},${n(y)} Q${n(cx)},${n(cy)} ${n(x2)},${n(y2)}" stroke="${col}" stroke-width="${n(wid)}" stroke-linecap="round" fill="none"/>`;
  const k = 2 + (r() < 0.45 ? 1 : 0);
  for (let i = 0; i < k; i++) {
    const a = ang + (i - (k - 1) / 2) * (0.5 + r() * 0.45) + (r() - 0.5) * 0.25;
    o += coralTree(r, x2, y2, a, len * (0.68 + r() * 0.14), wid * 0.72, depth - 1, col, tips);
  }
  return o;
}

function seaFan(cx, y, s, col) {
  let o = "";
  for (let i = -8; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * 0.95;
    o += `<path d="M${cx},${y} L${n(cx + Math.cos(a) * 150 * s)},${n(y + Math.sin(a) * 150 * s)}" stroke="${col}" stroke-width="${n(2.2 * s)}" opacity=".85" fill="none"/>`;
  }
  for (let k = 1; k < 6; k++) o += `<path d="M${n(cx + Math.cos(-Math.PI / 2 - 0.95) * 25 * k * s)},${n(y + Math.sin(-Math.PI / 2 - 0.95) * 25 * k * s)} Q${cx},${n(y - 34 * k * s * 1.2)} ${n(cx + Math.cos(-Math.PI / 2 + 0.95) * 25 * k * s)},${n(y + Math.sin(-Math.PI / 2 + 0.95) * 25 * k * s)}" stroke="${col}" stroke-opacity=".5" stroke-width="${n(1.4 * s)}" fill="none"/>`;
  return o;
}

function kelp(x, base, h, sway, w, shade) {
  const pts = [];
  const seg = 7;
  for (let i = 0; i <= seg; i++) pts.push([x + Math.sin(i * 0.9 + sway) * (10 + i * 5), base - (h * i) / seg]);
  const left = pts.map(([px, py], i) => `${i ? "L" : "M"}${n(px - w * (1 - i / (seg + 1)))},${n(py)}`).join(" ");
  const right = [...pts].reverse().map(([px, py], i) => `L${n(px + w * (1 - (seg - i) / (seg + 1)))},${n(py)}`).join(" ");
  return `<path d="${left} ${right}Z" fill="${shade}" opacity=".92"/><path d="${pts.map(([px, py], i) => `${i ? "L" : "M"}${n(px)},${n(py)}`).join(" ")}" stroke="#7fe0c0" stroke-opacity=".28" stroke-width="2.4" fill="none"/>`;
}

export function layers() {
  const common = defsCommon();

  /* ======================= BACK ======================= */
  const rb = rng(11);
  let back = `<rect width="${W}" height="${H}" fill="url(#water)"/>`;
  back += `<rect width="${W}" height="520" fill="#d9fffa" filter="url(#caustic)" mask="url(#fadeTop)" opacity=".3"/>`;
  back += `<ellipse cx="380" cy="-30" rx="560" ry="300" fill="#bff9f2" opacity=".55" filter="url(#b60)"/>`;
  // light rays from the upper left
  for (let i = 0; i < 11; i++) {
    const x0 = -200 + i * 190;
    back += `<polygon points="${x0},-20 ${x0 + 70},-20 ${x0 + 520},${H} ${x0 + 250},${H}" fill="url(#ray)" opacity="${n(0.38 + (i % 3) * 0.14)}" filter="url(#b8)"/>`;
  }
  // far city bands
  const band = (seed, y0, hmin, hmax, fill, op, lights) => {
    const r = rng(seed);
    let o = `<g fill="${fill}" opacity="${op}">`;
    for (let x = -40; x < W + 40; ) {
      const w = 34 + r() * 70;
      const h = hmin + r() * (hmax - hmin);
      const k = r();
      o += `<rect x="${n(x)}" y="${n(y0 - h)}" width="${n(w)}" height="${n(h + 200)}"/>`;
      if (k < 0.35) o += `<path d="M${n(x - 3)},${n(y0 - h)} A${n(w / 2 + 3)},${n(w * 0.45)} 0 0 1 ${n(x + w + 3)},${n(y0 - h)}Z"/>`;
      else if (k < 0.65) o += `<polygon points="${n(x)},${n(y0 - h)} ${n(x + w / 2)},${n(y0 - h - 50 - r() * 60)} ${n(x + w)},${n(y0 - h)}"/>`;
      if (lights && r() < 0.8) {
        for (let j = 0; j < 4; j++) o += `<rect x="${n(x + w * (0.2 + (j % 2) * 0.4))}" y="${n(y0 - h + 12 + j * 26)}" width="5" height="8" fill="#bffcf5" opacity="${n(0.3 + r() * 0.5)}"/>`;
      }
      x += w + r() * 14;
    }
    return o + "</g>";
  };
  back += band(21, 640, 80, 260, "#0f7a98", 0.4, false);
  back += `<rect y="380" width="${W}" height="330" fill="url(#fog1)"/>`;
  back += band(22, 690, 100, 330, "#0a5f84", 0.62, true);
  back += `<rect y="430" width="${W}" height="300" fill="url(#fog2)"/>`;
  // glow behind the citadel
  back += `<circle cx="800" cy="420" r="520" fill="url(#cGlow)"/>`;
  // the citadel
  const rc = rng(33);
  let cit = "";
  // lower wide platform and wings
  cit += `<g filter="url(#stone)"><path d="M300,720 L1300,720 L1220,668 L380,668Z" fill="url(#stoneA)"/></g>`;
  [[560, 1], [1040, -1]].forEach(([cx, d]) => {
    cit += `<g filter="url(#stone)"><rect x="${cx - 120}" y="560" width="240" height="116" fill="url(#glassH)"/><rect x="${cx - 132}" y="548" width="264" height="14" fill="#0a4a6a" stroke="#9ff8ef" stroke-opacity=".7"/></g>`;
    cit += windows(rc, cx - 108, 572, 216, 90, 9, 3, 0.55);
    cit += dome(cx, 548, 96, 78, "domeG");
    cit += `<rect x="${cx - 3}" y="438" width="6" height="34" fill="#bffcf5"/><circle cx="${cx}" cy="434" r="8" fill="#fff"/><circle cx="${cx}" cy="434" r="32" fill="#7ff4e8" opacity=".35" filter="url(#b8)"/>`;
    // arches along the wing front
    for (let i = 0; i < 6; i++) cit += `<path d="M${cx - 100 + i * 40},676 V636 A20,20 0 0 1 ${cx - 60 + i * 40},636 V676" fill="#032038" opacity=".75"/>`;
    // aqueduct bridge to the spire
    cit += `<path d="M${cx + d * 120},640 Q${cx + d * 170},560 ${cx + d * 230},640" fill="none" stroke="#7ff4e8" stroke-width="8" opacity=".6"/><path d="M${cx + d * 120},640 Q${cx + d * 170},560 ${cx + d * 230},640" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>`;
  });
  // flanking slender spires
  cit += tower(rc, 330, 700, 360, 90, 26, "glassH", 5, 0.55) + tower(rc, 1270, 700, 380, 90, 26, "glassH", 5, 0.55);
  [[330, 352], [1270, 372]].forEach(([x, y]) => (cit += `<circle cx="${x}" cy="${y}" r="9" fill="#fff"/><circle cx="${x}" cy="${y}" r="38" fill="#7ff4e8" opacity=".4" filter="url(#b8)"/>`));
  // central spire in tiers
  cit += tower(rc, 800, 680, 250, 230, 54, "glassH", 8, 0.6);
  cit += `<g filter="url(#stone)"><path d="M700,520 L900,520 L880,480 L720,480Z" fill="url(#glassH)" stroke="#9ff8ef" stroke-opacity=".8"/><path d="M730,420 L870,420 L856,384 L744,384Z" fill="url(#glassH)" stroke="#9ff8ef" stroke-opacity=".8"/></g>`;
  cit += dome(800, 384, 56, 44, "domeG");
  // crystal beacon
  cit += `<circle cx="${CRYSTAL.x}" cy="${CRYSTAL.y}" r="190" fill="url(#crystalGlow)" opacity=".9"/>`;
  cit += `<polygon points="800,92 836,168 800,258 764,168" fill="url(#crystal)" stroke="#fff" stroke-opacity=".9" stroke-width="2"/><polygon points="800,92 836,168 800,168" fill="#fff" opacity=".6"/><polygon points="800,92 764,168 800,168" fill="#9ff8ef" opacity=".4"/><polygon points="800,168 836,168 800,258" fill="#1c92b4" opacity=".35"/>`;
  [-110, -60, 60, 110].forEach((dx) => (cit += `<line x1="800" y1="170" x2="${800 + dx * 2.4}" y2="${170 - 130}" stroke="#bffcf5" stroke-opacity=".35" stroke-width="3" filter="url(#b3)"/>`));
  // gold filigree bands
  [300, 360, 420].forEach((y) => (cit += `<path d="M${800 - (y - 250) * 0.19 - 26},${y} H${800 + (y - 250) * 0.19 + 26}" stroke="url(#gold)" stroke-width="5" opacity=".85"/>`));
  back += cit;
  back += `<rect y="500" width="${W}" height="400" fill="url(#fog3)"/>`;
  back += `<rect width="${W}" height="${H}" fill="url(#vigB)"/>`;

  const backDefs =
    common +
    lin("water", [[0, "#1cb0c6"], [0.12, "#0b7a9c"], [0.35, "#054a74"], [0.62, "#022444"], [1, "#010a1c"]]) +
    lin("ray", [[0, "#e8fffc", 0.8], [1, "#e8fffc", 0]]) +
    lin("fadeTopG", [[0, "#fff", 1], [1, "#000", 1]]) +
    `<mask id="fadeTop"><rect width="${W}" height="520" fill="url(#fadeTopG)"/></mask>` +
    `<filter id="caustic" x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency="0.022 0.05" numOctaves="2" seed="7" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 -16 0 0 8.4"/></filter>` +
    lin("fog1", [[0, "#0e83a2", 0], [1, "#0e83a2", 0.55]]) +
    lin("fog2", [[0, "#075a82", 0], [1, "#075a82", 0.6]]) +
    lin("fog3", [[0, "#0a6a8e", 0], [1, "#0a6a8e", 0.45]]) +
    rad("cGlow", [[0, "#9ff8ef", 0.5], [0.4, "#2fb8b0", 0.2], [1, "#2fb8b0", 0]]) +
    rad("crystalGlow", [[0, "#ffffff", 0.9], [0.25, "#9ff8ef", 0.5], [1, "#2fb8b0", 0]]) +
    lin("crystal", [[0, "#ffffff"], [0.45, "#7ff4e8"], [1, "#1c92b4"]], 0, 0, 1, 1) +
    rad("domeG", [[0, "#9ff8ef"], [0.6, "#1c92b4"], [1, "#07406a"]], 0.4, 0.3, 0.9) +
    rad("vigB", [[0.55, "#000", 0], [1, "#00060f", 0.6]], 0.5, 0.5, 0.78);

  /* ======================= MID ======================= */
  const rm = rng(55);
  let mid = "";
  // colonnade rows converging on the vanishing point
  const rows = [
    { s: 0.5, x: 470, w: 46, top: 290, base: 690, haze: 0.3 },
    { s: 0.66, x: 390, w: 62, top: 210, base: 720, haze: 0.18 },
    { s: 0.84, x: 290, w: 84, top: 120, base: 760, haze: 0.08 },
  ];
  rows.forEach(({ x, w, top, base, haze }, k) => {
    [-1, 1].forEach((side) => {
      const cx = side < 0 ? x : W - x;
      const grad = side < 0 ? "glassL" : "glassR";
      mid += `<g filter="url(#stone)"><rect x="${n(cx - w / 2)}" y="${n(top + 30)}" width="${n(w)}" height="${n(base - top - 30)}" fill="url(#${grad})"/><path d="M${n(cx - w * 0.95)},${n(top + 34)} Q${n(cx)},${n(top - 14)} ${n(cx + w * 0.95)},${n(top + 34)} L${n(cx + w * 0.7)},${n(top + 46)} L${n(cx - w * 0.7)},${n(top + 46)}Z" fill="url(#${grad})"/><rect x="${n(cx - w * 0.78)}" y="${n(base - 14)}" width="${n(w * 1.56)}" height="14" fill="#04213a"/></g>`;
      for (let i = 0; i < 6; i++) mid += `<rect x="${n(cx - w * 0.5)}" y="${n(top + 70 + i * ((base - top - 100) / 6))}" width="${n(w)}" height="3" fill="#9ff8ef" opacity=".5"/>`;
      mid += `<circle cx="${n(cx)}" cy="${n(top + 22)}" r="${n(w * 0.35)}" fill="#bffcf5" opacity=".8"/><circle cx="${n(cx)}" cy="${n(top + 22)}" r="${n(w * 1.3)}" fill="#7ff4e8" opacity=".3" filter="url(#b8)"/>`;
      mid += `<rect x="${n(cx - w)}" y="${n(top)}" width="${n(w * 2)}" height="${n(base - top)}" fill="#0a6a8e" opacity="${haze}"/>`;
    });
  });
  // arches spanning the avenue near the top
  [0.84, 0.66].forEach((s, k) => {
    const y = k === 0 ? 120 : 210;
    const x = k === 0 ? 290 : 390;
    mid += `<path d="M${x},${y + 34} Q800,${y - 130} ${W - x},${y + 34}" fill="none" stroke="#04213a" stroke-width="${22 * s}" opacity=".85"/><path d="M${x},${y + 30} Q800,${y - 134} ${W - x},${y + 30}" fill="none" stroke="#9ff8ef" stroke-opacity=".7" stroke-width="3"/>`;
  });
  // big glass towers at the edges
  mid += tower(rm, 120, 880, 70, 220, 90, "glassL", 6, 0.5) + tower(rm, 1480, 880, 100, 220, 90, "glassR", 6, 0.5);
  mid += dome(120, 70, 66, 52, "domeG").replace("<path", "<path"); // dome on the left tower
  mid += dome(1480, 100, 66, 52, "domeG");
  // glowing avenue floor with receding light lines
  mid += `<polygon points="0,${H} ${W},${H} 1200,690 400,690" fill="url(#avenue)"/>`;
  for (let i = -7; i <= 7; i++) mid += `<line x1="${800 + i * 220}" y1="${H}" x2="${800 + i * 60}" y2="690" stroke="#7ff4e8" stroke-opacity="${i === 0 ? 0.6 : 0.3}" stroke-width="2"/>`;
  [715, 745, 790, 850].forEach((y) => (mid += `<line x1="${n(800 - (y - 690) * 3.6 - 400)}" y1="${y}" x2="${n(800 + (y - 690) * 3.6 + 400)}" y2="${y}" stroke="#7ff4e8" stroke-opacity=".28" stroke-width="2"/>`));
  // floating lanterns
  for (let i = 0; i < 26; i++) {
    const x = rm() * W;
    const y = 200 + rm() * 460;
    const r = 3 + rm() * 7;
    mid += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 4)}" fill="#7ff4e8" opacity=".16" filter="url(#b3)"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${rm() < 0.3 ? "#ffe9a8" : "#d9fffa"}" opacity=".95"/>`;
  }
  mid += `<rect width="${W}" height="${H}" fill="url(#vigM)"/>`;
  const midDefs = common + lin("avenue", [[0, "#7ff4e8", 0.45], [1, "#0a6a8e", 0.1]]) + rad("vigM", [[0.4, "#000", 0], [1, "#00060f", 0.55]], 0.5, 0.5, 0.75);

  /* ======================= FRONT ======================= */
  const rf = rng(77);
  let front = "";
  // sea floor
  front += `<path d="M-20,840 C200,800 420,850 640,846 C760,844 840,846 960,846 C1180,850 1400,800 1620,840 L1620,920 L-20,920Z" fill="url(#floorD)"/>`;
  // kelp forests at the edges
  [[40, 840, 520], [110, 860, 420], [190, 850, 560], [1560, 840, 540], [1490, 860, 420], [1410, 850, 580], [270, 880, 330], [1330, 880, 340]].forEach(([x, b, h], i) => {
    front += kelp(x, b, h, i * 1.3, 14, i % 2 ? "#0b5e58" : "#0a4a52");
  });
  // coral reefs
  const tips = [];
  const cols = ["#ff5fa8", "#ff9a52", "#a96bff", "#ff5fa8", "#ffcf5a", "#4fe3d4"];
  let coral = "";
  [[150, 1], [260, 0.85], [60, 0.9], [420, 0.6], [1450, 1], [1340, 0.85], [1550, 0.9], [1180, 0.6]].forEach(([bx, sc], i) => {
    const col = cols[i % cols.length];
    for (let k = 0; k < 3; k++) {
      coral += `<g>${coralTree(rf, bx + (k - 1) * 46 * sc, 880, -Math.PI / 2 + (rf() - 0.5) * 0.7, (95 + rf() * 40) * sc, 15 * sc, 5, col, tips)}</g>`;
    }
  });
  // brain corals + fans
  [[330, 868], [1270, 870], [560, 884], [1050, 886]].forEach(([x, y], i) => {
    coral += `<ellipse cx="${x}" cy="${y}" rx="${54 - i * 6}" ry="${34 - i * 4}" fill="${i % 2 ? "#d96aa8" : "#e09a54"}"/>`;
    for (let k = 0; k < 7; k++) coral += `<path d="M${x - 40 + k * 12},${y - 8} q8,-12 14,0 t14,6" stroke="#5a1a3a" stroke-opacity=".4" stroke-width="2.4" fill="none"/>`;
  });
  coral += seaFan(210, 880, 1, "#c56bff") + seaFan(1390, 884, 1.05, "#ff7ab0");
  front += `<g filter="url(#stone)">${coral}</g>`;
  front += tips.map(([x, y, c], i) => (i % 3 === 0 ? `<circle cx="${n(x)}" cy="${n(y)}" r="8" fill="${c}" opacity=".45" filter="url(#b3)"/><circle cx="${n(x)}" cy="${n(y)}" r="2.4" fill="#fff" opacity=".85"/>` : `<circle cx="${n(x)}" cy="${n(y)}" r="3" fill="${c}"/>`)).join("");
  // giant clam with pearl
  const cx = PEARL.x;
  const cy = 826;
  front += `<ellipse cx="${cx}" cy="${cy + 40}" rx="260" ry="26" fill="#000" opacity=".4" filter="url(#b8)"/>`;
  front += `<circle cx="${cx}" cy="${PEARL.y}" r="300" fill="url(#pearlGlow)"/>`;
  front += `<polygon points="${cx - 36},${PEARL.y + 10} ${cx + 36},${PEARL.y + 10} ${cx + 230},-20 ${cx - 230},-20" fill="url(#beam)" opacity=".5" filter="url(#b16)"/>`;
  // lower shell
  front += `<g filter="url(#stone)"><path d="M${cx - 200},${cy - 24} Q${cx - 210},${cy + 66} ${cx},${cy + 90} Q${cx + 210},${cy + 66} ${cx + 200},${cy - 24} Q${cx},${cy - 70} ${cx - 200},${cy - 24}Z" fill="url(#shellOut)"/></g>`;
  for (let i = -9; i <= 9; i++) front += `<path d="M${cx + i * 22},${cy + 84 - Math.abs(i) * 1.6} Q${cx + i * 20},${cy + 20} ${cx + i * 15},${cy - 38}" stroke="#7a2f58" stroke-opacity=".55" stroke-width="3" fill="none"/>`;
  front += `<path d="M${cx - 180},${cy - 18} Q${cx},${cy - 62} ${cx + 180},${cy - 18} Q${cx},${cy + 20} ${cx - 180},${cy - 18}Z" fill="url(#shellIn)"/>`;
  // pearl
  front += `<circle cx="${cx}" cy="${PEARL.y}" r="70" fill="url(#pearl)"/><ellipse cx="${cx - 24}" cy="${PEARL.y - 28}" rx="20" ry="11" fill="#fff" opacity=".9" transform="rotate(-30 ${cx - 24} ${PEARL.y - 28})"/><circle cx="${cx + 26}" cy="${PEARL.y + 30}" r="10" fill="#9ff8ef" opacity=".5" filter="url(#b3)"/>`;
  // upper shell raised behind the pearl
  front += `<g filter="url(#stone)"><path d="M${cx - 214},${cy - 30} Q${cx - 230},${cy - 190} ${cx},${cy - 226} Q${cx + 230},${cy - 190} ${cx + 214},${cy - 30} Q${cx},${cy - 118} ${cx - 214},${cy - 30}Z" fill="url(#shellOut)" opacity=".98"/></g>`;
  for (let i = -8; i <= 8; i++) front += `<path d="M${cx + i * 24},${cy - 62 - (8 - Math.abs(i)) * 3} Q${cx + i * 18},${cy - 126} ${cx + i * 10},${cy - 212}" stroke="#7a2f58" stroke-opacity=".5" stroke-width="3" fill="none"/>`;
  // scattered pearls and shells
  for (let i = 0; i < 18; i++) {
    const x = 120 + rf() * 1360;
    if (Math.abs(x - cx) < 240) continue;
    const y = 868 + rf() * 26;
    const r = 5 + rf() * 8;
    front += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="url(#pearl)"/>`;
  }
  // rocky arches framing the corners
  front += `<g filter="url(#stone)"><path d="M-30,-20 L210,-20 Q150,40 110,120 Q70,190 -30,230Z" fill="#052a3e"/><path d="M${W + 30},-20 L${W - 210},-20 Q${W - 150},40 ${W - 110},120 Q${W - 70},190 ${W + 30},230Z" fill="#052a3e"/></g>`;
  front += `<path d="M210,-20 Q150,40 110,120 Q70,190 -30,230" fill="none" stroke="#4fe3d4" stroke-opacity=".7" stroke-width="3"/><path d="M${W - 210},-20 Q${W - 150},40 ${W - 110},120 Q${W - 70},190 ${W + 30},230" fill="none" stroke="#4fe3d4" stroke-opacity=".7" stroke-width="3"/>`;
  front += `<rect width="${W}" height="${H}" fill="url(#vigF)"/>`;

  const frontDefs =
    common +
    lin("floorD", [[0, "#073c52"], [1, "#010a14"]]) +
    rad("pearlGlow", [[0, "#d9fffa", 0.8], [0.3, "#4fe3d4", 0.35], [1, "#2fb8b0", 0]]) +
    lin("beam", [[0, "#e8fffc", 0.8], [1, "#e8fffc", 0]], 0, 1, 0, 0) +
    lin("shellOut", [[0, "#f3b8d0"], [0.5, "#b86a98"], [1, "#552247"]]) +
    lin("shellIn", [[0, "#fff0f8"], [0.5, "#f0a8d0"], [1, "#a85a98"]]) +
    rad("pearl", [[0, "#ffffff"], [0.3, "#ffe6f4"], [0.65, "#9ff8ef"], [1, "#3b95c0"]], 0.36, 0.3, 0.8) +
    rad("vigF", [[0.55, "#000", 0], [0.95, "#00060f", 0.3], [1, "#00060f", 0.5]], 0.5, 0.48, 0.8);

  return { back: doc(back, backDefs), mid: doc(mid, midDefs), front: doc(front, frontDefs) };
}
