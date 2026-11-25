import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";
import { cn } from "@spinverse/game-sdk";
import { REELS } from "./mock";
import { Reel, type CellState, type ReelHandle, type SpinOptions } from "./Reel";
import { SymbolDefs } from "./SymbolArt";
import type { SymbolId } from "./symbols";

export interface MachineHandle {
  /** Spin every reel. `onStop` fires as each reel settles. Resolves when the last one has. */
  spinAll: (byReel: SymbolId[][], options: SpinOptions[], onStop: (reel: number) => void) => Promise<void>;
}

function Rivet({ className }: { className: string }) {
  return <span className={cn("absolute h-[clamp(7px,1.3dvh,14px)] w-[clamp(7px,1.3dvh,14px)] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff6d2,#c0892a_55%,#5a3709)] shadow-[0_1px_3px_rgba(0,0,0,.8)]", className)} aria-hidden />;
}

/**
 * The cabinet: a gold-and-bronze frame around five reels × three rows. The window width comes from the CSS
 * variable --rw (set by the screen so the machine fills the viewport) and is always 5:3, so symbols keep
 * their proportions on every display.
 */
export const SlotMachine = forwardRef<
  MachineHandle,
  { initialRows: SymbolId[][]; states: CellState[][]; anticipating: boolean; glow: "idle" | "win" | "bonus"; free: boolean; shake: string; overlay?: ReactNode }
>(function SlotMachine({ initialRows, states, anticipating, glow, free, shake, overlay }, ref) {
  const reels = useRef<(ReelHandle | null)[]>([]);

  useImperativeHandle(
    ref,
    () => ({
      spinAll: (byReel, options, onStop) =>
        Promise.all(byReel.map((final, i) => (reels.current[i] as ReelHandle).spin(final, options[i]).then(() => onStop(i)))).then(() => undefined),
    }),
    [],
  );

  const aura = glow === "idle" ? 0.3 : glow === "win" ? 0.6 : 0.85;

  return (
    <div className={cn("relative", shake)} style={{ width: "calc(var(--rw) + 2 * var(--bez) + 2 * var(--ip))" }}>
      <SymbolDefs />

      <div
        className="relative rounded-[clamp(14px,2.6dvh,34px)] transition-[box-shadow] duration-700"
        style={{
          padding: "var(--bez)",
          background: "linear-gradient(145deg,#fff1b8 0%,#d9a93a 20%,#7a5014 46%,#e8bf55 72%,#8a5a12 100%)",
          boxShadow: `0 30px 70px -10px rgba(0,0,0,.95), 0 0 ${glow === "idle" ? 40 : glow === "win" ? 80 : 120}px rgba(240,184,74,${aura}), inset 0 2px 0 rgba(255,246,210,.9), inset 0 -3px 6px rgba(70,40,5,.7)`,
        }}
      >
        {/* engraved band and chasing bulbs on the gold */}
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-30 mix-blend-multiply [background:repeating-linear-gradient(45deg,transparent_0_7px,rgba(60,30,0,.55)_7px_8px)]" aria-hidden />
        <div className="pf-bulbs pointer-events-none absolute inset-x-[6%] top-[calc(var(--bez)/2-3px)] h-[6px]" aria-hidden />
        <div className="pf-bulbs pf-bulbs-b pointer-events-none absolute inset-x-[6%] bottom-[calc(var(--bez)/2-3px)] h-[6px]" aria-hidden />
        <Rivet className="left-[0.7%] top-[1.2%]" />
        <Rivet className="right-[0.7%] top-[1.2%]" />
        <Rivet className="bottom-[1.2%] left-[0.7%]" />
        <Rivet className="bottom-[1.2%] right-[0.7%]" />

        <div
          className={cn("relative rounded-[clamp(10px,1.9dvh,26px)] bg-[#0a0604] shadow-[inset_0_0_0_2px_rgba(60,35,8,.9),inset_0_8px_24px_rgba(0,0,0,.95)]", free && "shadow-[inset_0_0_0_2px_rgba(127,245,230,.7),inset_0_8px_24px_rgba(0,0,0,.95)]")}
          style={{ padding: "var(--ip)" }}
        >
          {/* reel window: a size container so symbols can be sized in container units */}
          <div className="relative overflow-hidden rounded-[clamp(6px,1.1dvh,16px)] bg-[#120a05]" style={{ width: "var(--rw)", aspectRatio: "5 / 3", containerType: "size" }}>
            <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_50%,#4a2e14,#120a05_78%)]" aria-hidden />
            <div className="absolute inset-0 opacity-[.18] [background:repeating-linear-gradient(90deg,transparent_0_calc(20%-1px),rgba(243,203,98,.6)_calc(20%-1px)_20%)]" aria-hidden />
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${REELS}, minmax(0, 1fr))`, gridTemplateRows: "minmax(0, 1fr)" }}>
              {Array.from({ length: REELS }, (_, i) => (
                <Reel key={i} ref={(h) => { reels.current[i] = h; }} initial={initialRows.map((r) => r[i])} states={states[i]} anticipating={anticipating && i === REELS - 1} />
              ))}
            </div>
            {/* rollers: the top and bottom rows curve away from the light */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-black/75 to-transparent" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-black/75 to-transparent" aria-hidden />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,.85)]" aria-hidden />
            {/* glass */}
            <div className="pf-glass pointer-events-none absolute inset-0 z-[7]" aria-hidden />
            {overlay}
          </div>
        </div>
      </div>
    </div>
  );
});
