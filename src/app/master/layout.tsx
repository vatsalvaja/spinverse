"use client";

import { Coins, FileBarChart, LayoutDashboard, ReceiptText, UserCircle, UsersRound } from "lucide-react";
import { PortalShell } from "@/features/access/ui/PortalShell";

const CFG = {
  role: "master" as const,
  title: "Master console",
  nav: [
    { href: "/master", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/master/clients", label: "My Clients", icon: UsersRound },
    { href: "/master/coins", label: "Coin Management", icon: Coins },
    { href: "/master/transactions", label: "Transactions", icon: ReceiptText },
    { href: "/master/reports", label: "Reports", icon: FileBarChart },
    { href: "/master/profile", label: "My Profile", icon: UserCircle },
  ],
  crumbs: {
    master: "Master",
    clients: "My Clients",
    coins: "Coin Management",
    transactions: "Transactions",
    reports: "Reports",
    profile: "My Profile",
  },
};

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell cfg={CFG}>{children}</PortalShell>;
}
