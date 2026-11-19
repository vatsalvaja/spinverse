export const ROULETTE_CSS = `
.rl-root{--gold:#c9a24b;--gold2:#ecd391;--gold3:#8a6a26;--cream:#f3ead2;--felt:#0b4a29;--rl-serif:var(--font-atlantis),"Cinzel",Georgia,serif;
  background:radial-gradient(1100px 520px at 12% -6%,rgba(255,196,110,.10),transparent 62%),radial-gradient(1100px 520px at 88% -6%,rgba(255,196,110,.09),transparent 62%),radial-gradient(60% 40% at 50% 0%,rgba(120,70,20,.20),transparent 70%),#060504;
  color:var(--cream);font-family:var(--font-body),system-ui,sans-serif}
.rl-root *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.16) transparent}
.rl-numfont{font-family:var(--font-num),ui-monospace,monospace;font-variant-numeric:tabular-nums}
.rl-coin{display:inline-block;width:18px;height:18px;border-radius:50%;flex-shrink:0;background:radial-gradient(circle at 35% 30%,#fbe7a8,#d8a437 55%,#7d5410);box-shadow:0 0 0 1px rgba(60,35,5,.7)}

.rl-room{position:relative;display:flex;flex-direction:column;min-height:100dvh;padding:0 clamp(10px,1.6vw,26px) 10px}

/* header */
.rl-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:clamp(10px,1.6vw,26px);padding:12px 0 6px}
.rl-head-l{display:flex;align-items:center;gap:clamp(10px,1.6vw,22px)}
.rl-head-r{display:flex;align-items:center;gap:8px;justify-content:flex-end}
.rl-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:42px;padding:0 16px;border-radius:12px;font-size:14px;font-weight:600;color:var(--cream);background:linear-gradient(180deg,rgba(30,22,12,.92),rgba(10,8,5,.92));box-shadow:inset 0 0 0 1px rgba(201,162,75,.55),inset 0 0 0 3px rgba(0,0,0,.5);transition:color .2s,box-shadow .2s,filter .2s}
.rl-btn:hover{color:#fff;filter:brightness(1.12);box-shadow:inset 0 0 0 1px rgba(236,211,145,.9),inset 0 0 0 3px rgba(0,0,0,.5)}
.rl-icon{display:inline-flex;align-items:center;justify-content:center;width:44px;height:42px;border-radius:12px;color:var(--gold2);background:linear-gradient(180deg,rgba(30,22,12,.92),rgba(10,8,5,.92));box-shadow:inset 0 0 0 1px rgba(201,162,75,.55),inset 0 0 0 3px rgba(0,0,0,.5);transition:color .2s,filter .2s}
.rl-icon:hover{filter:brightness(1.15);color:#fff}
.rl-icon[aria-pressed="false"]{color:#6a5d44}
.rl-pill{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;font-size:12px;font-weight:700;color:#1b1204;background:var(--gold2);animation:rl-pulse 2s ease-in-out infinite}
@keyframes rl-pulse{50%{box-shadow:0 0 0 5px rgba(201,162,75,.25)}}
.rl-bal{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:136px;padding:7px 18px;border-radius:12px;background:linear-gradient(180deg,rgba(30,22,12,.92),rgba(10,8,5,.92));box-shadow:inset 0 0 0 1px rgba(201,162,75,.55),inset 0 0 0 3px rgba(0,0,0,.5)}
.rl-bal small{font-size:12px;color:var(--gold2);font-family:var(--rl-serif);letter-spacing:.06em}
.rl-bal span{display:flex;align-items:center;gap:8px}
.rl-bal b{font-size:19px;color:#fff;font-weight:700}
.rl-brand{display:flex;flex-direction:column;align-items:center;line-height:1}
.rl-brand small{font-size:10px;letter-spacing:.42em;color:var(--gold);opacity:.85;margin-bottom:2px}
.rl-crown{width:38px;height:24px;margin-bottom:-2px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.8))}
.rl-brand h1{margin:0;font-family:var(--rl-serif);font-weight:400;font-size:clamp(1.9rem,3vw,2.9rem);letter-spacing:.06em;text-transform:uppercase;background:linear-gradient(180deg,#fff2c9 0%,#e3b95c 45%,#a8761c 75%,#d8aa48 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(40,22,2,.9)) drop-shadow(0 6px 10px rgba(0,0,0,.7))}

/* recent results */
.rl-results{position:relative;display:flex;align-items:center;justify-content:center;min-width:0;max-width:880px;width:100%;margin:6px auto 0;padding:15px 16px 8px;border-radius:14px;background:linear-gradient(180deg,rgba(12,9,6,.92),rgba(5,4,3,.92));box-shadow:inset 0 0 0 1px rgba(201,162,75,.5),inset 0 0 0 3px rgba(0,0,0,.55)}
.rl-results-l{position:absolute;left:50%;top:-11px;transform:translateX(-50%);padding:2px 22px;border-radius:999px;font-family:var(--rl-serif);font-size:15px;color:var(--cream);background:#0a0705;box-shadow:inset 0 0 0 1px rgba(201,162,75,.6);white-space:nowrap}
.rl-results-row{display:flex;align-items:center;gap:7px;min-height:34px;overflow-x:auto;overflow-y:hidden;padding:2px 2px;max-width:100%;scrollbar-width:none}
.rl-results-row::-webkit-scrollbar{display:none}
.rl-results-empty{font-size:13px;color:#8a7d62}
.rl-num{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;width:31px;height:31px;border-radius:50%;font-family:var(--font-num),monospace;font-size:14px;font-weight:700;color:#fff;box-shadow:0 2px 5px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.28),inset 0 -2px 3px rgba(0,0,0,.35)}
.rl-n-red{background:radial-gradient(circle at 35% 28%,#e0313a,#a3121a 70%)}
.rl-n-black{background:radial-gradient(circle at 35% 28%,#3a3a42,#0b0b0e 75%)}
.rl-n-green{background:radial-gradient(circle at 35% 28%,#25a35c,#0e6b37 75%)}

/* the stage: info panels either side of the wheel */
.rl-stage{flex:1 1 0;min-height:250px;display:grid;grid-template-columns:minmax(150px,250px) minmax(0,1fr) minmax(150px,250px);align-items:center;gap:clamp(8px,1.6vw,24px);margin-top:4px}
.rl-panel{padding:14px 16px;border-radius:12px;text-align:center;background:linear-gradient(180deg,rgba(14,10,6,.9),rgba(5,4,3,.9));box-shadow:inset 0 0 0 1px rgba(201,162,75,.6),inset 0 0 0 4px rgba(0,0,0,.6),inset 0 0 0 5px rgba(201,162,75,.18),0 14px 30px -14px #000}
.rl-panel h2{margin:0;font-family:var(--rl-serif);font-weight:400;font-size:clamp(1.05rem,1.5vw,1.5rem);color:var(--gold2);letter-spacing:.03em}
.rl-panel p{margin:6px 0 0;font-size:13.5px;line-height:1.4;color:var(--cream)}
.rl-status ul{list-style:none;margin:10px 0 0;padding:8px 0 0;border-top:1px solid rgba(201,162,75,.25);display:flex;flex-direction:column;gap:4px;text-align:left}
.rl-status li{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;color:#d8cdb0}
.rl-status li b{font-family:var(--font-num),monospace;color:#7ee3a5}
.rl-total p,.rl-last p{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:8px}
.rl-total b,.rl-last b{font-size:clamp(1.3rem,2vw,1.9rem);color:#fff;font-weight:700}
.rl-wheelzone{container-type:size;align-self:stretch;display:flex;align-items:center;justify-content:center;min-width:0;min-height:0}
.rl-wheelbox{position:relative;width:min(100cqw,calc(100cqh * var(--ar,1.5)))}
.rl-reveal-wrap{position:absolute;left:0;right:0;bottom:2%;display:flex;justify-content:center;pointer-events:none}
.rl-reveal{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 26px 8px;border-radius:16px;color:#fff;box-shadow:0 0 0 2px #e6c170,0 0 0 4px rgba(0,0,0,.6),0 18px 40px -8px #000}
.rl-reveal b{font-size:clamp(2rem,4.4vw,3.4rem);line-height:1;font-weight:700;text-shadow:0 2px 0 rgba(0,0,0,.5)}
.rl-reveal span{font-family:var(--rl-serif);font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#f6e8c0}

/* the betting table */
.rl-tablezone{perspective:1700px;display:flex;flex-direction:column;align-items:center;padding:14px 0 6px}
.rl-table{position:relative;container-type:inline-size;width:min(100%,calc((100dvh - 520px) * 3.5));min-width:min(100%,660px);max-width:1220px;transform:rotateX(15deg);transform-origin:50% 100%;margin:0 auto}
.rl-felt{position:absolute;inset:-3.2% -2.2%;border-radius:2cqw;background:radial-gradient(130% 160% at 50% 0%,#126638 0%,#0b4a29 55%,#073119 100%);
  box-shadow:0 0 0 .5cqw #2b1608,0 0 0 .8cqw #b88a36,0 0 0 1.1cqw #190c04,0 40px 70px -24px #000,inset 0 0 80px rgba(0,0,0,.55)}
.rl-felt::after{content:"";position:absolute;inset:0;border-radius:inherit;background:repeating-radial-gradient(circle at 20% 30%,rgba(255,255,255,.03) 0 1px,transparent 1px 3px);opacity:.7;pointer-events:none}
.rl-cell{position:absolute;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid rgba(214,174,82,.8);color:var(--cream);transition:box-shadow .18s,filter .18s;cursor:pointer}
.rl-cell:disabled{cursor:default}
.rl-cell:focus-visible{outline:2px solid #fff;outline-offset:-3px;z-index:6}
.rl-lab{font-family:var(--rl-serif);font-size:clamp(.78rem,2.25cqw,2rem);line-height:1;text-shadow:0 2px 3px rgba(0,0,0,.8)}
.rl-lab-out{font-size:clamp(.62rem,1.55cqw,1.35rem);letter-spacing:.04em;color:var(--gold2);text-shadow:0 1px 2px rgba(0,0,0,.8)}
.rl-t-red{background:linear-gradient(180deg,#d1222c 0%,#9d131b 55%,#7d0c13 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 -6px 12px rgba(0,0,0,.28)}
.rl-t-black{background:linear-gradient(180deg,#26262c 0%,#0e0e11 55%,#050506 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -6px 12px rgba(0,0,0,.4)}
.rl-t-green{background:linear-gradient(180deg,#178a4c,#0d6034);box-shadow:inset 0 1px 0 rgba(255,255,255,.22)}
.rl-t-felt{background:transparent}
.rl-zero .rl-lab{font-size:clamp(1.4rem,4cqw,3.4rem);font-style:italic}
.rl-column .rl-lab,.rl-dozen .rl-lab,.rl-even .rl-lab{font-style:italic}
.rl-diamond{display:block;width:34%;aspect-ratio:1.6;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))}
.rl-table[data-orient="v"] .rl-diamond{width:30%;aspect-ratio:1}
.rl-d-red{background:linear-gradient(180deg,#e33a43,#9a1119)}
.rl-d-black{background:linear-gradient(180deg,#3a3a42,#050506)}
.rl-cell.is-hot{box-shadow:inset 0 0 0 2px #ffe3a0,0 0 16px rgba(255,214,120,.55);z-index:2;filter:brightness(1.18)}
.rl-cell.is-win{z-index:3;box-shadow:inset 0 0 0 3px #fff2bd,0 0 26px rgba(255,222,130,.95);animation:rl-win .9s ease-in-out infinite alternate}
@keyframes rl-win{from{filter:brightness(1.1)}to{filter:brightness(1.55)}}
.rl-cell.is-won:not(.is-win){box-shadow:inset 0 0 0 2px rgba(126,227,165,.8)}
.rl-spot{position:absolute;z-index:4;padding:0;border-radius:50%;cursor:pointer;transition:background .15s}
.rl-spot:hover:not(:disabled){background:radial-gradient(circle,rgba(255,226,140,.65),rgba(255,226,140,0) 72%)}
.rl-spot:disabled{cursor:default}
.rl-onboard{position:absolute;z-index:5;width:clamp(22px,3.5cqw,44px);transform:translate(-50%,-50%);pointer-events:none;transition:opacity .4s,filter .4s}
.rl-table[data-orient="v"] .rl-onboard{width:clamp(26px,9.5cqw,44px)}
.rl-lost{opacity:.3;filter:grayscale(.7)}
.rl-won .rl-chip{box-shadow:0 0 0 2px #fff1b8,0 0 16px rgba(255,226,140,.95)}
.rl-note{margin:14px 0 0;font-size:13px;font-weight:600;color:#ff9aa4}

/* chips */
.rl-chip{--cb:#1f4fa3;--cs:#fff;--ci:#fff;display:inline-block;position:relative;width:100%;aspect-ratio:1;border-radius:50%;
  background:repeating-conic-gradient(var(--cs) 0 13deg,var(--cb) 13deg 45deg);box-shadow:0 3px 6px rgba(0,0,0,.65),inset 0 0 0 1.5px rgba(0,0,0,.4);transition:transform .2s,box-shadow .2s}
.rl-chip-face{position:absolute;inset:13%;display:flex;align-items:center;justify-content:center;border-radius:50%;background:radial-gradient(circle at 35% 28%,color-mix(in srgb,var(--cb) 78%,#fff),var(--cb) 62%);box-shadow:inset 0 0 0 2px var(--cs),inset 0 3px 6px rgba(255,255,255,.18),inset 0 -4px 7px rgba(0,0,0,.35)}
.rl-chip-face b{font-family:var(--font-num),monospace;font-size:clamp(.6rem,1.7cqw,.95rem);font-weight:700;color:var(--ci);text-shadow:0 1px 2px rgba(0,0,0,.6)}
.rl-chipbtn{width:clamp(52px,4.4vw,72px);aspect-ratio:1;border-radius:50%;padding:0;transition:transform .18s}
.rl-chipbtn .rl-chip-face b{font-size:clamp(.95rem,1.5vw,1.4rem)}
.rl-chipbtn:hover{transform:translateY(-3px)}
.rl-chipbtn[aria-pressed="true"]{transform:translateY(-8px)}
.rl-chipbtn[aria-pressed="true"] .rl-chip{box-shadow:0 0 0 3px #f6df9c,0 0 22px rgba(236,200,110,.85),0 8px 14px rgba(0,0,0,.6)}
.rl-chipbtn:focus-visible{outline:2px solid #fff;outline-offset:4px}

/* the bottom dock */
.rl-dock{display:grid;grid-template-columns:minmax(150px,230px) minmax(0,1fr) auto minmax(190px,250px);align-items:center;gap:clamp(10px,1.6vw,26px);padding:10px 0 4px}
.rl-last{align-self:center}
.rl-chips{display:flex;align-items:center;justify-content:center;gap:clamp(8px,1.4vw,22px);min-width:0;padding-top:8px}
.rl-actions{display:flex;gap:10px}
.rl-act{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:clamp(66px,6.6vw,104px);height:62px;border-radius:11px;font-family:var(--rl-serif);font-size:14px;color:var(--cream);background:linear-gradient(180deg,rgba(30,22,12,.92),rgba(10,8,5,.92));box-shadow:inset 0 0 0 1px rgba(201,162,75,.6),inset 0 0 0 3px rgba(0,0,0,.55);transition:filter .2s,transform .15s}
.rl-act:hover:not(:disabled){filter:brightness(1.18)}
.rl-act:active:not(:disabled){transform:scale(.97)}
.rl-act:disabled{opacity:.4;cursor:not-allowed}
.rl-act svg{color:var(--gold2)}
.rl-total-m{display:none}
.rl-spin{position:relative;display:flex;align-items:center;justify-content:center;height:78px;width:100%;border-radius:999px;font-family:var(--rl-serif);font-size:clamp(1.7rem,2.6vw,2.6rem);letter-spacing:.06em;
  background:radial-gradient(120% 160% at 50% 0%,#e0342a 0%,#a8130e 55%,#6d0905 100%);box-shadow:0 0 0 3px #3a2508,0 0 0 5px #e6c170,0 0 0 7px #4a3009,0 16px 32px -10px rgba(0,0,0,.8),inset 0 2px 0 rgba(255,255,255,.3),inset 0 -8px 16px rgba(0,0,0,.35);transition:transform .15s,filter .2s}
.rl-spin span{background:linear-gradient(180deg,#fff5cf,#f0c964 50%,#b8801c);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(60,20,0,.8))}
.rl-spin:hover:not(:disabled){filter:brightness(1.1)}
.rl-spin:active:not(:disabled){transform:scale(.98)}
.rl-spin:disabled{cursor:not-allowed;filter:saturate(.45) brightness(.7)}
.rl-btn:focus-visible,.rl-icon:focus-visible,.rl-act:focus-visible,.rl-spin:focus-visible{outline:2px solid #fff;outline-offset:3px}
.rl-foot{margin:8px auto 0;max-width:900px;text-align:center;font-size:11.5px;line-height:1.5;color:#85795f}
@media (prefers-reduced-motion:reduce){.rl-pill,.rl-cell.is-win{animation:none}}

/* tablets and phones: the table stands upright and the controls dock to the bottom edge */
@media (max-width:900px){
  .rl-room{padding:0 8px 0}
  .rl-head{grid-template-columns:1fr auto;grid-template-areas:"l r" "c c";row-gap:14px;padding-top:8px}
  .rl-head-l{grid-area:l;gap:10px}
  .rl-head-r{grid-area:r;gap:6px}
  .rl-results{grid-area:c;max-width:none}
  .rl-btn span{display:none}
  .rl-btn{padding:0 12px;height:38px}
  .rl-icon{width:38px;height:38px}
  .rl-bal{min-width:0;padding:4px 10px}
  .rl-bal small{font-size:10px}
  .rl-bal b{font-size:15px}
  .rl-brand h1{font-size:1.7rem}
  .rl-brand small{display:none}
  .rl-crown{width:28px;height:18px}
  .rl-num{width:27px;height:27px;font-size:12.5px}
  .rl-stage{display:flex;flex-direction:column;align-items:stretch;gap:6px;min-height:0;flex:none;margin-top:6px}
  .rl-wheelzone{order:1;container-type:inline-size;align-self:center;width:100%;display:block}
  .rl-wheelbox{width:min(100cqw,440px);margin:0 auto}
  .rl-total{display:none}
  .rl-status{order:2;padding:8px 12px}
  .rl-status h2{font-size:1.05rem}
  .rl-status p{margin-top:2px;font-size:12.5px}
  .rl-status ul{display:none}
  .rl-tablezone{perspective:none;padding:10px 4px 6px}
  .rl-table{transform:none;width:100%;min-width:0;max-width:520px}
  .rl-felt{inset:-2.4% -2.2%;border-radius:3cqw}
  .rl-lab{font-size:clamp(.95rem,6.4cqw,1.7rem)}
  .rl-lab-out{font-size:clamp(.7rem,3.8cqw,1.05rem)}
  .rl-zero .rl-lab{font-size:clamp(1.4rem,9cqw,2.4rem)}
  .rl-table[data-orient="v"] .rl-dozen .rl-lab,.rl-table[data-orient="v"] .rl-even .rl-lab{writing-mode:vertical-rl;transform:rotate(180deg)}
  .rl-table[data-orient="v"] .rl-column .rl-lab{font-size:clamp(.6rem,3.3cqw,.95rem)}
  .rl-dock{position:sticky;bottom:0;z-index:20;margin:0 -8px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"chips total" "act spin";gap:8px;background:linear-gradient(180deg,rgba(8,6,4,.94),rgba(4,3,2,.99));box-shadow:0 -1px 0 rgba(201,162,75,.5),0 -16px 30px -12px #000}
  .rl-last{display:none}
  .rl-chips{grid-area:chips;justify-content:space-between;padding-top:6px;gap:4px}
  .rl-chipbtn{width:clamp(40px,12.5vw,56px)}
  .rl-chipbtn .rl-chip-face b{font-size:clamp(.78rem,3.6vw,1.05rem)}
  .rl-total-m{display:flex;grid-area:total;flex-direction:column;align-items:center;justify-content:center;padding:4px 12px;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(201,162,75,.5);min-width:72px}
  .rl-total-m small{font-size:10.5px;color:var(--gold2);font-family:var(--rl-serif)}
  .rl-total-m b{font-size:17px;color:#fff}
  .rl-actions{grid-area:act;gap:6px}
  .rl-act{flex:1;width:auto;height:52px;font-size:12.5px}
  .rl-spin{grid-area:spin;width:min(44vw,190px);height:56px;font-size:1.6rem}
  .rl-foot{padding-bottom:6px}
}
@media (max-width:380px){.rl-act span{display:none}.rl-act{height:46px}}
`;
