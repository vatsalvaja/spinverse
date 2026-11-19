/**
 * TIGER CLASH lobby cover. Composites the painted Tiger and Dragon cuts (public/art/tiger-clash/ui/) onto a dark
 * temple backdrop, heads close to the centre so the 4:5 tile crop keeps both creatures.
 * Run scripts/art/tiger-clash-ui.mjs first. Usage: node scripts/art/tiger-clash-poster.mjs
 */
import path from "node:path";
import sharp from "sharp";

const DIR = path.resolve("public/art/tiger-clash");
const W = 2752;
const H = 1536;

const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060a"/><stop offset=".6" stop-color="#0c0e17"/><stop offset="1" stop-color="#06070a"/></linearGradient>
    <radialGradient id="a" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3a8dff" stop-opacity=".55"/><stop offset="1" stop-color="#3a8dff" stop-opacity="0"/></radialGradient>
    <radialGradient id="c" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2cf" stop-opacity=".9"/><stop offset=".3" stop-color="#ffb347" stop-opacity=".35"/><stop offset="1" stop-color="#5cc8ff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <ellipse cx="760" cy="760" rx="1100" ry="800" fill="url(#a)"/>
  <ellipse cx="2000" cy="760" rx="1100" ry="800" fill="url(#b)"/>
  <ellipse cx="${W / 2}" cy="${H * 0.52}" rx="420" ry="360" fill="url(#c)"/>
</svg>`);

/** a creature cut, feathered at the edges that meet the backdrop */
async function sprite(file, height, edge) {
  const meta = await sharp(path.join(DIR, "ui", file)).metadata();
  const w = Math.round((meta.width / meta.height) * height);
  const buf = await sharp(path.join(DIR, "ui", file)).resize(w, height, { kernel: "lanczos3" }).toBuffer();
  const inner = edge === "right" ? `<linearGradient id="h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-opacity="1"/><stop offset=".74" stop-opacity="1"/><stop offset="1" stop-opacity="0"/></linearGradient>` : `<linearGradient id="h" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-opacity="1"/><stop offset=".74" stop-opacity="1"/><stop offset="1" stop-opacity="0"/></linearGradient>`;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}"><defs>${inner}</defs><rect width="${w}" height="${height}" fill="url(#h)"/></svg>`);
  const out = await sharp(buf).composite([{ input: mask, blend: "dest-in" }]).toBuffer();
  const mask2 = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}"><defs><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-opacity="0"/><stop offset=".1" stop-opacity="1"/><stop offset=".9" stop-opacity="1"/><stop offset="1" stop-opacity="0"/></linearGradient></defs><rect width="${w}" height="${height}" fill="#000" opacity="1" style="fill:url(#v)"/></svg>`);
  return { buf: await sharp(out).composite([{ input: mask2, blend: "dest-in" }]).toBuffer(), w };
}

const tiger = await sprite("tiger.webp", 1320, "right");
const dragon = await sprite("dragon.webp", 1340, "left");

const poster = sharp(bg).composite([
  { input: await sharp(tiger.buf).extract({ left: 60, top: 0, width: tiger.w - 60, height: 1320 }).toBuffer(), left: 0, top: H - 1320 - 40 },
  { input: dragon.buf, left: 1380, top: H - 1340 - 30 },
]);
const full = await poster.png().toBuffer();
await sharp(full).webp({ quality: 86 }).toFile(path.join(DIR, "poster.webp"));
await sharp(full).resize(640, 360).webp({ quality: 84 }).toFile(path.join(DIR, "thumb.webp"));
console.log("poster and thumb written");
