import { DATA_SCHEMA, STORAGE_KEY } from "../lib/constants";
import { buildSeed } from "../mock-data/seed";
import type { AdminJob, GameDownload, GmData, GmState, ManagedGame } from "../types";

/**
 * Client-side state for Game Management. A tiny external store (no provider needed, so no existing layout had to
 * change) that persists the registry and the demo player's installs to localStorage.
 *
 * Reads happen through `useGmState` (see useGm.ts). Writes happen only through the services in ../services, so
 * the day those call a real API, components do not change.
 */

const SERVER_STATE: GmState = { data: buildSeed(), jobs: {}, downloads: {} };

let state: GmState = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function normalize(data: GmData): GmData {
  // A page reload mid-install cannot resume, so surface it as a failed install that can be retried.
  return {
    ...data,
    games: data.games.map((g) =>
      g.installation.status === "installing"
        ? { ...g, installation: { ...g.installation, status: "failed" as const, failureReason: "Installation was interrupted. Start it again." } }
        : g,
    ),
  };
}

function readStored(): GmData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GmData;
    if (parsed.schema !== DATA_SCHEMA || !Array.isArray(parsed.games) || !Array.isArray(parsed.playerInstalls)) return null;
    return normalize(parsed);
  } catch {
    return null;
  }
}

function persist(data: GmData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded or storage blocked: keep working in memory
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const stored = readStored();
  state = { ...state, data: stored ?? buildSeed() };
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    const next = readStored();
    if (next) {
      state = { ...state, data: next };
      emit();
    }
  });
}

function emit() {
  listeners.forEach((l) => l());
}

export const gmStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  getSnapshot(): GmState {
    ensureLoaded();
    return state;
  },
  getServerSnapshot(): GmState {
    return SERVER_STATE;
  },

  getData(): GmData {
    ensureLoaded();
    return state.data;
  },
  getGame(id: string): ManagedGame | undefined {
    return gmStore.getData().games.find((g) => g.id === id);
  },

  setData(update: (d: GmData) => GmData) {
    ensureLoaded();
    const data = update(state.data);
    state = { ...state, data };
    persist(data);
    emit();
  },
  updateGame(id: string, update: (g: ManagedGame) => ManagedGame) {
    gmStore.setData((d) => ({ ...d, games: d.games.map((g) => (g.id === id ? update(g) : g)) }));
  },

  setJob(job: AdminJob | null, gameId: string) {
    ensureLoaded();
    const jobs = { ...state.jobs };
    if (job) jobs[gameId] = job;
    else delete jobs[gameId];
    state = { ...state, jobs };
    emit();
  },
  setDownload(download: GameDownload | null, gameId: string) {
    ensureLoaded();
    const downloads = { ...state.downloads };
    if (download) downloads[gameId] = download;
    else delete downloads[gameId];
    state = { ...state, downloads };
    emit();
  },

  /** Back to the seeded demo data. */
  reset() {
    ensureLoaded();
    const data = buildSeed();
    state = { data, jobs: {}, downloads: {} };
    persist(data);
    emit();
  },
};
