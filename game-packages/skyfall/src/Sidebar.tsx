"use client";

import { useMemo, useState } from "react";
import { Info, Trophy } from "lucide-react";
import { DEMO_RATINGS, playersForRound, viewOf } from "./players";
import type { PanelState, Snapshot } from "./engine";

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
type Tab = "general" | "bets" | "ratings";
const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "bets", label: "My Bets" },
  { id: "ratings", label: "Ratings" },
];

function Avatar({ name, hue, size = 30 }: { name: string; hue: number; size?: number }) {
  return (
    <span className="sf-av" style={{ width: size, height: size, background: `linear-gradient(135deg,hsl(${hue} 55% 42%),hsl(${(hue + 40) % 360} 60% 22%))` }} aria-hidden>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const DemoNote = ({ children }: { children: string }) => (
  <p className="sf-note">
    <Info className="mt-px h-3.5 w-3.5 shrink-0" /> {children}
  </p>
);

function describe(p: PanelState, phase: Snapshot["phase"], mult: number) {
  if (p.status === "armed") return { text: "Armed for the next round", tone: "armed" as const };
  if (p.status === "active") return phase === "flying" ? { text: `In flight · ${money(Math.floor(p.locked * mult * 100) / 100)} now`, tone: "active" as const } : { text: "Taking off", tone: "active" as const };
  if (p.status === "cashed") return { text: `Cashed out at ${money(p.cashedAt ?? 0)}x · +${money(p.payout)}`, tone: "cashed" as const };
  if (p.status === "lost") return { text: `Lost at ${money(p.last?.mult ?? 0)}x`, tone: "lost" as const };
  return { text: "No bet placed", tone: "idle" as const };
}

export function Sidebar({ snap, userName }: { snap: Snapshot; userName: string }) {
  const [tab, setTab] = useState<Tab>("general");
  const players = useMemo(() => playersForRound(snap.round), [snap.round]);
  const views = players.map((p) => viewOf(p, snap.phase, snap.mult, snap.crashAt));
  const totalStake = players.reduce((s, p) => s + p.stake, 0);
  const cashedCount = views.filter((v) => v.state === "cashed").length;

  const mine = useMemo(() => {
    const cashed = snap.bets.filter((b) => b.result === "cashed");
    return { rounds: snap.bets.length, best: cashed.reduce((m, b) => Math.max(m, b.mult), 0), net: snap.bets.reduce((s, b) => s + b.payout - b.stake, 0) };
  }, [snap.bets]);
  const board = useMemo(() => {
    const rows = [...DEMO_RATINGS.map((r) => ({ ...r, you: false })), { name: `${userName} (you)`, hue: 190, rounds: mine.rounds, best: mine.best, net: mine.net, you: true }];
    return rows.sort((a, b) => b.net - a.net);
  }, [mine, userName]);

  return (
    <aside className="sf-side" aria-label="Players and bets">
      <div className="sf-tabs" role="tablist" aria-label="Sidebar">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" id={`sf-tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`sf-pane-${t.id}`} className="sf-tab" onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div id={`sf-pane-${tab}`} role="tabpanel" aria-labelledby={`sf-tab-${tab}`} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {tab === "general" && (
          <>
            <DemoNote>Demo data. The players below are simulated sample activity, not real people.</DemoNote>
            <div className="sf-prev">
              <div>
                <p className="text-[11.5px] text-[#8fa6c8]">Previous round</p>
                <p className="sf-num text-[1.35rem] font-extrabold leading-tight" style={{ color: (snap.prev?.mult ?? 0) >= 10 ? "#ffe6a3" : (snap.prev?.mult ?? 0) >= 2 ? "#8df3ff" : "#b3c6e6" }}>
                  {snap.prev ? `${snap.prev.mult.toFixed(2)}x` : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11.5px] text-[#8fa6c8]">Demo participants</p>
                <p className="sf-num text-[15px] font-bold text-white">{players.length}</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-1 text-[11.5px] text-[#8fa6c8]">
              <span>Simulated stakes {compact(totalStake)}</span>
              <span>{cashedCount} cashed out</span>
            </div>
            <ul className="flex flex-col gap-1.5" aria-label="Simulated demo players">
              {players.map((p, i) => {
                const v = views[i];
                return (
                  <li key={p.id} className="sf-row" data-s={v.state}>
                    <Avatar name={p.name} hue={p.hue} />
                    <span className="truncate font-medium text-[#dbe8ff]">{p.name}</span>
                    <span className="sf-num text-[12px] text-[#9fb6d8]">{compact(p.stake)}</span>
                    <span className="sf-num w-[70px] text-right text-[12px] font-bold" style={{ color: v.state === "cashed" ? "#6ee7b7" : v.state === "lost" ? "#ff8fa5" : "#7d90b4" }}>
                      {v.state === "cashed" ? `${money(v.mult ?? 0)}x` : v.state === "lost" ? "Lost" : v.state === "flying" ? "Flying" : "Ready"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {tab === "bets" && (
          <>
            <p className="px-1 text-[12px] font-semibold text-[#c9dbf5]">Your demo bets</p>
            <ul className="flex flex-col gap-2" aria-label="Active bet panels">
              {snap.panels.map((p) => {
                const d = describe(p, snap.phase, snap.mult);
                return (
                  <li key={p.id} className="sf-row !grid-cols-[auto_minmax(0,1fr)_auto]" data-s={p.status === "cashed" ? "cashed" : p.status === "lost" ? "lost" : "idle"}>
                    <span className="sf-tag">{p.id === 0 ? "Bet A · Manual" : "Bet B · Auto"}</span>
                    <span className="truncate text-[12px] text-[#c9dbf5]">{d.text}</span>
                    <span className="sf-num text-[12px] text-[#9fb6d8]">{p.locked ? compact(p.locked) : compact(p.stake)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1 px-1 text-[12px] font-semibold text-[#c9dbf5]">Previous demo bets</p>
            {snap.bets.length === 0 ? (
              <p className="rounded-xl bg-white/[0.03] px-3 py-6 text-center text-[12.5px] text-[#7d90b4]">No demo bets yet. Place one in either panel below the flight.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {snap.bets.map((b) => (
                  <li key={b.id} className="sf-row !grid-cols-[auto_minmax(0,1fr)_auto]" data-s={b.result}>
                    <span className="sf-tag">{b.panel === 0 ? "A" : "B"} · #{b.round}</span>
                    <span className="sf-num text-[12px] text-[#9fb6d8]">
                      {compact(b.stake)} @ {b.result === "cashed" ? `${money(b.mult)}x` : `${money(b.mult)}x crash`}
                      {b.auto ? " · auto" : ""}
                    </span>
                    <span className="sf-num text-[12.5px] font-bold" style={{ color: b.result === "cashed" ? "#6ee7b7" : "#ff8fa5" }}>
                      {b.result === "cashed" ? `+${money(b.payout)}` : `−${money(b.stake)}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "ratings" && (
          <>
            <DemoNote>Demo leaderboard. Everyone except you is sample data built from made-up statistics.</DemoNote>
            <ol className="flex flex-col gap-1.5" aria-label="Demo leaderboard">
              {board.map((r, i) => (
                <li key={r.name} className="sf-row !grid-cols-[22px_30px_minmax(0,1fr)_auto]" data-s={r.you ? "cashed" : "idle"}>
                  <span className="sf-num text-center text-[12px] font-bold text-[#7d90b4]">{i === 0 ? <Trophy className="mx-auto h-3.5 w-3.5 text-[#e6c170]" /> : i + 1}</span>
                  <Avatar name={r.name} hue={r.hue} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-[#dbe8ff]">{r.name}</span>
                    <span className="sf-num block text-[11px] text-[#7d90b4]">
                      {r.rounds} rounds · best {r.best ? `${money(r.best)}x` : "—"}
                    </span>
                  </span>
                  <span className="sf-num text-[12.5px] font-bold" style={{ color: r.net >= 0 ? "#6ee7b7" : "#ff8fa5" }}>
                    {r.net >= 0 ? "+" : "−"}
                    {compact(Math.abs(r.net))}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </aside>
  );
}
