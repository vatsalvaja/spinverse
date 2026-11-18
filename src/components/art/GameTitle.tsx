import type { ElementType } from "react";
import type { GameId } from "@/data/types";
import { GAME_BY_ID } from "@/data/games";
import { cn } from "@/lib/utils";
import { WORLD } from "./worlds";

/** The game name in its own typographic treatment. Pass sizing via className (e.g. text-5xl). */
export function GameTitle({ gameId, as: Tag = "h2", className }: { gameId: GameId; as?: ElementType; className?: string }) {
  const name = GAME_BY_ID[gameId].name;
  return <Tag className={cn(WORLD[gameId].titleClass, "leading-[0.95]", gameId === "atlantis-cascade" && "pb-1", className)}>{name}</Tag>;
}
