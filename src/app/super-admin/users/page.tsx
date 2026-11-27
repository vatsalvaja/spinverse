import type { Metadata } from "next";
import { AdminUsersView } from "@/components/admin/views/AdminUsersView";

export const metadata: Metadata = { title: "User Management" };

export default function SuperAdminUsersPage() {
  return <AdminUsersView basePath="/super-admin" />;
}
