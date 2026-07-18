/**
 * actors.js — Actor data, stat helpers, status logic
 * 20 actors across 4 tiers: Rookie / Rising Star / Popular / Worldwide
 * Full spec: Prompt 2
 */

// ─── Skill keys (8 skills per Prompt 2) ──────────────────────────────────────
export const SKILL_KEYS = ['act', 'sing', 'dance', 'visual', 'lang', 'comedy', 'art', 'fitness']

export const SKILL_LABELS = {
  act:     'ACT',
  sing:    'SING',
  dance:   'DANCE',
  visual:  'VIS',
  lang:    'LANG',
  comedy:  'COM',
  art:     'ART',
  fitness: 'FIT',
}

// Backward-compat aliases used by older components
export const STAT_KEYS   = SKILL_KEYS
export const STAT_LABELS = SKILL_LABELS

// ─── 29 Characteristics pool ─────────────────────────────────────────────────
export const ALL_CHARACTERISTICS = [
  'Cute','Adorable','Innocent','Sweet','Playful','Charming','Handsome','Elegant',
  'Gentleman','Mature','Sexy','Charismatic','Confident','Bold','Stylish','Cool',
  'Cold','Serious','Quiet','Calm','Chic','Cheerful','Energetic','Sunshine',
  'Friendly','Optimistic','Funny','Positive','Unique',
]

// ─── Tier configuration ───────────────────────────────────────────────────────
export const TIER_STATS = {
  'Rookie':      { skillMin: 10, skillMax: 30, signMin: 100,  signMax: 300,  trainGain: 10, unlockRank: 50 },
  'Rising Star': { skillMin: 30, skillMax: 55, signMin: 400,  signMax: 800,  trainGain: 7,  unlockRank: 39 },
  'Popular':     { skillMin: 55, skillMax: 80, signMin: 1000, signMax: 2000, trainGain: 5,  unlockRank: 24 },
  'Worldwide':   { skillMin: 80, skillMax: 95, signMin: 3000, signMax: 5000, trainGain: 3,  unlockRank: 9  },
}

export const TIER_UNLOCK_RANK = {
  'Rookie': 50, 'Rising Star': 39, 'Popular': 24, 'Worldwide': 9,
}

export const TIER_ORDER = ['Rookie', 'Rising Star', 'Popular', 'Worldwide']

// Tier display colours
export const TIER_COLOR = {
  'Rookie':      '#9B86C4',
  'Rising Star': '#6BC5FF',
  'Popular':     '#FF6B9D',
  'Worldwide':   '#FFD700',
}

// ─── Portrait fallback colours (used when image fails to load) ────────────────
export const PORTRAIT_COLORS = [
  '#FF6B9D','#6BC5FF','#FFD700','#5CE1A0','#C792EA','#FF9F68',
  '#7BE0D4','#F26D6D','#A8E063','#B28DFF','#FF85AC','#68C5FF',
  '#E8C468','#6BFFB8','#FF6BD5','#8AB4FF','#FFC46B','#6BFFD4',
  '#D58AFF','#9DFF6B',
]

// ─── 20 Actor base definitions (Prompt 2 spec) ────────────────────────────────
export const ACTOR_DATA = [
  // ── ROOKIE (actor_01-05 · skills 10-30) ─────────────────────────────────────
  {
    id: 1,  name: 'Aiden',  tier: 'Rookie',      signCost: 180,
    skills: { act:22, sing:15, dance:18, visual:25, lang:12, comedy:20, art:14, fitness:19 },
    characteristics: ['Cute','Sweet','Playful'],
  },
  {
    id: 2,  name: 'Ren',    tier: 'Rookie',      signCost: 150,
    skills: { act:18, sing:24, dance:14, visual:22, lang:16, comedy:12, art:26, fitness:15 },
    characteristics: ['Quiet','Innocent','Calm'],
  },
  {
    id: 3,  name: 'Jun',    tier: 'Rookie',      signCost: 220,
    skills: { act:25, sing:13, dance:22, visual:17, lang:19, comedy:28, art:11, fitness:24 },
    characteristics: ['Cheerful','Friendly','Optimistic'],
  },
  {
    id: 4,  name: 'Kaito',  tier: 'Rookie',      signCost: 250,
    skills: { act:16, sing:26, dance:12, visual:30, lang:14, comedy:15, art:19, fitness:13 },
    characteristics: ['Handsome','Charming','Elegant'],
  },
  {
    id: 5,  name: 'Rain',   tier: 'Rookie',      signCost: 200,
    skills: { act:20, sing:17, dance:28, visual:16, lang:23, comedy:16, art:12, fitness:29 },
    characteristics: ['Unique','Cool','Bold'],
  },

  // ── RISING STAR (actor_06-10 · skills 30-55) ─────────────────────────────────
  {
    id: 6,  name: 'Kentaro', tier: 'Rising Star', signCost: 600,
    skills: { act:52, sing:38, dance:42, visual:50, lang:33, comedy:35, art:40, fitness:46 },
    characteristics: ['Handsome','Mature','Serious'],
  },
  {
    id: 7,  name: 'Ryul',    tier: 'Rising Star', signCost: 700,
    skills: { act:48, sing:32, dance:36, visual:44, lang:53, comedy:30, art:38, fitness:40 },
    characteristics: ['Cool','Charismatic','Confident'],
  },
  {
    id: 8,  name: 'Sora',    tier: 'Rising Star', signCost: 550,
    skills: { act:38, sing:52, dance:50, visual:42, lang:35, comedy:46, art:30, fitness:48 },
    characteristics: ['Cheerful','Energetic','Sunshine'],
  },
  {
    id: 9,  name: 'Haru',    tier: 'Rising Star', signCost: 480,
    skills: { act:44, sing:36, dance:30, visual:54, lang:31, comedy:40, art:48, fitness:33 },
    characteristics: ['Adorable','Gentleman','Sweet'],
  },
  {
    id: 10, name: 'Rei',     tier: 'Rising Star', signCost: 750,
    skills: { act:50, sing:40, dance:44, visual:36, lang:47, comedy:30, art:32, fitness:42 },
    characteristics: ['Cold','Serious','Stylish'],
  },

  // ── POPULAR (actor_11-15 · skills 55-80) ─────────────────────────────────────
  {
    id: 11, name: 'Kai',   tier: 'Popular', signCost: 1500,
    skills: { act:75, sing:65, dance:72, visual:80, lang:58, comedy:62, art:55, fitness:76 },
    characteristics: ['Charming','Sexy','Confident'],
  },
  {
    id: 12, name: 'Tian',  tier: 'Popular', signCost: 1800,
    skills: { act:65, sing:78, dance:68, visual:75, lang:80, comedy:57, art:62, fitness:63 },
    characteristics: ['Elegant','Stylish','Chic'],
  },
  {
    id: 13, name: 'Shin',  tier: 'Popular', signCost: 1200,
    skills: { act:80, sing:60, dance:58, visual:68, lang:62, comedy:76, art:65, fitness:72 },
    characteristics: ['Bold','Charismatic','Energetic'],
  },
  {
    id: 14, name: 'Yuan',  tier: 'Popular', signCost: 1600,
    skills: { act:70, sing:72, dance:76, visual:78, lang:74, comedy:55, art:64, fitness:68 },
    characteristics: ['Handsome','Elegant','Mature'],
  },
  {
    id: 15, name: 'Minho', tier: 'Popular', signCost: 1400,
    skills: { act:62, sing:80, dance:66, visual:72, lang:64, comedy:78, art:58, fitness:67 },
    characteristics: ['Funny','Positive','Friendly'],
  },

  // ── WORLDWIDE (actor_16-20 · skills 80-95) ─────────────────────────────────────
  {
    id: 16, name: 'Theo',  tier: 'Worldwide', signCost: 4000,
    skills: { act:93, sing:85, dance:88, visual:95, lang:80, comedy:83, art:86, fitness:91 },
    characteristics: ['Charismatic','Sexy','Confident'],
  },
  {
    id: 17, name: 'Jay',   tier: 'Worldwide', signCost: 4500,
    skills: { act:88, sing:95, dance:94, visual:90, lang:92, comedy:82, art:80, fitness:86 },
    characteristics: ['Cool','Stylish','Unique'],
  },
  {
    id: 18, name: 'Felix', tier: 'Worldwide', signCost: 3500,
    skills: { act:90, sing:83, dance:95, visual:92, lang:88, comedy:87, art:84, fitness:94 },
    characteristics: ['Energetic','Cheerful','Sunshine'],
  },
  {
    id: 19, name: 'Eliot', tier: 'Worldwide', signCost: 4200,
    skills: { act:95, sing:87, dance:82, visual:90, lang:93, comedy:80, art:89, fitness:84 },
    characteristics: ['Mature','Serious','Calm'],
  },
  {
    id: 20, name: 'Leon',  tier: 'Worldwide', signCost: 3800,
    skills: { act:85, sing:92, dance:86, visual:95, lang:82, comedy:90, art:93, fitness:88 },
    characteristics: ['Handsome','Gentleman','Charming'],
  },
]

// ─── Initialize a single actor with runtime fields ─────────────────────────────
// Rookies start signed; all other tiers require audition (Prompt 7).
// All actors start at Happy emoji state (3.5 spec).
export function initActor(data) {
  const isSigned = data.tier === 'Rookie'
  return {
    ...data,
    signed:         isSigned,
    status:         isSigned ? 'available' : 'locked',   // available | filming | resting | injured | locked
    happiness:      rndInt(78, 90),   // start at Happy (≥75) — 3.5 spec
    loyalty:        rndInt(55, 85),   // hidden from player
    idleWeeks:      0,
    injuredWeeks:   0,
    completedProds: 0,
    awards:         0,
    fame:           0,
    retainerOwed:   data.tier === 'Worldwide' ? 150 : 0,
    chemistry_map:  {},  // filled by initChemistry() after all actors are created
    // Legacy compat
    assignedTo:     null,
    level:          1,
    exp:            0,
    // Free-agent tracking
    isNewTalent:    false,
    poolId:         null,
    idleReturnCount: 0,
  }
}

// ─── Build chemistry maps for all actors ──────────────────────────────────────
// Formula: base = random(0-30) + (shared characteristics × 20), capped 0-100
// Must be called AFTER all actors are initActor'd.
export function initChemistry(actors) {
  const result = actors.map(a => ({ ...a, chemistry_map: {} }))
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i]
      const b = result[j]
      const shared = a.characteristics.filter(c => b.characteristics.includes(c)).length
      const base   = clamp(rndInt(0, 30) + shared * 20, 0, 100)
      result[i].chemistry_map[b.id] = base
      result[j].chemistry_map[a.id] = base
    }
  }
  return result
}

// ─── Status display ───────────────────────────────────────────────────────────
export const STATUS_LABEL = {
  available: '✅ FREE',
  filming:   '🎬 FILMING',
  resting:   '😴 RESTING',
  injured:   '🤕 INJURED',
  locked:    '🔒 LOCKED',
}

export const STATUS_COLOR = {
  available: 'var(--pink)',
  filming:   'var(--blue)',
  resting:   'var(--gold)',
  injured:   'var(--red)',
  locked:    'var(--gray)',
}

// ─── Mood emoji — surface of the hidden happiness stat ────────────────────────
export function moodEmoji(happiness) {
  if (happiness >= 75) return '😊'
  if (happiness >= 50) return '😐'
  if (happiness >= 25) return '😠'
  return '😢'
}

// ─── Portrait URL helper ──────────────────────────────────────────────────────
export function portraitUrl(actorId, base = '') {
  const padded = String(actorId).padStart(2, '0')
  return `${base}images/actor_${padded}.jpg`
}

// ─── Can be assigned to a production ─────────────────────────────────────────
export function canAssign(actor) {
  return actor.signed && actor.status === 'available'
}

// ─── Weekly actor tick (called on NEXT WEEK) ──────────────────────────────────
// 3.3: Idle actors lose happiness after 24 weeks; loyalty after 36 weeks.
export function weeklyActorTick(actor) {
  const patch = {}

  if (actor.status === 'filming') {
    patch.happiness = clamp((actor.happiness ?? 70) - 2, 0, 100)
  } else if (actor.status === 'resting') {
    patch.happiness = clamp((actor.happiness ?? 70) + 5, 0, 100)
    patch.idleWeeks = 0
  } else if (actor.status === 'available') {
    const idle = (actor.idleWeeks ?? 0) + 1
    patch.idleWeeks = idle
    let h = actor.happiness ?? 70
    let l = actor.loyalty ?? 60

    // ── Idle happiness penalty (3.3) ──────────────────────────────────────
    if (idle < 24) {
      // Gentle drift to neutral before threshold
      if (idle >= 8) h = clamp(h - 1, 0, 100)
      h = clamp(h + (h > 62 ? -0.4 : 0.4), 0, 100)
    } else if (idle < 28) {
      // Week 24+: Force to Neutral (≥50 → 60 max)
      h = clamp(h, 0, 62)
      h = clamp(h - 1, 0, 100)
    } else if (idle < 32) {
      // Week 28+: Force to Sad (≥25 but <50)
      h = clamp(h, 0, 45)
      h = clamp(h - 1, 0, 100)
    } else {
      // Week 32+: Force to Angry (<25), stays angry
      h = clamp(h, 0, 22)
      h = clamp(h - 0.5, 0, 100)
    }
    patch.happiness = Math.round(h)

    // ── Idle loyalty drain (3.3) — starts at week 36+, every 4 weeks ──────
    if (idle >= 36 && (idle - 36) % 4 === 0) {
      l = clamp(l - 8, 0, 100)
      patch.loyalty = Math.round(l)
    }
  } else if (actor.status === 'injured') {
    const weeks = Math.max(0, (actor.injuredWeeks ?? 1) - 1)
    patch.injuredWeeks = weeks
    if (weeks === 0) patch.status = 'available'
  }

  return patch
}

// ─── New Talent Pool (Type B free agents) — 5 per tier ────────────────────────
// 3.4: Names are placeholders; user will edit them in future.
export const NEW_TALENT_POOL = [
  // Rookie new talents
  { poolId: 'nt_r01', tier: 'Rookie',      name: 'Cael',   signCost: 160,
    skills: { act:20, sing:18, dance:16, visual:24, lang:14, comedy:18, art:16, fitness:20 },
    characteristics: ['Cheerful','Friendly','Optimistic'] },
  { poolId: 'nt_r02', tier: 'Rookie',      name: 'Wren',   signCost: 140,
    skills: { act:17, sing:22, dance:20, visual:18, lang:18, comedy:14, art:24, fitness:16 },
    characteristics: ['Calm','Innocent','Sweet'] },
  { poolId: 'nt_r03', tier: 'Rookie',      name: 'Zane',   signCost: 200,
    skills: { act:24, sing:14, dance:26, visual:16, lang:20, comedy:26, art:12, fitness:22 },
    characteristics: ['Playful','Energetic','Unique'] },
  { poolId: 'nt_r04', tier: 'Rookie',      name: 'Iori',   signCost: 230,
    skills: { act:15, sing:28, dance:13, visual:28, lang:12, comedy:16, art:20, fitness:14 },
    characteristics: ['Handsome','Elegant','Charming'] },
  { poolId: 'nt_r05', tier: 'Rookie',      name: 'Luca',   signCost: 190,
    skills: { act:19, sing:16, dance:25, visual:15, lang:22, comedy:15, art:13, fitness:28 },
    characteristics: ['Bold','Cool','Confident'] },

  // Rising Star new talents
  { poolId: 'nt_rs01', tier: 'Rising Star', name: 'Ash',   signCost: 580,
    skills: { act:50, sing:36, dance:44, visual:48, lang:32, comedy:38, art:42, fitness:46 },
    characteristics: ['Mature','Serious','Stylish'] },
  { poolId: 'nt_rs02', tier: 'Rising Star', name: 'Daichi', signCost: 650,
    skills: { act:46, sing:34, dance:38, visual:42, lang:50, comedy:32, art:36, fitness:42 },
    characteristics: ['Charismatic','Confident','Cool'] },
  { poolId: 'nt_rs03', tier: 'Rising Star', name: 'Eli',   signCost: 530,
    skills: { act:36, sing:50, dance:48, visual:40, lang:36, comedy:44, art:32, fitness:46 },
    characteristics: ['Energetic','Sunshine','Cheerful'] },
  { poolId: 'nt_rs04', tier: 'Rising Star', name: 'Nobu',  signCost: 460,
    skills: { act:42, sing:34, dance:32, visual:52, lang:30, comedy:38, art:46, fitness:34 },
    characteristics: ['Adorable','Gentle','Sweet'] },
  { poolId: 'nt_rs05', tier: 'Rising Star', name: 'Vex',   signCost: 720,
    skills: { act:48, sing:42, dance:46, visual:34, lang:45, comedy:32, art:30, fitness:44 },
    characteristics: ['Cold','Quiet','Unique'] },

  // Popular new talents
  { poolId: 'nt_p01', tier: 'Popular',     name: 'Emrys',  signCost: 1400,
    skills: { act:73, sing:63, dance:70, visual:78, lang:56, comedy:60, art:54, fitness:74 },
    characteristics: ['Sexy','Confident','Bold'] },
  { poolId: 'nt_p02', tier: 'Popular',     name: 'Ciro',   signCost: 1700,
    skills: { act:63, sing:76, dance:66, visual:73, lang:78, comedy:55, art:60, fitness:61 },
    characteristics: ['Chic','Elegant','Stylish'] },
  { poolId: 'nt_p03', tier: 'Popular',     name: 'Drake',  signCost: 1150,
    skills: { act:78, sing:58, dance:56, visual:66, lang:60, comedy:74, art:65, fitness:70 },
    characteristics: ['Energetic','Charismatic','Cheerful'] },
  { poolId: 'nt_p04', tier: 'Popular',     name: 'Orion',  signCost: 1550,
    skills: { act:68, sing:70, dance:74, visual:76, lang:72, comedy:53, art:62, fitness:66 },
    characteristics: ['Handsome','Mature','Calm'] },
  { poolId: 'nt_p05', tier: 'Popular',     name: 'Sable',  signCost: 1350,
    skills: { act:60, sing:78, dance:64, visual:70, lang:62, comedy:76, art:56, fitness:65 },
    characteristics: ['Playful','Friendly','Positive'] },

  // Worldwide new talents
  { poolId: 'nt_w01', tier: 'Worldwide',   name: 'Corvus', signCost: 3800,
    skills: { act:91, sing:83, dance:86, visual:93, lang:78, comedy:81, art:84, fitness:89 },
    characteristics: ['Charismatic','Bold','Unique'] },
  { poolId: 'nt_w02', tier: 'Worldwide',   name: 'Mace',   signCost: 4200,
    skills: { act:86, sing:93, dance:92, visual:88, lang:90, comedy:80, art:78, fitness:84 },
    characteristics: ['Stylish','Cool','Confident'] },
  { poolId: 'nt_w03', tier: 'Worldwide',   name: 'Ren K',  signCost: 3300,
    skills: { act:88, sing:81, dance:93, visual:90, lang:86, comedy:85, art:82, fitness:92 },
    characteristics: ['Energetic','Sunshine','Optimistic'] },
  { poolId: 'nt_w04', tier: 'Worldwide',   name: 'Soleil', signCost: 4000,
    skills: { act:93, sing:85, dance:80, visual:88, lang:91, comedy:78, art:87, fitness:82 },
    characteristics: ['Elegant','Mature','Calm'] },
  { poolId: 'nt_w05', tier: 'Worldwide',   name: 'Zeph',   signCost: 3600,
    skills: { act:83, sing:90, dance:84, visual:93, lang:80, comedy:88, art:91, fitness:86 },
    characteristics: ['Charming','Handsome','Sexy'] },
]

// Alias kept for TopBar compat
export const weeklyActorRecovery = weeklyActorTick

// ─── XP / level (stub — training system in Prompt 7) ─────────────────────────
export function grantExp(actor, amount) {
  return { exp: (actor.exp ?? 0) + (amount ?? 0), level: actor.level ?? 1 }
}

export function xpToNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.4))
}

// ─── Stat accessor (now reads from actor.skills) ──────────────────────────────
export function effectiveStat(actor, key) {
  return actor.skills?.[key] ?? actor.stats?.[key] ?? 0
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function rndInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}
