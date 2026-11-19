"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, MailCheck, Send } from "lucide-react";
import { Slot, VaultButton, VaultFooter, VaultHeading, VaultPanel, VaultStage, dialTurn } from "@/components/site/vault";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter the email you registered with.");
      return setShake((n) => n + 1);
    }
    setError("");
    setSent(true);
  };

  return (
    <VaultStage>
      <VaultPanel state={sent ? "open" : "idle"} shake={shake}>
        <VaultHeading turn={dialTurn(email.length, sent ? "open" : "idle")} state={sent ? "open" : "idle"} title={sent ? "Check your inbox" : "Reset your password"} />

        {sent ? (
          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-3.5 rounded-2xl bg-[#05060a] p-4 [box-shadow:inset_0_4px_10px_rgba(0,0,0,.85),inset_0_0_0_1px_rgba(255,255,255,.07)]">
              <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#e6c170]" />
              <p className="text-sm leading-relaxed text-[#b9b6c8]">
                If an account exists for <span className="break-all text-white">{email}</span>, a reset link is on its way. This is a frontend demo, so no email is actually sent. In the live product the link would expire after 30 minutes.
              </p>
            </div>
            <button type="button" onClick={() => setSent(false)} className="vl-ghost !h-[52px] !w-full gap-2 text-[15px] font-semibold">
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <p className="pl-1 text-[13px] leading-snug text-[#9d9ab2]">Enter your email and we’ll send a link to choose a new password.</p>
            <Slot label="Email" icon={<Mail />} type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }} error={error} placeholder="you@example.com" autoComplete="email" autoCapitalize="none" spellCheck={false} />
            <VaultButton type="submit">
              <Send className="h-[18px] w-[18px]" /> Send reset link
            </VaultButton>
          </form>
        )}

        <VaultFooter>
          <Link href="/login" className="vl-link inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to log in
          </Link>
          <Link href="/register" className="vl-link shrink-0">Create an account</Link>
        </VaultFooter>
      </VaultPanel>
    </VaultStage>
  );
}
