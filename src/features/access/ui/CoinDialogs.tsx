"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AButton, AInput } from "@/components/admin/ui";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatPoints } from "@/lib/utils";
import { useAccess } from "../AccessProvider";
import { MAX_ALLOCATION, ROLE_LABEL, type Account } from "../types";

const QUICK = [1000, 5000, 10000, 20000];

/**
 * Allocate coins to a master (as the super admin, no limit) or to a client (as a master, limited to the master's
 * available balance). The store re-checks everything; this dialog just explains it before the click.
 */
export function AllocateCoinsModal({ target, onClose }: { target: Account | null; onClose: () => void }) {
  const { current, data, allocateToMaster, allocateToClient } = useAccess();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (target) {
      setAmount("");
      setNote("");
      setError("");
    }
  }, [target]);

  // always read the live account so balances in the dialog never go stale
  const live = target ? data.accounts.find((a) => a.id === target.id) ?? target : null;
  const fromMaster = target?.role === "client";
  const available = fromMaster ? current?.balance ?? 0 : Infinity;
  const n = amount.trim() === "" ? NaN : Number(amount);
  const valid = Number.isInteger(n) && n > 0 && n <= MAX_ALLOCATION;
  const over = valid && n > available;

  const inline = !amount.trim() ? "" : !valid ? "Enter a whole number of coins greater than zero." : over ? `You only have ${formatPoints(available)} coins available.` : "";

  const submit = () => {
    if (!live) return;
    if (!valid) return setError("Enter a whole number of coins greater than zero.");
    if (over) return setError(`You only have ${formatPoints(available)} coins available.`);
    const res = fromMaster ? allocateToClient(live.id, n, note) : allocateToMaster(live.id, n, note);
    if (!res.ok) return setError(res.error);
    toast(`Allocated ${formatPoints(n)} coins to ${live.name}.`);
    onClose();
  };

  return (
    <Modal
      theme="light"
      size="sm"
      open={!!target}
      onClose={onClose}
      title={`Allocate coins to ${ROLE_LABEL[target?.role ?? "master"].toLowerCase()}`}
      description={live ? `${live.name} · @${live.username}` : undefined}
      footer={<><AButton onClick={onClose}>Cancel</AButton><AButton variant="gold" onClick={submit} disabled={!valid || over}>Allocate coins</AButton></>}
    >
      {live && (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
              <dt className="text-xs text-slate-500">{live.name.split(" ")[0]}’s balance</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{formatPoints(live.balance)}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
              <dt className="text-xs text-slate-500">{fromMaster ? "Your available coins" : "Issuing as"}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{fromMaster ? formatPoints(available) : "Super Admin"}</dd>
            </div>
          </dl>

          <div>
            <AInput label="Coins to allocate" type="number" inputMode="numeric" min={1} step={1} value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} placeholder="e.g. 5000" autoFocus />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.filter((q) => q <= available).map((q) => (
                <button key={q} type="button" onClick={() => { setAmount(String(q)); setError(""); }} className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">+{formatPoints(q)}</button>
              ))}
              {fromMaster && available > 0 && (
                <button type="button" onClick={() => { setAmount(String(available)); setError(""); }} className="rounded-md px-2 py-1 text-xs font-medium text-gold-700 ring-1 ring-gold-500/40 hover:bg-gold-50">All ({formatPoints(available)})</button>
              )}
            </div>
          </div>

          <AInput label="Note (optional)" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Weekly top-up" />

          {valid && !over && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800 ring-1 ring-emerald-600/15">
              {live.name} will have <b className="tabular-nums">{formatPoints(live.balance + n)}</b> coins{fromMaster && <> and you’ll have <b className="tabular-nums">{formatPoints(available - n)}</b> left</>}.
            </p>
          )}
          {(error || inline) && <p role="alert" className="text-xs text-rose-600">{error || inline}</p>}
        </div>
      )}
    </Modal>
  );
}

/** Create or edit a master (super admin) or client (master). Credentials are part of the form. */
export function AccountFormModal({ open, role, account, onClose }: { open: boolean; role: "master" | "client"; account?: Account | null; onClose: () => void }) {
  const { createMaster, createClient, updateMaster, updateClient } = useAccess();
  const toast = useToast();
  const editing = !!account;
  const [form, setForm] = useState({ name: "", username: "", password: "", email: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(account ? { name: account.name, username: account.username, password: account.password, email: account.email } : { name: "", username: "", password: "", email: "" });
      setShow(false);
      setError("");
    }
  }, [open, account]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setError("");
  };

  const submit = () => {
    const res = account
      ? (role === "master" ? updateMaster : updateClient)(account.id, form)
      : (role === "master" ? createMaster : createClient)(form);
    if (!res.ok) return setError(res.error);
    toast(editing ? `Saved changes to ${form.name.trim()}.` : `${ROLE_LABEL[role]} ${form.name.trim()} created. They can log in with @${form.username.trim()}.`);
    onClose();
  };

  return (
    <Modal
      theme="light"
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${role}` : `Create ${role}`}
      description={editing ? `${account!.id}` : `Sets up the ${role}’s login credentials.`}
      footer={<><AButton onClick={onClose}>Cancel</AButton><AButton variant="primary" onClick={submit}>{editing ? "Save changes" : `Create ${role}`}</AButton></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2"><AInput label="Full name" value={form.name} onChange={set("name")} autoComplete="off" /></div>
        <AInput label="Username" value={form.username} onChange={set("username")} autoComplete="off" autoCapitalize="none" spellCheck={false} hint="Used to log in." />
        <div className="flex flex-col gap-1 text-[13px] font-medium text-slate-600">
          <label>
            Password
            <div className="relative mt-1">
              <input
                type={show ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm font-normal text-slate-800 transition hover:border-slate-400 focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-400/30"
              />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <span className="text-xs font-normal text-slate-400">At least 6 characters.</span>
        </div>
        <div className="sm:col-span-2"><AInput label="Email (optional)" type="email" value={form.email} onChange={set("email")} autoComplete="off" /></div>
        {error && <p role="alert" className="text-xs text-rose-600 sm:col-span-2">{error}</p>}
        <button type="submit" className="sr-only">Submit</button>
      </form>
    </Modal>
  );
}
