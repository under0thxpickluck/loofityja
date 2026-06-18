import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const games = JSON.parse(fs.readFileSync(path.join(root, 'data/games.json'), 'utf8'))

// Games that already have PNG thumbnails
const existingImages = {
  1:  '/images/ゲームサムネイル/ファイナルファンタジー.png',
  2:  '/images/ゲームサムネイル/ドラゴンクエストX.png',
  3:  '/images/ゲームサムネイル/黒い砂漠.png',
  4:  '/images/ゲームサムネイル/world of warcraft.png',
  5:  '/images/ゲームサムネイル/もんすたーストライク.png',
  6:  '/images/ゲームサムネイル/fate_grand order.png',
  7:  '/images/ゲームサムネイル/パズルアンドドラゴンズ.png',
  8:  '/images/ゲームサムネイル/原神.png',
  9:  '/images/ゲームサムネイル/スターレイル.png',
  10: '/images/ゲームサムネイル/toram online.png',
  11: '/images/ゲームサムネイル/遊戯王 マスター デュエル.png',
  12: '/images/ゲームサムネイル/ポケモンGO.png',
}

const categoryStyle = {
  pc:     { g1: '#0b1929', g2: '#1a3a5c', accent: '#38bdf8', label: 'PC' },
  mobile: { g1: '#064e3b', g2: '#0f766e', accent: '#34d399', label: 'Mobile' },
  other:  { g1: '#3b0764', g2: '#4c1d95', accent: '#c084fc', label: 'Other' },
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function splitName(name) {
  if (name.length <= 14) return [name]
  // Try to split at a space (full-width or half-width) near the middle
  const mid = Math.ceil(name.length / 2)
  const delimiters = ['　', ' ', '：', '・', '!', '！', '/', '\\']
  let bestIdx = -1
  let bestDist = Infinity
  for (const d of delimiters) {
    let idx = -1
    while ((idx = name.indexOf(d, idx + 1)) !== -1) {
      const dist = Math.abs(idx - mid)
      if (dist < bestDist) { bestDist = dist; bestIdx = idx }
    }
  }
  if (bestIdx > 0 && bestDist < 8) {
    return [name.substring(0, bestIdx), name.substring(bestIdx + 1)]
  }
  // No natural break — force split at mid
  return [name.substring(0, mid), name.substring(mid)]
}

function makeSVG(game) {
  const c = categoryStyle[game.category] || categoryStyle.other
  const lines = splitName(game.name)
  const twoLine = lines.length === 2

  // Font size: shrink for very long lines
  const maxLen = Math.max(...lines.map(l => l.length))
  let fs2 = maxLen <= 8 ? 18 : maxLen <= 12 ? 15 : maxLen <= 16 ? 13 : 11

  const y1 = twoLine ? 78 : 92
  const y2 = twoLine ? 97 : 0

  const labelW = c.label.length * 7 + 16

  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.g1}"/>
      <stop offset="100%" stop-color="${c.g2}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="180" fill="url(#g)"/>
  <!-- decorative circles -->
  <circle cx="290" cy="20" r="55" fill="rgba(255,255,255,0.04)"/>
  <circle cx="30"  cy="160" r="70" fill="rgba(255,255,255,0.03)"/>
  <!-- left accent bar -->
  <rect x="0" y="0" width="4" height="180" fill="${c.accent}" opacity="0.8"/>
  <!-- bottom accent line -->
  <rect x="4" y="170" width="316" height="2" fill="${c.accent}" opacity="0.15"/>
  <!-- game name -->
  <text x="165" y="${y1}" text-anchor="middle" fill="white"
        font-size="${fs2}" font-family="'Segoe UI','Hiragino Sans','Meiryo',sans-serif" font-weight="700"
        paint-order="stroke" stroke="#000" stroke-width="2" stroke-linejoin="round">
    ${escapeXml(lines[0])}
  </text>
  ${twoLine ? `<text x="165" y="${y2}" text-anchor="middle" fill="white"
        font-size="${fs2}" font-family="'Segoe UI','Hiragino Sans','Meiryo',sans-serif" font-weight="700"
        paint-order="stroke" stroke="#000" stroke-width="2" stroke-linejoin="round">
    ${escapeXml(lines[1])}
  </text>` : ''}
  <!-- category badge -->
  <rect x="10" y="148" width="${labelW}" height="22" rx="5" fill="${c.accent}" opacity="0.2"/>
  <text x="${labelW / 2 + 10}" y="163" text-anchor="middle" fill="${c.accent}"
        font-size="10" font-family="'Segoe UI',sans-serif" font-weight="600">${c.label}</text>
</svg>`
}

// Generate SVGs for games that don't already have an image
const gameImageMap = { ...existingImages }
const dir = path.join(root, 'public', 'images', 'ゲームサムネイル')

for (const game of games) {
  if (gameImageMap[game.id]) continue
  const svg = makeSVG(game)
  const file = path.join(dir, `${game.slug}.svg`)
  fs.writeFileSync(file, svg, 'utf8')
  gameImageMap[game.id] = `/images/ゲームサムネイル/${game.slug}.svg`
  console.log(`Created: ${game.slug}.svg  (${game.name})`)
}

// Update listings.json — fix any placeholder or missing image
const listingsPath = path.join(root, 'data', 'listings.json')
const listings = JSON.parse(fs.readFileSync(listingsPath, 'utf8'))
let updated = 0

for (const l of listings) {
  const correct = gameImageMap[l.gameId]
  if (correct && (!l.imageUrl || l.imageUrl === '/images/placeholder.svg')) {
    l.imageUrl = correct
    updated++
  }
}

fs.writeFileSync(listingsPath, JSON.stringify(listings, null, 2) + '\n', 'utf8')
console.log(`\nUpdated ${updated} listings in listings.json`)
console.log('Done.')
