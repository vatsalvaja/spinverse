/**
 * SPINVERSE Game SDK. Everything a game needs from the platform, and nothing else.
 *
 *   import { GameHostProvider, useGameHost, LobbyLink, assetUrl } from "@spinverse/game-sdk";
 *
 * The SDK is source-shared: each game's Vite build bundles the parts it uses, so a package stays a
 * self-contained static bundle. Imports of the host website (next/*, "@/…", its session or mock data) are not
 * available to games and must never be added here.
 */
export { GameHostProvider, useGameHost, type GameHost } from "./GameHostProvider";
export { LobbyLink } from "./LobbyLink";
export { assetUrl } from "./assets";
export { useReduceMotion } from "./useReduceMotion";
export { cn, createRng, formatPoints, hueFromString, initials } from "./utils";
export { Modal } from "./ui/Modal";
export { Avatar } from "./ui/Avatar";
export { AccountMenu } from "./ui/AccountMenu";
export type { GameConfig, GamePlayer, HostDestination } from "./protocol";
