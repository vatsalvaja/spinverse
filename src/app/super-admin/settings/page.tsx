import type { Metadata } from "next";
import { AdminSettingsView } from "@/components/admin/views/AdminSettingsView";

export const metadata: Metadata = { title: "Platform Settings" };

export default function SuperAdminSettingsPage() {
  return <AdminSettingsView />;
}
