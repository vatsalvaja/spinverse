"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { AuthFrame } from "@/components/site/AuthFrame";
import { Checkbox, Field, PasswordField } from "@/components/site/forms";
import { Btn } from "@/components/site/ui";
import { GAMES } from "@/data/games";
import { useSession } from "@/lib/session";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** Quick signup: a two-step version of registration (email first, then a game to start with). */
export default function SignupPage() {
  const router = useRouter();
  const { signIn, toggleFavorite, favorites } = useSession();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [game, setGame] = useState<string>(GAMES[0].id);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) err.email = "Enter a valid email address.";
    if (password.length < 8) err.password = "Use at least 8 characters.";
    if (!terms) err.terms = "Accept the terms to continue.";
    setErrors(err);
    if (!Object.keys(err).length) setStep(2);
  };

  const finish = () => {
    const local = email.split("@")[0];
    signIn({
      email,
      username: local.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20),
      name: local.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    });
    if (!favorites.includes(game)) toggleFavorite(game);
    toast("You’re in. Enjoy your welcome points.");
    router.push("/dashboard");
  };

  return (
    <AuthFrame
      world="neon-overdrive"
      title={step === 1 ? "Quick signup" : "Pick your first world"}
      subtitle={step === 1 ? "Two steps. Email and password now, the fun part next." : "We’ll pin it to your favorites so it’s one tap away."}
      footer={
        <>
          Prefer the full form?{" "}
          <Link href="/register" className="font-semibold text-gold-300 hover:text-gold-200">
            Register with all details
          </Link>
        </>
      }
    >
      <div className="mb-6 flex items-center gap-3 text-xs font-semibold text-obsidian-200" aria-label={`Step ${step} of 2`}>
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", step === 1 ? "bg-gold-sheen text-obsidian-950" : "bg-gold-400/20 text-gold-200")}>
          {step === 2 ? <Check className="h-3.5 w-3.5" /> : 1}
        </span>
        Account
        <span className="h-px w-8 bg-white/15" />
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", step === 2 ? "bg-gold-sheen text-obsidian-950" : "bg-white/10")}>2</span>
        First game
      </div>

      {step === 1 ? (
        <form onSubmit={next} className="space-y-5" noValidate>
          <Field label="Email" icon={<Mail />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="you@example.com" autoComplete="email" />
          <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="At least 8 characters" autoComplete="new-password" />
          <Checkbox checked={terms} onChange={setTerms} error={errors.terms} label={<>I’m 18+ and accept the <span className="text-gold-300">Terms of Play</span>.</>} />
          <Btn type="submit" size="lg" className="w-full">
            Continue
          </Btn>
        </form>
      ) : (
        <div className="space-y-3">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => setGame(g.id)}
              className={cn("flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition", game === g.id ? "border-gold-300/70 bg-gold-400/[0.08]" : "border-white/10 bg-white/[0.03] hover:border-white/25")}
              aria-pressed={game === g.id}
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: g.accent, boxShadow: `0 0 14px ${g.accent}` }} />
              <span>
                <span className="sv-display block text-xl font-semibold text-white">{g.name}</span>
                <span className="text-xs text-obsidian-200">{g.theme} · {g.concept}</span>
              </span>
              {game === g.id && <Check className="ml-auto h-4 w-4 text-gold-300" />}
            </button>
          ))}
          <div className="flex gap-3 pt-3">
            <Btn variant="dark" size="lg" onClick={() => setStep(1)} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Btn>
            <Btn size="lg" className="flex-1" onClick={finish}>
              Enter SPINVERSE
            </Btn>
          </div>
        </div>
      )}
    </AuthFrame>
  );
}
