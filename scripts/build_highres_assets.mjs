import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const xboxDir = path.join(root, "public", "art", "xbox");
const wpDir = path.join(xboxDir, "wallpapers");
if (!fs.existsSync(wpDir)) fs.mkdirSync(wpDir, { recursive: true });

async function buildAllHighResAssets() {
  console.log("Starting high-res asset generation for Spinverse...");

  // 1. High-res Avatar: 400x400 futuristic gamerpic
  const avatarSvg = `
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="avBg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1e1035"/>
          <stop offset="60%" stop-color="#0a0518"/>
          <stop offset="100%" stop-color="#020008"/>
        </radialGradient>
        <linearGradient id="neonRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#52b043"/>
          <stop offset="50%" stop-color="#00e5ff"/>
          <stop offset="100%" stop-color="#c24fd1"/>
        </linearGradient>
        <radialGradient id="helmGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00ffff" stop-opacity="0.9"/>
          <stop offset="40%" stop-color="#7000ff" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill="url(#avBg)"/>
      <circle cx="200" cy="200" r="185" fill="none" stroke="url(#neonRing)" stroke-width="6"/>
      <circle cx="200" cy="180" r="110" fill="url(#helmGlow)" filter="blur(25px)"/>
      <!-- Cybernetic Visor & Helmet -->
      <path d="M110,210 C110,130 150,90 200,90 C250,90 290,130 290,210 C290,270 260,300 200,310 C140,300 110,270 110,210 Z" fill="#131422" stroke="#4a5568" stroke-width="4"/>
      <!-- Glowing Visor Slit -->
      <path d="M130,185 Q200,165 270,185 Q200,215 130,185 Z" fill="#00f2fe" filter="drop-shadow(0 0 12px #00f2fe)"/>
      <path d="M145,185 Q200,172 255,185 Q200,198 145,185 Z" fill="#ffffff"/>
      <!-- Crest / Antennas -->
      <polygon points="195,55 205,55 208,95 192,95" fill="#52b043"/>
      <circle cx="200" cy="50" r="6" fill="#52b043" filter="drop-shadow(0 0 8px #52b043)"/>
      <!-- Armor shoulders -->
      <path d="M70,390 Q200,320 330,390 L400,400 L0,400 Z" fill="#0c0e17"/>
      <path d="M120,350 L200,325 L280,350" stroke="#00e5ff" stroke-width="3" fill="none" opacity="0.8"/>
    </svg>
  `;
  await sharp(Buffer.from(avatarSvg)).webp({ quality: 95 }).toFile(path.join(xboxDir, "avatar-sasquatch.webp"));
  console.log("Saved high-res avatar");

  // 2. High-res Bottom Card 1: "Browse your games" (Spinverse Worlds Collage)
  // We composite parts from public/art/neon/poster.webp, pharaoh/poster.webp, atlantis/poster.webp
  const browseSvg = `
    <svg width="800" height="420" viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="browseOverlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.2"/>
          <stop offset="60%" stop-color="#000000" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#050608" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <!-- Background handled by sharp composite -->
    </svg>
  `;

  // Create a 3-way collage for Browse games
  const p1 = await sharp(path.join(root, "public/art/pharaoh/poster.webp")).resize(270, 420, { fit: "cover" }).toBuffer();
  const p2 = await sharp(path.join(root, "public/art/neon/poster.webp")).resize(270, 420, { fit: "cover" }).toBuffer();
  const p3 = await sharp(path.join(root, "public/art/atlantis/poster.webp")).resize(270, 420, { fit: "cover" }).toBuffer();

  const controllerOverlaySvg = `
    <svg width="800" height="420" viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="420" fill="black" opacity="0.25"/>
      <line x1="267" y1="0" x2="267" y2="420" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      <line x1="534" y1="0" x2="534" y2="420" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      <!-- Controller center badge -->
      <circle cx="400" cy="180" r="55" fill="rgba(0,0,0,0.65)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <!-- Gamepad Icon -->
      <path d="M370,165 C360,165 350,175 350,195 C350,215 365,225 380,215 L390,205 L410,205 L420,215 C435,225 450,215 450,195 C450,175 440,165 430,165 Z" fill="none" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
      <path d="M365,190 L379,190 M372,183 L372,197" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
      <circle cx="425" cy="184" r="3" fill="#ffffff"/>
      <circle cx="433" cy="192" r="3" fill="#ffffff"/>
      <circle cx="417" cy="192" r="3" fill="#ffffff"/>
      <circle cx="425" cy="200" r="3" fill="#ffffff"/>
      <!-- Dark bottom text fade -->
      <rect y="280" width="800" height="140" fill="url(#botGrad)"/>
      <defs>
        <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="transparent"/>
          <stop offset="100%" stop-color="#050608"/>
        </linearGradient>
      </defs>
    </svg>
  `;

  await sharp({
    create: { width: 800, height: 420, channels: 3, background: "#050608" },
  })
    .composite([
      { input: p1, left: 0, top: 0 },
      { input: p2, left: 267, top: 0 },
      { input: p3, left: 534, top: 0 },
      { input: Buffer.from(controllerOverlaySvg), left: 0, top: 0 },
    ])
    .webp({ quality: 90 })
    .toFile(path.join(xboxDir, "card-browse.webp"));
  console.log("Saved high-res card-browse.webp");

  // 3. High-res Bottom Card 2: "Customize your Home"
  const customizeSvg = `
    <svg width="800" height="420" viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="custBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0a1224"/>
          <stop offset="50%" stop-color="#101d36"/>
          <stop offset="100%" stop-color="#050812"/>
        </linearGradient>
        <radialGradient id="custGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#2a4d8f" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
      </defs>
      <rect width="800" height="420" fill="url(#custBg)"/>
      <circle cx="400" cy="180" r="220" fill="url(#custGlow)"/>
      <!-- Floating Stars & Constellations -->
      <circle cx="150" cy="90" r="2" fill="#ffffff" opacity="0.8"/>
      <circle cx="280" cy="60" r="2.5" fill="#ffffff" opacity="0.9"/>
      <circle cx="620" cy="110" r="2" fill="#ffffff" opacity="0.7"/>
      <circle cx="690" cy="70" r="3" fill="#ffffff" opacity="0.9"/>
      <circle cx="200" cy="220" r="1.5" fill="#ffffff" opacity="0.5"/>
      <circle cx="650" cy="240" r="2" fill="#ffffff" opacity="0.6"/>
      <!-- Digital Display / Canvas Easel Icon -->
      <g transform="translate(330, 95)">
        <rect x="0" y="0" width="140" height="95" rx="10" fill="#070c18" stroke="#4a6eb8" stroke-width="3" filter="drop-shadow(0 0 15px rgba(74,110,184,0.5))"/>
        <!-- Screen artwork lines inside -->
        <path d="M15,70 Q45,25 75,55 T125,40" fill="none" stroke="#52b043" stroke-width="3"/>
        <circle cx="105" cy="28" r="8" fill="#ffd000"/>
        <!-- Stylus / brush -->
        <path d="M100,12 L130,-18 L142,-6 L112,24 Z" fill="#ffffff" stroke="#2a4d8f" stroke-width="2"/>
        <!-- Display Stand -->
        <path d="M60,95 L50,140 L90,140 L80,95" fill="#324970"/>
        <line x1="35" y1="140" x2="105" y2="140" stroke="#324970" stroke-width="4" stroke-linecap="round"/>
      </g>
      <!-- Bottom gradient -->
      <rect y="280" width="800" height="140" fill="#050812" opacity="0.85"/>
    </svg>
  `;
  await sharp(Buffer.from(customizeSvg)).webp({ quality: 90 }).toFile(path.join(xboxDir, "card-customize.webp"));
  console.log("Saved high-res card-customize.webp");

  // 4. High-res Bottom Card 3: "Featured World" (Neon Overdrive / Spinverse Pass)
  const neonCard = await sharp(path.join(root, "public/art/neon/poster.webp"))
    .resize(800, 420, { fit: "cover" })
    .toBuffer();

  const gamepassBadgeSvg = `
    <svg width="800" height="420" viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gpShine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
        </linearGradient>
      </defs>
      <!-- Top Left Game Pass Badge -->
      <g transform="translate(24, 24)">
        <rect width="130" height="32" rx="6" fill="url(#gpShine)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
        <text x="65" y="21" font-family="sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">GAME PASS</text>
      </g>
      <!-- Dark bottom shade -->
      <rect y="280" width="800" height="140" fill="black" opacity="0.7"/>
    </svg>
  `;

  await sharp(neonCard)
    .composite([{ input: Buffer.from(gamepassBadgeSvg), left: 0, top: 0 }])
    .webp({ quality: 90 })
    .toFile(path.join(xboxDir, "card-forza.webp"));
  console.log("Saved high-res card-forza.webp");

  // 5. High-res Bottom Card 4: "Play like a Pro / Points Vault"
  const vaultDoor = await sharp(path.join(root, "public/art/vault/door.webp"))
    .resize(800, 420, { fit: "cover" })
    .toBuffer();

  const proOverlaySvg = `
    <svg width="800" height="420" viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f0b84a" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
      </defs>
      <rect width="800" height="420" fill="url(#goldGlow)"/>
      <rect width="800" height="420" fill="black" opacity="0.3"/>
      <!-- Top Right Pro Pill -->
      <g transform="translate(640, 24)">
        <rect width="136" height="30" rx="15" fill="#f0b84a" opacity="0.9"/>
        <text x="68" y="20" font-family="sans-serif" font-size="11" font-weight="900" fill="#1a0e03" text-anchor="middle" letter-spacing="1">VAULT PASS</text>
      </g>
      <rect y="280" width="800" height="140" fill="black" opacity="0.75"/>
    </svg>
  `;

  await sharp(vaultDoor)
    .composite([{ input: Buffer.from(proOverlaySvg), left: 0, top: 0 }])
    .webp({ quality: 90 })
    .toFile(path.join(xboxDir, "card-pro.webp"));
  console.log("Saved high-res card-pro.webp");

  // 6. High-res Tiles from our own worlds & generated games:
  // Tile 1: Spinverse Flagship
  await sharp(path.join(wpDir, "spinverse-hero.webp"))
    .resize(400, 400, { fit: "cover", position: "center" })
    .webp({ quality: 90 })
    .toFile(path.join(xboxDir, "tile-spinverse.webp"));

  // Also update tile-starfield.webp to this high-res spinverse tile so any legacy reference is crisp!
  await sharp(path.join(wpDir, "spinverse-hero.webp"))
    .resize(400, 400, { fit: "cover", position: "center" })
    .webp({ quality: 90 })
    .toFile(path.join(xboxDir, "tile-starfield.webp"));

  // Tile 2: Neon Overdrive
  await sharp(path.join(root, "public/art/neon/poster.webp"))
    .resize(400, 400, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(path.join(xboxDir, "tile-neon.webp"));

  // Tile 3: Pharaoh's Fortune
  await sharp(path.join(root, "public/art/pharaoh/poster.webp"))
    .resize(400, 400, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(path.join(xboxDir, "tile-pharaoh.webp"));

  // Tile 4: Atlantis Cascade
  await sharp(path.join(root, "public/art/atlantis/poster.webp"))
    .resize(400, 400, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(path.join(xboxDir, "tile-atlantis.webp"));

  // Tile 5: The Points Vault
  await sharp(path.join(root, "public/art/vault/door.webp"))
    .resize(400, 400, { fit: "cover" })
    .webp({ quality: 90 })
    .toFile(path.join(xboxDir, "tile-vault.webp"));

  console.log("All high-res tiles and cards generated successfully!");
}

buildAllHighResAssets().catch(console.error);
