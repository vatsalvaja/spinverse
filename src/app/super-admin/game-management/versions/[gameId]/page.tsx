import type { Metadata } from "next";
import { VersionManagementPage } from "@/features/game-management/admin/pages/VersionManagementPage";

export const metadata: Metadata = { title: "Version Management" };

export default function Page() {
  return <VersionManagementPage />;
}
