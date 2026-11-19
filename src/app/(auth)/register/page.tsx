"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AtSign, Mail, UserPlus, UserRound } from "lucide-react";
import { PasswordSlot, Slot, StrengthBars, VaultButton, VaultCheck, VaultFooter, VaultHeading, VaultPanel, VaultStage, dialTurn, type VaultState } from "@/components/site/vault";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/session";
import { useReduceMotion } from "@/lib/useReduceMotion";

type Form = { name: string; username: string; email: string; password: string; confirm: string };

const validate = (f: Form, terms: boolean) => {
  const err: Record<string, string> = {};
  if (f.name.trim().length < 2) err.name = "Enter your full name.";
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(f.username)) err.username = "3–20 characters: letters, numbers or underscores.";
  if (!/^\S+@\S+\.\S+$/.test(f.email)) err.email = "Enter a valid email address.";
  if (f.password.length < 8) err.password = "Use at least 8 characters.";
  if (f.confirm !== f.password || !f.confirm) err.confirm = "Passwords don’t match.";
  if (!terms) err.terms = "Accept the terms to continue.";
  return err;
};

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useSession();
  const toast = useToast();
  const calm = useReduceMotion();
  const [f, setF] = useState<Form>({ name: "", username: "", email: "", password: "", confirm: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<VaultState>("idle");
  const [shake, setShake] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // typing clears that field's error; leaving a field checks just that field once it has a value
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  };
  const blur = (k: keyof Form) => () => {
    if (!f[k]) return;
    const msg = validate(f, true)[k] ?? "";
    setErrors((p) => ({ ...p, [k]: msg }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state !== "idle") return;
    const err = validate(f, terms);
    setErrors(err);
    if (Object.keys(err).length) return setShake((n) => n + 1);
    setState("busy");
    timers.current.push(
      setTimeout(() => {
        signIn({ name: f.name.trim(), username: f.username, email: f.email });
        setState("open");
        toast("Account created. Your 5,000 welcome points are waiting.");
        timers.current.push(setTimeout(() => router.push("/dashboard"), calm ? 200 : 950));
      }, 900),
    );
  };

  const busy = state !== "idle";
  const typed = f.name.length + f.username.length + f.email.length + f.password.length + f.confirm.length;

  return (
    <VaultStage maxWidth={460}>
      <VaultPanel state={state} shake={shake}>
        <VaultHeading turn={dialTurn(typed, state)} state={state} title="Create your account" />

        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <Slot label="Full name" icon={<UserRound />} value={f.name} onChange={set("name")} onBlur={blur("name")} error={errors.name} placeholder="Full Name" autoComplete="name" disabled={busy} />
          <Slot label="Username" icon={<AtSign />} value={f.username} onChange={set("username")} onBlur={blur("username")} error={errors.username} placeholder="Username" autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={busy} />
          <Slot label="Email" icon={<Mail />} type="email" value={f.email} onChange={set("email")} onBlur={blur("email")} error={errors.email} placeholder="you@example.com" autoComplete="email" autoCapitalize="none" spellCheck={false} disabled={busy} />
          <div>
            <PasswordSlot value={f.password} onChange={set("password")} onBlur={blur("password")} error={errors.password} placeholder="At least 8 characters" autoComplete="new-password" disabled={busy} />
            <StrengthBars password={f.password} />
          </div>
          <PasswordSlot label="Confirm password" value={f.confirm} onChange={set("confirm")} onBlur={blur("confirm")} error={errors.confirm} placeholder="Repeat your password" autoComplete="new-password" disabled={busy} />

          <VaultCheck checked={terms} onChange={(v) => { setTerms(v); if (v && errors.terms) setErrors((p) => ({ ...p, terms: "" })); }} error={errors.terms}>
            I’m 18 or older and accept the <span className="text-[#e6c170]">Terms of Play</span> and <span className="text-[#e6c170]">Privacy Notice</span>. I understand points have no cash value.
          </VaultCheck>

          <VaultButton type="submit" state={state} busyLabel="Creating account…" doneLabel="Account created">
            <UserPlus className="h-[18px] w-[18px]" /> Create account
          </VaultButton>
          <p className="sr-only" aria-live="polite">{state === "busy" ? "Creating your account" : state === "open" ? "Account created" : ""}</p>
        </form>

        <VaultFooter>
          <span>
            Already have an account? <Link href="/login" className="vl-link">Log in</Link>
          </span>
          <Link href="/signup" className="vl-link shrink-0">Quick signup</Link>
        </VaultFooter>
      </VaultPanel>
    </VaultStage>
  );
}
