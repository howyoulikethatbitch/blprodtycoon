/**
 * evaluators.js — End-of-production evaluation & feedback
 * Prompt 5: integrates the four critics into the final evaluation.
 */
import { runAllCritics } from './critics.js'

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

// ─── Popularity impact ────────────────────────────────────────────────────────
export function popularityDelta(score, budget, type) {
  const budgetMult = typeof budget === 'number' ? budget : 1.0
  const typePop = {
    mini_series: 0.9, series: 1.2, movie: 1.5,
    // legacy
    drama: 1.2, variety: 0.8, cf: 0.6, web: 0.9, concert: 1.3,
  }
  return Math.round((score / 100) * 500 * budgetMult * (typePop[type] ?? 1))
}

// ─── Actor XP awards ─────────────────────────────────────────────────────────
export function castXpAward(score, weeksTotal) {
  return Math.round((score / 100) * 40 + (weeksTotal ?? 1) * 3)
}

// ─── Legacy critic quote (kept for backward compat / generic modal fallback) ──
const CRITIC_LINES = {
  'S+': ['「Transcendent. A new benchmark for the genre.」', '「Once in a decade — this is THAT work.」'],
  'S':  ['「A flawless production. Every frame breathes with intention.」', '「Instant classic. Award circuit guaranteed.」'],
  'A':  ['「Sharp, confident, and deeply moving in places.」', '「Audiences will talk about this for weeks.」'],
  'B':  ['「Solid, competent work. Fans will be satisfied.」', '「A crowd-pleaser that delivers on its promises.」'],
  'C':  ['「Mediocre pacing drags an otherwise decent concept.」', '「Watchable, but forgettable by next week.」'],
  'D':  ['「An unfortunate misfire. Better luck next season.」', '「Troubled production shows in every scene.」'],
  'F':  ['「A catastrophe. Questions are being asked at the top.」', '「The internet has not been kind.」'],
}

export function criticQuote(grade) {
  const lines = CRITIC_LINES[grade] ?? CRITIC_LINES['C']
  return lines[Math.floor(Math.random() * lines.length)]
}

// ─── Full evaluation summary ──────────────────────────────────────────────────
/**
 * Run all four critics and produce the complete evaluation report.
 * @param {object} args
 * @param {object} args.production
 * @param {number} args.score        — base score from calcScore (0-100)
 * @param {number} args.revenue
 * @param {number} args.reputation
 * @param {Array}  args.castActors   — actor objects
 * @param {number} args.chemValue    — lead pair chemistry 0-100
 */
export function evaluateProduction({ production, score, revenue, reputation, castActors = [], chemValue = 0, tier }) {
  // Run the four critics — they derive their stars from baseScore
  // Prompt 8: pass tier for rep cap & distribution bonus
  const critiqueResult = runAllCritics(production, castActors, chemValue, score, tier)

  // The critic average is the authoritative final score
  const finalScore = critiqueResult.finalScore
  const { grade, label, color } = scoreGrade(finalScore)

  return {
    grade,
    label,
    color,
    score:         finalScore,      // override with critic-averaged score
    baseScore:     score,           // original skill-based score for reference
    revenue,
    criticQuote:   criticQuote(grade),

    // Critic-derived deltas
    repDelta:      critiqueResult.repDelta,
    popDelta:      popularityDelta(finalScore, production.budget, production.type),
    xpPerActor:    castXpAward(finalScore, production.weeksTotal),

    // Four critics detail
    critics:       critiqueResult.critics,
    avgStars:      critiqueResult.avgStars,
    awarded:       critiqueResult.awarded,
    controversy:   critiqueResult.controversy,
    fanReviews:    critiqueResult.fanReviews,
    socialPosts:   critiqueResult.socialPosts,
  }
}
