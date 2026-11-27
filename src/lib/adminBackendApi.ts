"use client";

/**
 * Optional client for the NestJS backend (`/api/v1`).
 *
 * The SpinVerse frontend runs in standalone demo/localStorage mode by default unless
 * `NEXT_PUBLIC_API_URL` is configured or an operator specifies a backend URL + JWT access
 * token in Super Admin -> Platform Settings (stored in sessionStorage only, never altering login).
 */

const SESSION_CFG_KEY = "sv-admin-backend-cfg-v1";

export interface BackendConnectionConfig {
  baseUrl: string;
  token: string;
}

export function getBackendConfig(): BackendConnectionConfig {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");
  if (typeof window === "undefined") return { baseUrl: envUrl, token: "" };
  try {
    const raw = sessionStorage.getItem(SESSION_CFG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BackendConnectionConfig>;
      return {
        baseUrl: (parsed.baseUrl ?? envUrl).trim().replace(/\/+$/, ""),
        token: (parsed.token ?? "").trim(),
      };
    }
  } catch {}
  return { baseUrl: envUrl, token: "" };
}

export function saveBackendConfig(cfg: BackendConnectionConfig): void {
  if (typeof window === "undefined") return;
  try {
    const clean: BackendConnectionConfig = {
      baseUrl: cfg.baseUrl.trim().replace(/\/+$/, ""),
      token: cfg.token.trim(),
    };
    if (!clean.baseUrl && !clean.token) sessionStorage.removeItem(SESSION_CFG_KEY);
    else sessionStorage.setItem(SESSION_CFG_KEY, JSON.stringify(clean));
  } catch {}
}

export function isBackendConfigured(cfg = getBackendConfig()): boolean {
  return Boolean(cfg.baseUrl && cfg.token);
}

export class BackendApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
  meta?: PaginationMeta;
  message?: string | string[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedApiResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

async function request<T>(path: string, init?: RequestInit): Promise<{ data: T; meta?: PaginationMeta }> {
  const cfg = getBackendConfig();
  if (!cfg.baseUrl || !cfg.token) {
    throw new BackendApiError("Backend API URL or JWT access token is not configured.", 0);
  }
  const url = `${cfg.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${cfg.token}`,
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok) {
    const msg = Array.isArray(json.message) ? json.message.join(", ") : json.message || `HTTP ${res.status}`;
    throw new BackendApiError(msg, res.status);
  }
  return { data: (json.data !== undefined ? json.data : (json as unknown as T)), meta: json.meta };
}

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ---------- Game Categories (/admin/game-categories) ---------- */

export interface BackendGameCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const adminCategoriesApi = {
  async list(params: { search?: string; isActive?: boolean; page?: number; limit?: number } = {}): Promise<PaginatedApiResponse<BackendGameCategory>> {
    const res = await request<BackendGameCategory[]>(`/admin/game-categories${qs(params)}`);
    return {
      items: res.data,
      meta: res.meta ?? { page: 1, limit: res.data.length || 20, totalItems: res.data.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    };
  },
  async create(body: { name: string; slug?: string; description?: string | null; sortOrder?: number }): Promise<BackendGameCategory> {
    return (await request<BackendGameCategory>("/admin/game-categories", { method: "POST", body: JSON.stringify(body) })).data;
  },
  async update(id: string, body: { name?: string; slug?: string; description?: string | null; sortOrder?: number }): Promise<BackendGameCategory> {
    return (await request<BackendGameCategory>(`/admin/game-categories/${id}`, { method: "PATCH", body: JSON.stringify(body) })).data;
  },
  async activate(id: string): Promise<BackendGameCategory> {
    return (await request<BackendGameCategory>(`/admin/game-categories/${id}/activate`, { method: "PATCH" })).data;
  },
  async deactivate(id: string): Promise<BackendGameCategory> {
    return (await request<BackendGameCategory>(`/admin/game-categories/${id}/deactivate`, { method: "PATCH" })).data;
  },
};

/* ---------- Game History & Rounds (/admin/game-history, /admin/game-rounds) ---------- */

export interface BackendRoundHistoryItem {
  id: string;
  sessionId: string;
  userId: string;
  user?: { id: string; name: string; email: string };
  gameId: string;
  gameName: string;
  roundNumber: number;
  status: "IN_PROGRESS" | "SETTLED";
  outcome: "WIN" | "LOSS" | "EVEN" | null;
  stake: number;
  payout: number;
  net: number;
  balanceBefore: number;
  balanceAfter: number;
  engineVersion: string;
  packageVersion: string | null;
  startedAt: string;
  settledAt: string | null;
  durationMs: number | null;
}

export interface BackendHistoryStats {
  totalGames: number;
  wins: number;
  losses: number;
  even: number;
  inProgress: number;
  wagered: number;
  winnings: number;
  net: number;
  winRate: number;
  averageStake: number;
  biggestPayout: number;
}

export interface BackendRoundHistoryDetail extends BackendRoundHistoryItem {
  bet: Record<string, unknown>;
  result: Record<string, unknown>;
  seedCommitment: string;
  wallet: {
    transactions: Array<{ id: string; type: string; direction: string; amount: number; balanceBefore: number; balanceAfter: number; description: string; idempotencyKey: string; createdAt: string }>;
    summary: { entryDebits: number; winnings: number; refunds: number; net: number };
  };
}

export interface BackendRoundAudit {
  roundId: string;
  gameId: string;
  engineVersion: string;
  seed: string;
  seedCommitment: string;
  rngDraws: number;
  bet: Record<string, unknown>;
  result: Record<string, unknown>;
  roundState: Record<string, unknown>;
  sessionStateBeforeHash: string;
  sessionStateBefore?: Record<string, unknown>;
  howToVerify: string;
}

export const adminGameHistoryApi = {
  async list(params: { gameId?: string; userId?: string; status?: string; outcome?: string; from?: string; to?: string; page?: number; limit?: number } = {}): Promise<PaginatedApiResponse<BackendRoundHistoryItem>> {
    const res = await request<BackendRoundHistoryItem[]>(`/admin/game-history${qs(params)}`);
    return {
      items: res.data,
      meta: res.meta ?? { page: 1, limit: 20, totalItems: res.data.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    };
  },
  async stats(params: { gameId?: string; userId?: string; from?: string; to?: string } = {}): Promise<BackendHistoryStats> {
    return (await request<BackendHistoryStats>(`/admin/game-history/stats${qs(params)}`)).data;
  },
  async detail(roundId: string): Promise<BackendRoundHistoryDetail> {
    return (await request<BackendRoundHistoryDetail>(`/admin/game-history/${roundId}`)).data;
  },
  async roundAudit(roundId: string): Promise<{ round: unknown; audit: BackendRoundAudit | null }> {
    return (await request<{ round: unknown; audit: BackendRoundAudit | null }>(`/admin/game-rounds/${roundId}`)).data;
  },
};

/* ---------- Audit Logs (/admin/audit-logs) ---------- */

export interface BackendAuditLog {
  id: string;
  actorId: string;
  actor: { id: string; name: string; email: string };
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown>;
  success: boolean;
  ipAddress: string | null;
  createdAt: string;
}

export const adminAuditLogsApi = {
  async list(params: { action?: string; resourceType?: string; success?: boolean; from?: string; to?: string; page?: number; limit?: number } = {}): Promise<PaginatedApiResponse<BackendAuditLog>> {
    const res = await request<BackendAuditLog[]>(`/admin/audit-logs${qs(params)}`);
    return {
      items: res.data,
      meta: res.meta ?? { page: 1, limit: 20, totalItems: res.data.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    };
  },
};
