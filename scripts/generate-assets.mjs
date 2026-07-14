import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDir = new URL('../public/', import.meta.url)
const iconsDir = new URL('./icons/', publicDir)
await mkdir(iconsDir, { recursive: true })

const palette = {
  night: '#121a2f',
  blue: '#253657',
  paper: '#f0e7cf',
  paperDark: '#c9b68d',
  amber: '#efbf69',
  red: '#82464a',
  ink: '#302d2a',
}

function iconSvg(size, safe = false) {
  const pad = safe ? size * 0.18 : size * 0.08
  const paperX = pad + size * 0.16
  const paperY = pad + size * 0.25
  const paperW = size - paperX * 2
  const paperH = size * 0.5
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.blue}"/><stop offset="1" stop-color="${palette.night}"/></linearGradient></defs>
    <rect width="${size}" height="${size}" rx="${safe ? 0 : size * 0.16}" fill="url(#bg)"/>
    <circle cx="${size * 0.72}" cy="${size * 0.23}" r="${size * 0.105}" fill="${palette.amber}"/>
    <circle cx="${size * 0.68}" cy="${size * 0.2}" r="${size * 0.105}" fill="${palette.blue}"/>
    <rect x="${paperX}" y="${paperY}" width="${paperW}" height="${paperH}" rx="${size * 0.018}" fill="${palette.paper}" stroke="${palette.paperDark}" stroke-width="${size * 0.012}" transform="rotate(-2 ${size / 2} ${size / 2})"/>
    <line x1="${paperX + size * 0.06}" y1="${paperY + size * 0.16}" x2="${paperX + paperW - size * 0.06}" y2="${paperY + size * 0.16}" stroke="${palette.blue}" stroke-width="${size * 0.018}"/>
    <line x1="${paperX + size * 0.06}" y1="${paperY + size * 0.25}" x2="${paperX + paperW - size * 0.11}" y2="${paperY + size * 0.25}" stroke="${palette.paperDark}" stroke-width="${size * 0.012}"/>
    <line x1="${paperX + size * 0.06}" y1="${paperY + size * 0.34}" x2="${paperX + paperW - size * 0.16}" y2="${paperY + size * 0.34}" stroke="${palette.paperDark}" stroke-width="${size * 0.012}"/>
    <circle cx="${paperX + paperW - size * 0.08}" cy="${paperY + paperH - size * 0.075}" r="${size * 0.065}" fill="none" stroke="${palette.red}" stroke-width="${size * 0.014}"/>
    <text x="${paperX + paperW - size * 0.08}" y="${paperY + paperH - size * 0.053}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size * 0.058}" font-weight="700" fill="${palette.red}">13</text>
  </svg>`
}

for (const size of [192, 512]) {
  await sharp(Buffer.from(iconSvg(size)))
    .png()
    .toFile(fileURLToPath(new URL(`./icon-${size}.png`, iconsDir)))
}
await sharp(Buffer.from(iconSvg(512, true)))
  .png()
  .toFile(fileURLToPath(new URL('./icon-maskable-512.png', iconsDir)))

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#26385d"/><stop offset="0.58" stop-color="#8f626d"/><stop offset="0.82" stop-color="#d59470"/><stop offset="0.83" stop-color="#253148"/><stop offset="1" stop-color="#10182d"/></linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity="0.35"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#sky)"/>
  <circle cx="1010" cy="112" r="58" fill="#f4d99b" opacity="0.96"/>
  <circle cx="986" cy="94" r="58" fill="#30415f"/>
  <path d="M0 432 L75 388 L150 419 L238 362 L326 424 L430 381 L552 431 L655 390 L742 436 L842 374 L955 421 L1060 382 L1200 428 V630 H0Z" fill="#18233a"/>
  <path d="M0 500 L60 500 L60 448 L111 418 L162 451 L162 515 L232 515 L232 458 L292 431 L355 464 L355 506 L438 506 L438 443 L492 415 L545 446 L545 522 L642 522 L642 466 L707 438 L774 470 L774 514 L860 514 L860 449 L925 427 L991 455 L991 510 L1070 510 L1070 458 L1130 432 L1200 463 V630 H0Z" fill="#0c1426"/>
  <g fill="#f2c675"><rect x="86" y="474" width="15" height="12"/><rect x="276" y="474" width="17" height="13"/><rect x="481" y="463" width="16" height="12"/><rect x="687" y="479" width="15" height="12"/><rect x="907" y="468" width="17" height="13"/><rect x="1118" y="477" width="16" height="12"/></g>
  <g transform="translate(95 76) rotate(-1 405 220)" filter="url(#shadow)">
    <rect width="810" height="440" fill="${palette.paper}" stroke="#b7a276" stroke-width="3"/>
    <rect x="19" y="19" width="772" height="402" fill="none" stroke="#a89878" stroke-width="1"/>
    <text x="68" y="87" font-family="Yu Gothic,Hiragino Kaku Gothic ProN,sans-serif" font-size="20" letter-spacing="8" fill="${palette.blue}">終点・月影町</text>
    <text x="64" y="203" font-family="Yu Mincho,Hiragino Mincho ProN,serif" font-size="82" font-weight="600" letter-spacing="12" fill="${palette.ink}">月影町</text>
    <text x="68" y="263" font-family="Yu Mincho,Hiragino Mincho ProN,serif" font-size="32" letter-spacing="8" fill="${palette.blue}">十三番目の回覧板</text>
    <line x1="68" y1="300" x2="708" y2="300" stroke="#b9a887" stroke-width="2"/>
    <text x="68" y="348" font-family="Yu Gothic,Hiragino Kaku Gothic ProN,sans-serif" font-size="22" letter-spacing="2" fill="#5f574a">消された名前を、町へ返す七日間。</text>
    <circle cx="716" cy="356" r="41" fill="none" stroke="${palette.red}" stroke-width="4" opacity="0.8"/>
    <text x="716" y="366" text-anchor="middle" font-family="Arial,sans-serif" font-size="29" font-weight="700" fill="${palette.red}">13</text>
  </g>
</svg>`

await sharp(Buffer.from(ogSvg))
  .png()
  .toFile(fileURLToPath(new URL('./og.png', publicDir)))
console.log('Generated PWA icons and social card.')
