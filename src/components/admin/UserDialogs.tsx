"use client";

import { useEffect, useState } from "react";
import { AButton, AInput, ASelect } from "@/components/admin/ui";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useDemoData } from "@/data/provider";
import type { Membership, UserRecord } from "@/data/types";
import { formatPoints } from "@/lib/utils";

const MEMBERSHIPS: Membership[] = ["Guest", "Bronze", "Silver", "Gold", "Platinum"];

export function UserEditModal({ user, onClose }: { user: UserRecord | null; onClose: () => void }) {
  const { updateUser, users } = useDemoData();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", username: "", email: "", country: "", membership: "Bronze" as Membership });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, username: user.username, email: user.email, country: user.country, membership: user.membership });
      setErrors({});
    }
  }, [user]);

  const save = () => {
    if (!user) return;
    const err: Record<string, string> = {};
    if (form.name.trim().length < 2) err.name = "Name must be at least 2 characters.";
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(form.username)) err.username = "3–24 letters, numbers or underscores.";
    else if (users.some((u) => u.id !== user.id && u.username.toLowerCase() === form.username.toLowerCase())) err.username = "That username is already taken.";
    if (user.accountType === "Registered" && !/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Enter a valid email address.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Enter a valid email address.";
    setErrors(err);
    if (Object.keys(err).length) return;
    updateUser(user.id, { ...form, name: form.name.trim() });
    toast(`Saved changes to ${form.name.trim()}.`);
    onClose();
  };

  return (
    <Modal
      theme="light"
      open={!!user}
      onClose={onClose}
      title="Edit user profile"
      description={user ? `${user.id} · ${user.accountType} account` : undefined}
      footer={<><AButton onClick={onClose}>Cancel</AButton><AButton variant="primary" onClick={save}>Save changes</AButton></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><AInput label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}</div>
        <div><AInput label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />{errors.username && <p className="mt-1 text-xs text-rose-600">{errors.username}</p>}</div>
        <div><AInput label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
        <div className="sm:col-span-2"><AInput label="Email" type="email" value={form.email} placeholder={user?.accountType === "Guest" ? "Guests have no email" : ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}</div>
        <ASelect label="Membership tier" value={form.membership} onChange={(e) => setForm({ ...form, membership: e.target.value as Membership })}>
          {MEMBERSHIPS.map((m) => <option key={m}>{m}</option>)}
        </ASelect>
      </div>
    </Modal>
  );
}

export function ConfirmModal({
  open, title, body, confirmLabel, danger, onConfirm, onClose,
}: { open: boolean; title: string; body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal theme="light" size="sm" open={open} onClose={onClose} title={title} footer={<><AButton onClick={onClose}>Cancel</AButton><AButton variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</AButton></>}>
      <p className="text-sm leading-relaxed text-slate-600">{body}</p>
    </Modal>
  );
}

export function AdjustPointsModal({ user, open, onClose }: { user: UserRecord; open: boolean; onClose: () => void }) {
  const { adjustPoints } = useDemoData();
  const toast = useToast();
  const [mode, setMode] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setMode("credit"); setAmount(""); setReason(""); setError(""); }
  }, [open]);

  const submit = () => {
    const n = Math.floor(Number(amount));
    if (!n || n <= 0) return setError("Enter a points amount greater than zero.");
    if (mode === "debit" && n > user.balance) return setError(`Can’t debit more than the current balance (${formatPoints(user.balance)}).`);
    if (reason.trim().length < 3) return setError("Add a short reason for the audit trail.");
    adjustPoints(user.id, mode === "credit" ? n : -n, reason.trim());
    toast(`${mode === "credit" ? "Credited" : "Debited"} ${formatPoints(n)} points ${mode === "credit" ? "to" : "from"} ${user.name}.`);
    onClose();
  };

  return (
    <Modal theme="light" size="sm" open={open} onClose={onClose} title="Adjust virtual points" description={`${user.name} · balance ${formatPoints(user.balance)} pts`} footer={<><AButton onClick={onClose}>Cancel</AButton><AButton variant="primary" onClick={submit}>Apply adjustment</AButton></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1" role="radiogroup" aria-label="Adjustment type">
          {(["credit", "debit"] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`rounded-md py-1.5 text-sm font-medium capitalize transition ${mode === m ? "bg-white text-slate-900 shadow-panel" : "text-slate-500"}`}>{m} points</button>
          ))}
        </div>
        <AInput label="Points" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" />
        <AInput label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Support credit for failed reward" hint="Shown in the transaction history as an admin adjustment." />
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      </div>
    </Modal>
  );
}
