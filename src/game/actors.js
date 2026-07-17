/**
 * actors.js — Actor data, stat helpers, availability logic
 * Source of truth: index.html ACTOR_DATA array (21 actors)
 * Populated incrementally across prompts; full data in Prompt 2.
 */

// ─── Actor archetypes / stat keys ─────────────────────────────────────────────
export const STAT_KEYS = ['act', 'sing', 'dance', 'charm', 'stamina']

export const STAT_LABELS = {
  act:     'ACT',
  sing:    'SING',
  dance:   'DANCE',
  charm:   'CHARM',
  stamina: 'STA',
}

// ─── Actor data (placeholder — full data injected in Prompt 2) ────────────────
export const ACTOR_DATA = []

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a fresh actor object merged with runtime fields.
 */
export function initActor(data) {
  return {
    ...data,
    exp: data.exp ?? 0,
    level: data.level ?? 1,
    fatigue: data.fatigue ?? 0,
    mood: data.mood ?? 80,
    available: true,
    assignedTo: null,   // production id or null
    bond: data.bond ?? {},
  }
}

/**
 * Effective stat = base * level modifier * fatigue penalty * mood modifier
 */
export function effectiveStat(actor, statKey) {
  const base = actor.stats?.[statKey] ?? 0
  const levelBonus = 1 + (actor.level - 1) * 0.05
  const fatiguePenalty = 1 - Math.min(actor.fatigue, 100) / 200  // max -50%
  const moodMod = 0.7 + (Math.min(actor.mood, 100) / 100) * 0.6  // 0.7–1.3
  return Math.round(base * levelBonus * fatiguePenalty * moodMod)
}

/**
 * XP required to reach next level (quadratic curve).
 */
export function xpToNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.4))
}

/**
 * Apply weekly fatigue recovery (called during week advance).
 * Returns patch object for the actor.
 */
export function weeklyActorRecovery(actor) {
  const recovery = actor.assignedTo ? 0 : 8
  const moodDelta = actor.assignedTo ? -3 : 5
  return {
    fatigue: Math.max(0, actor.fatigue - recovery),
    mood:    Math.max(0, Math.min(100, actor.mood + moodDelta)),
  }
}

/**
 * Grant XP to actor and level up if threshold met.
 * Returns patch object.
 */
export function grantExp(actor, amount) {
  let exp = actor.exp + amount
  let level = actor.level
  while (exp >= xpToNextLevel(level)) {
    exp -= xpToNextLevel(level)
    level += 1
  }
  return { exp, level }
}

/**
 * Check whether an actor can be assigned to a production.
 */
export function canAssign(actor) {
  return actor.available && !actor.assignedTo && actor.fatigue < 90
}

/**
 * Portrait image URL helper.
 * Falls back gracefully if image not found.
 */
export function portraitUrl(actorId, base = '') {
  const padded = String(actorId).padStart(2, '0')
  return `${base}images/actor_${padded}.png`
}
