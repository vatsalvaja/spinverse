import type { Metadata } from "next";
import { AdminReportsView } from "@/components/admin/views/AdminReportsView";

export const metadata: Metadata = { title: "Reports & Exports" };

export default function SuperAdminReportsPage() {
  return <AdminReportsView basePath="/super-admin" />;
}
