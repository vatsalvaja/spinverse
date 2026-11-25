/**
 * Original vector artwork for the eight Pharaoh's Fortune symbols (viewBox 0 0 100 100).
 * Plain SVG markup so it can be rendered inline, and baked to PNG for review with `sharp`.
 * Gradients live in SYMBOL_DEFS, which the machine renders once.
 */
export const SYMBOL_DEFS = `
<linearGradient id="pf-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d2"/><stop offset=".3" stop-color="#f3cb62"/><stop offset=".65" stop-color="#c0892a"/><stop offset="1" stop-color="#f1cf7a"/></linearGradient>
<linearGradient id="pf-gold-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c553"/><stop offset=".6" stop-color="#b57b1d"/><stop offset="1" stop-color="#6e4510"/></linearGradient>
<linearGradient id="pf-lapis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c98ff"/><stop offset="1" stop-color="#14247a"/></linearGradient>
<linearGradient id="pf-turq" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9afff3"/><stop offset=".55" stop-color="#22c5b8"/><stop offset="1" stop-color="#0b6f72"/></linearGradient>
<linearGradient id="pf-ruby" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffa7b4"/><stop offset=".5" stop-color="#d4213f"/><stop offset="1" stop-color="#6a0a1f"/></linearGradient>
<linearGradient id="pf-onyx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#565669"/><stop offset="1" stop-color="#0c0c13"/></linearGradient>
<linearGradient id="pf-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe8bb"/><stop offset="1" stop-color="#b98743"/></linearGradient>
<radialGradient id="pf-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4c4" stop-opacity=".95"/><stop offset=".45" stop-color="#ffc94d" stop-opacity=".55"/><stop offset="1" stop-color="#ff9d2a" stop-opacity="0"/></radialGradient>
`;

const STROKE = `stroke="#5a3709" stroke-width="1.5" stroke-linejoin="round"`;

export const SYMBOL_SVG: Record<string, string> = {
  pharaoh: `
<g ${STROKE}>
  <path d="M50 5C29 5 21 21 21 38L14 80 36 72V52H64V72L86 80 79 38C79 21 71 5 50 5Z" fill="url(#pf-gold)"/>
  <path d="M26 20Q50 11 74 20M23 30Q50 21 77 30" fill="none" stroke="#1f43b8" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M22 46L35 44M20 56L35 54M18 66L35 63M16 76L35 71M78 46L65 44M80 56L65 54M82 66L65 63M84 76L65 71" stroke="#1f43b8" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M25 76Q50 90 75 76L79 83Q50 101 21 83Z" fill="url(#pf-gold-d)"/>
  <path d="M35 30C35 24 42 19 50 19S65 24 65 30V52C65 63 58 71 50 71S35 63 35 52Z" fill="#f7cf74"/>
  <path d="M50 4C45 9 45 14 50 18 55 14 55 9 50 4Z" fill="url(#pf-ruby)" stroke-width="1"/>
  <path d="M38 38Q43 33.5 49 38Q43 41 38 38ZM51 38Q57 33.5 62 38Q57 41 51 38Z" fill="#17100a" stroke="none"/>
  <path d="M36 38.5L30 41.5M64 38.5L70 41.5M38 32Q43 29.5 48 32M52 32Q57 29.5 62 32" fill="none" stroke="#17100a" stroke-width="2" stroke-linecap="round"/>
  <path d="M50 40V50Q47 53 50 54M44 60Q50 63.5 56 60" fill="none" stroke="#8a4a12" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M46 70H54L55.5 82Q50 86 44.5 82Z" fill="url(#pf-lapis)" stroke-width="1.2"/>
</g>
<rect x="29" y="85" width="42" height="12" rx="3" fill="#120a04" stroke="url(#pf-gold)" stroke-width="1.6"/>
<text x="50" y="94.2" text-anchor="middle" font-size="9.5" font-weight="800" letter-spacing=".8" fill="#f8d97c" style="font-family:var(--font-num),Arial,sans-serif">WILD</text>`,

  scarab: `
<circle cx="50" cy="50" r="49" fill="url(#pf-sun)"/>
<g ${STROKE}>
  <path d="M47 46C34 28 12 28 3 42C14 46 20 58 29 68C38 66 44 58 47 46Z" fill="url(#pf-gold)"/>
  <path d="M53 46C66 28 88 28 97 42C86 46 80 58 71 68C62 66 56 58 53 46Z" fill="url(#pf-gold)"/>
  <path d="M10 41Q24 40 38 50M14 49Q26 50 36 58M19 57Q28 58 34 64M90 41Q76 40 62 50M86 49Q74 50 64 58M81 57Q72 58 66 64" fill="none" stroke="#8a5a12" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M33 54L21 50M33 64L20 69M35 74L27 86M67 54L79 50M67 64L80 69M65 74L73 86" fill="none" stroke="#e9bd4f" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M50 28C63 28 69 41 69 56C69 73 61 86 50 86C39 86 31 73 31 56C31 41 37 28 50 28Z" fill="url(#pf-turq)" stroke-width="2.2"/>
  <path d="M50 32V84M35 50Q50 43 65 50M33.5 63Q50 56 66.5 63" fill="none" stroke="#0a5a5c" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M40 31Q50 19 60 31Q50 35 40 31Z" fill="url(#pf-gold)"/>
  <circle cx="50" cy="13" r="9.5" fill="url(#pf-gold)"/>
  <circle cx="50" cy="13" r="4.6" fill="url(#pf-ruby)" stroke-width="1"/>
</g>
<path d="M44 40Q50 36 56 40" fill="none" stroke="#e8fffb" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>`,

  anubis: `
<g ${STROKE}>
  <path d="M10 98Q50 66 90 98V100H10Z" fill="url(#pf-gold-d)"/>
  <path d="M27 40L19 4L43 27Z" fill="url(#pf-onyx)"/>
  <path d="M73 40L81 4L57 27Z" fill="url(#pf-onyx)"/>
  <path d="M28 33L23 12L38 28ZM72 33L77 12L62 28Z" fill="url(#pf-gold)" stroke="none"/>
  <path d="M28 36Q50 20 72 36L67 59Q64 67 56 71L53 86H47L44 71Q36 67 33 59Z" fill="url(#pf-onyx)"/>
  <path d="M30 41Q50 32 70 41" fill="none" stroke="url(#pf-gold)" stroke-width="4" stroke-linecap="round"/>
  <path d="M46 48H54L54.5 71H45.5Z" fill="#2b2b38" stroke="none"/>
  <ellipse cx="50" cy="72" rx="4.4" ry="3.4" fill="#06060a" stroke="none"/>
  <path d="M35 49Q41 43 47 49Q41 52 35 49ZM53 49Q59 43 65 49Q59 52 53 49Z" fill="#f7d36e" stroke="none"/>
  <circle cx="41" cy="48.6" r="1.7" fill="#0a0a10" stroke="none"/><circle cx="59" cy="48.6" r="1.7" fill="#0a0a10" stroke="none"/>
  <path d="M18 90Q50 66 82 90" fill="none" stroke="url(#pf-lapis)" stroke-width="6" stroke-linecap="round"/>
  <path d="M22 94Q50 72 78 94" fill="none" stroke="url(#pf-gold)" stroke-width="3" stroke-linecap="round"/>
</g>`,

  horus: `
<g ${STROKE}>
  <path d="M10 33Q50 -2 90 33" fill="none" stroke="url(#pf-gold)" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M6 48Q50 12 94 48Q50 82 6 48Z" fill="#f6f1e2" stroke="url(#pf-gold-d)" stroke-width="4.2"/>
  <circle cx="50" cy="47" r="16.5" fill="url(#pf-lapis)" stroke-width="2.2"/>
  <circle cx="50" cy="47" r="7" fill="#050823" stroke="none"/>
  <circle cx="45.6" cy="42.4" r="2.8" fill="#fff" stroke="none"/>
  <path d="M6 50Q0 60 7 68" fill="none" stroke="url(#pf-gold)" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M46 66V80Q46 91 59 90" fill="none" stroke="url(#pf-gold)" stroke-width="5" stroke-linecap="round"/>
  <path d="M64 63Q76 70 72 82Q69 91 79 90" fill="none" stroke="url(#pf-lapis)" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M59 90a4.6 4.6 0 1 1-4-7" fill="none" stroke="url(#pf-gold)" stroke-width="3.4" stroke-linecap="round"/>
</g>`,

  sphinx: `
<g ${STROKE}>
  <rect x="6" y="84" width="88" height="10" rx="2" fill="url(#pf-sand)"/>
  <path d="M90 82C92 70 84 56 66 52C50 49 38 52 34 62L32 82Z" fill="url(#pf-gold)"/>
  <path d="M8 82V74Q8 68 18 68H44V82Z" fill="url(#pf-gold-d)"/>
  <path d="M90 80Q99 72 94 60" fill="none" stroke="#c0892a" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M14 33C14 18 28 10 40 14C52 18 54 34 51 52L46 68H24L18 50Z" fill="url(#pf-gold)"/>
  <path d="M16 28L40 20M15 36L45 28M16 44L48 38" fill="none" stroke="#1f43b8" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M9 40Q10 28 22 27L33 30L34 52Q26 60 16 56L11 48Z" fill="#f8d684"/>
  <path d="M14 38Q19 34 25 38" fill="none" stroke="#17100a" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M10 46Q14 49 18 47" fill="none" stroke="#8a4a12" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M15 56L13 68Q18 72 23 67L25 57Z" fill="url(#pf-lapis)" stroke-width="1.1"/>
  <path d="M28 13Q30 6 36 9" fill="none" stroke="#d4213f" stroke-width="3" stroke-linecap="round"/>
  <path d="M40 60Q54 54 66 58" fill="none" stroke="#8a5a12" stroke-width="1.5" stroke-linecap="round"/>
</g>`,

  temple: `
<g ${STROKE}>
  <rect x="8" y="86" width="84" height="8" rx="1.5" fill="url(#pf-sand)"/>
  <rect x="14" y="80" width="72" height="7" fill="url(#pf-sand)"/>
  <path d="M10 33H90L86 22Q50 12 14 22Z" fill="url(#pf-gold-d)"/>
  <rect x="14" y="33" width="72" height="9" fill="url(#pf-gold)"/>
  <circle cx="50" cy="37.5" r="5" fill="url(#pf-ruby)" stroke-width="1"/>
  <path d="M30 37.5H44M56 37.5H70" stroke="#5a3709" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="26" y="42" width="48" height="38" fill="#150c05"/>
  <path d="M42 80V58Q50 50 58 58V80Z" fill="#32200d" stroke="url(#pf-gold)" stroke-width="1.6"/>
  <g fill="url(#pf-sand)">
    <rect x="16" y="42" width="10" height="38"/><rect x="74" y="42" width="10" height="38"/>
    <rect x="31" y="42" width="8" height="38"/><rect x="61" y="42" width="8" height="38"/>
  </g>
  <g fill="url(#pf-gold)">
    <path d="M14 42H28L26 48H16Z"/><path d="M72 42H86L84 48H74Z"/><path d="M29 42H41L39 47H31Z"/><path d="M59 42H71L69 47H61Z"/>
  </g>
  <path d="M50 8L53 15H47Z" fill="url(#pf-gold)" stroke-width="1"/>
</g>`,

  coin: `
<g ${STROKE}>
  <circle cx="50" cy="50" r="42" fill="url(#pf-gold-d)"/>
  <circle cx="50" cy="50" r="36" fill="url(#pf-gold)"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="#8a5a12" stroke-width="1.6" stroke-dasharray="2.6 3.4"/>
  <ellipse cx="50" cy="37" rx="9" ry="11" fill="none" stroke="#6b4310" stroke-width="5.2"/>
  <path d="M50 47V75M38 56H62" fill="none" stroke="#6b4310" stroke-width="5.2" stroke-linecap="round"/>
  <path d="M26 30Q34 18 48 15" fill="none" stroke="#fffbe6" stroke-opacity=".85" stroke-width="3.4" stroke-linecap="round"/>
</g>`,

  jewel: `
<g ${STROKE}>
  <path d="M30 14H70L90 40L50 92L10 40Z" fill="url(#pf-ruby)"/>
  <path d="M30 14L38 40H10ZM70 14L62 40H90Z" fill="#ff8fa0" fill-opacity=".55" stroke="none"/>
  <path d="M30 14H70L62 40H38Z" fill="#ffc2cb" fill-opacity=".5" stroke="none"/>
  <path d="M38 40L50 92L62 40Z" fill="#7a0b22" fill-opacity=".55" stroke="none"/>
  <path d="M10 40H90M30 14L38 40L50 92M70 14L62 40L50 92M38 40H62" fill="none" stroke="#ffdbe0" stroke-opacity=".75" stroke-width="1.2"/>
  <path d="M30 14H70L90 40L50 92L10 40Z" fill="none" stroke="url(#pf-gold)" stroke-width="3.4"/>
  <path d="M42 24L46 18" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-opacity=".9"/>
  <path d="M78 12V24M72 18H84" stroke="#fff6d2" stroke-width="2.4" stroke-linecap="round"/>
</g>`,
};
