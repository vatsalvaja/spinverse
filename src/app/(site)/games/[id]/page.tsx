import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameDetail } from "@/components/console/GameDetail";
import { GAMES } from "@/data/games";

export const dynamicParams = false;

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const game = GAMES.find((g) => g.id === params.id);
  return { title: game?.name ?? "Game details" };
}

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const game = GAMES.find((g) => g.id === params.id);
  if (!game) notFound();
  return <GameDetail id={game.id} />;
}
