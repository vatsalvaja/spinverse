"use client";

import { useState } from "react";
import { AButton, AInput, Card, CardHeader, PageHeader } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-slate-900" : "bg-slate-300")}>
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export default function AdminSettingsPage() {
  const toast = useToast();
  const [welcome, setWelcome] = useState("5000");
  const [guest, setGuest] = useState("2000");
  const [daily, setDaily] = useState("500");
  const [flags, setFlags] = useState({ registrations: true, guests: true, maintenance: false, emailAlerts: true, autoBlock: false });
  const toggles: { key: keyof typeof flags; label: string; note: string }[] = [
    { key: "registrations", label: "Open registrations", note: "Allow new players to create accounts." },
    { key: "guests", label: "Guest access", note: "Let visitors play without an account." },
    { key: "maintenance", label: "Maintenance mode", note: "Show a maintenance notice to players." },
    { key: "emailAlerts", label: "Admin email alerts", note: "Email the team about blocked accounts and failed transactions." },
    { key: "autoBlock", label: "Auto-block suspicious activity", note: "Block accounts with repeated failed claims." },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Platform defaults for new players and console behaviour." actions={<AButton variant="primary" onClick={() => toast("Settings saved.")}>Save changes</AButton>} />
      <Card className="mb-6">
        <CardHeader title="Starting points" description="Virtual points granted automatically. No cash value." />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <AInput label="Welcome bonus" type="number" value={welcome} onChange={(e) => setWelcome(e.target.value)} hint="Registered players" />
          <AInput label="Guest starter points" type="number" value={guest} onChange={(e) => setGuest(e.target.value)} hint="Guest sessions" />
          <AInput label="Daily login reward" type="number" value={daily} onChange={(e) => setDaily(e.target.value)} hint="Per day" />
        </div>
      </Card>
      <Card>
        <CardHeader title="Platform controls" />
        <ul className="divide-y divide-slate-100">
          {toggles.map((t) => (
            <li key={t.key} className="flex items-center justify-between gap-6 px-5 py-4">
              <div><p className="text-sm font-medium text-slate-900">{t.label}</p><p className="text-[13px] text-slate-500">{t.note}</p></div>
              <Switch label={t.label} on={flags[t.key]} onChange={(v) => setFlags((f) => ({ ...f, [t.key]: v }))} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
