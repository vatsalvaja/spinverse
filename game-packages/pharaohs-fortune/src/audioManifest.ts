import { assetUrl } from "@spinverse/game-sdk";

/**
 * Every audio file the game can play, in one place.
 *
 * - Music and celebration stings are original compositions rendered by `scripts/audio/music.mjs`.
 * - The voice clips are TEMPORARY PLACEHOLDERS made with the built-in Windows desktop voices by
 *   `scripts/audio/voice.ps1`. They exist so the announcer system can be built and heard end to end.
 *   Replace the files at these paths with professional announcer recordings (keep the names, or edit the
 *   paths below). Nothing else needs to change.
 * - Short effects (clicks, reel whirr, reel stops, coins, chimes) are synthesised live in `audio.ts`.
 *
 * If a file is missing the engine simply stays silent for that cue.
 */
const BASE = assetUrl("assets/audio");

export const AUDIO_FILES = {
  music: {
    bgm: `${BASE}/music/bgm-hijaz-loop.wav`,
  },
  stings: {
    nice: `${BASE}/music/sting-nice.wav`,
    big: `${BASE}/music/sting-big.wav`,
    super: `${BASE}/music/sting-super.wav`,
    mega: `${BASE}/music/sting-mega.wav`,
    jackpot: `${BASE}/music/sting-jackpot.wav`,
    freeSpins: `${BASE}/music/sting-free-spins.wav`,
  },
  voice: {
    goodLuck: `${BASE}/voice/good-luck.wav`,
    nice: `${BASE}/voice/nice-win.wav`,
    big: `${BASE}/voice/big-win.wav`,
    super: `${BASE}/voice/super-win.wav`,
    mega: `${BASE}/voice/mega-win.wav`,
    jackpot: `${BASE}/voice/jackpot.wav`,
    freeSpins: `${BASE}/voice/free-spins.wav`,
  },
} as const;

export type StingName = keyof typeof AUDIO_FILES.stings;
export type VoiceName = keyof typeof AUDIO_FILES.voice;
