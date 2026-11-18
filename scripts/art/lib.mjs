// Shared helpers for the SPINVERSE art pipeline.
// Scenes are authored as 1600x900 SVG (with lighting / texture filters), then baked to WebP by build.mjs.

export const W = 1600;
export const H = 900;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const n = (v) => Math.round(v * 10) / 10;
export const lerp = (a, b, t) => a + (b - a) * t;
export const pick = (r, list) => list[Math.floor(r() * list.length)];

export function doc(body, defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`;
}

/** Linear gradient helper. stops: [[offset, color, opacity?], ...] */
export function lin(id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`)
    .join("")}</linearGradient>`;
}

export function rad(id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}"` : ""}>${stops
    .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`)
    .join("")}</radialGradient>`;
}

export const blurF = (id, sd) => `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

/** Bump-lit rough stone/metal texture. Multiplies the source colour by a lit noise field. */
export function stoneF(id, { freq = "0.012 0.05", oct = 4, scale = 1.6, k = 1.18, az = 225, el = 62, seed = 3, color = "#ffffff" } = {}) {
  return `<filter id="${id}" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" result="nz"/>
    <feDiffuseLighting in="nz" surfaceScale="${scale}" diffuseConstant="1" lighting-color="${color}" result="lit"><feDistantLight azimuth="${az}" elevation="${el}"/></feDiffuseLighting>
    <feComposite in="SourceGraphic" in2="lit" operator="arithmetic" k1="${k}" k2="0" k3="0" k4="0" result="mul"/>
    <feComposite in="mul" in2="SourceGraphic" operator="in"/>
  </filter>`;
}

/** Soft mottled colour variation (weathering). */
export function mottleF(id, { freq = "0.006 0.012", seed = 8, amount = 0.35 } = {}) {
  return `<filter id="${id}" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}" result="nz"/>
    <feColorMatrix in="nz" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${amount} 0" result="shade"/>
    <feComposite in="shade" in2="SourceGraphic" operator="in" result="s2"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="s2"/></feMerge>
  </filter>`;
}

export function poly(points, attrs = "") {
  return `<polygon points="${points.map(([x, y]) => `${n(x)},${n(y)}`).join(" ")}" ${attrs}/>`;
}

/** Hieroglyph-like carved marks inside a w x h cell, drawn at (x,y). */
export function glyph(kind, x, y, s, col, op, shadow = "#000") {
  const g = (inner, c, dx = 0, dy = 0) => `<g transform="translate(${n(x + dx)} ${n(y + dy)}) scale(${n(s / 20)})" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
  const shapes = [
    `<path d="M1,10 Q10,1 19,10 Q10,19 1,10Z"/><circle cx="10" cy="10" r="3" fill="CC"/><path d="M3,16 L8,19 M17,16 L12,19"/>`, // eye
    `<ellipse cx="10" cy="5.5" rx="4" ry="5"/><path d="M10,10.5 V20 M3.5,13 H16.5"/>`, // ankh
    `<path d="M1,6 l3,-3 l3,3 l3,-3 l3,3 l3,-3 l3,3 M1,12 l3,-3 l3,3 l3,-3 l3,3 l3,-3 l3,3 M1,18 l3,-3 l3,3 l3,-3 l3,3 l3,-3 l3,3"/>`, // water
    `<ellipse cx="10" cy="12" rx="6" ry="4.5"/><circle cx="15.5" cy="6.5" r="2.4"/><path d="M15.5,9 L13,12 M7,16 L5,20 M12,16 L13,20 M4,11 L1,9"/>`, // bird
    `<ellipse cx="10" cy="11" rx="5.5" ry="7"/><path d="M10,4 V18 M4.5,8 L1,5 M4.5,14 L1,18 M15.5,8 L19,5 M15.5,14 L19,18"/>`, // scarab
    `<rect x="3" y="2" width="14" height="16" rx="7"/><path d="M10,6 V14 M6,10 H14"/>`, // cartouche
    `<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="1.6" fill="CC"/>`, // sun
    `<path d="M10,19 C10,12 6,9 3,3 M10,19 C10,12 14,9 17,3 M10,19 V6"/>`, // reed
    `<circle cx="10" cy="4.5" r="2.8"/><path d="M10,7.5 V14 M5,10 H15 M10,14 L6,19 M10,14 L14,19"/>`, // figure
    `<path d="M2,3 H18 M2,10 H14 M2,17 H18 M2,3 V17"/>`, // glyph block
  ];
  const body = shapes[kind % shapes.length];
  return g(body.replaceAll("CC", shadow), shadow, 1.2, 1.4) + g(body.replaceAll("CC", col), col, 0, 0).replace('stroke="' + col + '"', `stroke="${col}" opacity="${op}"`);
}

/** A grid of random hieroglyphs. */
export function glyphField(r, x, y, w, h, cell, col, op, shadow) {
  let out = "";
  const cols = Math.floor(w / cell);
  const rows = Math.floor(h / cell);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (r() < 0.12) continue;
      out += glyph(Math.floor(r() * 9), x + i * cell + cell * 0.12, y + j * cell + cell * 0.1, cell * 0.78, col, op, shadow);
    }
  }
  return out;
}
