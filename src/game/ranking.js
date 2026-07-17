/**
 * ranking.js — Studio rank system
 * Rank determined by reputation + popularity milestones.
 */

export const RANKS = [
  { id: 'INDIE',      label: 'Indie Studio',    repMin: 0,   popMin: 0,      color: '#9B86C4' },
  { id: 'RISING',     label: 'Rising Star',      repMin: 20,  popMin: 5000,   color: '#6BC5FF' },
  { id: 'REGIONAL',   label: 'Regional Name',    repMin: 35,  popMin: 20000,  color: '#5CE1A0' },
  { id: 'NATIONAL',   label: 'National Studio',  repMin: 50,  popMin: 80000,  color: '#FF6B9D' },
  { id: 'PREMIER',    label: 'Premier House',    repMin: 65,  popMin: 250000, color: '#FF6B9D' },
  { id: 'LEGENDARY',  label: 'Legendary Studio', repMin: 80,  popMin: 750000, color: '#FFD700' },
]

/**
 * Calculate current rank from reputation + popularity.
 */
export function calcRank(reputation, popularity) {
  let current = RANKS[0]
  for (const r of RANKS) {
    if (reputation >= r.repMin && popularity >= r.popMin) {
      current = r
    }
  }
  return current
}

/**
 * Progress toward next rank (0–1).
 */
export function rankProgress(reputation, popularity) {
  const idx = RANKS.findIndex(r => r.id === calcRank(reputation, popularity).id)
  if (idx >= RANKS.length - 1) return 1
  const next = RANKS[idx + 1]
  const repPct = Math.min(reputation / next.repMin, 1)
  const popPct = Math.min(popularity / next.popMin, 1)
  return Math.min((repPct + popPct) / 2, 1)
}

/**
 * Format popularity number compactly.
 */
export function fmtPop(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/**
 * Format money.
 */
export function fmtMoney(n) {
  if (n < 0) return `-₩${Math.abs(n).toLocaleString()}`
  return `₩${n.toLocaleString()}`
}
