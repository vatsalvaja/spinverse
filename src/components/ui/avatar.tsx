import { cn, hueFromString, initials } from "@/lib/utils";

export function Avatar({
  name,
  size = 36,
  className,
  tone = "dark",
}: {
  name: string;
  size?: number;
  className?: string;
  tone?: "dark" | "light";
}) {
  const hue = hueFromString(name);
  return (
    <span
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background:
          tone === "dark"
            ? `linear-gradient(135deg, hsl(${hue} 38% 30%), hsl(${(hue + 40) % 360} 45% 18%))`
            : `linear-gradient(135deg, hsl(${hue} 55% 88%), hsl(${(hue + 30) % 360} 60% 78%))`,
        color: tone === "dark" ? `hsl(${hue} 70% 85%)` : `hsl(${hue} 45% 28%)`,
        boxShadow: tone === "dark" ? "inset 0 0 0 1px rgba(255,255,255,.12)" : "inset 0 0 0 1px rgba(15,23,42,.06)",
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
