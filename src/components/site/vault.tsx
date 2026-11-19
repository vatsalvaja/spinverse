"use client";

import { useId, useState, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { passwordStrength } from "@/components/site/forms";
import { cn } from "@/lib/utils";

export const VAULT_CSS = `
.vl-root{background:
  radial-gradient(900px 620px at 50% 42%, rgba(122,92,255,.20), transparent 62%),
  radial-gradient(700px 500px at 50% 58%, rgba(230,193,112,.10), transparent 65%),
  linear-gradient(180deg,#06060c,#04040a 70%,#07060d)}
.vl-floor{position:absolute;inset:auto 0 0 0;height:46%;pointer-events:none;opacity:.55;transform-origin:50% 0;
  background-image:linear-gradient(rgba(230,193,112,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(230,193,112,.12) 1px,transparent 1px);
  background-size:64px 64px;transform:perspective(520px) rotateX(62deg);
  -webkit-mask-image:linear-gradient(180deg,transparent,#000 70%);mask-image:linear-gradient(180deg,transparent,#000 70%)}
.vl-rings{position:absolute;left:50%;top:46%;width:min(150vmin,1400px);aspect-ratio:1;translate:-50% -50%;pointer-events:none;opacity:.5}
.vl-ring-a{animation:vl-spin 140s linear infinite}.vl-ring-b{animation:vl-spin 220s linear infinite reverse}
@keyframes vl-spin{to{transform:rotate(360deg)}}
.vl-mote{position:absolute;bottom:-10px;width:3px;height:3px;border-radius:50%;background:#f6e3ae;opacity:0;box-shadow:0 0 8px #e6c170;animation:vl-rise linear infinite}
@keyframes vl-rise{0%{transform:translateY(0);opacity:0}15%{opacity:.8}100%{transform:translateY(-105vh) translateX(24px);opacity:0}}

.vl-door{position:relative;padding:10px;border-radius:38px;
  background:linear-gradient(135deg,#a3a8bd 0%,#464a5c 12%,#14151d 30%,#2d2f3d 50%,#0d0e15 70%,#50546a 88%,#a8aec2 100%);
  box-shadow:0 60px 120px -34px #000,0 0 0 1px rgba(255,255,255,.14),0 0 90px -16px rgba(230,193,112,.28),inset 0 2px 1px rgba(255,255,255,.4),inset 0 -4px 8px rgba(0,0,0,.65);
  transition:box-shadow .9s}
.vl-door[data-state="open"]{box-shadow:0 60px 120px -34px #000,0 0 0 1px rgba(255,236,170,.5),0 0 140px -6px rgba(230,193,112,.75),inset 0 2px 1px rgba(255,255,255,.5),inset 0 -4px 8px rgba(0,0,0,.65)}
.vl-door::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;overflow:hidden;
  background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.16) 50%,transparent 60%);background-size:260% 100%;background-position:130% 0;animation:vl-glint 7s ease-in-out 1.2s infinite}
@keyframes vl-glint{0%{background-position:130% 0}30%,100%{background-position:-60% 0}}
.vl-plate{position:relative;border-radius:29px;padding:26px 22px 22px;
  background:repeating-linear-gradient(90deg,rgba(255,255,255,.014) 0 2px,transparent 2px 5px),linear-gradient(180deg,#13141d,#090a11);
  box-shadow:inset 0 0 0 1px rgba(230,193,112,.32),inset 0 0 0 6px #090a11,inset 0 0 0 7px rgba(255,255,255,.07),inset 0 26px 50px -26px rgba(122,92,255,.22)}
.vl-bolt{position:absolute;width:15px;height:15px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#f4f1e6,#9a9eb2 40%,#3a3d4c 80%);box-shadow:0 2px 3px rgba(0,0,0,.7),inset 0 -1px 2px rgba(0,0,0,.5);transition:transform .7s cubic-bezier(.5,0,.2,1),opacity .7s}
.vl-bolt::after{content:"";position:absolute;left:3px;right:3px;top:50%;height:1.5px;background:#23252f;transform:translateY(-50%) rotate(var(--r,35deg))}
.vl-door[data-state="open"] .vl-bolt{transform:scale(.55) rotate(180deg);opacity:.55}

.vl-dial{filter:drop-shadow(0 10px 18px rgba(0,0,0,.8))}
.vl-hub{background:radial-gradient(circle at 35% 28%,#2a2c3a,#0b0c12 70%);box-shadow:inset 0 0 0 1.5px rgba(230,193,112,.55),inset 0 4px 10px rgba(0,0,0,.8),0 0 24px rgba(122,92,255,.25);transition:box-shadow .6s}
.vl-door[data-state="open"] .vl-hub,.vl-door[data-state="busy"] .vl-hub{box-shadow:inset 0 0 0 1.5px rgba(255,236,170,.9),inset 0 4px 10px rgba(0,0,0,.6),0 0 34px rgba(230,193,112,.7)}

.vl-slot{display:flex;align-items:center;gap:10px;height:54px;padding:0 14px;border-radius:16px;background:linear-gradient(180deg,#05060a,#0a0b11);
  box-shadow:inset 0 4px 10px rgba(0,0,0,.85),inset 0 0 0 1px rgba(255,255,255,.07),0 1px 0 rgba(255,255,255,.09);transition:box-shadow .25s}
.vl-slot:hover{box-shadow:inset 0 4px 10px rgba(0,0,0,.85),inset 0 0 0 1px rgba(255,255,255,.16),0 1px 0 rgba(255,255,255,.09)}
.vl-slot:focus-within{box-shadow:inset 0 4px 10px rgba(0,0,0,.85),inset 0 0 0 1px rgba(230,193,112,.85),0 0 0 4px rgba(230,193,112,.12),0 10px 30px -12px rgba(230,193,112,.5)}
.vl-slot[data-bad="true"]{box-shadow:inset 0 4px 10px rgba(0,0,0,.85),inset 0 0 0 1px rgba(251,113,133,.7),0 0 0 4px rgba(251,113,133,.1)}
.vl-input{min-width:0;flex:1;background:transparent;height:100%;font-size:16px;color:#f4efe0}
.vl-input::placeholder{color:rgba(190,192,210,.38)}
.vl-input:focus{outline:none}
.vl-input:-webkit-autofill{-webkit-text-fill-color:#f4efe0;transition:background-color 9999s}

.vl-go{position:relative;overflow:hidden;display:flex;width:100%;height:56px;align-items:center;justify-content:center;gap:10px;border-radius:16px;font-weight:800;font-size:16px;letter-spacing:.02em;color:#1a1306;
  background:linear-gradient(180deg,#fff2c4 0%,#ecc86e 45%,#b78726 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.8),inset 0 -3px 5px rgba(120,70,0,.45),0 14px 34px -12px rgba(230,193,112,.65),0 0 0 1px rgba(90,60,10,.6);transition:transform .2s,filter .25s,box-shadow .3s}
.vl-go::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.6) 50%,transparent 70%);transform:translateX(-130%)}
.vl-go:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.07)}
.vl-go:hover:not(:disabled)::after{animation:vl-sweep .9s ease-out}
.vl-go:active:not(:disabled){transform:scale(.985)}
.vl-go:disabled{cursor:progress}
.vl-go:focus-visible,.vl-link:focus-visible,.vl-eye:focus-visible{outline:2px solid #fff0bd;outline-offset:3px}
@keyframes vl-sweep{to{transform:translateX(130%)}}
.vl-link{color:#e6c170;font-weight:600;transition:color .2s}.vl-link:hover{color:#fff0bd}
.vl-eye{color:rgba(190,192,210,.6);border-radius:10px;transition:color .2s}.vl-eye:hover{color:#fff}
.vl-flash{position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(60% 50% at 50% 30%,rgba(255,240,190,.55),transparent 70%);opacity:0}
.vl-door[data-state="open"] .vl-flash{animation:vl-flash 1s ease-out}
@keyframes vl-flash{0%{opacity:0}25%{opacity:1}100%{opacity:0}}

.vl-pick{display:flex;width:100%;align-items:center;gap:14px;padding:12px 14px;border-radius:16px;text-align:left;color:#d8d5e4;background:linear-gradient(180deg,#05060a,#0a0b11);
  box-shadow:inset 0 4px 10px rgba(0,0,0,.85),inset 0 0 0 1px rgba(255,255,255,.07),0 1px 0 rgba(255,255,255,.09);transition:box-shadow .25s,color .2s}
.vl-pick:hover{box-shadow:inset 0 4px 10px rgba(0,0,0,.85),inset 0 0 0 1px rgba(255,255,255,.18),0 1px 0 rgba(255,255,255,.09)}
.vl-pick[aria-pressed="true"]{color:#fff;box-shadow:inset 0 4px 10px rgba(0,0,0,.85),inset 0 0 0 1px rgba(230,193,112,.85),0 0 0 4px rgba(230,193,112,.1),0 10px 30px -12px rgba(230,193,112,.45)}
.vl-pick:focus-visible{outline:2px solid #fff0bd;outline-offset:3px}
.vl-sub{display:flex;align-items:center;justify-content:center;gap:12px;font-size:12px;font-weight:600;color:#9d9ab2}
.vl-dot{display:flex;height:22px;width:22px;align-items:center;justify-content:center;border-radius:50%;font-size:11px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);background:#05060a}
.vl-dot[data-on="true"]{color:#1a1306;background:linear-gradient(180deg,#fff2c4,#c8962f);box-shadow:none}
.vl-ghost{display:flex;height:56px;width:56px;flex-shrink:0;align-items:center;justify-content:center;border-radius:16px;color:#e6c170;background:linear-gradient(180deg,#05060a,#0a0b11);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);transition:box-shadow .25s,color .2s}
.vl-ghost:hover{color:#fff0bd;box-shadow:inset 0 0 0 1px rgba(230,193,112,.6)}
.vl-ghost:focus-visible{outline:2px solid #fff0bd;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.vl-ring-a,.vl-ring-b,.vl-mote,.vl-door::after{animation:none}}
`;

export function Slot({ label, icon, error, trailing, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; icon: ReactNode; error?: string; trailing?: ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block pl-1 text-[13px] font-medium text-[#c9c6d6]">{label}</label>
      <div className="vl-slot" data-bad={!!error}>
        <span className="text-[#e6c170]/80 [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
        <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn("vl-input", className)} {...rest} />
        {trailing}
      </div>
      {error && (
        <p id={`${id}-err`} className="mt-2 flex items-center gap-1.5 pl-1 text-[13px] text-rose-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

/** A combination dial: turns as the player types, spins while the vault opens. */
export function Dial({ turn, state, calm }: { turn: number; state: "idle" | "busy" | "open"; calm: boolean }) {
  const ticks = Array.from({ length: 48 }, (_, i) => i);
  return (
    <div className="vl-dial relative mx-auto h-[104px] w-[104px]">
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: turn }}
        transition={calm ? { duration: 0 } : state === "busy" ? { duration: 1.1, ease: [0.5, 0, 0.2, 1] } : { type: "spring", stiffness: 70, damping: 13 }}
      >
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="vl-steel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#d9dcea" />
              <stop offset=".35" stopColor="#5c6074" />
              <stop offset=".65" stopColor="#1b1c26" />
              <stop offset="1" stopColor="#9096ab" />
            </linearGradient>
            <linearGradient id="vl-brass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff0bd" />
              <stop offset=".5" stopColor="#d5a84a" />
              <stop offset="1" stopColor="#7c5614" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="57" fill="url(#vl-steel)" />
          <circle cx="60" cy="60" r="52" fill="#0b0c13" />
          {ticks.map((i) => (
            <line key={i} x1="60" y1="10.5" x2="60" y2={i % 4 === 0 ? 18 : 14.5} stroke={i % 4 === 0 ? "#e6c170" : "#6f7388"} strokeWidth={i % 4 === 0 ? 1.8 : 1} transform={`rotate(${i * 7.5} 60 60)`} />
          ))}
          <circle cx="60" cy="60" r="40" fill="none" stroke="url(#vl-brass)" strokeWidth="2" />
          {[0, 60, 120].map((a) => (
            <rect key={a} x="56.5" y="22" width="7" height="76" rx="3.5" fill="url(#vl-brass)" opacity=".92" transform={`rotate(${a} 60 60)`} />
          ))}
        </svg>
      </motion.div>
      <div className="vl-hub absolute inset-[30px] flex items-center justify-center rounded-full">
        {state === "open" ? <Check className="h-5 w-5 text-[#fff0bd]" strokeWidth={3} /> : <Lock className="h-[18px] w-[18px] text-[#e6c170]" />}
      </div>
    </div>
  );
}


export type VaultState = "idle" | "busy" | "open";

/** The vault room: backdrop, slow rings, rising embers and a centred column for the door. Scrolls on short screens. */
export function VaultStage({ children, maxWidth = 440 }: { children: ReactNode; maxWidth?: number }) {
  const calm = useReduceMotion();
  return (
    <div className="vl-root fixed inset-0 z-0 overflow-y-auto overflow-x-hidden text-white">
      <style dangerouslySetInnerHTML={{ __html: VAULT_CSS }} />
      <div className="vl-floor" aria-hidden />
      <svg className="vl-rings" viewBox="0 0 400 400" fill="none" aria-hidden>
        <g className="vl-ring-a" style={{ transformOrigin: "200px 200px" }}>
          <circle cx="200" cy="200" r="190" stroke="rgba(230,193,112,.25)" strokeWidth=".6" strokeDasharray="2 7" />
          <circle cx="200" cy="200" r="150" stroke="rgba(122,92,255,.35)" strokeWidth=".6" />
        </g>
        <g className="vl-ring-b" style={{ transformOrigin: "200px 200px" }}>
          <circle cx="200" cy="200" r="120" stroke="rgba(230,193,112,.22)" strokeWidth=".6" strokeDasharray="14 10" />
          <circle cx="200" cy="200" r="92" stroke="rgba(255,255,255,.12)" strokeWidth=".6" />
        </g>
      </svg>
      {!calm && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="vl-mote" style={{ left: `${(i * 71 + 9) % 100}%`, animationDuration: `${11 + ((i * 5) % 9)}s`, animationDelay: `${-((i * 3) % 12)}s` }} />
          ))}
        </div>
      )}
      <div className="relative z-10 mx-auto flex min-h-full w-full flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={calm ? false : { opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full"
          style={{ maxWidth }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

/** The vault door itself: steel frame, gold-inlaid plate, four bolts that retract when it opens, and a shake on errors. */
export function VaultPanel({ state, shake, children }: { state: VaultState; shake: number; children: ReactNode }) {
  return (
    <motion.div key={shake} animate={shake ? { x: [0, -12, 10, -7, 4, 0] } : undefined} transition={{ duration: 0.45 }}>
      <div className="vl-door" data-state={state}>
        <div className="vl-plate">
          <span className="vl-bolt left-3.5 top-3.5" style={{ "--r": "35deg" } as CSSProperties} />
          <span className="vl-bolt right-3.5 top-3.5" style={{ "--r": "-20deg" } as CSSProperties} />
          <span className="vl-bolt bottom-3.5 left-3.5" style={{ "--r": "70deg" } as CSSProperties} />
          <span className="vl-bolt bottom-3.5 right-3.5" style={{ "--r": "10deg" } as CSSProperties} />
          <div className="vl-flash" aria-hidden />
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/** Dial and wordmark. `turn` is the dial angle; `title` is an optional line under the wordmark. */
export function VaultHeading({ turn, state, title }: { turn: number; state: VaultState; title?: string }) {
  const calm = useReduceMotion();
  return (
    <div className="flex flex-col items-center">
      <Dial turn={turn} state={state} calm={calm} />
      <p className="mt-4 flex items-center gap-2 font-display text-[15px] font-semibold tracking-[0.32em] text-[#f1e6c6]">
        <LogoMark className="h-5 w-5" /> SPINVERSE
      </p>
      {title && <h1 className="mt-2 text-[15px] font-medium text-[#c9c6d6]">{title}</h1>}
    </div>
  );
}

/** Dial angle from how much has been typed; spins further while the vault works and opens. */
export const dialTurn = (typed: number, state: VaultState) => typed * 9 + (state === "busy" ? 540 : state === "open" ? 630 : 0);

export function PasswordSlot({ label = "Password", ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Slot
      label={label}
      icon={<KeyRound />}
      type={show ? "text" : "password"}
      trailing={
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="vl-eye -mr-1.5 p-2">
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      }
      {...rest}
    />
  );
}

export function VaultCheck({ checked, onChange, error, children }: { checked: boolean; onChange: (v: boolean) => void; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-[#b9b6c8]">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-[#05060a] shadow-[inset_0_2px_4px_rgba(0,0,0,.8),inset_0_0_0_1px_rgba(255,255,255,.18)] peer-checked:shadow-[inset_0_0_0_1px_#e6c170] peer-focus-visible:ring-2 peer-focus-visible:ring-[#fff0bd]">
          {checked && <Check className="h-3 w-3 text-[#e6c170]" strokeWidth={3.2} />}
        </span>
        <span>{children}</span>
      </label>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 pl-1 text-[13px] text-rose-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

export function StrengthBars({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = passwordStrength(password);
  return (
    <div className="mt-2.5 pl-1" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full", i <= score ? (score >= 3 ? "bg-[#e6c170] shadow-[0_0_8px_rgba(230,193,112,.6)]" : "bg-[#e0653a]") : "bg-white/10")} />
        ))}
      </div>
      <p className="mt-1 text-xs text-[#8d8aa3]">Password strength: {label}</p>
    </div>
  );
}

/** The gold action button. While the vault works the label changes; once it has opened it confirms. */
export function VaultButton({ children, busyLabel, doneLabel, state = "idle", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { busyLabel?: string; doneLabel?: string; state?: VaultState }) {
  return (
    <button {...rest} disabled={state !== "idle" || rest.disabled} className="vl-go !mt-5">
      {state === "busy" ? (
        busyLabel ?? "Opening vault…"
      ) : state === "open" ? (
        <>
          <Check className="h-5 w-5" strokeWidth={3} /> {doneLabel ?? "Vault open"}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function VaultFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4 text-[13px] text-[#b9b6c8]">{children}</div>;
}
