import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const HEX = "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

/** Avatar inside a gold-framed hexagon. */
export function HexAvatar({ name, size, className }: { name: string; size: number; className?: string }) {
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size * 1.1 }}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#fff3c4] via-[#e3b951] to-[#7a5110]" style={{ clipPath: HEX }} />
      <div className="absolute inset-[3px] flex items-center justify-center bg-obsidian-900" style={{ clipPath: HEX }}>
        <Avatar name={name} size={size} className="!rounded-none" />
      </div>
    </div>
  );
}
