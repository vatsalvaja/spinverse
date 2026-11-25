/**
 * Where the website finds game packages.
 *
 * A package is described by the same record whether it came from the local build output or, later, from the
 * admin-installed packages served by the backend. Only the SOURCE differs; the loader (GameHost), the manifest,
 * the versioning and the host/game contract are identical for every game, old or new.
 *
 *   local (today)  public/local-packages/registry.json, written by `npm run package`
 *   backend (later) an API returning the same records for the packages an admin installed and published
 */
export interface GameManifest {
  gameId: string;
  name: string;
  version: string;
  entryPoint: string;
  description: string;
}

export interface GamePackageRecord {
  gameId: string;
  version: string;
  name: string;
  description: string;
  /** Absolute URL path of the folder holding the package, ending in "/". */
  baseUrl: string;
  /** Absolute URL path of the package's entry HTML. */
  entryUrl: string;
  manifest: GameManifest;
}

export type PackageLookup =
  | { status: "ready"; pkg: GamePackageRecord }
  /** The package source exists but has nothing for this game. `registry` is false when no packages were built at all. */
  | { status: "unavailable"; registry: boolean };

export interface GamePackageSource {
  /** Resolves the package the host should launch for a game: the highest installed version. */
  resolve(gameId: string): Promise<PackageLookup>;
}

interface RegistryEntry {
  gameId: string;
  version: string;
  name: string;
  description: string;
  path: string;
  entryPoint: string;
  manifest: GameManifest;
}

const LOCAL_ROOT = "/local-packages/";

const versionParts = (v: string) => v.split(".").map((n) => Number(n) || 0);
function compareVersions(a: string, b: string): number {
  const x = versionParts(a);
  const y = versionParts(b);
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}

/** Packages unpacked by `npm run package` into public/local-packages/. Temporary: replaced by the backend source. */
export const localPackageSource: GamePackageSource = {
  async resolve(gameId) {
    const res = await fetch(`${LOCAL_ROOT}registry.json`, { cache: "no-store" });
    if (res.status === 404) return { status: "unavailable", registry: false };
    if (!res.ok) throw new Error(`The local package registry could not be read (HTTP ${res.status}).`);
    const data = (await res.json()) as { schema?: number; packages?: RegistryEntry[] };
    if (data.schema !== 1 || !Array.isArray(data.packages)) throw new Error("The local package registry has an unexpected format.");

    const latest = data.packages.filter((p) => p.gameId === gameId).sort((a, b) => compareVersions(a.version, b.version)).pop();
    if (!latest) return { status: "unavailable", registry: true };

    const baseUrl = `${LOCAL_ROOT}${latest.path}`;
    return {
      status: "ready",
      pkg: { gameId: latest.gameId, version: latest.version, name: latest.name, description: latest.description, baseUrl, entryUrl: `${baseUrl}${latest.entryPoint}`, manifest: latest.manifest },
    };
  },
};

/** The source the website uses. Swap this for the backend source when package deployment exists. */
export const gamePackageSource: GamePackageSource = localPackageSource;
