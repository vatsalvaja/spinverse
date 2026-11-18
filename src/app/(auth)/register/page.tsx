"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AtSign, Mail, UserRound } from "lucide-react";
import { AuthFrame } from "@/components/site/AuthFrame";
import { Checkbox, Field, PasswordField, StrengthMeter } from "@/components/site/forms";
import { Btn } from "@/components/site/ui";
import { useSession } from "@/lib/session";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useSession();
  const toast = useToast();
  const [f, setF] = useState({ name: "", username: "", email: "", password: "", confirm: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (f.name.trim().length < 2) err.name = "Enter your full name.";
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(f.username)) err.username = "3–20 characters: letters, numbers or underscores.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) err.email = "Enter a valid email address.";
    if (f.password.length < 8) err.password = "Use at least 8 characters.";
    if (f.confirm !== f.password || !f.confirm) err.confirm = "Passwords don’t match.";
    if (!terms) err.terms = "Accept the terms to continue.";
    setErrors(err);
    if (Object.keys(err).length) return;
    signIn({ name: f.name.trim(), username: f.username, email: f.email });
    toast("Account created. Your 5,000 welcome points are waiting.");
    router.push("/dashboard");
  };

  return (
    <AuthFrame
      world="atlantis-cascade"
      title="Join the lounge"
      subtitle="Create your account and start with 5,000 welcome points."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-gold-300 hover:text-gold-200">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" icon={<UserRound />} value={f.name} onChange={set("name")} error={errors.name} placeholder="Aurelia Voss" autoComplete="name" />
        <Field label="Username" icon={<AtSign />} value={f.username} onChange={set("username")} error={errors.username} placeholder="aurelia_v" autoComplete="username" />
        <Field label="Email" icon={<Mail />} type="email" value={f.email} onChange={set("email")} error={errors.email} placeholder="you@example.com" autoComplete="email" />
        <div>
          <PasswordField value={f.password} onChange={set("password")} error={errors.password} placeholder="At least 8 characters" autoComplete="new-password" />
          <StrengthMeter password={f.password} />
        </div>
        <PasswordField label="Confirm password" value={f.confirm} onChange={set("confirm")} error={errors.confirm} placeholder="Repeat your password" autoComplete="new-password" />
        <Checkbox
          checked={terms}
          onChange={setTerms}
          error={errors.terms}
          label={
            <>
              I’m 18 or older and accept the <span className="text-gold-300">Terms of Play</span> and <span className="text-gold-300">Privacy Notice</span>. I understand points
              have no cash value.
            </>
          }
        />
        <Btn type="submit" size="lg" className="w-full">
          Create account
        </Btn>
        <p className="text-center text-xs text-obsidian-300">
          Just want a quick look?{" "}
          <Link href="/signup" className="text-obsidian-200 underline underline-offset-2">
            Use quick signup
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
