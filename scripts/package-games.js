#!/usr/bin/env node
"use strict";
/**
 * SPINVERSE Game Package Builder.
 *
 *   npm run package                 build and package every eligible game in game-packages/
 *   npm run package -- keno         only the named game(s)
 *   npm run package -- --list       show what would be packaged, then exit
 *
 * For each game: read manifest.json -> install dependencies if needed -> run the game's own production build ->
 * validate the output against the Admin upload contract -> write packages/<gameId>-v<version>.zip -> re-open the
 * ZIP and verify it. A failing game never produces a ZIP, and never stops the other games.
 *
 * Options (put them after `--` when using npm):
 *   --force            replace an existing ZIP of the same version when its content differs
 *   --no-install       do not run `npm install`; fail if a game has no node_modules
 *   --verbose          stream each game's install and build output
 *   --games-dir <dir>  where game projects live (default: game-packages)
 *   --out-dir <dir>    where ZIPs are written (default: packages)
 *   --local-dir <dir>  also unpack each verified package here and refresh its registry.json. This is the website's
 *                      temporary local package source (default: public/local-packages, only for the default dirs)
 *   --no-local-deploy  do not touch the local package source
 *
 * Dependencies: when games-dir/package.json declares npm workspaces, ONE install there serves every game (shared
 * node_modules). Otherwise each game installs on its own. The builder itself uses only Node.js built-ins.
 * See game-packages/README.md.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
const { writeZip, readZip } = require("./package-games/zip");
const { validateManifest, packageManifest, checkPackageFiles, stable, contract, mb } = require("./package-games/validate");

const ROOT = path.resolve(__dirname, "..");
const SEMVER = new RegExp(contract.manifest.versionPattern);

// ---------------------------------------------------------------- cli

function parseArgs(argv) {
  const o = { games: [], force: false, install: true, verbose: false, list: false, help: false, gamesDir: path.join(ROOT, "game-packages"), outDir: path.join(ROOT, "packages"), localDir: undefined, localDeploy: true, customDirs: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") o.force = true;
    else if (a === "--no-install") o.install = false;
    else if (a === "--verbose") o.verbose = true;
    else if (a === "--list") o.list = true;
    else if (a === "-h" || a === "--help") o.help = true;
    else if (a === "--no-local-deploy") o.localDeploy = false;
    else if (a === "--games-dir" || a === "--out-dir" || a === "--local-dir") {
      const v = argv[++i];
      if (!v) throw new Error(`${a} needs a folder path.`);
      o[a === "--games-dir" ? "gamesDir" : a === "--out-dir" ? "outDir" : "localDir"] = path.resolve(process.cwd(), v);
      if (a !== "--local-dir") o.customDirs = true;
    } else if (a.startsWith("-")) throw new Error(`Unknown option "${a}". Run with --help.`);
    else o.games.push(a);
  }
  return o;
}

const HELP = `SPINVERSE Game Package Builder

  npm run package                  package every eligible game
  npm run package -- <game> [...]  package only the named game(s), e.g. npm run package -- keno
  npm run package -- --list        list games and whether they are eligible

Options (after "--"): --force  --no-install  --verbose  --no-local-deploy
         --games-dir <dir>  --out-dir <dir>  --local-dir <dir>
Output: packages/<gameId>-v<version>.zip   Docs: game-packages/README.md`;

// ---------------------------------------------------------------- discovery

/** A game is eligible when its folder has both manifest.json and package.json. Folders starting with "_" or "." are ignored. */
function discover(gamesDir) {
  if (!fs.existsSync(gamesDir)) return [];
  return fs
    .readdirSync(gamesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_") && d.name !== "node_modules")
    .map((d) => {
      const dir = path.join(gamesDir, d.name);
      const hasManifest = fs.existsSync(path.join(dir, "manifest.json"));
      const hasPackage = fs.existsSync(path.join(dir, "package.json"));
      const missing = [!hasManifest && "manifest.json", !hasPackage && "package.json"].filter(Boolean);
      return { name: d.name, dir, eligible: missing.length === 0, reason: missing.length ? `missing ${missing.join(" and ")}` : null };
    })
    .sort((a, b) => (a.name < b.name ? -1 : 1));
}

// ---------------------------------------------------------------- helpers

const out = (s = "") => process.stdout.write(s + "\n");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

class StepError extends Error {
  constructor(step, message, details) {
    super(message);
    this.step = step;
    this.details = details || [];
  }
}

function npm(args, cwd, verbose) {
  const execPath = process.env.npm_execpath;
  const viaNode = execPath && /\.c?js$/.test(execPath);
  const cmd = viaNode ? process.execPath : "npm";
  const full = viaNode ? [execPath, ...args] : args;
  const r = spawnSync(cmd, full, { cwd, encoding: "utf8", shell: !viaNode && process.platform === "win32", stdio: verbose ? "inherit" : "pipe", maxBuffer: 256 * 1024 * 1024 });
  const log = verbose ? "" : `${r.stdout || ""}${r.stderr || ""}`.trim();
  return { ok: r.status === 0 && !r.error, log, error: r.error };
}

const tail = (text, n = 25) => text.split(/\r?\n/).slice(-n);

/** All regular files under `root`, as { path, size, read() } with forward-slash relative paths. Symlinks are rejected. */
function collectFiles(root) {
  const files = [];
  const problems = [];
  (function walk(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isSymbolicLink()) problems.push(`Symbolic link in build output: ${r}`);
      else if (e.isDirectory()) walk(abs, r);
      else if (e.isFile()) files.push({ path: r, absPath: abs, size: fs.statSync(abs).size, read: () => fs.readFileSync(abs) });
    }
  })(root, "");
  return { files, problems };
}

function removeInside(parent, target) {
  const rel = path.relative(parent, target);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) throw new Error(`Refusing to delete "${target}": it is not inside "${parent}".`);
  fs.rmSync(target, { recursive: true, force: true });
}

// ---------------------------------------------------------------- dependencies

/** Where `npm install` runs: the games folder when it is an npm workspace root, otherwise the game itself. */
function installRoot(game, opts) {
  try {
    const ws = JSON.parse(fs.readFileSync(path.join(opts.gamesDir, "package.json"), "utf8"));
    if (ws && ws.workspaces) return opts.gamesDir;
  } catch { /* no workspace file */ }
  return game.dir;
}

/** Declared dependencies of the game that cannot be resolved from its own or the shared node_modules. */
function missingDependencies(game, root) {
  let pkg;
  try { pkg = JSON.parse(fs.readFileSync(path.join(game.dir, "package.json"), "utf8")); } catch { return []; }
  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  return names.filter((n) => !fs.existsSync(path.join(game.dir, "node_modules", n)) && !fs.existsSync(path.join(root, "node_modules", n)));
}

// ---------------------------------------------------------------- local package source

/**
 * Unpacks a VERIFIED package into <localDir>/<gameId>/<version>/ and refreshes <localDir>/registry.json.
 * This is the temporary stand-in for "an admin installed this package": the website's game loader reads the same
 * registry shape a real backend will later serve. The files come from the ZIP, not from the build folder, so the
 * website runs exactly what would be uploaded.
 */
function deployLocal(localDir, manifest, entries) {
  const dest = path.join(localDir, manifest.gameId, manifest.version);
  const tmp = path.join(localDir, `.${manifest.gameId}-${manifest.version}.${process.pid}.tmp`);
  fs.rmSync(tmp, { recursive: true, force: true });
  try {
    for (const e of entries) {
      const abs = path.resolve(tmp, e.path);
      if (path.relative(tmp, abs).startsWith("..")) throw new Error(`Unsafe path "${e.path}".`);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, e.read());
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.rmSync(dest, { recursive: true, force: true });
    fs.renameSync(tmp, dest);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  writeRegistry(localDir);
  return dest;
}

const cmpVersion = (a, b) => {
  const x = a.split(".").map(Number), y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};

/** registry.json is rebuilt from what is on disk, so a partial run (one game) can never drop other games. */
function writeRegistry(localDir) {
  const packages = [];
  for (const g of fs.readdirSync(localDir, { withFileTypes: true })) {
    if (!g.isDirectory() || g.name.startsWith(".")) continue;
    for (const v of fs.readdirSync(path.join(localDir, g.name), { withFileTypes: true })) {
      if (!v.isDirectory() || !SEMVER.test(v.name)) continue;
      const dir = path.join(localDir, g.name, v.name);
      let manifest;
      try { manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8")); } catch { continue; }
      if (manifest.gameId !== g.name || manifest.version !== v.name) continue;
      const files = collectFiles(dir).files;
      packages.push({ gameId: g.name, version: v.name, path: `${g.name}/${v.name}/`, entryPoint: manifest.entryPoint, name: manifest.name, description: manifest.description, files: files.length, sizeBytes: files.reduce((n, f) => n + f.size, 0), manifest });
    }
  }
  packages.sort((a, b) => (a.gameId < b.gameId ? -1 : a.gameId > b.gameId ? 1 : cmpVersion(a.version, b.version)));
  const text = JSON.stringify({ schema: 1, packages }, null, 2) + "\n";
  const file = path.join(localDir, "registry.json");
  if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) fs.writeFileSync(file, text);
}

// ---------------------------------------------------------------- one game

function processGame(game, opts) {
  const result = { game: game.name, version: null, status: "failed", zip: null, bytes: 0, step: null, message: "", details: [], warnings: [], notes: [] };
  const say = (s) => out(`  ${s}`);
  const tmpZip = path.join(opts.outDir, `.${game.name}.${process.pid}.tmp`);
  try {
    // 1. manifest
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(game.dir, "manifest.json"), "utf8"));
    } catch (e) {
      throw new StepError("manifest", `manifest.json is not valid JSON: ${e.message}`);
    }
    const mv = validateManifest(manifest, game.name);
    result.warnings.push(...mv.warnings);
    if (manifest && typeof manifest.version === "string") result.version = manifest.version;
    if (mv.errors.length) throw new StepError("manifest", `manifest.json is invalid (${mv.errors.length} problem${mv.errors.length === 1 ? "" : "s"}).`, mv.errors);
    result.version = manifest.version;
    say(`manifest   ${manifest.gameId} v${manifest.version} "${manifest.name}"`);

    const zipName = `${manifest.gameId}-v${manifest.version}.zip`;
    const target = path.join(opts.outDir, zipName);
    result.zip = path.relative(ROOT, target) || zipName;

    // 2. dependencies: install only when something this game declares cannot be resolved
    const root = installRoot(game, opts);
    const missing = missingDependencies(game, root);
    if (missing.length) {
      const where = path.relative(ROOT, root) || ".";
      if (!opts.install) throw new StepError("install", `Dependencies are not installed and --no-install was given: ${missing.join(", ")}.`, [`Run \`npm install\` in ${where}, or drop --no-install.`]);
      const shared = root !== game.dir;
      const useCi = !shared && fs.existsSync(path.join(root, "package-lock.json"));
      say(`install    npm ${useCi ? "ci" : "install"} in ${where}${shared ? " (shared by all games)" : ""} ...`);
      const r = npm([useCi ? "ci" : "install", "--no-audit", "--no-fund"], root, opts.verbose);
      if (!r.ok) throw new StepError("install", `npm ${useCi ? "ci" : "install"} failed.`, r.error ? [r.error.message] : tail(r.log));
      const still = missingDependencies(game, root);
      if (still.length) throw new StepError("install", `Still not installed after npm install: ${still.join(", ")}.`);
    } else say("install    dependencies present, skipped");

    // 3. build (from a clean output folder, so stale files can never be packaged)
    const outDirName = (manifest.build && manifest.build.outDir) || "dist";
    const distDir = path.resolve(game.dir, outDirName);
    removeInside(game.dir, distDir);
    say("build      npm run build ...");
    const t0 = Date.now();
    const b = npm(["run", "build"], game.dir, opts.verbose);
    if (!b.ok) throw new StepError("build", "The production build failed.", b.error ? [b.error.message] : tail(b.log));
    if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) throw new StepError("build", `The build finished but produced no "${outDirName}/" folder.`, ['Check the build output folder, or set { "build": { "outDir": "..." } } in manifest.json.']);
    say(`build      done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    // 4. assemble and validate the output
    const { files: built, problems } = collectFiles(distDir);
    if (problems.length) throw new StepError("validate", "The build output contains unsupported entries.", problems);
    if (built.length === 0) throw new StepError("validate", `"${outDirName}/" is empty.`);
    const shipped = packageManifest(manifest);
    const manifestText = Buffer.from(JSON.stringify(shipped, null, 2) + "\n", "utf8");
    const manifestFile = { path: "manifest.json", size: manifestText.length, data: manifestText, read: () => manifestText };
    const replaced = built.some((f) => f.path === "manifest.json");
    const files = [...built.filter((f) => f.path !== "manifest.json"), manifestFile];
    if (replaced) result.notes.push('The build output contained its own manifest.json; the game\'s source manifest.json was used instead.');

    const pre = checkPackageFiles(files, shipped);
    result.warnings.push(...pre.warnings);
    if (pre.errors.length) throw new StepError("validate", `Build output failed validation (${pre.errors.length} problem${pre.errors.length === 1 ? "" : "s"}).`, pre.errors);
    say(`validate   ${pre.kept.length} files, ${mb(pre.kept.reduce((n, f) => n + f.size, 0))}${pre.ignored.length ? `, ${pre.ignored.length} junk file(s) left out` : ""}`);

    // 5. zip to a temp file inside packages/
    fs.mkdirSync(opts.outDir, { recursive: true });
    writeZip(pre.kept.map((f) => ({ name: f.path, data: f.data, absPath: f.absPath })), tmpZip);
    const bytes = fs.statSync(tmpZip).size;
    if (bytes > contract.maxPackageBytes) throw new StepError("zip", `The ZIP is ${mb(bytes)}, over the ${mb(contract.maxPackageBytes)} package limit.`);

    // 6. verify the archive: integrity, then the same contract checks on what is actually inside it
    const z = readZip(tmpZip);
    if (z.errors.length) throw new StepError("verify", "The generated ZIP failed its integrity check.", z.errors);
    const expected = new Set(pre.kept.map((f) => f.path));
    const actual = new Set(z.entries.map((e) => e.path));
    const diff = [...expected].filter((p) => !actual.has(p)).map((p) => `Missing from ZIP: ${p}`).concat([...actual].filter((p) => !expected.has(p)).map((p) => `Unexpected in ZIP: ${p}`));
    if (diff.length) throw new StepError("verify", "The ZIP contents do not match the build output.", diff);
    const post = checkPackageFiles(z.entries, shipped);
    if (post.errors.length) throw new StepError("verify", "The generated ZIP failed contract validation.", post.errors);
    const inner = z.entries.find((e) => e.path === "manifest.json");
    let innerManifest;
    try { innerManifest = JSON.parse(inner.read().toString("utf8")); } catch { innerManifest = null; }
    if (!innerManifest || stable(innerManifest) !== stable(shipped)) throw new StepError("verify", "manifest.json inside the ZIP does not match the game's manifest.");
    say(`verify     ZIP ok: ${z.entries.length} files, CRC-32 and contract checks passed`);

    // 7. place it. Never silently replace another build of the same version.
    // (gameId is validated as a lowercase slug, so it is safe to use inside a RegExp)
    const siblingRe = new RegExp(`^${manifest.gameId}-v(\\d+\\.\\d+\\.\\d+)\\.zip$`);
    const siblings = fs.readdirSync(opts.outDir).map((n) => siblingRe.exec(n)).filter(Boolean).map((m) => m[1]).filter((v) => SEMVER.test(v));
    const cmp = cmpVersion;
    const newer = siblings.filter((v) => cmp(v, manifest.version) > 0);
    if (newer.length) result.warnings.push(`A newer package already exists in ${path.relative(ROOT, opts.outDir) || "."}: v${newer.sort(cmp).pop()}. This one is v${manifest.version}.`);

    const deploy = () => {
      if (!opts.localDir) return;
      try {
        const d = deployLocal(opts.localDir, shipped, z.entries);
        say(`deploy     ${path.relative(ROOT, d)} (local package source)`);
      } catch (e) {
        throw new StepError("deploy", `Could not update the local package source: ${e.message}`);
      }
    };

    if (fs.existsSync(target)) {
      if (sha256(target) === sha256(tmpZip)) {
        fs.rmSync(tmpZip, { force: true });
        result.status = "unchanged";
        result.bytes = bytes;
        result.message = "Identical package already exists.";
        say(`package    ${zipName} already up to date`);
        deploy();
        return result;
      }
      if (!opts.force) throw new StepError("package", `${zipName} already exists with different content.`, ["Bump \"version\" in manifest.json to publish a new version, or re-run with --force to replace this one deliberately."]);
      result.notes.push(`Replaced existing ${zipName} (--force).`);
    }
    fs.renameSync(tmpZip, target);
    result.status = "packaged";
    result.bytes = bytes;
    say(`package    ${path.relative(ROOT, target)} (${mb(bytes)})`);
    deploy();
    return result;
  } catch (e) {
    result.status = "failed";
    result.step = e instanceof StepError ? e.step : "unexpected";
    result.message = e.message;
    result.details = e instanceof StepError ? e.details : [e.stack || String(e)];
    return result;
  } finally {
    try { fs.rmSync(tmpZip, { force: true }); } catch { /* best effort */ }
  }
}

// ---------------------------------------------------------------- main

function main() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 18) throw new Error(`Node.js 18 or newer is required (found ${process.versions.node}).`);
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return out(HELP);
  // the website's local package source is only touched by default for the real folders, never for test folders
  if (!opts.localDeploy) opts.localDir = undefined;
  else if (!opts.localDir && !opts.customDirs) opts.localDir = path.join(ROOT, "public", "local-packages");

  const rel = (p) => path.relative(ROOT, p) || ".";
  const found = discover(opts.gamesDir);
  const eligible = found.filter((g) => g.eligible);

  if (opts.list) {
    out(`Games in ${rel(opts.gamesDir)}/`);
    if (!found.length) out("  (none)");
    for (const g of found) out(`  ${g.eligible ? "[ok]  " : "[skip]"} ${g.name}${g.reason ? `  - ${g.reason}` : ""}`);
    return;
  }

  let selected;
  const results = [];
  if (opts.games.length) {
    selected = [];
    for (const n of opts.games) {
      const g = found.find((x) => x.name === n);
      if (!g) results.push({ game: n, version: null, status: "failed", step: "select", message: `No game folder named "${n}" in ${rel(opts.gamesDir)}/.`, details: [eligible.length ? `Eligible games: ${eligible.map((x) => x.name).join(", ")}` : "There are no eligible games yet. See game-packages/README.md."], warnings: [], notes: [] });
      else if (!g.eligible) results.push({ game: n, version: null, status: "failed", step: "select", message: `"${n}" is not an eligible game: ${g.reason}.`, details: [], warnings: [], notes: [] });
      else if (!selected.includes(g)) selected.push(g);
    }
  } else selected = eligible;

  out("SPINVERSE Game Package Builder");
  out(`games: ${rel(opts.gamesDir)}/   output: ${rel(opts.outDir)}/${opts.localDir ? `   local source: ${rel(opts.localDir)}/` : ""}`);
  if (opts.localDir) fs.mkdirSync(opts.localDir, { recursive: true });
  if (!opts.games.length) for (const g of found.filter((x) => !x.eligible)) out(`skipping ${g.name}: ${g.reason}`);
  if (!selected.length && !results.length) {
    out("\nNo eligible games found. A game needs manifest.json and package.json inside game-packages/<gameId>/.");
    out("See game-packages/README.md to add one.");
    return;
  }
  out();

  selected.forEach((g, i) => {
    out(`[${i + 1}/${selected.length}] ${g.name}`);
    const r = processGame(g, opts);
    results.push(r);
    if (r.status === "failed") {
      out(`  FAILED at ${r.step}: ${r.message}`);
      for (const d of r.details) out(`    - ${d}`);
    }
    for (const w of r.warnings) out(`  warning: ${w}`);
    for (const n of r.notes) out(`  note: ${n}`);
    out();
  });
  for (const r of results.filter((x) => x.step === "select")) {
    out(`FAILED ${r.game}: ${r.message}`);
    for (const d of r.details) out(`  - ${d}`);
    out();
  }

  // summary
  const label = { packaged: "packaged", unchanged: "up to date", failed: "FAILED" };
  const width = Math.max(4, ...results.map((r) => r.game.length));
  out("Summary");
  out(`  ${"game".padEnd(width)}  ${"version".padEnd(8)}  ${"result".padEnd(10)}  output`);
  for (const r of results) out(`  ${r.game.padEnd(width)}  ${(r.version || "-").padEnd(8)}  ${label[r.status].padEnd(10)}  ${r.status === "failed" ? `(${r.step}) ${r.message}` : `${r.zip} (${mb(r.bytes)})`}`);
  const ok = results.filter((r) => r.status !== "failed").length;
  const bad = results.length - ok;
  out(`\n${ok} succeeded, ${bad} failed.${bad ? " No ZIP was written for failed games." : ""}`);
  process.exitCode = bad ? 1 : 0;
}

try {
  main();
} catch (e) {
  process.stderr.write(`package: ${e.message}\n`);
  process.exitCode = 1;
}
