import { W, H, rng, n, lerp, doc, lin, rad, blurF, stoneF, mottleF, poly, glyph, glyphField } from "./lib.mjs";

// Pharaoh's Fortune: the Sun Temple. One-point perspective, vanishing point (800,420).
// End wall rectangle: x304-1296, y160-718. Door: x648-952, y262-718.
export const VP = [800, 420];
export const FLAMES = [
  { x: 468, y: 668 },
  { x: 1132, y: 668 },
];

const GOLD = ["#fff3c4", "#f0c15a", "#b9792a"];
const defsCommon = () =>
  [
    lin("gold", [[0, "#fff3c4"], [0.45, "#e9b559"], [1, "#8f5a14"]], 0, 0, 1, 1),
    lin("goldV", [[0, "#ffe9a8"], [0.5, "#d9a03c"], [1, "#74450f"]]),
    lin("stoneL", [[0, "#0e0603"], [0.5, "#4a2a12"], [0.85, "#9a6a34"], [1, "#e9b86a"]], 0, 0, 1, 0), // lit on right
    lin("stoneR", [[0, "#e9b86a"], [0.15, "#9a6a34"], [0.5, "#4a2a12"], [1, "#0e0603"]], 0, 0, 1, 0), // lit on left
    lin("stoneD", [[0, "#3a1f0e"], [1, "#150a05"]]),
    lin("lapis", [[0, "#1c4f8e"], [1, "#0c2a55"]]),
    stoneF("stone", { freq: "0.012 0.045", scale: 1.6, k: 1.1, seed: 5 }),
    stoneF("stoneFine", { freq: "0.06 0.12", oct: 3, scale: 0.8, k: 1.1, seed: 9 }),
    mottleF("mottle", { seed: 4, amount: 0.4 }),
    blurF("b4", 4),
    blurF("b10", 10),
    blurF("b22", 22),
    blurF("b40", 40),
  ].join("");

/* ---------------- Mask (treasure centrepiece) ---------------- */
const NEMES = "M0,-215 C-84,-215 -128,-168 -134,-100 L-176,150 L-96,164 L-86,44 L86,44 L96,164 L176,150 L134,-100 C128,-168 84,-215 0,-215Z";
const FACE = "M-82,-122 C-88,-6 -62,82 0,114 C62,82 88,-6 82,-122 C60,-152 -60,-152 -82,-122Z";
function mask(cx, cy, s) {
  const stripes = Array.from({ length: 28 }, (_, i) => -208 + i * 14);
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
    <defs>
      ${lin("mNem", [[0, "#fff6c8"], [0.35, "#f0c15a"], [0.7, "#c2872a"], [1, "#6f430e"]], 0, 0, 1, 1)}
      ${rad("mFace", [[0, "#fff2c0"], [0.5, "#e8b04a"], [1, "#8a5414"]], 0.42, 0.34, 0.8)}
      ${lin("mBlue", [[0, "#0f3a78"], [0.5, "#2f78d0"], [1, "#0f3a78"]], 0, 0, 1, 0)}
      <clipPath id="mClip"><path d="${NEMES}"/></clipPath>
    </defs>
    <ellipse cx="0" cy="-10" rx="330" ry="330" fill="#ffcf7a" opacity=".22" filter="url(#b40)"/>
    <path d="M-17,108 L17,108 L24,214 L-24,214Z" fill="url(#mBlue)" stroke="#e8b04a" stroke-width="3"/>
    ${[128, 148, 168, 188, 206].map((y) => `<line x1="-21" y1="${y}" x2="21" y2="${y}" stroke="#f0c15a" stroke-width="3"/>`).join("")}
    <path d="${NEMES}" fill="url(#mNem)"/>
    <g clip-path="url(#mClip)">
      ${stripes.map((y) => `<path d="M-200,${y} Q0,${y + 16} 200,${y}" fill="none" stroke="url(#mBlue)" stroke-width="6.5"/>`).join("")}
      <rect x="-200" y="-230" width="195" height="420" fill="#000" opacity=".2"/>
      <rect x="40" y="-230" width="30" height="420" fill="#fff" opacity=".1"/>
    </g>
    <path d="${NEMES}" fill="none" stroke="#fff0b0" stroke-opacity=".7" stroke-width="2.5"/>
    <path d="${FACE}" fill="url(#mFace)"/>
    <path d="M-82,-122 C-88,-6 -62,82 0,114 L0,-148 C-30,-150 -66,-142 -82,-122Z" fill="#000" opacity=".16"/>
    <path d="M-74,-86 Q-42,-106 -12,-86" stroke="#17407a" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M74,-86 Q42,-106 12,-86" stroke="#17407a" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M-66,-62 Q-40,-82 -14,-60 Q-40,-46 -66,-62Z" fill="#0b0a0a"/>
    <path d="M66,-62 Q40,-82 14,-60 Q40,-46 66,-62Z" fill="#0b0a0a"/>
    <ellipse cx="-40" cy="-62" rx="14" ry="6" fill="#f6ecd2"/><ellipse cx="40" cy="-62" rx="14" ry="6" fill="#f6ecd2"/>
    <circle cx="-40" cy="-62" r="4.4" fill="#0b0a0a"/><circle cx="40" cy="-62" r="4.4" fill="#0b0a0a"/>
    <path d="M-66,-62 L-96,-50 M66,-62 L96,-50" stroke="#17407a" stroke-width="6" stroke-linecap="round"/>
    <path d="M0,-56 L-11,12 Q0,24 11,12Z" fill="#7a3d0a" opacity=".3"/>
    <path d="M-24,54 Q0,44 24,54 Q0,74 -24,54Z" fill="#8a4a1a" stroke="#5a2c08" stroke-width="1.5"/>
    <path d="M-86,-128 Q0,-156 86,-128 L84,-108 Q0,-136 -84,-108Z" fill="url(#mBlue)" stroke="#fff0b0" stroke-width="2"/>
    <path d="M0,-186 C-12,-176 -9,-160 -5,-150 L-5,-138 L5,-138 L5,-150 C9,-160 12,-176 0,-186Z" fill="#f0c25a" stroke="#8a5414" stroke-width="1.5"/>
    <path d="M-186,150 Q0,330 186,150" fill="none" stroke="#e8b04a" stroke-width="24"/>
    <path d="M-186,150 Q0,330 186,150" fill="none" stroke="url(#mBlue)" stroke-width="13" stroke-dasharray="14 8"/>
    <path d="M-150,166 Q0,300 150,166" fill="none" stroke="#2fb8b0" stroke-width="8" stroke-dasharray="4 10"/>
    <path d="M-120,176 Q0,270 120,176" fill="none" stroke="#f0c15a" stroke-width="10"/>
  </g>`;
}

/* ---------------- Columns ---------------- */
function column(cx, top, base, w, side, id, rngc, haze = 0) {
  // side: +1 = lit on the right edge (left-hand column facing the centre), -1 = lit on the left.
  const h = base - top;
  const shaftTop = top + h * 0.1;
  const shaftBot = base - h * 0.06;
  const grad = side > 0 ? "stoneL" : "stoneR";
  const bands = [0.2, 0.52, 0.72].map((f) => top + h * f);
  const flute = Array.from({ length: 6 }, (_, i) => cx - w / 2 + (w / 6) * (i + 0.5));
  let g = "";
  // papyrus capital
  const capW = w * 1.5;
  g += `<path d="M${n(cx - w * 0.52)},${n(shaftTop)} C${n(cx - capW * 0.55)},${n(top + h * 0.075)} ${n(cx - capW * 0.5)},${n(top + h * 0.03)} ${n(cx - capW * 0.36)},${n(top + h * 0.02)} L${n(cx + capW * 0.36)},${n(top + h * 0.02)} C${n(cx + capW * 0.5)},${n(top + h * 0.03)} ${n(cx + capW * 0.55)},${n(top + h * 0.075)} ${n(cx + w * 0.52)},${n(shaftTop)}Z" fill="url(#${grad})"/>`;
  for (let i = 0; i < 7; i++) {
    const x = cx - capW * 0.32 + i * ((capW * 0.64) / 6);
    g += `<path d="M${n(x)},${n(top + h * 0.025)} Q${n(x + (i - 3) * 2)},${n(top + h * 0.05)} ${n(cx + (x - cx) * 0.75)},${n(shaftTop)}" stroke="#000" stroke-opacity=".28" stroke-width="${n(w * 0.018)}" fill="none"/>`;
  }
  g += `<rect x="${n(cx - capW * 0.42)}" y="${n(top)}" width="${n(capW * 0.84)}" height="${n(h * 0.022)}" fill="url(#${grad})"/>`;
  // shaft
  g += `<path d="M${n(cx - w * 0.5)},${n(shaftTop)} L${n(cx + w * 0.5)},${n(shaftTop)} L${n(cx + w * 0.54)},${n(shaftBot)} L${n(cx - w * 0.54)},${n(shaftBot)}Z" fill="url(#${grad})"/>`;
  for (const x of flute) g += `<line x1="${n(x)}" y1="${n(shaftTop + 8)}" x2="${n(x + (x - cx) * 0.06)}" y2="${n(shaftBot - 6)}" stroke="#000" stroke-opacity=".16" stroke-width="${n(w * 0.012 + 0.6)}"/>`;
  // painted collar stripes under the capital
  const stripeCols = ["#c23a2a", "#e9b559", "#2f78d0", "#e9b559"];
  stripeCols.forEach((c, i) => (g += `<rect x="${n(cx - w * 0.51)}" y="${n(shaftTop + i * h * 0.012)}" width="${n(w * 1.02)}" height="${n(h * 0.01)}" fill="${c}" opacity=".85"/>`));
  // glyph bands
  bands.forEach((by, bi) => {
    const gh = h * 0.12;
    g += `<rect x="${n(cx - w * 0.4)}" y="${n(by)}" width="${n(w * 0.8)}" height="${n(gh)}" fill="#000" opacity=".16"/>`;
    g += glyphField(rngc, cx - w * 0.38, by + gh * 0.04, w * 0.76, gh * 0.92, Math.max(9, w * 0.2), "#f0c15a", 0.62, "#000");
  });
  // base
  g += `<ellipse cx="${n(cx)}" cy="${n(base - h * 0.03)}" rx="${n(w * 0.8)}" ry="${n(w * 0.12)}" fill="#1a0c06"/>`;
  g += `<rect x="${n(cx - w * 0.76)}" y="${n(base - h * 0.06)}" width="${n(w * 1.52)}" height="${n(h * 0.045)}" fill="url(#${grad})"/>`;
  // rim light on lit edge
  const ex = side > 0 ? cx + w * 0.5 : cx - w * 0.5;
  g += `<line x1="${n(ex)}" y1="${n(shaftTop)}" x2="${n(ex)}" y2="${n(shaftBot)}" stroke="#ffd58a" stroke-opacity=".55" stroke-width="${n(Math.max(1.5, w * 0.014))}"/>`;
  const hz = haze > 0 ? `<rect x="${n(cx - capW * 0.5)}" y="${n(top)}" width="${n(capW)}" height="${n(h)}" fill="#f0a24a" opacity="${haze}"/>` : "";
  return `<g id="${id}"><g filter="url(#stone)">${g}</g>${hz}</g>`;
}

/* ---------------- Colossal seated Pharaoh ---------------- */
function colossus(cx, base, side, sc) {
  const grad = side > 0 ? "stoneL" : "stoneR";
  const fill = `url(#${grad})`;
  let s = "";
  // throne block + hieroglyph front panel
  s += `<rect x="-132" y="-150" width="264" height="150" fill="${fill}"/><rect x="-132" y="-158" width="264" height="14" fill="${fill}"/>`;
  s += `<rect x="-110" y="-136" width="220" height="112" fill="#000" opacity=".22"/>`;
  s += glyphField(rng(31 + cx), -104, -130, 208, 100, 17, "#f0c15a", 0.66, "#000");
  // feet + shins
  s += `<rect x="-98" y="-36" width="64" height="36" rx="6" fill="${fill}"/><rect x="34" y="-36" width="64" height="36" rx="6" fill="${fill}"/>`;
  s += `<rect x="-94" y="-176" width="56" height="150" fill="${fill}"/><rect x="38" y="-176" width="56" height="150" fill="${fill}"/>`;
  // lap / kilt with pleats
  s += `<path d="M-122,-222 L122,-222 L118,-168 L-118,-168Z" fill="${fill}"/>`;
  for (let x = -112; x <= 112; x += 14) s += `<line x1="${x}" y1="-216" x2="${x * 0.97}" y2="-172" stroke="#000" stroke-opacity=".2" stroke-width="2"/>`;
  s += `<rect x="-124" y="-228" width="248" height="10" fill="url(#gold)"/>`;
  // arms + hands
  s += `<rect x="-118" y="-340" width="30" height="120" rx="12" fill="${fill}"/><rect x="88" y="-340" width="30" height="120" rx="12" fill="${fill}"/>`;
  s += `<rect x="-120" y="-252" width="42" height="34" rx="10" fill="${fill}"/><rect x="78" y="-252" width="42" height="34" rx="10" fill="${fill}"/>`;
  s += `<rect x="-112" y="-446" width="30" height="112" rx="14" fill="${fill}"/><rect x="82" y="-446" width="30" height="112" rx="14" fill="${fill}"/>`;
  // torso
  s += `<path d="M-108,-452 L108,-452 L72,-238 L-72,-238Z" fill="${fill}"/>`;
  s += `<path d="M-84,-452 Q0,-352 84,-452" fill="none" stroke="url(#gold)" stroke-width="22"/><path d="M-70,-452 Q0,-372 70,-452" fill="none" stroke="url(#lapis)" stroke-width="10" stroke-dasharray="10 7"/>`;
  s += `<path d="M-30,-330 L30,-330 L26,-240 L-26,-240Z" fill="#000" opacity=".12"/>`;
  s += `<rect x="-24" y="-486" width="48" height="40" fill="${fill}"/>`;
  // head: nemes + face + beard + uraeus
  s += `<g transform="translate(0 -538) scale(.46)"><path d="${NEMES}" fill="url(#gold)"/>`;
  for (let i = 0; i < 18; i++) s += `<path d="M-190,${-205 + i * 20} Q0,${-190 + i * 20} 190,${-205 + i * 20}" stroke="#1c4f8e" stroke-width="7" fill="none" opacity=".85" clip-path="url(#nemesClip)"/>`;
  s += `<path d="${FACE}" fill="${fill}"/>`;
  s += `<path d="M-74,-86 Q-42,-106 -12,-86 M74,-86 Q42,-106 12,-86" stroke="#17407a" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M-66,-62 Q-40,-82 -14,-60 Q-40,-46 -66,-62Z M66,-62 Q40,-82 14,-60 Q40,-46 66,-62Z" fill="#150a05"/>`;
  s += `<path d="M0,-56 L-11,12 Q0,24 11,12Z" fill="#000" opacity=".25"/><path d="M-24,54 Q0,44 24,54 Q0,74 -24,54Z" fill="#150a05" opacity=".7"/>`;
  s += `<path d="M-17,108 L17,108 L24,206 L-24,206Z" fill="url(#lapis)" stroke="#f0c15a" stroke-width="4"/>`;
  s += `<path d="M0,-186 C-12,-176 -9,-160 -5,-150 L-5,-138 L5,-138 L5,-150 C9,-160 12,-176 0,-186Z" fill="url(#gold)"/></g>`;
  const rim = side > 0 ? 126 : -126;
  s += `<line x1="${rim}" y1="-220" x2="${rim}" y2="-158" stroke="#ffd58a" stroke-opacity=".6" stroke-width="3"/>`;
  return `<g transform="translate(${cx} ${base}) scale(${sc})" filter="url(#stone)"><defs><clipPath id="nemesClip"><path d="${NEMES}"/></clipPath></defs>${s}</g>`;
}

/* ---------------- Coins & treasure ---------------- */
function coinPile(r, x0, x1, ytop, ybot, count, scale) {
  let out = "";
  const grads = ["cA", "cB", "cC", "cD"];
  const cxm = (x0 + x1) / 2;
  const half = (x1 - x0) / 2;
  for (let i = 0; i < count; i++) {
    const t = Math.pow(r(), 0.7);
    const px = cxm + (r() * 2 - 1) * half * (0.35 + 0.65 * (1 - Math.abs(r() * 2 - 1) * 0.0));
    const mound = 1 - Math.pow(Math.abs(px - cxm) / half, 2.2);
    const py = lerp(ybot, ytop + (ybot - ytop) * (1 - mound), t * 0.9 + 0.1 * r());
    if (py < ytop + (ybot - ytop) * (1 - mound) - 2) continue;
    const depth = (py - ytop) / (ybot - ytop);
    const sz = scale * (0.55 + depth * 0.7) * (0.8 + r() * 0.5);
    const rot = Math.round((r() - 0.5) * 80);
    const dark = 0.7 + depth * 0.3;
    out += `<g transform="translate(${n(px)} ${n(py)}) rotate(${rot})"><ellipse cy="${n(2.2 * sz)}" rx="${n(13 * sz)}" ry="${n(8 * sz)}" fill="#1a0c04" opacity=".7"/><ellipse rx="${n(13 * sz)}" ry="${n(8.4 * sz)}" fill="url(#${grads[Math.floor(r() * 4)]})" stroke="#4a2a06" stroke-width="${n(0.8 * sz)}" opacity="${n(dark)}"/><ellipse rx="${n(8.6 * sz)}" ry="${n(5 * sz)}" fill="none" stroke="#fff3c4" stroke-opacity="${n(0.35 * dark)}" stroke-width="${n(0.8 * sz)}"/><path d="M${n(-9 * sz)},${n(-2 * sz)} Q0,${n(-7 * sz)} ${n(9 * sz)},${n(-2 * sz)}" stroke="#fff6d0" stroke-opacity="${n(0.8 * dark)}" stroke-width="${n(1 * sz)}" fill="none"/></g>`;
  }
  return out;
}

function gem(x, y, s, c1, c2) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><polygon points="0,-12 10,-4 6,10 -6,10 -10,-4" fill="${c1}" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/><polygon points="0,-12 10,-4 0,0" fill="${c2}" opacity=".8"/><polygon points="0,-12 -10,-4 0,0" fill="#fff" opacity=".4"/></g>`;
}

function amphora(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-26,-150 C-34,-120 -48,-90 -46,-50 C-44,-14 -22,0 0,0 C22,0 44,-14 46,-50 C48,-90 34,-120 26,-150Z" fill="url(#gold)"/>
    <path d="M-16,-150 L-20,-176 L20,-176 L16,-150Z" fill="url(#goldV)"/>
    <ellipse cx="0" cy="-178" rx="24" ry="7" fill="url(#gold)"/><ellipse cx="0" cy="-179" rx="17" ry="4" fill="#3a1e08"/>
    <path d="M-26,-148 C-70,-150 -66,-96 -40,-86 M26,-148 C70,-150 66,-96 40,-86" fill="none" stroke="url(#goldV)" stroke-width="8" stroke-linecap="round"/>
    <path d="M-40,-96 Q0,-80 40,-96 M-44,-70 Q0,-54 44,-70" stroke="#6b3d0a" stroke-width="4" fill="none"/>
    <path d="M-30,-110 C-34,-86 -30,-40 -20,-14" stroke="#fff6d0" stroke-opacity=".55" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g fill="#6b3d0a" opacity=".7">${[-24, -8, 8, 24].map((x2) => `<circle cx="${x2}" cy="-40" r="3"/>`).join("")}</g>
  </g>`;
}

export function layers() {
  const common = defsCommon();
  const coinDefs = [
    lin("cA", [[0, "#fff0b0"], [1, "#d89a2e"]]),
    lin("cB", [[0, "#f6cf6a"], [1, "#a8701c"]]),
    lin("cC", [[0, "#ffe08a"], [1, "#8c5a14"]]),
    lin("cD", [[0, "#ffd870"], [1, "#c58a24"]]),
  ].join("");

  /* ======================= BACK ======================= */
  const rb = rng(101);
  let back = "";
  back += `<rect width="${W}" height="${H}" fill="#07040a"/>`;
  back += `<rect width="${W}" height="${H}" fill="url(#wallBase)" filter="url(#stone)"/>`;
  // end wall and registers of carved hieroglyphs
  const reg = (x0, x1, flip) => {
    let o = "";
    for (let j = 0; j < 8; j++) {
      const y = 178 + j * 66;
      o += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="50" fill="#0d0603" opacity=".5"/><rect x="${x0}" y="${y}" width="${x1 - x0}" height="50" fill="none" stroke="#e9b559" stroke-opacity=".28"/>`;
      o += glyphField(rb, x0 + 6, y + 4, x1 - x0 - 12, 42, 20, "#f4c56a", 0.72, "#000");
    }
    return o;
  };
  back += reg(316, 628, false) + reg(972, 1284, true);
  // door interior
  const D = { x: 648, y: 262, w: 304, h: 456 };
  back += `<clipPath id="door"><rect x="${D.x}" y="${D.y}" width="${D.w}" height="${D.h}"/></clipPath><g clip-path="url(#door)">
    <rect x="${D.x}" y="${D.y}" width="${D.w}" height="${D.h}" fill="url(#skyDoor)"/>
    <circle cx="800" cy="560" r="360" fill="url(#sunBloom)"/>
    <circle cx="800" cy="556" r="74" fill="#fffbe8"/>
    <circle cx="800" cy="556" r="74" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>
    ${[[720, 524, 96, 70], [884, 540, 70, 56], [772, 548, 52, 40], [826, 552, 40, 34]]
      .map(([cx, ap, hw, hh]) => `<polygon points="${cx - hw},${ap + hh + 60} ${cx},${ap} ${cx + hw},${ap + hh + 60}" fill="#c0703a" opacity=".78"/><polygon points="${cx},${ap} ${cx + hw},${ap + hh + 60} ${cx + 4},${ap + hh + 60}" fill="#ffe2a0" opacity=".35"/>`)
      .join("")}
    <path d="M${D.x},620 C730,596 800,610 870,600 C920,592 940,604 ${D.x + D.w},610 L${D.x + D.w},${D.y + D.h} L${D.x},${D.y + D.h}Z" fill="url(#dune)"/>
    <path d="M${D.x},650 C740,632 800,648 ${D.x + D.w},640 L${D.x + D.w},${D.y + D.h} L${D.x},${D.y + D.h}Z" fill="#8a4c1e" opacity=".8"/>
    <rect x="${D.x}" y="560" width="${D.w}" height="60" fill="url(#haze)"/>
  </g>`;
  // door frame: jambs, lintel, cavetto cornice, winged sun disk
  back += `<g filter="url(#stone)">
    <rect x="618" y="256" width="32" height="462" fill="url(#stoneL)"/><rect x="950" y="256" width="32" height="462" fill="url(#stoneR)"/>
    <rect x="596" y="218" width="408" height="44" fill="url(#stoneD)"/>
    <path d="M580,218 Q800,160 1020,218 L1020,236 Q800,184 580,236Z" fill="url(#gold)"/>
    <rect x="596" y="256" width="408" height="8" fill="url(#gold)"/>
  </g>`;
  back += `<g>${[-1, 1]
    .map((dir) => {
      let o = "";
      for (let i = 0; i < 9; i++) {
        const len = 112 - i * 8;
        const y = 174 + i * 4;
        o += `<path d="M${800 + dir * 34},${y} L${800 + dir * (34 + len)},${y + 10 + i * 0.6} L${800 + dir * (30 + len)},${y + 17 + i * 0.6} L${800 + dir * 34},${y + 8}Z" fill="${i % 2 ? "#e9b559" : "#2f78d0"}" stroke="#7a4a10" stroke-width="1"/>`;
      }
      return o;
    })
    .join("")}
    <circle cx="800" cy="186" r="30" fill="url(#gold)" stroke="#6b3d0a" stroke-width="2"/><circle cx="800" cy="186" r="19" fill="#ffefb0" opacity=".85"/>
    ${[-1, 1].map((d) => `<path d="M${800 + d * 46},200 q${d * 12},-16 ${d * 4},-30 q${-d * 8},8 ${-d * 6},18z" fill="#f0c15a" stroke="#6b3d0a"/>`).join("")}
  </g>`;
  // colossi
  back += colossus(452, 722, 1, 0.84) + colossus(1148, 722, -1, 0.84);
  // door spill + vignette
  back += `<g style="mix-blend-mode:screen"><ellipse cx="800" cy="520" rx="760" ry="620" fill="url(#spill)"/></g>`;
  back += `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
  const backDefs =
    common +
    coinDefs +
    rad("wallBase", [[0, "#8a5424"], [0.3, "#3f220f"], [0.7, "#120904"], [1, "#050302"]], 0.5, 0.52, 0.65) +
    lin("skyDoor", [[0, "#4a2214"], [0.22, "#b4501c"], [0.5, "#f7a53e"], [0.72, "#ffd98a"], [1, "#fff1c8"]]) +
    rad("sunBloom", [[0, "#fffbe8", 1], [0.25, "#ffe29a", 0.8], [1, "#ffb347", 0]]) +
    lin("dune", [[0, "#e6a64e"], [1, "#6a3418"]]) +
    lin("haze", [[0, "#ffd98a", 0], [0.6, "#ffe9b0", 0.55], [1, "#ffd98a", 0]]) +
    rad("spill", [[0, "#ffd98a", 0.55], [0.4, "#ff9d3a", 0.18], [1, "#ff9d3a", 0]]) +
    rad("vig", [[0.55, "#000", 0], [1, "#000", 0.7]], 0.5, 0.5, 0.78);

  /* ======================= MID ======================= */
  const rm = rng(202);
  let mid = "";
  // side walls
  mid += `<polygon points="0,0 304,160 304,718 0,900" fill="url(#sideL)" filter="url(#stone)"/><polygon points="${W},0 ${W - 304},160 ${W - 304},718 ${W},900" fill="url(#sideR)" filter="url(#stone)"/>`;
  const wallBand = (side, v0, v1) => {
    const x = (t) => (side < 0 ? lerp(0, 304, t) : lerp(W, W - 304, t));
    const yt = (t, v) => lerp(lerp(0, 160, t), lerp(900, 718, t), v);
    let o = `<polygon points="${[0, 1].map((t) => `${n(x(t))},${n(yt(t, v0))}`).join(" ")} ${[1, 0].map((t) => `${n(x(t))},${n(yt(t, v1))}`).join(" ")}" fill="#0d0603" opacity=".55"/>`;
    for (let i = 0; i < 8; i++) {
      const t = (i + 0.5) / 8;
      const sc = lerp(1, 0.62, t);
      const gx = x(t);
      const gy = yt(t, (v0 + v1) / 2);
      const slope = (yt(t + 0.01, (v0 + v1) / 2) - yt(t, (v0 + v1) / 2)) / (x(t + 0.01) - x(t));
      for (let k = 0; k < 4; k++) {
        const gyy = gy + (k - 1.5) * 46 * sc;
        o += `<g transform="translate(${n(gx)} ${n(gyy)}) matrix(${n(0.4 * sc)} ${n(slope * 0.4 * sc)} 0 ${n(sc)} 0 0)">${glyph(Math.floor(rm() * 10), -20, -20, 36, "#f4c56a", 0.7, "#000")}</g>`;
      }
    }
    return o;
  };
  [-1, 1].forEach((side) => {
    mid += wallBand(side, 0.16, 0.36) + wallBand(side, 0.42, 0.62) + wallBand(side, 0.68, 0.86);
  });
  // ceiling with painted stars + beams
  mid += `<polygon points="0,0 ${W},0 ${W - 304},160 304,160" fill="url(#ceil)" filter="url(#stone)"/>`;
  for (let i = 0; i < 160; i++) {
    const sx = rm() * W;
    const sy = rm() * 150;
    const t = sy / 150;
    const xx = lerp(sx, 800 + (sx - 800) * 0.62, t);
    mid += `<path d="M${n(xx)},${n(sy)} l1.6,3.6 l3.8,0.3 l-3,2.6 l1,3.8 l-3.4,-2 l-3.4,2 l1,-3.8 l-3,-2.6 l3.8,-0.3z" fill="#f6d27a" opacity="${n(0.35 + rm() * 0.5)}"/>`;
  }
  for (const s of [1.0, 0.88, 0.77, 0.69]) {
    const y = 420 - 420 * s;
    const xl = 800 - 800 * s;
    const th = 44 * s;
    mid += `<g filter="url(#stone)"><rect x="${n(xl)}" y="${n(y)}" width="${n(1600 * s)}" height="${n(th)}" fill="url(#beam)"/><rect x="${n(xl)}" y="${n(y + th - 4)}" width="${n(1600 * s)}" height="4" fill="#f0c15a" opacity=".5"/></g>`;
  }
  // floor with tiles
  mid += `<polygon points="0,${H} ${W},${H} ${W - 304},718 304,718" fill="url(#floor)" filter="url(#stoneFine)"/>`;
  for (let i = -6; i <= 6; i++) {
    const xn = 800 + i * 150;
    mid += `<line x1="${xn}" y1="${H}" x2="${n(800 + (xn - 800) * 0.62)}" y2="718" stroke="#000" stroke-opacity=".38" stroke-width="2"/>`;
  }
  for (const s of [0.64, 0.68, 0.74, 0.82, 0.93]) {
    const y = 420 + 480 * s;
    mid += `<line x1="${n(800 - 800 * s)}" y1="${n(y)}" x2="${n(800 + 800 * s)}" y2="${n(y)}" stroke="#000" stroke-opacity=".38" stroke-width="2"/>`;
  }
  mid += `<polygon points="650,718 950,718 1200,${H} 400,${H}" fill="url(#sheen)" filter="url(#b10)"/>`;
  mid += `<ellipse cx="800" cy="738" rx="190" ry="26" fill="#ffe2a0" opacity=".55" filter="url(#b10)"/>`;
  // light shafts from the door
  const shafts = [[-520, 900], [-300, 900], [-120, 900], [120, 900], [300, 900], [520, 900]];
  shafts.forEach(([dx], i) => {
    mid += `<polygon points="${770 + i * 12},330 ${830 + i * 4},330 ${800 + dx * 1.7 + 70},${H} ${800 + dx * 1.7 - 70},${H}" fill="#ffd98a" opacity="${i % 2 ? 0.13 : 0.2}" filter="url(#b22)"/>`;
  });
  // light falls off toward the edges of the hall
  mid += `<rect width="${W}" height="${H}" fill="url(#vigM)"/>`;
  // columns (far to near), both sides
  const cols = [
    { s: 0.8, x: 262, haze: 0.2 },
    { s: 0.95, x: 196, haze: 0.04 },
  ];
  const rcol = rng(303);
  for (const c of cols) {
    const top = 420 - 420 * c.s;
    const base = 420 + 480 * c.s;
    const w = 190 * c.s;
    mid += column(c.x, top + 40 * c.s, base, w, 1, `cl${c.s}`, rcol, c.haze);
    mid += column(W - c.x, top + 40 * c.s, base, w, -1, `cr${c.s}`, rcol, c.haze);
  }
  // braziers (flames are animated in the page, glow is baked)
  const brazier = (x, y) =>
    `<circle cx="${x}" cy="${y - 20}" r="150" fill="#ff9d3a" opacity=".22" filter="url(#b22)"/><circle cx="${x}" cy="${y - 20}" r="62" fill="#ffd27a" opacity=".3" filter="url(#b10)"/>
    <g filter="url(#stone)"><path d="M${x - 18},${y + 64} L${x - 7},${y + 6} L${x + 7},${y + 6} L${x + 18},${y + 64}Z" fill="url(#goldV)"/><path d="M${x - 32},${y + 12} Q${x},${y + 38} ${x + 32},${y + 12} L${x + 26},${y - 4} L${x - 26},${y - 4}Z" fill="url(#gold)"/><ellipse cx="${x}" cy="${y - 4}" rx="27" ry="6" fill="#ff8a1f"/><ellipse cx="${x}" cy="${y + 70}" rx="30" ry="7" fill="#1a0c06"/></g>`;
  mid += FLAMES.map((f) => brazier(f.x, f.y + 6)).join("");
  const midDefs =
    common +
    lin("sideL", [[0, "#0a0503"], [1, "#4f2a12"]], 0, 0, 1, 0) +
    lin("sideR", [[0, "#4f2a12"], [1, "#0a0503"]], 0, 0, 1, 0) +
    lin("ceil", [[0, "#05040c"], [1, "#1b1230"]]) +
    lin("beam", [[0, "#2d170b"], [1, "#6a3b1b"]]) +
    lin("floor", [[0, "#7a4a22"], [0.5, "#4a2810"], [1, "#150a05"]], 0.5, 0, 0.5, 1) +
    lin("sheen", [[0, "#ffe2a0", 0.7], [1, "#ffcf7a", 0.1]]) +
    rad("vigM", [[0.3, "#000", 0], [0.75, "#0a0402", 0.42], [1, "#0a0402", 0.78]], 0.5, 0.5, 0.75);

  /* ======================= FRONT ======================= */
  const rf = rng(404);
  let front = "";
  // foreground giant columns framing the shot
  const rfc = rng(505);
  front += column(34, -40, 960, 250, 1, "fcl", rfc);
  front += column(W - 34, -40, 960, 250, -1, "fcr", rfc);
  // treasure piles
  const pile = (x0, x1, ytop, ybot, count, sc, seed) => {
    const r = rng(seed);
    const cxm = (x0 + x1) / 2;
    let o = `<path d="M${x0},${H + 10} C${x0 + 40},${ybot - 20} ${cxm - 90},${ytop + 10} ${cxm},${ytop} C${cxm + 90},${ytop + 10} ${x1 - 40},${ybot - 20} ${x1},${H + 10}Z" fill="#3a1e0a"/>`;
    o += `<path d="M${x0},${H + 10} C${x0 + 40},${ybot - 20} ${cxm - 90},${ytop + 10} ${cxm},${ytop} C${cxm + 90},${ytop + 10} ${x1 - 40},${ybot - 20} ${x1},${H + 10}Z" fill="url(#pileGlow)"/>`;
    o += coinPile(r, x0, x1, ytop, H, count, sc);
    return o;
  };
  front += pile(130, 660, 750, 860, 1100, 1.0, 1);
  front += pile(940, 1470, 760, 870, 1100, 1.0, 2);
  // gems among the coins
  const gems = [[250, 800, "#e0245e"], [330, 818, "#2f78d0"], [420, 790, "#2fb8b0"], [520, 826, "#e0245e"], [1040, 812, "#2fb8b0"], [1150, 800, "#e0245e"], [1260, 822, "#2f78d0"], [1350, 806, "#e8c84a"]];
  gems.forEach(([x, y, c], i) => (front += gem(x, y, 0.8 + (i % 3) * 0.22, c, "#fff")));
  // amphorae and chest
  front += amphora(205, 846, 0.82) + amphora(588, 868, 0.7) + amphora(1404, 850, 0.78);
  front += `<g transform="translate(1180 800)" filter="url(#stone)"><path d="M-70,0 L70,0 L62,-60 L-62,-60Z" fill="url(#goldV)"/><path d="M-70,-60 Q0,-118 70,-60Z" fill="url(#gold)"/><rect x="-72" y="-64" width="144" height="10" fill="#fff3c4" opacity=".6"/></g>`;
  // necklace across the left pile
  front += `<path d="M240,830 Q330,880 420,832" fill="none" stroke="#f0c15a" stroke-width="5"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${250 + i * 26}" cy="${n(838 + Math.sin(i / 6 * Math.PI) * 24)}" r="5" fill="#2fb8b0" stroke="#f0c15a"/>`).join("");
  // golden mask centrepiece on a pedestal
  front += `<g filter="url(#stone)"><path d="M690,${H} L706,812 L894,812 L910,${H}Z" fill="url(#stoneD)"/><rect x="696" y="808" width="208" height="14" fill="url(#gold)"/></g>`;
  front += mask(800, 722, 0.62);
  // warm bokeh + dust
  for (let i = 0; i < 22; i++) {
    front += `<circle cx="${n(rf() * W)}" cy="${n(rf() * H)}" r="${n(4 + rf() * 16)}" fill="#ffd98a" opacity="${n(0.05 + rf() * 0.1)}" filter="url(#b4)"/>`;
  }
  front += `<rect y="${H - 120}" width="${W}" height="120" fill="url(#frontShade)"/>`;
  front += `<rect width="${W}" height="${H}" fill="url(#vigF)"/>`;
  const frontDefs =
    common +
    coinDefs +
    rad("pileGlow", [[0, "#ffd98a", 0.35], [1, "#ffd98a", 0]], 0.5, 0.2, 0.7) +
    lin("frontShade", [[0, "#000", 0], [1, "#000", 0.55]]) +
    rad("vigF", [[0.5, "#000", 0], [0.85, "#050200", 0.45], [1, "#050200", 0.8]], 0.5, 0.48, 0.8);

  return {
    back: doc(back, backDefs),
    mid: doc(mid, midDefs),
    front: doc(front, frontDefs),
  };
}
