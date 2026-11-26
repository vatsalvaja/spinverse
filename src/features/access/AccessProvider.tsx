"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { seedData } from "./seed";
import { MAX_ALLOCATION, type AccessData, type AccessStatus, type Account, type CoinTx, type Result, type Role } from "./types";

/**
 * Frontend-only role, account and coin store.
 *
 * - The data (accounts, balances, coin transactions) is persisted in localStorage, so it survives refreshes.
 * - Every mutation is applied to a ref first, validated against the *latest* data, then committed to state and
 *   storage. That keeps balances correct even if two actions fire before React re-renders.
 * - Every mutation also re-checks who is acting and which accounts they own. The UI hides what a role can't do,
 *   but the store refuses it regardless.
 */

const DATA_KEY = "sv-access-data-v1";
const AUTH_KEY = "sv-access-auth-v1";

interface AccountInput {
  name: string;
  username: string;
  password: string;
  email: string;
}

interface AccessValue {
  /** False until the browser's saved data has been read. Guards wait for this before redirecting. */
  ready: boolean;
  data: AccessData;
  /** The signed-in account, or null. Inactive accounts never count as signed in. */
  current: Account | null;
  login: (username: string, password: string, remember: boolean) => Result & { account?: Account };
  logout: () => void;

  allocateToMaster: (masterId: string, amount: number, note?: string) => Result;
  createMaster: (input: AccountInput) => Result;
  updateMaster: (id: string, patch: Partial<AccountInput>) => Result;
  setMasterStatus: (id: string, status: AccessStatus) => Result;

  createClient: (input: AccountInput) => Result;
  updateClient: (id: string, patch: Partial<AccountInput>) => Result;
  setClientStatus: (id: string, status: AccessStatus) => Result;
  deleteClient: (id: string) => Result;
  allocateToClient: (clientId: string, amount: number, note?: string) => Result;

  resetDemo: () => Result;
}

const AccessContext = createContext<AccessValue | null>(null);

const fail = (error: string): Result => ({ ok: false, error });
const OK: Result = { ok: true };

function isValidData(v: unknown): v is AccessData {
  if (!v || typeof v !== "object") return false;
  const d = v as AccessData;
  return Array.isArray(d.accounts) && Array.isArray(d.txs) && d.accounts.every((a) => a && typeof a.id === "string" && typeof a.balance === "number" && typeof a.username === "string");
}

function readData(): AccessData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidData(parsed)) return parsed;
    }
  } catch {}
  return seedData();
}

/** Each tab keeps its own sign-in (sessionStorage), so two roles can be open side by side. "Keep me signed in" also saves it for new tabs. */
function readAuth(): string | null {
  try {
    return sessionStorage.getItem(AUTH_KEY) ?? localStorage.getItem(AUTH_KEY);
  } catch {
    return null;
  }
}

function writeAuth(id: string | null, remember: boolean) {
  try {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    if (id) {
      sessionStorage.setItem(AUTH_KEY, id);
      if (remember) localStorage.setItem(AUTH_KEY, id);
    }
  } catch {}
}

function validateIdentity(data: AccessData, input: Partial<AccountInput>, selfId?: string): string | null {
  if (input.name !== undefined && input.name.trim().length < 2) return "Name must be at least 2 characters.";
  if (input.username !== undefined) {
    if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(input.username.trim())) return "Username must be 3–24 characters: letters, numbers, dot, dash or underscore.";
    const taken = data.accounts.some((a) => a.id !== selfId && a.username.toLowerCase() === input.username!.trim().toLowerCase());
    if (taken) return "That username is already taken.";
  }
  if (input.password !== undefined && input.password.length < 6) return "Password must be at least 6 characters.";
  if (input.email && !/^\S+@\S+\.\S+$/.test(input.email.trim())) return "Enter a valid email address or leave it empty.";
  return null;
}

function validateAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) return "Enter a whole number of coins.";
  if (amount <= 0) return "Amount must be greater than zero.";
  if (amount > MAX_ALLOCATION) return `A single allocation can't exceed ${MAX_ALLOCATION.toLocaleString("en-US")} coins.`;
  return null;
}

const nextTxId = (txs: CoinTx[]) => `CT-${100001 + txs.length}`;

export function AccessProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AccessData>(() => seedData());
  const [authId, setAuthId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);
  const authRef = useRef<string | null>(null);

  // Read saved data once on the client; data (not the sign-in) is re-read when another tab changes it.
  useEffect(() => {
    const loadData = () => {
      const d = readData();
      dataRef.current = d;
      setDataState(d);
    };
    loadData();
    const a = readAuth();
    authRef.current = a;
    setAuthId(a);
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === DATA_KEY || e.key === null) loadData();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: AccessData) => {
    dataRef.current = next;
    setDataState(next);
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const currentOf = (d: AccessData): Account | null => {
    const a = authRef.current ? d.accounts.find((x) => x.id === authRef.current) : undefined;
    return a && a.status === "active" ? a : null;
  };
  const current = useMemo(() => {
    const a = authId ? data.accounts.find((x) => x.id === authId) : undefined;
    return a && a.status === "active" ? a : null;
  }, [data, authId]);

  // A saved sign-in that points at a missing or deactivated account is dropped.
  useEffect(() => {
    if (ready && authId && !current) {
      authRef.current = null;
      setAuthId(null);
      writeAuth(null, false);
    }
  }, [ready, authId, current]);

  const login: AccessValue["login"] = useCallback((username, password, remember) => {
    const u = username.trim().toLowerCase();
    if (!u || !password) return fail("Enter your username and password.");
    const account = dataRef.current.accounts.find((a) => a.username.toLowerCase() === u);
    if (!account || account.password !== password) return fail("Incorrect username or password.");
    if (account.status !== "active") return fail("This account is deactivated. Contact your administrator.");
    authRef.current = account.id;
    setAuthId(account.id);
    writeAuth(account.id, remember);
    return { ok: true, account };
  }, []);

  const logout = useCallback(() => {
    authRef.current = null;
    setAuthId(null);
    writeAuth(null, false);
  }, []);

  /** Run a mutation as the signed-in account with the role it requires. */
  const act = useCallback((role: Role, fn: (d: AccessData, me: Account) => Result | { next: AccessData }): Result => {
    const d = dataRef.current;
    const me = currentOf(d);
    if (!me || me.role !== role) return fail("You don't have permission to do that.");
    const out = fn(d, me);
    if ("ok" in out) return out;
    commit(out.next);
    return OK;
  }, [commit]);

  const patchAccount = (d: AccessData, id: string, patch: Partial<Account>): AccessData => ({ ...d, accounts: d.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const tidy = (p: Partial<AccountInput>): Partial<Account> => ({
    ...(p.name !== undefined && { name: p.name.trim() }),
    ...(p.username !== undefined && { username: p.username.trim() }),
    ...(p.password !== undefined && p.password !== "" && { password: p.password }),
    ...(p.email !== undefined && { email: p.email.trim() }),
  });

  /* ---------- Super admin ---------- */

  const allocateToMaster: AccessValue["allocateToMaster"] = useCallback((masterId, amount, note = "") =>
    act("super_admin", (d, me) => {
      const bad = validateAmount(amount);
      if (bad) return fail(bad);
      const master = d.accounts.find((a) => a.id === masterId && a.role === "master");
      if (!master) return fail("Master not found.");
      if (master.status !== "active") return fail("This master is deactivated. Activate the account before allocating coins.");
      const balance = master.balance + amount;
      const tx: CoinTx = {
        id: nextTxId(d.txs), kind: "master_allocation", fromId: me.id, fromName: me.name, toId: master.id, toName: master.name,
        amount, fromBalanceAfter: null, toBalanceAfter: balance, masterId: master.id, note: note.trim(), timestamp: new Date().toISOString(),
      };
      return { next: { ...patchAccount(d, master.id, { balance }), txs: [...d.txs, tx] } };
    }), [act]);

  const createMaster: AccessValue["createMaster"] = useCallback((input) =>
    act("super_admin", (d) => {
      const bad = validateIdentity(d, input);
      if (bad) return fail(bad);
      const n = d.accounts.filter((a) => a.role === "master").length + 1;
      const account: Account = { id: `M-${String(n).padStart(3, "0")}`, role: "master", ...tidyFull(input), status: "active", parentId: null, balance: 0, createdAt: new Date().toISOString() };
      if (d.accounts.some((a) => a.id === account.id)) account.id = `M-${Date.now()}`;
      return { next: { ...d, accounts: [...d.accounts, account] } };
    }), [act]);

  const updateMaster: AccessValue["updateMaster"] = useCallback((id, patch) =>
    act("super_admin", (d) => {
      if (!d.accounts.some((a) => a.id === id && a.role === "master")) return fail("Master not found.");
      const bad = validateIdentity(d, patch, id);
      if (bad) return fail(bad);
      return { next: patchAccount(d, id, tidy(patch)) };
    }), [act]);

  const setMasterStatus: AccessValue["setMasterStatus"] = useCallback((id, status) =>
    act("super_admin", (d) => {
      if (!d.accounts.some((a) => a.id === id && a.role === "master")) return fail("Master not found.");
      return { next: patchAccount(d, id, { status }) };
    }), [act]);

  const resetDemo: AccessValue["resetDemo"] = useCallback(() =>
    act("super_admin", () => ({ next: seedData() })), [act]);

  /* ---------- Master (always scoped to the signed-in master's own clients) ---------- */

  const ownClient = (d: AccessData, me: Account, id: string) => d.accounts.find((a) => a.id === id && a.role === "client" && a.parentId === me.id);

  const createClient: AccessValue["createClient"] = useCallback((input) =>
    act("master", (d, me) => {
      const bad = validateIdentity(d, input);
      if (bad) return fail(bad);
      const max = d.accounts.filter((a) => a.role === "client").reduce((m, a) => Math.max(m, Number(a.id.replace(/\D/g, "")) || 0), 1000);
      const account: Account = { id: `C-${max + 1}`, role: "client", ...tidyFull(input), status: "active", parentId: me.id, balance: 0, createdAt: new Date().toISOString() };
      return { next: { ...d, accounts: [...d.accounts, account] } };
    }), [act]);

  const updateClient: AccessValue["updateClient"] = useCallback((id, patch) =>
    act("master", (d, me) => {
      if (!ownClient(d, me, id)) return fail("Client not found.");
      const bad = validateIdentity(d, patch, id);
      if (bad) return fail(bad);
      return { next: patchAccount(d, id, tidy(patch)) };
    }), [act]);

  const setClientStatus: AccessValue["setClientStatus"] = useCallback((id, status) =>
    act("master", (d, me) => {
      if (!ownClient(d, me, id)) return fail("Client not found.");
      return { next: patchAccount(d, id, { status }) };
    }), [act]);

  const deleteClient: AccessValue["deleteClient"] = useCallback((id) =>
    act("master", (d, me) => {
      const client = ownClient(d, me, id);
      if (!client) return fail("Client not found.");
      let next: AccessData = { ...d, accounts: d.accounts.filter((a) => a.id !== id) };
      // whatever the client still holds goes back to the master, so no coins ever disappear
      if (client.balance > 0) {
        const balance = me.balance + client.balance;
        const tx: CoinTx = {
          id: nextTxId(d.txs), kind: "client_reclaim", fromId: client.id, fromName: client.name, toId: me.id, toName: me.name,
          amount: client.balance, fromBalanceAfter: 0, toBalanceAfter: balance, masterId: me.id, note: "Client account deleted", timestamp: new Date().toISOString(),
        };
        next = { ...patchAccount(next, me.id, { balance }), txs: [...d.txs, tx] };
      }
      return { next };
    }), [act]);

  const allocateToClient: AccessValue["allocateToClient"] = useCallback((clientId, amount, note = "") =>
    act("master", (d, me) => {
      const bad = validateAmount(amount);
      if (bad) return fail(bad);
      const client = ownClient(d, me, clientId);
      if (!client) return fail("Client not found.");
      if (client.status !== "active") return fail("This client is deactivated. Activate the account before allocating coins.");
      if (amount > me.balance) return fail(`Not enough coins. You have ${me.balance.toLocaleString("en-US")} available.`);
      const mine = me.balance - amount;
      const theirs = client.balance + amount;
      const tx: CoinTx = {
        id: nextTxId(d.txs), kind: "client_allocation", fromId: me.id, fromName: me.name, toId: client.id, toName: client.name,
        amount, fromBalanceAfter: mine, toBalanceAfter: theirs, masterId: me.id, note: note.trim(), timestamp: new Date().toISOString(),
      };
      return { next: { ...patchAccount(patchAccount(d, me.id, { balance: mine }), client.id, { balance: theirs }), txs: [...d.txs, tx] } };
    }), [act]);

  const value = useMemo<AccessValue>(
    () => ({ ready, data, current, login, logout, allocateToMaster, createMaster, updateMaster, setMasterStatus, createClient, updateClient, setClientStatus, deleteClient, allocateToClient, resetDemo }),
    [ready, data, current, login, logout, allocateToMaster, createMaster, updateMaster, setMasterStatus, createClient, updateClient, setClientStatus, deleteClient, allocateToClient, resetDemo],
  );
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

function tidyFull(i: AccountInput) {
  return { name: i.name.trim(), username: i.username.trim(), password: i.password, email: i.email.trim() };
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used inside AccessProvider");
  return ctx;
}
