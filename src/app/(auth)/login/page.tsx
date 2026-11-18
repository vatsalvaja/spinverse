"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Mail, UserRound } from "lucide-react";
import { AuthFrame } from "@/components/site/AuthFrame";
import { Checkbox, Field, PasswordField } from "@/components/site/forms";
import { Btn } from "@/components/site/ui";
import { useSession } from "@/lib/session";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, continueAsGuest } = useSession();
  const toast = useToast();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ identity?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!identity.trim()) next.identity = "Enter your email or username.";
    if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setTimeout(() => {
      signIn();
      toast("Welcome back to SPINVERSE.");
      router.push("/dashboard");
    }, 500);
  };

  const guest = () => {
    continueAsGuest();
    toast("You’re in as a guest. Create an account any time to keep your points.", "info");
    router.push("/dashboard");
  };

  return (
    <AuthFrame
      world="pharaohs-fortune"
      title="Welcome back"
      subtitle="Sign in to pick up where your last spin left off."
      footer={
        <>
          New to SPINVERSE?{" "}
          <Link href="/register" className="font-semibold text-gold-300 hover:text-gold-200">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Email or username" icon={<Mail />} placeholder="aurelia.voss@mailbox.test" value={identity} onChange={(e) => setIdentity(e.target.value)} error={errors.identity} autoComplete="username" />
        <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="Your password" autoComplete="current-password" />
        <div className="flex items-center justify-between gap-3">
          <Checkbox label="Keep me signed in" checked={remember} onChange={setRemember} />
          <Link href="/forgot-password" className="text-sm font-semibold text-gold-300 hover:text-gold-200">
            Forgot password?
          </Link>
        </div>
        <Btn type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Btn>
        <p className="flex items-center gap-2 text-xs text-obsidian-300">
          <Lock className="h-3.5 w-3.5 shrink-0" /> Demo mode: any email and a 6+ character password will work.
        </p>
      </form>

      <div className="my-7 flex items-center gap-4 text-xs text-obsidian-300">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>

      <Btn variant="outline" size="lg" className="w-full" onClick={guest}>
        <UserRound className="h-4 w-4" /> Continue as guest
      </Btn>
      <p className="mt-6 text-center text-xs text-obsidian-300">
        Staff?{" "}
        <Link href="/admin/login" className="text-obsidian-200 underline underline-offset-2 hover:text-white">
          Open the admin console
        </Link>
      </p>
    </AuthFrame>
  );
}
