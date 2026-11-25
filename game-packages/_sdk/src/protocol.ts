/**
 * SPINVERSE host <-> game protocol, version 1.
 *
 * This file is the single contract between the website (the host) and every game package. It has NO imports
 * so that both sides can use it: the Next.js site imports it as "@game-sdk/protocol", game packages as
 * "@spinverse/game-sdk/protocol".
 *
 * How a launch works
 *   1. The host renders the game's entry HTML in an <iframe>. Nothing sensitive is put in the URL.
 *   2. The game posts HELLO to its parent window (no data, just "I am here").
 *   3. The host checks that the message came from the iframe it created, then answers with INIT through
 *      `postMessage(init, <the iframe's own origin>, [port])`, transferring one end of a MessageChannel.
 *   4. From then on every message travels over that private port. Other windows and frames cannot read or
 *      inject into it, so no `origin` juggling is needed for the rest of the session.
 *
 * What crosses the channel is deliberately small: a display name, a membership label and the DEMO balance
 * (free demo credits with no cash value). Never emails, ids, tokens or ledgers. Games never receive the host's
 * data model, and they never decide anything about real value: authoritative outcomes belong to the server.
 */

export const PROTOCOL_VERSION = 1 as const;

/** Window message a game sends to its parent to start the handshake. */
export const HELLO = "spinverse:hello" as const;
/** Window message the host answers with. Carries the MessagePort in `event.ports[0]`. */
export const INIT = "spinverse:init" as const;

/** Where a game may ask the host to go. The host maps these to its own routes; games never supply URLs. */
export type HostDestination = "lobby" | "profile" | "wallet" | "settings";
export const HOST_DESTINATIONS: readonly HostDestination[] = ["lobby", "profile", "wallet", "settings"];

export interface GamePlayer {
  /** Display name only. */
  name: string;
  guest: boolean;
  /** Membership tier label, for display (e.g. "Gold"). */
  membership: string;
  /** Free DEMO credits the game may start from. Read-only: games never write a balance back. */
  demoBalance: number;
}

export interface GameConfig {
  /** Always true today: all play is free demo credits with no cash value. */
  demoOnly: boolean;
  /** Free-form, JSON-only settings the host passes to the game (from the admin Configuration page, later). */
  settings: Record<string, string | number | boolean>;
}

export interface HelloMessage {
  type: typeof HELLO;
  protocol: typeof PROTOCOL_VERSION;
}

/** Host -> game, sent once with the transferred port. */
export interface InitMessage {
  type: typeof INIT;
  protocol: typeof PROTOCOL_VERSION;
  gameId: string;
  version: string;
  player: GamePlayer | null;
  config: GameConfig;
  /** Whether this game is in the player's favorites. */
  favorite: boolean;
}

/** Host -> game over the port, after init. */
export type HostMessage = { type: "state"; favorite?: boolean; player?: GamePlayer | null };

/** Game -> host over the port. */
export type GameMessage =
  | { type: "ready" }
  | { type: "exit" }
  | { type: "navigate"; to: HostDestination }
  | { type: "signOut" }
  | { type: "favorite"; value: boolean }
  /** Informational game events and results, for analytics or achievements. The host treats them as untrusted. */
  | { type: "event"; name: string; data?: Record<string, string | number | boolean | null> }
  | { type: "error"; message: string };

// ------------------------------------------------------------------ validation (runtime, dependency-free)

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown, max = 200): v is string => typeof v === "string" && v.length <= max;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export const MAX_EVENT_NAME = 64;
export const MAX_EVENT_FIELDS = 16;

/** Validates a message arriving at the HOST from a game. Returns null for anything malformed or unknown. */
export function parseGameMessage(raw: unknown): GameMessage | null {
  if (!isObj(raw) || typeof raw.type !== "string") return null;
  switch (raw.type) {
    case "ready":
    case "exit":
    case "signOut":
      return { type: raw.type };
    case "navigate":
      return typeof raw.to === "string" && (HOST_DESTINATIONS as readonly string[]).includes(raw.to) ? { type: "navigate", to: raw.to as HostDestination } : null;
    case "favorite":
      return typeof raw.value === "boolean" ? { type: "favorite", value: raw.value } : null;
    case "error":
      return isStr(raw.message, 300) ? { type: "error", message: raw.message } : null;
    case "event": {
      if (!isStr(raw.name, MAX_EVENT_NAME) || !raw.name) return null;
      if (raw.data === undefined) return { type: "event", name: raw.name };
      if (!isObj(raw.data)) return null;
      const entries = Object.entries(raw.data);
      if (entries.length > MAX_EVENT_FIELDS) return null;
      const data: Record<string, string | number | boolean | null> = {};
      for (const [k, v] of entries) {
        if (!isStr(k, 64)) return null;
        if (v === null || typeof v === "boolean" || isNum(v) || isStr(v, 200)) data[k] = v as string | number | boolean | null;
        else return null;
      }
      return { type: "event", name: raw.name, data };
    }
    default:
      return null;
  }
}

function parsePlayer(raw: unknown): GamePlayer | null | undefined {
  if (raw === null) return null;
  if (!isObj(raw)) return undefined;
  if (!isStr(raw.name, 80) || !isStr(raw.membership, 40) || typeof raw.guest !== "boolean" || !isNum(raw.demoBalance)) return undefined;
  return { name: raw.name, guest: raw.guest, membership: raw.membership, demoBalance: Math.max(0, raw.demoBalance) };
}

function parseConfig(raw: unknown): GameConfig | null {
  if (!isObj(raw) || typeof raw.demoOnly !== "boolean" || !isObj(raw.settings)) return null;
  const settings: GameConfig["settings"] = {};
  for (const [k, v] of Object.entries(raw.settings)) if (typeof v === "string" || typeof v === "boolean" || isNum(v)) settings[k] = v;
  return { demoOnly: raw.demoOnly, settings };
}

/** Validates the INIT message arriving at a GAME. */
export function parseInit(raw: unknown): InitMessage | null {
  if (!isObj(raw) || raw.type !== INIT || raw.protocol !== PROTOCOL_VERSION) return null;
  if (!isStr(raw.gameId, 64) || !isStr(raw.version, 32) || typeof raw.favorite !== "boolean") return null;
  const player = parsePlayer(raw.player);
  const config = parseConfig(raw.config);
  if (player === undefined || !config) return null;
  return { type: INIT, protocol: PROTOCOL_VERSION, gameId: raw.gameId, version: raw.version, player, config, favorite: raw.favorite };
}

/** Validates a message arriving at a GAME from the host over the port. */
export function parseHostMessage(raw: unknown): HostMessage | null {
  if (!isObj(raw) || raw.type !== "state") return null;
  const out: HostMessage = { type: "state" };
  if (raw.favorite !== undefined) {
    if (typeof raw.favorite !== "boolean") return null;
    out.favorite = raw.favorite;
  }
  if (raw.player !== undefined) {
    const p = parsePlayer(raw.player);
    if (p === undefined) return null;
    out.player = p;
  }
  return out;
}
