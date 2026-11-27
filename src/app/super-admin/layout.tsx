"use client";

import {
  BarChart3,
  Coins,
  FolderKanban,
  Gamepad2,
  History,
  LayoutDashboard,
  PackageOpen,
  Settings,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { PortalShell, type PortalNavGroup } from "@/features/access/ui/PortalShell";

const GROUPS: PortalNavGroup[] = [
  {
    label: "Platform Management",
    items: [
      { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/super-admin/users", label: "User Management", icon: Users },
      { href: "/super-admin/masters", label: "Master Management", icon: UserCog },
      { href: "/super-admin/clients", label: "Client Management", icon: UserCheck },
      { href: "/super-admin/transactions", label: "Coin & Transactions", icon: Coins },
    ],
  },
  {
    label: "Game Management",
    items: [
      { href: "/super-admin/games", label: "Game Operations", icon: Gamepad2 },
      {
        href: "/super-admin/game-management",
        label: "Game Packages & Versions",
        icon: PackageOpen,
        children: [
          { href: "/super-admin/game-management", label: "Games overview", exact: true },
          { href: "/super-admin/game-management/new", label: "Add new game" },
          { href: "/super-admin/game-management/versions", label: "Versions & rollback" },
          { href: "/super-admin/game-management/configuration", label: "Configuration" },
        ],
      },
      { href: "/super-admin/game-categories", label: "Game Categories", icon: FolderKanban },
    ],
  },
  {
    label: "Reporting & Monitoring",
    items: [
      { href: "/super-admin/analytics", label: "Analytics & Reports", icon: BarChart3, matchPrefixes: ["/super-admin/reports"] },
      { href: "/super-admin/game-history", label: "Game History & RNG Audit", icon: History },
      { href: "/super-admin/audit-logs", label: "Audit Logs", icon: ShieldCheck },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/super-admin/settings", label: "Platform Settings", icon: Settings },
    ],
  },
];

const CFG = {
  role: "super_admin" as const,
  title: "Super Admin",
  groups: GROUPS,
  searchHref: "/super-admin/users",
  crumbs: {
    "super-admin": "Super Admin",
    users: "User Management",
    masters: "Master Management",
    clients: "Client Management",
    transactions: "Coin & Transactions",
    games: "Game Operations",
    "game-management": "Game Packages & Versions",
    new: "Add new game",
    versions: "Versions & rollback",
    configuration: "Configuration",
    "game-categories": "Game Categories",
    analytics: "Analytics",
    reports: "Reports",
    "game-history": "Game History & RNG Audit",
    "audit-logs": "Audit Logs",
    settings: "Platform Settings",
  },
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell cfg={CFG}>{children}</PortalShell>;
}
