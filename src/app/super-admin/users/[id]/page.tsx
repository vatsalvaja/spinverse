import type { Metadata } from "next";
import { AdminUserDetailView } from "@/components/admin/views/AdminUserDetailView";

export const metadata: Metadata = { title: "User Details" };

export default function SuperAdminUserDetailPage() {
  return <AdminUserDetailView basePath="/super-admin" />;
}
