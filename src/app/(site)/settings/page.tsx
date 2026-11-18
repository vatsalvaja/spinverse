"use client";

import { useState } from "react";
import { Bell, Eye, Gauge, Volume2 } from "lucide-react";
import { Reveal } from "@/components/art/Reveal";
import { Btn, PageBanner, SectionHeader } from "@/components/site/ui";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn("relative h-7 w-[52px] shrink-0 rounded-full border transition", on ? "border-gold-200/60 bg-gold-300/25 shadow-[0_0_20px_-4px_rgba(240,200,100,.7)]" : "border-white/15 bg-white/[0.06]")}>
      <span className={cn("absolute top-[3px] h-5 w-5 rounded-full transition-all", on ? "left-[28px] bg-gradient-to-b from-[#fff3c4] to-[#e3b951]" : "left-[3px] bg-obsidian-300")} />
    </button>
  );
}

const GROUPS = [
  {
    title: "Sound & motion",
    kicker: "How the lounge feels",
    icon: Volume2,
    items: [
      { key: "sfx", label: "Sound effects", note: "Reel spins, wins and menu sounds", on: true },
      { key: "music", label: "Ambient music", note: "Soft background score in the lounge", on: false },
      { key: "motion", label: "Reduce motion", note: "Tone down animated glows and transitions", on: false },
    ],
  },
  {
    title: "Notifications",
    kicker: "What we nudge you about",
    icon: Bell,
    items: [
      { key: "mission", label: "Mission reminders", note: "A nudge when daily missions reset", on: true },
      { key: "reward", label: "Reward alerts", note: "When a reward is ready to claim", on: true },
      { key: "news", label: "New game announcements", note: "Be first to hear about new worlds", on: false },
    ],
  },
  {
    title: "Privacy",
    kicker: "Who sees what",
    icon: Eye,
    items: [
      { key: "board", label: "Show me on the leaderboard", note: "Hide your name and use an alias instead", on: true },
      { key: "online", label: "Show online status", note: "Let other players see when you’re active", on: false },
    ],
  },
];

export default function SettingsPage() {
  const toast = useToast();
  const [state, setState] = useState<Record<string, boolean>>(Object.fromEntries(GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.on]))));
  const [quality, setQuality] = useState("high");

  return (
    <div className="pb-10">
      <PageBanner world="atlantis-cascade" kicker="Control deck" title="Settings" subtitle="Tune the lounge to the way you like to play." />
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
        <div className="space-y-6">
          {GROUPS.map(({ title, kicker, icon: Icon, items }) => (
            <Reveal key={title}>
              <section className="sv-panel p-6 sm:p-8">
                <SectionHeader kicker={kicker} title={title} className="!mb-3" action={<span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-300/10 ring-1 ring-gold-300/30"><Icon className="h-5 w-5 text-gold-200" /></span>} />
                <ul className="divide-y divide-white/[0.07]">
                  {items.map((i) => (
                    <li key={i.key} className="flex items-center justify-between gap-4 py-4">
                      <div>
                        <p className="text-[15px] font-medium text-white">{i.label}</p>
                        <p className="text-sm text-obsidian-300">{i.note}</p>
                      </div>
                      <Toggle label={i.label} on={state[i.key]} onChange={(v) => setState((s) => ({ ...s, [i.key]: v }))} />
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          ))}

          <Reveal>
            <section className="sv-panel p-6 sm:p-8">
              <SectionHeader kicker="Performance" title="Graphics quality" className="!mb-5" action={<span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-300/10 ring-1 ring-gold-300/30"><Gauge className="h-5 w-5 text-gold-200" /></span>} />
              <div className="grid grid-cols-3 gap-3">
                {["low", "medium", "high"].map((q) => (
                  <button key={q} aria-pressed={quality === q} onClick={() => setQuality(q)} className={cn("rounded-2xl border py-4 text-sm font-semibold capitalize transition", quality === q ? "border-gold-200/70 bg-gold-300/15 text-gold-50 shadow-[0_0_24px_-6px_rgba(240,200,100,.6)]" : "border-white/10 text-obsidian-200 hover:text-white")}>{q}</button>
                ))}
              </div>
            </section>
          </Reveal>

          <div className="flex justify-end">
            <Btn size="lg" onClick={() => toast("Settings saved.")}>Save settings</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
