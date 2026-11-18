import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden>
      <defs>
        <linearGradient id="sv-lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbf6e8" />
          <stop offset=".45" stopColor="#d4af4f" />
          <stop offset="1" stopColor="#8a6420" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill="none" stroke="url(#sv-lm)" strokeWidth="1.6" />
      <ellipse cx="24" cy="24" rx="21" ry="8" fill="none" stroke="url(#sv-lm)" strokeWidth="1" opacity=".7" transform="rotate(-28 24 24)" />
      <path
        d="M30.5 16.2c-1.5-1.6-3.7-2.5-6.3-2.5-3.7 0-6.2 1.8-6.2 4.7 0 6.2 12.8 3.4 12.8 9.6 0 3-2.7 5-6.5 5-2.9 0-5.4-1.1-7-3"
        fill="none"
        stroke="url(#sv-lm)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="40.3" cy="14.3" r="2.2" fill="#fbf6e8" />
    </svg>
  );
}

export function Logo({ href = "/dashboard", className, compact = false }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="SPINVERSE home">
      <LogoMark className="transition-transform duration-700 group-hover:rotate-[24deg]" />
      {!compact && (
        <span className="sv-display sv-gold-text text-[1.55rem] font-semibold leading-none tracking-[0.2em]">SPINVERSE</span>
      )}
    </Link>
  );
}
