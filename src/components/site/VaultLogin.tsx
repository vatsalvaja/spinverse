"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Lock, Mail, UserRound } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/session";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { PasswordSlot, Slot, VaultButton, VaultCheck, VaultFooter, VaultHeading, VaultPanel, VaultStage, dialTurn, type VaultState } from "./vault";

export function VaultLogin() {
  const router = useRouter();
  const { signIn, continueAsGuest } = useSession();
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

  const check = (id: string, pw: string) => {
    const next: typeof errors = {};
    if (!id.trim()) next.identity = "Enter your email or username.";
    if (pw.length < 6) next.password = "Password must be at least 6 characters.";
    return next;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state !== "idle") return;
    const next = check(identity, password);
    setErrors(next);
    if (Object.keys(next).length) {
      setShake((n) => n + 1);
      return;
    }
    setState("busy");
    timers.current.push(
      setTimeout(() => {
        signIn();
        setState("open");
        toast("Welcome back to SPINVERSE.");
        timers.current.push(setTimeout(() => router.push("/dashboard"), calm ? 200 : 950));
      }, 1000),
    );
  };

  const guest = () => {
    continueAsGuest();
    toast("You’re in as a guest. Create an account any time to keep your points.", "info");
    router.push("/dashboard");
  };

  const busy = state !== "idle";

  return (
    <VaultStage>
      <VaultPanel state={state} shake={shake}>
        <VaultHeading turn={dialTurn(identity.length + password.length, state)} state={state} />
        <h1 className="sr-only">Log in</h1>

        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <Slot
            label="Email or username"
            icon={<Mail />}
            value={identity}
            onChange={(e) => {
              setIdentity(e.target.value);
              if (errors.identity) setErrors((p) => ({ ...p, identity: undefined }));
            }}
            onBlur={() => identity && setErrors((p) => ({ ...p, identity: check(identity, "xxxxxx").identity }))}
            error={errors.identity}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="demo@gmail.com"
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
          <span>
            New here? <Link href="/register" className="vl-link">Create an account</Link>
          </span>
          <button type="button" onClick={guest} disabled={busy} className="vl-link flex items-center gap-1.5 disabled:opacity-50">
            <UserRound className="h-3.5 w-3.5" /> Guest
          </button>
        </VaultFooter>
        <p className="mt-3 text-center text-[11.5px] text-[#7d7b92]">Demo mode: any email and a password of 6+ characters opens the vault.</p>
      </VaultPanel>

      <p className="mt-5 text-center text-xs text-[#6d6b82]">
        <Link href="/admin/login" className="underline-offset-2 hover:text-white hover:underline">Staff sign in</Link>
      </p>
    </VaultStage>
  );
}
