import type { Metadata } from "next";
import { AddGamePage } from "@/features/game-management/admin/pages/AddGamePage";

export const metadata: Metadata = { title: "Add New Game" };

export default function Page() {
  return <AddGamePage />;
}
