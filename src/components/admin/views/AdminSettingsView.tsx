"use client";

import { useEffect, useState } from "react";
import { AButton, AInput, Badge, Card, CardHeader, PageHeader } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";
import { getBackendConfig, isBackendConfigured, saveBackendConfig } from "@/lib/adminBackendApi";
import { cn } from "@/lib/utils";

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-slate-900" : "bg-slate-300")}>
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function AdminSettingsView() {
  const toast = useToast();
  const [welcome, setWelcome] = useState("5000");
  const [guest, setGuest] = useState("2000");
  const [daily, setDaily] = useState("500");
  const [flags, setFlags] = useState({ registrations: true, guests: true, maintenance: false, emailAlerts: true, autoBlock: false });
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const cfg = getBackendConfig();
    setApiUrl(cfg.baseUrl || "http://localhost:4000/api/v1");
    setApiToken(cfg.token);
    setConnected(isBackendConfigured(cfg));
  }, []);

  const toggles: { key: keyof typeof flags; label: string; note: string }[] = [
    { key: "registrations", label: "Open registrations", note: "Allow new players to create accounts." },
    { key: "guests", label: "Guest access", note: "Let visitors play without an account." },
    { key: "maintenance", label: "Maintenance mode", note: "Show a maintenance notice to players." },
    { key: "emailAlerts", label: "Admin email alerts", note: "Email the team about blocked accounts and failed transactions." },
    { key: "autoBlock", label: "Auto-block suspicious activity", note: "Block accounts with repeated failed claims." },
  ];

  const saveBackend = () => {
    saveBackendConfig({ baseUrl: apiUrl, token: apiToken });
    const nowConnected = isBackendConfigured({ baseUrl: apiUrl.trim(), token: apiToken.trim() });
    setConnected(nowConnected);
    toast(nowConnected ? "Backend API settings saved for this browser tab." : "Backend API token cleared; using demo fallback.");
  };

  const clearBackend = () => {
    saveBackendConfig({ baseUrl: "", token: "" });
    setApiToken("");
    setConnected(false);
    toast("Backend API credentials cleared.", "info");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Platform Settings" description="Platform defaults for new players, console behaviour and optional live backend connection." actions={<AButton variant="primary" onClick={() => toast("Platform settings saved (demo local state).")}>Save changes</AButton>} />

      <Card>
        <CardHeader title="Starting points (Demo local state)" description="Virtual points granted automatically. No cash value." />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <AInput label="Welcome bonus" type="number" value={welcome} onChange={(e) => setWelcome(e.target.value)} hint="Registered players" />
          <AInput label="Guest starter points" type="number" value={guest} onChange={(e) => setGuest(e.target.value)} hint="Guest sessions" />
          <AInput label="Daily login reward" type="number" value={daily} onChange={(e) => setDaily(e.target.value)} hint="Per day" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Platform controls (Demo local state)" />
        <ul className="divide-y divide-slate-100">
          {toggles.map((t) => (
            <li key={t.key} className="flex items-center justify-between gap-6 px-5 py-4">
              <div><p className="text-sm font-medium text-slate-900">{t.label}</p><p className="text-[13px] text-slate-500">{t.note}</p></div>
              <Switch label={t.label} on={flags[t.key]} onChange={(v) => setFlags((f) => ({ ...f, [t.key]: v }))} />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title="NestJS Backend API Connection (Optional)"
          description="Connect Game Categories, Game History & RNG Audit, and Audit Logs to a running NestJS backend. Stored in sessionStorage only."
          action={<Badge tone={connected ? "green" : "amber"} dot>{connected ? "Configured" : "Demo fallback"}</Badge>}
        />
        <div className="space-y-4 p-5">
          <AInput label="API Base URL" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="http://localhost:4000/api/v1" hint="Defaults to NEXT_PUBLIC_API_URL when set." />
          <AInput label="Super Admin / Admin JWT Access Token" type="password" value={apiToken} onChange={(e) => setApiToken(e.target.value)} placeholder="Bearer token from POST /api/v1/auth/login" hint="Does not affect demo login; used only by backend-integrated Super Admin views." />
          <div className="flex flex-wrap gap-2">
            <AButton variant="primary" onClick={saveBackend}>Save connection</AButton>
            {connected && <AButton onClick={clearBackend}>Disconnect</AButton>}
          </div>
        </div>
      </Card>
    </div>
  );
}
