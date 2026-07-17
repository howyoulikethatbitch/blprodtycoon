/**
 * productions.js — Production types, cost formulas, progress logic
 * All formulas preserved from source index.html.
 */

// ─── Production types ─────────────────────────────────────────────────────────
export const PROD_TYPES = {
  drama:  { label: 'Drama Series',   icon: '🎭', weeksMin: 4,  weeksMax: 12, baseCost: 8000  },
  movie:  { label: 'Feature Film',   icon: '🎬', weeksMin: 8,  weeksMax: 20, baseCost: 20000 },
  variety:{ label: 'Variety Show',   icon: '🎪', weeksMin: 2,  weeksMax: 6,  baseCost: 4000  },
  concert:{ label: 'Concert Tour',   icon: '🎤', weeksMin: 3,  weeksMax: 8,  baseCost: 10000 },
  cf:     { label: 'CF / Ad',        icon: '📺', weeksMin: 1,  weeksMax: 3,  baseCost: 3000  },
  web:    { label: 'Web Drama',      icon: '📱', weeksMin: 2,  weeksMax: 6,  baseCost: 5000  },
}

// ─── Budget tiers ─────────────────────────────────────────────────────────────
export const BUDGET_TIERS = [
  { id: 'shoestring', label: 'Shoestring',  mult: 0.5  },
  { id: 'modest',     label: 'Modest',      mult: 1.0  },
  { id: 'standard',   label: 'Standard',    mult: 1.5  },
  { id: 'premium',    label: 'Premium',     mult: 2.5  },
  { id: 'blockbuster',label: 'Blockbuster', mult: 4.0  },
]

// ─── Genre tags ───────────────────────────────────────────────────────────────
export const GENRES = [
  'Romance', 'Action', 'Comedy', 'Thriller', 'Fantasy',
  'Slice of Life', 'Historical', 'Sci-Fi', 'Horror', 'Musical',
]

// ─── Cost formula ─────────────────────────────────────────────────────────────
/**
 * Calculate total production cost.
 * @param {string} type     - key of PROD_TYPES
 * @param {string} budget   - key of BUDGET_TIERS
 * @param {number} weeks    - planned duration
 * @param {number} castSize - number of actors
 */
export function calcCost(type, budget, weeks, castSize) {
  const t = PROD_TYPES[type]
  const b = BUDGET_TIERS.find(bt => bt.id === budget)
  if (!t || !b) return 0
  const base = t.baseCost * b.mult
  const weekCost = base * 0.08 * weeks
  const castCost = castSize * 2000 * b.mult
  return Math.round(base + weekCost + castCost)
}

// ─── Revenue formula ──────────────────────────────────────────────────────────
/**
 * Calculate production revenue after completion.
 * Incorporates score, budget multiplier, and reputation.
 */
export function calcRevenue(score, budget, type, reputation) {
  const b = BUDGET_TIERS.find(bt => bt.id === budget)
  const t = PROD_TYPES[type]
  if (!b || !t) return 0
  const baseRevenue = t.baseCost * b.mult * 3.5
  const scoreMult = Math.pow(score / 100, 1.3)           // 0–1 scaled
  const repBonus  = 1 + reputation / 200                 // up to +50%
  return Math.round(baseRevenue * scoreMult * repBonus)
}

// ─── Score formula ────────────────────────────────────────────────────────────
/**
 * Evaluate production quality score (0–100).
 * @param {object} production  - the production record
 * @param {object[]} castActors - resolved actor objects
 * @param {number} chemistryBonus - from chemistry.js
 */
export function calcScore(production, castActors, chemistryBonus = 0) {
  if (!castActors.length) return 0

  const { type, budget } = production
  const b = BUDGET_TIERS.find(bt => bt.id === budget)

  // Stat weights by type
  const weights = statWeightsByType(type)

  // Average weighted stats across cast
  let statScore = 0
  for (const actor of castActors) {
    let actorScore = 0
    for (const [stat, w] of Object.entries(weights)) {
      actorScore += (actor.stats?.[stat] ?? 0) * w
    }
    statScore += actorScore
  }
  statScore = statScore / castActors.length

  // Budget quality modifier
  const budgetMod = b ? 0.5 + b.mult * 0.15 : 1

  // Raw score
  let score = statScore * budgetMod + chemistryBonus * 5
  score = Math.max(0, Math.min(100, score))
  return Math.round(score)
}

function statWeightsByType(type) {
  switch (type) {
    case 'drama':   return { act: 0.45, charm: 0.30, stamina: 0.15, sing: 0.05, dance: 0.05 }
    case 'movie':   return { act: 0.50, charm: 0.25, stamina: 0.15, sing: 0.05, dance: 0.05 }
    case 'variety': return { charm: 0.40, dance: 0.25, sing: 0.20, act: 0.10, stamina: 0.05 }
    case 'concert': return { sing: 0.40, dance: 0.35, charm: 0.15, stamina: 0.10, act: 0.00 }
    case 'cf':      return { charm: 0.55, act: 0.20, dance: 0.15, sing: 0.05, stamina: 0.05 }
    case 'web':     return { act: 0.40, charm: 0.35, sing: 0.10, dance: 0.10, stamina: 0.05 }
    default:        return { act: 0.30, charm: 0.30, sing: 0.15, dance: 0.15, stamina: 0.10 }
  }
}

// ─── Production state machine ─────────────────────────────────────────────────
export const PROD_STATUS = {
  ACTIVE:    'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

/**
 * Create a new production record.
 */
export function createProduction({ type, title, genre, budget, weeks, castIds }) {
  return {
    id:        Date.now(),
    type,
    title,
    genre,
    budget,
    weeksTotal: weeks,
    weeksLeft:  weeks,
    castIds:    castIds ?? [],
    status:     PROD_STATUS.ACTIVE,
    progressPct: 0,
    score:      null,
    revenue:    null,
    weekStarted: null,
  }
}

/**
 * Advance production by one week.
 * Returns patch object.
 */
export function tickProduction(production) {
  const weeksLeft = Math.max(0, production.weeksLeft - 1)
  const progressPct = Math.round(
    ((production.weeksTotal - weeksLeft) / production.weeksTotal) * 100
  )
  return {
    weeksLeft,
    progressPct,
    status: weeksLeft === 0 ? PROD_STATUS.COMPLETED : PROD_STATUS.ACTIVE,
  }
}
