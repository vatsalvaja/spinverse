import type { Metadata } from "next";
import { ConfigurationPage } from "@/features/game-management/admin/pages/ConfigurationPage";

export const metadata: Metadata = { title: "Game Configuration" };

export default function Page() {
  return <ConfigurationPage />;
}
