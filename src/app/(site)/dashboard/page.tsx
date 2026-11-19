import type { Metadata } from "next";
import { GameLibrary } from "@/components/launcher/GameLibrary";

export const metadata: Metadata = { title: "Games" };

/** The player's lobby: a game launcher. The games are the whole page. */
export default function HomePage() {
  return <GameLibrary view="all" />;
}
