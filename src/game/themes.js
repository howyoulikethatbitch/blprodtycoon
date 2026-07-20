/**
 * themes.js — Theme system (29 themes, unlock progression, combo tables)
 * Prompt 1–3: data structure, genre×theme combo table, type×theme bonus
 */

// ─── All 29 themes by category ────────────────────────────────────────────────
export const THEMES = [
  // Romance (10)
  'Slow Burn', 'Forbidden Love', 'Friends-to-Lovers', 'Enemies-to-Lovers',
  'Fake Marriage/Relationship', 'Secret Romance', 'Soulmates', 'Love Triangle',
  'Unrequited Love', 'Second Chance',
  // Story Twists / Supernatural (7)
  'Time Travel', 'Reincarnation', 'Amnesia', 'Bodyswap',
  'Curse/Magic', 'Possession', 'Fate/Prophecy',
  // Character Dynamics (6)
  'Mentor-Student', 'Boss-Employee', 'Rivals', 'Found Family', 'Power Imbalance', 'Star-Crossed',
  // Tone / Vibe (6)
  'Comedy Relief', 'Angst', 'Fluffy', 'Dark', 'Bittersweet', 'Wholesome',
]

export const THEME_CATEGORIES = {
  'Romance':            ['Slow Burn', 'Forbidden Love', 'Friends-to-Lovers', 'Enemies-to-Lovers',
                         'Fake Marriage/Relationship', 'Secret Romance', 'Soulmates',
                         'Love Triangle', 'Unrequited Love', 'Second Chance'],
  'Story Twists':       ['Time Travel', 'Reincarnation', 'Amnesia', 'Bodyswap',
                         'Curse/Magic', 'Possession', 'Fate/Prophecy'],
  'Character Dynamics': ['Mentor-Student', 'Boss-Employee', 'Rivals',
                         'Found Family', 'Power Imbalance', 'Star-Crossed'],
  'Tone / Vibe':        ['Comedy Relief', 'Angst', 'Fluffy', 'Dark', 'Bittersweet', 'Wholesome'],
}

// ─── Starter themes (unlocked by default) ─────────────────────────────────────
export const DEFAULT_THEMES = [
  'Slow Burn', 'Friends-to-Lovers', 'Enemies-to-Lovers', 'Soulmates', 'Forbidden Love',
]

// ─── Grade-based unlock table ─────────────────────────────────────────────────
// Mirrors GENRE_UNLOCK_BY_GRADE in productions.js
export const THEME_UNLOCK_BY_GRADE = {
  C:    ['Second Chance', 'Love Triangle', 'Comedy Relief', 'Fluffy', 'Boss-Employee'],
  B:    ['Unrequited Love', 'Secret Romance', 'Amnesia', 'Wholesome', 'Rivals'],
  A:    ['Fake Marriage/Relationship', 'Time Travel', 'Mentor-Student', 'Angst', 'Found Family'],
  S:    ['Reincarnation', 'Bodyswap', 'Power Imbalance', 'Bittersweet', 'Curse/Magic'],
  'S+': ['Possession', 'Fate/Prophecy', 'Dark', 'Star-Crossed'],
}

// Productions-at-grade required before that grade's themes unlock
export const THEME_UNLOCK_COUNTS = {
  C:    2,
  B:    2,
  A:    3,
  S:    2,
  'S+': 1,
}

// ─── Theme emoji map ──────────────────────────────────────────────────────────
export const THEME_EMOJI = {
  'Slow Burn':                 '🔥',
  'Forbidden Love':            '🚫',
  'Friends-to-Lovers':         '🤝',
  'Enemies-to-Lovers':         '⚔️',
  'Fake Marriage/Relationship':'💍',
  'Secret Romance':            '🤫',
  'Soulmates':                 '👥',
  'Love Triangle':             '▲',
  'Unrequited Love':           '💔',
  'Second Chance':             '🔄',
  'Time Travel':               '⌛',
  'Reincarnation':             '♾️',
  'Amnesia':                   '💭',
  'Bodyswap':                  '🔀',
  'Curse/Magic':               '🪄',
  'Possession':                '👻',
  'Fate/Prophecy':             '🔮',
  'Mentor-Student':            '📖',
  'Boss-Employee':             '🏢',
  'Rivals':                    '⚡',
  'Found Family':              '💞',
  'Power Imbalance':           '⚖️',
  'Star-Crossed':              '💫',
  'Comedy Relief':             '😂',
  'Angst':                     '😰',
  'Fluffy':                    '🌸',
  'Dark':                      '🌑',
  'Bittersweet':               '🍫',
  'Wholesome':                 '🌻',
}

// ─── Genre × Theme combo table ────────────────────────────────────────────────
// Prompt 2: same scale as genre×type — 1.5 PERFECT · 1.0 GOOD · 0.6 BAD FIT
// Omitted entries default to GOOD (1.0).
const THEME_COMBO_TABLE = {
  Romance: {
    'Slow Burn': 1.5, 'Friends-to-Lovers': 1.5, 'Enemies-to-Lovers': 1.5,
    'Soulmates': 1.5, 'Second Chance': 1.5, 'Fake Marriage/Relationship': 1.5,
    'Star-Crossed': 1.5, 'Unrequited Love': 1.5,
    'Dark': 0.6, 'Possession': 0.6, 'Comedy Relief': 0.6, 'Power Imbalance': 0.6,
  },
  Comedy: {
    'Comedy Relief': 1.5, 'Fluffy': 1.5, 'Wholesome': 1.5,
    'Friends-to-Lovers': 1.5, 'Bodyswap': 1.5, 'Fake Marriage/Relationship': 1.5, 'Rivals': 1.5,
    'Dark': 0.6, 'Possession': 0.6, 'Angst': 0.6, 'Power Imbalance': 0.6,
  },
  'Slice of Life': {
    'Fluffy': 1.5, 'Wholesome': 1.5, 'Found Family': 1.5, 'Slow Burn': 1.5, 'Friends-to-Lovers': 1.5,
    'Dark': 0.6, 'Possession': 0.6, 'Fate/Prophecy': 0.6, 'Time Travel': 0.6,
  },
  School: {
    'Rivals': 1.5, 'Slow Burn': 1.5, 'Friends-to-Lovers': 1.5,
    'Unrequited Love': 1.5, 'Mentor-Student': 1.5, 'Found Family': 1.5, 'Fluffy': 1.5,
    'Possession': 0.6, 'Dark': 0.6, 'Power Imbalance': 0.6,
  },
  Office: {
    'Boss-Employee': 1.5, 'Rivals': 1.5, 'Slow Burn': 1.5,
    'Secret Romance': 1.5, 'Fake Marriage/Relationship': 1.5, 'Power Imbalance': 1.5,
    'Bodyswap': 0.6, 'Possession': 0.6, 'Fluffy': 0.6, 'Comedy Relief': 0.6,
  },
  Action: {
    'Rivals': 1.5, 'Dark': 1.5, 'Enemies-to-Lovers': 1.5,
    'Fate/Prophecy': 1.5, 'Power Imbalance': 1.5, 'Star-Crossed': 1.5, 'Curse/Magic': 1.5,
    'Fluffy': 0.6, 'Wholesome': 0.6, 'Found Family': 0.6, 'Comedy Relief': 0.6,
  },
  Drama: {
    'Angst': 1.5, 'Bittersweet': 1.5, 'Power Imbalance': 1.5,
    'Unrequited Love': 1.5, 'Star-Crossed': 1.5, 'Dark': 1.5, 'Found Family': 1.5, 'Second Chance': 1.5,
    'Comedy Relief': 0.6, 'Fluffy': 0.6, 'Bodyswap': 0.6,
  },
  Fantasy: {
    'Fate/Prophecy': 1.5, 'Curse/Magic': 1.5, 'Soulmates': 1.5,
    'Reincarnation': 1.5, 'Forbidden Love': 1.5, 'Star-Crossed': 1.5,
    'Possession': 1.5, 'Enemies-to-Lovers': 1.5,
    'Boss-Employee': 0.6, 'Comedy Relief': 0.6, 'Fluffy': 0.6, 'Wholesome': 0.6,
  },
  Horror: {
    'Dark': 1.5, 'Possession': 1.5, 'Curse/Magic': 1.5,
    'Forbidden Love': 1.5, 'Fate/Prophecy': 1.5, 'Bittersweet': 1.5, 'Star-Crossed': 1.5,
    'Fluffy': 0.6, 'Wholesome': 0.6, 'Comedy Relief': 0.6, 'Friends-to-Lovers': 0.6,
  },
  Mystery: {
    'Amnesia': 1.5, 'Dark': 1.5, 'Secret Romance': 1.5,
    'Rivals': 1.5, 'Power Imbalance': 1.5, 'Fate/Prophecy': 1.5,
    'Fluffy': 0.6, 'Wholesome': 0.6, 'Comedy Relief': 0.6, 'Bodyswap': 0.6,
  },
  Thriller: {
    'Dark': 1.5, 'Power Imbalance': 1.5, 'Secret Romance': 1.5,
    'Amnesia': 1.5, 'Rivals': 1.5, 'Fate/Prophecy': 1.5, 'Possession': 1.5,
    'Fluffy': 0.6, 'Wholesome': 0.6, 'Friends-to-Lovers': 0.6,
    'Found Family': 0.6, 'Comedy Relief': 0.6,
  },
  Historical: {
    'Forbidden Love': 1.5, 'Fate/Prophecy': 1.5, 'Star-Crossed': 1.5,
    'Soulmates': 1.5, 'Reincarnation': 1.5, 'Power Imbalance': 1.5, 'Rivals': 1.5,
    'Bodyswap': 0.6, 'Comedy Relief': 0.6, 'Fluffy': 0.6,
  },
  'Sci-Fi': {
    'Time Travel': 1.5, 'Reincarnation': 1.5, 'Amnesia': 1.5,
    'Soulmates': 1.5, 'Fate/Prophecy': 1.5, 'Dark': 1.5, 'Power Imbalance': 1.5,
    'Fluffy': 0.6, 'Wholesome': 0.6, 'Friends-to-Lovers': 0.6,
  },
  Sports: {
    'Rivals': 1.5, 'Slow Burn': 1.5, 'Enemies-to-Lovers': 1.5,
    'Mentor-Student': 1.5, 'Found Family': 1.5, 'Angst': 1.5, 'Second Chance': 1.5,
    'Time Travel': 0.6, 'Possession': 0.6, 'Dark': 0.6, 'Fluffy': 0.6,
  },
  Crime: {
    'Dark': 1.5, 'Power Imbalance': 1.5, 'Secret Romance': 1.5,
    'Rivals': 1.5, 'Forbidden Love': 1.5, 'Fate/Prophecy': 1.5, 'Amnesia': 1.5,
    'Fluffy': 0.6, 'Wholesome': 0.6, 'Friends-to-Lovers': 0.6, 'Comedy Relief': 0.6,
  },
  Music: {
    'Rivals': 1.5, 'Slow Burn': 1.5, 'Friends-to-Lovers': 1.5,
    'Found Family': 1.5, 'Angst': 1.5, 'Bittersweet': 1.5,
    'Second Chance': 1.5, 'Unrequited Love': 1.5,
    'Dark': 0.6, 'Possession': 0.6, 'Time Travel': 0.6,
  },
  Idol: {
    'Secret Romance': 1.5, 'Fake Marriage/Relationship': 1.5, 'Rivals': 1.5,
    'Slow Burn': 1.5, 'Unrequited Love': 1.5, 'Love Triangle': 1.5, 'Found Family': 1.5,
    'Dark': 0.6, 'Possession': 0.6, 'Power Imbalance': 0.6,
  },
  Psychological: {
    'Dark': 1.5, 'Amnesia': 1.5, 'Power Imbalance': 1.5,
    'Angst': 1.5, 'Possession': 1.5, 'Fate/Prophecy': 1.5, 'Bittersweet': 1.5,
    'Fluffy': 0.6, 'Wholesome': 0.6, 'Comedy Relief': 0.6, 'Friends-to-Lovers': 0.6,
  },
  Omegaverse: {
    'Power Imbalance': 1.5, 'Soulmates': 1.5, 'Forbidden Love': 1.5,
    'Fate/Prophecy': 1.5, 'Slow Burn': 1.5, 'Enemies-to-Lovers': 1.5, 'Dark': 1.5,
    'Comedy Relief': 0.6, 'Fluffy': 0.6, 'Wholesome': 0.6, 'Time Travel': 0.6,
  },
  Supernatural: {
    'Fate/Prophecy': 1.5, 'Possession': 1.5, 'Curse/Magic': 1.5,
    'Forbidden Love': 1.5, 'Soulmates': 1.5, 'Reincarnation': 1.5, 'Star-Crossed': 1.5,
    'Comedy Relief': 0.6, 'Boss-Employee': 0.6, 'Rivals': 0.6, 'Fluffy': 0.6,
  },
  'Post-Apocalyptic': {
    'Dark': 1.5, 'Fate/Prophecy': 1.5, 'Found Family': 1.5,
    'Power Imbalance': 1.5, 'Rivals': 1.5, 'Star-Crossed': 1.5, 'Soulmates': 1.5,
    'Fluffy': 0.6, 'Wholesome': 0.6, 'Comedy Relief': 0.6, 'Boss-Employee': 0.6,
  },
  'Coming-of-Age': {
    'Slow Burn': 1.5, 'Friends-to-Lovers': 1.5, 'Unrequited Love': 1.5,
    'Found Family': 1.5, 'Mentor-Student': 1.5, 'Second Chance': 1.5, 'Rivals': 1.5,
    'Dark': 0.6, 'Power Imbalance': 0.6, 'Possession': 0.6, 'Time Travel': 0.6,
  },
}

/**
 * Returns combo result for genre × theme pairing.
 * Mirrors getComboResult() from productions.js.
 */
export function getThemeComboResult(genre, theme) {
  if (!theme) return { label: 'NONE', mult: 1.0, emoji: '—', color: 'var(--gray)' }
  const mult = THEME_COMBO_TABLE[genre]?.[theme] ?? 1.0
  if (mult >= 1.5) return { label: 'PERFECT', mult: 1.5, emoji: '✨', color: 'var(--gold)'  }
  if (mult <= 0.6) return { label: 'BAD FIT', mult: 0.6, emoji: '💔', color: 'var(--red)'   }
  return              { label: 'GOOD',     mult: 1.0, emoji: '💕', color: 'var(--green)' }
}

// ─── Type × Theme secondary bonus ────────────────────────────────────────────
// Prompt 3: small additive bonuses (+0.05 or +0.10) — format efficiency boost
const TYPE_THEME_BONUS = {
  mini_series: {
    'Amnesia':       0.05, 'Fluffy':       0.05, 'Comedy Relief':  0.05,
    'Angst':         0.05, 'Bittersweet':  0.05, 'Slow Burn':      0.05,
  },
  series: {
    'Slow Burn':          0.05, 'Rivals':           0.05, 'Found Family':  0.05,
    'Reincarnation':      0.05, 'Power Imbalance':  0.05, 'Enemies-to-Lovers': 0.05,
  },
  movie: {
    'Dark':          0.05, 'Fate/Prophecy':    0.05, 'Soulmates':  0.05,
    'Curse/Magic':   0.05, 'Time Travel':      0.05, 'Star-Crossed': 0.05,
  },
}

/** Returns the additive type×theme bonus (0, 0.05, or 0.10). */
export function getTypeThemeBonus(type, theme) {
  if (!theme) return 0
  return TYPE_THEME_BONUS[type]?.[theme] ?? 0
}

// ─── Theme tier levels (for future theme-mastery display) ─────────────────────
export const THEME_TIERS = [
  { min: 0,  label: 'Untested',  color: '#6E6390', emoji: '—'  },
  { min: 10, label: 'Familiar',  color: '#9B86C4', emoji: '📝' },
  { min: 30, label: 'Practiced', color: '#6BC5FF', emoji: '✍️' },
  { min: 60, label: 'Skilled',   color: '#5CE1A0', emoji: '📚' },
  { min: 80, label: 'Signature', color: '#FF6B9D', emoji: '🎯' },
  { min: 95, label: 'Iconic',    color: '#FFD700', emoji: '🏆' },
]

export function themeTier(val) {
  let tier = THEME_TIERS[0]
  for (const t of THEME_TIERS) { if (val >= t.min) tier = t }
  return tier
}

export function themeLabel(val) {
  const t = themeTier(val)
  return { txt: t.label, color: t.color, emoji: t.emoji }
}
