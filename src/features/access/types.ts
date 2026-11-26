export type Role = "super_admin" | "master" | "client";
export type AccessStatus = "active" | "inactive";

/** One demo login. Frontend-only: passwords live in the browser's storage, never on a server. */
export interface Account {
  id: string;
  role: Role;
  username: string;
  password: string;
  name: string;
  email: string;
  status: AccessStatus;
  /** Clients only: the master that owns this client. */
  parentId: string | null;
  /** Coin balance. Unused (always 0) for the super admin, who issues coins without limit. */
  balance: number;
  createdAt: string;
}

export type CoinTxKind =
  | "master_allocation" // super admin -> master
  | "client_allocation" // master -> client
  | "client_reclaim"; // client -> master (a deleted client's remaining coins go back)

export interface CoinTx {
  id: string;
  kind: CoinTxKind;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  /** Sender balance after the move. null for the super admin (unlimited issuer). */
  fromBalanceAfter: number | null;
  toBalanceAfter: number;
  /** The master this movement belongs to (the receiver of a master allocation, otherwise the master on either side). */
  masterId: string;
  note: string;
  timestamp: string;
}

export interface AccessData {
  accounts: Account[];
  txs: CoinTx[];
}

export type Result = { ok: true } | { ok: false; error: string };

export const ROLE_LABEL: Record<Role, string> = { super_admin: "Super Admin", master: "Master", client: "Client" };
export const ROLE_HOME: Record<Role, string> = { super_admin: "/super-admin", master: "/master", client: "/dashboard" };

export const TX_KIND_LABEL: Record<CoinTxKind, string> = {
  master_allocation: "Allocation to master",
  client_allocation: "Allocation to client",
  client_reclaim: "Coins returned",
};

export const MAX_ALLOCATION = 1_000_000_000;
