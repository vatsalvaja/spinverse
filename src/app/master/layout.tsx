"use client";

import { LayoutDashboard, ReceiptText, UsersRound } from "lucide-react";
import { PortalShell } from "@/features/access/ui/PortalShell";

const CFG = {
  role: "master" as const,
  title: "Master console",
  nav: [
    { href: "/master", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/master/clients", label: "Clients", icon: UsersRound },
    { href: "/master/transactions", label: "Transactions", icon: ReceiptText },
  ],
  crumbs: { master: "Master", clients: "Clients", transactions: "Transactions" },
};

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell cfg={CFG}>{children}</PortalShell>;
}
