import { SEED_ACCOUNTS, seedData } from "./seed";
import type { AccessData } from "./types";

export const DATA_KEY = "sv-access-data-v1";

/** Shape check for what was saved in the browser. Anything that fails it is treated as "nothing saved". */
export function isValidData(v: unknown): v is AccessData {
  if (!v || typeof v !== "object") return false;
  const d = v as AccessData;
  return (
    Array.isArray(d.accounts) &&
    Array.isArray(d.txs) &&
    d.accounts.every((a) => a && typeof a.id === "string" && typeof a.role === "string" && typeof a.username === "string" && typeof a.balance === "number")
  );
}

/**
 * Makes saved data safe to use, without ever touching what is already there:
 *  - no accounts at all  -> the full demo seed (an empty list can't sign anyone in, and any coin history it had refers to nobody);
 *  - some accounts       -> any built-in Super Admin or Master that is missing is added back (they can't be deleted in the app,
 *                           so a missing one means the save is incomplete). Existing accounts, balances, client ownership and
 *                           coin history are left exactly as they are, and demo clients a master deleted stay deleted.
 */
export function repairAccessData(stored: AccessData): { data: AccessData; changed: boolean } {
  if (stored.accounts.length === 0) return { data: seedData(), changed: true };

  const ids = new Set(stored.accounts.map((a) => a.id));
  const usernames = new Set(stored.accounts.map((a) => a.username.toLowerCase()));
  const missing = SEED_ACCOUNTS.filter((a) => a.role !== "client" && !ids.has(a.id) && !usernames.has(a.username.toLowerCase()));
  if (missing.length === 0) return { data: stored, changed: false };
  return { data: { ...stored, accounts: [...stored.accounts, ...missing.map((a) => ({ ...a }))] }, changed: true };
}

export function saveAccessData(data: AccessData): void {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch {}
}

/**
 * The accounts and coin data for this browser: what was saved (repaired if needed), or the demo seed.
 * With `persist` the result is also written back, so the store exists from the very first visit instead of only after
 * the first change. Pass `persist: false` when reacting to another tab's change, so tabs never write over each other.
 */
export function loadAccessData(persist: boolean): AccessData {
  let stored: AccessData | null = null;
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidData(parsed)) stored = parsed;
    }
  } catch {}

  if (!stored) {
    const seed = seedData();
    if (persist) saveAccessData(seed);
    return seed;
  }
  const { data, changed } = repairAccessData(stored);
  if (changed && persist) saveAccessData(data);
  return data;
}
