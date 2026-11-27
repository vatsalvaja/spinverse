import type { Metadata } from "next";
import { OverviewPage } from "@/features/game-management/admin/pages/OverviewPage";

export const metadata: Metadata = { title: "Game Packages & Versions" };

export default function Page() {
  return <OverviewPage />;
}
