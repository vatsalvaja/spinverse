import type { Metadata } from "next";
import { GAME_BY_ID } from "@/data/games";
import { GameHost } from "@/features/game-runtime/GameHost";

/** One route for every game. The game is loaded from its package; nothing here is specific to any game. */
export function generateMetadata({ params }: { params: { gameId: string } }): Metadata {
  const game = (GAME_BY_ID as Record<string, { name: string } | undefined>)[params.gameId];
  return { title: game?.name ?? "Play" };
}

export default function PlayPage({ params }: { params: { gameId: string } }) {
  return <GameHost gameId={params.gameId} />;
}
