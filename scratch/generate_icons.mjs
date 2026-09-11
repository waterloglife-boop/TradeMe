import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 1. Concept 1 (Primary Recommended: "상생 루프 스토어 - Store Loop")
// An energetic warm-orange squircle with two smooth circular barter arrows interlocking into a cozy neighborhood store silhouette and voucher ticket
const svgConcept1 = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="64" y1="32" x2="448" y2="480" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6B2B" />
      <stop offset="50%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>

    <!-- Subtle Inner Glow -->
    <radialGradient id="innerGlow" cx="20%" cy="15%" r="85%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </radialGradient>

    <!-- Emblem Shadow -->
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#7C2D12" flood-opacity="0.32" />
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.18" />
    </filter>

    <!-- Soft Accent Glow for Center Badge -->
    <linearGradient id="badgeGrad" x1="160" y1="140" x2="352" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#FFF7ED" />
    </linearGradient>

    <linearGradient id="arrowGrad1" x1="140" y1="180" x2="370" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#EA580C" />
      <stop offset="100%" stop-color="#C2410C" />
    </linearGradient>

    <linearGradient id="arrowGrad2" x1="370" y1="340" x2="140" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>

    <linearGradient id="ticketGrad" x1="180" y1="190" x2="330" y2="320" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFEDD5" />
      <stop offset="100%" stop-color="#FED7AA" />
    </linearGradient>
  </defs>

  <!-- Squircle Base (Apple iOS 110px radius style) -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad)" />
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#innerGlow)" />

  <!-- Outer Protective Border / Sheen -->
  <rect x="17" y="17" width="478" height="478" rx="107" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="2.5" />

  <!-- Center Icon: Crisp Interlocking Shop & Exchange Arrows Emblem -->
  <g filter="url(#dropShadow)">
    <!-- Store Awning Roof Silhouette (Top Arch) -->
    <path d="M168 200 C168 152 206 116 256 116 C306 116 344 152 344 200" 
          stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" fill="none" opacity="0.95" />
    
    <!-- Top-Right Exchange Flow Arrow Head -->
    <path d="M320 128 L360 148 L356 196" 
          fill="none" stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Store Base & Bottom Exchange Flow (Bottom Arch) -->
    <path d="M344 312 C344 360 306 396 256 396 C206 396 168 360 168 312" 
          stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" fill="none" opacity="0.95" />
    
    <!-- Bottom-Left Exchange Flow Arrow Head -->
    <path d="M192 384 L152 364 L156 316" 
          fill="none" stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Center Voucher / Merchant Card (The mutual trade item) -->
    <rect x="200" y="212" width="112" height="88" rx="20" fill="#FFFFFF" />
    
    <!-- Ticket Cutout Notches (Left and Right) -->
    <circle cx="200" cy="256" r="12" fill="#F97316" />
    <circle cx="312" cy="256" r="12" fill="#EA580C" />

    <!-- Center 1:1 Trade Icon (Handshake / Star / Sync) -->
    <path d="M236 256 L276 256 M264 244 L276 256 L264 268" 
          stroke="#EA580C" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="236" cy="256" r="4.5" fill="#EA580C" />
  </g>
</svg>
`.trim();

// 2. Concept 2: "트레이드미 T-M 모노그램 & 상생 루프"
const svgConcept2 = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad2" x1="32" y1="32" x2="480" y2="480" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF5722" />
      <stop offset="100%" stop-color="#E64A19" />
    </linearGradient>
    <filter id="shadow2" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#4E1906" flood-opacity="0.35" />
    </filter>
  </defs>

  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad2)" />
  <rect x="17" y="17" width="478" height="478" rx="107" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="2.5" />

  <!-- Stylized Interlocking T and M with arrows -->
  <g filter="url(#shadow2)" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
    <!-- T top bar curving into M -->
    <path d="M140 170 H372" stroke-width="32" />
    <path d="M256 170 V340" stroke-width="32" />
    <!-- Circular trade ribbons -->
    <path d="M170 260 C170 320 220 360 290 340 C340 325 360 280 340 230 C325 190 280 210 240 250" 
          stroke-width="24" stroke="#FFF7ED" fill="none" stroke-dasharray="2 0" />
    <polygon points="150,240 170,275 195,245" fill="#FFFFFF" stroke="none" />
    <polygon points="260,265 235,245 255,225" fill="#FFFFFF" stroke="none" />
  </g>
</svg>
`.trim();

// 3. Concept 3: "볼드 1:1 맞교환 뱃지 (Clean Bold Minimalist)"
const svgConcept3 = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad3" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FB923C" />
      <stop offset="40%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#C2410C" />
    </linearGradient>
    <filter id="shadow3">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000" flood-opacity="0.28" />
    </filter>
  </defs>

  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad3)" />

  <g filter="url(#shadow3)">
    <!-- Shop awning roof -->
    <path d="M150 220 L256 140 L362 220 H150 Z" fill="#FFFFFF" />
    <!-- Shop Pillar Columns -->
    <rect x="175" y="240" width="30" height="110" rx="10" fill="#FFFFFF" />
    <rect x="307" y="240" width="30" height="110" rx="10" fill="#FFFFFF" />
    <!-- Central Bi-directional Exchange Arrows -->
    <path d="M230 270 H285 M270 255 L285 270 L270 285" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M282 320 H227 M242 305 L227 320 L242 335" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <!-- Shop Foundation Base -->
    <rect x="140" y="360" width="232" height="24" rx="12" fill="#FFFFFF" />
  </g>
</svg>
`.trim();

async function run() {
  const publicDir = path.resolve('c:/Users/COM/.gemini/antigravity/scratch/trade me/public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Save Primary SVG as favicon.svg
  const faviconSvgPath = path.join(publicDir, 'favicon.svg');
  fs.writeFileSync(faviconSvgPath, svgConcept1, 'utf8');
  console.log('Saved:', faviconSvgPath);

  // 2. Generate Apple Touch Icon (180x180 PNG)
  await sharp(Buffer.from(svgConcept1))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated: apple-touch-icon.png (180x180)');

  // 3. Generate PWA 192x192 PNG
  await sharp(Buffer.from(svgConcept1))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated: pwa-192x192.png (192x192)');

  // 4. Generate PWA 512x512 PNG
  await sharp(Buffer.from(svgConcept1))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated: pwa-512x512.png (512x512)');

  // 5. Generate Favicon 32x32 PNG
  await sharp(Buffer.from(svgConcept1))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Generated: favicon-32x32.png (32x32)');

  // Also save Concept 2 and Concept 3 for showcase
  fs.writeFileSync(path.join(publicDir, 'logo-concept-1.svg'), svgConcept1, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'logo-concept-2.svg'), svgConcept2, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'logo-concept-3.svg'), svgConcept3, 'utf8');

  await sharp(Buffer.from(svgConcept2))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo-concept-2.png'));
  await sharp(Buffer.from(svgConcept3))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo-concept-3.png'));

  console.log('All icons generated successfully!');
}

run().catch(console.error);
