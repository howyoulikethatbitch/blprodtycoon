/**
 * productions.js — Production types, cost formulas, progress logic
 * Updated for 8-skill system (Prompt 2).
 * Reference: index.html for formulas.
 */

// ─── Production types ─────────────────────────────────────────────────────────
export const PROD_TYPES = {
  drama:  { label: 'Drama Series',  icon: '🎭', weeksMin: 4,  weeksMax: 12, baseCost: 8000  },
  movie:  { label: 'Feature Film',  icon: '🎬', weeksMin: 8,  weeksMax: 20, baseCost: 20000 },
  variety:{ label: 'Variety Show',  icon: '🎪', weeksMin: 2,  weeksMax: 6,  baseCost: 4000  },
  concert:{ label: 'Concert Tour',  icon: '🎤', weeksMin: 3,  weeksMax: 8,  baseCost: 10000 },
  cf:     { label: 'CF / Ad',       icon: '📺', weeksMin: 1,  weeksMax: 3,  baseCost: 3000  },
  web:    { label: 'Web Drama',     icon: '📱', weeksMin: 2,  weeksMax: 6,  baseCost: 5000  },
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
export function calcCost(type, budget, weeks, castSize) {
  const t = PROD_TYPES[type]
  const b = BUDGET_TIERS.find(bt => bt.id === budget)
  if (!t || !b) return 0
  const base     = t.baseCost * b.mult
  const weekCost = base * 0.08 * weeks
  const castCost = castSize * 2000 * b.mult
  return Math.round(base + weekCost + castCost)
}

// ─── Revenue formula ──────────────────────────────────────────────────────────
export function calcRevenue(score, budget, type, reputation) {
  const b = BUDGET_TIERS.find(bt => bt.id === budget)
  const t = PROD_TYPES[type]
  if (!b || !t) return 0
  const baseRevenue = t.baseCost * b.mult * 3.5
  const scoreMult   = Math.pow(score / 100, 1.3)
  const repBonus    = 1 + reputation / 200
  return Math.round(baseRevenue * scoreMult * repBonus)
}

// ─── Score formula ────────────────────────────────────────────────────────────
// Updated to use 8-skill system.
export function calcScore(production, castActors, chemistryBonus = 0) {
  if (!castActors.length) return 0

  const { type, budget } = production
  const b = BUDGET_TIERS.find(bt => bt.id === budget)
  const weights = statWeightsByType(type)

  let statScore = 0
  for (const actor of castActors) {
    let actorScore = 0
    for (const [stat, w] of Object.entries(weights)) {
      // Read from actor.skills (new) or actor.stats (old) for compat
      actorScore += (actor.skills?.[stat] ?? actor.stats?.[stat] ?? 0) * w
    }
    statScore += actorScore
  }
  statScore = statScore / castActors.length

  const budgetMod = b ? 0.5 + b.mult * 0.15 : 1
  const score     = statScore * budgetMod + chemistryBonus * 5
  return Math.round(Math.max(0, Math.min(100, score)))
}

// Stat weights by production type — updated for 8 skills
function statWeightsByType(type) {
  switch (type) {
    case 'drama':
      return { act:0.35, visual:0.20, comedy:0.15, sing:0.10, dance:0.10, lang:0.05, art:0.03, fitness:0.02 }
    case 'movie':
      return { act:0.40, visual:0.25, comedy:0.10, dance:0.10, sing:0.08, lang:0.04, art:0.02, fitness:0.01 }
    case 'variety':
      return { comedy:0.30, dance:0.25, sing:0.20, visual:0.15, act:0.05, lang:0.03, art:0.01, fitness:0.01 }
    case 'concert':
      return { sing:0.40, dance:0.35, visual:0.10, fitness:0.10, lang:0.03, comedy:0.01, art:0.01, act:0.00 }
    case 'cf':
      return { visual:0.40, act:0.25, comedy:0.15, sing:0.10, dance:0.05, lang:0.03, art:0.01, fitness:0.01 }
    case 'web':
      return { act:0.40, visual:0.30, comedy:0.15, sing:0.08, dance:0.05, lang:0.02, art:0.00, fitness:0.00 }
    default:
      return { act:0.30, visual:0.25, comedy:0.15, sing:0.12, dance:0.10, lang:0.04, art:0.02, fitness:0.02 }
  }
}

// ─── Production status ────────────────────────────────────────────────────────
export const PROD_STATUS = {
  ACTIVE:    'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

// ─── Create a new production record ──────────────────────────────────────────
export function createProduction({ type, title, genre, budget, weeks, castIds }) {
  return {
    id:          Date.now(),
    type,
    title,
    genre,
    budget,
    weeksTotal:  weeks,
    weeksLeft:   weeks,
    castIds:     castIds ?? [],
    status:      PROD_STATUS.ACTIVE,
    progressPct: 0,
    score:       null,
    revenue:     null,
    weekStarted: null,
    scandal:     false,
    fixedCP:     false,
  }
}

// ─── Advance production by one week ──────────────────────────────────────────
export function tickProduction(production) {
  const weeksLeft  = Math.max(0, production.weeksLeft - 1)
  const progressPct = Math.round(
    ((production.weeksTotal - weeksLeft) / production.weeksTotal) * 100
  )
  return {
    weeksLeft,
    progressPct,
    status: weeksLeft === 0 ? PROD_STATUS.COMPLETED : PROD_STATUS.ACTIVE,
  }
}
