import { Crown, UserRound } from "lucide-react";
import type { Membership } from "@/data/types";
import { cn } from "@/lib/utils";

const TONES: Record<Membership, { grad: string; text: string; ring: string }> = {
  Platinum: { grad: "from-[#f4f7ff] via-[#a9b9e6] to-[#5b6a9e]", text: "text-[#161c33]", ring: "ring-white/60" },
  Gold: { grad: "from-[#fff3c4] via-[#e8bd55] to-[#a87420]", text: "text-[#2a1805]", ring: "ring-gold-100/60" },
  Silver: { grad: "from-[#ffffff] via-[#c4c9d8] to-[#7b8296]", text: "text-[#1b1e2a]", ring: "ring-white/50" },
  Bronze: { grad: "from-[#ffdcb8] via-[#cf8a4a] to-[#85501f]", text: "text-[#2e1807]", ring: "ring-[#ffdcb8]/50" },
  Guest: { grad: "from-[#3a3d4c] via-[#2a2c38] to-[#1c1e28]", text: "text-obsidian-100", ring: "ring-white/20" },
};

/** Metallic membership tier plate. */
export function MembershipBadge({ tier, className, size = "md" }: { tier: Membership; className?: string; size?: "sm" | "md" }) {
  const t = TONES[tier];
  const Icon = tier === "Guest" ? UserRound : Crown;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b font-semibold shadow-[0_6px_18px_-6px_rgba(0,0,0,.8)] ring-1", t.grad, t.text, t.ring, size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-[13px]", className)}>
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {tier === "Guest" ? "Guest" : `${tier} member`}
    </span>
  );
}
