"use client";

import { useState, type ReactNode } from "react";
import { Ban, CheckCircle2, Eye, Pencil, PowerOff, Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmModal, UserEditModal } from "@/components/admin/UserDialogs";
import type { MenuItem } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import { useDemoData } from "@/data/provider";
import type { UserRecord } from "@/data/types";

/** Shared edit / activate / deactivate / block / unblock behaviour for the users table and details page. */
export function useUserActions(basePath = "/super-admin"): {
  itemsFor: (u: UserRecord, opts?: { includeView?: boolean }) => MenuItem[];
  dialogs: ReactNode;
  edit: (u: UserRecord) => void;
  setStatusWithToast: (u: UserRecord, status: UserRecord["status"]) => void;
  askBlock: (u: UserRecord) => void;
} {
  const router = useRouter();
  const toast = useToast();
  const { setStatus, getUser } = useDemoData();
  const [editing, setEditing] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<string | null>(null);

  const setStatusWithToast = (u: UserRecord, status: UserRecord["status"]) => {
    setStatus(u.id, status);
    const verb = status === "active" ? (u.status === "blocked" ? "unblocked" : "activated") : status === "blocked" ? "blocked" : "deactivated";
    toast(`${u.name} was ${verb}.`);
  };

  const itemsFor = (u: UserRecord, opts: { includeView?: boolean } = { includeView: true }): MenuItem[] => {
    const items: MenuItem[] = [];
    if (opts.includeView !== false) items.push({ label: "View details", icon: <Eye />, onSelect: () => router.push(`${basePath}/users/${u.id}`) });
    items.push({ label: "Edit profile", icon: <Pencil />, onSelect: () => setEditing(u.id) });
    if (u.status === "blocked") {
      items.push({ label: "Unblock account", icon: <CheckCircle2 />, onSelect: () => setStatusWithToast(u, "active"), divider: true });
    } else {
      items.push(
        u.status === "active"
          ? { label: "Deactivate account", icon: <PowerOff />, onSelect: () => setStatusWithToast(u, "inactive"), divider: true }
          : { label: "Activate account", icon: <Power />, onSelect: () => setStatusWithToast(u, "active"), divider: true },
      );
      items.push({ label: "Block account", icon: <Ban />, tone: "danger", onSelect: () => setBlocking(u.id) });
    }
    return items;
  };

  const blockUser = blocking ? getUser(blocking) : undefined;
  const dialogs = (
    <>
      <UserEditModal user={editing ? getUser(editing) ?? null : null} onClose={() => setEditing(null)} />
      <ConfirmModal
        open={!!blockUser}
        danger
        title={`Block ${blockUser?.name ?? "account"}?`}
        body="Blocked players can’t sign in or play until you unblock them. Their points and history are kept."
        confirmLabel="Block account"
        onConfirm={() => blockUser && setStatusWithToast(blockUser, "blocked")}
        onClose={() => setBlocking(null)}
      />
    </>
  );

  return { itemsFor, dialogs, edit: (u) => setEditing(u.id), setStatusWithToast, askBlock: (u) => setBlocking(u.id) };
}
