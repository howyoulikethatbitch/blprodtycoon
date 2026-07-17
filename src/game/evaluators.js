/**
 * evaluators.js — End-of-production evaluation & feedback
 * Generates narrative critique text and awards based on score.
 */

// ─── Score → grade ────────────────────────────────────────────────────────────
export function scoreGrade(score) {
  if (score >= 95) return { grade: 'S+', label: 'LEGENDARY',   color: '#FFD700' }
  if (score >= 85) return { grade: 'S',  label: 'MASTERPIECE', color: '#FFD700' }
  if (score >= 75) return { grade: 'A',  label: 'EXCELLENT',   color: '#5CE1A0' }
  if (score >= 60) return { grade: 'B',  label: 'GOOD',        color: '#6BC5FF' }
  if (score >= 45) return { grade: 'C',  label: 'AVERAGE',     color: '#9B86C4' }
  if (score >= 30) return { grade: 'D',  label: 'POOR',        color: '#FF5470' }
  return                  { grade: 'F',  label: 'DISASTER',    color: '#FF5470' }
}

// ─── Reputation impact ────────────────────────────────────────────────────────
export function reputationDelta(score, currentRep) {
  // High scores give more rep at low rep (easier to grow), diminishing at high
  const base = (score - 50) / 10    // -5 to +5
  const growthFactor = score > 60
    ? Math.max(0.2, 1 - currentRep / 120)
    : 1
  return Math.round(base * growthFactor)
}

// ─── Popularity impact ────────────────────────────────────────────────────────
export function popularityDelta(score, budget, type) {
  const budgetPop = { shoestring: 0.3, modest: 0.5, standard: 1, premium: 2, blockbuster: 3.5 }
  const typePop   = { drama: 1.2, movie: 1.5, variety: 0.8, concert: 1.3, cf: 0.6, web: 0.9 }
  const mult = (budgetPop[budget] ?? 1) * (typePop[type] ?? 1)
  return Math.round((score / 100) * 500 * mult)
}

// ─── Narrative critic lines ────────────────────────────────────────────────────
const CRITIC_LINES = {
  'S+': [
    '「Transcendent. A new benchmark for the genre.」',
    '「Once in a decade — this is THAT work.」',
    '「History will mark this as before and after.」',
  ],
  'S': [
    '「A flawless production. Every frame breathes with intention.」',
    '「The chemistry between leads is palpable. Instant classic.」',
    '「Studio delivers a masterpiece. Award circuit guaranteed.」',
  ],
  'A': [
    '「Sharp, confident, and deeply moving in places.」',
    '「Not without rough edges, but the highs soar.」',
    '「Audiences will talk about this for weeks.」',
  ],
  'B': [
    '「Solid, competent work. Fans will be satisfied.」',
    '「Dependable entertainment, if unremarkable.」',
    '「A crowd-pleaser that delivers on its promises.」',
  ],
  'C': [
    '「Mediocre pacing drags an otherwise decent concept.」',
    '「The talent is there; the execution stumbles.」',
    '「Watchable, but forgettable by next week.」',
  ],
  'D': [
    '「An unfortunate misfire. Better luck next season.」',
    '「Troubled production shows in every scene.」',
    '「Even devoted fans may struggle to finish this one.」',
  ],
  'F': [
    '「A catastrophe. Questions are being asked at the top.」',
    '「Viewers walked out. Critics are sharpening pens.」',
    '「The internet has not been kind. To say the least.」',
  ],
}

export function criticQuote(grade) {
  const lines = CRITIC_LINES[grade] ?? CRITIC_LINES['C']
  return lines[Math.floor(Math.random() * lines.length)]
}

// ─── Actor XP awards ─────────────────────────────────────────────────────────
export function castXpAward(score, weeksTotal) {
  // Base XP from score + time invested
  return Math.round((score / 100) * 40 + weeksTotal * 3)
}

// ─── Full evaluation summary ──────────────────────────────────────────────────
/**
 * Produce a complete evaluation report for a finished production.
 */
export function evaluateProduction({ production, score, revenue, reputation }) {
  const { grade, label, color } = scoreGrade(score)
  return {
    grade,
    label,
    color,
    score,
    revenue,
    criticQuote:    criticQuote(grade),
    repDelta:       reputationDelta(score, reputation),
    popDelta:       popularityDelta(score, production.budget, production.type),
    xpPerActor:     castXpAward(score, production.weeksTotal),
  }
}
