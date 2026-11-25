/** All Neon Overdrive CSS (classes are prefixed `no-`). Injected once through a <style> tag in the game root. */
export const NEON_CSS = `
.no-root{--c1:#35e8ff;--c2:#8f5bff;--c3:#ff3fd0;--c4:#ffffff;--hz:0deg;font-family:"Bahnschrift","Eurostile","Segoe UI",system-ui,sans-serif;color:#dfe8ff}
.no-root.no-od{--c1:#ff4fd8;--c2:#ffae2e;--c3:#ff5a3c;--c4:#fff3c4}
.no-root *{-webkit-tap-highlight-color:transparent}
.no-num{font-family:"Bahnschrift","Eurostile",ui-monospace,"Cascadia Mono",monospace;font-variant-numeric:tabular-nums}
.no-disp{font-family:Impact,"Arial Black","Bahnschrift",system-ui,sans-serif;letter-spacing:.06em}

/* ---------------------------------------------------------- symbol motion */
.no-bob,.no-floor,.no-shard,.no-fluid,.no-wave,.no-bub,.no-qpulse,.no-spin,.no-rotor,.no-core,.no-core-glow,.no-eye,.no-pupil,.no-beam{transform-box:fill-box;transform-origin:center}
.no-bob{animation:no-bob 3.6s ease-in-out infinite;transform-origin:50% 100%}
.no-bob.slow{animation-duration:5.2s}
@keyframes no-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.4px)}}
.no-floor{animation:no-floor 3.6s ease-in-out infinite}
@keyframes no-floor{50%{transform:scale(.86);opacity:.18}}
.no-blink{animation:no-blink 1.7s steps(1) infinite}
.no-blink.d2{animation-delay:.5s}.no-blink.d3{animation-delay:1s}.no-blink.d0{animation-delay:.2s}.no-blink.d1{animation-delay:.9s}
@keyframes no-blink{0%{opacity:1}55%{opacity:.15}}
.no-fluid{animation:no-fluid 4.2s ease-in-out infinite}
@keyframes no-fluid{0%,100%{transform:translateY(2.5px)}50%{transform:translateY(-4px)}}
.no-wave{animation:no-waveY 2.2s ease-in-out infinite;transform-origin:50% 100%}
@keyframes no-waveY{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1.5)}}
.no-bub{animation:no-bub 3s ease-in infinite}
.no-bub.b2{animation-duration:3.7s;animation-delay:.8s}.no-bub.b3{animation-duration:2.4s;animation-delay:1.4s}
@keyframes no-bub{0%{transform:translateY(8px);opacity:0}15%{opacity:.9}100%{transform:translateY(-38px);opacity:0}}
.no-trace{stroke-dasharray:22 78;stroke-dashoffset:100;animation:no-trace 2.2s linear infinite}
.no-trace.d2{animation-delay:.6s}.no-trace.d3{animation-delay:1.2s}.no-trace.d4{animation-delay:1.7s}
@keyframes no-trace{to{stroke-dashoffset:0}}
.no-qpulse{animation:no-qp 1.8s ease-in-out infinite}
@keyframes no-qp{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.14);opacity:1}}
.no-shard{animation:no-shard 4.4s ease-in-out infinite}
.no-shard.s2{animation-delay:1.3s;animation-duration:5.2s}
@keyframes no-shard{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-5px) rotate(8deg)}}
.no-glint{animation:no-glint 4.2s ease-in-out infinite}
@keyframes no-glint{0%,45%{transform:translateX(-30px) rotate(18deg);opacity:0}55%{opacity:1}100%{transform:translateX(130px) rotate(18deg);opacity:0}}
.no-spin{animation:no-spin 6s linear infinite}
@keyframes no-spin{to{transform:rotate(360deg)}}
.no-scan{animation:no-scan 2.6s linear infinite}
@keyframes no-scan{0%{transform:translateY(0);opacity:0}10%{opacity:.8}90%{opacity:.6}100%{transform:translateY(36px);opacity:0}}
.no-rotor{animation:no-rotor .16s linear infinite alternate}
.no-rotor.r2,.no-rotor.r3{animation-duration:.2s}
@keyframes no-rotor{from{transform:scaleX(.72);opacity:.2}to{transform:scaleX(1);opacity:.5}}
.no-beam{animation:no-beam 2.6s ease-in-out infinite;transform-origin:50% 0}
@keyframes no-beam{0%,100%{opacity:.12;transform:scaleX(.8)}50%{opacity:.6;transform:scaleX(1.05)}}
.no-eye{animation:no-eye 2.2s ease-in-out infinite}
@keyframes no-eye{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.no-pupil{animation:no-pupil 3.1s ease-in-out infinite}
@keyframes no-pupil{0%,100%{transform:scale(1)}45%{transform:scale(1.7)}60%{transform:scale(.8)}}
.no-rot{animation:no-spin 16s linear infinite}
.no-rotr{animation:no-spin 9s linear infinite reverse}
.no-swirl{animation:no-spin 8s linear infinite}
.no-arc{opacity:0;animation:no-arc 1.7s steps(1) infinite}
.no-arc.d2{animation-delay:.55s}.no-arc.d3{animation-delay:1.05s}
@keyframes no-arc{0%{opacity:0}6%{opacity:1}12%{opacity:.25}18%{opacity:1}26%{opacity:0}}
.no-core{animation:no-core .9s ease-in-out infinite}
@keyframes no-core{0%,100%{transform:scale(1)}50%{transform:scale(1.16)}}
.no-core-glow{animation:no-cg 2.4s ease-in-out infinite}
@keyframes no-cg{0%,100%{opacity:.18}50%{opacity:.4}}

/* ------------------------------------------------------------------ cells */
.no-cell{position:relative;width:var(--cs);height:var(--cs);flex:none;--sc:#6aa8ff}
.no-tile{position:absolute;inset:4.5%;border-radius:16%;background:radial-gradient(120% 90% at 30% 10%,rgba(120,110,255,.16),transparent 60%),linear-gradient(165deg,rgba(34,26,86,.82),rgba(8,6,30,.94));box-shadow:inset 0 0 0 1px rgba(130,150,255,.2),inset 0 1px 0 rgba(255,255,255,.1),inset 0 -12px 24px rgba(0,0,0,.45);transition:box-shadow .3s}
.no-under{position:absolute;inset:12%;border-radius:50%;background:radial-gradient(closest-side,var(--sc),transparent);opacity:.3;filter:blur(calc(var(--cs)*.08));transition:opacity .3s}
.no-sym{position:absolute;inset:7%;transition:filter .35s,opacity .35s,transform .35s}
.no-sym svg{width:100%;height:100%;display:block;overflow:visible}
.no-st-dim .no-sym{opacity:.3;filter:saturate(.25) brightness(.65);transform:scale(.92)}
.no-st-dim .no-under{opacity:.04}
.no-st-front{z-index:5}
.no-st-front .no-sym{transform:scale(1.22);filter:brightness(1.22) drop-shadow(0 0 calc(var(--cs)*.12) var(--sc));animation:no-front .85s ease-in-out infinite}
.no-st-front .no-tile{box-shadow:inset 0 0 0 2px var(--sc),0 0 calc(var(--cs)*.3) var(--sc),inset 0 0 22px rgba(255,255,255,.12)}
.no-st-front .no-under{opacity:.75}
@keyframes no-front{0%,100%{transform:scale(1.2)}50%{transform:scale(1.28)}}
.no-st-win .no-sym{filter:drop-shadow(0 0 calc(var(--cs)*.07) var(--sc)) brightness(1.1)}
.no-st-win .no-under{opacity:.55}
.no-st-land .no-sym{animation:no-land .55s cubic-bezier(.2,.8,.3,1)}
@keyframes no-land{0%{transform:translateY(-16%) scale(.94,1.1)}45%{transform:translateY(0) scale(1.14,.86)}72%{transform:scale(.97,1.05)}100%{transform:scale(1)}}
.no-st-landorb .no-sym{animation:no-landorb .85s cubic-bezier(.2,.8,.3,1)}
@keyframes no-landorb{0%{transform:translateY(-22%) scale(.9,1.14);filter:brightness(2.6)}40%{transform:scale(1.24,.78);filter:brightness(2)}65%{transform:scale(.94,1.1);filter:brightness(1.3)}100%{transform:scale(1);filter:none}}
.no-shockring{position:absolute;inset:10%;border-radius:50%;border:2px solid var(--sc);pointer-events:none;opacity:0;animation:no-shock .85s ease-out forwards}
@keyframes no-shock{0%{transform:scale(.5);opacity:.95}100%{transform:scale(2.4);opacity:0}}
.no-flash{position:absolute;inset:0;border-radius:16%;background:radial-gradient(closest-side,#fff,transparent);pointer-events:none;opacity:0;animation:no-cflash .6s ease-out forwards}
@keyframes no-cflash{0%{opacity:.95;transform:scale(.6)}100%{opacity:0;transform:scale(1.6)}}

/* locked cores: holographic bracket frame, scan sweep and a living pulse */
.no-locked .no-tile{box-shadow:inset 0 0 0 1.5px var(--sc),inset 0 0 calc(var(--cs)*.3) rgba(255,255,255,.07),0 0 calc(var(--cs)*.18) var(--sc)}
.no-locked .no-under{opacity:.65;animation:no-lockpulse 1.6s ease-in-out infinite}
.no-locked .no-sym{animation:no-lockidle 2.2s ease-in-out infinite}
@keyframes no-lockpulse{0%,100%{opacity:.4}50%{opacity:.85}}
@keyframes no-lockidle{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.045);filter:brightness(1.18)}}
.no-holo{position:absolute;inset:2.5%;pointer-events:none;border-radius:16%;overflow:hidden}
.no-holo::before{content:"";position:absolute;inset:0;background:
linear-gradient(var(--sc),var(--sc)) top left/22% 2px no-repeat,linear-gradient(var(--sc),var(--sc)) top left/2px 22% no-repeat,
linear-gradient(var(--sc),var(--sc)) top right/22% 2px no-repeat,linear-gradient(var(--sc),var(--sc)) top right/2px 22% no-repeat,
linear-gradient(var(--sc),var(--sc)) bottom left/22% 2px no-repeat,linear-gradient(var(--sc),var(--sc)) bottom left/2px 22% no-repeat,
linear-gradient(var(--sc),var(--sc)) bottom right/22% 2px no-repeat,linear-gradient(var(--sc),var(--sc)) bottom right/2px 22% no-repeat;filter:drop-shadow(0 0 3px var(--sc));animation:no-bracket 1.4s ease-in-out infinite}
.no-holo::after{content:"";position:absolute;left:0;right:0;height:30%;top:-30%;background:linear-gradient(180deg,transparent,var(--sc),transparent);opacity:.28;animation:no-holosweep 2.4s linear infinite}
@keyframes no-bracket{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes no-holosweep{to{top:110%}}
.no-zap{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;opacity:0;animation:no-zapf 2.3s steps(1) infinite;overflow:visible}
.no-zap.z2{animation-delay:1.1s}
@keyframes no-zapf{0%{opacity:0}4%{opacity:1}9%{opacity:.2}14%{opacity:1}22%,100%{opacity:0}}
.no-st-lockin .no-sym{animation:no-lockin .8s cubic-bezier(.2,.9,.3,1)}
@keyframes no-lockin{0%{transform:scale(1.9);filter:brightness(3.4) saturate(.4);opacity:.2}45%{transform:scale(.86);filter:brightness(2)}70%{transform:scale(1.08)}100%{transform:scale(1);filter:none;opacity:1}}
.no-st-collect{z-index:5}
.no-st-collect .no-sym{animation:no-collect .7s ease-out}
.no-st-collect .no-tile{box-shadow:inset 0 0 0 2px #fff,0 0 calc(var(--cs)*.45) var(--sc)}
@keyframes no-collect{0%{transform:scale(1);filter:brightness(1)}35%{transform:scale(1.35);filter:brightness(3)}100%{transform:scale(1);filter:brightness(1.3)}}
.no-collected .no-sym{opacity:.55;filter:saturate(.5) brightness(.8)}
.no-pop{position:absolute;left:50%;top:6%;transform:translateX(-50%);z-index:8;font-weight:900;white-space:nowrap;font-size:calc(var(--cs)*.26);color:#fff;text-shadow:0 0 12px var(--sc),0 0 2px #000;pointer-events:none;animation:no-pop 1s ease-out forwards}
@keyframes no-pop{0%{opacity:0;transform:translate(-50%,10px) scale(.6)}20%{opacity:1;transform:translate(-50%,-6px) scale(1.15)}100%{opacity:0;transform:translate(-50%,-34px) scale(1)}}

/* empty hold sockets and respinning cells */
.no-socket{position:absolute;inset:26%;border-radius:50%;border:1.5px dashed rgba(150,175,255,.38);animation:no-spin 14s linear infinite}
.no-socket::after{content:"";position:absolute;inset:34%;border-radius:50%;background:rgba(130,160,255,.25);box-shadow:0 0 8px rgba(130,160,255,.4)}
.no-rs{position:absolute;inset:4.5%;border-radius:16%;overflow:hidden;background:linear-gradient(180deg,rgba(53,232,255,.06),rgba(255,63,208,.08))}
.no-rs::before{content:"";position:absolute;left:0;right:0;top:0;height:300%;background:
repeating-linear-gradient(180deg,transparent 0 12%,var(--c1) 12.4% 13.2%,transparent 13.6% 26%),
repeating-linear-gradient(180deg,transparent 0 5%,var(--c3) 5.2% 5.7%,transparent 6% 19%);background-size:30% 100%,18% 100%;background-position:12% 0,76% 0;background-repeat:no-repeat;opacity:.85;filter:blur(.6px);animation:no-rsmove .34s linear infinite}
.no-rs::after{content:"";position:absolute;inset:0;background:radial-gradient(closest-side,rgba(255,255,255,.22),transparent 80%);animation:no-rspulse .5s ease-in-out infinite alternate}
@keyframes no-rsmove{from{transform:translateY(-33.3%)}to{transform:translateY(0)}}
@keyframes no-rspulse{from{opacity:.3}to{opacity:1}}

/* ------------------------------------------------------------------ reels */
.no-reel{position:relative;width:var(--cs);height:calc(var(--cs)*4)}
.no-reel.spin{overflow:hidden}
.no-strip{position:absolute;left:0;top:0;width:100%;will-change:transform}
.no-reel.spin .no-strip{filter:blur(1.3px) brightness(1.15)}
.no-reel.spin::after{content:"";position:absolute;inset:0;z-index:6;pointer-events:none;background:repeating-linear-gradient(180deg,transparent 0 14%,rgba(53,232,255,.1) 14.4% 15.4%,transparent 15.8% 30%);background-size:100% 200%;animation:no-streak .3s linear infinite}
@keyframes no-streak{from{background-position:0 0}to{background-position:0 100%}}
.no-reel.antic::before{content:"";position:absolute;inset:-6%;z-index:7;pointer-events:none;border-radius:12px;box-shadow:0 0 calc(var(--cs)*.5) var(--c3),inset 0 0 calc(var(--cs)*.4) var(--c3);animation:no-antic .35s ease-in-out infinite alternate}
@keyframes no-antic{from{opacity:.35}to{opacity:1}}
.no-col{position:relative}
.no-col+.no-col::before{content:"";position:absolute;left:0;top:4%;bottom:4%;width:1px;background:linear-gradient(180deg,transparent,rgba(130,150,255,.35),transparent)}
.no-powerup .no-col{animation:no-pwr .9s both;animation-delay:calc(var(--i)*.16s + 1.5s)}
@keyframes no-pwr{0%{opacity:0;filter:brightness(5) saturate(0);transform:scaleY(.2)}40%{opacity:1;filter:brightness(3)}65%{transform:scaleY(1.04)}100%{filter:none;transform:none}}

/* --------------------------------------------------------------- machine */
.no-machine{position:relative;padding:calc(var(--cs)*.15);border-radius:calc(var(--cs)*.34)}
.no-rim{position:absolute;inset:-3px;border-radius:calc(var(--cs)*.37);overflow:hidden;pointer-events:none}
.no-rim i{position:absolute;left:-40%;top:50%;width:180%;aspect-ratio:1;margin-top:-90%;background:conic-gradient(from 0deg,var(--c1),transparent 12%,var(--c2) 28%,transparent 40%,var(--c3) 56%,transparent 68%,var(--c1) 84%,transparent 96%,var(--c1));animation:no-spin 7s linear infinite;opacity:.9}
.no-machine[data-glow="win"] .no-rim i{animation-duration:2.4s}
.no-machine[data-glow="bonus"] .no-rim i{animation-duration:1.4s}
.no-body{position:absolute;inset:0;border-radius:calc(var(--cs)*.34);background:linear-gradient(160deg,#1b1458 0%,#0b0828 42%,#150a40 100%);box-shadow:0 0 calc(var(--cs)*.9) rgba(0,0,0,.7),0 calc(var(--cs)*.5) calc(var(--cs)*1.4) color-mix(in srgb,var(--c2) 40%,transparent),inset 0 1px 0 rgba(255,255,255,.18),inset 0 0 calc(var(--cs)*.5) color-mix(in srgb,var(--c1) 22%,transparent);transition:box-shadow .6s}
.no-machine[data-glow="win"] .no-body{box-shadow:0 0 calc(var(--cs)*1.1) color-mix(in srgb,var(--c1) 55%,transparent),inset 0 0 calc(var(--cs)*.7) color-mix(in srgb,var(--c1) 35%,transparent)}
.no-machine[data-glow="bonus"] .no-body{box-shadow:0 0 calc(var(--cs)*1.4) color-mix(in srgb,var(--c3) 60%,transparent),inset 0 0 calc(var(--cs)*.8) color-mix(in srgb,var(--c3) 38%,transparent)}
.no-window{position:relative;border-radius:calc(var(--cs)*.2);background:radial-gradient(90% 70% at 50% 0%,rgba(80,70,200,.18),transparent 70%),#04030f;box-shadow:inset 0 0 calc(var(--cs)*.5) #000,0 0 0 2px rgba(150,170,255,.28),0 0 0 4px rgba(4,3,15,.8)}
.no-sheen{position:absolute;inset:0;border-radius:inherit;pointer-events:none;overflow:hidden;z-index:9}
.no-sheen::before{content:"";position:absolute;inset:-10% 0;width:40%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.08) 50%,transparent);transform:translateX(-120%) skewX(-14deg);animation:no-sheen 8s ease-in-out infinite}
@keyframes no-sheen{0%,55%{transform:translateX(-120%) skewX(-14deg)}100%{transform:translateX(330%) skewX(-14deg)}}
.no-screw{position:absolute;width:calc(var(--cs)*.1);height:calc(var(--cs)*.1);border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--c1) 40%,#0a0d26);box-shadow:0 0 10px var(--c1);animation:no-nodep 2.4s ease-in-out infinite}
@keyframes no-nodep{0%,100%{opacity:.6}50%{opacity:1}}

/* energy meter */
.no-meter{display:flex;gap:calc(var(--cs)*.025);height:calc(var(--cs)*.17)}
.no-seg{flex:1;border-radius:calc(var(--cs)*.03);background:rgba(90,105,210,.16);box-shadow:inset 0 0 0 1px rgba(130,150,255,.22);transition:background .25s,box-shadow .25s,transform .25s}
.no-seg.on{background:linear-gradient(180deg,#fff,var(--c1) 55%);box-shadow:0 0 calc(var(--cs)*.1) var(--c1),inset 0 0 0 1px rgba(255,255,255,.5)}
.no-seg.on.s2{background:linear-gradient(180deg,#fff,var(--c2) 55%);box-shadow:0 0 calc(var(--cs)*.1) var(--c2),inset 0 0 0 1px rgba(255,255,255,.5)}
.no-seg.on.s3{background:linear-gradient(180deg,#fff,var(--c3) 55%);box-shadow:0 0 calc(var(--cs)*.12) var(--c3),inset 0 0 0 1px rgba(255,255,255,.5)}
.no-seg.pop{animation:no-segpop .55s ease-out}
@keyframes no-segpop{0%{transform:scaleY(2.2);filter:brightness(3)}100%{transform:none;filter:none}}
.no-meterflow{position:absolute;inset:0;pointer-events:none;border-radius:4px;overflow:hidden}
.no-meterflow::before{content:"";position:absolute;top:0;bottom:0;width:22%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);animation:no-flow 2.8s linear infinite}
@keyframes no-flow{from{left:-25%}to{left:110%}}

/* ------------------------------------------------------- environment */
.no-kb{animation:no-kb 46s ease-in-out infinite alternate;will-change:transform}
@keyframes no-kb{from{transform:scale(1.06) translate3d(-1.2%,0,0)}to{transform:scale(1.18) translate3d(1.4%,-1.4%,0)}}
.no-side{animation:no-side 26s ease-in-out infinite alternate;will-change:transform}
@keyframes no-side{from{transform:scale(1.02)}to{transform:scale(1.1)}}
.no-floor3d{position:absolute;left:-30%;right:-30%;bottom:0;height:46%;perspective:420px;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,transparent,#000 40%);mask-image:linear-gradient(180deg,transparent,#000 40%)}
.no-grid{position:absolute;left:0;right:0;bottom:-30%;height:150%;transform:rotateX(68deg);transform-origin:50% 100%;background:
linear-gradient(90deg,color-mix(in srgb,var(--c1) 60%,transparent) 1.5px,transparent 1.5px) 0 0/64px 64px,
linear-gradient(180deg,color-mix(in srgb,var(--c3) 55%,transparent) 1.5px,transparent 1.5px) 0 0/64px 64px;animation:no-gridmove 2.6s linear infinite}
@keyframes no-gridmove{to{background-position:0 0,0 64px}}
.no-od .no-grid{animation-duration:.9s}
.no-bars{position:absolute;inset:0;overflow:hidden;mix-blend-mode:screen;pointer-events:none}
.no-bar{position:absolute;top:-10%;bottom:-10%;width:9%;background:linear-gradient(180deg,transparent,var(--bc),transparent);opacity:.18;filter:blur(6px);transform:skewX(-14deg);animation:no-bar 11s ease-in-out infinite alternate}
@keyframes no-bar{from{transform:translateX(-40vw) skewX(-14deg)}to{transform:translateX(40vw) skewX(-14deg)}}
.no-rings{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none}
.no-ring{position:absolute;left:0;top:0;width:min(120vh,120vw);aspect-ratio:1;margin:calc(min(120vh,120vw)/-2);border-radius:50%;border:2px solid var(--c1);box-shadow:0 0 30px var(--c1),inset 0 0 40px color-mix(in srgb,var(--c1) 40%,transparent);opacity:0;animation:no-ringpulse 6s ease-out infinite}
@keyframes no-ringpulse{0%{transform:scale(.25);opacity:0}12%{opacity:.5}100%{transform:scale(1);opacity:0}}
.no-core-bg{position:absolute;left:50%;top:50%;width:min(100vh,100vw);aspect-ratio:1;transform:translate(-50%,-50%);opacity:.55;pointer-events:none}
.no-core-bg svg{width:100%;height:100%}
.no-corepulse{animation:no-cpl 3.2s ease-in-out infinite;transform-origin:50% 50%}
@keyframes no-cpl{0%,100%{opacity:.5;transform:scale(.96)}50%{opacity:1;transform:scale(1.04)}}
.no-scanlines{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(180deg,rgba(0,0,0,.0) 0 2px,rgba(0,0,0,.22) 3px);opacity:.28;mix-blend-mode:multiply}
.no-holopanel{position:absolute;border:1.5px solid var(--c1);border-radius:6px;background:linear-gradient(180deg,color-mix(in srgb,var(--c1) 14%,transparent),transparent);box-shadow:0 0 22px color-mix(in srgb,var(--c1) 45%,transparent);overflow:hidden;animation:no-holofl 7s ease-in-out infinite alternate}
.no-holopanel::before{content:"";position:absolute;left:0;right:0;top:0;height:200%;background:repeating-linear-gradient(180deg,transparent 0 9px,color-mix(in srgb,var(--c1) 70%,transparent) 9px 11px,transparent 11px 20px,color-mix(in srgb,var(--c3) 60%,transparent) 20px 21px,transparent 21px 34px);opacity:.7;animation:no-holo-scroll 5s linear infinite}
.no-holopanel::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(255,255,255,.18) 50%,transparent 55%);animation:no-glitchbar 3.4s steps(8) infinite}
@keyframes no-holofl{from{transform:translateY(-8px)}to{transform:translateY(10px)}}
@keyframes no-holo-scroll{to{transform:translateY(-50%)}}
@keyframes no-glitchbar{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
.no-pylon{position:absolute;top:8%;bottom:8%;width:calc(var(--cs)*.16);border-radius:99px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.1));box-shadow:inset 0 0 0 1px rgba(150,170,255,.3),0 0 30px color-mix(in srgb,var(--c2) 35%,transparent);overflow:hidden}
.no-pylon::before{content:"";position:absolute;left:18%;right:18%;height:36%;top:0;border-radius:99px;background:linear-gradient(180deg,transparent,var(--c1),#fff,var(--c3),transparent);animation:no-pyl 2.6s ease-in-out infinite;filter:blur(1px)}
.no-pylon.r::before{animation-delay:1.3s}
@keyframes no-pyl{0%{top:-40%}100%{top:105%}}
.no-flicker{animation:no-flk 5.5s steps(1) infinite}
@keyframes no-flk{0%,92%,96%{opacity:1}93%{opacity:.4}95%{opacity:.8}97%{opacity:.5}}

/* ------------------------------------------------------------- controls */
.no-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid color-mix(in srgb,var(--c1) 55%,transparent);background:linear-gradient(180deg,rgba(40,34,110,.8),rgba(8,6,32,.9));color:#cfeaff;box-shadow:0 4px 14px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.2),0 0 14px color-mix(in srgb,var(--c1) 20%,transparent);backdrop-filter:blur(6px);transition:transform .12s,border-color .2s,box-shadow .2s,color .2s;cursor:pointer}
.no-btn:hover:not(:disabled){border-color:var(--c1);color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.6),0 0 22px color-mix(in srgb,var(--c1) 55%,transparent)}
.no-btn:active:not(:disabled){transform:translateY(1px) scale(.95)}
.no-btn:disabled{opacity:.4;cursor:not-allowed}
.no-btn:focus-visible,.no-spinbtn:focus-visible{outline:2px solid #fff;outline-offset:3px}
.no-spinbtn{position:relative;width:var(--sp);height:var(--sp);border-radius:50%;border:0;padding:0;cursor:pointer;color:#fff;background:transparent;transition:transform .12s,filter .3s}
.no-spinbtn:active:not(:disabled){transform:scale(.94)}
.no-spinbtn:disabled{cursor:not-allowed;filter:saturate(.35) brightness(.7)}
.no-spinbtn .ring{position:absolute;inset:0;border-radius:50%;overflow:hidden;box-shadow:0 0 calc(var(--sp)*.35) color-mix(in srgb,var(--c3) 60%,transparent),0 8px 24px rgba(0,0,0,.6)}
.no-spinbtn .ring i{position:absolute;left:-25%;top:-25%;width:150%;height:150%;background:conic-gradient(var(--c1),var(--c2),var(--c3),var(--c1));animation:no-spin 4s linear infinite}
.no-spinbtn.busy .ring i{animation-duration:.8s}
.no-spinbtn .face{position:absolute;inset:6%;border-radius:50%;background:radial-gradient(120% 100% at 50% 0%,#5a42d8,#1a1060 55%,#0a0630);box-shadow:inset 0 2px 0 rgba(255,255,255,.35),inset 0 -10px 22px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px}
.no-spinbtn .face::before{content:"";position:absolute;left:14%;right:14%;top:7%;height:36%;border-radius:50%;background:linear-gradient(180deg,rgba(255,255,255,.4),transparent)}
.no-spinbtn.ready .ring{animation:no-spinready 1.8s ease-in-out infinite}
@keyframes no-spinready{0%,100%{box-shadow:0 0 calc(var(--sp)*.25) color-mix(in srgb,var(--c3) 45%,transparent),0 8px 24px rgba(0,0,0,.6)}50%{box-shadow:0 0 calc(var(--sp)*.6) var(--c3),0 8px 24px rgba(0,0,0,.6)}}
.no-lcd{border-radius:10px;background:linear-gradient(180deg,rgba(4,3,22,.9),rgba(14,10,52,.85));box-shadow:inset 0 0 0 1px rgba(130,150,255,.28),inset 0 2px 8px rgba(0,0,0,.6)}

/* ------------------------------------------------------- shake and flash */
.no-sh1{animation:no-sh1 .7s}.no-sh2{animation:no-sh2 1.2s}.no-sh3{animation:no-sh3 1.8s}.no-sh4{animation:no-sh4 2.7s}
@keyframes no-sh1{10%,50%,90%{transform:translate(-1px,1px)}30%,70%{transform:translate(1px,-1px)}}
@keyframes no-sh2{10%{transform:translate(-3px,2px) rotate(-.2deg)}30%{transform:translate(3px,-2px) rotate(.2deg)}50%{transform:translate(-2px,-2px)}70%{transform:translate(2px,2px)}90%{transform:translate(-1px,1px)}}
@keyframes no-sh3{0%,100%{transform:none}8%{transform:translate(-5px,3px) rotate(-.4deg)}20%{transform:translate(5px,-4px) rotate(.4deg)}35%{transform:translate(-4px,-3px)}50%{transform:translate(4px,3px) rotate(-.3deg)}70%{transform:translate(-3px,2px)}85%{transform:translate(2px,-2px)}}
@keyframes no-sh4{0%,100%{transform:none}6%{transform:translate(-8px,5px) rotate(-.7deg)}14%{transform:translate(8px,-6px) rotate(.7deg)}24%{transform:translate(-7px,-5px)}36%{transform:translate(7px,5px) rotate(-.6deg)}50%{transform:translate(-5px,4px)}65%{transform:translate(5px,-3px) rotate(.4deg)}80%{transform:translate(-3px,2px)}}
.no-qk-1{animation:no-qk1 .11s linear infinite}.no-qk-2{animation:no-qk2 .1s linear infinite}.no-qk-3{animation:no-qk3 .09s linear infinite}.no-qk-4{animation:no-qk4 .08s linear infinite}
@keyframes no-qk1{25%{transform:translate(-1px,1px)}50%{transform:translate(1px,-1px)}75%{transform:translate(-1px,-1px)}}
@keyframes no-qk2{25%{transform:translate(-3px,2px)}50%{transform:translate(3px,-2px)}75%{transform:translate(-2px,-3px) rotate(.2deg)}}
@keyframes no-qk3{25%{transform:translate(-5px,3px) rotate(-.3deg)}50%{transform:translate(5px,-4px) rotate(.3deg)}75%{transform:translate(-4px,-4px)}}
@keyframes no-qk4{25%{transform:translate(-8px,5px) rotate(-.5deg)}50%{transform:translate(8px,-6px) rotate(.5deg)}75%{transform:translate(-6px,-6px) rotate(.4deg)}}
.no-calm [class*="no-sh"],.no-calm [class*="no-qk"]{animation-duration:2.4s}
.no-flashfx{animation:no-flashfx .55s ease-out forwards}
@keyframes no-flashfx{0%{opacity:.85}100%{opacity:0}}

/* -------------------------------------------------------------- beams */
.no-comet{stroke-dasharray:16 84;stroke-dashoffset:16;animation:no-comet 1s linear infinite}
@keyframes no-comet{to{stroke-dashoffset:-84}}
.no-draw{stroke-dasharray:100;stroke-dashoffset:100;animation:no-draw .5s ease-out forwards}
@keyframes no-draw{to{stroke-dashoffset:0}}
.no-node{transform-box:fill-box;transform-origin:center;animation:no-node .8s ease-in-out infinite}
@keyframes no-node{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.7);opacity:1}}

/* ---------------------------------------------------------- celebration */
.no-title{position:relative;display:inline-block;font-family:Impact,"Arial Black",system-ui,sans-serif;font-style:italic;line-height:.95;letter-spacing:.05em;color:#fff;text-align:center;animation:no-titlein .7s cubic-bezier(.2,1.4,.3,1) both}
.no-title::before,.no-title::after{content:attr(data-t);position:absolute;left:0;top:0;width:100%;pointer-events:none;mix-blend-mode:screen}
.no-title::before,.no-title::after{-webkit-text-fill-color:currentColor}
.no-title::before{color:#ff2bd6;clip-path:inset(0 0 52% 0);animation:no-gl1 .8s steps(1) infinite}
.no-title::after{color:#25f0ff;clip-path:inset(48% 0 0 0);animation:no-gl2 1s steps(1) infinite}
@keyframes no-gl1{0%{transform:translate(-4px,0)}20%{transform:translate(5px,1px)}40%{transform:translate(-2px,-1px)}60%{transform:translate(6px,0)}80%{transform:translate(-5px,1px)}}
@keyframes no-gl2{0%{transform:translate(4px,0)}25%{transform:translate(-6px,-1px)}50%{transform:translate(3px,1px)}75%{transform:translate(-4px,0)}}
@keyframes no-titlein{0%{transform:scale(3.2) skewX(-18deg);opacity:0;filter:blur(12px)}60%{transform:scale(.94)}100%{transform:scale(1);opacity:1;filter:none}}
.no-rays{position:absolute;left:50%;top:50%;width:230vmax;height:230vmax;margin:-115vmax;background:repeating-conic-gradient(from 0deg,var(--ray) 0 6deg,transparent 6deg 15deg);-webkit-mask-image:radial-gradient(closest-side,#000 6%,transparent 70%);mask-image:radial-gradient(closest-side,#000 6%,transparent 70%);animation:no-spin 26s linear infinite;opacity:.5}
.no-glitchbars{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.no-glitchbars i{position:absolute;left:0;right:0;height:6px;background:var(--gb);opacity:0;mix-blend-mode:screen;animation:no-gbar 1.6s steps(1) infinite}
@keyframes no-gbar{0%{opacity:0}5%{opacity:.8;transform:translateX(-30px)}10%{opacity:0}40%{opacity:.6;transform:translateX(40px)}44%{opacity:0}}
.no-amount{font-variant-numeric:tabular-nums;text-shadow:0 0 20px var(--cc),0 0 60px var(--cc),0 3px 0 rgba(0,0,0,.6)}
.no-bannerin{animation:no-bannerin .8s cubic-bezier(.2,1.2,.3,1) both}
@keyframes no-bannerin{0%{transform:scale(.4) rotateX(70deg);opacity:0}100%{transform:none;opacity:1}}
.no-warp{position:absolute;inset:0;background:radial-gradient(closest-side,transparent 20%,var(--c1) 60%,transparent 100%);mix-blend-mode:screen;animation:no-warp 1.1s ease-in forwards}
@keyframes no-warp{0%{transform:scale(.2);opacity:0}30%{opacity:.9}100%{transform:scale(3);opacity:0}}
.no-speed{position:absolute;inset:-20%;background:repeating-conic-gradient(from 0deg at 50% 50%,transparent 0 3deg,color-mix(in srgb,var(--c1) 50%,transparent) 3deg 3.6deg);-webkit-mask-image:radial-gradient(closest-side,transparent 25%,#000 85%);mask-image:radial-gradient(closest-side,transparent 25%,#000 85%);animation:no-speed .5s linear infinite;opacity:.6;mix-blend-mode:screen}
@keyframes no-speed{from{transform:scale(1);opacity:.8}to{transform:scale(1.35);opacity:.2}}

/* boot sequence */
.no-bootbar{position:relative;height:6px;border-radius:9px;background:rgba(150,170,255,.2);overflow:hidden}
.no-bootbar i{position:absolute;inset:0;background:linear-gradient(90deg,var(--c1),var(--c3));transform-origin:left;animation:no-bootfill 1.9s cubic-bezier(.5,0,.2,1) forwards;box-shadow:0 0 14px var(--c1)}
@keyframes no-bootfill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.no-bootline{opacity:0;animation:no-bootline .3s steps(4) forwards}
@keyframes no-bootline{to{opacity:1}}

@media (prefers-reduced-motion:reduce){
  .no-kb,.no-side,.no-bar,.no-holopanel{animation-duration:90s}
  .no-grid{animation-duration:8s}
}
`;
