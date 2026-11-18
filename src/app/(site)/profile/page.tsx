"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Calendar, Coins, Crown, Gamepad2, Globe2, Mail, Pencil, ShieldCheck, Trophy } from "lucide-react";
import { GameTitle } from "@/components/art/GameTitle";
import { Reveal } from "@/components/art/Reveal";
import { WORLD } from "@/components/art/worlds";
import { LiveArt, WorldArt } from "@/components/art/WorldArt";
import { Field } from "@/components/site/forms";
import { HexAvatar } from "@/components/site/HexAvatar";
import { MembershipBadge } from "@/components/site/MembershipBadge";
import { Medal, MEDAL_ICON, TIER } from "@/components/site/Medal";
import { usePlay } from "@/components/site/PlayModal";
import { Ring } from "@/components/site/Ring";
import { Btn, BtnLink, Chip, PlayButton, ProgressBar, SectionHeader, Wrap } from "@/components/site/ui";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ACHIEVEMENTS } from "@/data/engagement";
import { GAMES, GAME_BY_ID } from "@/data/games";
import { useDemoData } from "@/data/provider";
import { useSession } from "@/lib/session";
import { cn, formatDate, formatPoints } from "@/lib/utils";

/** A collectible player card that tilts toward the pointer. */
function PlayerCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
    el.style.setProperty("--sheen", `${50 + x * 80}%`);
  };
  const leave = () => ref.current && (ref.current.style.transform = "perspective(900px) rotateX(0) rotateY(0)");
  return (
    <div onPointerMove={move} onPointerLeave={leave} ref={ref} className="sv-chamfer relative w-full max-w-[340px] border border-gold-200/40 bg-gradient-to-br from-[#2a2112]/90 via-[#12121a]/95 to-[#0a0a10]/95 p-6 shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)] backdrop-blur transition-transform duration-200 ease-out" style={{ transformStyle: "preserve-3d" }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.14) var(--sheen, 50%), transparent 70%)" }} />
      {children}
    </div>
  );
}

const RANKS = [
  { min: 0, name: "Initiate" },
  { min: 10, name: "Adept" },
  { min: 25, name: "Master" },
  { min: 45, name: "Grandmaster" },
];
const rankFor = (n: number) => {
  let i = 0;
  RANKS.forEach((r, k) => n >= r.min && (i = k));
  const next = RANKS[i + 1];
  return { name: RANKS[i].name, level: i + 1, next, toNext: next ? next.min - n : 0, span: next ? next.min - RANKS[i].min : 1, into: n - RANKS[i].min };
};

export default function ProfilePage() {
  const { player, mode, signIn } = useSession();
  const { updateUser, transactionsFor } = useDemoData();
  const toast = useToast();
  const play = usePlay();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "" });

  const mastery = useMemo(() => {
    const counts: Record<string, number> = {};
    if (player) transactionsFor(player.id).forEach((t) => t.type === "spent" && t.status === "completed" && t.game && (counts[t.game] = (counts[t.game] ?? 0) + 1));
    return counts;
  }, [player, transactionsFor]);

  if (!player) return null;
  const done = ACHIEVEMENTS.filter((a) => a.progress >= a.target);
  const next = ACHIEVEMENTS.filter((a) => a.progress < a.target).sort((a, b) => b.progress / b.target - a.progress / a.target).slice(0, 3);
  const isGuest = mode === "guest";
  const fav = GAME_BY_ID[player.favoriteGame];
  const fw = WORLD[player.favoriteGame];
  const level = 1 + Math.floor(player.totalEarned / 5000);
  const totalSessions = Object.values(mastery).reduce((s, n) => s + n, 0) || 1;
  const favSessions = mastery[player.favoriteGame] ?? 0;
  const favRank = rankFor(favSessions);

  const openEdit = () => {
    setForm({ name: player.name, username: player.username, email: player.email });
    setEditing(true);
  };
  const save = () => {
    if (form.name.trim().length < 2 || form.username.trim().length < 3) return toast("Name and username need a few more characters.", "error");
    updateUser(player.id, { name: form.name.trim(), username: form.username.trim(), email: form.email.trim() });
    if (!isGuest) signIn({ name: form.name.trim(), username: form.username.trim(), email: form.email.trim() });
    setEditing(false);
    toast("Profile updated.");
  };

  const stats = [
    { icon: Coins, label: "Virtual points", value: formatPoints(player.balance) },
    { icon: Gamepad2, label: "Games played", value: formatPoints(player.gamesPlayed) },
    { icon: Trophy, label: "Medals earned", value: `${done.length}/${ACHIEVEMENTS.length}` },
    { icon: Crown, label: "Player level", value: String(level) },
  ];

  return (
    <div className="pb-10">
      <section className="relative isolate overflow-hidden" data-parallax-root>
        <WorldArt gameId={player.favoriteGame} className="-z-20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#05050a] via-[#05050a]/80 to-[#05050a]/30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#06060b] via-transparent to-[#06060b]/60" />
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(60% 60% at 10% 100%, ${fw.glow}, transparent 70%)` }} />
        <Wrap className="grid items-center gap-12 pb-24 pt-24 sm:pt-28 lg:grid-cols-[1.4fr_1fr]">
          <div className="sv-rise-in">
            <p className="sv-serif text-2xl sm:text-3xl" style={{ color: fw.primary }}>Player identity</p>
            <div className="mt-6 flex flex-col gap-7 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <Ring value={player.totalEarned % 5000} max={5000} size={196} stroke={5} color={fw.primary}>
                  <HexAvatar name={player.name} size={136} />
                </Ring>
                <span className="sv-num absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-gold-200/60 bg-obsidian-900 px-3.5 py-1 text-sm font-bold text-gold-100 shadow-lg">LEVEL {level}</span>
              </div>
              <div className="min-w-0">
                <h1 className="sv-display text-balance text-[clamp(2.2rem,5.4vw,4.4rem)] font-bold leading-[1] text-white">{player.name}</h1>
                <p className="mt-2 text-xl text-obsidian-100">@{player.username}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <MembershipBadge tier={player.membership} />
                  <Chip tone="neutral" className="!text-sm"><Globe2 className="h-3.5 w-3.5" /> {player.country}</Chip>
                  <Chip tone="neutral" className="!text-sm"><Calendar className="h-3.5 w-3.5" /> Since {formatDate(player.registeredAt)}</Chip>
                </div>
              </div>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              {isGuest ? <BtnLink href="/register" size="lg">Create account</BtnLink> : <Btn size="lg" onClick={openEdit}><Pencil className="h-4 w-4" /> Edit profile</Btn>}
              <BtnLink href="/achievements" variant="outline" size="lg">View all medals</BtnLink>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PlayerCard>
              <div className="flex items-start justify-between">
                <p className="sv-display text-xs font-semibold tracking-[0.35em] text-gold-200">SPINVERSE</p>
                <span className="sv-num rounded border border-gold-300/50 px-2 py-0.5 text-xs font-bold text-gold-100">LV {level}</span>
              </div>
              <div className="mt-5 flex justify-center"><HexAvatar name={player.name} size={124} /></div>
              <p className="sv-display mt-5 text-center text-xl font-bold text-white">{player.name}</p>
              <p className="sv-serif text-center text-xl" style={{ color: fw.primary }}>{fav.name}</p>
              <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                <div><dd className="sv-num text-lg font-bold text-white">{formatPoints(player.balance)}</dd><dt className="text-xs text-obsidian-300">Points</dt></div>
                <div><dd className="sv-num text-lg font-bold text-white">{player.gamesPlayed}</dd><dt className="text-xs text-obsidian-300">Games</dt></div>
                <div><dd className="sv-num text-lg font-bold text-white">{done.length}</dd><dt className="text-xs text-obsidian-300">Medals</dt></div>
              </dl>
              <p className="sv-num mt-4 text-center text-xs tracking-[0.3em] text-obsidian-300">{player.id}</p>
            </PlayerCard>
          </div>
        </Wrap>
      </section>

      <Wrap className="relative z-10 -mt-12">
        <Reveal>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="sv-glass rounded-3xl p-5 sm:p-6">
                <Icon className="h-5 w-5 text-gold-300" />
                <p className="sv-num mt-3 text-[2rem] font-extrabold leading-none text-white sm:text-[2.4rem]">{value}</p>
                <p className="mt-2 text-sm text-obsidian-200">{label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* favorite world + mastery */}
        <div className="mt-24 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <article data-parallax-root className={cn("group relative isolate flex min-h-[460px] items-end overflow-hidden bg-black", fw.shapeClass)}>
              <div className="absolute inset-0 -z-10 transition-transform duration-[1400ms] group-hover:scale-[1.05]"><LiveArt gameId={player.favoriteGame} /></div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/35 to-transparent" />
              <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(80% 60% at 20% 100%, ${fw.glow}, transparent 70%)` }} />
              <div className="p-7 sm:p-9">
                <Chip className="!text-xs"><Crown className="h-3.5 w-3.5" /> Favorite world</Chip>
                <GameTitle gameId={player.favoriteGame} className="mt-4 text-[clamp(2.2rem,4.4vw,3.6rem)]" />
                <p className="sv-serif mt-2 text-2xl text-obsidian-100">{favRank.name} · {favSessions} sessions</p>
                <div className="mt-6"><PlayButton gameId={player.favoriteGame} onClick={() => play(player.favoriteGame)}>Play now</PlayButton></div>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="sv-panel h-full p-7 sm:p-8">
              <SectionHeader kicker="Time in each world" title="World mastery" className="!mb-7" />
              <ul className="space-y-7">
                {GAMES.map((g) => {
                  const n = mastery[g.id] ?? 0;
                  const r = rankFor(n);
                  const w = WORLD[g.id];
                  return (
                    <li key={g.id}>
                      <div className="mb-2.5 flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2.5 text-base font-semibold text-white"><span className="h-2.5 w-2.5 rounded-full" style={{ background: w.primary, boxShadow: `0 0 10px ${w.primary}` }} />{g.name}</span>
                        <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: w.primary, background: `${w.primary}1f`, border: `1px solid ${w.primary}55` }}>{r.name}</span>
                      </div>
                      <ProgressBar value={r.into} max={r.span} color={w.primary} />
                      <p className="mt-2 text-[13px] text-obsidian-300">{n} sessions{r.next ? ` · ${r.toNext} more to ${r.next.name}` : " · top rank reached"}</p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-7 border-t border-white/10 pt-5 text-sm text-obsidian-300">{Math.round(((mastery[player.favoriteGame] ?? 0) / totalSessions) * 100)}% of your sessions are in {fav.name}.</p>
            </div>
          </Reveal>
        </div>

        {/* medal showcase */}
        <Reveal className="mt-24">
          <SectionHeader kicker="Your finest" title="Medal showcase" action={<Link href="/achievements" className="text-sm font-semibold text-gold-300 hover:text-gold-100">All medals</Link>} />
          <div className="sv-panel p-6 sm:p-10">
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {done.slice(0, 4).map((a, i) => (
                <div key={a.id} className="text-center">
                  <Medal tier={a.tier} unlocked icon={MEDAL_ICON[a.id]} size={120} delay={i * 0.1} />
                  <p className="mt-2 text-base font-semibold text-white">{a.title}</p>
                  <p className="text-sm" style={{ color: TIER[a.tier].b }}>{TIER[a.tier].name}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 border-t border-white/10 pt-8">
              <p className="mb-5 text-sm font-semibold tracking-wide text-obsidian-200">Closest to unlocking</p>
              <ul className="grid gap-6 md:grid-cols-3">
                {next.map((a) => (
                  <li key={a.id} className="flex items-center gap-4">
                    <Ring value={a.progress} max={a.target} size={68} stroke={4} color={TIER[a.tier].b}>
                      <span className="flex h-7 w-7 text-white/90 [&>svg]:h-full [&>svg]:w-full">{MEDAL_ICON[a.id]}</span>
                    </Ring>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-white">{a.title}</p>
                      <p className="sv-num text-sm text-obsidian-200">{formatPoints(a.progress)} / {formatPoints(a.target)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* account details */}
        <Reveal className="mt-24">
          <SectionHeader kicker="Account" title="Details" />
          <dl className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Mail, k: "Email", v: player.email || "Not provided (guest)" },
              { icon: Calendar, k: "Member since", v: formatDate(player.registeredAt) },
              { icon: ShieldCheck, k: "Membership status", v: isGuest ? "Guest access" : `${player.membership} · Good standing` },
            ].map(({ icon: I, k, v }) => (
              <div key={k} className="sv-glass flex items-start gap-4 rounded-3xl p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-300/10 ring-1 ring-gold-300/25"><I className="h-5 w-5 text-gold-300" /></span>
                <div className="min-w-0"><dt className="text-sm text-obsidian-300">{k}</dt><dd className="mt-1 truncate text-base font-medium text-white">{v}</dd></div>
              </div>
            ))}
          </dl>
        </Reveal>
      </Wrap>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit profile" description="Changes apply to this demo session." footer={<><Btn variant="dark" onClick={() => setEditing(false)}>Cancel</Btn><Btn onClick={save}>Save changes</Btn></>}>
        <div className="space-y-4">
          <Field label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
