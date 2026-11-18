"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { computeStats, SEED_TRANSACTIONS, SEED_USERS } from "./mock";
import type { AccountStatus, Transaction, UserRecord } from "./types";
import { NOW } from "@/lib/utils";

interface DataContextValue {
  users: UserRecord[];
  transactions: Transaction[];
  getUser: (id: string) => UserRecord | undefined;
  transactionsFor: (id: string) => Transaction[];
  updateUser: (id: string, patch: Partial<Pick<UserRecord, "name" | "username" | "email" | "country" | "membership">>) => void;
  setStatus: (id: string, status: AccountStatus) => void;
  adjustPoints: (id: string, amount: number, reason: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function withStats(user: UserRecord, txs: Transaction[]): UserRecord {
  return { ...user, ...computeStats(txs.filter((t) => t.userId === user.id)) };
}

/** Frontend-only state: edits live in memory and reset on refresh. */
export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserRecord[]>(SEED_USERS);
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);

  const getUser = useCallback((id: string) => users.find((u) => u.id === id), [users]);
  const transactionsFor = useCallback(
    (id: string) => transactions.filter((t) => t.userId === id).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [transactions],
  );

  const updateUser: DataContextValue["updateUser"] = useCallback((id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    if (patch.name) {
      setTransactions((prev) => prev.map((t) => (t.userId === id ? { ...t, userName: patch.name! } : t)));
    }
  }, []);

  const setStatus = useCallback((id: string, status: AccountStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  }, []);

  const adjustPoints = useCallback(
    (id: string, amount: number, reason: string) => {
      const user = users.find((u) => u.id === id);
      if (!user || amount === 0) return;
      const mine = transactions.filter((t) => t.userId === id);
      const prevBalance = computeStats(mine).balance;
      const debit = amount < 0 ? Math.min(-amount, prevBalance) : 0;
      const credit = amount > 0 ? amount : 0;
      const nextNumber = 100001 + transactions.length;
      const tx: Transaction = {
        id: `TX-${nextNumber}`,
        userId: id,
        userName: user.name,
        type: "adjustment",
        description: `${reason || "Manual adjustment"} · by admin`,
        credit,
        debit,
        previousBalance: prevBalance,
        balanceAfter: prevBalance + credit - debit,
        timestamp: NOW.toISOString(),
        status: "completed",
      };
      const nextTxs = [...transactions, tx];
      setTransactions(nextTxs);
      setUsers((prev) => prev.map((u) => (u.id === id ? withStats(u, nextTxs) : u)));
    },
    [users, transactions],
  );

  const value = useMemo(
    () => ({ users, transactions, getUser, transactionsFor, updateUser, setStatus, adjustPoints }),
    [users, transactions, getUser, transactionsFor, updateUser, setStatus, adjustPoints],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDemoData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDemoData must be used inside DemoDataProvider");
  return ctx;
}
