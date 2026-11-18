"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { AuthFrame } from "@/components/site/AuthFrame";
import { Field } from "@/components/site/forms";
import { Btn } from "@/components/site/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter the email you registered with.");
    setError("");
    setSent(true);
  };

  return (
    <AuthFrame
      world="atlantis-cascade"
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={sent ? `If an account exists for ${email}, a reset link is on its way.` : "Enter your email and we’ll send a link to choose a new password."}
      footer={
        <Link href="/login" className="inline-flex items-center gap-2 font-semibold text-gold-300 hover:text-gold-200">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-5">
          <div className="sv-panel flex items-start gap-4 p-5">
            <MailCheck className="mt-0.5 h-6 w-6 shrink-0 text-gold-300" />
            <p className="text-sm leading-relaxed text-obsidian-200">
              This is a frontend demo, so no email is actually sent. In the live product the link would expire after 30 minutes.
            </p>
          </div>
          <Btn variant="outline" size="lg" className="w-full" onClick={() => setSent(false)}>
            Use a different email
          </Btn>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <Field label="Email" icon={<Mail />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} placeholder="you@example.com" autoComplete="email" />
          <Btn type="submit" size="lg" className="w-full">
            Send reset link
          </Btn>
        </form>
      )}
    </AuthFrame>
  );
}
