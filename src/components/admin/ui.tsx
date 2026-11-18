"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Buttons ---------- */
type BVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
const bv: Record<BVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-panel",
  secondary: "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 shadow-panel",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-panel",
  gold: "bg-gradient-to-b from-gold-300 to-gold-500 text-slate-900 hover:brightness-105 shadow-panel",
};
const bs = { sm: "h-8 px-3 text-[13px]", md: "h-9 px-3.5 text-sm", lg: "h-10 px-4 text-sm" };

export function AButton({ variant = "secondary", size = "md", className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BVariant; size?: keyof typeof bs }) {
  return <button className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition disabled:pointer-events-none disabled:opacity-50", bv[variant], bs[size], className)} {...rest} />;
}

export function ALinkButton({ href, variant = "secondary", size = "md", className, children }: { href: string; variant?: BVariant; size?: keyof typeof bs; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition", bv[variant], bs[size], className)}>
      {children}
    </Link>
  );
}

/* ---------- Badge ---------- */
export type Tone = "green" | "amber" | "red" | "slate" | "blue" | "gold";
const tones: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  gold: "bg-gold-50 text-gold-700 ring-gold-500/30",
};
export function Badge({ tone = "slate", children, dot = false }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------- Cards ---------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-slate-200 bg-white shadow-panel", className)}>{children}</section>;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, delta }: { label: string; value: string; hint?: string; icon: ReactNode; delta?: { text: string; up: boolean } }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <p className="mt-3 text-[1.65rem] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">{value}</p>
      <div className="mt-2.5 flex items-center gap-2 text-xs">
        {delta && <span className={cn("font-semibold", delta.up ? "text-emerald-600" : "text-rose-600")}>{delta.up ? "▲" : "▼"} {delta.text}</span>}
        {hint && <span className="text-slate-500">{hint}</span>}
      </div>
    </Card>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Form controls ---------- */
const ctl = "h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 transition hover:border-slate-400 focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-400/30";

export function SearchInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input type="search" className={cn(ctl, "w-full pl-9")} {...rest} />
    </div>
  );
}

export function ASelect({ label, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className={cn("flex flex-col gap-1 text-xs font-medium text-slate-500", className)}>
      {label}
      <select className={cn(ctl, "pr-8 text-slate-800")} {...rest}>
        {children}
      </select>
    </label>
  );
}

export function AInput({ label, className, hint, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={cn("flex flex-col gap-1 text-[13px] font-medium text-slate-600", className)}>
      {label}
      <input className={cn(ctl, "w-full font-normal")} {...rest} />
      {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
    </label>
  );
}

/* ---------- Table helpers ---------- */
export function SortHeader({ label, active, dir, onClick, align = "left" }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void; align?: "left" | "right" }) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th scope="col" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"} className={cn("whitespace-nowrap px-4 py-3 text-xs font-medium", align === "right" ? "text-right" : "text-left")}>
      <button onClick={onClick} className={cn("ad-th-btn", active && "!text-slate-900", align === "right" && "flex-row-reverse")}>
        {label}
        <Icon className={cn("h-3.5 w-3.5", !active && "opacity-40")} />
      </button>
    </th>
  );
}

export function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <th scope="col" className={cn("whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-500", align === "right" ? "text-right" : "text-left")}>
      {children}
    </th>
  );
}

export function Pagination({ page, pageSize, total, onPage, onPageSize }: { page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize?: (n: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-[13px] text-slate-500 sm:flex-row">
      <div className="flex items-center gap-3">
        <span>Showing <b className="font-semibold text-slate-800">{from}–{to}</b> of <b className="font-semibold text-slate-800">{total.toLocaleString("en-US")}</b></span>
        {onPageSize && (
          <select aria-label="Rows per page" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs">
            {[10, 15, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        )}
      </div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} className="flex h-8 w-8 items-center justify-center rounded-md ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-1.5">…</span>
          ) : (
            <button key={n} onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined} className={cn("h-8 min-w-8 rounded-md px-2 text-xs font-medium", n === page ? "bg-slate-900 text-white" : "ring-1 ring-slate-200 hover:bg-slate-50")}>
              {n}
            </button>
          ),
        )}
        <button aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} className="flex h-8 w-8 items-center justify-center rounded-md ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
      </nav>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Search className="h-5 w-5" /></span>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
