import type { Orientation, Platform, ValidationScenario } from "../types";
import contract from "./package-contract.json";

export const GAME_CATEGORIES = ["Classic Slots", "Cascading Reels", "Hold & Respin", "Crash", "Card Duel", "Table Games", "Instant Win", "Arcade"];

export const BROWSERS = ["Chrome 110+", "Edge 110+", "Firefox 110+", "Safari 16+"];

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "mobile", label: "Mobile" },
];

export const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: "landscape", label: "Landscape" },
  { id: "portrait", label: "Portrait" },
  { id: "both", label: "Both" },
];

/**
 * Package limits shown to the admin. The backend will enforce the real ones.
 * The values live in package-contract.json so the Package Builder (scripts/package-games) enforces the same numbers.
 * The platform and orientation ids above must also match that file.
 */
export const MAX_PACKAGE_BYTES: number = contract.maxPackageBytes;
export const WARN_PACKAGE_BYTES: number = contract.warnPackageBytes;

export const SCENARIOS: { id: ValidationScenario; label: string; hint: string }[] = [
  { id: "pass", label: "Well-formed package", hint: "Every simulated check passes." },
  { id: "missing-manifest", label: "Missing manifest.json", hint: "Simulates a package without a manifest." },
  { id: "id-mismatch", label: "Game ID mismatch", hint: "Simulates a manifest gameId that differs from the form." },
  { id: "missing-entry", label: "Entry file missing", hint: "Simulates an entryPoint that is not in the bundle." },
  { id: "server-code", label: "Contains server-side code", hint: "Simulates game logic that must stay on the server." },
];

export const MANIFEST_EXAMPLE = `{
  "gameId": "dragon-vault",
  "name": "Dragon Vault",
  "version": "1.0.0",
  "entryPoint": "index.html",
  "description": "Short description shown in the catalogue.",
  "assets": {
    "thumbnail": "assets/thumbnail.webp",
    "images": "assets/images/",
    "audio": "assets/audio/"
  },
  "compatibility": {
    "minBrowser": "Chrome 110",
    "platforms": ["desktop", "tablet", "mobile"],
    "orientation": "landscape"
  }
}`;

export const STORAGE_KEY = "sv-game-management-v1";
export const DATA_SCHEMA = 1;
