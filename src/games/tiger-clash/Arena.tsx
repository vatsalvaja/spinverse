"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Backdrop } from "./Backdrop";
import { PlayingCard, SuitIcon, suitColor, type CardState } from "./Cards";
import { rankLabel, rankName, type Side, type Snapshot } from "./engine";
import { Fx, type FxHandle } from "./Fx";
import { ANCHORS, DragonCharacter, TigerCharacter, type Pose } from "./Sprites";

type Pt = { x: number; y: number };

export interface ArenaHandle {
  fx: FxHandle | null;
  flash: (color: string) => void;
  /** where a creature's mouth is right now, as fractions of the arena (follows its lunge) */
  mouth: (who: "tiger" | "dragon") => Pt;
  /** the floor under a creature */
  feet: (who: "tiger" | "dragon") => Pt;
  /** the middle of the table, between the two cards */
  center: () => Pt;
}

function ValueChip({ side, card, on }: { side: "tiger" | "dragon"; card: Snapshot["tigerCard"]; on: boolean }) {
  return (
    <div className="tc-val" data-on={on && !!card} data-side={side} aria-live="polite">
      {card && (
        <>
          <span className="tc-val-who">{side === "tiger" ? "Tiger" : "Dragon"}</span>
          <span>{rankLabel(card.rank)}</span>
          <span style={{ color: suitColor(card.suit) === "#b3202a" ? "#ff7a85" : "#cfd8f0" }}>
            <SuitIcon suit={card.suit} className="inline h-3.5 w-3.5 align-[-2px]" />
          </span>
          <span className="opacity-70">· {card.rank}</span>
        </>
      )}
    </div>
  );
}

const MID_TEXT: Record<Snapshot["phase"], string> = {
  waiting: "Shuffling the deck",
  selection: "Choose your side",
  locked: "Selections locked",
  tigerReveal: "Tiger's card",
  suspense: "Dragon's turn",
  dragonReveal: "Dragon's card",
  result: "",
  nextRound: "Next round",
};

interface Props {
  snap: Snapshot;
  calm: boolean;
  banner: Side | null;
  shake: boolean;
}

/**
 * The battle arena: the stone hall, the two painted creatures facing each other, the cards between them, the
 * effects canvas on top and the winner banner. On large screens it is the full-bleed scene behind the interface.
 */
export const Arena = forwardRef<ArenaHandle, Props>(function Arena({ snap, calm, banner, shake }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const fx = useRef<FxHandle>(null);
  const flashEl = useRef<HTMLDivElement>(null);
  const tigerBox = useRef<HTMLDivElement>(null);
  const dragonBox = useRef<HTMLDivElement>(null);
  const mid = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => {
    const frac = (px: number, py: number): Pt => {
      const r = root.current?.getBoundingClientRect();
      if (!r || !r.width || !r.height) return { x: 0.5, y: 0.5 };
      return { x: (px - r.left) / r.width, y: (py - r.top) / r.height };
    };
    const rigOf = (who: "tiger" | "dragon") => (who === "tiger" ? tigerBox : dragonBox).current?.querySelector<HTMLElement>("[data-rig]") ?? null;
    return {
      get fx() {
        return fx.current;
      },
      flash(color: string) {
        const el = flashEl.current;
        if (!el) return;
        el.style.background = `radial-gradient(60% 60% at 50% 45%, ${color}, transparent 75%)`;
        el.animate([{ opacity: calm ? 0.4 : 0.85 }, { opacity: 0 }], { duration: 700, easing: "ease-out" });
      },
      mouth(who) {
        const r = rigOf(who)?.getBoundingClientRect();
        if (!r) return { x: who === "tiger" ? 0.3 : 0.7, y: 0.5 };
        const a = ANCHORS[who].mouth;
        return frac(r.left + a.x * r.width, r.top + a.y * r.height);
      },
      feet(who) {
        const r = rigOf(who)?.getBoundingClientRect();
        if (!r) return { x: who === "tiger" ? 0.15 : 0.85, y: 0.8 };
        return frac(r.left + r.width * (who === "tiger" ? 0.45 : 0.55), r.bottom - r.height * 0.05);
      },
      center() {
        const r = mid.current?.getBoundingClientRect();
        if (!r) return { x: 0.5, y: 0.4 };
        return frac(r.left + r.width / 2, r.top + r.height / 2);
      },
    };
  });

  const { phase, winner } = snap;
  const inResult = phase === "result";
  const tigerPose: Pose = inResult ? (winner === "tiger" ? "victory" : winner === "dragon" ? "defeat" : "roar") : "idle";
  const dragonPose: Pose = inResult ? (winner === "dragon" ? "victory" : winner === "tiger" ? "defeat" : "roar") : "idle";

  const tigerFace = !!snap.tigerCard;
  const dragonFace = !!snap.dragonCard;
  const tigerState: CardState = !inResult ? "idle" : winner === "tiger" ? "win" : winner === "dragon" ? "lose" : "tie";
  const dragonState: CardState = !inResult ? "idle" : winner === "dragon" ? "win" : winner === "tiger" ? "lose" : "tie";
  const showResult = (inResult || phase === "nextRound") && snap.tigerCard && snap.dragonCard;

  return (
    <div ref={root} className={`tc-arena ${shake && !calm ? "tc-shake" : ""}`} role="group" aria-label="Battle arena">
      <Backdrop />

      <div ref={tigerBox} className="tc-stage-char" data-side="tiger" data-win={winner === "tiger"} aria-hidden>
        <TigerCharacter pose={tigerPose} reduced={calm} />
      </div>
      <div ref={dragonBox} className="tc-stage-char" data-side="dragon" data-win={winner === "dragon"} aria-hidden>
        <DragonCharacter pose={dragonPose} reduced={calm} />
      </div>

      <Fx ref={fx} reduced={calm} />

      {/* the cards: always laid out in the same place so a reveal never moves anything */}
      <div className="tc-cards">
        <div className="tc-col">
          <PlayingCard card={snap.tigerCard} dealt={snap.dealt} faceUp={tigerFace} tone="tiger" state={tigerState} label="Tiger card" />
          <ValueChip side="tiger" card={snap.tigerCard} on={tigerFace} />
        </div>

        <div ref={mid} className="tc-mid">
          {phase === "selection" ? (
            <div className="tc-timer" role="timer" aria-label={`${snap.countdown} seconds left to choose`}>
              <svg viewBox="0 0 120 120" aria-hidden>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#tc-cd)" strokeWidth="5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * snap.countdownProgress} transform="rotate(-90 60 60)" />
                <defs>
                  <linearGradient id="tc-cd" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0" stopColor="#e0a63e" />
                    <stop offset="1" stopColor="#3db8ff" />
                  </linearGradient>
                </defs>
              </svg>
              <b>{Math.max(1, snap.countdown)}</b>
            </div>
          ) : showResult && snap.tigerCard && snap.dragonCard ? (
            <div className="tc-num flex items-center gap-2 text-[clamp(1.3rem,3.6cqw,2.6rem)] font-extrabold" aria-label={`Tiger ${snap.tigerCard.rank}, Dragon ${snap.dragonCard.rank}`}>
              <span style={{ color: winner === "dragon" ? "#7d88a8" : "#f3cd82" }}>{snap.tigerCard.rank}</span>
              <span className="text-[.5em] font-bold text-white/50">{winner === "tie" ? "=" : winner === "tiger" ? ">" : "<"}</span>
              <span style={{ color: winner === "tiger" ? "#7d88a8" : "#9be4ff" }}>{snap.dragonCard.rank}</span>
            </div>
          ) : (
            <span className="tc-vs">VS</span>
          )}
          <span className="tc-status" aria-live="polite">
            {inResult && snap.tigerCard && snap.dragonCard
              ? winner === "tie"
                ? "Equal ranks"
                : `${rankName(winner === "tiger" ? snap.tigerCard.rank : snap.dragonCard.rank)} beats ${rankName(winner === "tiger" ? snap.dragonCard.rank : snap.tigerCard.rank)}`
              : phase === "selection" && snap.bet
                ? "Selection placed"
                : MID_TEXT[phase]}
          </span>
        </div>

        <div className="tc-col">
          <PlayingCard card={snap.dragonCard} dealt={snap.dealt} faceUp={dragonFace} tone="dragon" state={dragonState} label="Dragon card" />
          <ValueChip side="dragon" card={snap.dragonCard} on={dragonFace} />
        </div>
      </div>

      <AnimatePresence>
        {banner && (
          <motion.div
            key={`${snap.round}-${banner}`}
            className="tc-banner"
            data-k={banner}
            initial={{ opacity: 0, scale: 0.4, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            role="status"
          >
            <h2>{banner === "tiger" ? "TIGER WINS!" : banner === "dragon" ? "DRAGON WINS!" : "IT’S A TIE!"}</h2>
            {snap.last && snap.last.pick && (
              <p>
                {snap.last.net > 0 ? `You won +${snap.last.net.toLocaleString("en-US")} demo credits` : snap.last.net < 0 ? `You lost ${Math.abs(snap.last.net).toLocaleString("en-US")} demo credits` : "Break-even"}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={flashEl} className="tc-flash" aria-hidden />
    </div>
  );
});
