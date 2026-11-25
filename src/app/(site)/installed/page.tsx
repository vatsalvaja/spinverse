import type { Metadata } from "next";
import InstalledGamesPage from "@/features/game-management/player/pages/InstalledGamesPage";

export const metadata: Metadata = { title: "Installed Games" };

export default function Page() {
  return <InstalledGamesPage />;
}
