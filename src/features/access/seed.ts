import type { Account, AccessData } from "./types";

const SEED_DATE = "2026-11-01T09:00:00.000Z";

/** Static demo accounts. Everyone starts with 0 coins so the whole flow can be walked through from the Super Admin down. */
export const SEED_ACCOUNTS: Account[] = [
  { id: "SA-001", role: "super_admin", username: "superadmin", password: "Superadmin@123", name: "Super Admin", email: "superadmin@spinverse.test", status: "active", parentId: null, balance: 0, createdAt: SEED_DATE },
  { id: "M-001", role: "master", username: "vatsalvaja03", password: "Master@123", name: "Vatsal Vaja", email: "vatsalvaja03@spinverse.test", status: "active", parentId: null, balance: 0, createdAt: SEED_DATE },
  { id: "M-002", role: "master", username: "master123", password: "Master@123", name: "Master Two", email: "master123@spinverse.test", status: "active", parentId: null, balance: 0, createdAt: SEED_DATE },
  { id: "C-1001", role: "client", username: "client1", password: "Client@123", name: "Client One", email: "client1@spinverse.test", status: "active", parentId: "M-001", balance: 0, createdAt: SEED_DATE },
  { id: "C-1002", role: "client", username: "client2", password: "Client@123", name: "Client Two", email: "client2@spinverse.test", status: "active", parentId: "M-001", balance: 0, createdAt: SEED_DATE },
  { id: "C-1003", role: "client", username: "client3", password: "Client@123", name: "Client Three", email: "client3@spinverse.test", status: "active", parentId: "M-002", balance: 0, createdAt: SEED_DATE },
];

export const seedData = (): AccessData => ({ accounts: SEED_ACCOUNTS.map((a) => ({ ...a })), txs: [] });

/** Shown on the login page so a tester can fill the form with one click. */
export const DEMO_LOGINS = [
  { label: "Super Admin", username: "superadmin", password: "Superadmin@123" },
  { label: "Master 1", username: "vatsalvaja03", password: "Master@123" },
  { label: "Master 2", username: "master123", password: "Master@123" },
  { label: "Client (Master 1)", username: "client1", password: "Client@123" },
  { label: "Client (Master 1)", username: "client2", password: "Client@123" },
  { label: "Client (Master 2)", username: "client3", password: "Client@123" },
];
