export const TIGER_CLASH_CSS = `
.tc-root{--tc-gold:#e0a63e;--tc-gold2:#f3cd82;--tc-blue:#3db8ff;--tc-blue2:#9be4ff;--tc-line:rgba(255,255,255,.08);--tc-edge:rgba(224,166,62,.24);--lx-gold:#e0a63e;
  --tc-serif:var(--font-atlantis),"Cinzel",Georgia,serif;
  background:#05060a;color:#e8ecf6;font-family:var(--font-body),system-ui,sans-serif}
.tc-root *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.16) transparent}
.tc-num{font-family:var(--font-num),ui-monospace,monospace;font-variant-numeric:tabular-nums}
.tc-display{font-family:var(--tc-serif);font-weight:400!important}

/* the screen: the arena is the scene, the interface floats over it */
.tc-ui{position:relative;display:flex;flex-direction:column;min-height:100dvh;padding:0 14px 12px}
.tc-head{order:1;position:relative;isolation:isolate;z-index:5;display:grid;grid-template-columns:1fr auto 1fr;align-items:start;gap:10px;padding-top:12px}
.tc-head::before{content:"";position:absolute;left:-14px;right:-14px;top:0;height:190%;background:linear-gradient(180deg,rgba(2,3,6,.82),rgba(2,3,6,0));pointer-events:none;z-index:-1}
.tc-head-l{display:flex;align-items:center;gap:8px}
.tc-head-r{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.tc-title{margin:0;line-height:0}
.tc-title img{display:block;width:clamp(300px,36vw,640px);height:auto;mix-blend-mode:screen;filter:drop-shadow(0 4px 14px rgba(0,0,0,.8));user-select:none}
.tc-results{order:2;position:relative;z-index:5;display:flex;align-items:center;gap:8px;width:max-content;max-width:100%;margin-top:8px;padding:6px 14px 6px 16px;border-radius:999px;overflow-x:auto;overflow-y:hidden;background:rgba(7,9,14,.74);backdrop-filter:blur(6px);box-shadow:inset 0 0 0 1px var(--tc-edge)}
.tc-results-l{flex-shrink:0;font-size:13px;color:#d6d9e6;margin-right:4px}
.tc-coinbadge{flex-shrink:0;width:30px;height:30px;border-radius:50%;line-height:0;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.6)}
.tc-coinbadge img{display:block;width:100%;height:100%}
.tc-grow{order:3;flex:1}

.tc-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:38px;padding:0 15px;border-radius:12px;font-size:13.5px;font-weight:600;color:#e3e6f0;background:rgba(7,9,14,.78);backdrop-filter:blur(6px);box-shadow:inset 0 0 0 1px var(--tc-edge);transition:color .2s,box-shadow .2s,background .2s}
.tc-btn:hover{color:#fff;box-shadow:inset 0 0 0 1px rgba(224,166,62,.7)}
.tc-icon{display:inline-flex;align-items:center;justify-content:center;width:40px;height:38px;border-radius:12px;color:#f0c46a;background:rgba(7,9,14,.78);backdrop-filter:blur(6px);box-shadow:inset 0 0 0 1px var(--tc-edge);transition:color .2s,box-shadow .2s}
.tc-icon:hover{color:#fff;box-shadow:inset 0 0 0 1px rgba(224,166,62,.7)}
.tc-icon[aria-pressed="false"]{color:#566079}
.tc-bal{display:flex;align-items:center;gap:9px;height:38px;padding:0 16px 0 10px;border-radius:999px;background:rgba(7,9,14,.78);backdrop-filter:blur(6px);box-shadow:inset 0 0 0 1px rgba(224,166,62,.45)}
.tc-coin{display:inline-block;width:18px;height:18px;border-radius:50%;flex-shrink:0;background:radial-gradient(circle at 35% 30%,#f7dc9e,#d49a2f 55%,#80560f)}
.tc-pill{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;font-size:12px;font-weight:700;color:#1b1204;background:var(--tc-gold2);animation:tcg-pulse 2s ease-in-out infinite}
@keyframes tcg-pulse{50%{box-shadow:0 0 0 5px rgba(224,166,62,.22)}}

/* arena (scene) */
.tc-arena{position:absolute;inset:0;z-index:0;container-type:size;overflow:hidden;isolation:isolate;background:#05060a}
.tcb{position:absolute;inset:0;z-index:0;overflow:hidden}
.tcb-svg{display:block;width:100%;height:100%}
.tcb-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(70% 60% at 50% 50%,transparent 42%,rgba(0,0,0,.6)),linear-gradient(180deg,rgba(0,0,0,.35),transparent 22%,transparent 62%,rgba(0,0,0,.55))}
.tcb-mist{animation:tcb-drift 22s ease-in-out infinite alternate}
.tcb-mist2{animation-duration:28s;animation-direction:alternate-reverse}
@keyframes tcb-drift{from{transform:translateX(-90px)}to{transform:translateX(90px)}}
.tc-stage-char{position:absolute;z-index:2;pointer-events:none}
.tc-stage-char[data-side="tiger"]{left:0;bottom:max(31cqh,282px);width:min(33cqw,calc((100cqh - max(31cqh,282px) - 120px) * 1.138));aspect-ratio:535/470}
.tc-stage-char[data-side="dragon"]{right:0;bottom:max(31cqh,282px);width:min(33cqw,calc((100cqh - max(31cqh,282px) - 120px) * .976));aspect-ratio:537/550}
.tc-stage-char[data-win="true"]{z-index:3}
.tc-fx{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none}
.tc-flash{position:absolute;inset:0;z-index:6;pointer-events:none;opacity:0}
.tc-shake{animation:tc-shake .6s cubic-bezier(.36,.07,.19,.97) both}
@keyframes tc-shake{10%,90%{transform:translate3d(-1px,0,0)}20%,80%{transform:translate3d(3px,1px,0)}30%,50%,70%{transform:translate3d(-6px,-1px,0)}40%,60%{transform:translate3d(6px,1px,0)}}

/* cards cluster */
.tc-cards{position:absolute;left:50%;top:25cqh;transform:translateX(-50%);z-index:4;display:flex;align-items:flex-start;justify-content:center}
.tc-col{display:flex;flex-direction:column;align-items:center;gap:10px}
.tc-val{min-height:26px;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 12px;border-radius:999px;font-family:var(--font-num),monospace;font-size:clamp(.72rem,1.15vw,.92rem);font-weight:700;background:rgba(5,7,12,.84);box-shadow:inset 0 0 0 1px var(--tc-edge);opacity:0;transform:translateY(-4px);transition:opacity .35s,transform .35s;white-space:nowrap}
.tc-val[data-on="true"]{opacity:1;transform:none}
.tc-val[data-side="tiger"]{color:var(--tc-gold2)}
.tc-val[data-side="dragon"]{color:var(--tc-blue2)}
.tc-val-who{font-family:var(--tc-serif);letter-spacing:.14em;text-transform:uppercase;font-size:.85em;opacity:.8}
.tc-mid{align-self:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:13.5cqw;min-height:20cqh;text-align:center}
.tc-vs{font-family:var(--tc-serif);font-size:clamp(1.4rem,3.2cqw,2.6rem);letter-spacing:.14em;color:#dfe2ec;text-shadow:0 2px 16px rgba(0,0,0,.95)}
.tc-status{font-size:clamp(.66rem,1vw,.82rem);font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#e3e6f0;text-shadow:0 2px 10px rgba(0,0,0,.95)}
.tc-timer{position:relative;width:min(9cqw,17cqh);min-width:76px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:50%;background:radial-gradient(circle,#0b0d14 55%,#12151f 100%);box-shadow:0 0 0 2px #05060a,0 0 0 3px rgba(224,166,62,.55),0 14px 30px -10px #000}
.tc-timer::before,.tc-timer::after{content:"";position:absolute;left:50%;width:9px;height:9px;margin-left:-4.5px;background:linear-gradient(135deg,#f6dfa4,#a8741a);transform:rotate(45deg)}
.tc-timer::before{top:-11px}
.tc-timer::after{bottom:-11px}
.tc-timer svg{position:absolute;inset:6%;width:88%;height:88%}
.tc-timer b{position:relative;font-family:var(--tc-serif);font-size:clamp(1.9rem,3.6cqw,3.4rem);font-weight:400;color:#f3cd82;text-shadow:0 0 18px rgba(224,150,40,.6)}

/* playing cards */
.tcc-slot{--cw:min(11cqw,19.5cqh);position:relative;width:var(--cw);aspect-ratio:5/7;perspective:1000px}
.tcc-ghost{position:absolute;inset:0;border-radius:6%/4.3%;border:1px dashed rgba(224,166,62,.3);background:rgba(0,0,0,.35)}
.tcc-card{position:absolute;inset:0;opacity:0;transform:translateY(-34px) scale(.84);transition:opacity .35s,transform .55s cubic-bezier(.2,.9,.3,1.12)}
.tcc-card[data-dealt="true"]{opacity:1;transform:none}
.tcc-inner{position:absolute;inset:0;transform-style:preserve-3d;transition:transform 1.15s cubic-bezier(.3,.8,.25,1.06)}
.tcc-card[data-face="up"] .tcc-inner{transform:rotateY(180deg)}
.tcc-face{position:absolute;inset:0;border-radius:6%/4.3%;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 18px 34px -12px rgba(0,0,0,.95)}
.tcc-back{background:#080a10}
.tcc-svg{display:block;width:100%;height:100%}
.tcc-front{transform:rotateY(180deg);background:#f2ecdc linear-gradient(155deg,#fbf7ec 0%,#f0e9d8 55%,#e3dac3 100%);box-shadow:0 18px 34px -12px rgba(0,0,0,.95),inset 0 0 0 2px #c9922c}
.tcc-front::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(120,100,60,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(120,100,60,.03) 0 1px,transparent 1px 3px);pointer-events:none}
.tcc-front::after{content:"";position:absolute;inset:5%;border-radius:4%/3%;border:1px solid rgba(160,115,40,.45);pointer-events:none}
.tcc-front-in{position:absolute;inset:0;container-type:inline-size}
.tcc-corner{position:absolute;display:flex;flex-direction:column;align-items:center;line-height:1}
.tcc-tl{left:10%;top:7%}
.tcc-br{right:10%;bottom:7%;transform:rotate(180deg)}
.tcc-rank{font-family:var(--tc-serif);font-size:27cqw;letter-spacing:-.02em}
.tcc-pip{width:19cqw;height:19cqw;margin-top:2cqw}
.tcc-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.tcc-big{width:48cqw;height:48cqw;opacity:.92;filter:drop-shadow(0 2px 2px rgba(0,0,0,.22))}
.tcc-royal{position:absolute;font-family:var(--tc-serif);font-size:30cqw;color:#fff;mix-blend-mode:overlay;opacity:.9}
.tcc-card[data-state="win"]{filter:drop-shadow(0 0 18px var(--glow,rgba(224,166,62,.9)));animation:tcc-win 1.1s ease-in-out infinite alternate}
.tcc-card[data-tone="tiger"][data-state="win"]{--glow:rgba(255,170,50,.95)}
.tcc-card[data-tone="dragon"][data-state="win"]{--glow:rgba(70,180,255,.95)}
.tcc-card[data-state="tie"]{filter:drop-shadow(0 0 16px rgba(255,255,255,.7))}
.tcc-card[data-state="lose"]{filter:brightness(.55) saturate(.5)}
@keyframes tcc-win{from{transform:translateY(0) scale(1)}to{transform:translateY(-5px) scale(1.035)}}

/* winner banner */
.tc-banner{position:absolute;left:50%;top:13cqh;z-index:7;transform:translateX(-50%);text-align:center;pointer-events:none;white-space:nowrap}
.tc-banner h2{margin:0;font-family:var(--tc-serif);font-weight:400;font-size:clamp(1.4rem,4.4cqw,4rem);letter-spacing:.12em;line-height:1}
.tc-banner[data-k="tiger"] h2{background:linear-gradient(180deg,#fff1cf,#f3cd82 45%,#d9972c 72%,#9a5d0d);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 22px rgba(255,150,40,.8)) drop-shadow(0 3px 0 rgba(30,15,0,.85))}
.tc-banner[data-k="dragon"] h2{background:linear-gradient(180deg,#f1fbff,#9be4ff 45%,#3db8ff 72%,#1b6fb0);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 22px rgba(61,184,255,.85)) drop-shadow(0 3px 0 rgba(0,20,40,.85))}
.tc-banner[data-k="tie"] h2{background:linear-gradient(90deg,#f3cd82,#fff 50%,#9be4ff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 18px rgba(255,255,255,.45)) drop-shadow(0 3px 0 rgba(0,0,0,.85))}
.tc-banner p{margin:8px 0 0;font-size:clamp(.74rem,1.2vw,.98rem);font-weight:600;color:#eef1f9;text-shadow:0 2px 10px rgba(0,0,0,.95)}

/* the three selections: pointed-end frames with the painted emblems */
.tc-picks{order:4;position:relative;z-index:5;display:flex;justify-content:center;gap:clamp(10px,1.6vw,28px);margin:0 auto 12px;width:100%}
.tc-pick{position:relative;flex:0 1 clamp(210px,17.6vw,310px);height:76px;padding:0;color:#fff;transition:transform .18s,filter .25s,opacity .2s;filter:drop-shadow(0 8px 14px rgba(0,0,0,.6))}
.tc-pick-frame{position:relative;display:flex;align-items:center;gap:14px;width:100%;height:100%;padding:0 22px 0 12px;clip-path:polygon(16px 0,calc(100% - 16px) 0,100% 50%,calc(100% - 16px) 100%,16px 100%,0 50%);transition:background .25s}
.tc-pick-frame::before{content:"";position:absolute;inset:2.5px;clip-path:polygon(15px 0,calc(100% - 15px) 0,100% 50%,calc(100% - 15px) 100%,15px 100%,0 50%);transition:background .25s}
.tc-pick-frame>*{position:relative;z-index:1}
.tc-pick-emblem{width:56px;height:56px;flex-shrink:0;border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,.7)}
.tc-pick-txt{display:flex;flex:1;flex-direction:column;align-items:center;line-height:1.1}
.tc-pick-txt b{font-family:var(--tc-serif);font-size:clamp(1.15rem,1.9vw,1.7rem);font-weight:400;letter-spacing:.12em;text-shadow:0 2px 6px rgba(0,0,0,.8)}
.tc-pick-txt small{margin-top:3px;font-family:var(--font-num),monospace;font-size:11px;opacity:.7}
.tc-pick[data-side="tiger"] .tc-pick-frame{background:linear-gradient(180deg,#ffe3a0,#c98a24 50%,#7a4a0e)}
.tc-pick[data-side="tiger"] .tc-pick-frame::before{background:linear-gradient(180deg,#3b2208,#5a3410 55%,#2b1706)}
.tc-pick[data-side="tie"] .tc-pick-frame{background:linear-gradient(180deg,#d7caff,#7a5bd1 50%,#3b2a7a)}
.tc-pick[data-side="tie"] .tc-pick-frame::before{background:linear-gradient(180deg,#241649,#3b2270 55%,#170e33)}
.tc-pick[data-side="dragon"] .tc-pick-frame{background:linear-gradient(180deg,#bfeaff,#3a8fe0 50%,#173f8a)}
.tc-pick[data-side="dragon"] .tc-pick-frame::before{background:linear-gradient(180deg,#081a3a,#0f3a78 55%,#06142e)}
.tc-pick:hover:not(:disabled){transform:translateY(-2px)}
.tc-pick:active:not(:disabled){transform:scale(.985)}
.tc-pick:disabled{cursor:not-allowed;opacity:.5}
.tc-pick[aria-pressed="true"]{opacity:1}
.tc-pick[data-side="tiger"][aria-pressed="true"]{filter:drop-shadow(0 0 16px rgba(255,160,40,.85)) brightness(1.18)}
.tc-pick[data-side="tie"][aria-pressed="true"]{filter:drop-shadow(0 0 16px rgba(170,140,255,.8)) brightness(1.2)}
.tc-pick[data-side="dragon"][aria-pressed="true"]{filter:drop-shadow(0 0 16px rgba(70,170,255,.9)) brightness(1.2)}
.tc-pick[aria-pressed="true"]::after{content:"Selected";position:absolute;left:50%;top:-10px;transform:translateX(-50%);padding:1px 10px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0a0d14;background:#f1f3fa;z-index:2}

/* bottom panels */
.tc-bottom{order:5;position:relative;z-index:5;display:grid;grid-template-columns:1fr 1.1fr 1.5fr 1.35fr 1.7fr;grid-template-rows:auto auto;gap:10px;align-items:stretch}
.tc-cell{grid-row:1/3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 12px;border-radius:12px;background:rgba(7,9,14,.84);backdrop-filter:blur(8px);box-shadow:inset 0 0 0 1px var(--tc-edge);min-width:0}
.tc-cell h3{margin:0;width:100%;padding-bottom:7px;text-align:center;font-family:var(--tc-serif);font-size:13px;font-weight:400;letter-spacing:.14em;text-transform:uppercase;color:#d8dbe8;border-bottom:1px solid var(--tc-line)}
.tc-cell-v{display:flex;align-items:center;justify-content:center;gap:9px;margin:0;font-family:var(--font-num),monospace;font-size:clamp(1.05rem,1.7vw,1.5rem);font-weight:700;color:#fff;text-align:center}
.tc-sum{grid-row:1;grid-column:5;align-items:stretch;justify-content:flex-start;gap:7px;padding:12px}
.tc-sum-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;color:#c9cdda}
.tc-sum-row b{color:#fff;font-weight:600}
.tc-stake{display:flex;align-items:center;width:100%;height:46px;border-radius:999px;background:#07090e;box-shadow:inset 0 0 0 1px var(--tc-line),inset 0 3px 8px rgba(0,0,0,.6);transition:box-shadow .2s;min-width:0}
.tc-stake:focus-within{box-shadow:inset 0 0 0 1px rgba(224,166,62,.85),0 0 0 3px rgba(224,166,62,.12)}
.tc-stake[data-off="true"]{opacity:.55}
.tc-stake input{min-width:0;width:100%;flex:1;height:100%;background:transparent;text-align:center;font-family:var(--font-num),monospace;font-size:20px;font-weight:700;color:#fff}
.tc-stake input:focus{outline:none}
.tc-step{display:flex;align-items:center;justify-content:center;width:46px;height:38px;margin:0 3px;border-radius:999px;color:#e6c98a;background:#161a26;box-shadow:inset 0 0 0 1px rgba(224,166,62,.28);transition:color .15s,background .15s;flex-shrink:0}
.tc-step:hover:not(:disabled){color:#fff;background:#1d2231}
.tc-step:disabled{cursor:not-allowed;opacity:.45}
.tc-presets{display:flex;justify-content:center;flex-wrap:wrap;gap:8px}
.tc-preset{min-width:52px;height:38px;padding:0 12px;border-radius:999px;font-family:var(--font-num),monospace;font-size:14px;font-weight:700;color:#e3e6f0;background:#10131c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);transition:color .15s,background .15s,box-shadow .15s}
.tc-preset:hover:not(:disabled){color:#fff;box-shadow:inset 0 0 0 1px rgba(224,166,62,.7)}
.tc-preset[aria-pressed="true"]{color:#1a1204;background:linear-gradient(180deg,#f3cd82,#d9972c);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 4px 12px -4px rgba(224,166,62,.8)}
.tc-preset:disabled{opacity:.4;cursor:not-allowed}
.tc-place{grid-row:2;grid-column:5;position:relative;display:flex;align-items:center;justify-content:center;gap:12px;height:58px;padding:0 26px;font-family:var(--tc-serif);font-size:clamp(1.05rem,1.6vw,1.45rem);letter-spacing:.12em;clip-path:polygon(18px 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,18px 100%,0 50%);transition:transform .15s,filter .2s}
.tc-place:active:not(:disabled){transform:scale(.985)}
.tc-place:disabled{cursor:not-allowed}
.tc-place[data-k="place"]{color:#2a1604;background:linear-gradient(180deg,#ffe9b0,#f0b24a 45%,#c07a14 100%);filter:drop-shadow(0 0 14px rgba(255,170,50,.45))}
.tc-place[data-k="place"]:disabled{filter:saturate(.35) brightness(.6)}
.tc-place[data-k="cancel"]{color:#e1e6f5;background:linear-gradient(180deg,#2a3148,#171c2c);font-size:1rem}
.tc-place[data-k="idle"]{color:#8b94ad;background:#10131c;font-size:.95rem}
.tc-place:hover:not(:disabled){filter:brightness(1.08) drop-shadow(0 0 16px rgba(255,170,50,.55))}
.tc-foot{order:6;position:relative;z-index:5;margin:10px auto 0;max-width:900px;text-align:center;font-size:11.5px;line-height:1.5;color:#7e879f;text-shadow:0 1px 6px rgba(0,0,0,.9)}
.tc-mini{display:flex;align-items:center;justify-content:center;width:26px;height:36px;border-radius:4px;font-family:var(--tc-serif);font-size:12px;background:#f1ead8;box-shadow:0 3px 6px -2px rgba(0,0,0,.8)}
.tc-btn:focus-visible,.tc-icon:focus-visible,.tc-pick:focus-visible,.tc-place:focus-visible,.tc-preset:focus-visible,.tc-step:focus-visible{outline:2px solid #fff;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.tcb-mist,.tc-pill,.tcc-card[data-state="win"],.tc-shake{animation:none}.tcc-inner{transition-duration:.01s}}

/* tablets and phones: the scene becomes a block above the controls */
@media (max-width:1000px){
  .tc-ui{padding:0 10px 14px}
  .tc-head{grid-template-columns:1fr auto;grid-template-areas:"l r" "t t";row-gap:6px}
  .tc-head-l{grid-area:l}
  .tc-head-r{grid-area:r}
  .tc-title{grid-area:t;justify-self:center}
  .tc-title img{width:min(78vw,430px)}
  .tc-btn span,.tc-icon{font-size:13px}
  .tc-arena{position:relative;order:3;inset:auto;aspect-ratio:1/1.02;margin:6px -10px 0;width:calc(100% + 20px);overflow:hidden;border-radius:0}
  .tc-grow{display:none}
  .tc-stage-char[data-side="tiger"]{left:-5cqw;bottom:0;width:56cqw}
  .tc-stage-char[data-side="dragon"]{right:-5cqw;bottom:0;width:56cqw}
  .tc-cards{top:4cqw}
  .tcc-slot{--cw:21cqw}
  .tc-mid{width:15cqw;min-height:0;gap:8px}
  .tc-timer{width:14cqw;min-width:58px}
  .tc-timer b{font-size:clamp(1.4rem,6cqw,2.2rem)}
  .tc-vs{font-size:clamp(1.1rem,5cqw,1.8rem)}
  .tc-status{font-size:.58rem;letter-spacing:.1em}
  .tc-val{font-size:.68rem;padding:0 8px;min-height:22px}
  .tc-val-who{display:none}
  .tc-banner{top:47cqw}
  .tc-banner h2{font-size:clamp(1.3rem,8cqw,2.4rem)}
  .tc-picks{margin:12px auto 10px;gap:8px}
  .tc-pick{flex:1 1 0;min-width:0;height:64px}
  .tc-pick-frame{padding:0 14px 0 8px;gap:8px}
  .tc-pick-frame{clip-path:polygon(10px 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,10px 100%,0 50%)}
  .tc-pick-frame::before{clip-path:polygon(9px 0,calc(100% - 9px) 0,100% 50%,calc(100% - 9px) 100%,9px 100%,0 50%)}
  .tc-pick-emblem{width:36px;height:36px}
  .tc-pick-txt b{font-size:.95rem;letter-spacing:.06em}
  .tc-pick-txt small{font-size:9.5px}
  .tc-bottom{grid-template-columns:1fr 1fr;grid-template-rows:auto}
  .tc-cell,.tc-sum{grid-row:auto;grid-column:auto}
  .tc-cell:nth-child(3),.tc-cell:nth-child(4),.tc-sum{grid-column:1/-1}
  .tc-place{grid-row:auto;grid-column:1/-1;height:56px}
}
@media (max-width:420px){.tc-pick-emblem{display:none}.tc-pick-frame{justify-content:center;padding:0 12px}.tc-btn{padding:0 11px}.tc-results-l{display:none}}
`;
