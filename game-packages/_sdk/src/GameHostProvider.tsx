import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HELLO, parseHostMessage, parseInit, type GameConfig, type GameMessage, type GamePlayer, type HostDestination } from "./protocol";

/**
 * The game side of the host contract. Wrap the game once:
 *
 *   <GameHostProvider><MyGame /></GameHostProvider>
 *
 * and read everything from `useGameHost()`. The provider performs the handshake described in protocol.ts and
 * renders `fallback` until the host has answered, so a game can read the player and demo balance on its very
 * first render. Opened directly (not inside the SPINVERSE site) it falls back to "standalone" mode with no
 * player, so a game is still usable on its own.
 */
export interface GameHost {
  gameId: string;
  /** Package version the host launched. */
  version: string;
  /** True when running inside the SPINVERSE site. */
  embedded: boolean;
  player: GamePlayer | null;
  config: GameConfig;
  favorite: boolean;
  /** Back to the lobby. */
  exit: () => void;
  /** Open another host page. Only the destinations in the protocol are possible. */
  navigate: (to: HostDestination) => void;
  signOut: () => void;
  setFavorite: (value: boolean) => void;
  toggleFavorite: () => void;
  /** Report an informational game event or result. Untrusted by the host; never used for balances. */
  emit: (name: string, data?: Record<string, string | number | boolean | null>) => void;
}

const HostContext = createContext<GameHost | null>(null);

export function useGameHost(): GameHost {
  const ctx = useContext(HostContext);
  if (!ctx) throw new Error("useGameHost must be used inside <GameHostProvider>.");
  return ctx;
}

const HANDSHAKE_RETRY_MS = 250;
const HANDSHAKE_TIMEOUT_MS = 8000;

type Connection =
  | { status: "connecting" }
  | { status: "standalone" }
  | { status: "ready"; gameId: string; version: string; player: GamePlayer | null; config: GameConfig; favorite: boolean };

const STANDALONE_CONFIG: GameConfig = { demoOnly: true, settings: {} };

function DefaultFallback() {
  return <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "#07070a", color: "rgba(255,255,255,.45)", font: "500 13px system-ui, sans-serif", letterSpacing: ".08em" }}>Loading…</div>;
}

export function GameHostProvider({ children, gameId = "standalone", fallback }: { children: ReactNode; gameId?: string; fallback?: ReactNode }) {
  const embedded = typeof window !== "undefined" && window.parent !== window;
  const [conn, setConn] = useState<Connection>({ status: "connecting" });
  const port = useRef<MessagePort | null>(null);

  const send = useCallback((msg: GameMessage) => {
    port.current?.postMessage(msg);
  }, []);

  useEffect(() => {
    if (!embedded) {
      setConn({ status: "standalone" });
      return;
    }

    let done = false;
    const bind = (p: MessagePort) => {
      port.current?.close();
      port.current = p;
      p.onmessage = (e: MessageEvent) => {
        const m = parseHostMessage(e.data);
        if (!m) return;
        setConn((c) => (c.status === "ready" ? { ...c, favorite: m.favorite ?? c.favorite, player: m.player !== undefined ? m.player : c.player } : c));
      };
    };

    const onWindowMessage = (e: MessageEvent) => {
      // only the parent window may initialise us, and only with a transferred port
      if (e.source !== window.parent || !e.ports[0]) return;
      const init = parseInit(e.data);
      if (!init) return;
      done = true;
      bind(e.ports[0]);
      setConn({ status: "ready", gameId: init.gameId, version: init.version, player: init.player, config: init.config, favorite: init.favorite });
      send({ type: "ready" });
    };
    window.addEventListener("message", onWindowMessage);

    const hello = () => window.parent.postMessage({ type: HELLO, protocol: 1 }, "*"); // carries no data
    hello();
    const retry = window.setInterval(() => !done && hello(), HANDSHAKE_RETRY_MS);
    const giveUp = window.setTimeout(() => {
      if (done) return;
      window.clearInterval(retry);
      console.warn("[spinverse] The host did not answer the handshake. Running standalone.");
      setConn({ status: "standalone" });
    }, HANDSHAKE_TIMEOUT_MS);

    return () => {
      window.removeEventListener("message", onWindowMessage);
      window.clearInterval(retry);
      window.clearTimeout(giveUp);
      port.current?.close();
      port.current = null;
    };
  }, [embedded, send]);

  const value = useMemo<GameHost | null>(() => {
    if (conn.status === "connecting") return null;
    const ready = conn.status === "ready" ? conn : null;
    const setFavorite = (v: boolean) => {
      setConn((c) => (c.status === "ready" ? { ...c, favorite: v } : c));
      send({ type: "favorite", value: v });
    };
    return {
      gameId: ready?.gameId ?? gameId,
      version: ready?.version ?? "0.0.0",
      embedded,
      player: ready?.player ?? null,
      config: ready?.config ?? STANDALONE_CONFIG,
      favorite: ready?.favorite ?? false,
      exit: () => send({ type: "exit" }),
      navigate: (to) => send({ type: "navigate", to }),
      signOut: () => send({ type: "signOut" }),
      setFavorite,
      toggleFavorite: () => setFavorite(!(ready?.favorite ?? false)),
      emit: (name, data) => send(data ? { type: "event", name, data } : { type: "event", name }),
    };
  }, [conn, embedded, gameId, send]);

  if (!value) return <>{fallback ?? <DefaultFallback />}</>;
  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
}
