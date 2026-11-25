import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig, type UserConfig } from "vite";

/**
 * The one Vite configuration every game package uses:
 *
 *   // game-packages/<gameId>/vite.config.ts
 *   import { gameConfig } from "../_sdk/vite";
 *   export default gameConfig(import.meta.url);
 *
 * It fixes the settings the Package Builder and the host loader rely on:
 *   - base "./"            relative asset URLs, so the package works from any location
 *   - outDir "dist"        matches manifest.build.outDir (default)
 *   - sourcemap off        source maps are rejected by the builder
 *   - SDK alias            "@spinverse/game-sdk" resolves to game-packages/_sdk/src
 *   - Tailwind + PostCSS   using the game's own tailwind.config.cjs and the shared preset
 * Pass `overrides` to extend it for a specific game.
 */
export function gameConfig(configUrl: string, overrides: UserConfig = {}) {
  const gameDir = path.dirname(fileURLToPath(configUrl));
  const sdk = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src");
  return defineConfig({
    base: "./",
    plugins: [react()],
    resolve: {
      alias: [
        { find: /^@spinverse\/game-sdk$/, replacement: path.join(sdk, "index.ts") },
        { find: /^@spinverse\/game-sdk\/(.*)$/, replacement: `${sdk}/$1` },
      ],
    },
    css: { postcss: { plugins: [tailwindcss({ config: path.join(gameDir, "tailwind.config.cjs") }), autoprefixer()] } },
    build: { outDir: "dist", emptyOutDir: true, sourcemap: false, assetsInlineLimit: 4096, chunkSizeWarningLimit: 1500 },
    ...overrides,
  });
}
