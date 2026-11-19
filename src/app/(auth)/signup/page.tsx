"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { PasswordSlot, Slot, VaultButton, VaultCheck, VaultFooter, VaultHeading, VaultPanel, VaultStage, dialTurn, type VaultState } from "@/components/site/vault";
import { useToast } from "@/components/ui/toast";
import { GAMES } from "@/data/games";
import { useSession } from "@/lib/session";
import { useReduceMotion } from "@/lib/useReduceMotion";

/** Quick signup: a two-step version of registration (email first, then a game to start with). */
export default function SignupPage() {
  const router = useRouter();
  const { signIn, toggleFavorite, favorites } = useSession();
  const toast = useToast();
  const calm = useReduceMotion();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [game, setGame] = useState<string>(GAMES[0].id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<VaultState>("idle");
  const [shake, setShake] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) err.email = "Enter a valid email address.";
    if (password.length < 8) err.password = "Use at least 8 characters.";
    if (!terms) err.terms = "Accept the terms to continue.";
    setErrors(err);
    if (Object.keys(err).length) return setShake((n) => n + 1);
    setStep(2);
  };

  const finish = () => {
    if (state !== "idle") return;
    setState("busy");
    timers.current.push(
      setTimeout(() => {
        const local = email.split("@")[0];
        signIn({
          email,
          username: local.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20),
          name: local.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        });
        if (!favorites.includes(game)) toggleFavorite(game);
        setState("open");
        toast("You’re in. Enjoy your welcome points.");
        timers.current.push(setTimeout(() => router.push("/dashboard"), calm ? 200 : 950));
      }, 800),
    );
  };

  const busy = state !== "idle";

  return (
    <VaultStage>
      <VaultPanel state={state} shake={shake}>
        <VaultHeading turn={dialTurn(email.length + password.length + (step === 2 ? 20 : 0), state)} state={state} title={step === 1 ? "Quick signup" : "Pick your first game"} />

        <div className="vl-sub mt-4" aria-label={`Step ${step} of 2`}>
          <span className="vl-dot" data-on="true">{step === 2 ? <Check className="h-3 w-3" strokeWidth={3.4} /> : 1}</span>
          Account
          <span className="h-px w-8 bg-white/15" />
          <span className="vl-dot" data-on={step === 2}>2</span>
          First game
        </div>

        {step === 1 ? (
          <form onSubmit={next} noValidate className="mt-6 space-y-4">
            <Slot label="Email" icon={<Mail />} type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: "" })); }} error={errors.email} placeholder="you@example.com" autoComplete="email" autoCapitalize="none" spellCheck={false} />
            <PasswordSlot value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: "" })); }} error={errors.password} placeholder="At least 8 characters" autoComplete="new-password" />
            <VaultCheck checked={terms} onChange={(v) => { setTerms(v); if (v && errors.terms) setErrors((p) => ({ ...p, terms: "" })); }} error={errors.terms}>
              I’m 18+ and accept the <span className="text-[#e6c170]">Terms of Play</span>.
            </VaultCheck>
            <VaultButton type="submit">Continue</VaultButton>
          </form>
        ) : (
          <div className="mt-6 space-y-2.5">
            {GAMES.map((g) => (
              <button key={g.id} type="button" onClick={() => setGame(g.id)} disabled={busy} aria-pressed={game === g.id} className="vl-pick">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: g.accent, boxShadow: `0 0 14px ${g.accent}` }} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">{g.name}</span>
                  <span className="block truncate text-xs text-[#8d8aa3]">{g.theme} · {g.concept}</span>
                </span>
                {game === g.id && <Check className="ml-auto h-4 w-4 shrink-0 text-[#e6c170]" />}
              </button>
            ))}
            <div className="flex items-start gap-3 pt-1">
              <button type="button" onClick={() => setStep(1)} disabled={busy} aria-label="Back" className="vl-ghost !mt-5">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <VaultButton type="button" state={state} onClick={finish} busyLabel="Opening vault…" doneLabel="Vault open">
                  Enter SPINVERSE
                </VaultButton>
              </div>
            </div>
          </div>
        )}

        <VaultFooter>
          <span>
            Already have an account? <Link href="/login" className="vl-link">Log in</Link>
          </span>
          <Link href="/register" className="vl-link shrink-0">Full form</Link>
        </VaultFooter>
      </VaultPanel>
    </VaultStage>
  );
}
