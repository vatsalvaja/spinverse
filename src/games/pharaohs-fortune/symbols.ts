export type SymbolId = "pharaoh" | "scarab" | "anubis" | "horus" | "sphinx" | "temple" | "coin" | "jewel";
export type SymbolRole = "wild" | "scatter" | "high" | "low";

export interface SymbolMeta {
  id: SymbolId;
  name: string;
  role: SymbolRole;
  /** Soft backdrop colour behind the symbol in its cell. */
  tint: string;
  note: string;
}

export const SYMBOLS: Record<SymbolId, SymbolMeta> = {
  pharaoh: { id: "pharaoh", name: "Pharaoh", role: "wild", tint: "rgba(255,196,80,.28)", note: "Wild. Substitutes for every symbol except the Scarab." },
  scarab: { id: "scarab", name: "Golden Scarab", role: "scatter", tint: "rgba(60,230,210,.26)", note: "Scatter. Three or more anywhere open the bonus chamber." },
  anubis: { id: "anubis", name: "Anubis", role: "high", tint: "rgba(120,100,255,.22)", note: "Guardian of the tomb. Top-tier symbol." },
  horus: { id: "horus", name: "Eye of Horus", role: "high", tint: "rgba(70,120,255,.24)", note: "The all-seeing eye. Top-tier symbol." },
  sphinx: { id: "sphinx", name: "Golden Sphinx", role: "high", tint: "rgba(255,190,80,.22)", note: "Keeper of riddles. Top-tier symbol." },
  temple: { id: "temple", name: "Ancient Temple", role: "low", tint: "rgba(230,170,90,.2)", note: "Low-tier symbol." },
  coin: { id: "coin", name: "Golden Coin", role: "low", tint: "rgba(255,200,70,.22)", note: "Low-tier symbol." },
  jewel: { id: "jewel", name: "Ancient Jewel", role: "low", tint: "rgba(255,80,110,.22)", note: "Low-tier symbol." },
};

export const SYMBOL_IDS = Object.keys(SYMBOLS) as SymbolId[];

/** Symbols that flicker past while a reel is spinning. Purely cosmetic. */
export const FILLER_POOL: SymbolId[] = ["anubis", "horus", "sphinx", "temple", "temple", "coin", "coin", "jewel", "jewel", "pharaoh", "scarab"];
