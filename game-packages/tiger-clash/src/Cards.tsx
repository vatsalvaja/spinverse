"use client";

import type { Card, Suit } from "./engine";
import { rankLabel } from "./engine";
import { assetUrl } from "@spinverse/game-sdk";

const RED = "#b3202a";
const INK = "#12151f";
export const suitColor = (s: Suit) => (s === "H" || s === "D" ? RED : INK);
export const SUIT_NAME: Record<Suit, string> = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };

/** The four suit symbols, drawn as filled shapes so they stay crisp at any size. */
export function SuitIcon({ suit, className }: { suit: Suit; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden focusable="false">
      {suit === "H" && <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />}
      {suit === "D" && <path d="M12 1.5l8.2 10.5L12 22.5 3.8 12z" />}
      {suit === "S" && <path d="M12 1.8C9.2 6 3 9.4 3 14.3 3 17.1 5.2 19 7.8 19c1.5 0 2.8-.6 3.7-1.6-.2 1.7-.9 3.1-2.3 4.9h5.6c-1.4-1.8-2.1-3.2-2.3-4.9.9 1 2.2 1.6 3.7 1.6 2.6 0 4.8-1.9 4.8-4.7C21 9.4 14.8 6 12 1.8z" />}
      {suit === "C" && (
        <>
          <circle cx="12" cy="7.2" r="4.6" />
          <circle cx="6.6" cy="14.4" r="4.6" />
          <circle cx="17.4" cy="14.4" r="4.6" />
          <path d="M12 11.5c0 4.2-1 7.4-2.8 10.2h5.6c-1.8-2.8-2.8-6-2.8-10.2z" />
        </>
      )}
    </svg>
  );
}

/** The card back: the painted tiger-and-dragon insignia in a gold frame (cut from the reference artwork). */
function CardBack() {
  return <img src={assetUrl("assets/art/ui/card-back.webp")} alt="" draggable={false} className="tcc-svg" decoding="async" style={{ objectFit: "fill" }} />;
}

function CardFront({ card }: { card: Card }) {
  const c = suitColor(card.suit);
  const label = rankLabel(card.rank);
  return (
    <div className="tcc-front-in" style={{ color: c }}>
      <div className="tcc-corner tcc-tl">
        <span className="tcc-rank">{label}</span>
        <SuitIcon suit={card.suit} className="tcc-pip" />
      </div>
      <div className="tcc-corner tcc-br">
        <span className="tcc-rank">{label}</span>
        <SuitIcon suit={card.suit} className="tcc-pip" />
      </div>
      <div className="tcc-center">
        <SuitIcon suit={card.suit} className="tcc-big" />
        {card.rank >= 11 && <span className="tcc-royal">{label}</span>}
      </div>
    </div>
  );
}

export type CardState = "idle" | "win" | "lose" | "tie";

interface Props {
  card: Card | null;
  /** on the table (face-down at least) */
  dealt: boolean;
  faceUp: boolean;
  tone: "tiger" | "dragon";
  state?: CardState;
  label: string;
}

/** A card with a real 3D flip. The slot always reserves its space so revealing a card never shifts the layout. */
export function PlayingCard({ card, dealt, faceUp, tone, state = "idle", label }: Props) {
  const name = card ? `${rankLabel(card.rank)} of ${SUIT_NAME[card.suit]}` : "face-down card";
  return (
    <div className="tcc-slot" data-tone={tone} role="img" aria-label={`${label}: ${faceUp && card ? name : dealt ? "face-down card" : "no card yet"}`}>
      <div className="tcc-ghost" aria-hidden />
      <div className="tcc-card" data-dealt={dealt} data-face={faceUp && card ? "up" : "down"} data-state={state} data-tone={tone}>
        <div className="tcc-inner">
          <div className="tcc-face tcc-back">
            <CardBack />
          </div>
          <div className="tcc-face tcc-front">{card && <CardFront card={card} />}</div>
        </div>
      </div>
    </div>
  );
}
