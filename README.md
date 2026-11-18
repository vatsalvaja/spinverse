# SPINVERSE — Part 1 (frontend foundation)

*Every Spin Tells a Different Story.*

Frontend-only build of the SPINVERSE player site and admin console. Virtual points only: there is no backend, no payments and no real authentication. All data is deterministic mock data held in React state (edits reset on refresh).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production check
```

- Player site: `/` → `/login` (any email + 6+ char password, or "Continue as guest")
- Admin console: `/admin/login` (any email + 6+ char password)

## Structure

```
src/
  app/
    (auth)/        login, register, signup (quick 2-step), forgot-password
    (site)/        dashboard, games, profile, wallet, leaderboard, missions,
                   rewards, achievements, settings   (player shell + page transitions)
    admin/login    standalone admin sign-in
    admin/(panel)/ overview, users, users/[id], transactions, games,
                   analytics, reports, settings      (admin shell, session-guarded)
  components/
    brand/         Logo, GameArt (hand-built SVG key art for the 3 launch games)
    site/          SiteShell, GameCard, PlayModal, forms, AuthFrame, ui primitives
    admin/         AdminShell, ui (tables, badges, pagination), charts, user dialogs
    ui/            Modal, Menu (portal action menu), Toast, Avatar  (shared)
  data/
    mock.ts        seeded ledger: 28 users + ~2,200 transactions (balances derived from the ledger)
    derive.ts      activity feed, growth / points series, per-game stats
    provider.tsx   shared state: edit user, activate/block, adjust points
    games.ts, engagement.ts, types.ts
  lib/             utils (deterministic formatting), session (demo auth state)
```

## Packages

next 14, react 18, typescript, tailwindcss 3 (+ postcss, autoprefixer), lucide-react, recharts, framer-motion.

## Known limitations (Part 1)

- Game screens are not built: **Play** opens a launch-preview dialog (Part 3).
- Wallet, leaderboard, missions, rewards, achievements and settings are functional previews with mock data (Part 2 deepens them).
- Admin Games / Analytics / Reports / Settings are lightweight; Reports and CSV exports show a confirmation but create no files.
- State is in memory: a refresh resets edits (admin sign-in is kept per browser tab via sessionStorage).
- Not browser-tested in this phase, per the brief. `npm run typecheck` and `npm run build` pass.

## Artwork pipeline

Game artwork is authored as layered 1600x900 SVG scenes in `scripts/art/` and baked to optimized WebP in `public/art/<world>/` (`back`, `mid`, `front` parallax layers plus a flat `poster` and `thumb`). The vault door is baked to `public/art/vault/`. Small animated effects (flames, jellyfish, neon orbs, glows) are drawn live on top in `src/components/art/fx/`.

```bash
npm run art   # re-bake all artwork (uses the sharp dev dependency)
```
