"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, PackageX } from "lucide-react";
import { HELLO, INIT, PROTOCOL_VERSION, parseGameMessage, type GameMessage, type GamePlayer, type HostDestination, type InitMessage } from "@game-sdk/protocol";
import { useSession } from "@/lib/session";
import { useGamePackage } from "./useGamePackage";

/** Where each destination a game may request leads. Games never send URLs, only these names. */
const ROUTES: Record<HostDestination, string> = { lobby: "/dashboard", profile: "/profile", wallet: "/wallet", settings: "/settings" };
const READY_TIMEOUT_MS = 15000;

type GameEvent = Extract<GameMessage, { type: "event" }>;

/**
 * Launches a game package full-screen. Every game goes through this one loader:
 *   package source -> <iframe> -> handshake -> private MessagePort -> controlled messages (see protocol.ts).
 *
 * The iframe carries nothing sensitive in its URL. The host answers the game's HELLO only when it comes from the
 * iframe this component created, then talks to it over a transferred MessageChannel port. Every message coming
 * back is validated by `parseGameMessage`; unknown or malformed messages are dropped. The game receives a display
 * name, a membership label and the DEMO balance, never ids, emails or the host's data.
 *
 * Today the iframe is served from this site's origin. In production, serve packages from a separate origin
 * (for example a games subdomain): the handshake already checks the iframe's own origin, so nothing changes here.
 */
export function GameHost({ gameId, onEvent }: { gameId: string; onEvent?: (e: GameEvent) => void }) {
  const router = useRouter();
  const { player, mode, favorites, toggleFavorite, signOut } = useSession();
  const [attempt, setAttempt] = useState(0);
  const lookup = useGamePackage(gameId, attempt);
  const frame = useRef<HTMLIFrameElement>(null);
  const port = useRef<MessagePort | null>(null);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  const favorite = favorites.includes(gameId);
  const gamePlayer: GamePlayer | null = player ? { name: player.name, guest: mode === "guest", membership: String(player.membership), demoBalance: Math.max(0, player.balance) } : null;

  // the handshake handlers always read the latest values through this ref
  const live = useRef({ gamePlayer, favorite, toggleFavorite, signOut, router, onEvent });
  live.current = { gamePlayer, favorite, toggleFavorite, signOut, router, onEvent };

  const pkg = lookup.status === "ready" ? lookup.pkg : null;

  useEffect(() => {
    if (!pkg) return;
    setReady(false);
    setSlow(false);
    const target = new URL(pkg.entryUrl, window.location.href).origin;

    const handle = (m: GameMessage | null) => {
      if (!m) return;
      const h = live.current;
      switch (m.type) {
        case "ready":
          setReady(true);
          break;
        case "exit":
          h.router.push(ROUTES.lobby);
          break;
        case "navigate":
          h.router.push(ROUTES[m.to]);
          break;
        case "signOut":
          h.signOut();
          h.router.push("/login");
          break;
        case "favorite":
          if (h.favorite !== m.value) h.toggleFavorite(pkg.gameId);
          break;
        case "event":
          h.onEvent?.(m);
          break;
        case "error":
          console.warn(`[${pkg.gameId}] ${m.message}`);
          break;
      }
    };

    const onWindowMessage = (e: MessageEvent) => {
      const win = frame.current?.contentWindow;
      if (!win || e.source !== win || e.origin !== target) return; // only the iframe we created
      const d = e.data as { type?: unknown; protocol?: unknown } | null;
      if (!d || d.type !== HELLO || d.protocol !== PROTOCOL_VERSION) return;

      port.current?.close();
      const channel = new MessageChannel();
      port.current = channel.port1;
      channel.port1.onmessage = (ev) => handle(parseGameMessage(ev.data));
      const h = live.current;
      const init: InitMessage = { type: INIT, protocol: PROTOCOL_VERSION, gameId: pkg.gameId, version: pkg.version, player: h.gamePlayer, config: { demoOnly: true, settings: {} }, favorite: h.favorite };
      win.postMessage(init, target, [channel.port2]);
    };

    window.addEventListener("message", onWindowMessage);
    const timer = window.setTimeout(() => setSlow(true), READY_TIMEOUT_MS);
    return () => {
      window.removeEventListener("message", onWindowMessage);
      window.clearTimeout(timer);
      port.current?.close();
      port.current = null;
    };
  }, [pkg]);

  // keep the game informed when the host's favorite state changes
  useEffect(() => {
    port.current?.postMessage({ type: "state", favorite });
  }, [favorite]);

  if (lookup.status === "loading") return <Screen><Loader2 className="h-6 w-6 animate-spin text-gold-300" /><p className="mt-3 text-sm text-white/55">Finding game package…</p></Screen>;

  if (lookup.status === "unavailable" || lookup.status === "error") {
    const none = lookup.status === "unavailable";
    return (
      <Screen>
        <PackageX className="h-9 w-9 text-gold-300/80" />
        <h1 className="sv-display mt-4 text-xl text-white">{none ? "This game isn’t available right now" : "The game package couldn’t be loaded"}</h1>
        <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-white/55">
          {lookup.status === "error"
            ? lookup.message
            : lookup.registry
              ? `No package for “${gameId}” has been installed.`
              : "No game packages have been built yet. In development, run “npm run package” once to build and install the local game packages, then reload."}
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setAttempt((n) => n + 1)} className="rounded-full border border-gold-400/40 px-4 py-2 text-sm text-gold-200 hover:bg-white/5">Try again</button>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"><ArrowLeft className="h-4 w-4" /> Back to lobby</Link>
        </div>
      </Screen>
    );
  }

  const { pkg: record } = lookup;
  return (
    <>
      <iframe
        ref={frame}
        key={record.entryUrl}
        src={record.entryUrl}
        title={record.name}
        className="fixed inset-0 h-full w-full border-0 bg-black"
        // scripts must run and the package is same-origin for now; the sandbox still blocks top navigation, popups and dialogs
        sandbox="allow-scripts allow-same-origin"
        allow="autoplay; fullscreen; gamepad"
        allowFullScreen
        referrerPolicy="no-referrer"
        onLoad={() => frame.current?.focus()}
      />
      {!ready && (
        <div className="fixed inset-0 z-[5] flex flex-col items-center justify-center bg-black text-center">
          <Loader2 className="h-6 w-6 animate-spin text-gold-300" />
          <p className="mt-3 text-sm text-white/55">{slow ? "This is taking longer than expected…" : `Loading ${record.name}…`}</p>
          {slow && <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"><ArrowLeft className="h-4 w-4" /> Back to lobby</Link>}
        </div>
      )}
    </>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[5] flex flex-col items-center justify-center bg-obsidian-950 px-6">{children}</div>;
}
