import { NOW, createRng } from "@/lib/utils";
import { GAMES } from "./games";
import type {
  AccountStatus,
  AccountType,
  GameId,
  Membership,
  Transaction,
  TxStatus,
  UserRecord,
} from "./types";

/**
 * Deterministic mock ledger.
 * Every user's balance, totals and games-played figures are *derived* from the
 * transactions generated below, so the user table, user details, dashboards and
 * global transaction history can never disagree with each other.
 */

type Seed = [
  number, // numeric id suffix
  string, // name
  string, // username
  string, // email ("" for guests)
  AccountType,
  string, // registered date
  AccountStatus,
  number, // minutes since last active
  Membership,
  string, // country
];

const SEEDS: Seed[] = [
  [1001, "Aurelia Voss", "aurelia_v", "aurelia.voss@mailbox.test", "Registered", "2026-01-14", "active", 12, "Platinum", "United Kingdom"],
  [1002, "Marcus Okafor", "marcus_ok", "marcus.okafor@mailbox.test", "Registered", "2026-02-03", "active", 95, "Gold", "Nigeria"],
  [1003, "Priya Raman", "priyaspins", "priya.raman@mailbox.test", "Registered", "2026-02-19", "active", 340, "Gold", "India"],
  [1004, "Lucas Moreau", "lucasm", "lucas.moreau@mailbox.test", "Registered", "2026-03-02", "active", 1500, "Silver", "France"],
  [1005, "Sofia Lindqvist", "sofi_lq", "sofia.lindqvist@mailbox.test", "Registered", "2026-03-11", "active", 40, "Gold", "Sweden"],
  [1006, "Hiroshi Tanabe", "hiro_t", "hiroshi.tanabe@mailbox.test", "Registered", "2026-03-28", "inactive", 21000, "Silver", "Japan"],
  [1007, "Camila Duarte", "cami_d", "camila.duarte@mailbox.test", "Registered", "2026-04-05", "active", 220, "Silver", "Brazil"],
  [1008, "Elias Hartmann", "eliash", "elias.hartmann@mailbox.test", "Registered", "2026-04-16", "blocked", 30000, "Bronze", "Germany"],
  [1009, "Zainab Qureshi", "zainabq", "zainab.qureshi@mailbox.test", "Registered", "2026-04-29", "active", 8, "Platinum", "United Arab Emirates"],
  [1010, "Daniel Whitaker", "dan_whit", "daniel.whitaker@mailbox.test", "Registered", "2026-05-07", "active", 600, "Silver", "United States"],
  [1011, "Ingrid Solberg", "ingrid_s", "ingrid.solberg@mailbox.test", "Registered", "2026-05-20", "active", 2700, "Bronze", "Norway"],
  [1012, "Mateo Fernández", "mateo_f", "mateo.fernandez@mailbox.test", "Registered", "2026-06-02", "active", 130, "Gold", "Spain"],
  [1013, "Amara Mensah", "amara_m", "amara.mensah@mailbox.test", "Registered", "2026-06-14", "inactive", 18000, "Bronze", "Ghana"],
  [1014, "Oliver Chen", "oliverc", "oliver.chen@mailbox.test", "Registered", "2026-06-25", "active", 55, "Silver", "Canada"],
  [1015, "Freya Madsen", "freyam", "freya.madsen@mailbox.test", "Registered", "2026-07-08", "active", 410, "Bronze", "Denmark"],
  [1016, "Rafael Santos", "rafa_s", "rafael.santos@mailbox.test", "Registered", "2026-07-19", "active", 70, "Silver", "Portugal"],
  [1017, "Nadia Petrova", "nadiap", "nadia.petrova@mailbox.test", "Registered", "2026-08-01", "active", 900, "Bronze", "Poland"],
  [1018, "Kenji Watanabe", "kenji_w", "kenji.watanabe@mailbox.test", "Registered", "2026-08-13", "blocked", 12000, "Bronze", "Japan"],
  [1019, "Layla Haddad", "layla_h", "layla.haddad@mailbox.test", "Registered", "2026-09-02", "active", 25, "Silver", "Lebanon"],
  [1020, "Thomas Becker", "tbecker", "thomas.becker@mailbox.test", "Registered", "2026-09-21", "active", 1800, "Bronze", "Austria"],
  [1021, "Isabella Rossi", "bella_r", "isabella.rossi@mailbox.test", "Registered", "2026-10-06", "active", 15, "Bronze", "Italy"],
  [1022, "Noah Patterson", "noah_p", "noah.patterson@mailbox.test", "Registered", "2026-10-24", "active", 180, "Bronze", "Australia"],
  [1023, "Guest 4821", "guest_4821", "", "Guest", "2026-05-30", "active", 3000, "Guest", "United States"],
  [1024, "Guest 7710", "guest_7710", "", "Guest", "2026-07-27", "active", 480, "Guest", "Canada"],
  [1025, "Guest 2039", "guest_2039", "", "Guest", "2026-09-10", "inactive", 26000, "Guest", "Germany"],
  [1026, "Guest 5518", "guest_5518", "", "Guest", "2026-10-12", "active", 75, "Guest", "United Kingdom"],
  [1027, "Guest 9902", "guest_9902", "", "Guest", "2026-11-04", "active", 20, "Guest", "India"],
  [1028, "Guest 3367", "guest_3367", "", "Guest", "2026-11-14", "blocked", 400, "Guest", "Brazil"],
];

const GAME_IDS: GameId[] = GAMES.map((g) => g.id);
const GAME_NAME: Record<GameId, string> = Object.fromEntries(GAMES.map((g) => [g.id, g.name])) as Record<GameId, string>;

const REWARD_TEXT = [
  "Daily login reward",
  "Mission complete: Spin 25 times",
  "Mission complete: Try a new game",
  "Weekly streak reward",
  "Mission complete: Collect 3 symbols",
  "Achievement unlocked reward",
];
const BONUS_TEXT = ["Weekend boost bonus", "Level-up bonus", "Loyalty bonus", "Streak bonus", "Spin-fest bonus"];
const ADJUST_UP = ["Support credit applied", "Event compensation", "Promotional top-up"];
const ADJUST_DOWN = ["Duplicate reward correction", "Balance correction", "Test credit removal"];

const MIN = 60_000;

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)];
}

interface RawTx extends Omit<Transaction, "id"> {}

function generateForUser(seed: Seed): { user: UserRecord; txs: RawTx[] } {
  const [num, name, username, email, accountType, reg, status, minsAgo, membership, country] = seed;
  const rng = createRng(num * 7919);
  const id = `SV-${num}`;
  const isGuest = accountType === "Guest";

  const lastActiveMs = NOW.getTime() - minsAgo * MIN;
  const regMs = new Date(`${reg}T0${Math.floor(rng() * 9)}:${String(Math.floor(rng() * 6) * 10).padStart(2, "0")}:00Z`).getTime();
  const spanDays = Math.max(1, (lastActiveMs - regMs) / 86_400_000);

  const luck = 0.72 + rng() * 0.7;
  const favored = pick(rng, GAME_IDS);
  const sessionCount = isGuest
    ? Math.min(12, Math.max(3, Math.round(spanDays * 0.18) + Math.floor(rng() * 4)))
    : Math.min(58, Math.max(8, Math.round(spanDays * (0.1 + rng() * 0.26)) + Math.floor(rng() * 8)));
  const extras = Math.round(sessionCount * (isGuest ? 0.3 : 0.55));

  // Unique 10-minute slots so no two events share a timestamp.
  const slotStart = Math.ceil((regMs + 60 * MIN) / (10 * MIN));
  const slotEnd = Math.floor((lastActiveMs - 5 * MIN) / (10 * MIN));
  const slots = new Set<number>();
  const want = Math.min(sessionCount + extras, Math.max(0, slotEnd - slotStart - 1));
  let guard = 0;
  while (slots.size < want && guard++ < 5000) {
    slots.add(slotStart + Math.floor(rng() * (slotEnd - slotStart)));
  }
  const ordered = Array.from(slots).sort((a, b) => a - b);

  const txs: RawTx[] = [];
  let balance = 0;

  const push = (t: Omit<RawTx, "userId" | "userName" | "previousBalance" | "balanceAfter">) => {
    const previousBalance = balance;
    if (t.status === "completed") balance = balance + t.credit - t.debit;
    txs.push({ ...t, userId: id, userName: name, previousBalance, balanceAfter: balance });
  };

  push({
    type: bonusTypeFor(isGuest),
    description: isGuest ? "Guest starter points" : "Welcome bonus",
    credit: isGuest ? 2000 : 5000,
    debit: 0,
    timestamp: new Date(regMs).toISOString(),
    status: "completed",
  });

  let sessionIdx = 0;
  const sessionBudget = sessionCount;
  ordered.forEach((slot, i) => {
    const t = slot * 10 * MIN;
    const iso = new Date(t).toISOString();
    const recent = NOW.getTime() - t < 3 * 60 * MIN;
    const roll = rng();
    const wantsSession = sessionIdx < sessionBudget && roll < 0.66;

    if (wantsSession && balance >= 40) {
      const game = rng() < 0.45 ? favored : pick(rng, GAME_IDS);
      const costPerSpin = pick(rng, [5, 10, 10, 20, 25]);
      const spins = 10 + Math.floor(rng() * 50);
      const spent = Math.min(balance, spins * costPerSpin);
      const realSpins = Math.max(1, Math.floor(spent / costPerSpin));
      const sessionId = `${id}-S${++sessionIdx}`;
      push({
        type: "spent",
        description: `${realSpins} spins · ${GAME_NAME[game]}`,
        credit: 0,
        debit: spent,
        timestamp: iso,
        status: "completed",
        game,
        spins: realSpins,
        sessionId,
      });
      if (rng() < 0.88) {
        const payout = Math.round((spent * (0.25 + rng() * 2.0) * luck) / 5) * 5;
        if (payout > 0) {
          push({
            type: "earned",
            description: `Spin payout · ${GAME_NAME[game]}`,
            credit: payout,
            debit: 0,
            timestamp: new Date(t + 4 * MIN).toISOString(),
            status: "completed",
            game,
            sessionId,
          });
        }
      }
      return;
    }

    const kind = rng();
    if (kind < 0.55 || balance < 40) {
      const status: TxStatus = recent ? "pending" : rng() < 0.04 ? "failed" : "completed";
      push({
        type: "reward",
        description: pick(rng, REWARD_TEXT),
        credit: 250 + Math.floor(rng() * 12) * 100,
        debit: 0,
        timestamp: iso,
        status,
      });
    } else if (kind < 0.85) {
      push({
        type: "bonus",
        description: pick(rng, BONUS_TEXT),
        credit: 500 + Math.floor(rng() * 10) * 250,
        debit: 0,
        timestamp: iso,
        status: "completed",
      });
    } else if (!isGuest || i % 4 === 0) {
      const up = rng() < 0.7 || balance < 1500;
      const amt = (1 + Math.floor(rng() * 6)) * 250;
      push({
        type: "adjustment",
        description: `${up ? pick(rng, ADJUST_UP) : pick(rng, ADJUST_DOWN)} · by admin`,
        credit: up ? amt : 0,
        debit: up ? 0 : Math.min(amt, balance),
        timestamp: iso,
        status: "completed",
      });
    }
  });

  const dobYear = 1978 + Math.floor(rng() * 26);
  const dob = `${dobYear}-${String(1 + Math.floor(rng() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rng() * 28)).padStart(2, "0")}`;

  const user: UserRecord = {
    id,
    name,
    username,
    email,
    accountType,
    status,
    membership,
    country,
    dob,
    registeredAt: new Date(regMs).toISOString(),
    lastActive: new Date(lastActiveMs).toISOString(),
    lastLogin: new Date(lastActiveMs - Math.floor(rng() * 90) * MIN).toISOString(),
    favoriteGame: favored,
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    gamesPlayed: 0,
    totalSpins: 0,
  };
  return { user, txs };
}

function bonusTypeFor(_isGuest: boolean) {
  return "bonus" as const;
}

/** Recompute every derived figure for one user from their ledger. */
export function computeStats(txs: Transaction[]) {
  const done = txs.filter((t) => t.status === "completed");
  const totalEarned = done.reduce((s, t) => s + t.credit, 0);
  const totalSpent = done.reduce((s, t) => s + t.debit, 0);
  const sessions = done.filter((t) => t.type === "spent");
  return {
    balance: totalEarned - totalSpent,
    totalEarned,
    totalSpent,
    gamesPlayed: sessions.length,
    totalSpins: sessions.reduce((s, t) => s + (t.spins ?? 0), 0),
  };
}

function build() {
  const generated = SEEDS.map(generateForUser);
  const all: RawTx[] = generated.flatMap((g) => g.txs);
  all.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.userId.localeCompare(b.userId));
  const transactions: Transaction[] = all.map((t, i) => ({ ...t, id: `TX-${100001 + i}` }));

  const users: UserRecord[] = generated.map(({ user }) => {
    const mine = transactions.filter((t) => t.userId === user.id);
    return { ...user, ...computeStats(mine) };
  });
  return { users, transactions };
}

const built = build();

export const SEED_USERS: UserRecord[] = built.users;
export const SEED_TRANSACTIONS: Transaction[] = built.transactions;

/** The player-facing demo session is always this registered account. */
export const DEMO_USER_ID = "SV-1001";
