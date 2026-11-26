/**
 * TEMPORARY production diagnostics ([sv-diag]). Remove this file and every `svDiag(` / `// [sv-diag]` line when done.
 *
 * Off by default: nothing is recorded and nothing runs unless it is switched on in that browser:
 *   open  <site>/login?svdiag=1   to switch on (saved in localStorage "sv-diag"),
 *   open  <site>/login?svdiag=0   to switch off and clear the log.
 * Records only stage names, roles, counts, paths and error text. Never passwords, e-mails, names or tokens.
 *
 * After reproducing the problem, run in the browser console:   copy(window.__svDiagReport())
 * and send the result.
 */
type Entry = { t: number; stage: string; info?: Record<string, unknown> };

const FLAG = "sv-diag";
const LOG_KEY = "sv-diag-log";
const MAX = 300;

let enabled = false;
let log: Entry[] = [];

function persist() {
  try {
    sessionStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-MAX)));
  } catch {}
}

export function svDiag(stage: string, info?: Record<string, unknown>) {
  if (!enabled) return;
  const entry: Entry = { t: Math.round(performance.now()), stage, info };
  log.push(entry);
  if (log.length > MAX) log = log.slice(-MAX);
  persist();
  // eslint-disable-next-line no-console
  console.info("[sv-diag]", entry.t, stage, info ?? "");
}

function q(sel: string) {
  return document.querySelector(sel);
}

function report() {
  const failed = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
    .filter((r) => (r as PerformanceResourceTiming & { responseStatus?: number }).responseStatus && (r as PerformanceResourceTiming & { responseStatus?: number }).responseStatus! >= 400)
    .map((r) => ({ url: r.name.replace(location.origin, ""), status: (r as PerformanceResourceTiming & { responseStatus?: number }).responseStatus }));
  const scripts = [...document.scripts].map((s) => s.src).filter(Boolean).map((s) => s.replace(location.origin, ""));
  const root = q(".ad-root") as HTMLElement | null;
  const main = q("main");
  const style = (el: Element | null) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = (el as HTMLElement).getBoundingClientRect();
    return { display: s.display, visibility: s.visibility, opacity: s.opacity, color: s.color, background: s.backgroundColor, width: Math.round(r.width), height: Math.round(r.height) };
  };
  let accounts: number | null = null;
  let storedAuth: string | null = null;
  try {
    const d = JSON.parse(localStorage.getItem("sv-access-data-v1") || "null");
    accounts = d && Array.isArray(d.accounts) ? d.accounts.length : null;
    storedAuth = sessionStorage.getItem("sv-access-auth-v1") ?? localStorage.getItem("sv-access-auth-v1");
  } catch {}
  const text = document.body.innerText || "";
  return JSON.stringify(
    {
      enabled,
      when: new Date().toISOString(),
      userAgent: navigator.userAgent,
      location: location.pathname,
      readyState: document.readyState,
      viewport: `${innerWidth}x${innerHeight}`,
      stages: log,
      failedResources: failed,
      scriptCount: scripts.length,
      portalChunkLoaded: scripts.filter((s) => /\/app\/(super-admin|master)\//.test(s)),
      dom: {
        hasAdRoot: !!root,
        hasMain: !!main,
        mainChildren: main ? main.children.length : null,
        bodyTextLength: text.length,
        showsCheckingSession: text.includes("Checking session"),
        showsLoginForm: !!q('input[type="password"]'),
        adRootStyle: style(root),
        mainStyle: style(main),
        bodyStyle: style(document.body),
      },
      storage: { accountsSaved: accounts, savedSignIn: storedAuth },
    },
    null,
    2,
  );
}

function init() {
  if (typeof window === "undefined") return;
  try {
    const flag = new URLSearchParams(window.location.search).get("svdiag");
    if (flag === "1") localStorage.setItem(FLAG, "1");
    if (flag === "0") {
      localStorage.removeItem(FLAG);
      sessionStorage.removeItem(LOG_KEY);
    }
    enabled = localStorage.getItem(FLAG) === "1";
  } catch {}
  if (!enabled) return;

  try {
    log = JSON.parse(sessionStorage.getItem(LOG_KEY) || "[]");
  } catch {
    log = [];
  }
  svDiag("boot", { path: location.pathname, readyState: document.readyState });

  // script/stylesheet that fails to load (a missing chunk shows up here), and uncaught errors
  window.addEventListener(
    "error",
    (e) => {
      const t = e.target as (HTMLElement & { src?: string; href?: string }) | Window | null;
      if (t && t !== window && "tagName" in t) svDiag("resource-error", { tag: t.tagName, url: (t.src || t.href || "").replace(location.origin, "") });
      else svDiag("js-error", { message: String(e.message), line: e.lineno, file: String(e.filename || "").replace(location.origin, "") });
    },
    true,
  );
  window.addEventListener("unhandledrejection", (e) => svDiag("unhandled-rejection", { reason: String((e.reason && (e.reason.message || e.reason)) ?? "") }));

  // every client-side URL change (shows redirect loops and where navigation ends up)
  for (const m of ["pushState", "replaceState"] as const) {
    const orig = history[m];
    history[m] = function (this: History, ...args: Parameters<History["pushState"]>) {
      svDiag("history." + m, { to: String(args[2] ?? "").split("?")[0] });
      return orig.apply(this, args);
    } as History["pushState"];
  }
  window.addEventListener("pagehide", () => svDiag("pagehide", { path: location.pathname }));

  (window as unknown as { __svDiagReport: () => string }).__svDiagReport = report;
}

init();
