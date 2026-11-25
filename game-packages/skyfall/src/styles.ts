export const SKYFALL_CSS = `
.sf-root{--sf-bg:#050a18;--sf-panel:#0a1630;--sf-panel2:#0e1d3d;--sf-line:rgba(120,200,255,.13);--sf-cyan:#22d3ee;--sf-gold:#e6c170;--sf-red:#ff4d6d;--sf-green:#34d399;--lx-gold:#e6c170;
  background:radial-gradient(900px 500px at 70% -10%,rgba(34,211,238,.09),transparent 60%),radial-gradient(700px 420px at 0% 100%,rgba(230,193,112,.05),transparent 60%),#050a18;color:#e6efff;font-family:var(--font-body),system-ui,sans-serif}
.sf-root *{scrollbar-width:thin;scrollbar-color:rgba(120,200,255,.2) transparent}
.sf-num{font-family:var(--font-num),ui-monospace,monospace;font-variant-numeric:tabular-nums}
.sf-display{font-family:var(--font-display),system-ui,sans-serif}

/* header */
.sf-head{display:flex;align-items:center;gap:10px;height:56px;padding:0 12px;background:linear-gradient(180deg,#0a1530,#07102a);border-bottom:1px solid var(--sf-line)}
@media (min-width:768px){.sf-head{padding:0 18px;gap:14px}}
.sf-back{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 12px;border-radius:10px;font-size:13px;font-weight:600;color:#bcd2f0;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px var(--sf-line);transition:color .2s,box-shadow .2s,background .2s}
.sf-back:hover{color:#fff;background:rgba(34,211,238,.08);box-shadow:inset 0 0 0 1px rgba(34,211,238,.5)}
.sf-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;color:#9fb6d8;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px var(--sf-line);transition:color .2s,box-shadow .2s,background .2s}
.sf-icon:hover{color:#fff;box-shadow:inset 0 0 0 1px rgba(34,211,238,.5)}
.sf-icon[aria-pressed="true"]{color:var(--sf-cyan);background:rgba(34,211,238,.1);box-shadow:inset 0 0 0 1px rgba(34,211,238,.55)}
.sf-icon[aria-pressed="false"]{color:#5e7090}
.sf-bal{display:flex;align-items:center;gap:8px;height:36px;padding:0 12px 0 8px;border-radius:10px;background:linear-gradient(180deg,rgba(230,193,112,.14),rgba(230,193,112,.04));box-shadow:inset 0 0 0 1px rgba(230,193,112,.35)}
.sf-coin{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3c4,#e6c170 45%,#8a5f14);box-shadow:0 0 10px rgba(230,193,112,.5)}
.sf-pill{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 11px;border-radius:999px;font-size:12px;font-weight:600;color:#06202a;background:linear-gradient(180deg,#9ff3ff,#22d3ee);box-shadow:0 0 18px -2px rgba(34,211,238,.7);animation:sf-pulse 1.8s ease-in-out infinite}
@keyframes sf-pulse{50%{box-shadow:0 0 26px 2px rgba(34,211,238,.9)}}

/* history */
.sf-hist{display:flex;align-items:center;gap:6px;height:38px;padding:0 6px;overflow-x:auto;overflow-y:hidden;border-radius:12px;background:var(--sf-panel);box-shadow:inset 0 0 0 1px var(--sf-line)}
.sf-chip{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;min-width:54px;height:26px;padding:0 10px;border-radius:999px;font-family:var(--font-num),monospace;font-size:12.5px;font-weight:700}
.sf-chip[data-t="low"]{color:#9db6da;background:rgba(120,150,200,.12);box-shadow:inset 0 0 0 1px rgba(120,150,200,.25)}
.sf-chip[data-t="mid"]{color:#7cf0ff;background:rgba(34,211,238,.12);box-shadow:inset 0 0 0 1px rgba(34,211,238,.4)}
.sf-chip[data-t="high"]{color:#2b1c04;background:linear-gradient(180deg,#fff0bd,#e6c170);box-shadow:0 0 14px -2px rgba(230,193,112,.7)}
.sf-chip[data-t="bust"]{color:#ff8fa5;background:rgba(255,77,109,.1);box-shadow:inset 0 0 0 1px rgba(255,77,109,.35)}

/* stage */
.sf-stage{position:relative;overflow:hidden;border-radius:16px;background:#050a18;box-shadow:inset 0 0 0 1px var(--sf-line),0 24px 50px -30px #000;container-type:size;isolation:isolate}
.sf-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.sf-plane{position:absolute;left:0;top:0;z-index:2;will-change:transform;transform-origin:42% 46%;--thrust:.2;filter:drop-shadow(0 10px 14px rgba(0,0,0,.55)) drop-shadow(0 0 16px rgba(34,211,238,.18));transition:opacity .25s}
.sf-plume{transform:scale(calc(.35 + var(--thrust) * .95),calc(.7 + var(--thrust) * .45));animation:sf-flick .11s steps(2,end) infinite alternate}
@keyframes sf-flick{from{opacity:.82}to{opacity:1}}
.sf-core{animation:sf-core .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
@keyframes sf-core{from{transform:scale(.85);opacity:.75}to{transform:scale(1.15);opacity:1}}
.sf-mult-wrap{position:absolute;z-index:3;left:5%;top:7%;display:flex;flex-direction:column;align-items:flex-start;pointer-events:none}
@container (min-width:640px){.sf-mult-wrap{left:6%;top:9%}}
.sf-mult{font-family:var(--font-num),ui-monospace,monospace;font-weight:800;line-height:.95;letter-spacing:-.02em;font-size:clamp(2.6rem,15cqw,7.2rem);transition:opacity .25s,color .3s;text-shadow:0 0 36px rgba(34,211,238,.45)}
.sf-mult[data-tier="low"]{color:#e6faff}
.sf-mult[data-tier="mid"]{color:#8df3ff;text-shadow:0 0 44px rgba(34,211,238,.65)}
.sf-mult[data-tier="high"]{color:#ffe6a3;text-shadow:0 0 50px rgba(230,193,112,.75)}
.sf-mult[data-tier="crash"]{color:#ff6b86;text-shadow:0 0 44px rgba(255,77,109,.6);animation:sf-pop .45s cubic-bezier(.2,1.4,.4,1)}
@keyframes sf-pop{from{transform:scale(1.25);opacity:.4}to{transform:scale(1);opacity:1}}
.sf-crash-label{font-family:var(--font-display),sans-serif;font-size:clamp(.7rem,2.4cqw,1.05rem);font-weight:700;letter-spacing:.3em;color:#ff8fa5;margin:0 0 4px 4px;text-transform:uppercase;animation:sf-pop .4s ease-out}
.sf-countdown{position:absolute;z-index:3;left:50%;top:44%;width:clamp(120px,26cqw,190px);aspect-ratio:1;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;animation:sf-fade .5s ease both}
.sf-ring{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 0 12px rgba(34,211,238,.45))}
.sf-cd-text{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px}
.sf-cd-num{font-family:var(--font-num),monospace;font-weight:800;font-size:clamp(2.2rem,9cqw,4rem);line-height:1;color:#e6faff}
.sf-cd-lab{font-size:clamp(.62rem,1.8cqw,.8rem);font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#8fb0d6}
@keyframes sf-fade{from{opacity:0}to{opacity:1}}
.sf-banner{position:absolute;z-index:3;left:50%;top:14%;transform:translateX(-50%);font-family:var(--font-display),sans-serif;font-size:clamp(.7rem,2.2cqw,.95rem);font-weight:700;letter-spacing:.4em;text-transform:uppercase;color:var(--sf-cyan);text-shadow:0 0 20px rgba(34,211,238,.9);animation:sf-fade .3s ease both}
.sf-summary{position:absolute;z-index:3;left:50%;bottom:7%;transform:translateX(-50%);max-width:92%;padding:8px 16px;border-radius:12px;font-size:clamp(.75rem,2cqw,.95rem);font-weight:600;text-align:center;color:#e6efff;background:rgba(6,14,34,.82);box-shadow:inset 0 0 0 1px rgba(120,200,255,.25);backdrop-filter:blur(8px);animation:sf-fade .4s ease both}
.sf-flash{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;background:radial-gradient(60% 60% at 60% 40%,rgba(255,255,255,.9),rgba(124,240,255,.35) 55%,transparent 80%)}
.sf-sweep{position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(124,240,255,.22) 50%,transparent 65%);transform:translateX(-120%);animation:sf-sweep 1.1s ease-out .05s 1 both}
@keyframes sf-sweep{from{transform:translateX(-120%)}to{transform:translateX(120%)}}
.sf-demo-tag{position:absolute;z-index:3;right:10px;top:9px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600;color:#9fb6d8;background:rgba(6,14,34,.7);box-shadow:inset 0 0 0 1px var(--sf-line)}
.sf-shake{animation:sf-shake .55s cubic-bezier(.36,.07,.19,.97) both}
@keyframes sf-shake{10%,90%{transform:translate3d(-2px,0,0)}20%,80%{transform:translate3d(4px,1px,0)}30%,50%,70%{transform:translate3d(-7px,-1px,0)}40%,60%{transform:translate3d(7px,2px,0)}}
.sf-toast{position:absolute;z-index:5;left:50%;top:6%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:12px;font-size:13px;font-weight:700;color:#06201a;background:linear-gradient(180deg,#a7f5d6,#34d399);box-shadow:0 10px 30px -8px rgba(52,211,153,.7)}

/* bet panels */
.sf-bet{display:flex;flex-direction:column;gap:9px;padding:12px;border-radius:14px;background:linear-gradient(180deg,var(--sf-panel2),var(--sf-panel));box-shadow:inset 0 0 0 1px var(--sf-line);transition:box-shadow .25s}
.sf-bet[data-s="armed"]{box-shadow:inset 0 0 0 1px rgba(34,211,238,.55),0 0 24px -10px rgba(34,211,238,.6)}
.sf-bet[data-s="active"]{box-shadow:inset 0 0 0 1px rgba(230,193,112,.6),0 0 28px -8px rgba(230,193,112,.5)}
.sf-bet[data-s="cashed"]{box-shadow:inset 0 0 0 1px rgba(52,211,153,.6)}
.sf-bet[data-s="lost"]{box-shadow:inset 0 0 0 1px rgba(255,77,109,.4)}
.sf-tag{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:11px;font-weight:700;color:#9fb6d8;background:rgba(255,255,255,.05)}
.sf-tag[data-s="armed"]{color:#7cf0ff;background:rgba(34,211,238,.12)}
.sf-tag[data-s="active"]{color:#ffe6a3;background:rgba(230,193,112,.14)}
.sf-tag[data-s="cashed"]{color:#6ee7b7;background:rgba(52,211,153,.14)}
.sf-tag[data-s="lost"]{color:#ff8fa5;background:rgba(255,77,109,.12)}
.sf-stake{display:flex;align-items:center;height:44px;border-radius:12px;background:#050c1e;box-shadow:inset 0 3px 8px rgba(0,0,0,.6),inset 0 0 0 1px var(--sf-line);transition:box-shadow .2s}
.sf-stake:focus-within{box-shadow:inset 0 3px 8px rgba(0,0,0,.6),inset 0 0 0 1px rgba(34,211,238,.8),0 0 0 3px rgba(34,211,238,.12)}
.sf-stake[data-off="true"]{opacity:.55}
.sf-stake input{min-width:0;flex:1;height:100%;background:transparent;text-align:center;font-family:var(--font-num),monospace;font-size:17px;font-weight:700;color:#fff}
.sf-stake input:focus{outline:none}
.sf-step{display:flex;align-items:center;justify-content:center;width:44px;height:100%;color:#9fb6d8;border-radius:12px;transition:color .15s,background .15s}
.sf-step:hover:not(:disabled){color:#fff;background:rgba(34,211,238,.1)}
.sf-step:active:not(:disabled){transform:scale(.92)}
.sf-step:disabled{cursor:not-allowed}
.sf-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.sf-preset{height:34px;border-radius:9px;font-family:var(--font-num),monospace;font-size:12.5px;font-weight:700;color:#b9cdeb;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px var(--sf-line);transition:color .15s,background .15s,box-shadow .15s}
.sf-preset:hover:not(:disabled){color:#fff;background:rgba(34,211,238,.1);box-shadow:inset 0 0 0 1px rgba(34,211,238,.5)}
.sf-preset:disabled{opacity:.45;cursor:not-allowed}
.sf-auto{display:flex;align-items:center;gap:10px}
.sf-toggle{position:relative;flex-shrink:0;width:42px;height:24px;border-radius:999px;background:#0c1730;box-shadow:inset 0 0 0 1px var(--sf-line);transition:background .2s,box-shadow .2s}
.sf-toggle::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#7d90b4;transition:transform .2s,background .2s}
.sf-toggle[aria-checked="true"]{background:rgba(34,211,238,.2);box-shadow:inset 0 0 0 1px rgba(34,211,238,.7)}
.sf-toggle[aria-checked="true"]::after{transform:translateX(18px);background:#22d3ee;box-shadow:0 0 10px #22d3ee}
.sf-toggle:focus-visible,.sf-go:focus-visible,.sf-preset:focus-visible,.sf-step:focus-visible,.sf-icon:focus-visible,.sf-back:focus-visible,.sf-tab:focus-visible{outline:2px solid var(--sf-cyan);outline-offset:2px}
.sf-at{display:flex;align-items:center;height:36px;border-radius:10px;background:#050c1e;box-shadow:inset 0 3px 8px rgba(0,0,0,.6),inset 0 0 0 1px var(--sf-line);flex:1;min-width:0}
.sf-at input{min-width:0;flex:1;height:100%;background:transparent;text-align:center;font-family:var(--font-num),monospace;font-size:15px;font-weight:700;color:#fff}
.sf-at input:focus{outline:none}
.sf-at[data-off="true"]{opacity:.5}
.sf-at:focus-within{box-shadow:inset 0 3px 8px rgba(0,0,0,.6),inset 0 0 0 1px rgba(34,211,238,.8)}
.sf-go{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;border-radius:13px;font-weight:800;font-size:15px;letter-spacing:.01em;transition:transform .15s,filter .2s,box-shadow .3s}
.sf-go:active:not(:disabled){transform:scale(.985)}
.sf-go:disabled{cursor:not-allowed;filter:saturate(.5) brightness(.75)}
.sf-go[data-k="bet"]{color:#04222a;background:linear-gradient(180deg,#a2f4ff,#22d3ee 55%,#0ea5c6);box-shadow:inset 0 1px 0 rgba(255,255,255,.65),0 12px 28px -12px rgba(34,211,238,.8)}
.sf-go[data-k="cancel"]{color:#cfe3ff;background:linear-gradient(180deg,#1b2c52,#10203f);box-shadow:inset 0 0 0 1px rgba(120,200,255,.3)}
.sf-go[data-k="cash"]{color:#2a1a02;background:linear-gradient(180deg,#fff0bd,#e6c170 50%,#b8862a);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 12px 32px -10px rgba(230,193,112,.9);animation:sf-cash 1s ease-in-out infinite}
@keyframes sf-cash{50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 12px 40px -4px rgba(230,193,112,1)}}
.sf-go[data-k="wait"]{color:#9fb6d8;background:#0c1730;box-shadow:inset 0 0 0 1px var(--sf-line)}
.sf-go:hover:not(:disabled){filter:brightness(1.07)}
.sf-ret{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-height:20px;font-size:12.5px;color:#8fa6c8}
.sf-ret b{font-family:var(--font-num),monospace;font-size:14px;color:#fff}
.sf-ret b[data-w="win"]{color:#6ee7b7}
.sf-ret b[data-w="lose"]{color:#ff8fa5}

/* sidebar */
.sf-side{display:flex;flex-direction:column;min-height:0;border-radius:16px;background:linear-gradient(180deg,var(--sf-panel2),#081226);box-shadow:inset 0 0 0 1px var(--sf-line)}
.sf-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:6px;border-bottom:1px solid var(--sf-line)}
.sf-tab{position:relative;height:36px;border-radius:10px;font-size:13px;font-weight:600;color:#8fa6c8;transition:color .2s,background .2s}
.sf-tab:hover{color:#fff}
.sf-tab[aria-selected="true"]{color:#fff;background:rgba(34,211,238,.12);box-shadow:inset 0 0 0 1px rgba(34,211,238,.45)}
.sf-note{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:10px;font-size:11.5px;line-height:1.4;color:#c9b27a;background:rgba(230,193,112,.07);box-shadow:inset 0 0 0 1px rgba(230,193,112,.22)}
.sf-row{display:grid;grid-template-columns:30px minmax(0,1fr) auto auto;align-items:center;gap:9px;padding:6px 8px;border-radius:10px;font-size:12.5px;background:rgba(255,255,255,.025);transition:background .25s,opacity .25s}
.sf-row[data-s="cashed"]{background:rgba(52,211,153,.09);box-shadow:inset 0 0 0 1px rgba(52,211,153,.25)}
.sf-row[data-s="lost"]{opacity:.5}
.sf-av{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;font-size:12px;font-weight:700;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.sf-prev{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:12px;background:#07112a;box-shadow:inset 0 0 0 1px var(--sf-line)}

@media (prefers-reduced-motion:reduce){.sf-pill,.sf-go[data-k="cash"],.sf-plume,.sf-core,.sf-sweep{animation:none}}
`;
