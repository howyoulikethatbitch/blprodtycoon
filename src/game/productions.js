/**
 * productions.js — Production types, cost formulas, progress logic
 * Prompt 4: new type/schedule/platform/rating schema, combo system, title pool, CP name.
 */

// ─── Production types ─────────────────────────────────────────────────────────
export const PROD_TYPES = {
  mini_series: { label: 'Mini Series', icon: '📺', episodes: 8,  baseCost: 5000  },
  series:      { label: 'Series',      icon: '🎭', episodes: 12, baseCost: 9000  },
  movie:       { label: 'Movie',       icon: '🎬', episodes: 1,  baseCost: 18000 },
}

// ─── Schedules (production duration & quality multiplier) ─────────────────────
export const SCHEDULES = [
  { id: '3m',  label: '3 Months',  weeks: 12, qMult: 0.8 },
  { id: '6m',  label: '6 Months',  weeks: 24, qMult: 1.0 },
  { id: '12m', label: '12 Months', weeks: 48, qMult: 1.3 },
]

// ─── Platforms ────────────────────────────────────────────────────────────────
export const PLATFORMS = [
  { id: 'tv',        label: 'TV',        icon: '📡', reachMult: 1.3, revMult: 0.8, blocksR: true  },
  { id: 'streaming', label: 'Streaming', icon: '📱', reachMult: 0.8, revMult: 1.3, blocksR: false },
]

// ─── Ratings ─────────────────────────────────────────────────────────────────
export const RATINGS = [
  { id: 'pg',   label: 'PG',    popMult: 1.1 },
  { id: 'pg13', label: 'PG-13', popMult: 1.0 },
  { id: 'r',    label: 'R',     popMult: 0.8 },   // TV blocks R
]

// ─── Genres ───────────────────────────────────────────────────────────────────
export const GENRES = [
  'Romance', 'Comedy', 'Slice of Life', 'School', 'Office',
  'Action', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Thriller', 'Historical', 'Sci-Fi', 'Sports', 'Crime',
  'Music', 'Idol', 'Psychological', 'Omegaverse',
]

export const GENRE_EMOJI = {
  Romance:       '💕',
  Comedy:        '😂',
  'Slice of Life':'🌸',
  School:        '📚',
  Office:        '💼',
  Action:        '⚔️',
  Drama:         '🎭',
  Fantasy:       '🧙',
  Horror:        '👻',
  Mystery:       '🔍',
  Thriller:      '😱',
  Historical:    '🏯',
  'Sci-Fi':      '🚀',
  Sports:        '⚽',
  Crime:         '🔫',
  Music:         '🎵',
  Idol:          '🌟',
  Psychological: '🧠',
  Omegaverse:    '🐺',
}

// ─── Story origin ─────────────────────────────────────────────────────────────
export const STORY_TYPES = [
  { id: 'original',    label: 'Original',    scoreMod: +3 },
  { id: 'adaptation',  label: 'Adaptation',  scoreMod: +5 },   // known IP bonus
]

// ─── Title suggestion pool ────────────────────────────────────────────────────
export const TITLE_POOL = [
  'Love on Set', 'Two Hearts One Script', 'Beyond the Curtain',
  'Our Secret Stage', 'The Leading Man', 'Autumn Leads',
  'Spotlight Romance', 'Behind the Scenes', 'Chemistry',
  'The Perfect Take', 'Falling for the Lead', 'Studio Crush',
  'Off-Script', 'The Last Episode', 'Summer Wrap',
  'Breaking the Fourth Wall', 'Candid Camera Heart', 'Under the Lights',
  'Scene Partners', 'Overtime Together', 'Final Cut',
  'The Method Actor', 'Love in the Edit', 'Golden Hour',
]

// ─── CP (couple) name generator ───────────────────────────────────────────────
export function genCpName(name1, name2) {
  if (!name1 || !name2) return ''
  const a = (name1.trim().split(' ')[0])   // take first name
  const b = (name2.trim().split(' ')[0])
  const half1 = a.slice(0, Math.ceil(a.length / 2))
  const half2 = b.slice(Math.floor(b.length / 2))
  return half1 + half2
}

// ─── Genre × Type combo system ────────────────────────────────────────────────
// Existing 5 genres unchanged. New genres follow same tier: 1.5=PERFECT, 1.0=GOOD, 0.6=BAD FIT
const COMBO_TABLE = {
  mini_series: {
    // ── Original 5 (unchanged) ──
    Romance: 1.5, Comedy: 1.5, School: 1.5, 'Slice of Life': 1.0, Office: 0.6,
    // ── New genres ──
    Action:        1.0,  // action works in any format
    Drama:         1.0,
    Fantasy:       1.0,
    Horror:        1.5,  // horror miniseries hit hard
    Mystery:       1.5,  // tight mystery perfect for short run
    Thriller:      1.0,
    Historical:    0.6,  // historical needs long runtime & budget
    'Sci-Fi':      1.0,
    Sports:        1.5,  // underdog sport arcs suit mini
    Crime:         1.5,  // crime anthologies thrive as mini
    Music:         1.5,  // music biopics & idol arcs suit mini
    Idol:          1.5,  // idol stories shine in compact format
    Psychological: 1.5,  // slow-burn tension perfect for mini
    Omegaverse:    1.5,  // fan-favorite; best in tight format
  },
  series: {
    // ── Original 5 (unchanged) ──
    Romance: 1.5, Office: 1.5, Comedy: 1.0, 'Slice of Life': 1.0, School: 0.6,
    // ── New genres ──
    Action:        1.5,  // action series are prestige TV
    Drama:         1.5,  // dramas shine in long format
    Fantasy:       1.5,  // world-building needs full series
    Horror:        1.0,
    Mystery:       1.5,  // season-long mysteries are gripping
    Thriller:      1.5,  // slow-burn thriller = binge gold
    Historical:    1.5,  // historical epics need long runtime
    'Sci-Fi':      1.5,  // sci-fi lore needs room to breathe
    Sports:        1.0,
    Crime:         1.5,  // procedural crime thrives as series
    Music:         1.0,
    Idol:          1.5,  // idol journey suits a full season
    Psychological: 1.5,
    Omegaverse:    1.0,
  },
  movie: {
    // ── Original 5 (unchanged) ──
    Romance: 1.5, 'Slice of Life': 1.5, School: 1.0, Comedy: 1.0, Office: 0.6,
    // ── New genres ──
    Action:        1.5,  // action movies are box office gold
    Drama:         1.0,
    Fantasy:       1.0,
    Horror:        1.5,  // horror films are a classic format
    Mystery:       1.0,
    Thriller:      1.5,  // thriller films build great tension
    Historical:    1.0,
    'Sci-Fi':      1.5,  // sci-fi spectacle needs the big screen
    Sports:        1.0,
    Crime:         1.0,
    Music:         1.0,
    Idol:          0.6,  // idol story too short for full arc in film
    Psychological: 1.0,
    Omegaverse:    0.6,  // too niche & complex for film format
  },
}

export function getComboResult(type, genre) {
  const mult = COMBO_TABLE[type]?.[genre] ?? 1.0
  if (mult >= 1.5) return { label: 'PERFECT', mult: 1.5, emoji: '✨', color: 'var(--gold)' }
  if (mult <= 0.6) return { label: 'BAD FIT', mult: 0.6, emoji: '💔', color: 'var(--red)'  }
  return              { label: 'GOOD',     mult: 1.0, emoji: '💕', color: 'var(--green)' }
}

// ─── Legacy budget tiers (kept for backward compat) ───────────────────────────
export const BUDGET_TIERS = [
  { id: 'min',    label: 'Min',    mult: 0.5 },
  { id: 'standard', label: 'Standard', mult: 1.0 },
  { id: 'max',    label: 'Max',    mult: 2.0 },
]

// ─── Cost formula ─────────────────────────────────────────────────────────────
export function calcCost(type, budgetMult, scheduleId, castSize) {
  const t = PROD_TYPES[type]
  const s = SCHEDULES.find(sc => sc.id === scheduleId)
  if (!t || !s) return 0
  const base     = t.baseCost * budgetMult
  const weekCost = base * 0.055 * s.weeks
  const castCost = castSize * 1500 * budgetMult
  return Math.round(base + weekCost + castCost)
}

// ─── Revenue formula ──────────────────────────────────────────────────────────
export function calcRevenue(score, budgetMult, type, reputation, platform, comboMult = 1.0) {
  const t  = PROD_TYPES[type]
  const pf = PLATFORMS.find(p => p.id === platform)
  if (!t) return 0
  const baseRevenue = t.baseCost * budgetMult * 3.5
  const scoreMult   = Math.pow(score / 100, 1.3)
  const repBonus    = 1 + reputation / 200
  const platMult    = pf?.revMult ?? 1.0
  return Math.round(baseRevenue * scoreMult * repBonus * platMult * comboMult)
}

// ─── Score formula ────────────────────────────────────────────────────────────
export function calcScore(production, castActors, chemistryBonus = 0) {
  if (!castActors.length) return 0

  const { type, budget, schedule, story } = production
  const budgetMult = typeof budget === 'number' ? budget : 1.0
  const s = SCHEDULES.find(sc => sc.id === schedule)
  const qMult = s?.qMult ?? 1.0
  const weights = statWeightsByType(type)
  const storyMod = STORY_TYPES.find(st => st.id === story)?.scoreMod ?? 0

  let statScore = 0
  for (const actor of castActors) {
    let actorScore = 0
    for (const [stat, w] of Object.entries(weights)) {
      actorScore += (actor.skills?.[stat] ?? actor.stats?.[stat] ?? 0) * w
    }
    statScore += actorScore
  }
  statScore = statScore / castActors.length

  const budgetMod = 0.5 + budgetMult * 0.2
  const raw = statScore * budgetMod * qMult + chemistryBonus * 5 + storyMod
  return Math.round(Math.max(0, Math.min(100, raw)))
}

// ─── Stat weights by type ─────────────────────────────────────────────────────
function statWeightsByType(type) {
  switch (type) {
    case 'mini_series':
      return { act:0.35, visual:0.20, comedy:0.20, sing:0.10, dance:0.08, lang:0.04, art:0.02, fitness:0.01 }
    case 'series':
      return { act:0.40, visual:0.20, comedy:0.15, sing:0.10, dance:0.08, lang:0.04, art:0.02, fitness:0.01 }
    case 'movie':
      return { act:0.45, visual:0.25, comedy:0.10, dance:0.08, sing:0.07, lang:0.03, art:0.01, fitness:0.01 }
    // Legacy types (for old saves)
    case 'drama':
      return { act:0.35, visual:0.20, comedy:0.15, sing:0.10, dance:0.10, lang:0.05, art:0.03, fitness:0.02 }
    case 'variety':
      return { comedy:0.30, dance:0.25, sing:0.20, visual:0.15, act:0.05, lang:0.03, art:0.01, fitness:0.01 }
    default:
      return { act:0.30, visual:0.25, comedy:0.15, sing:0.12, dance:0.10, lang:0.04, art:0.02, fitness:0.02 }
  }
}

// ─── Popularity delta ─────────────────────────────────────────────────────────
export function popularityDeltaByPlatform(score, platform, rating) {
  const pf  = PLATFORMS.find(p => p.id === platform)
  const rat = RATINGS.find(r => r.id === rating)
  const basePop = Math.round((score / 100) * 500)
  return Math.round(basePop * (pf?.reachMult ?? 1) * (rat?.popMult ?? 1))
}

// ─── Star rating helper ───────────────────────────────────────────────────────
export function scoreToStars(score) {
  const n = Math.round((score / 100) * 5)
  return '★'.repeat(Math.max(0, n)) + '☆'.repeat(Math.max(0, 5 - n))
}

// ─── Create a new production record ──────────────────────────────────────────
export function createProduction({
  type, title, genre, budget, schedule,
  platform, rating, story, castIds, leadIds,
  cpName, weekStarted,
}) {
  const s = SCHEDULES.find(sc => sc.id === schedule) ?? SCHEDULES[1]
  const t = PROD_TYPES[type]
  return {
    id:               Date.now(),
    type,
    title,
    genre,
    budget,           // number: budgetMult (0.5–2.5)
    schedule,         // '3m' | '6m' | '12m'
    platform:         platform ?? 'tv',
    rating:           rating   ?? 'pg13',
    story:            story    ?? 'original',
    castIds:          castIds  ?? [],
    leadIds:          leadIds  ?? [],
    cpName:           cpName   ?? '',
    status:           'active',
    phase:            'filming',  // 'filming' | 'wrap' | 'releasing' | 'done'
    weeksTotal:       s.weeks,
    weeksLeft:        s.weeks,
    progressPct:      0,
    qMult:            s.qMult,
    episodesTotal:    t?.episodes ?? 1,
    episodesReleased: 0,
    episodeRatings:   [],
    viewerCount:      0,
    comboResult:      null,       // computed at wrap
    scandal:          false,
    weekStarted:      weekStarted ?? null,
  }
}

// ─── Advance production by one week ──────────────────────────────────────────
export function tickProduction(production) {
  const { phase } = production

  if (phase === 'filming') {
    const weeksLeft   = Math.max(0, production.weeksLeft - 1)
    const progressPct = Math.round(
      ((production.weeksTotal - weeksLeft) / production.weeksTotal) * 100
    )
    if (weeksLeft === 0) {
      // Move to wrap phase
      const comboResult = getComboResult(production.type, production.genre)
      return { weeksLeft: 0, progressPct: 100, phase: 'wrap', comboResult, status: 'active' }
    }
    return { weeksLeft, progressPct, phase: 'filming', status: 'active' }
  }

  if (phase === 'wrap') {
    // Wrap → releasing: one episode begins
    return { phase: 'releasing', episodesReleased: 0, status: 'active' }
  }

  if (phase === 'releasing') {
    const ep        = (production.episodesReleased ?? 0) + 1
    const rating    = rollEpisodeRating(production)
    const epRatings = [...(production.episodeRatings ?? []), rating]
    const viewers   = rollViewers(production, rating, ep)
    if (ep >= production.episodesTotal) {
      return { phase: 'done', episodesReleased: ep, episodeRatings: epRatings, viewerCount: viewers, status: 'completed' }
    }
    return { phase: 'releasing', episodesReleased: ep, episodeRatings: epRatings, viewerCount: viewers, status: 'active' }
  }

  return { status: 'completed' }
}

function rollEpisodeRating(production) {
  const comboMult = production.comboResult?.mult ?? 1.0
  const base = 4 + Math.random() * 4          // 4–8 base
  return Math.round(Math.min(10, Math.max(1, base * comboMult)))
}

function rollViewers(production, rating, ep) {
  const pf    = PLATFORMS.find(p => p.id === production.platform)
  const reach = pf?.reachMult ?? 1.0
  const momentum = 1 + (ep - 1) * 0.1        // slight growth each ep
  const base = 50000 + Math.random() * 100000
  return Math.round(base * reach * momentum * rating / 7)
}
