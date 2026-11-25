"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Loader2, MoreHorizontal, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dark "gaming platform" kit for the Game Management module. Deliberately independent from the light admin kit
 * in components/admin/ui.tsx: deep black and charcoal surfaces, champagne-gold accents, restrained neon cyan.
 */

/* ---------- Surfaces ---------- */

export const GM_BG = "radial-gradient(1100px 420px at 12% -8%, rgba(212,175,79,.10), transparent 60%), radial-gradient(900px 380px at 100% 0%, rgba(111,242,255,.05), transparent 55%), #07070a";

export function GmCard({ children, className, glow }: { children: ReactNode; className?: string; glow?: "gold" | "cyan" | "violet" | "red" }) {
  return (
    <section
      className={cn(
        "relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_24px_48px_-28px_rgba(0,0,0,.9)]",
        glow === "gold" && "border-gold-400/25 shadow-[inset_0_1px_0_rgba(226,196,122,.12),0_0_40px_-18px_rgba(212,175,79,.45)]",
        glow === "cyan" && "border-neon-cyan/20 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_0_40px_-20px_rgba(111,242,255,.4)]",
        glow === "violet" && "border-neon-violet/25",
        glow === "red" && "border-rose-400/25",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function GmCardHeader({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold-400/25 bg-gold-400/10 text-gold-300 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
        <div className="min-w-0">
          <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-white">{title}</h2>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-white/50">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function GmPageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 font-num text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-400">{eyebrow}</p>}
        <h1 className="font-display text-xl font-semibold tracking-wide text-white sm:text-2xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Buttons ---------- */

type Variant = "gold" | "neon" | "outline" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  gold: "bg-gradient-to-b from-gold-300 to-gold-500 text-[#1a1306] shadow-[0_8px_24px_-8px_rgba(212,175,79,.6)] hover:brightness-110",
  neon: "bg-neon-cyan/10 text-neon-cyan ring-1 ring-neon-cyan/35 hover:bg-neon-cyan/15 hover:shadow-[0_0_24px_-8px_rgba(111,242,255,.7)]",
  outline: "bg-white/[0.04] text-white/85 ring-1 ring-white/12 hover:bg-white/[0.08] hover:ring-white/20",
  ghost: "text-white/65 hover:bg-white/[0.06] hover:text-white",
  danger: "bg-rose-500/12 text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-500/20",
};
const sizes = { sm: "h-8 px-3 text-[12.5px]", md: "h-10 px-4 text-sm", lg: "h-11 px-5 text-sm" };

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes; loading?: boolean };

export function GmButton({ variant = "outline", size = "md", loading, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/70 disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function GmLinkButton({ href, variant = "outline", size = "md", className, children, ...rest }: { href: string; variant?: Variant; size?: keyof typeof sizes; className?: string; children: ReactNode; target?: string; rel?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/70", variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Link>
  );
}

/* ---------- Badges ---------- */

export type GmTone = "green" | "amber" | "red" | "slate" | "blue" | "gold" | "violet" | "cyan";
const tones: Record<GmTone, string> = {
  green: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  amber: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  red: "bg-rose-400/10 text-rose-300 ring-rose-400/25",
  slate: "bg-white/[0.06] text-white/60 ring-white/10",
  blue: "bg-sky-400/10 text-sky-300 ring-sky-400/25",
  gold: "bg-gold-400/10 text-gold-300 ring-gold-400/30",
  violet: "bg-neon-violet/12 text-violet-300 ring-neon-violet/30",
  cyan: "bg-neon-cyan/10 text-neon-cyan ring-neon-cyan/25",
};

export function GmBadge({ tone = "slate", children, dot, className }: { tone?: GmTone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset", tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />}
      {children}
    </span>
  );
}

/* ---------- Stats ---------- */

export function GmStat({ label, value, hint, icon, tone = "gold" }: { label: string; value: string | number; hint?: string; icon: ReactNode; tone?: "gold" | "cyan" | "green" | "amber" | "violet" | "red" }) {
  const c = { gold: "text-gold-300 bg-gold-400/10 border-gold-400/25", cyan: "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/25", green: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25", amber: "text-amber-300 bg-amber-400/10 border-amber-400/25", violet: "text-violet-300 bg-neon-violet/10 border-neon-violet/25", red: "text-rose-300 bg-rose-400/10 border-rose-400/25" }[tone];
  return (
    <GmCard className="overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-medium leading-snug text-white/55">{label}</p>
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border [&>svg]:h-4 [&>svg]:w-4", c)}>{icon}</span>
      </div>
      <p className="mt-3 font-num text-[1.9rem] font-bold leading-none tabular-nums text-white">{value}</p>
      {hint && <p className="mt-2 text-xs text-white/40">{hint}</p>}
    </GmCard>
  );
}

/* ---------- Form controls ---------- */

export const gmControl =
  "h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/30 transition hover:border-white/20 focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:opacity-50";

export function GmField({ label, hint, error, required, className, children, htmlFor }: { label: string; hint?: string; error?: string | null; required?: boolean; className?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[12.5px] font-semibold text-white/75">
        {label}
        {required && <span className="ml-0.5 text-gold-400"> *</span>}
      </label>
      {children}
      {error ? <p role="alert" className="text-xs text-rose-300">{error}</p> : hint ? <p className="text-xs text-white/38">{hint}</p> : null}
    </div>
  );
}

export function GmInput({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input aria-invalid={invalid || undefined} className={cn(gmControl, invalid && "!border-rose-400/60", className)} {...rest} />;
}

export function GmSelect({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(gmControl, "cursor-pointer pr-8 [&>option]:bg-[#0b0b0f]", className)} {...rest}>
      {children}
    </select>
  );
}

export function GmTextarea({ invalid, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea aria-invalid={invalid || undefined} className={cn(gmControl, "h-auto min-h-[88px] resize-y py-2.5 leading-relaxed", invalid && "!border-rose-400/60", className)} {...rest} />;
}

export function GmSearch({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      <input type="search" className={cn(gmControl, "pl-9 [&::-webkit-search-cancel-button]:hidden")} {...rest} />
    </div>
  );
}

export function GmToggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white/90">{label}</p>
        {description && <p className="mt-0.5 text-[13px] leading-relaxed text-white/45">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/70 disabled:opacity-45", checked ? "border-gold-400/50 bg-gold-400/30" : "border-white/12 bg-white/[0.06]")}
      >
        <span className={cn("absolute top-0.5 h-[18px] w-[18px] rounded-full transition-all", checked ? "left-[22px] bg-gold-300 shadow-[0_0_10px_rgba(226,196,122,.7)]" : "left-0.5 bg-white/55")} />
      </button>
    </div>
  );
}

export function GmSegmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-xl border border-white/10 bg-black/40 p-1">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)} className={cn("h-8 flex-1 rounded-lg px-3 text-[13px] font-semibold transition", value === o.id ? "bg-gold-400/20 text-gold-200 ring-1 ring-gold-400/35" : "text-white/55 hover:text-white")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Progress ---------- */

export function GmProgress({ value, tone = "gold", size = "md", className, label }: { value: number; tone?: "gold" | "cyan" | "green"; size?: "sm" | "md" | "lg"; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const fill = { gold: "from-gold-500 via-gold-300 to-[#fff3c4]", cyan: "from-sky-500 via-neon-cyan to-[#d2fbff]", green: "from-emerald-500 via-emerald-300 to-emerald-100" }[tone];
  const glow = { gold: "rgba(212,175,79,.75)", cyan: "rgba(111,242,255,.7)", green: "rgba(52,211,153,.7)" }[tone];
  return (
    <div role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className={cn("relative w-full overflow-hidden rounded-full border border-white/10 bg-black/60", size === "sm" ? "h-1.5" : size === "md" ? "h-2.5" : "h-4", className)}>
      <div className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-150 ease-out", fill)} style={{ width: `${v}%`, boxShadow: `0 0 14px ${glow}` }} />
      {size !== "sm" && <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 calc(10% - 2px), rgba(7,7,10,.85) calc(10% - 2px) 10%)" }} />}
    </div>
  );
}

/* ---------- Overlays ---------- */

export function GmDialog({ open, onClose, title, description, children, footer, size = "md", dismissible = true }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg"; dismissible?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissible && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, dismissible]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <button aria-label="Close dialog" tabIndex={-1} className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" onClick={() => dismissible && onClose()} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn("relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-gold-400/20 bg-[#0d0d12] font-sans text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,.95),0_0_60px_-30px_rgba(212,175,79,.5)] sm:rounded-2xl", size === "sm" && "sm:max-w-md", size === "md" && "sm:max-w-xl", size === "lg" && "sm:max-w-3xl")}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
              <div className="min-w-0">
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-white">{title}</h2>
                {description && <p className="mt-1 text-[13px] leading-relaxed text-white/50">{description}</p>}
              </div>
              {dismissible && (
                <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] bg-black/30 px-5 py-3.5 sm:flex-row sm:justify-end">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Confirmation for any important or destructive action. `onConfirm` may be async; the dialog waits for it. */
export function GmConfirm({ open, onClose, onConfirm, title, body, confirmLabel, tone = "gold" }: { open: boolean; onClose: () => void; onConfirm: () => Promise<unknown> | unknown; title: string; body: ReactNode; confirmLabel: string; tone?: "gold" | "danger" }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      onClose();
    }
  };
  return (
    <GmDialog
      open={open}
      onClose={() => !busy && onClose()}
      title={title}
      size="sm"
      dismissible={!busy}
      footer={
        <>
          <GmButton variant="ghost" onClick={onClose} disabled={busy}>Cancel</GmButton>
          <GmButton variant={tone === "danger" ? "danger" : "gold"} onClick={run} loading={busy}>{confirmLabel}</GmButton>
        </>
      }
    >
      <div className="flex gap-3">
        <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tone === "danger" ? "bg-rose-500/15 text-rose-300" : "bg-gold-400/12 text-gold-300")}>
          <AlertTriangle className="h-[18px] w-[18px]" />
        </span>
        <div className="space-y-2 text-sm leading-relaxed text-white/65">{body}</div>
      </div>
    </GmDialog>
  );
}

/* ---------- Menus ---------- */

export interface GmMenuItem {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  href?: string;
  tone?: "danger";
  disabled?: boolean;
  divider?: boolean;
}

export function GmMenu({ items, label = "Actions" }: { items: GmMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const cls = (i: GmMenuItem) => cn("flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition hover:bg-white/[0.07] disabled:opacity-40 [&>svg]:h-4 [&>svg]:w-4", i.tone === "danger" ? "text-rose-300" : "text-white/80");
  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:text-white">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-1.5 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#101015] py-1 shadow-[0_20px_40px_-12px_rgba(0,0,0,.9)]">
          {items.map((i) => (
            <div key={i.label} className={cn(i.divider && "mt-1 border-t border-white/[0.07] pt-1")}>
              {i.href ? (
                <Link role="menuitem" href={i.href} onClick={() => setOpen(false)} className={cls(i)}>{i.icon}{i.label}</Link>
              ) : (
                <button role="menuitem" type="button" disabled={i.disabled} onClick={() => { setOpen(false); i.onSelect?.(); }} className={cls(i)}>{i.icon}{i.label}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Tables ---------- */

export function GmTh({ children, align = "left", className }: { children?: ReactNode; align?: "left" | "right"; className?: string }) {
  return <th scope="col" className={cn("whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40", align === "right" ? "text-right" : "text-left", className)}>{children}</th>;
}

export function GmSortTh({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th scope="col" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"} className="whitespace-nowrap px-4 py-3 text-left">
      <button onClick={onClick} className={cn("inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition hover:text-white", active ? "text-gold-300" : "text-white/40")}>
        {label}
        <Icon className={cn("h-3.5 w-3.5", !active && "opacity-50")} />
      </button>
    </th>
  );
}

export function GmPagination({ page, pageSize, total, onPage, onPageSize }: { page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize?: (n: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold ring-1 ring-white/10 transition hover:bg-white/[0.07] disabled:opacity-35";
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3 text-[13px] text-white/50 sm:flex-row">
      <div className="flex items-center gap-3">
        <span>Showing <b className="font-semibold text-white/85">{from}–{to}</b> of <b className="font-semibold text-white/85">{total}</b></span>
        {onPageSize && (
          <select aria-label="Rows per page" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="h-8 rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-white [&>option]:bg-[#0b0b0f]">
            {[5, 10, 25].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        )}
      </div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} className={btn}><ChevronLeft className="h-4 w-4" /></button>
        {Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5).map((n) => (
          <button key={n} onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined} className={cn(btn, n === page && "bg-gold-400/15 text-gold-200 ring-gold-400/40")}>{n}</button>
        ))}
        <button aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} className={btn}><ChevronRight className="h-4 w-4" /></button>
      </nav>
    </div>
  );
}

/* ---------- States ---------- */

export function GmEmpty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/40 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-white/45">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function GmSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-white/[0.06]", className)} />;
}

export function GmNotice({ tone = "gold", title, children, icon }: { tone?: "gold" | "cyan" | "red" | "green"; title?: string; children: ReactNode; icon?: ReactNode }) {
  const c = { gold: "border-gold-400/25 bg-gold-400/[0.06] text-gold-200", cyan: "border-neon-cyan/25 bg-neon-cyan/[0.05] text-cyan-100", red: "border-rose-400/30 bg-rose-500/[0.07] text-rose-200", green: "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-200" }[tone];
  return (
    <div role={tone === "red" ? "alert" : "note"} className={cn("flex gap-3 rounded-xl border px-4 py-3 text-[13px] leading-relaxed", c)}>
      {icon && <span className="mt-0.5 shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && "mt-0.5", "text-white/65")}>{children}</div>
      </div>
    </div>
  );
}
