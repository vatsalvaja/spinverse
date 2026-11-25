import { gameConfig } from "../_sdk/vite";

// Shared configuration for every game package: relative asset URLs, dist/ output, no source maps,
// the Game SDK alias and Tailwind. See game-packages/_sdk/vite.ts. Pass overrides as the second argument.
export default gameConfig(import.meta.url);
