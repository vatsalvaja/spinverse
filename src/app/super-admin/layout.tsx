"use client";

import { LayoutDashboard, ReceiptText, Users } from "lucide-react";
import { PortalShell } from "@/features/access/ui/PortalShell";

const CFG = {
  role: "super_admin" as const,
  title: "Super Admin",
  nav: [
    { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/super-admin/masters", label: "Masters", icon: Users },
    { href: "/super-admin/transactions", label: "Transactions", icon: ReceiptText },
  ],
  extra: { href: "/admin", label: "Operations console" },
  crumbs: { "super-admin": "Super Admin", masters: "Masters", transactions: "Transactions" },
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell cfg={CFG}>{children}</PortalShell>;
}
