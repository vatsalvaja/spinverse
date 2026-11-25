import { cn } from "@spinverse/game-sdk";
import { ART } from "./art";
import { PharaohFx } from "./fx/PharaohFx";
import { Layer, Motes, ParallaxStage, SceneSvg } from "./Stage";

type GameId = "pharaohs-fortune";

function Img({ src, priority, className }: { src: string; priority?: boolean; className?: string }) {
  return (
    <img src={src} alt="" aria-hidden draggable={false} decoding="async" loading={priority ? "eager" : "lazy"} {...(priority ? { fetchPriority: "high" as const } : {})} className={cn("h-full w-full select-none object-cover", className)} />
  );
}

function Fx({ gameId }: { gameId: GameId }) {
  return <SceneSvg>{gameId === "pharaohs-fortune" ? <PharaohFx /> : null}</SceneSvg>;
}

/**
 * Cinematic artwork for the world, from baked WebP layers.
 * Three depth layers with pointer parallax, animated effects and particles.
 * Wrap in an element with data-parallax-root to make the layers react to the pointer.
 */
export function WorldArt({ gameId, priority = false, className, particles = true }: { gameId: GameId; priority?: boolean; className?: string; particles?: boolean }) {
  const a = ART[gameId];
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
      <ParallaxStage>
        <Layer depth={0.25}><Img src={a.back} priority={priority} /></Layer>
        <Layer depth={0.7}><Img src={a.mid} priority={priority} /></Layer>
        <Layer depth={1}><Fx gameId={gameId} /></Layer>
        <Layer depth={1.6}><Img src={a.front} priority={priority} /></Layer>
      </ParallaxStage>
      {particles && (
        <>
          {gameId === "pharaohs-fortune" && <Motes count={34} color="#ffd9a0" kind="drift" seed={3} size={[1.4, 3.6]} />}
        </>
      )}
    </div>
  );
}
