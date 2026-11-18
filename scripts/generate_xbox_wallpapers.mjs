import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

async function makeWallpapers() {
  const dir = path.join(process.cwd(), "public", "art", "xbox", "wallpapers");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const heroPath = path.join(process.cwd(), "public", "art", "xbox", "hero-bg.webp");
  if (fs.existsSync(heroPath)) {
    await sharp(heroPath)
      .resize(1920, 1080, { fit: "cover", position: "top" })
      .webp({ quality: 85 })
      .toFile(path.join(dir, "starfield.webp"));
  }

  async function makeSvgWallpaper(filename, svgContent) {
    const buf = Buffer.from(svgContent);
    await sharp(buf)
      .resize(1920, 1080)
      .webp({ quality: 85 })
      .toFile(path.join(dir, filename));
  }

  // Diablo IV: Hellish crimson, dark embers, gothic ruins
  await makeSvgWallpaper("diablo.webp", `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hellGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#800b0b" stop-opacity="0.9"/>
          <stop offset="40%" stop-color="#380303" stop-opacity="0.8"/>
          <stop offset="80%" stop-color="#110101" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#050000" stop-opacity="1"/>
        </radialGradient>
        <radialGradient id="coreFlame" cx="50%" cy="35%" r="25%">
          <stop offset="0%" stop-color="#ff4500" stop-opacity="0.7"/>
          <stop offset="50%" stop-color="#b30000" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#ff0000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="smoke" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.95"/>
          <stop offset="60%" stop-color="#180202" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="transparent"/>
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#hellGlow)"/>
      <circle cx="960" cy="420" r="480" fill="url(#coreFlame)" filter="blur(40px)"/>
      <path d="M0,1080 L0,700 Q300,550 600,680 T1200,650 Q1600,580 1920,720 L1920,1080 Z" fill="#080101"/>
      <path d="M200,750 L250,420 L270,420 L320,750 Z M880,700 L960,300 L1040,700 Z M1600,720 L1650,450 L1700,720 Z" fill="#0d0202" opacity="0.6"/>
      <circle cx="960" cy="380" r="260" fill="none" stroke="#ff2200" stroke-width="2" stroke-dasharray="12 8" opacity="0.35"/>
      <circle cx="960" cy="380" r="220" fill="none" stroke="#d41010" stroke-width="1.5" opacity="0.25"/>
      <rect width="1920" height="1080" fill="url(#smoke)"/>
    </svg>
  `);

  // Fortnite: Vibrant celestial rift, cyan/purple sunset
  await makeSvgWallpaper("fortnite.webp", `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fortSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1d003b"/>
          <stop offset="35%" stop-color="#4d126b"/>
          <stop offset="70%" stop-color="#bf2e74"/>
          <stop offset="90%" stop-color="#ff7b47"/>
          <stop offset="100%" stop-color="#080214"/>
        </linearGradient>
        <radialGradient id="rift" cx="60%" cy="30%" r="35%">
          <stop offset="0%" stop-color="#00ffff" stop-opacity="0.9"/>
          <stop offset="40%" stop-color="#9900ff" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#fortSky)"/>
      <circle cx="1150" cy="320" r="320" fill="url(#rift)" filter="blur(30px)"/>
      <polygon points="1150,150 1190,320 1150,480 1110,320" fill="#ffffff" opacity="0.8" filter="blur(2px)"/>
      <path d="M0,1080 L0,780 Q450,620 960,740 T1920,680 L1920,1080 Z" fill="#0c051a"/>
      <path d="M0,1080 L0,860 Q600,720 1200,820 T1920,780 L1920,1080 Z" fill="#05010a"/>
    </svg>
  `);

  // Forza Horizon 5: Red supercar coastal sunset
  await makeSvgWallpaper("forza.webp", `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="forzaSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0b1e3d"/>
          <stop offset="40%" stop-color="#ff4e20"/>
          <stop offset="65%" stop-color="#ffae19"/>
          <stop offset="85%" stop-color="#ffd97a"/>
          <stop offset="100%" stop-color="#080e14"/>
        </linearGradient>
        <radialGradient id="sunFlare" cx="65%" cy="50%" r="40%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="25%" stop-color="#ffe270" stop-opacity="0.7"/>
          <stop offset="60%" stop-color="#ff5900" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#forzaSky)"/>
      <circle cx="1250" cy="520" r="350" fill="url(#sunFlare)" filter="blur(20px)"/>
      <path d="M0,580 L1920,580 L1920,1080 L0,1080 Z" fill="#0a1826" opacity="0.8"/>
      <polygon points="200,580 450,420 700,580" fill="#1c2538" opacity="0.5"/>
      <polygon points="600,580 900,380 1200,580" fill="#141d2e" opacity="0.6"/>
      <path d="M0,1080 L800,600 L1120,600 L1920,1080 Z" fill="#10151c"/>
      <path d="M950,600 L970,600 L1200,1080 L1170,1080 Z" fill="#ff003c" opacity="0.7" filter="blur(6px)"/>
      <path d="M960,600 L965,600 L1080,1080 L1070,1080 Z" fill="#ffd000" opacity="0.8" filter="blur(3px)"/>
    </svg>
  `);

  // Assassin's Creed Mirage: Golden Baghdad
  await makeSvgWallpaper("acmirage.webp", `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="baghdadSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0e1726"/>
          <stop offset="40%" stop-color="#3e2613"/>
          <stop offset="70%" stop-color="#9c5c1e"/>
          <stop offset="90%" stop-color="#d89b44"/>
          <stop offset="100%" stop-color="#080603"/>
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#baghdadSky)"/>
      <circle cx="960" cy="350" r="180" fill="#ffe79a" opacity="0.8" filter="blur(15px)"/>
      <path d="M0,1080 L0,740 Q400,680 800,720 T1920,700 L1920,1080 Z" fill="#140d07"/>
      <rect x="480" y="460" width="30" height="280" fill="#1a110a"/>
      <polygon points="475,460 495,380 515,460" fill="#1a110a"/>
      <rect x="1350" y="420" width="36" height="320" fill="#1a110a"/>
      <polygon points="1344,420 1368,340 1392,420" fill="#1a110a"/>
      <path d="M840,720 Q960,480 1080,720 Z" fill="#1c130b"/>
    </svg>
  `);

  // Ghostwire Tokyo: Rainy Shibuya crossing
  await makeSvgWallpaper("ghostwire.webp", `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tokyoNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#030914"/>
          <stop offset="50%" stop-color="#091b33"/>
          <stop offset="80%" stop-color="#120826"/>
          <stop offset="100%" stop-color="#020205"/>
        </linearGradient>
        <radialGradient id="toriiGlow" cx="50%" cy="45%" r="35%">
          <stop offset="0%" stop-color="#00e1ff" stop-opacity="0.7"/>
          <stop offset="40%" stop-color="#8c00ff" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#tokyoNight)"/>
      <circle cx="960" cy="460" r="380" fill="url(#toriiGlow)" filter="blur(45px)"/>
      <rect x="760" y="320" width="400" height="28" fill="#030c17"/>
      <rect x="730" y="360" width="460" height="20" fill="#030c17"/>
      <rect x="820" y="360" width="35" height="380" fill="#030c17"/>
      <rect x="1065" y="360" width="35" height="380" fill="#030c17"/>
      <rect x="830" y="400" width="15" height="220" fill="#00e5ff" opacity="0.7" filter="blur(4px)"/>
      <rect x="1075" y="400" width="15" height="220" fill="#ff0077" opacity="0.7" filter="blur(4px)"/>
    </svg>
  `);

  // Minecraft: Blocky mountains
  await makeSvgWallpaper("minecraft.webp", `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mcSunset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#111c38"/>
          <stop offset="40%" stop-color="#422954"/>
          <stop offset="70%" stop-color="#bf4a45"/>
          <stop offset="90%" stop-color="#e08c48"/>
          <stop offset="100%" stop-color="#080f14"/>
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#mcSunset)"/>
      <rect x="900" y="360" width="120" height="120" fill="#fff2b2" opacity="0.9"/>
      <path d="M0,1080 L0,760 H200 V720 H340 V680 H480 V640 H640 V600 H800 V640 H960 V680 H1120 V640 H1280 V600 H1440 V640 H1600 V680 H1760 V720 H1920 V1080 Z" fill="#16281a"/>
      <path d="M0,1080 L0,840 H280 V800 H480 V760 H720 V800 H1040 V760 H1360 V800 H1640 V760 H1920 V1080 Z" fill="#0b160e"/>
    </svg>
  `);

  // Disney+: Blue cosmic glow
  await makeSvgWallpaper("disney.webp", `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="disneyArc" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stop-color="#082a66"/>
          <stop offset="50%" stop-color="#041438"/>
          <stop offset="100%" stop-color="#010512"/>
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#disneyArc)"/>
      <path d="M400,650 Q960,180 1520,650" fill="none" stroke="#4ca5ff" stroke-width="4" opacity="0.6" filter="blur(2px)"/>
      <path d="M420,650 Q960,200 1500,650" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.8"/>
    </svg>
  `);

  // Party Animals
  await makeSvgWallpaper("partyanimals.webp", `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="partyGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#ffaa00" stop-opacity="0.6"/>
          <stop offset="40%" stop-color="#ff0055" stop-opacity="0.4"/>
          <stop offset="80%" stop-color="#220033" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#08000e" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#partyGlow)"/>
    </svg>
  `);

  console.log("All Xbox wallpapers baked successfully!");
}

makeWallpapers().catch(console.error);
