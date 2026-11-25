import type { Metadata } from "next";
import { DeployPage } from "@/features/game-management/admin/pages/DeployPage";

export const metadata: Metadata = { title: "Game Deployment" };

export default function Page() {
  return <DeployPage />;
}
