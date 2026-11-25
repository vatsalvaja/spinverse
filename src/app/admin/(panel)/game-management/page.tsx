import type { Metadata } from "next";
import { OverviewPage } from "@/features/game-management/admin/pages/OverviewPage";

export const metadata: Metadata = { title: "Game Management" };

export default function Page() {
  return <OverviewPage />;
}
