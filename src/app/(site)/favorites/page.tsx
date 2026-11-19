import type { Metadata } from "next";
import { GameLibrary } from "@/components/launcher/GameLibrary";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return <GameLibrary view="favorites" />;
}
