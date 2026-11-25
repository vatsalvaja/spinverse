import { cn, hueFromString, initials } from "../utils";

/** Initials avatar, dark tone. (Copied from the host: same look.) */
export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const hue = hueFromString(name);
  return (
    <span
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue} 38% 30%), hsl(${(hue + 40) % 360} 45% 18%))`,
        color: `hsl(${hue} 70% 85%)`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12)",
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
