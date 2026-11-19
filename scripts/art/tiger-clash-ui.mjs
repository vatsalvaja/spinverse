/**
 * TIGER CLASH UI art. Cuts the creature, card-back, emblem and title artwork out of the supplied reference
 * illustration (the "Cinematic Tiger Clash Duel Interface" image) into small web-ready files under
 * public/art/tiger-clash/ui/. Usage: node scripts/art/tiger-clash-ui.mjs [path-to-reference.png]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2] ?? "D:/Download/Cinematic Tiger Clash Duel Interface.png";
const OUT = path.resolve("public/art/tiger-clash/ui");
fs.mkdirSync(OUT, { recursive: true });
if (!fs.existsSync(SRC)) {
  console.error("Reference image not found:", SRC);
  process.exit(1);
}

const img = () => sharp(SRC);
const circle = (d) => Buffer.from(`<svg width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}" fill="#fff"/></svg>`);

async function rect(name, left, top, width, height, { q = 88, scale = 1 } = {}) {
  let p = img().extract({ left, top, width, height });
  if (scale !== 1) p = p.resize(Math.round(width * scale), Math.round(height * scale), { kernel: "lanczos3" });
  await p.webp({ quality: q }).toFile(path.join(OUT, name));
}

async function round(name, cx, cy, r, size = 96) {
  const buf = await img()
    .extract({ left: cx - r, top: cy - r, width: r * 2, height: r * 2 })
    .resize(size, size, { kernel: "lanczos3" })
    .toBuffer();
  await sharp(buf).composite([{ input: circle(size), blend: "dest-in" }]).webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(OUT, name));
}

// the two creatures, cut so no card or button edges remain
await rect("tiger.webp", 0, 150, 535, 470, { q: 90 });
await rect("dragon.webp", 1135, 70, 537, 550, { q: 90 });
// the card back (the left of the two face-down cards)
await rect("card-back.webp", 538, 247, 192, 274, { q: 92, scale: 1.5 });
// result coins and button emblems
await round("coin-tiger.webp", 221, 111, 19);
await round("coin-dragon.webp", 304, 111, 19);
await round("coin-tie.webp", 677, 111, 19);
await round("emblem-tiger.webp", 465, 670, 40, 112);
await round("emblem-tie.webp", 768, 670, 40, 112);
await round("emblem-dragon.webp", 1050, 670, 40, 112);
// the ornate title lockup (used with a screen blend so its dark backdrop disappears)
await rect("title.webp", 500, 6, 690, 78, { q: 92, scale: 1.5 });

for (const f of fs.readdirSync(OUT)) console.log(f, (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + " KB");
