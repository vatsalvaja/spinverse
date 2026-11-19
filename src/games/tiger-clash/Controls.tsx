"use client";

import { useEffect, useState } from "react";
import { ChevronsLeft, ChevronsRight, Minus, Plus } from "lucide-react";
import { SuitIcon, suitColor } from "./Cards";
import { MAX_STAKE, MIN_STAKE, PAYOUT, rankLabel, type Side, type Snapshot, type TigerClashEngine } from "./engine";

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const money2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PRESETS = [10, 25, 50, 100, 500];
const SIDE_NAME: Record<Side, string> = { tiger: "Tiger", dragon: "Dragon", tie: "Tie" };
const PAYS: Record<Side, string> = { tiger: "Pays 1:1", dragon: "Pays 1:1", tie: "Pays 8:1" };

/** The three selection buttons: Tiger, Tie and Dragon, each with its emblem. */
export function PickBar({ engine, snap }: { engine: TigerClashEngine; snap: Snapshot }) {
  const { phase, bet, pending } = snap;
  const open = phase === "selection" && !bet;
  const chosen = bet?.side ?? pending;
  return (
    <div className="tc-picks" role="group" aria-label="Choose Tiger, Dragon or Tie">
      {(["tiger", "tie", "dragon"] as Side[]).map((s) => (
        <button key={s} type="button" className="tc-pick" data-side={s} aria-pressed={chosen === s} disabled={!open && chosen !== s} onClick={() => engine.pick(s)}>
          <span className="tc-pick-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="tc-pick-emblem" src={`/art/tiger-clash/ui/emblem-${s}.webp`} alt="" draggable={false} />
            <span className="tc-pick-txt">
              <b>{SIDE_NAME[s].toUpperCase()}</b>
              <small>{PAYS[s]}</small>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

function MiniCard({ rank, suit }: { rank: number; suit: "S" | "H" | "D" | "C" }) {
  return (
    <span className="tc-mini" style={{ color: suitColor(suit) }}>
      <span className="flex flex-col items-center leading-none">
        {rankLabel(rank)}
        <SuitIcon suit={suit} className="mt-0.5 h-3 w-3" />
      </span>
    </span>
  );
}

/** Selection readout, balance, stake, quick bets and the round summary with the Place Bet button. */
export function BottomPanels({ engine, snap }: { engine: TigerClashEngine; snap: Snapshot }) {
  const { phase, bet, pending, last } = snap;
  const chosen = bet?.side ?? pending;

  const [text, setText] = useState(String(snap.stake));
  useEffect(() => setText(String(snap.stake)), [snap.stake]);
  const commit = () => {
    const n = Number(text);
    if (Number.isFinite(n) && text !== "") engine.setStake(n);
    else setText(String(snap.stake));
  };

  let kind: "place" | "cancel" | "idle" = "idle";
  let label = "Next round is starting";
  let onClick: () => void = () => {};
  let disabled = true;
  if (bet) {
    if (phase === "selection") {
      kind = "cancel";
      label = "Cancel and refund";
      onClick = () => engine.cancel();
      disabled = false;
    } else {
      label = `Locked: ${SIDE_NAME[bet.side]} · ${money(bet.stake)}`;
    }
  } else if (phase === "selection") {
    kind = "place";
    label = chosen ? "Place bet" : "Choose a side first";
    onClick = () => engine.place();
    disabled = !chosen;
  } else if (phase !== "waiting" && phase !== "nextRound") {
    label = "Selections are locked";
  }

  return (
    <section className="tc-bottom" aria-label="Bet controls">
      <div className="tc-cell">
        <h3>Your selection</h3>
        <p className="tc-cell-v" style={{ color: chosen === "tiger" ? "#f3cd82" : chosen === "dragon" ? "#9be4ff" : chosen === "tie" ? "#d9d2ff" : "#7d86a0" }}>
          {chosen ? `${SIDE_NAME[chosen].toUpperCase()} · ${money(bet?.stake ?? snap.stake)}` : "--"}
        </p>
      </div>

      <div className="tc-cell">
        <h3>Demo balance</h3>
        <p className="tc-cell-v">
          <span className="tc-coin" aria-hidden />
          <span className="tc-num">{money2(snap.balance)}</span>
        </p>
      </div>

      <div className="tc-cell">
        <h3>Stake</h3>
        <div className="tc-stake" data-off={!!bet}>
          <button type="button" className="tc-step" disabled={!!bet || snap.stake <= MIN_STAKE} onClick={() => engine.setStake(snap.stake - 10)} aria-label="Decrease demo stake">
            <Minus className="h-4 w-4" />
          </button>
          <input
            inputMode="numeric"
            aria-label="Demo stake"
            value={text}
            disabled={!!bet}
            onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commit();
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          <button type="button" className="tc-step" disabled={!!bet || snap.stake >= MAX_STAKE} onClick={() => engine.setStake(snap.stake + 10)} aria-label="Increase demo stake">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="tc-cell">
        <h3>Quick bet</h3>
        <div className="tc-presets" role="group" aria-label="Stake presets">
          {PRESETS.map((p) => (
            <button key={p} type="button" className="tc-preset" aria-pressed={snap.stake === p} disabled={!!bet} onClick={() => engine.setStake(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="tc-cell tc-sum">
        <h3>Round summary</h3>
        <div className="tc-sum-row">
          <span>Selected side:</span>
          <b>{chosen ? SIDE_NAME[chosen] : "None"}</b>
        </div>
        {last ? (
          <div className="tc-sum-row" aria-label={`Last round ${last.round}`}>
            <span className="flex items-center gap-1.5">
              <MiniCard rank={last.tiger.rank} suit={last.tiger.suit} />
              <MiniCard rank={last.dragon.rank} suit={last.dragon.suit} />
            </span>
            <span className="text-right leading-tight">
              <b className="tc-display block text-[12px]" style={{ color: last.winner === "tiger" ? "#f3cd82" : last.winner === "dragon" ? "#9be4ff" : "#dfe6ff" }}>
                {last.winner === "tie" ? "TIE" : `${SIDE_NAME[last.winner].toUpperCase()} WINS`}
              </b>
              <b className="tc-num text-[12px]" style={{ color: !last.pick ? "#7d88a8" : last.net > 0 ? "#6ee7b7" : last.net < 0 ? "#ff8fa5" : "#cfd8f0" }}>
                {!last.pick ? "No selection" : last.net > 0 ? `+${money(last.net)}` : last.net < 0 ? `−${money(Math.abs(last.net))}` : "Even"}
              </b>
            </span>
          </div>
        ) : (
          <div className="tc-sum-row">
            <span>Last round:</span>
            <b>None yet</b>
          </div>
        )}
        <div className="tc-sum-row">
          <span>Cards left in deck:</span>
          <b className="tc-num">{snap.deckLeft}</b>
        </div>
        {snap.note && (
          <p role="alert" className="text-[12px] font-medium text-[#ff8fa5]">
            {snap.note}
          </p>
        )}
      </div>

      <button type="button" className="tc-place" data-k={kind} disabled={disabled} onClick={onClick}>
        {kind === "place" && <ChevronsLeft className="h-5 w-5" aria-hidden />}
        <span>{label.toUpperCase()}</span>
        {kind === "place" && <ChevronsRight className="h-5 w-5" aria-hidden />}
      </button>
    </section>
  );
}

export const PAYOUT_NOTE = `Tiger or Dragon returns ${PAYOUT.win}x your stake, a Tie returns ${PAYOUT.tie}x, and a Tie returns half your stake to Tiger and Dragon selections.`;
