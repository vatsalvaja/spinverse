# Game packages

Every SPINVERSE game is an **independent package** in this folder: its own source, assets, manifest, version and Vite build. `npm run package` builds each eligible game and writes one versioned ZIP per game to `packages/`. There is no separate process for old and new games: the six launch games and any future game (KENO, PACHINKO, ...) use exactly this structure, the same manifest, the same Game SDK and the same loader on the website.

```
game-packages/
  package.json        npm workspace root: ONE shared node_modules for all games (no code of its own)
  _sdk/               the Game SDK + shared build config (see "Game SDK")
  _template/          copy this to start a new game
  <gameId>/           one folder per game; the folder name is the gameId
    manifest.json     id, name, version, entry point, assets, compatibility
    package.json      scripts: build, typecheck (+ the game's own dependencies)
    vite.config.ts    one line: gameConfig(import.meta.url)
    tailwind.config.cjs, tsconfig.json, index.html
    src/              the game's frontend (React + TypeScript)
    public/assets/    the game's images, audio, thumbnail (copied into the package as-is)
packages/             generated ZIPs (git-ignored)
public/local-packages/  the website's temporary local package source (git-ignored, generated)
```

Folders starting with `_` or `.` are never packaged.

## Commands

```bash
npm run package                      # build + package every eligible game
npm run package -- skyfall           # one game
npm run package -- skyfall roulette  # several
npm run package -- --list            # what would be packaged
npm run package -- skyfall --force   # replace an existing ZIP of the same version (see Versions)
npm run package -- --no-install      # never run npm install
npm run package -- --no-local-deploy # write ZIPs only, leave the website's local package source alone
npm run package -- --verbose         # stream install and build output
```

Always put options after `--`, otherwise npm swallows them. Exit code is `1` if any game fails; a failing game never produces a ZIP and never stops the others. The first run installs dependencies once for all games (`game-packages/node_modules`); later runs reinstall only when a game declares something that is not installed yet.

Inside a game: `cd game-packages/<gameId>` then `npm run typecheck` (strict TypeScript) or `npm run build`.

## How the website runs the packages

`npm run package` does more than zip. After a package is built and **verified**, its contents are unpacked from the ZIP into `public/local-packages/<gameId>/<version>/` and `public/local-packages/registry.json` is refreshed. This is the temporary stand-in for "an admin installed this package".

The website never imports game code. `/play/<gameId>` is one generic route: `src/features/game-runtime/GameHost.tsx` asks the package source (`packageSource.ts`) for the highest installed version of that game, loads its entry HTML in an iframe, and talks to it through the SDK contract. Today the source reads `public/local-packages/registry.json`; later it will read the packages an admin uploaded and published. Only the source changes; the format, manifest, versioning, loader and contract stay the same.

If no package is built the lobby still shows every game (catalogue data lives in the website), and opening one explains that `npm run package` has not been run.

Run `npm run package` once after cloning or after changing a game, then reload the website.

## Game SDK

`_sdk/` is the only thing a game may use from the platform. It is **source-shared**: each game's Vite build bundles the parts it uses, so a package stays a self-contained static bundle.

```ts
import { GameHostProvider, useGameHost, LobbyLink, AccountMenu, assetUrl } from "@spinverse/game-sdk";
import "@spinverse/game-sdk/base.css";
```

| Export | Purpose |
|---|---|
| `GameHostProvider` | wrap the game once; performs the handshake, renders a splash until the host answers |
| `useGameHost()` | `player` (name, guest, membership, **demoBalance**), `favorite`, `config`, `exit()`, `navigate()`, `signOut()`, `toggleFavorite()`, `emit(name, data)` |
| `LobbyLink`, `AccountMenu`, `Modal`, `Avatar` | the platform's shared UI pieces |
| `assetUrl("assets/x.webp")` | URL of a file in the game's `public/` folder that stays correct wherever the package is served from |
| `base.css`, `tailwind.preset.cjs` | the platform's design tokens and generic styles |
| `cn`, `formatPoints`, `createRng`, `useReduceMotion`, ... | small helpers |

**Contract** (`_sdk/src/protocol.ts`, shared with the website): the game posts `HELLO` to its parent; the host checks the message came from the iframe it created and answers `INIT` through `postMessage(..., <iframe origin>, [port])`, transferring one end of a `MessageChannel`. Everything after that travels over the private port. All messages are validated; unknown ones are dropped. Nothing sensitive is put in the URL. Games receive only a display name, a membership label and the **demo** balance (free credits with no cash value), never ids, emails or the host's data. Games can ask the host to go to the lobby, profile, wallet or settings (named destinations, never URLs), to sign out, to toggle the favorite, and can report informational events. Opened outside the website a game runs standalone with no player.

Games must not import anything from the website (`next/*`, `@/...`, its session or mock data). The Package Builder cannot catch every such import, but `npm run typecheck` in a game fails because those modules do not exist there.

## Add a new game

1. Copy `_template/` to `game-packages/<gameId>/` (lowercase letters, numbers, single hyphens, 3 to 40 characters).
2. Edit `manifest.json`: `gameId` = the folder name, plus `name`, `description`, `version`, thumbnail and compatibility.
3. Build the game in `src/`, assets in `public/assets/`. Use `useGameHost()` for the player and demo balance; use `assetUrl()` for every asset URL; import fonts from `@fontsource/*` in `src/fonts.ts`.
4. `cd game-packages && npm install` if you added a dependency, then `npm run package -- <gameId>`.
5. The game appears at `/play/<gameId>` automatically. To list it in the lobby it also needs a catalogue entry (today `src/data/games.ts`; later the admin catalogue).

## Manifest

The schema the Admin upload form documents (`MANIFEST_EXAMPLE` in `src/features/game-management/lib/constants.ts`). Rules and limits are read from `src/features/game-management/lib/package-contract.json`, which the admin UI also reads.

| Field | Rule |
|---|---|
| `gameId` | 3-40 chars, `^[a-z0-9]+(-[a-z0-9]+)*$`, **equal to the folder name** |
| `name`, `description` | non-empty; description at most 160 characters |
| `version` | `MAJOR.MINOR.PATCH` |
| `entryPoint` | relative path to an HTML file in the build output, usually `index.html` |
| `assets.thumbnail` | relative path to an image in the build output (png, jpg, webp, svg) |
| `assets.images`, `assets.audio` | optional; folder paths ending in `/` that must contain files |
| `compatibility` | `minBrowser` (text), `platforms` (`desktop`/`tablet`/`mobile`), `orientation` (`landscape`/`portrait`/`both`); optional `minClientVersion` |
| `build.outDir` | **builder only**, default `dist`; removed from the manifest inside the ZIP |

## Versions

The ZIP name comes from the manifest: `skyfall-v1.0.0.zip`, `skyfall-v1.1.0.zip`. To release a new version of one game, change `version` in **that game's** `manifest.json` and run `npm run package -- skyfall`. Other games are untouched: their versions, sources and ZIPs do not change. Older versions stay in `packages/` and in `public/local-packages/` (the website launches the highest).

Output is deterministic. Re-running with no changes reports "up to date". If the same version would produce **different** content, the builder stops and asks you to bump the version; `--force` replaces it deliberately.

## What a package must be

The ZIP root holds `manifest.json` and the contents of the build output (not a `dist/` wrapper). The builder fails the game, and writes no ZIP, when it finds:

- a missing or non-HTML entry point, missing thumbnail or listed asset folder, or an `index.html` reference that is not in the bundle
- root-absolute URLs (`/assets/x.js`, `url(/x.png)` in CSS, `"/art/x.webp"` in scripts): use relative paths and `assetUrl()`
- `node_modules`, `.env*`, lockfiles, `package.json`, source maps, TypeScript/JSX/SCSS sources, server-side files (`server/`, `.php`, `.py`, `.sql`, ...), keys (`.pem`, `.key`) or temp files
- text files that look like they contain a private key, an AWS key ID, or a database URL with credentials
- an unpacked size over 250 MB, or a ZIP that fails its integrity check

After writing, the builder re-opens the ZIP, checks every entry's size and CRC-32, and re-runs the same content checks on what is actually inside.

## Security

Packages are public frontend code. Never include secrets. Outcomes, payouts and any authoritative game logic must stay on the server: the browser presents results it is given and never decides them. The six launch games still run scripted or locally generated **demo** outcomes with free credits; that is acceptable for a demo only and must be replaced by server results before anything of value is involved. The builder's checks are a safety net and cannot prove a bundle contains no game logic; review is still needed. Beware of `VITE_*` environment variables, which Vite inlines into the bundle.
