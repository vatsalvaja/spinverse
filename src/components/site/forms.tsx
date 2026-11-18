"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, hint, icon, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div>
      <label htmlFor={fid} className="mb-1.5 block text-[13px] font-medium text-obsidian-100">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-300 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
        <input
          ref={ref}
          id={fid}
          aria-invalid={!!error}
          aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
          className={cn(
            "h-[52px] w-full rounded-2xl border bg-black/40 px-4 text-[15px] text-white placeholder:text-obsidian-300 transition",
            "focus:border-gold-200/70 focus:bg-black/55 focus:outline-none focus:ring-4 focus:ring-gold-300/10",
            icon ? "pl-10" : false,
            error ? "border-rose-400/60" : "border-white/12 hover:border-white/25",
            className,
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${fid}-err`} className="mt-1.5 text-xs text-rose-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="mt-1.5 text-xs text-obsidian-300">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export function PasswordField({ label = "Password", ...rest }: Omit<FieldProps, "type" | "label"> & { label?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field label={label} type={show ? "text" : "password"} className="pr-12" {...rest} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-[34px] rounded-md p-1.5 text-obsidian-300 hover:text-white"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function Checkbox({ label, checked, onChange, error }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-obsidian-200">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border border-white/25 bg-black/30 transition peer-checked:border-gold-200 peer-checked:bg-gradient-to-b peer-checked:from-[#f9e6a8] peer-checked:to-[#c0932f] peer-focus-visible:ring-2 peer-focus-visible:ring-gold-300">
          {checked && (
            <svg viewBox="0 0 12 12" className="h-3 w-3 text-obsidian-950" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 6.5l2.3 2.3 4.7-5" />
            </svg>
          )}
        </span>
        <span>{label}</span>
      </label>
      {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return { score, label: ["Too short", "Weak", "Fair", "Good", "Strong"][score] };
}

export function StrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = passwordStrength(password);
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full", i <= score ? (score >= 3 ? "bg-gold-300" : "bg-ember") : "bg-white/10")} />
        ))}
      </div>
      <p className="mt-1 text-xs text-obsidian-300">Password strength: {label}</p>
    </div>
  );
}
