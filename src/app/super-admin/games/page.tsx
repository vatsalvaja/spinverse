import type { Metadata } from "next";
import { AdminGamesView } from "@/components/admin/views/AdminGamesView";

export const metadata: Metadata = { title: "Game Operations" };

export default function SuperAdminGamesPage() {
  return <AdminGamesView gmBase="/super-admin/game-management" />;
}
