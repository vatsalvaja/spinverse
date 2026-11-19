"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Timer, Zap } from "lucide-react";
import { MAX_STAKE, MIN_STAKE, type PanelId, type PanelState, type Snapshot, type SkyfallEngine } from "./engine";

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PRESETS: Record<PanelId, number[]> = { 0: [10, 50, 100, 500], 1: [5, 25, 50, 250] };
const STEP: Record<PanelId, number> = { 0: 10, 1: 5 };

interface Props {
  engine: SkyfallEngine;
  snap: Snapshot;
  id: PanelId;
  mode: "manual" | "auto";
  title: string;
}

const STATUS_LABEL = { idle: "Ready", armed: "Armed", active: "In flight", cashed: "Cashed out", lost: "Lost" } as const;

/** One independent betting panel. Everything it does goes through `engine` calls keyed by its own id. */
export function BetPanel({ engine, snap, id, mode, title }: Props) {
  const panel: PanelState = snap.panels[id];
  const { phase, mult } = snap;
  const locked = panel.status === "armed" || panel.status === "active";

  // keep the text boxes editable while typing; commit on blur / Enter
  const [stakeText, setStakeText] = useState(String(panel.stake));
  const [atText, setAtText] = useState(panel.autoAt.toFixed(2));
  useEffect(() => setStakeText(String(panel.stake)), [panel.stake]);
  useEffect(() => setAtText(panel.autoAt.toFixed(2)), [panel.autoAt]);

  const commitStake = () => {
    const n = Number(stakeText);
    if (Number.isFinite(n)) engine.setStake(id, n);
    else setStakeText(String(panel.stake));
  };
  const commitAt = () => {
    const n = Number(atText);
    if (Number.isFinite(n)) engine.setAuto(id, panel.autoOn, n);
    else setAtText(panel.autoAt.toFixed(2));
  };
  const bump = (d: number) => engine.setStake(id, panel.stake + d);

  const inFlight = panel.status === "active" && phase === "flying";
  const liveReturn = Math.floor(panel.locked * mult * 100 + 1e-9) / 100;
  const nextRound = phase !== "waiting";

  let kind: "bet" | "cancel" | "cash" | "wait" = "bet";
  let label = nextRound ? "Bet next round" : "Place demo bet";
  let onClick: () => void = () => engine.placeBet(id);
  let disabled = false;
  if (panel.status === "armed") {
    kind = "cancel";
    label = nextRound ? "Cancel next-round bet" : "Cancel bet";
    onClick = () => engine.cancelBet(id);
  } else if (panel.status === "active") {
    if (inFlight) {
      kind = "cash";
      label = "Cash out";
      onClick = () => engine.cashOut(id);
    } else {
      kind = "wait";
      label = "Taking off…";
      disabled = true;
    }
  }

  // the line under the button: what this panel is worth right now
  let returnLabel = "Demo return";
  let returnValue = "—";
  let tone: "win" | "lose" | undefined;
  if (inFlight) {
    returnValue = `${money(liveReturn)}`;
  } else if (panel.status === "cashed") {
    returnLabel = `Cashed at ${money(panel.cashedAt ?? 0)}x`;
    returnValue = `+${money(panel.payout)}`;
    tone = "win";
  } else if (panel.status === "lost") {
    returnLabel = panel.last ? `Lost at ${money(panel.last.mult)}x` : "Lost";
    returnValue = `−${money(panel.last?.stake ?? 0)}`;
    tone = "lose";
  } else if (panel.status === "armed") {
    returnLabel = "Stake reserved";
    returnValue = money(panel.locked);
  }

  let autoStatus = "";
  if (mode === "auto") {
    if (!panel.autoOn) autoStatus = "Auto cash-out is off. Cash out yourself during the flight.";
    else if (panel.status === "cashed" && panel.last) autoStatus = panel.cashedAt === panel.autoAt ? `Auto cash-out triggered at ${money(panel.autoAt)}x` : `Cashed out manually at ${money(panel.cashedAt ?? 0)}x`;
    else if (panel.status === "lost") autoStatus = `Crashed before ${money(panel.autoAt)}x`;
    else if (panel.status === "active") autoStatus = `Will cash out automatically at ${money(panel.autoAt)}x`;
    else autoStatus = `Auto cash-out set to ${money(panel.autoAt)}x`;
  }

  return (
    <section className="sf-bet" data-s={panel.status} aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="sf-display text-[12.5px] font-semibold tracking-wide text-white">{title}</h3>
        <span className="sf-tag" data-s={panel.status}>{STATUS_LABEL[panel.status]}</span>
      </div>

      <div className="sf-stake" data-off={locked}>
        <button type="button" className="sf-step" disabled={locked || panel.stake <= MIN_STAKE} onClick={() => bump(-STEP[id])} aria-label={`Decrease stake of panel ${title}`}>
          <Minus className="h-4 w-4" />
        </button>
        <input
          inputMode="numeric"
          aria-label={`Demo stake for ${title}`}
          value={stakeText}
          disabled={locked}
          onChange={(e) => setStakeText(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
          onBlur={commitStake}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitStake();
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <button type="button" className="sf-step" disabled={locked || panel.stake >= MAX_STAKE} onClick={() => bump(STEP[id])} aria-label={`Increase stake of panel ${title}`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="sf-presets" role="group" aria-label={`Stake presets for ${title}`}>
        {PRESETS[id].map((p) => (
          <button key={p} type="button" className="sf-preset" disabled={locked} onClick={() => engine.setStake(id, p)} aria-pressed={panel.stake === p}>
            {p}
          </button>
        ))}
      </div>

      {mode === "auto" && (
        <div className="sf-auto">
          <button type="button" role="switch" aria-checked={panel.autoOn} aria-label="Auto cash-out" className="sf-toggle" onClick={() => engine.setAuto(id, !panel.autoOn)} />
          <span className="shrink-0 text-[12.5px] font-semibold text-[#c9dbf5]">Auto cash out at</span>
          <div className="sf-at" data-off={!panel.autoOn}>
            <input
              inputMode="decimal"
              aria-label="Auto cash-out multiplier"
              value={atText}
              disabled={!panel.autoOn || panel.status === "active"}
              onChange={(e) => setAtText(e.target.value.replace(/[^0-9.]/g, "").slice(0, 7))}
              onBlur={commitAt}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitAt();
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            <span className="pr-3 font-num text-sm font-bold text-[#7d90b4]">x</span>
          </div>
        </div>
      )}

      <button type="button" className="sf-go" data-k={kind} disabled={disabled} onClick={onClick}>
        {kind === "cash" ? (
          <>
            <Zap className="h-[18px] w-[18px] fill-current" />
            <span className="flex flex-col items-start leading-tight">
              <span>{label}</span>
              <span className="sf-num text-[12px] font-bold opacity-80">{money(liveReturn)} demo credits</span>
            </span>
          </>
        ) : (
          label
        )}
      </button>

      <div className="sf-ret">
        <span>{returnLabel}</span>
        <b data-w={tone}>{returnValue}</b>
      </div>
      {mode === "auto" && (
        <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-[#7d90b4]">
          <Timer className="mt-px h-3.5 w-3.5 shrink-0" /> {autoStatus}
        </p>
      )}
      {panel.note && (
        <p role="alert" className="text-[12px] font-medium text-[#ff8fa5]">
          {panel.note}
        </p>
      )}
    </section>
  );
}
