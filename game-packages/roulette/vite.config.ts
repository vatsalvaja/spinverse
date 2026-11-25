import { gameConfig } from "../_sdk/vite";

// Shared configuration for every game package (see game-packages/_sdk/vite.ts).
export default gameConfig(import.meta.url);
