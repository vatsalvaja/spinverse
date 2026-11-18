import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "public", "art");
const preview = path.join(root, "scripts", "art", "_preview");

const only = process.argv[2]; // e.g. "pharaoh"
const worlds = {
  pharaoh: () => import("./pharaoh.mjs"),
  atlantis: () => import("./atlantis.mjs"),
  neon: () => import("./neon.mjs"),
};

async function bake(name) {
  const mod = await worlds[name]();
  const { back, mid, front } = mod.layers();
  const dir = path.join(out, name);
  await mkdir(dir, { recursive: true });
  await mkdir(preview, { recursive: true });

  const render = (svg) => sharp(Buffer.from(svg), { density: 72 }).resize(1600, 900).ensureAlpha();
  const bufs = {};
  for (const [k, svg] of Object.entries({ back, mid, front })) {
    bufs[k] = await render(svg).png().toBuffer();
  }
  // layers: back is opaque (JPEG-like WebP), mid/front keep alpha
  await sharp(bufs.back).removeAlpha().webp({ quality: 74, effort: 5 }).toFile(path.join(dir, "back.webp"));
  await sharp(bufs.mid).webp({ quality: 76, alphaQuality: 80, effort: 5 }).toFile(path.join(dir, "mid.webp"));
  await sharp(bufs.front).webp({ quality: 76, alphaQuality: 80, effort: 5 }).toFile(path.join(dir, "front.webp"));

  // composite poster (used by flat/lite renders and thumbnails)
  const comp = await sharp(bufs.back).removeAlpha().composite([{ input: bufs.mid }, { input: bufs.front }]).png().toBuffer();
  await sharp(comp).webp({ quality: 78, effort: 5 }).toFile(path.join(dir, "poster.webp"));
  await sharp(comp).resize(640, 360).webp({ quality: 74, effort: 5 }).toFile(path.join(dir, "thumb.webp"));
  await sharp(comp).resize(1000, 563).jpeg({ quality: 80 }).toFile(path.join(preview, `${name}.jpg`));
  // handy single-layer previews
  for (const k of ["back", "mid", "front"]) {
    await sharp(bufs[k]).flatten({ background: "#444" }).resize(800, 450).jpeg({ quality: 70 }).toFile(path.join(preview, `${name}-${k}.jpg`));
  }
  if (mod.extra) await mod.extra(dir, sharp);
  console.log("baked", name);
}

for (const name of Object.keys(worlds)) {
  if (only && only !== name) continue;
  try {
    await bake(name);
  } catch (e) {
    if (e.code === "ERR_MODULE_NOT_FOUND" && !only) console.log("skipped", name, "(not authored yet)");
    else throw e;
  }
}
