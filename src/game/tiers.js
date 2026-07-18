/**
 * tiers.js — Game-week-based tier scaling system (Prompt 8)
 * Tier is determined by current game week, not company rank.
 * All balance modifiers are centralised here.
 */

export const GAME_TIERS = [
  {
    id: 'rookie',
    label: 'Rookie',
    minWeek: 0,
    maxWeek: 19,
    // CP events
    cpEventFreq: 0.50,
    declineChemPenalty: 0,
    declineRepPenalty: 0,
    // Idle penalties
    idleHappinessThreshold: 40,
    idleLoyaltyThreshold: 56,
    penaltyTickRate: 8,
    // Financial
    freePaidRatio: 0.80,      // 80% free events
    productionCostMod: 0.70,  // −30%
    revenueMod: 1.20,         // +20%
    negotiateMod: 0.50,       // −50% cost
    // Reviews
    repLossCap: -5,           // max rep loss per review
    reviewStarBonus: 0.6,     // additive bonus to avgStars for better distribution
    // CP breakup
    cpBreakupThreshold: 5,
    // Free agents
    resignCostMult: 1.0,
  },
  {
    id: 'rising',
    label: 'Rising Star',
    minWeek: 20,
    maxWeek: 49,
    cpEventFreq: 0.45,
    declineChemPenalty: -5,
    declineRepPenalty: -5,
    idleHappinessThreshold: 32,
    idleLoyaltyThreshold: 48,
    penaltyTickRate: 6,
    freePaidRatio: 0.70,
    productionCostMod: 0.85,
    revenueMod: 1.10,
    negotiateMod: 0.75,
    repLossCap: -10,
    reviewStarBonus: 0.3,
    cpBreakupThreshold: 10,
    resignCostMult: 1.25,
  },
  {
    id: 'popular',
    label: 'Popular',
    minWeek: 50,
    maxWeek: 99,
    cpEventFreq: 0.40,
    declineChemPenalty: -8,
    declineRepPenalty: -10,
    idleHappinessThreshold: 28,
    idleLoyaltyThreshold: 42,
    penaltyTickRate: 5,
    freePaidRatio: 0.60,
    productionCostMod: 1.0,
    revenueMod: 1.0,
    negotiateMod: 1.0,
    repLossCap: -15,
    reviewStarBonus: 0,
    cpBreakupThreshold: 15,
    resignCostMult: 1.50,
  },
  {
    id: 'worldwide',
    label: 'Worldwide',
    minWeek: 100,
    maxWeek: Infinity,
    cpEventFreq: 0.35,
    declineChemPenalty: -15,
    declineRepPenalty: -15,
    idleHappinessThreshold: 24,
    idleLoyaltyThreshold: 36,
    penaltyTickRate: 4,
    freePaidRatio: 0.50,
    productionCostMod: 1.10,
    revenueMod: 1.0,
    negotiateMod: 1.25,
    repLossCap: -20,
    reviewStarBonus: 0,
    cpBreakupThreshold: 20,
    resignCostMult: 2.0,
  },
]

/** Returns the tier config for the given game week (legacy — week-based). */
export function getGameTier(week) {
  return GAME_TIERS.find(t => week >= t.minWeek && week <= t.maxWeek) ?? GAME_TIERS[0]
}

/** Returns the next tier config by week (or null if at max tier). */
export function getNextGameTier(week) {
  const idx = GAME_TIERS.findIndex(t => week >= t.minWeek && week <= t.maxWeek)
  return idx >= 0 && idx < GAME_TIERS.length - 1 ? GAME_TIERS[idx + 1] : null
}

/**
 * Prompt 1: Rank-based tier lookup.
 * Tier progression difficulty now mirrors industry ranking milestones:
 *   Rookie     → rank 40–50  (rank > 39)
 *   Rising Star→ rank 25–39  (rank ≤ 39)
 *   Popular    → rank 10–24  (rank ≤ 24)
 *   Worldwide  → rank 1–9    (rank ≤  9)
 * Matches TIER_UNLOCK_RANK in actors.js exactly.
 */
export function getGameTierByRank(numericRank) {
  if (numericRank <= 9)  return GAME_TIERS[3]  // Worldwide
  if (numericRank <= 24) return GAME_TIERS[2]  // Popular
  if (numericRank <= 39) return GAME_TIERS[1]  // Rising Star
  return GAME_TIERS[0]                          // Rookie
}

/** Returns the next tier config by rank, or null at Worldwide. */
export function getNextGameTierByRank(numericRank) {
  const current = getGameTierByRank(numericRank)
  const idx     = GAME_TIERS.findIndex(t => t.id === current.id)
  return idx >= 0 && idx < GAME_TIERS.length - 1 ? GAME_TIERS[idx + 1] : null
}

/** Numeric rank threshold at which the next tier unlocks (for TopBar display). */
export function getNextTierRankThreshold(numericRank) {
  const thresholds = [39, 24, 9]  // Rookie→Rising, Rising→Popular, Popular→Worldwide
  if (numericRank <= 9)  return null  // already at max
  if (numericRank <= 24) return 9
  if (numericRank <= 39) return 24
  return 39
}
