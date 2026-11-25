/** All keyframes and structural CSS for Atlantis Cascade. Everything is scoped under `.ac-root`. */
export const AC_CSS = /* css */ `
.ac-root{
  --ac-aqua:#5ff7ef; --ac-deep:#02121c; --ac-gold:#f3cf6a; --ac-pearl:#ffd9f4; --ac-coral:#ff8aa8;
  --top:clamp(44px,7.2dvh,62px);
  --spin:clamp(84px,15dvh,136px);
  font-family:var(--font-atlantis),var(--font-body),serif;
  color:#d8fbff;
  -webkit-tap-highlight-color:transparent;
  touch-action:manipulation;
}
.ac-root *{box-sizing:border-box}
.ac-num{font-family:var(--font-num),system-ui,sans-serif;font-variant-numeric:tabular-nums}

/* ------------------------------------------------------------------ symbols (inside the SVG artwork) */
.ac-root svg *{transform-box:fill-box}
.ac-star{transform-origin:center;animation:ac-twinkle 2.8s ease-in-out infinite}
@keyframes ac-twinkle{0%,100%{transform:scale(0) rotate(0);opacity:0}42%{transform:scale(1) rotate(45deg);opacity:1}60%{transform:scale(.55) rotate(75deg);opacity:.7}}
.ac-pulse{transform-origin:center;animation:ac-pulse 3.4s ease-in-out infinite}
@keyframes ac-pulse{0%,100%{opacity:.5;transform:scale(.95)}50%{opacity:1;transform:scale(1.05)}}
.ac-sweep{animation:ac-sweep 6s ease-in-out infinite}
@keyframes ac-sweep{0%,55%{transform:skewX(-18deg) translateX(0)}100%{transform:skewX(-18deg) translateX(210px)}}
.ac-pearl-lid{transform-origin:50% 100%;animation:ac-lid 6s ease-in-out infinite}
@keyframes ac-lid{0%,100%{transform:rotate(0)}50%{transform:rotate(-2.4deg) translateY(-1px)}}
.ac-pearl-ball{animation:ac-bob 4.4s ease-in-out infinite}
@keyframes ac-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.8px)}}
.ac-trident-body,.ac-crown-body,.ac-conch-body,.ac-crystal-body,.ac-scale-body,.ac-eye-body,.ac-amphora-body{transform-origin:50% 60%;animation:ac-float 5.2s ease-in-out infinite}
.ac-crown-body{animation-duration:6s}.ac-conch-body{animation-duration:5.6s}.ac-crystal-body{animation-duration:4.8s}.ac-scale-body{animation-duration:6.4s}.ac-eye-body{animation-duration:7s}
@keyframes ac-float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2.2px) rotate(.8deg)}}
.ac-eye-pupil{transform-origin:center;animation:ac-pupil 5s ease-in-out infinite}
@keyframes ac-pupil{0%,100%{transform:scaleX(1)}38%{transform:scaleX(.62)}50%{transform:scaleX(1.35)}70%{transform:scaleX(.9)}}
.ac-eye-iris{transform-origin:center;animation:ac-blink 7.5s ease-in-out infinite}
@keyframes ac-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}
.ac-beam{transform-origin:50% 100%;animation:ac-beam 3.6s ease-in-out infinite}
@keyframes ac-beam{0%,100%{opacity:.3;transform:scaleY(.86)}50%{opacity:.85;transform:scaleY(1.06)}}
.ac-bub{animation:ac-rise 3.2s linear infinite;opacity:0}
.ac-bub2{animation-delay:1.1s}.ac-bub3{animation-delay:2.2s}
@keyframes ac-rise{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.85}100%{transform:translate(3px,-20px) scale(1.25);opacity:0}}
.ac-echo{transform-origin:left center;animation:ac-echo 3.2s ease-out infinite;opacity:0}
.ac-echo2{animation-delay:.55s}
@keyframes ac-echo{0%{opacity:0;transform:translateX(-3px)}25%{opacity:.85}100%{opacity:0;transform:translateX(7px)}}
.ac-facet{animation:ac-glint 3.4s ease-in-out infinite}
.ac-facet2{animation-delay:1.7s}
@keyframes ac-glint{0%,100%{opacity:.15}50%{opacity:.85}}
.ac-irid{animation:ac-irid 5.4s ease-in-out infinite;opacity:0}
@keyframes ac-irid{0%,100%{opacity:0}50%{opacity:.8}}
.ac-wild-rays{transform-origin:center;animation:ac-spin 16s linear infinite}
.ac-wild-ring{transform-origin:center;animation:ac-spin 20s linear infinite reverse}
.ac-root svg .ac-wild-swirl,.ac-root svg .ac-wild-orbit{transform-box:view-box;transform-origin:50px 44px;animation:ac-spin 6s linear infinite}
.ac-root svg .ac-wild-orbit{animation-duration:4.4s}
.ac-scatter-ring{transform-origin:center;animation:ac-spin 24s linear infinite}
@keyframes ac-spin{to{transform:rotate(360deg)}}
.ac-heart{transform-origin:center;animation:ac-beat 2.3s ease-in-out infinite}
@keyframes ac-beat{0%,48%,100%{transform:scale(1)}12%{transform:scale(1.07)}24%{transform:scale(1)}36%{transform:scale(1.05)}}

/* each important symbol celebrates in its own way */
.ac-s-front .ac-pearl-lid{animation:ac-lid-open .9s ease-in-out infinite}
@keyframes ac-lid-open{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(-12deg) translateY(-2px)}}
.ac-s-front .ac-pearl-ball{animation:ac-pearl-win .9s ease-in-out infinite}
@keyframes ac-pearl-win{0%,100%{transform:translateY(-1px) scale(1)}50%{transform:translateY(-5px) scale(1.14);filter:brightness(1.25)}}
.ac-s-front .ac-trident-body{animation:ac-trident-win .8s ease-in-out infinite}
@keyframes ac-trident-win{0%,100%{transform:rotate(-5deg) scale(1)}50%{transform:rotate(6deg) scale(1.06);filter:brightness(1.3)}}
.ac-s-front .ac-crown-body{animation:ac-crown-win .9s ease-in-out infinite}
@keyframes ac-crown-win{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scale(1.07);filter:brightness(1.25)}}
.ac-s-front .ac-eye-pupil{animation:ac-pupil-win .7s ease-in-out infinite}
@keyframes ac-pupil-win{0%,100%{transform:scale(1)}50%{transform:scale(1.5,1.12)}}
.ac-s-front .ac-eye-iris{animation:none}
.ac-s-front .ac-amphora-body{animation:ac-amph-win .8s ease-in-out infinite}
@keyframes ac-amph-win{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg);filter:brightness(1.2)}}
.ac-s-front .ac-beam{animation-duration:.7s}
.ac-s-front .ac-echo{animation-duration:1.1s}
.ac-s-front .ac-facet{animation-duration:.7s}
.ac-s-front .ac-irid{animation-duration:1.1s}
.ac-s-front .ac-wild-ring{animation-duration:2.4s}
.ac-s-front .ac-wild-rays{animation-duration:4s}
.ac-s-front .ac-heart{animation-duration:.8s}
.ac-s-front .ac-conch-body,.ac-s-front .ac-crystal-body,.ac-s-front .ac-scale-body{animation:ac-gem-win .9s ease-in-out infinite}
@keyframes ac-gem-win{0%,100%{transform:rotate(-2deg) scale(1)}50%{transform:rotate(2deg) scale(1.05);filter:brightness(1.25)}}

/* ------------------------------------------------------------------ tiles */
.ac-tile{position:absolute;top:0;width:16.6667%;height:20%;pointer-events:none;will-change:transform}
.ac-in{position:absolute;inset:3.5%;transition:opacity .35s ease,filter .35s ease,transform .3s ease;transform-origin:50% 70%}
.ac-in .ac-land{width:100%;height:100%;transform-origin:50% 100%}
.ac-in svg{width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(0 5px 4px rgba(0,12,28,.55))}
.ac-land-go{animation:ac-land .52s ease-out var(--ld,0s) both}
@keyframes ac-land{0%{transform:scale(1,1)}30%{transform:scale(1.12,.86)}58%{transform:scale(.96,1.06)}80%{transform:scale(1.02,.99)}100%{transform:scale(1,1)}}
.ac-s-front{transform:scale(1.18);animation:ac-front 1s ease-in-out infinite}
.ac-s-front svg{filter:drop-shadow(0 0 7px var(--g)) drop-shadow(0 0 18px var(--g)) drop-shadow(0 4px 4px rgba(0,12,28,.5))}
@keyframes ac-front{0%,100%{transform:scale(1.14)}50%{transform:scale(1.24)}}
.ac-s-dim{opacity:.33;filter:saturate(.45) brightness(.72);transform:scale(.93)}
.ac-s-scat svg{filter:drop-shadow(0 0 8px #ff5fe0) drop-shadow(0 0 20px #b04aff)}
.ac-s-scat{animation:ac-scat 1.1s ease-in-out infinite}
@keyframes ac-scat{0%,100%{transform:scale(1.04)}50%{transform:scale(1.14)}}
.ac-s-pop{animation:ac-pop .46s cubic-bezier(.3,.9,.4,1) forwards}
@keyframes ac-pop{0%{transform:scale(1.18);filter:brightness(1.4)}32%{transform:scale(1.36) rotate(-4deg);filter:brightness(2.2)}100%{transform:scale(.08) rotate(14deg);opacity:0;filter:brightness(3) blur(5px)}}

/* ------------------------------------------------------------------ machine */
.ac-mid{container:acmid / size;position:relative;min-height:0;flex:1 1 0}
.ac-mid-in{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:1.4cqw}
.ac-cab{
  --cw:min(94cqw,calc((100cqh - 60px)*1.14));
  position:relative;flex:none;width:var(--cw);margin-top:46px;
  padding:calc(var(--cw)*.032);border-radius:calc(var(--cw)*.05);
  background:linear-gradient(135deg,#1c7088 0%,#08293d 20%,#0d4a66 46%,#06223a 72%,#237f97 100%);
  --gl:rgba(95,247,239,.28);
  box-shadow:0 0 0 calc(var(--cw)*.004) #0a2233,0 0 0 calc(var(--cw)*.0085) rgba(243,207,106,.78),0 0 0 calc(var(--cw)*.012) rgba(30,16,4,.6),0 calc(var(--cw)*.03) calc(var(--cw)*.08) rgba(0,0,0,.7),0 0 calc(var(--cw)*.07) var(--gl),inset 0 calc(var(--cw)*.003) 0 rgba(180,255,255,.5),inset 0 calc(var(--cw)*-.01) calc(var(--cw)*.02) rgba(0,0,0,.5);
  transition:box-shadow .8s ease;
}
@container acmid (min-aspect-ratio:3/2){.ac-cab{--cw:min(68cqw,calc(100cqh*1.1));margin-top:0}}
.ac-cab[data-glow=win]{--gl:rgba(255,214,120,.62)}
.ac-cab[data-glow=bonus]{--gl:rgba(255,95,224,.55)}
.ac-cab::before{content:"";position:absolute;inset:calc(var(--cw)*.012);border-radius:calc(var(--cw)*.04);border:1px solid rgba(140,255,250,.28);pointer-events:none}
.ac-pearl-corner{position:absolute;width:calc(var(--cw)*.036);height:calc(var(--cw)*.036);border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffe6f3 35%,#c9b3e6 75%,#7f93c6);box-shadow:0 0 calc(var(--cw)*.02) rgba(255,220,250,.8),0 2px 4px rgba(0,0,0,.6);animation:ac-corner 4s ease-in-out infinite}
@keyframes ac-corner{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}
.ac-crest{position:absolute;left:50%;top:calc(var(--cw)*-.05);transform:translateX(-50%);width:calc(var(--cw)*.2);z-index:4;filter:drop-shadow(0 4px 6px rgba(0,0,0,.6))}
.ac-glass{position:relative;width:100%;aspect-ratio:6/5;border-radius:calc(var(--cw)*.026)}
.ac-glass-bg{position:absolute;inset:0;border-radius:inherit;overflow:hidden;
  background:
    radial-gradient(circle at 50% 50%,rgba(120,235,255,.12),transparent 64%) 0 0/16.6667% 20%,
    linear-gradient(to right,rgba(130,235,255,.1) 1px,transparent 1px) 0 0/16.6667% 100%,
    linear-gradient(to bottom,rgba(130,235,255,.1) 1px,transparent 1px) 0 0/100% 20%,
    linear-gradient(180deg,rgba(6,46,68,.72),rgba(2,16,30,.84));
  box-shadow:inset 0 0 calc(var(--cw)*.05) rgba(0,0,0,.85),inset 0 calc(var(--cw)*.004) 0 rgba(140,255,250,.25)}
.ac-glass-caustic{position:absolute;left:-20%;top:-20%;width:140%;height:140%;opacity:.5;mix-blend-mode:screen;
  background:repeating-radial-gradient(circle at 22% 30%,rgba(150,255,255,.09) 0 2.4%,transparent 2.4% 8%),repeating-radial-gradient(circle at 72% 62%,rgba(150,255,255,.07) 0 3.4%,transparent 3.4% 10%);
  animation:ac-caustic 16s ease-in-out infinite alternate}
@keyframes ac-caustic{from{transform:translate(0,0) rotate(0) scale(1)}to{transform:translate(6%,4%) rotate(6deg) scale(1.08)}}
.ac-glass-sheen{position:absolute;top:-10%;bottom:-10%;width:18%;left:-30%;background:linear-gradient(100deg,transparent,rgba(190,255,255,.13),transparent);transform:skewX(-14deg);animation:ac-sheen 9s ease-in-out infinite}
@keyframes ac-sheen{0%,60%{left:-30%}100%{left:130%}}
.ac-tiles{position:absolute;inset:0;clip-path:inset(-1.2% -3% -3% -3%)}
.ac-over{position:absolute;inset:0;pointer-events:none}

/* ------------------------------------------------------------------ win lines */
.ac-line-glow{filter:blur(5px);opacity:.9}
.ac-line-draw{stroke-dasharray:100;stroke-dashoffset:100;animation:ac-draw .55s ease-out forwards}
@keyframes ac-draw{to{stroke-dashoffset:0}}
.ac-line-flow{stroke-dasharray:10 22;animation:ac-flow .8s linear infinite}
@keyframes ac-flow{to{stroke-dashoffset:-64}}
.ac-ring{animation:ac-ring .9s ease-in-out infinite;opacity:0;animation-fill-mode:both}
@keyframes ac-ring{0%{opacity:0;transform:scale(.8)}30%{opacity:1;transform:scale(1)}70%{opacity:.85;transform:scale(1.04)}100%{opacity:.5;transform:scale(1)}}
.ac-wintag{position:absolute;transform:translate(-50%,-50%);z-index:7;pointer-events:none;font-weight:800;letter-spacing:.02em;font-size:clamp(14px,3.2cqw,30px);color:#fff7cf;text-shadow:0 0 12px rgba(255,214,110,.95),0 2px 0 #7a4a08,0 3px 8px rgba(0,0,0,.7);animation:ac-wintag 1.2s ease-out forwards;white-space:nowrap}
.ac-wintag b{display:block;font-size:.55em;font-weight:600;text-align:center;color:#bff8ff;text-shadow:0 0 8px rgba(95,247,239,.8)}
@keyframes ac-wintag{0%{opacity:0;transform:translate(-50%,-30%) scale(.5)}20%{opacity:1;transform:translate(-50%,-60%) scale(1.15)}70%{opacity:1;transform:translate(-50%,-80%) scale(1)}100%{opacity:0;transform:translate(-50%,-110%) scale(1)}}
.ac-mult-pop{animation:ac-multpop .8s cubic-bezier(.2,1.4,.4,1) both}
@keyframes ac-multpop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.3);opacity:1}100%{transform:scale(1)}}

/* ------------------------------------------------------------------ hud */
.ac-hud-side,.ac-hud-row{display:none}
@container acmid (min-aspect-ratio:3/2){.ac-hud-side{display:flex}}
@container acmid (max-aspect-ratio:3/2){.ac-hud-row{display:flex}}
.ac-hud-side{flex:none;width:clamp(86px,13cqw,168px);flex-direction:column;align-items:center;justify-content:center;gap:1.4cqh;height:min(86cqh,46cqw)}
.ac-hud-row{position:absolute;top:2px;left:50%;transform:translateX(-50%);width:min(94cqw,640px);align-items:stretch;justify-content:space-between;gap:8px;z-index:3}
.ac-panel{position:relative;border-radius:14px;background:linear-gradient(180deg,rgba(7,48,70,.82),rgba(2,20,34,.88));border:1px solid rgba(95,247,239,.32);box-shadow:inset 0 1px 0 rgba(190,255,255,.25),0 6px 18px rgba(0,0,0,.5),0 0 16px rgba(40,200,220,.14);backdrop-filter:blur(4px)}
.ac-ladder{display:flex;flex-direction:column-reverse;gap:3px;width:100%;flex:1;min-height:0;padding:8px}
.ac-rung{flex:1;min-height:0;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:clamp(10px,1.7cqh,15px);font-weight:700;color:#5d93a8;background:rgba(4,30,46,.8);border:1px solid rgba(95,247,239,.14);transition:all .35s ease}
.ac-rung[data-on="1"]{color:#06222c;background:linear-gradient(180deg,#e9fffd,#5ff7ef 60%,#17a5b2);border-color:#d8ffff;box-shadow:0 0 14px rgba(95,247,239,.8)}
.ac-rung[data-on="2"]{color:#3a2004;background:linear-gradient(180deg,#fff6c2,#f3cf6a 60%,#c8912a);border-color:#fff3b8;box-shadow:0 0 18px rgba(255,214,110,.95);transform:scale(1.05)}
.ac-pips{display:flex;gap:6px;align-items:center;justify-content:center}
.ac-pip{width:clamp(14px,2.2cqh,22px);aspect-ratio:1;transition:all .4s ease;filter:grayscale(1) brightness(.55);opacity:.7}
.ac-pip[data-on="1"]{filter:drop-shadow(0 0 8px #ff5fe0);opacity:1}
.ac-lbl{font-size:clamp(9px,1.5dvh,12px);letter-spacing:.14em;color:#8fd6df;line-height:1.1}

/* ------------------------------------------------------------------ deck */
.ac-deck{position:relative;z-index:12;flex:none;padding:6px clamp(8px,2.4vw,36px) calc(8px + env(safe-area-inset-bottom));
  background:linear-gradient(180deg,rgba(2,16,28,0),rgba(2,16,28,.88) 30%,rgba(1,10,20,.96))}
.ac-deck-in{display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-areas:"bal bet win" "btns spin tools";align-items:center;gap:6px 8px;max-width:640px;margin:0 auto}
.d-l,.d-c,.d-r{display:contents}
.d-bal{grid-area:bal}.d-bet{grid-area:bet}.d-win{grid-area:win}.d-btns{grid-area:btns}.d-spin{grid-area:spin}.d-tools{grid-area:tools}
.d-btns,.d-tools{display:flex;gap:8px;justify-content:center;align-items:center}
.d-spin{display:flex;justify-content:center}
@media (min-width:760px){
  .ac-deck-in{display:flex;max-width:1180px;align-items:center;gap:0}
  .d-l,.d-r{display:flex;flex:1 1 0;align-items:center;gap:clamp(8px,1.2vw,18px)}
  .d-r{justify-content:flex-end}
  .d-c{display:flex;flex:none;padding:0 clamp(10px,2.4vw,40px)}
  .d-bal,.d-bet,.d-win{width:clamp(120px,15vw,210px);flex:0 1 auto}
  .d-btns,.d-tools{flex:none}
}
.ac-led{border-radius:12px;padding:clamp(3px,.8dvh,9px) clamp(8px,1.1vw,16px);background:linear-gradient(180deg,#02121e,#04243a);border:1px solid rgba(95,247,239,.32);box-shadow:inset 0 3px 8px rgba(0,0,0,.85),0 0 14px rgba(40,200,220,.12);min-width:0}
.ac-led .l{display:block;font-size:clamp(8px,1.4dvh,11px);letter-spacing:.14em;color:#7fc3cf;white-space:nowrap}
.ac-led .v{display:block;font-weight:800;line-height:1.05;font-size:clamp(1rem,3.2dvh,1.9rem);color:#8ff7ee;text-shadow:0 0 12px rgba(80,240,230,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ac-led.gold .v{color:#ffe07a;text-shadow:0 0 12px rgba(255,200,70,.75)}
.ac-rbtn{position:relative;display:flex;align-items:center;justify-content:center;width:clamp(36px,6dvh,50px);height:clamp(36px,6dvh,50px);border-radius:50%;color:#bffcff;border:1px solid rgba(243,207,106,.55);background:linear-gradient(180deg,#0e4560,#04202f);box-shadow:0 4px 10px rgba(0,0,0,.6),inset 0 1px 0 rgba(190,255,255,.35);transition:transform .12s,filter .2s,border-color .2s;cursor:pointer}
.ac-rbtn:hover:not(:disabled){border-color:#fff1b0;color:#fff}
.ac-rbtn:active:not(:disabled){transform:translateY(2px) scale(.95)}
.ac-rbtn:disabled{opacity:.35;cursor:not-allowed}
.ac-rbtn[data-on="true"]{color:#06222c;background:linear-gradient(180deg,#e9fffd,#5ff7ef 65%,#17a5b2);border-color:#fff}
.ac-rbtn .t{font-size:clamp(8px,1.5dvh,11px);font-weight:800;letter-spacing:.06em}
.ac-spin{position:relative;width:var(--spin);height:var(--spin);border-radius:50%;cursor:pointer;outline-offset:6px;transition:transform .15s}
.ac-spin:hover:not(:disabled){transform:scale(1.04)}
.ac-spin:active:not(:disabled){transform:translateY(3px) scale(.96)}
.ac-spin:disabled{cursor:not-allowed}
.ac-spin .ring{position:absolute;inset:-9%;border-radius:50%;background:conic-gradient(from 0deg,transparent,rgba(95,247,239,.95),transparent 28%,transparent 52%,rgba(255,217,244,.8),transparent 78%);-webkit-mask-image:radial-gradient(circle,transparent 62%,#000 64%,#000 70%,transparent 72%);mask-image:radial-gradient(circle,transparent 62%,#000 64%,#000 70%,transparent 72%);animation:ac-spin 7s linear infinite}
.ac-spin[data-busy="1"] .ring{animation-duration:.9s}
.ac-spin:disabled:not([data-busy="1"]) .ring{opacity:.2}
.ac-spin .bezel{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 20deg,#fff6d2,#b57b1d,#fff1b8,#6b4310,#f1c55a,#8a5a12,#fff6d2);box-shadow:0 14px 28px -4px rgba(0,0,0,.85),0 0 0 2px rgba(20,40,50,.9)}
.ac-spin .well{position:absolute;inset:7%;border-radius:50%;background:#031722;box-shadow:inset 0 4px 10px rgba(0,0,0,.95)}
.ac-spin .dome{position:absolute;inset:12%;border-radius:50%;background:radial-gradient(circle at 35% 26%,#f4ffff,#7ff6f0 30%,#14a8b6 64%,#06506a);transition:filter .3s}
.ac-spin:disabled .dome{filter:saturate(.35) brightness(.6)}
.ac-spin:not(:disabled) .dome{animation:ac-domeglow 2.6s ease-in-out infinite}
@keyframes ac-domeglow{0%,100%{box-shadow:0 0 14px rgba(95,247,239,.5),inset 0 -6px 14px rgba(0,60,90,.5)}50%{box-shadow:0 0 34px rgba(95,247,239,.95),inset 0 -6px 14px rgba(0,60,90,.5)}}
.ac-spin .spec{position:absolute;left:24%;top:16%;width:34%;height:22%;transform:rotate(-24deg);border-radius:50%;background:rgba(255,255,255,.6);filter:blur(3px);pointer-events:none}
.ac-spin .lab{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;color:#032a3a;font-weight:800;letter-spacing:.08em}
.ac-ripple{position:absolute;inset:0;border-radius:50%;border:2px solid #cffffb;pointer-events:none;animation:ac-ripple .8s ease-out forwards}
@keyframes ac-ripple{from{transform:scale(1);opacity:.9}to{transform:scale(1.7);opacity:0}}

/* ------------------------------------------------------------------ top bar & info */
.ac-top{position:relative;z-index:30;flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:0 clamp(8px,2vw,36px);height:var(--top)}
.ac-title{font-size:clamp(1.05rem,4.4dvh,2.5rem);letter-spacing:.14em;line-height:1;white-space:nowrap;text-transform:uppercase;background:linear-gradient(180deg,#ffffff 0%,#b8fffb 38%,#3fd0d6 72%,#f3cf6a 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 14px rgba(70,230,230,.55)) drop-shadow(0 2px 2px rgba(0,0,0,.7))}
.ac-pill{display:inline-flex;align-items:center;gap:8px;height:clamp(34px,5.6dvh,46px);padding:0 14px 0 10px;border-radius:999px;color:#bffcff;font-size:clamp(12px,1.9dvh,15px);font-weight:600;border:1px solid rgba(243,207,106,.5);background:linear-gradient(180deg,#0e4560,#04202f);box-shadow:0 4px 10px rgba(0,0,0,.6),inset 0 1px 0 rgba(190,255,255,.3);transition:filter .2s,transform .12s}
.ac-pill:hover{filter:brightness(1.25)}.ac-pill:active{transform:scale(.96)}

/* ------------------------------------------------------------------ shakes */
.ac-shake-1{animation:ac-sh1 .5s ease-out}.ac-shake-2{animation:ac-sh2 .9s ease-out}
@keyframes ac-sh1{0%,100%{transform:translate(0,0)}20%{transform:translate(-3px,2px)}40%{transform:translate(3px,-2px)}60%{transform:translate(-2px,1px)}80%{transform:translate(2px,-1px)}}
@keyframes ac-sh2{0%,100%{transform:translate(0,0) rotate(0)}12%{transform:translate(-7px,4px) rotate(-.4deg)}28%{transform:translate(7px,-5px) rotate(.4deg)}44%{transform:translate(-5px,4px) rotate(-.25deg)}60%{transform:translate(5px,-3px) rotate(.25deg)}80%{transform:translate(-2px,1px)}}
.ac-quake-1{animation:ac-q1 .16s linear infinite}.ac-quake-2{animation:ac-q2 .13s linear infinite}.ac-quake-3{animation:ac-q3 .11s linear infinite}.ac-quake-4{animation:ac-q4 .09s linear infinite}
@keyframes ac-q1{0%,100%{transform:translate(0,0)}25%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-1px,-1px)}}
@keyframes ac-q2{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-4px,2px) rotate(-.15deg)}50%{transform:translate(4px,-3px) rotate(.15deg)}75%{transform:translate(-3px,-2px)}}
@keyframes ac-q3{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-6px,3px) rotate(-.25deg)}50%{transform:translate(6px,-4px) rotate(.25deg)}75%{transform:translate(-4px,-3px) rotate(-.1deg)}}
@keyframes ac-q4{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-9px,5px) rotate(-.4deg)}50%{transform:translate(9px,-6px) rotate(.4deg)}75%{transform:translate(-6px,-4px) rotate(-.2deg)}}
.ac-calm .ac-quake-1,.ac-calm .ac-quake-2,.ac-calm .ac-quake-3,.ac-calm .ac-quake-4,.ac-calm .ac-shake-1,.ac-calm .ac-shake-2{animation-duration:.5s}
.ac-flash{animation:ac-flash .7s ease-out forwards;background:radial-gradient(circle at 50% 46%,rgba(255,255,255,.92),rgba(160,255,255,.5) 40%,transparent 72%)}
@keyframes ac-flash{from{opacity:1}to{opacity:0}}

/* ------------------------------------------------------------------ entrance */
.ac-intro{position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;background:linear-gradient(180deg,#02121c 0%,#031d2e 55%,#04364c 100%);transition:opacity 1.2s ease .1s,visibility 0s linear 1.4s}
.ac-intro[data-out="1"]{opacity:0;visibility:hidden;pointer-events:none}
.ac-intro .ray{position:absolute;top:-10%;width:18%;height:130%;background:linear-gradient(180deg,rgba(150,255,255,.35),transparent 80%);transform-origin:50% 0;filter:blur(6px);animation:ac-ray 7s ease-in-out infinite alternate}
.ac-intro h1{font-size:clamp(2.2rem,9vw,6rem);letter-spacing:.12em;text-transform:uppercase;line-height:1.05;background:linear-gradient(180deg,#fff,#b8fffb 40%,#3fd0d6 75%,#f3cf6a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 24px rgba(70,230,230,.7));animation:ac-titlerise 3s cubic-bezier(.2,.8,.2,1) both}
@keyframes ac-titlerise{0%{transform:translateY(40vh) scale(.6);opacity:0;filter:blur(14px)}60%{opacity:1}100%{transform:none;opacity:1;filter:drop-shadow(0 0 24px rgba(70,230,230,.7))}}
.ac-intro .sub{margin-top:1rem;font-size:clamp(.9rem,2.4vw,1.35rem);letter-spacing:.3em;color:#9fe9ef;animation:ac-fadein 1.6s ease 1.8s both}
.ac-intro .dive{margin-top:2.2rem;animation:ac-fadein 1.2s ease 2.4s both}
@keyframes ac-fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.ac-intro .depth{position:absolute;left:0;right:0;bottom:0;height:45%;background:linear-gradient(0deg,rgba(0,5,12,.9),transparent);pointer-events:none}
.ac-arrive{animation:ac-arrive 2.4s cubic-bezier(.2,.7,.2,1) both}
@keyframes ac-arrive{0%{transform:scale(1.22) translateY(6%);filter:blur(10px) brightness(.5)}100%{transform:none;filter:none}}
.ac-rise{animation:ac-rise-cab 1.9s cubic-bezier(.2,.9,.25,1) .35s both}
@keyframes ac-rise-cab{0%{transform:translateY(34%) scale(.92);opacity:0}100%{transform:none;opacity:1}}

/* ------------------------------------------------------------------ celebration */
.ac-cele{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;--c1:#5ff7ef;--c2:#1b8db0}
.ac-cele[data-level=super]{--c1:#7fffd8;--c2:#f3cf6a}
.ac-cele[data-level=mega]{--c1:#ffd25a;--c2:#ff5fe0}
.ac-cele[data-level=jackpot]{--c1:#fff3b8;--c2:#ffb12a}
.ac-cele .rays{position:absolute;left:50%;top:48%;width:230vmax;height:230vmax;margin:-115vmax 0 0 -115vmax;background:repeating-conic-gradient(from 0deg,color-mix(in srgb,var(--c1) 42%,transparent) 0 5deg,transparent 5deg 15deg);-webkit-mask-image:radial-gradient(circle,#000 0,transparent 36%);mask-image:radial-gradient(circle,#000 0,transparent 36%);animation:ac-spin 26s linear infinite}
.ac-cele[data-level=mega] .rays,.ac-cele[data-level=jackpot] .rays{animation-duration:14s}
.ac-cele .halo{position:absolute;left:50%;top:48%;width:80vmin;height:80vmin;margin:-40vmin 0 0 -40vmin;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--c1) 55%,transparent),transparent 66%);animation:ac-halo 2.2s ease-in-out infinite}
@keyframes ac-halo{0%,100%{transform:scale(.92);opacity:.7}50%{transform:scale(1.08);opacity:1}}
.ac-cele .wave{position:absolute;left:-5%;right:-5%;bottom:0;height:46%;opacity:.8;animation:ac-surge 4.5s ease-in-out infinite alternate}
@keyframes ac-surge{from{transform:translateY(18%)}to{transform:translateY(-4%)}}
.ac-cele .title{position:relative;display:flex;gap:.02em;font-size:clamp(2.6rem,12vw,8.5rem);font-weight:400;line-height:1;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
.ac-cele[data-level=jackpot] .title{font-size:clamp(2.4rem,11vw,8rem)}
.ac-cele .ch{display:inline-block;background:linear-gradient(180deg,#fff 0%,var(--c1) 45%,var(--c2) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 18px var(--c1)) drop-shadow(0 4px 0 rgba(0,0,0,.45));animation:ac-ch .9s cubic-bezier(.2,1.5,.4,1) both,ac-chfloat 2.6s ease-in-out 1s infinite}
@keyframes ac-ch{0%{transform:translateY(-120%) scale(2.2) rotate(-14deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes ac-chfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-.06em)}}
.ac-cele .amount{position:relative;margin-top:clamp(.4rem,2dvh,1.4rem);font-size:clamp(2.2rem,9vw,6rem);font-weight:800;color:#fff;text-shadow:0 0 22px var(--c1),0 0 48px var(--c2),0 4px 0 rgba(0,0,0,.5);animation:ac-amount 1.6s ease-in-out infinite}
@keyframes ac-amount{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
.ac-cele .meta{position:relative;margin-top:.5rem;font-size:clamp(.8rem,2vw,1.2rem);letter-spacing:.3em;color:#cdf9ff;text-transform:uppercase;opacity:.9}
.ac-cele .hint{position:absolute;bottom:clamp(14px,4dvh,40px);font-size:clamp(.7rem,1.6vw,.9rem);letter-spacing:.2em;color:#a6e6ee;opacity:.65}
.ac-cele .crest{position:relative;width:clamp(56px,11vmin,110px);margin-bottom:.6rem;filter:drop-shadow(0 0 20px var(--c1));animation:ac-float 3s ease-in-out infinite}

/* ------------------------------------------------------------------ bonus + info overlays */
.ac-ovl{position:absolute;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;padding:16px;overflow:hidden}
.ac-wipe{position:absolute;left:50%;top:50%;width:260vmax;height:260vmax;margin:-130vmax 0 0 -130vmax;border-radius:50%;background:conic-gradient(from 0deg,#2a0a5e,#b03ad0,#ff5fe0,#4a8cff,#5ff7ef,#2a0a5e);animation:ac-wipe 1.6s cubic-bezier(.4,0,.2,1) both,ac-spin 4s linear infinite;opacity:.9}
@keyframes ac-wipe{from{clip-path:circle(0% at 50% 50%)}to{clip-path:circle(36% at 50% 50%)}}
.ac-card{position:relative;max-width:min(92vw,560px);text-align:center;padding:clamp(18px,4vmin,40px);border-radius:24px;background:linear-gradient(180deg,rgba(8,40,70,.92),rgba(3,14,32,.95));border:1px solid rgba(243,207,106,.65);box-shadow:0 0 0 4px rgba(3,12,26,.7),0 0 60px rgba(255,95,224,.35),0 30px 80px rgba(0,0,0,.7)}
.ac-card h2{font-size:clamp(1.6rem,6vw,3rem);letter-spacing:.1em;text-transform:uppercase;line-height:1.1;background:linear-gradient(180deg,#fff,#ffd0f4 45%,#ff5fe0);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 16px rgba(255,95,224,.6))}
.ac-card .big{font-weight:800;font-size:clamp(2.4rem,10vw,5rem);color:#ffe07a;text-shadow:0 0 22px rgba(255,200,70,.8);line-height:1.1}
.ac-card p{color:#bfeff5;font-size:clamp(.85rem,2.2vw,1.05rem);line-height:1.5}
.ac-cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;margin-top:1.1rem;min-height:48px;padding:0 28px;border-radius:999px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#032a3a;background:linear-gradient(180deg,#f4ffff,#7ff6f0 50%,#18a9b8);border:2px solid #fff;box-shadow:0 0 24px rgba(95,247,239,.7),0 6px 14px rgba(0,0,0,.6);cursor:pointer;transition:transform .15s,filter .2s}
.ac-cta:hover{filter:brightness(1.1);transform:scale(1.04)}.ac-cta:active{transform:scale(.97)}
.ac-info{position:absolute;inset:0;z-index:50;background:rgba(1,8,16,.78);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:12px}
.ac-info-card{width:min(96vw,860px);max-height:92dvh;overflow:auto;border-radius:22px;padding:clamp(16px,3vmin,32px);background:linear-gradient(180deg,rgba(8,44,66,.97),rgba(2,14,28,.98));border:1px solid rgba(243,207,106,.55);box-shadow:0 30px 90px rgba(0,0,0,.8)}
.ac-pay{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.ac-pay>div{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:rgba(3,28,44,.8);border:1px solid rgba(95,247,239,.18)}
.ac-pay svg{width:52px;height:52px;flex:none;overflow:visible}
.ac-tick{position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,transparent,#5ff7ef,transparent);opacity:.7}

@keyframes ac-ibub{from{transform:translateY(0);opacity:0}12%{opacity:.8}to{transform:translateY(-112vh);opacity:0}}
.ac-pop-in{animation:ac-popin .9s cubic-bezier(.2,1.2,.3,1) .3s both}
@keyframes ac-popin{from{transform:scale(.7) translateY(20px);opacity:0}to{transform:none;opacity:1}}
.ac-cele-emblem{width:100%;display:block}
.ac-lamp{min-height:1.3em;margin:0 auto 4px;text-align:center;font-size:clamp(11px,1.9dvh,15px);letter-spacing:.04em;color:#a9eef4;text-shadow:0 1px 6px rgba(0,0,0,.8);transition:color .3s}
.ac-lamp[data-tone=win]{color:#ffe9a0}.ac-lamp[data-tone=scatter]{color:#ffb6f4}
.ac-tease{position:absolute;left:50%;top:5%;transform:translateX(-50%);z-index:9;display:flex;align-items:center;gap:8px;white-space:nowrap;padding:6px 16px;border-radius:999px;background:rgba(10,4,30,.88);border:1px solid rgba(255,95,224,.6);color:#ffd0f6;font-size:clamp(11px,2.2cqw,17px);box-shadow:0 0 30px rgba(255,95,224,.45);backdrop-filter:blur(4px);animation:ac-popin .5s ease both}
@media (prefers-reduced-motion:reduce){
  .ac-intro h1{animation-duration:1s}
  .ac-sweep,.ac-glass-sheen{animation-duration:14s}
}
`;
