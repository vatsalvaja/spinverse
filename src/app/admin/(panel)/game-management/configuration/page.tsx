import type { Metadata } from "next";
import { GameListPage } from "@/features/game-management/admin/pages/GameListPage";

export const metadata: Metadata = { title: "Game Configuration" };

export default function Page() {
  return <GameListPage mode="configuration" />;
}
