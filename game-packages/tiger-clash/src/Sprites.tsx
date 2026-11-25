"use client";

/**
 * The Tiger and the Dragon: painted creature artwork (cut from the reference illustration, see
 * scripts/art/tiger-clash-ui.mjs) brought to life with layered CSS animation. Each creature is one raster image
 * with separate light layers on top (eye glow, hot mouth glow, ground heat or mist) and a rig wrapper that is
 * animated per pose. The fire breath, lightning, embers and shockwaves are drawn on the effects canvas, anchored
 * to the mouth positions below.
 *
 * Honest limit: the art is a single flattened painting per creature, so there is no moving jaw, limb or wing.
 * What moves is the whole body (rear, lunge, head lift, recoil, slump), the light layers and the effects.
 */

import { assetUrl } from "@spinverse/game-sdk";

export type Pose = "idle" | "roar" | "victory" | "defeat";
export const VICTORY_MS = 6500;
export const ROAR_MS = 2600;

/** Where the eye and the mouth sit inside each cut, as fractions of the image. */
export const ANCHORS = {
  tiger: { eye: { x: 0.77, y: 0.27 }, mouth: { x: 0.85, y: 0.44 } },
  dragon: { eye: { x: 0.268, y: 0.304 }, mouth: { x: 0.18, y: 0.45 } },
} as const;

export const CHARACTER_CSS = `
.tcs{position:relative;width:100%;height:100%;pointer-events:none;overflow:visible}
.tcs-rig{position:absolute;inset:0;transform-origin:var(--ox,40%) 96%;will-change:transform,filter;transition:transform .9s cubic-bezier(.3,.8,.3,1),filter .9s ease}
.tcs-tiger{--ox:34%}
.tcs-dragon{--ox:66%}
.tcs-img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:fill;user-select:none;-webkit-user-drag:none;
  -webkit-mask-image:var(--m1),var(--m2);-webkit-mask-composite:source-in;mask-image:var(--m1),var(--m2);mask-composite:intersect}
.tcs-tiger .tcs-img{--m1:linear-gradient(90deg,#000 0,#000 78%,transparent 99%);--m2:linear-gradient(180deg,transparent 0,#000 13%,#000 86%,transparent 100%)}
.tcs-dragon .tcs-img{--m1:linear-gradient(270deg,#000 0,#000 78%,transparent 99%);--m2:linear-gradient(180deg,transparent 0,#000 13%,#000 86%,transparent 100%)}
.tcs-eye,.tcs-mouth,.tcs-aura{position:absolute;pointer-events:none;mix-blend-mode:screen;border-radius:50%}
.tcs-eye{width:7%;aspect-ratio:1;transform:translate(-50%,-50%) scale(1);opacity:.5;transition:transform .5s,opacity .5s;animation:tcs-eye 2.8s ease-in-out infinite alternate}
.tcs-tiger .tcs-eye{background:radial-gradient(circle,#fff7d6 0,#ffb82e 32%,rgba(255,150,20,0) 70%)}
.tcs-dragon .tcs-eye{background:radial-gradient(circle,#ffffff 0,#69d6ff 32%,rgba(40,140,255,0) 70%)}
@keyframes tcs-eye{from{opacity:.38}to{opacity:.78}}
.tcs-mouth{width:15%;aspect-ratio:1;transform:translate(-50%,-50%) scale(.6);opacity:0;transition:opacity .35s,transform .5s}
.tcs-tiger .tcs-mouth{background:radial-gradient(circle,#fff4cc 0,#ffa826 35%,rgba(255,110,0,0) 72%)}
.tcs-dragon .tcs-mouth{background:radial-gradient(circle,#f4feff 0,#5cc8ff 35%,rgba(30,120,255,0) 72%)}
.tcs-aura{left:50%;bottom:-4%;width:92%;height:34%;transform:translateX(-50%);border-radius:50%;opacity:.0;animation:tcs-aura 2.4s ease-in-out infinite alternate}
.tcs-tiger .tcs-aura{background:radial-gradient(closest-side,rgba(255,130,30,.55),rgba(255,90,0,0))}
.tcs-dragon .tcs-aura{background:radial-gradient(closest-side,rgba(60,150,255,.5),rgba(30,90,255,0))}
@keyframes tcs-aura{from{opacity:.25}to{opacity:.62}}

/* idle: slow breathing and a hint of weight shifting */
.tc-s[data-pose="idle"] .tcs-rig{animation:tcs-breathe 3.8s ease-in-out infinite alternate}
.tc-s[data-pose="idle"].tcs-dragon .tcs-rig{animation-name:tcs-breathe-d;animation-duration:4.6s}
@keyframes tcs-breathe{from{transform:translate3d(0,0,0) scale(1,1) rotate(0)}to{transform:translate3d(.4%,-.8%,0) scale(1.012,1.02) rotate(-.25deg)}}
@keyframes tcs-breathe-d{from{transform:translate3d(0,0,0) scale(1,1) rotate(0)}to{transform:translate3d(-.3%,-1.2%,0) scale(1.008,1.022) rotate(.35deg)}}

/* roar: rear back, hold, and settle (the tie face-off) */
.tc-s[data-pose="roar"] .tcs-rig{animation:tcs-roar 2.6s cubic-bezier(.3,.8,.3,1) both}
.tc-s[data-pose="roar"].tcs-dragon .tcs-rig{animation-name:tcs-roar-d}
@keyframes tcs-roar{0%{transform:none}18%{transform:translate3d(-1%,0,0) rotate(1.6deg) scale(1.01);filter:brightness(1)}30%{transform:translate3d(3.5%,-1%,0) rotate(-2.6deg) scale(1.11);filter:brightness(1.18) saturate(1.15)}46%{transform:translate3d(3.2%,-1%,0) rotate(-2.3deg) scale(1.1)}58%{transform:translate3d(3.6%,-1.2%,0) rotate(-2.8deg) scale(1.115)}72%{transform:translate3d(3.2%,-1%,0) rotate(-2.4deg) scale(1.1);filter:brightness(1.12)}100%{transform:translate3d(.6%,0,0) scale(1.01);filter:none}}
@keyframes tcs-roar-d{0%{transform:none}18%{transform:translate3d(1%,0,0) rotate(-1.4deg) scale(1.01)}30%{transform:translate3d(-3.5%,-1%,0) rotate(2.6deg) scale(1.11);filter:brightness(1.18) saturate(1.15)}46%{transform:translate3d(-3.2%,-1%,0) rotate(2.3deg) scale(1.1)}58%{transform:translate3d(-3.6%,-1.2%,0) rotate(2.8deg) scale(1.115)}72%{transform:translate3d(-3.2%,-1%,0) rotate(2.4deg) scale(1.1);filter:brightness(1.12)}100%{transform:translate3d(-.6%,0,0) scale(1.01);filter:none}}
.tc-s[data-pose="roar"] .tcs-eye,.tc-s[data-pose="victory"] .tcs-eye{animation:none;transform:translate(-50%,-50%) scale(2.4);opacity:1;transition-delay:.55s}
.tc-s[data-pose="roar"] .tcs-mouth{opacity:.85;transform:translate(-50%,-50%) scale(1);transition-delay:.7s;animation:tcs-flick .14s steps(2,end) infinite alternate .9s}
.tc-s[data-pose="victory"] .tcs-mouth{opacity:.95;transform:translate(-50%,-50%) scale(1.15);transition-delay:.85s;animation:tcs-flick .12s steps(2,end) infinite alternate 1s}
@keyframes tcs-flick{from{filter:brightness(.85)}to{filter:brightness(1.25)}}

/* victory: rear up and lunge, the head lifts, the body pulses with the roar, then holds a dominant pose */
.tc-s[data-pose="victory"] .tcs-rig{animation:tcs-win 6.5s cubic-bezier(.25,.8,.25,1) both}
.tc-s[data-pose="victory"].tcs-dragon .tcs-rig{animation-name:tcs-win-d}
@keyframes tcs-win{
  0%{transform:none;filter:none}
  8%{transform:translate3d(-1.5%,0,0) rotate(2deg) scale(1.01)}
  16%{transform:translate3d(6%,-2%,0) rotate(-3.4deg) scale(1.2);filter:brightness(1.2) saturate(1.2)}
  22%{transform:translate3d(5.4%,-1.6%,0) rotate(-3deg) scale(1.17)}
  28%{transform:translate3d(6.2%,-2.2%,0) rotate(-3.6deg) scale(1.21)}
  34%{transform:translate3d(5.4%,-1.7%,0) rotate(-3deg) scale(1.17)}
  40%{transform:translate3d(6.2%,-2.2%,0) rotate(-3.6deg) scale(1.21)}
  46%{transform:translate3d(5.4%,-1.7%,0) rotate(-3deg) scale(1.17)}
  52%{transform:translate3d(6.2%,-2.2%,0) rotate(-3.6deg) scale(1.2)}
  60%{transform:translate3d(5.6%,-1.8%,0) rotate(-3.1deg) scale(1.17)}
  68%{transform:translate3d(5.2%,-1.6%,0) rotate(-2.8deg) scale(1.15);filter:brightness(1.12) saturate(1.12)}
  100%{transform:translate3d(4.6%,-1.4%,0) rotate(-2.4deg) scale(1.13);filter:brightness(1.08) saturate(1.1)}}
@keyframes tcs-win-d{
  0%{transform:none;filter:none}
  8%{transform:translate3d(1.5%,0,0) rotate(-1.6deg) scale(1.01)}
  16%{transform:translate3d(-6%,-2.4%,0) rotate(3.2deg) scale(1.2);filter:brightness(1.2) saturate(1.2)}
  22%{transform:translate3d(-5.4%,-2%,0) rotate(2.8deg) scale(1.17)}
  28%{transform:translate3d(-6.2%,-2.6%,0) rotate(3.4deg) scale(1.21)}
  34%{transform:translate3d(-5.4%,-2.1%,0) rotate(2.8deg) scale(1.17)}
  40%{transform:translate3d(-6.2%,-2.6%,0) rotate(3.4deg) scale(1.21)}
  46%{transform:translate3d(-5.4%,-2.1%,0) rotate(2.8deg) scale(1.17)}
  52%{transform:translate3d(-6.2%,-2.6%,0) rotate(3.4deg) scale(1.2)}
  60%{transform:translate3d(-5.6%,-2.2%,0) rotate(2.9deg) scale(1.17)}
  68%{transform:translate3d(-5.2%,-2%,0) rotate(2.6deg) scale(1.15);filter:brightness(1.12) saturate(1.12)}
  100%{transform:translate3d(-4.6%,-1.8%,0) rotate(2.3deg) scale(1.13);filter:brightness(1.08) saturate(1.1)}}
.tc-s[data-pose="victory"] .tcs-aura{animation-duration:.6s;opacity:.8}

/* defeat: flinch, then slump away from the winner, darkened and drained */
.tc-s[data-pose="defeat"] .tcs-rig{animation:tcs-flinch .5s ease-out both;transform:translate3d(-2.2%,5%,0) rotate(2.6deg) scale(.93);filter:brightness(.5) saturate(.4)}
.tc-s[data-pose="defeat"].tcs-dragon .tcs-rig{transform:translate3d(2.2%,5%,0) rotate(-2.6deg) scale(.93)}
@keyframes tcs-flinch{0%{transform:none;filter:none}30%{transform:translate3d(2.4%,-1%,0) scale(1.03);filter:brightness(1.5)}100%{}}
.tc-s[data-pose="defeat"] .tcs-eye{opacity:.12;transform:translate(-50%,-50%) scale(.6);animation:none}
.tc-s[data-pose="defeat"] .tcs-aura{opacity:.08;animation:none}

.tcs-reduced .tcs-rig,.tcs-reduced .tcs-eye,.tcs-reduced .tcs-aura{animation-duration:.01s!important}
.tcs-reduced[data-pose="idle"] .tcs-rig{animation:none!important}
@media (prefers-reduced-motion:reduce){.tc-s[data-pose="idle"] .tcs-rig,.tcs-eye,.tcs-aura,.tcs-mouth{animation:none!important}}
`;

function Sprite({ who, pose, reduced, className }: { who: "tiger" | "dragon"; pose: Pose; reduced?: boolean; className?: string }) {
  const a = ANCHORS[who];
  return (
    <div className={`tc-s tcs tcs-${who} ${reduced ? "tcs-reduced" : ""} ${className ?? ""}`} data-pose={pose} data-who={who}>
      <div className="tcs-aura" />
      <div className="tcs-rig" data-rig={who}>
        <img className="tcs-img" src={assetUrl(`assets/art/ui/${who}.webp`)} alt="" draggable={false} decoding="async" />
        <span className="tcs-eye" style={{ left: `${a.eye.x * 100}%`, top: `${a.eye.y * 100}%` }} />
        <span className="tcs-mouth" style={{ left: `${a.mouth.x * 100}%`, top: `${a.mouth.y * 100}%` }} />
      </div>
    </div>
  );
}

export function TigerCharacter(props: { pose: Pose; reduced?: boolean; className?: string }) {
  return <Sprite who="tiger" {...props} />;
}
export function DragonCharacter(props: { pose: Pose; reduced?: boolean; className?: string }) {
  return <Sprite who="dragon" {...props} />;
}
