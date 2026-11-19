export type GameId = "pharaohs-fortune" | "atlantis-cascade" | "neon-overdrive" | "skyfall" | "tiger-clash";

export type AccountType = "Guest" | "Registered";
export type AccountStatus = "active" | "inactive" | "blocked";
export type Membership = "Guest" | "Bronze" | "Silver" | "Gold" | "Platinum";

export type TxType = "earned" | "spent" | "reward" | "bonus" | "adjustment";
export type TxStatus = "completed" | "pending" | "failed";

export interface UserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  accountType: AccountType;
  status: AccountStatus;
  membership: Membership;
  country: string;
  dob: string;
  registeredAt: string;
  lastActive: string;
  lastLogin: string;
  favoriteGame: GameId;
  // Derived from the transaction ledger – kept in sync by the data provider
  balance: number;
  totalEarned: number;
  totalSpent: number;
  gamesPlayed: number;
  totalSpins: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: TxType;
  description: string;
  credit: number;
  debit: number;
  previousBalance: number;
  balanceAfter: number;
  timestamp: string;
  status: TxStatus;
  game?: GameId;
  spins?: number;
  sessionId?: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  kind: "game" | "reward" | "bonus" | "register" | "adjustment";
}

export interface RecentGame {
  sessionId: string;
  game: GameId;
  spins: number;
  spent: number;
  returned: number;
  timestamp: string;
}

export const TX_TYPE_LABEL: Record<TxType, string> = {
  earned: "Points earned",
  spent: "Points spent",
  reward: "Reward",
  bonus: "Bonus points",
  adjustment: "Admin adjustment",
};
