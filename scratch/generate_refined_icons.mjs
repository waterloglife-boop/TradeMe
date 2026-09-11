import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// ----------------------------------------------------------------------------
// Refined Option A-1: (Strongly Recommended)
// Large, solid, unmistakable circular exchange arrowheads forming the top and bottom loops
// Center: Clean neighborhood store & mutual exchange voucher ticket
// ----------------------------------------------------------------------------
const svgRefinedA1 = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="48" y1="32" x2="464" y2="480" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6B2B" />
      <stop offset="45%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>

    <!-- Subtle Inner Glow -->
    <radialGradient id="innerGlow" cx="25%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.32" />
      <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </radialGradient>

    <!-- Deep Ambient Drop Shadow -->
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#5C1D06" flood-opacity="0.36" />
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.18" />
    </filter>

    <linearGradient id="voucherGrad" x1="200" y1="210" x2="312" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#FFF7ED" />
    </linearGradient>
  </defs>

  <!-- Squircle Base (Apple iOS 110px radius) -->
  <rect x="16" y="16" width="480" height="480" rx="110" fill="url(#bgGrad)" />
  <rect x="16" y="16" width="480" height="480" rx="110" fill="url(#innerGlow)" />
  <rect x="17" y="17" width="478" height="478" rx="109" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="2.5" />

  <g filter="url(#dropShadow)">
    <!-- 1. Top Circular Exchange Arrow (Flowing Clockwise Right & Down) -->
    <!-- Arc Body -->
    <path d="M 148 245 C 148 162 202 110 286 110 C 330 110 364 128 388 158" 
          stroke="#FFFFFF" stroke-width="32" stroke-linecap="round" fill="none" />
    <!-- Solid, Bold Triangular Arrowhead pointing clearly Down-Right -->
    <polygon points="418,178 358,162 396,120" fill="#FFFFFF" />

    <!-- 2. Bottom Circular Exchange Arrow (Flowing Clockwise Left & Up) -->
    <!-- Arc Body -->
    <path d="M 364 267 C 364 350 310 402 226 402 C 182 402 148 384 124 354" 
          stroke="#FFFFFF" stroke-width="32" stroke-linecap="round" fill="none" />
    <!-- Solid, Bold Triangular Arrowhead pointing clearly Up-Left -->
    <polygon points="94,334 154,350 116,392" fill="#FFFFFF" />

    <!-- 3. Center Merchant Shop & 1:1 Mutual Voucher Card -->
    <!-- Shop Awning / Roof Overhang -->
    <path d="M 184 212 L 256 168 L 328 212 Z" fill="#FFFFFF" />

    <!-- Voucher Body -->
    <rect x="194" y="210" width="124" height="92" rx="18" fill="url(#voucherGrad)" />
    
    <!-- Voucher Side Notches (Coupons) -->
    <circle cx="194" cy="256" r="14" fill="#F97316" />
    <circle cx="318" cy="256" r="14" fill="#EA580C" />

    <!-- Central 1:1 Exchange Symbol inside voucher (Horizontal Trade Arrows) -->
    <path d="M 230 246 H 274 M 264 238 L 274 246 L 264 254" 
          stroke="#EA580C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 282 266 H 238 M 248 258 L 238 266 L 248 274" 
          stroke="#EA580C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>
`.trim();

// ----------------------------------------------------------------------------
// Refined Option A-2: "빅 서큘러 애로우 & 상점 실루엣 (Big Circular Arrows & Store)"
// Prominent 360-degree interlocking dual arrows wrapping a clean store icon
// ----------------------------------------------------------------------------
const svgRefinedA2 = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad2" x1="32" y1="32" x2="480" y2="480" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6B2B" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>
    <filter id="dropShadow2" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#5C1D06" flood-opacity="0.36" />
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.2" />
    </filter>
  </defs>

  <rect x="16" y="16" width="480" height="480" rx="110" fill="url(#bgGrad2)" />
  <rect x="17" y="17" width="478" height="478" rx="109" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="2.5" />

  <g filter="url(#dropShadow2)">
    <!-- Top Bold Circular Arrow -->
    <path d="M 140 230 C 140 145 200 100 285 100 C 340 100 385 130 405 175" 
          stroke="#FFFFFF" stroke-width="36" stroke-linecap="round" fill="none" />
    <polygon points="425,215 365,185 415,145" fill="#FFFFFF" />

    <!-- Bottom Bold Circular Arrow -->
    <path d="M 372 282 C 372 367 312 412 227 412 C 172 412 127 382 107 337" 
          stroke="#FFFFFF" stroke-width="36" stroke-linecap="round" fill="none" />
    <polygon points="87,297 147,327 97,367" fill="#FFFFFF" />

    <!-- Center: Classic Storefront Silhouette -->
    <!-- Awning Roof -->
    <path d="M 175 220 L 256 160 L 337 220 H 175 Z" fill="#FFFFFF" />
    <!-- Shop Body Frame -->
    <rect x="195" y="232" width="122" height="74" rx="12" fill="#FFFFFF" />
    <!-- Shop Door & Exchange Arrows in doorway -->
    <rect x="236" y="248" width="40" height="58" rx="8" fill="#F97316" />
    <!-- Mini Doorway Trade Sync Symbol -->
    <path d="M 246 270 H 266 M 260 265 L 266 270 L 260 275" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
    <path d="M 266 284 H 246 M 252 279 L 246 284 L 252 289" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
  </g>
</svg>
`.trim();

// ----------------------------------------------------------------------------
// Refined Option A-3: "모던 1:1 트레이드 루프 & 인피니티 바우처"
// Very clean, modern tech-startup style with thick circular trade arrows
// ----------------------------------------------------------------------------
const svgRefinedA3 = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad3" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF7A30" />
      <stop offset="60%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#C2410C" />
    </linearGradient>
    <filter id="dropShadow3">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000" flood-opacity="0.32" />
    </filter>
  </defs>

  <rect x="16" y="16" width="480" height="480" rx="110" fill="url(#bgGrad3)" />

  <g filter="url(#dropShadow3)">
    <!-- Seamless Circular Trade Ring with 2 Giant Arrowheads -->
    <!-- Top Arc & Arrow -->
    <path d="M 150 256 C 150 160 210 115 295 115 C 345 115 385 140 405 180" 
          stroke="#FFFFFF" stroke-width="40" stroke-linecap="round" fill="none" />
    <path d="M 370 145 L 430 190 L 375 235 Z" fill="#FFFFFF" />

    <!-- Bottom Arc & Arrow -->
    <path d="M 362 256 C 362 352 302 397 217 397 C 167 397 127 372 107 332" 
          stroke="#FFFFFF" stroke-width="40" stroke-linecap="round" fill="none" />
    <path d="M 142 367 L 82 322 L 137 277 Z" fill="#FFFFFF" />

    <!-- Center: Modern Barter Handshake & Voucher Ticket -->
    <rect x="200" y="210" width="112" height="92" rx="20" fill="#FFFFFF" />
    <circle cx="200" cy="256" r="14" fill="#F97316" />
    <circle cx="312" cy="256" r="14" fill="#EA580C" />
    
    <!-- Bold 'T' & 'M' Trade Monogram or Barter Mark -->
    <text x="256" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="34" font-weight="900" fill="#EA580C" text-anchor="middle" letter-spacing="-1">TM</text>
  </g>
</svg>
`.trim();

async function run() {
  const publicDir = path.resolve('c:/Users/COM/.gemini/antigravity/scratch/trade me/public');

  // Write SVGs for preview and production
  fs.writeFileSync(path.join(publicDir, 'logo-concept-A1.svg'), svgRefinedA1, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'logo-concept-A2.svg'), svgRefinedA2, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'logo-concept-A3.svg'), svgRefinedA3, 'utf8');

  // Render PNGs
  await sharp(Buffer.from(svgRefinedA1)).resize(512, 512).png().toFile(path.join(publicDir, 'logo-concept-A1.png'));
  await sharp(Buffer.from(svgRefinedA2)).resize(512, 512).png().toFile(path.join(publicDir, 'logo-concept-A2.png'));
  await sharp(Buffer.from(svgRefinedA3)).resize(512, 512).png().toFile(path.join(publicDir, 'logo-concept-A3.png'));

  // Also apply Refined A-1 directly as official favicon and PWA icons
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgRefinedA1, 'utf8');
  await sharp(Buffer.from(svgRefinedA1)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(Buffer.from(svgRefinedA1)).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(Buffer.from(svgRefinedA1)).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(Buffer.from(svgRefinedA1)).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));

  console.log('All refined Concept A icons generated and updated successfully!');
}

run().catch(console.error);
