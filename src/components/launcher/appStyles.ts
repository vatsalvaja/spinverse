/**
 * Application chrome. These rules load after the base launcher CSS and give every screen the same
 * desktop-software look: flat charcoal panels, thin borders, compact controls.
 */
export const APP_CSS = `
.lx-root{--lx-gold:#e6c170;background:#080a11}
.lx-work{background:radial-gradient(900px 380px at 75% -8%,rgba(122,92,255,.07),transparent 62%),#0c0e17}

/* ---------------------------- sidebar ---------------------------- */
.lx-side{background:#0a0c13;border-right:1px solid rgba(255,255,255,.06)}
.lx-brand{display:flex;align-items:center;gap:11px;height:56px;padding:0 16px;border-bottom:1px solid rgba(255,255,255,.06)}
.lx-nav{position:relative;display:flex;align-items:center;gap:12px;width:100%;height:38px;padding:0 12px;border-radius:9px;font-size:13.5px;font-weight:500;color:#98a0ba;
  transition:background .18s,color .18s}
.lx-nav:hover{background:rgba(255,255,255,.05);color:#eef0fa}
.lx-nav:active{transform:scale(.985)}
.lx-nav svg{flex-shrink:0;transition:transform .2s,color .2s}
.lx-nav:hover svg{transform:scale(1.1)}
.lx-nav[data-active="true"]{color:#fff;background:linear-gradient(90deg,rgba(230,193,112,.14),rgba(255,255,255,.04))}
.lx-nav[data-active="true"] svg{color:var(--lx-gold);filter:drop-shadow(0 0 6px rgba(230,193,112,.55))}
.lx-nav[data-active="true"]::before{content:"";position:absolute;left:-10px;top:9px;bottom:9px;width:3px;border-radius:0 3px 3px 0;background:var(--lx-gold);box-shadow:0 0 10px var(--lx-gold);animation:lx-bar .28s cubic-bezier(.2,.8,.2,1)}
@keyframes lx-bar{from{transform:scaleY(.2);opacity:0}to{transform:scaleY(1);opacity:1}}
.lx-nav:focus-visible{outline:2px solid var(--lx-gold);outline-offset:-2px}
.lx-gl{padding:16px 12px 6px;font-size:11px;font-weight:600;letter-spacing:.02em;color:#586079}
@media (max-width:1023px){.lx-nav{justify-content:center;padding:0}.lx-nav[data-active="true"]::before{left:-8px}}

/* ---------------------------- toolbar ---------------------------- */
.lx-toolbar{display:flex;align-items:center;gap:12px;height:56px;padding:0 14px;background:#0a0c13;border-bottom:1px solid rgba(255,255,255,.06)}
@media (min-width:768px){.lx-toolbar{padding:0 20px}}
.lx-search{background:#10131d;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.lx-search:focus-within{background:#131726;box-shadow:inset 0 0 0 1px rgba(230,193,112,.7),0 0 0 3px rgba(230,193,112,.1)}
.lx-points{border-radius:10px}
.lx-acct{display:flex;align-items:center;gap:9px;height:36px;padding:0 8px 0 4px;border-radius:10px;background:#10131d;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07);transition:box-shadow .2s,background .2s}
.lx-acct:hover,.lx-acct[aria-expanded="true"]{background:#141828;box-shadow:inset 0 0 0 1px rgba(230,193,112,.45)}
.lx-acct:focus-visible{outline:2px solid var(--lx-gold);outline-offset:2px}
.lx-pop{background:#0f121c;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09),0 24px 60px -12px #000;transform-origin:top right}
.lx-pop-item{display:flex;align-items:center;gap:11px;width:100%;height:36px;padding:0 10px;border-radius:8px;font-size:13px;font-weight:500;color:#b4bad0;transition:background .15s,color .15s}
.lx-pop-item:hover,.lx-pop-item:focus-visible{background:rgba(255,255,255,.07);color:#fff;outline:none}

/* ---------------------------- status bar ---------------------------- */
.lx-status{display:flex;align-items:center;justify-content:space-between;gap:16px;height:28px;padding:0 16px;font-size:11px;color:#586079;background:#090b11;border-top:1px solid rgba(255,255,255,.06)}

/* ---------------------------- workspace content ---------------------------- */
.lx-root .sv-panel{border-radius:12px;background:#0f121c;border:1px solid rgba(255,255,255,.07);box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none}
.lx-root .sv-glass{border-radius:12px;background:#0f121c;border:1px solid rgba(255,255,255,.07);box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none}
.lx-root .rounded-3xl{border-radius:12px}
.lx-root .rounded-\\[2rem\\]{border-radius:14px}
.lx-section{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.lx-section h2{font-size:13px;font-weight:600;color:#c6cbe0}
.lx-section span{font-size:12px;color:#586079}

/* library */
@media (min-width:640px){.lx-lib{gap:16px;grid-template-columns:repeat(auto-fill,176px)}}
.lx-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.lx-tabs::-webkit-scrollbar{display:none}
.lx-tab{position:relative;display:inline-flex;align-items:center;gap:7px;flex-shrink:0;height:32px;padding:0 13px;border-radius:8px;font-size:13px;font-weight:500;color:#98a0ba;background:#10131d;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);transition:background .18s,color .18s,box-shadow .18s}
.lx-tab:hover{color:#fff;background:#151a29}
.lx-tab[aria-selected="true"]{color:#fff;background:rgba(230,193,112,.13);box-shadow:inset 0 0 0 1px rgba(230,193,112,.5)}
.lx-tab:focus-visible{outline:2px solid var(--lx-gold);outline-offset:2px}
.lx-tab small{font-family:var(--font-num),monospace;font-size:11px;opacity:.55}
.lx-select{background:#10131d;border-radius:8px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.lx-seg{display:inline-flex;padding:2px;border-radius:9px;background:#10131d;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.lx-seg button{display:flex;align-items:center;justify-content:center;width:34px;height:28px;border-radius:7px;color:#7d85a0;transition:background .15s,color .15s}
.lx-seg button:hover{color:#fff}
.lx-seg button[aria-pressed="true"]{color:var(--lx-gold);background:rgba(230,193,112,.14)}
.lx-seg button:focus-visible{outline:2px solid var(--lx-gold);outline-offset:1px}

/* continue-playing cards and list rows */
.lx-card{display:flex;align-items:center;gap:12px;flex-shrink:0;width:268px;padding:8px;border-radius:12px;background:#0f121c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07);transition:box-shadow .2s,transform .2s,background .2s}
.lx-card:hover{background:#121626;transform:translateY(-1px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
.lx-thumb{position:relative;flex-shrink:0;overflow:hidden;border-radius:8px;background:#090a14}
.lx-thumb img{width:100%;height:100%;object-fit:cover}
.lx-mini{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;padding:0 12px;border-radius:8px;font-size:12.5px;font-weight:700;color:#16110a;background:linear-gradient(180deg,#fff0bd,#e6c170 55%,#b88a2c);box-shadow:inset 0 1px 0 rgba(255,255,255,.6);transition:filter .2s,transform .2s}
.lx-mini:hover{filter:brightness(1.08)}
.lx-mini:active{transform:scale(.96)}
.lx-mini:focus-visible{outline:2px solid #fff;outline-offset:2px}
.lx-row{display:grid;align-items:center;gap:14px;padding:8px 12px 8px 8px;border-radius:10px;background:#0f121c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);transition:background .15s,box-shadow .15s}
.lx-row:hover{background:#131726;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.lx-row[data-selected="true"]{box-shadow:inset 0 0 0 1px var(--ac,#e6c170);background:#141828}

/* tiles: a touch smaller than before */
.lx-tile{border-radius:16px}
.lx-tile[data-selected="true"]::before{border-radius:20px}
.lx-face{border-radius:14.5px}
.lx-play{height:34px;border-radius:9px;font-size:13px}

@media (prefers-reduced-motion:reduce){.lx-nav[data-active="true"]::before{animation:none}.lx-card:hover{transform:none}}
`;
