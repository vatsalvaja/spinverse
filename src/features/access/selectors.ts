import type { Transaction } from "@/data/types";
import type { AccessData, Account, CoinTx } from "./types";

export const masters = (d: AccessData) => d.accounts.filter((a) => a.role === "master");
export const clientsOf = (d: AccessData, masterId: string) => d.accounts.filter((a) => a.role === "client" && a.parentId === masterId);
export const allClients = (d: AccessData) => d.accounts.filter((a) => a.role === "client");
export const byId = (d: AccessData, id: string) => d.accounts.find((a) => a.id === id);

export interface MasterStats {
  master: Account;
  clients: number;
  activeClients: number;
  /** Total ever issued to this master by the super admin. */
  received: number;
  /** The master's spendable balance. */
  available: number;
  /** Net coins handed to clients (allocations minus coins returned from deleted clients). */
  distributed: number;
  /** Coins currently sitting in client wallets. */
  heldByClients: number;
}

export function masterStats(d: AccessData, master: Account): MasterStats {
  const mine = clientsOf(d, master.id);
  const received = d.txs.filter((t) => t.kind === "master_allocation" && t.toId === master.id).reduce((s, t) => s + t.amount, 0);
  const given = d.txs.filter((t) => t.kind === "client_allocation" && t.fromId === master.id).reduce((s, t) => s + t.amount, 0);
  const returned = d.txs.filter((t) => t.kind === "client_reclaim" && t.toId === master.id).reduce((s, t) => s + t.amount, 0);
  return {
    master,
    clients: mine.length,
    activeClients: mine.filter((c) => c.status === "active").length,
    received,
    available: master.balance,
    distributed: given - returned,
    heldByClients: mine.reduce((s, c) => s + c.balance, 0),
  };
}

/** Every movement a master is part of: coins in from the super admin, out to clients, and returns. */
export const txsOfMaster = (d: AccessData, masterId: string): CoinTx[] => d.txs.filter((t) => t.masterId === masterId).sort(newestFirst);
export const txsOfAccount = (d: AccessData, id: string): CoinTx[] => d.txs.filter((t) => t.fromId === id || t.toId === id).sort(newestFirst);

export function newestFirst(a: CoinTx, b: CoinTx) {
  return b.timestamp.localeCompare(a.timestamp) || b.id.localeCompare(a.id);
}

/** A client's incoming coin movements, shaped like the player ledger so the Vault page can list them. */
export function clientLedger(d: AccessData, clientId: string): Transaction[] {
  return txsOfAccount(d, clientId)
    .map((t): Transaction => {
      const incoming = t.toId === clientId;
      return {
        id: t.id,
        userId: clientId,
        userName: incoming ? t.toName : t.fromName,
        type: "bonus",
        description: incoming ? `Coins allocated by ${t.fromName}` : `Coins returned to ${t.toName}`,
        credit: incoming ? t.amount : 0,
        debit: incoming ? 0 : t.amount,
        previousBalance: incoming ? t.toBalanceAfter - t.amount : t.amount + (t.fromBalanceAfter ?? 0),
        balanceAfter: incoming ? t.toBalanceAfter : t.fromBalanceAfter ?? 0,
        timestamp: t.timestamp,
        status: "completed",
      };
    });
}
