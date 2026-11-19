import type { Metadata } from "next";
import { GameLibrary } from "@/components/launcher/GameLibrary";

export const metadata: Metadata = { title: "Recently played" };

export default function RecentPage() {
  return <GameLibrary view="recent" />;
}
