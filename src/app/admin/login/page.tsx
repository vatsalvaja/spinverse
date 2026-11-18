"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { AButton, AInput } from "@/components/admin/ui";
import { useSession } from "@/lib/session";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAdminSignedIn } = useSession();
  const [email, setEmail] = useState("dina.okoye@spinverse.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter your work email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setError("");
    setBusy(true);
    setTimeout(() => {
      setAdminSignedIn(true);
      router.push("/admin");
    }, 450);
  };

  return (
    <div className="ad-root grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-14">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <div className="leading-tight">
              <p className="text-[17px] font-semibold tracking-wide text-slate-900">SPINVERSE</p>
              <p className="text-xs text-slate-500">Operations console</p>
            </div>
          </div>
          <h1 className="mt-10 text-2xl font-semibold tracking-tight text-slate-900">Sign in to the console</h1>
          <p className="mt-1.5 text-sm text-slate-500">Staff access only. Activity in this console is logged.</p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <AInput label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            <AInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Any 6+ characters in demo mode" />
            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700 ring-1 ring-rose-200">{error}</p>}
            <AButton type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</AButton>
          </form>
          <p className="mt-6 flex items-start gap-2 text-xs text-slate-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Demo mode. No credentials are checked and nothing leaves your browser.
          </p>
          <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the player site
          </Link>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-[#13151a] lg:block" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_80%_0%,rgba(212,175,79,.18),transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-center p-14">
          <p className="max-w-md text-3xl font-semibold leading-snug tracking-tight text-white">See every player, point and session in one place.</p>
          <div className="mt-10 max-w-lg space-y-3">
            {[
              ["User management", "Search, filter, edit and moderate every account."],
              ["Points ledger", "Inspect the full virtual points history of any player."],
              ["Live analytics", "Growth, engagement and per-game performance."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4">
                <p className="text-sm font-semibold text-white">{t}</p>
                <p className="mt-0.5 text-sm text-slate-400">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
