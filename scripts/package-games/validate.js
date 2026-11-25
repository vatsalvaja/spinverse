"use strict";
/**
 * Package contract checks for the Package Builder.
 *
 * The rules come from src/features/game-management/lib/package-contract.json, which the admin UI also reads, and
 * mirror the nine checks listed in the Admin "Validate package" panel (ZIP format, size, manifest present, required
 * fields, Game ID, version, entry HTML, assets, structure). The admin panel only simulates the content checks today;
 * these run for real, against the files that will be zipped and again against the finished archive.
 *
 * This is a safety net, not a security scanner. It cannot prove that a bundle contains no authoritative game logic.
 */
const path = require("path");
const contract = require("../../src/features/game-management/lib/package-contract.json");

const M = contract.manifest;
const S = contract.structure;
const GAME_ID = new RegExp(M.gameIdPattern);
const VERSION = new RegExp(M.versionPattern);
const FORBIDDEN_DIRS = new Set(S.forbiddenDirectories);
const FORBIDDEN_NAMES = new Set(S.forbiddenFileNames);
const FORBIDDEN_EXT = new Set(S.forbiddenExtensions);
const IGNORED_NAMES = new Set(S.ignoredFileNames);
/** Manifest keys the builder understands that never reach the package. */
const BUILDER_ONLY_KEYS = ["build"];
const KNOWN_KEYS = new Set([...M.requiredFields, ...BUILDER_ONLY_KEYS]);
const TEXT_EXT = new Set([".js", ".mjs", ".cjs", ".css", ".html", ".htm", ".json", ".txt", ".svg", ".xml", ".webmanifest"]);
const SECRET_SCAN_MAX_BYTES = 20 * 1024 * 1024;

const SECRET_PATTERNS = [
  { re: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/, what: "a private key" },
  { re: /\bAKIA[0-9A-Z]{16}\b/, what: "an AWS access key ID" },
  { re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s:@/"']+:[^\s@/"']+@/i, what: "a database connection string with credentials" },
  { re: /^\s*(?:DB|DATABASE|MYSQL|POSTGRES|MONGO|REDIS|JWT|SECRET|PRIVATE)_?[A-Z_]*(?:PASSWORD|SECRET|KEY|TOKEN)\s*=\s*\S+/m, what: "an environment-style secret assignment" },
];

const isString = (v) => typeof v === "string" && v.trim().length > 0;
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Relative, forward-slash, no traversal, no drive letters. */
function isSafeRelative(p) {
  if (typeof p !== "string" || !p || p.includes("\\") || p.includes("\0")) return false;
  if (p.startsWith("/") || /^[A-Za-z]:/.test(p)) return false;
  return !p.split("/").some((s) => s === ".." || s === "" || s === ".");
}

/** Validates a game's source manifest.json. `folderName` is the directory the game lives in. */
function validateManifest(manifest, folderName) {
  const errors = [];
  const warnings = [];
  if (!isObject(manifest)) return { errors: ["manifest.json must contain a JSON object."], warnings };

  for (const f of M.requiredFields) if (manifest[f] === undefined || manifest[f] === null || manifest[f] === "") errors.push(`manifest.json is missing the required field "${f}".`);

  if (manifest.gameId !== undefined) {
    const id = manifest.gameId;
    if (typeof id !== "string" || id.length < M.gameIdMinLength || id.length > M.gameIdMaxLength || !GAME_ID.test(id)) {
      errors.push(`gameId must be ${M.gameIdMinLength}-${M.gameIdMaxLength} characters: lowercase letters, numbers and single hyphens.`);
    } else if (id !== folderName) {
      errors.push(`gameId "${id}" must equal the folder name "${folderName}". The Game ID is permanent and must match the game you register in the admin.`);
    }
  }
  if (manifest.name !== undefined && !isString(manifest.name)) errors.push('"name" must be a non-empty string.');
  if (manifest.version !== undefined && (typeof manifest.version !== "string" || !VERSION.test(manifest.version))) errors.push('"version" must look like 1.0.0 (MAJOR.MINOR.PATCH).');
  if (manifest.description !== undefined) {
    if (!isString(manifest.description)) errors.push('"description" must be a non-empty string.');
    else if (manifest.description.length > M.descriptionMaxLength) errors.push(`"description" is ${manifest.description.length} characters; the admin form allows ${M.descriptionMaxLength}.`);
  }
  if (manifest.entryPoint !== undefined) {
    if (!isSafeRelative(manifest.entryPoint)) errors.push('"entryPoint" must be a relative path inside the package, for example "index.html".');
    else if (!/\.html?$/.test(manifest.entryPoint)) errors.push('"entryPoint" must point to an HTML file.');
  }

  if (manifest.assets !== undefined) {
    const a = manifest.assets;
    if (!isObject(a)) errors.push('"assets" must be an object.');
    else {
      if (!isString(a.thumbnail) || !isSafeRelative(a.thumbnail)) errors.push('"assets.thumbnail" must be a relative path to an image, for example "assets/thumbnail.webp".');
      else if (!M.thumbnailExtensions.includes(path.posix.extname(a.thumbnail).toLowerCase())) errors.push(`"assets.thumbnail" must be one of: ${M.thumbnailExtensions.join(", ")}.`);
      for (const k of ["images", "audio"]) {
        if (a[k] === undefined) continue;
        if (!isString(a[k]) || !isSafeRelative(a[k].replace(/\/$/, "")) || !a[k].endsWith("/")) errors.push(`"assets.${k}" must be a relative folder path ending in "/", for example "assets/${k}/".`);
      }
    }
  }

  if (manifest.compatibility !== undefined) {
    const c = manifest.compatibility;
    if (!isObject(c)) errors.push('"compatibility" must be an object.');
    else {
      if (!isString(c.minBrowser)) errors.push('"compatibility.minBrowser" is required, for example "Chrome 110".');
      if (!Array.isArray(c.platforms) || c.platforms.length === 0) errors.push('"compatibility.platforms" must list at least one platform.');
      else {
        const bad = c.platforms.filter((p) => !M.platforms.includes(p));
        if (bad.length) errors.push(`"compatibility.platforms" has unknown value(s): ${bad.join(", ")}. Allowed: ${M.platforms.join(", ")}.`);
      }
      if (!M.orientations.includes(c.orientation)) errors.push(`"compatibility.orientation" must be one of: ${M.orientations.join(", ")}.`);
      if (c.minClientVersion !== undefined && !(typeof c.minClientVersion === "string" && VERSION.test(c.minClientVersion))) errors.push('"compatibility.minClientVersion" (optional) must look like 1.0.0.');
    }
  }

  if (manifest.build !== undefined) {
    const b = manifest.build;
    if (!isObject(b)) errors.push('"build" must be an object, for example { "outDir": "dist" }.');
    else if (b.outDir !== undefined && (!isSafeRelative(b.outDir) || b.outDir.startsWith("node_modules"))) errors.push('"build.outDir" must be a relative folder inside the game project, for example "dist".');
  }

  for (const k of Object.keys(manifest)) if (!KNOWN_KEYS.has(k)) warnings.push(`Unknown manifest field "${k}" is passed through to the package unchanged.`);
  return { errors, warnings };
}

/** The manifest that ships in the ZIP: the source manifest without builder-only keys. */
function packageManifest(manifest) {
  const out = {};
  for (const [k, v] of Object.entries(manifest)) if (!BUILDER_ONLY_KEYS.includes(k)) out[k] = v;
  return out;
}

const stable = (v) => JSON.stringify(v, (_k, x) => (isObject(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x));

/** Local references (src / href) in an HTML document. */
function htmlReferences(html) {
  const refs = [];
  const re = /\b(?:src|href|poster)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(html))) refs.push((m[1] ?? m[2]).trim());
  return refs;
}

/**
 * Checks the set of files that make up a package.
 * `files`: [{ path, size, read() }] where path is relative to the package root with forward slashes.
 * Returns { errors, warnings, ignored, kept } where `kept` is `files` without ignorable junk.
 */
function checkPackageFiles(files, manifest) {
  const errors = [];
  const warnings = [];
  const ignored = [];
  const kept = [];

  for (const f of files) {
    const segs = f.path.split("/");
    const base = segs[segs.length - 1];
    if (!isSafeRelative(f.path)) { errors.push(`Unsafe path in package: "${f.path}".`); continue; }
    if (IGNORED_NAMES.has(base)) { ignored.push(f.path); continue; }
    const dir = segs.slice(0, -1).find((s) => FORBIDDEN_DIRS.has(s));
    const ext = path.posix.extname(base).toLowerCase();
    if (dir) errors.push(`Forbidden folder "${dir}/" in package: ${f.path}. Packages must be a static frontend build only.`);
    else if (FORBIDDEN_NAMES.has(base) || S.forbiddenFilePrefixes.some((p) => base.startsWith(p))) errors.push(`Forbidden file in package: ${f.path}.`);
    else if (FORBIDDEN_EXT.has(ext)) errors.push(`Forbidden file type "${ext}" in package: ${f.path}. Source files, source maps, keys, server-side code and temporary files must not ship.`);
    kept.push(f);
  }

  const byPath = new Map(kept.map((f) => [f.path, f]));
  const total = kept.reduce((n, f) => n + f.size, 0);
  if (total > contract.maxPackageBytes) errors.push(`Unpacked size ${mb(total)} exceeds the ${mb(contract.maxPackageBytes)} package limit.`);

  if (!byPath.has(M.fileName)) errors.push(`${M.fileName} is missing from the package root.`);

  // entry HTML and its references
  const entry = byPath.get(manifest.entryPoint);
  if (!entry) errors.push(`entryPoint "${manifest.entryPoint}" was not found in the build output.`);
  else {
    const html = entry.read().toString("utf8");
    const dir = path.posix.dirname(entry.path);
    const seen = new Set();
    for (const ref of htmlReferences(html)) {
      if (!ref || ref.startsWith("#") || /^(?:data|blob|mailto|tel|javascript):/i.test(ref)) continue;
      if (/^(?:https?:)?\/\//i.test(ref)) { if (!seen.has(ref)) warnings.push(`${entry.path} loads an external resource (${ref}). The game will not work offline or from the install cache.`); seen.add(ref); continue; }
      if (ref.startsWith("/")) { errors.push(`${entry.path} uses the root-absolute path "${ref}". Use relative paths (set \`base: "./"\` in vite.config.ts) so the game works from any install location.`); continue; }
      const clean = ref.split(/[?#]/)[0];
      if (!clean) continue;
      const target = path.posix.normalize(path.posix.join(dir, clean));
      if (target.startsWith("../")) errors.push(`${entry.path} references "${ref}" outside the package.`);
      else if (!byPath.has(target)) errors.push(`${entry.path} references "${ref}" but "${target}" is not in the package.`);
    }
  }

  // root-absolute urls in stylesheets would also break away from the site root
  for (const f of kept) {
    if (path.posix.extname(f.path).toLowerCase() !== ".css" || f.size > SECRET_SCAN_MAX_BYTES) continue;
    const m = /url\(\s*["']?\/(?!\/)([^)"']*)/.exec(f.read().toString("utf8"));
    if (m) errors.push(`${f.path} uses a root-absolute url("/${m[1]}"). Use relative asset URLs.`);
  }

  // hard-coded root-absolute asset URLs in scripts ("/art/x.webp") point at the host website, not the package
  for (const f of kept) {
    if (![".js", ".mjs"].includes(path.posix.extname(f.path).toLowerCase()) || f.size > SECRET_SCAN_MAX_BYTES) continue;
    const m = /["'`]\/(?:art|audio|images|img|fonts|assets|sounds|sfx|media)\/[A-Za-z0-9_.-]+/.exec(f.read().toString("utf8"));
    if (m) { errors.push(`${f.path} contains the root-absolute asset URL ${m[0].slice(1)}... Build asset URLs with assetUrl() from the Game SDK so they stay relative to the package.`); }
  }

  // assets listed in the manifest
  const a = manifest.assets || {};
  if (isString(a.thumbnail) && !byPath.has(a.thumbnail)) errors.push(`assets.thumbnail "${a.thumbnail}" was not found in the package.`);
  for (const k of ["images", "audio"]) {
    if (isString(a[k]) && !kept.some((f) => f.path.startsWith(a[k]))) errors.push(`assets.${k} "${a[k]}" is empty or missing in the package.`);
  }

  // best-effort secret scan of text files
  for (const f of kept) {
    if (!TEXT_EXT.has(path.posix.extname(f.path).toLowerCase()) || f.size > SECRET_SCAN_MAX_BYTES) continue;
    const text = f.read().toString("utf8");
    for (const p of SECRET_PATTERNS) if (p.re.test(text)) { errors.push(`${f.path} appears to contain ${p.what}. Remove it: packages are public frontend code.`); break; }
  }

  if (total > contract.warnPackageBytes && total <= contract.maxPackageBytes) warnings.push(`Unpacked size ${mb(total)} is large. Players download this on first install.`);
  return { errors, warnings, ignored, kept };
}

function mb(n) {
  return `${(n / 1048576).toFixed(1)} MB`;
}

module.exports = { validateManifest, packageManifest, checkPackageFiles, stable, contract, mb };
