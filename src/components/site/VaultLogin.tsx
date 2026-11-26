"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Lock, UserRound } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/features/access/AccessProvider";
import { DEMO_LOGINS } from "@/features/access/seed";
import { ROLE_HOME } from "@/features/access/types";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { PasswordSlot, Slot, VaultButton, VaultCheck, VaultFooter, VaultHeading, VaultPanel, VaultStage, dialTurn, type VaultState } from "./vault";

/** One login for every role. The account decides where it lands: Super Admin, Master or the player site. */
export function VaultLogin() {
  const router = useRouter();
  const { login, ready, current } = useAccess();
  const toast = useToast();
  const calm = useReduceMotion();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ identity?: string; password?: string }>({});
  const [state, setState] = useState<VaultState>("idle");
  const [shake, setShake] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // already signed in: go straight to your own area
  useEffect(() => {
    if (ready && current && state === "idle") router.replace(ROLE_HOME[current.role]);
  }, [ready, current, state, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state !== "idle") return;
    const next: typeof errors = {};
    if (!identity.trim()) next.identity = "Enter your username.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) {
      setShake((n) => n + 1);
      return;
    }
    setState("busy");
    timers.current.push(
      setTimeout(() => {
        const result = login(identity, password, remember);
        if (!result.ok || !result.account) {
          setState("idle");
          setErrors({ password: result.ok ? "Sign in failed." : result.error });
          setShake((n) => n + 1);
          return;
        }
        const account = result.account;
        setState("open");
        toast(`Welcome, ${account.name}.`);
        timers.current.push(setTimeout(() => router.push(ROLE_HOME[account.role]), calm ? 200 : 950));
      }, 1000),
    );
  };

  const fill = (username: string, pw: string) => {
    if (state !== "idle") return;
    setIdentity(username);
    setPassword(pw);
    setErrors({});
  };

  const busy = state !== "idle";

  return (
    <VaultStage>
      <VaultPanel state={state} shake={shake}>
        <VaultHeading turn={dialTurn(identity.length + password.length, state)} state={state} />
        <h1 className="sr-only">Log in</h1>

        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <Slot
            label="Username"
            icon={<UserRound />}
            value={identity}
            onChange={(e) => {
              setIdentity(e.target.value);
              if (errors.identity) setErrors((p) => ({ ...p, identity: undefined }));
            }}
            error={errors.identity}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Your username"
            disabled={busy}
          />
          <PasswordSlot
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
            error={errors.password}
            autoComplete="current-password"
            placeholder="Your password"
            disabled={busy}
          />

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <VaultCheck checked={remember} onChange={setRemember}>Keep me signed in</VaultCheck>
            <Link href="/forgot-password" className="vl-link shrink-0 text-[13px]">Forgot password?</Link>
          </div>

          <VaultButton type="submit" state={state}>
            <Lock className="h-[18px] w-[18px]" /> Log in
          </VaultButton>
          <p className="sr-only" aria-live="polite">{state === "busy" ? "Signing in" : state === "open" ? "Signed in" : ""}</p>
        </form>

        <VaultFooter>
          <span>Accounts are created by your master. Contact them to get access.</span>
        </VaultFooter>

        <details className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-[12.5px] text-[#b9b6c8]">
          <summary className="cursor-pointer select-none font-medium text-[#c9c6d6]">Demo accounts</summary>
          <p className="mt-2 text-[11.5px] text-[#7d7b92]">Frontend demo only. Tap one to fill the form.</p>
          <ul className="mt-2 divide-y divide-white/[0.06]">
            {DEMO_LOGINS.map((d) => (
              <li key={d.username}>
                <button type="button" onClick={() => fill(d.username, d.password)} disabled={busy} className="flex w-full items-center justify-between gap-3 py-1.5 text-left hover:text-white disabled:opacity-50">
                  <span>{d.label}</span>
                  <span className="font-mono text-[11.5px] text-[#e6c170]">{d.username} / {d.password}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      </VaultPanel>
    </VaultStage>
  );
}
