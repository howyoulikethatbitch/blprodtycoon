/**
 * chemistry.js — Pair chemistry / bond system
 * Actors develop bonds through shared productions.
 * High chemistry boosts production score.
 */

// ─── Chemistry tiers ──────────────────────────────────────────────────────────
export const CHEM_TIERS = [
  { min: 0,   label: 'Strangers',  color: '#6E6390', emoji: '❓' },
  { min: 10,  label: 'Colleagues', color: '#9B86C4', emoji: '🤝' },
  { min: 30,  label: 'Friends',    color: '#6BC5FF', emoji: '😊' },
  { min: 60,  label: 'Close',      color: '#5CE1A0', emoji: '💚' },
  { min: 80,  label: 'BL Pair!',   color: '#FF6B9D', emoji: '💕' },
  { min: 95,  label: 'Legendary',  color: '#FFD700', emoji: '💖' },
]

/**
 * Get chemistry tier info for a bond value.
 */
export function chemTier(bondVal) {
  let tier = CHEM_TIERS[0]
  for (const t of CHEM_TIERS) {
    if (bondVal >= t.min) tier = t
  }
  return tier
}

/**
 * Bond key for a pair (order-independent).
 */
export function bondKey(idA, idB) {
  const [lo, hi] = [idA, idB].sort((a, b) => a - b)
  return `${lo}_${hi}`
}

/**
 * Get bond value between two actors from the actor's bond map.
 */
export function getBond(actorA, actorId) {
  return actorA.bond?.[actorId] ?? 0
}

/**
 * Calculate chemistry bonus for a cast array.
 * Returns a bonus value (0–10) used in score calculation.
 */
export function calcChemistryBonus(actors) {
  if (actors.length < 2) return 0
  let total = 0
  let pairs = 0
  for (let i = 0; i < actors.length; i++) {
    for (let j = i + 1; j < actors.length; j++) {
      const bond = getBond(actors[i], actors[j].id)
      total += bond
      pairs++
    }
  }
  if (pairs === 0) return 0
  const avgBond = total / pairs
  return Math.round((avgBond / 100) * 10)  // 0–10 bonus
}

/**
 * Apply bond growth after a shared production.
 * Returns a map of actorId → bond delta for all pairs in cast.
 */
export function calcBondGrowth(castActors, score) {
  const deltas = {}   // actorId → { otherActorId → delta }
  const growthBase = 3 + Math.round(score / 20)  // 3–8 per production

  for (let i = 0; i < castActors.length; i++) {
    for (let j = i + 1; j < castActors.length; j++) {
      const a = castActors[i]
      const b = castActors[j]
      const delta = growthBase + Math.floor(Math.random() * 3)

      deltas[a.id] = deltas[a.id] ?? {}
      deltas[b.id] = deltas[b.id] ?? {}
      deltas[a.id][b.id] = (deltas[a.id][b.id] ?? 0) + delta
      deltas[b.id][a.id] = (deltas[b.id][a.id] ?? 0) + delta
    }
  }
  return deltas
}

/**
 * Apply bond deltas to an actor's bond map.
 * Returns updated bond object (capped at 100).
 */
export function applyBondDeltas(actor, deltas) {
  if (!deltas[actor.id]) return actor.bond ?? {}
  const bond = { ...(actor.bond ?? {}) }
  for (const [otherId, delta] of Object.entries(deltas[actor.id])) {
    bond[otherId] = Math.min(100, (bond[otherId] ?? 0) + delta)
  }
  return bond
}
