/** Keyframes and surface treatments for the launcher home. Everything is prefixed `lx-` so nothing leaks. */
export const LAUNCHER_CSS = `
.lx-root{--lx-gold:#e6c170;--lx-gold-deep:#a97c24;--lx-violet:#7a5cff;--lx-ink:#05050a;--lx-navy:#0a0f24;
  background:
    radial-gradient(1200px 700px at 12% -10%, rgba(122,92,255,.16), transparent 60%),
    radial-gradient(900px 600px at 100% 0%, rgba(230,193,112,.10), transparent 60%),
    radial-gradient(1000px 700px at 50% 120%, rgba(30,60,160,.18), transparent 60%),
    linear-gradient(180deg,#07080f,#05050a 60%,#06070e);}
.lx-grid-bg{position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);
  background-size:56px 56px;
  -webkit-mask-image:radial-gradient(70% 60% at 50% 45%,#000 20%,transparent 75%);mask-image:radial-gradient(70% 60% at 50% 45%,#000 20%,transparent 75%);}
.lx-orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;will-change:transform}
.lx-orb-a{width:42vmax;height:42vmax;left:-12vmax;top:-14vmax;background:rgba(122,92,255,.22);animation:lx-drift-a 26s ease-in-out infinite}
.lx-orb-b{width:36vmax;height:36vmax;right:-10vmax;bottom:-16vmax;background:rgba(230,193,112,.14);animation:lx-drift-b 32s ease-in-out infinite}
@keyframes lx-drift-a{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(6vmax,5vmax,0)}}
@keyframes lx-drift-b{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(-5vmax,-4vmax,0)}}

/* ------------------------------- sidebar ------------------------------- */
.lx-rail{background:linear-gradient(180deg,rgba(18,20,34,.92),rgba(8,9,16,.96));
  box-shadow:inset -1px 0 0 rgba(255,255,255,.06),12px 0 40px -18px rgba(0,0,0,.9)}
.lx-navbtn{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;width:100%;padding:11px 0 9px;border-radius:16px;
  color:#8b8fa6;transition:color .25s,background .25s,transform .25s}
.lx-navbtn:hover{color:#e9e6dc;background:rgba(255,255,255,.04)}
.lx-navbtn:active{transform:scale(.96)}
.lx-navbtn[data-active="true"]{color:var(--lx-gold)}
.lx-navbtn svg{transition:transform .3s cubic-bezier(.2,.8,.2,1),filter .3s}
.lx-navbtn:hover svg{transform:translateY(-1px) scale(1.08)}
.lx-navbtn[data-active="true"] svg{filter:drop-shadow(0 0 8px rgba(230,193,112,.7))}
.lx-navbtn:focus-visible,.lx-chip:focus-visible,.lx-tile:focus-visible,.lx-play:focus-visible,.lx-heart:focus-visible{outline:2px solid var(--lx-gold);outline-offset:2px}

/* ------------------------------- top bar ------------------------------- */
.lx-search{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025));box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 0 8px 18px -10px rgba(0,0,0,.8);transition:box-shadow .25s,background .25s}
.lx-search:focus-within{box-shadow:inset 0 0 0 1px rgba(230,193,112,.65),0 0 0 4px rgba(230,193,112,.10),0 8px 30px -10px rgba(230,193,112,.35)}
.lx-chip{display:inline-flex;align-items:center;justify-content:center;border-radius:14px;color:#a6a9be;
  background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);transition:color .2s,box-shadow .25s,transform .2s,background .25s}
.lx-chip:hover{color:#fff;box-shadow:inset 0 0 0 1px rgba(230,193,112,.5),0 6px 22px -8px rgba(230,193,112,.4);transform:translateY(-1px)}
.lx-chip[data-active="true"]{color:var(--lx-gold);box-shadow:inset 0 0 0 1px rgba(230,193,112,.6),0 0 18px -4px rgba(230,193,112,.5)}
.lx-points[data-active="true"]{box-shadow:inset 0 0 0 1px rgba(230,193,112,.8),0 0 20px -4px rgba(230,193,112,.5)}
.lx-points{background:linear-gradient(180deg,rgba(230,193,112,.16),rgba(230,193,112,.05));box-shadow:inset 0 0 0 1px rgba(230,193,112,.35)}
.lx-coin{background:radial-gradient(circle at 35% 30%,#fff3c4,#e6c170 45%,#8a5f14);box-shadow:0 0 10px rgba(230,193,112,.6),inset 0 -2px 3px rgba(80,40,0,.5)}

/* -------------------------------- tiles -------------------------------- */
.lx-tile{--ac:#e6c170;--rx:0deg;--ry:0deg;position:relative;display:block;width:100%;text-align:left;border-radius:20px;padding:1.5px;cursor:pointer;
  background:linear-gradient(150deg,rgba(255,255,255,.22),rgba(255,255,255,.05) 35%,rgba(255,255,255,.03) 65%,rgba(255,255,255,.14));
  transform:perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
  transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s,background .45s;
  box-shadow:0 18px 40px -22px rgba(0,0,0,.9)}
.lx-tile[data-hover="true"]{transition:transform .12s linear,box-shadow .45s}
.lx-tile:hover,.lx-tile[data-selected="true"]{box-shadow:0 30px 70px -26px var(--ac),0 18px 40px -22px rgba(0,0,0,.9)}
.lx-tile[data-selected="true"]{background:linear-gradient(150deg,var(--ac),rgba(255,255,255,.35) 30%,var(--ac) 55%,rgba(255,255,255,.2) 80%,var(--ac))}
.lx-tile[data-selected="true"]::before{content:"";position:absolute;inset:-5px;border-radius:25px;border:1px solid var(--ac);opacity:.35;animation:lx-halo 2.8s ease-in-out infinite;pointer-events:none}
@keyframes lx-halo{0%,100%{opacity:.18;transform:scale(1)}50%{opacity:.5;transform:scale(1.012)}}
.lx-face{position:relative;overflow:hidden;border-radius:18.5px;background:#080912;isolation:isolate}
.lx-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 45%;opacity:0;transform:scale(1.04);transition:transform 1.1s cubic-bezier(.2,.8,.2,1),filter .6s,opacity .5s;filter:saturate(1.05) brightness(.94)}
.lx-art[data-ready="true"]{opacity:1}
.lx-tile:hover .lx-art,.lx-tile[data-selected="true"] .lx-art{transform:scale(1.09);filter:saturate(1.18) brightness(1.04)}
.lx-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,5,10,.55) 0%,transparent 28%,transparent 46%,rgba(5,5,10,.82) 74%,rgba(5,5,10,.97) 100%)}
.lx-shine{position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.22) 48%,transparent 60%);transform:translateX(-120%);mix-blend-mode:overlay}
.lx-tile:hover .lx-shine,.lx-tile[data-selected="true"] .lx-shine{animation:lx-sweep 1.3s ease-out}
@keyframes lx-sweep{to{transform:translateX(120%)}}
.lx-gloss{position:absolute;inset:0;pointer-events:none;border-radius:inherit;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 0 0 1px rgba(255,255,255,.05)}
.lx-badge{background:rgba(6,7,14,.62);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);backdrop-filter:blur(8px)}
.lx-heart{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:rgba(6,7,14,.62);backdrop-filter:blur(8px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);color:#d6d8e6;transition:transform .2s,color .2s,box-shadow .2s}
.lx-heart:hover{transform:scale(1.1);color:#fff}
.lx-heart[data-on="true"]{color:#ff6b8f;box-shadow:inset 0 0 0 1px rgba(255,107,143,.55),0 0 18px rgba(255,107,143,.4)}
.lx-play{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:38px;border-radius:11px;overflow:hidden;font-weight:700;letter-spacing:.02em;color:#16110a;
  background:linear-gradient(180deg,#fff0bd,#e6c170 48%,#b88a2c);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 10px 26px -10px var(--ac);transition:transform .2s,box-shadow .3s,filter .3s}
.lx-play::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-130%)}
.lx-play:hover{transform:translateY(-1px);filter:brightness(1.06)}
.lx-play:hover::after{animation:lx-sweep .9s ease-out}
.lx-play:active{transform:scale(.98)}
.lx-tile:not([data-selected="true"]):not(:hover) .lx-play{filter:saturate(.7) brightness(.88)}
.lx-ticks{animation:lx-fade .6s ease both}
@keyframes lx-fade{from{opacity:0}to{opacity:1}}

.lx-scroll{scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.14) transparent}
.lx-scroll::-webkit-scrollbar{width:8px}.lx-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px}

/* ------------------------------ library grid ------------------------------ */
.lx-lib{display:grid;gap:14px;justify-content:center;grid-template-columns:repeat(auto-fill,minmax(148px,1fr))}
@media (min-width:640px){.lx-lib{gap:20px;grid-template-columns:repeat(auto-fill,204px)}}

/* ------------------------------ page content ------------------------------ */
.lx-pagehead h1{text-wrap:balance}
.lx-drawer{--lx-gold:#e6c170}
.lx-drawer{background:linear-gradient(180deg,rgba(16,18,32,.98),rgba(7,8,15,.99));box-shadow:inset 1px 0 0 rgba(255,255,255,.08),-30px 0 80px -30px #000}
.lx-drawer-link{position:relative;display:flex;align-items:center;gap:14px;padding:11px 12px;border-radius:14px;color:#c4c6d8;transition:background .2s,color .2s}
.lx-drawer-link:hover{background:rgba(255,255,255,.05);color:#fff}
.lx-drawer-link[data-active="true"]{color:var(--lx-gold);background:linear-gradient(90deg,rgba(230,193,112,.16),rgba(230,193,112,.03));box-shadow:inset 0 0 0 1px rgba(230,193,112,.3)}
.lx-drawer-link:focus-visible{outline:2px solid var(--lx-gold);outline-offset:2px}

/* ----------------------------- mobile bar ------------------------------ */
.lx-dock{background:linear-gradient(180deg,rgba(14,16,30,.92),rgba(6,7,14,.98));backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 -16px 40px -20px rgba(0,0,0,.9);padding-bottom:max(env(safe-area-inset-bottom),6px)}

@media (prefers-reduced-motion:reduce){
  .lx-orb,.lx-tile[data-selected="true"]::before{animation:none}
  .lx-art,.lx-tile{transition:none}
  .lx-tile:hover .lx-shine,.lx-tile[data-selected="true"] .lx-shine,.lx-play:hover::after{animation:none}
}
`;
