/**
 * events.js — Company events, actor events, chemistry pulse
 * Prompt 6: 7 company events, 10 actor event types, weekly chemistry pulse
 */
import { A } from './state.jsx'
import { getChem, bondKey } from './chemistry.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

// ─── Company Events (7) ───────────────────────────────────────────────────────
// Each event: { id, weight, condition?, makeData(state) → { label, message, choices } | null }
const COMPANY_EVENTS = [
  {
    id: 'comp_bad_review',
    weight: 4,
    label: '📰 BAD PRESS',
    condition: s => s.history.length > 0,
    makeData: () => ({
      message:
        'A major outlet published a scathing review of your latest production. '
        + 'Your studio\'s reputation is taking heat.',
      choices: [
        { label: '🤝 Apologise publicly (−2 rep)',
          effect: (s, d) => d({ type: A.ADD_REPUTATION, amount: -2 }) },
        { label: '🙄 Ignore it (−5 rep)',
          effect: (s, d) => d({ type: A.ADD_REPUTATION, amount: -5 }) },
      ],
    }),
  },
  {
    id: 'comp_sponsorship',
    weight: 4,
    label: '💼 BRAND SPONSORSHIP',
    makeData: () => ({
      message:
        'A lifestyle brand wants to sponsor your studio. Easy money — no strings attached.',
      choices: [
        { label: '✅ Accept (+₩2,000)',
          effect: (s, d) => d({ type: A.ADD_MONEY, amount: 2000 }) },
        { label: '❌ Decline', effect: () => {} },
      ],
    }),
  },
  {
    id: 'comp_competitor_hit',
    weight: 3,
    label: '⚔️ COMPETITOR STRIKES',
    condition: s => s.reputation > 5,
    makeData: () => ({
      message:
        'A rival agency launched a smear campaign against your studio. '
        + 'Industry gossip is hurting your standing.',
      choices: [
        { label: '😤 Absorb the hit (−5 rep)',
          effect: (s, d) => d({ type: A.ADD_REPUTATION, amount: -5 }) },
        { label: '⚖️ Counter-campaign (−₩1,500, −2 rep)',
          effect: (s, d) => {
            d({ type: A.ADD_MONEY,      amount: -1500 })
            d({ type: A.ADD_REPUTATION, amount: -2 })
          } },
      ],
    }),
  },
  {
    id: 'comp_script_leak',
    weight: 3,
    label: '🔓 SCRIPT LEAK',
    condition: s => s.productions.length > 0,
    makeData: () => ({
      message:
        'Unfinished script pages from your current production leaked online. '
        + 'Fans are speculating wildly.',
      choices: [
        { label: '🔍 Investigate (−₩1,500, −1 rep)',
          effect: (s, d) => {
            d({ type: A.ADD_MONEY,      amount: -1500 })
            d({ type: A.ADD_REPUTATION, amount: -1 })
          } },
        { label: '🤷 Ignore it (−3 rep)',
          effect: (s, d) => d({ type: A.ADD_REPUTATION, amount: -3 }) },
      ],
    }),
  },
  {
    id: 'comp_intl_platform',
    weight: 3,
    label: '🌏 INTERNATIONAL OFFER',
    condition: s => s.reputation >= 20,
    makeData: () => ({
      message:
        'An international streaming platform wants to license your catalogue. '
        + 'A nice cash infusion.',
      choices: [
        { label: '✅ Accept (+₩2,500)',
          effect: (s, d) => d({ type: A.ADD_MONEY, amount: 2500 }) },
        { label: '❌ Decline', effect: () => {} },
      ],
    }),
  },
  {
    id: 'comp_worldwide_star',
    weight: 1,
    label: '🌟 WORLDWIDE STAR APPROACHES',
    condition: s =>
      s.numericRank <= 15 && s.actors.some(a => a.tier === 'Worldwide' && !a.signed),
    makeData: (s) => {
      const star = s.actors.find(a => a.tier === 'Worldwide' && !a.signed)
      if (!star) return null
      return {
        message:
          `${star.name} (Worldwide tier) has heard of your studio's prestige and is open to signing! `
          + `This rare opportunity won't last.`,
        choices: [
          { label: `✍️ Sign ${star.name} (₩${star.signCost.toLocaleString()})`,
            effect: (s2, d) => {
              if (s2.money >= star.signCost) {
                d({ type: A.SIGN_ACTOR, id: star.id, cost: star.signCost })
              } else {
                d({ type: A.PUSH_MODAL, modal: { type: 'generic', data: {
                  title: '💸 INSUFFICIENT FUNDS',
                  message: `You need ₩${star.signCost.toLocaleString()} to sign ${star.name}.`,
                } } })
              }
            } },
          { label: '❌ Pass on this opportunity', effect: () => {} },
        ],
      }
    },
  },
  {
    id: 'comp_fixed_cp',
    weight: 2,
    label: '💕 CP CONTRACT OFFER',
    condition: s => {
      const signed = s.actors.filter(a => a.signed)
      for (let i = 0; i < signed.length; i++) {
        for (let j = i + 1; j < signed.length; j++) {
          if (getChem(signed[i], signed[j].id) >= 75) return true
        }
      }
      return false
    },
    makeData: (s) => {
      const signed = s.actors.filter(a => a.signed)
      let bestPair = null, bestChem = 0
      for (let i = 0; i < signed.length; i++) {
        for (let j = i + 1; j < signed.length; j++) {
          const c = getChem(signed[i], signed[j].id)
          if (c > bestChem) { bestChem = c; bestPair = [signed[i], signed[j]] }
        }
      }
      if (!bestPair) return null
      const [a, b] = bestPair
      const alreadyFixed = (s.fixedCPs ?? []).some(
        ([x, y]) => bondKey(x, y) === bondKey(a.id, b.id)
      )
      if (alreadyFixed) return null
      return {
        message:
          `Management is pushing for a Fixed CP contract between ${a.name} and ${b.name} `
          + `(Chemistry: ${bestChem}). This locks them as the lead pair for future productions.`,
        choices: [
          { label: `💕 Form Fixed CP: ${a.name} × ${b.name}`,
            effect: (s2, d) => d({ type: A.ADD_FIXED_CP, pair: [a.id, b.id] }) },
          { label: '❌ Keep things natural', effect: () => {} },
        ],
      }
    },
  },
]

// ─── Actor Events (10 types) ──────────────────────────────────────────────────
function makeActorEvent(type, actor, state) {
  const h = actor.happiness ?? 70
  const l = actor.loyalty   ?? 60

  switch (type) {
    case 'poached':
      return {
        label: `😱 POACHING ATTEMPT — ${actor.name.toUpperCase()}`,
        message:
          `A rival agency has approached ${actor.name} with a lucrative counter-offer. `
          + `They're waiting for your response.`,
        choices: [
          { label: '💰 Match offer (−₩2,000, +loyalty)',
            effect: (s, d) => {
              d({ type: A.ADD_MONEY, amount: -2000 })
              d({ type: A.UPDATE_ACTOR, id: actor.id,
                  patch: { loyalty: clamp(l + 15, 0, 100) } })
            } },
          { label: '👋 Let them go',
            effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
              patch: { signed: false, status: 'locked', loyalty: 0 } }) },
        ],
      }

    case 'scandal':
      return {
        label: `🚨 SCANDAL — ${actor.name.toUpperCase()}`,
        message:
          `${actor.name} has been caught in a public scandal. The tabloids are going wild.`,
        choices: [
          { label: '🧹 PR cleanup (−₩3,000, +2 rep)',
            effect: (s, d) => {
              d({ type: A.ADD_MONEY,      amount: -3000 })
              d({ type: A.ADD_REPUTATION, amount: 2 })
            } },
          { label: '🙄 Ignore it (−5 rep)',
            effect: (s, d) => d({ type: A.ADD_REPUTATION, amount: -5 }) },
          { label: '🔥 Fire them',
            effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
              patch: { signed: false, status: 'locked' } }) },
        ],
      }

    case 'romance': {
      const others = state.actors.filter(a => a.signed && a.id !== actor.id)
      if (!others.length) return null
      const other = others[Math.floor(Math.random() * others.length)]
      return {
        label: '💘 OFF-SCRIPT ROMANCE',
        message:
          `${actor.name} and ${other.name} have been spotted together off-set. `
          + `Fans are shipping them hard. What's your official stance?`,
        choices: [
          { label: '✅ Confirm relationship (+chemistry)',
            effect: (s, d) => {
              const cur    = getChem(actor, other.id)
              const newMap = { ...(actor.chemistry_map ?? {}), [other.id]: clamp(cur + 20, 0, 100) }
              d({ type: A.UPDATE_ACTOR, id: actor.id, patch: { chemistry_map: newMap } })
            } },
          { label: '❌ Deny publicly (−happiness)',
            effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
              patch: { happiness: clamp(h - 15, 0, 100) } }) },
          { label: '🤷 No comment', effect: () => {} },
        ],
      }
    }

    case 'solo_ambitions':
      return {
        label: `🎤 SOLO AMBITIONS — ${actor.name.toUpperCase()}`,
        message:
          `${actor.name} wants to pursue solo projects outside the studio's productions.`,
        choices: [
          { label: '✅ Allow it (+happiness, +loyalty)',
            effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
              patch: { happiness: clamp(h + 15, 0, 100), loyalty: clamp(l + 10, 0, 100) } }) },
          { label: '❌ Studio comes first (−happiness)',
            effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
              patch: { happiness: clamp(h - 20, 0, 100) } }) },
        ],
      }

    case 'injury':
      if (actor.status !== 'filming') return null
      return {
        label: `🤕 ON-SET INJURY — ${actor.name.toUpperCase()}`,
        message:
          `${actor.name} sustained an injury during filming. They need time to recover.`,
        choices: [
          { label: '🏥 Full rest — 2-week recovery',
            effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
              patch: { status: 'injured', injuredWeeks: 2, assignedTo: null } }) },
          { label: '🎬 Push through (−happiness, risk)',
            effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
              patch: { happiness: clamp(h - 25, 0, 100) } }) },
        ],
      }

    case 'fan_meeting':
      return {
        label: `🎤 FAN MEETING — ${actor.name.toUpperCase()}`,
        message:
          `${actor.name}'s fans are requesting a fan meeting event. `
          + `It costs money to organise but boosts popularity and mood.`,
        choices: [
          { label: '✅ Organise event (−₩1,500, +pop, +happiness)',
            effect: (s, d) => {
              d({ type: A.ADD_MONEY,       amount: -1500 })
              d({ type: A.SET_POPULARITY,  value: s.popularity + 8000 })
              d({ type: A.UPDATE_ACTOR, id: actor.id,
                  patch: { happiness: clamp(h + 20, 0, 100) } })
            } },
          { label: '❌ Decline (−happiness)',
            effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
              patch: { happiness: clamp(h - 10, 0, 100) } }) },
        ],
      }

    case 'raise':
      return {
        label: `💸 RAISE DEMAND — ${actor.name.toUpperCase()}`,
        message:
          `${actor.name} is demanding a pay raise. Refuse and they might walk.`,
        choices: [
          { label: '✅ Pay up (−₩2,500, +loyalty)',
            effect: (s, d) => {
              d({ type: A.ADD_MONEY, amount: -2500 })
              d({ type: A.UPDATE_ACTOR, id: actor.id,
                  patch: { loyalty: clamp(l + 15, 0, 100) } })
            } },
          { label: '❌ Refuse (40% chance they quit)',
            effect: (s, d) => {
              if (Math.random() < 0.4) {
                d({ type: A.UPDATE_ACTOR, id: actor.id,
                    patch: { signed: false, status: 'locked' } })
                d({ type: A.PUSH_MODAL, modal: { type: 'generic', data: {
                  title: `😤 ${actor.name} HAS LEFT`,
                  message: `${actor.name} quit the studio over the pay dispute.`,
                } } })
              } else {
                d({ type: A.UPDATE_ACTOR, id: actor.id,
                    patch: {
                      loyalty:   clamp(l - 20, 0, 100),
                      happiness: clamp(h - 15, 0, 100),
                    } })
              }
            } },
        ],
      }

    case 'viral_chemistry': {
      const others = state.actors.filter(a => a.signed && a.id !== actor.id)
      if (!others.length) return null
      let partner = others[0], bestChem = getChem(actor, others[0].id)
      for (const o of others) {
        const c = getChem(actor, o.id)
        if (c > bestChem) { bestChem = c; partner = o }
      }
      const alreadyFixed = (state.fixedCPs ?? []).some(
        ([x, y]) => bondKey(x, y) === bondKey(actor.id, partner.id)
      )
      return {
        label: '🔥 VIRAL CHEMISTRY MOMENT',
        message:
          `A candid video of ${actor.name} and ${partner.name} went viral! `
          + `Fans are obsessed with their chemistry (${bestChem}).`,
        choices: [
          alreadyFixed
            ? { label: `💕 Already a Fixed CP! (+pop)`,
                effect: (s, d) => d({ type: A.SET_POPULARITY, value: s.popularity + 10000 }) }
            : { label: `💕 Form Fixed CP: ${actor.name} × ${partner.name}`,
                effect: (s, d) => {
                  d({ type: A.ADD_FIXED_CP, pair: [actor.id, partner.id] })
                  d({ type: A.SET_POPULARITY, value: s.popularity + 12000 })
                } },
          { label: '🤷 Ride the moment (+pop)',
            effect: (s, d) => d({ type: A.SET_POPULARITY, value: s.popularity + 5000 }) },
        ],
      }
    }

    case 'language_barrier':
      return {
        label: `🗣️ LANGUAGE BARRIER — ${actor.name.toUpperCase()}`,
        message:
          `${actor.name} is struggling with language requirements for an international production. `
          + `This could affect quality.`,
        choices: [
          { label: '📚 Hire tutor (−₩1,000, +LANG skill)',
            effect: (s, d) => {
              d({ type: A.ADD_MONEY, amount: -1000 })
              d({ type: A.UPDATE_ACTOR, id: actor.id,
                  patch: { skills: {
                    ...(actor.skills ?? {}),
                    lang: clamp((actor.skills?.lang ?? 30) + 5, 0, 100),
                  } } })
            } },
          { label: '🎲 Risk it (−happiness)',
            effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
              patch: { happiness: clamp(h - 10, 0, 100) } }) },
        ],
      }

    case 'singing_debut':
      return {
        label: `🎵 SINGING DEBUT — ${actor.name.toUpperCase()}`,
        message:
          `${actor.name} wants to release a solo single! `
          + `Producing it costs money but could boost their fame significantly.`,
        choices: [
          { label: '🎤 Produce the single (−₩2,000, +pop, +happiness)',
            effect: (s, d) => {
              d({ type: A.ADD_MONEY,      amount: -2000 })
              d({ type: A.SET_POPULARITY, value: s.popularity + 10000 })
              d({ type: A.UPDATE_ACTOR, id: actor.id,
                  patch: { happiness: clamp(h + 20, 0, 100) } })
            } },
          { label: '❌ Decline (−happiness)',
            effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
              patch: { happiness: clamp(h - 15, 0, 100) } }) },
        ],
      }

    default:
      return null
  }
}

const ACTOR_EVENT_TYPES = [
  'poached', 'scandal', 'romance', 'solo_ambitions', 'injury',
  'fan_meeting', 'raise', 'viral_chemistry', 'language_barrier', 'singing_debut',
]

// ─── Roll for one actor event this week (20% chance) ─────────────────────────
export function rollActorEvent(state) {
  const signed = state.actors.filter(a => a.signed)
  if (!signed.length || Math.random() > 0.20) return null

  // Shuffle actor list to avoid always picking the first one
  const shuffled = [...signed].sort(() => Math.random() - 0.5)

  for (const type of [...ACTOR_EVENT_TYPES].sort(() => Math.random() - 0.5)) {
    const actor = shuffled[0]
    const data  = makeActorEvent(type, actor, state)
    if (data) return { type: 'event', data }
  }
  return null
}

// ─── CP Event System (Prompt 2) ───────────────────────────────────────────────
// During-production: actor requests (photos, lives, dances, covers, vlogs).
// After-production: company-managed promos (BTS, OST, fan meets, ads).
const DURING_PROD_EVENTS = [
  { id: 'tiktok_dance',   label: '🕺 TIKTOK DANCE TREND',      skillKeys: ['dance','comedy'],   cost: 0 },
  { id: 'ig_photos',      label: '📸 INSTAGRAM PHOTO DUMP',     skillKeys: ['visual','art'],     cost: 0 },
  { id: 'youtube_vlog',   label: '🎥 YOUTUBE VLOG TOGETHER',    skillKeys: ['comedy','art'],     cost: 0 },
  { id: 'singing_cover',  label: '🎵 SINGING COVER UPLOAD',     skillKeys: ['sing','visual'],    cost: 0 },
  { id: 'live_stream',    label: '📡 LIVE STREAM SESSION',      skillKeys: ['comedy','visual'],  cost: 0 },
]

const AFTER_PROD_EVENTS = [
  { id: 'bts_content',   label: '🎬 BEHIND-THE-SCENES DROP',   skillKeys: ['art','comedy'],     cost: 0    },
  { id: 'ost_perf',      label: '🎤 OST LIVE PERFORMANCE',     skillKeys: ['sing','dance'],     cost: 1500 },
  { id: 'fan_meeting',   label: '🎪 FAN MEETING EVENT',        skillKeys: ['visual','comedy'],  cost: 1500 },
  { id: 'ad_promo',      label: '📢 AD PROMOTION CAMPAIGN',    skillKeys: ['visual','act'],     cost: 1000 },
  { id: 'interview_pr',  label: '🗞️ JOINT INTERVIEW',         skillKeys: ['lang','comedy'],    cost: 0    },
]

function rollCpEventData(ev, a, b, isDuring) {
  const avgSkill = ev.skillKeys.reduce((sum, k) => {
    const aSkill = a.skills?.[k] ?? 30
    const bSkill = b.skills?.[k] ?? 30
    return sum + (aSkill + bSkill) / 2
  }, 0) / ev.skillKeys.length
  // Base 60% success + skill bonus up to 25%
  const successChance = Math.min(0.85, 0.60 + (avgSkill / 100) * 0.25)

  const chemDelta      = isDuring ? 8 : 5
  const repDelta       = isDuring ? 4 : 0
  const coRepDelta     = isDuring ? 0 : 5
  const failChemDelta  = -5
  const declineChemD   = -8
  const declineRepD    = -3

  return {
    label: `${ev.label} — ${a.name} × ${b.name}`,
    message:
      (isDuring
        ? `${a.name} and ${b.name} want to post ${ev.label.toLowerCase()} together. `
          + `Fans are waiting! Will you greenlight this?`
        : `Company promo opportunity: ${ev.label} featuring ${a.name} × ${b.name}.${ev.cost ? ` Cost: ₩${ev.cost.toLocaleString()}` : ' Free.'} Will you proceed?`)
      + `\n\nOutcome will be revealed shortly.`,
    choices: [
      {
        label: `✅ Accept${ev.cost ? ` (−₩${ev.cost.toLocaleString()})` : ''}`,
        effect: (s, d) => {
          if (ev.cost) d({ type: A.ADD_MONEY, amount: -ev.cost })
          const success = Math.random() < successChance
          if (success) {
            // Update chemistry for both actors
            const actorA = s.actors.find(x => x.id === a.id)
            const actorB = s.actors.find(x => x.id === b.id)
            if (actorA) {
              d({ type: A.UPDATE_ACTOR, id: a.id, patch: {
                chemistry_map: { ...(actorA.chemistry_map ?? {}), [b.id]: clamp((actorA.chemistry_map?.[b.id] ?? 0) + chemDelta, 0, 100) }
              } })
            }
            if (actorB) {
              d({ type: A.UPDATE_ACTOR, id: b.id, patch: {
                chemistry_map: { ...(actorB.chemistry_map ?? {}), [a.id]: clamp((actorB.chemistry_map?.[a.id] ?? 0) + chemDelta, 0, 100) }
              } })
            }
            if (isDuring) {
              d({ type: A.UPDATE_ACTOR, id: a.id, patch: { fame: clamp((a.fame ?? 0) + repDelta * 100, 0, 999999) } })
              d({ type: A.UPDATE_ACTOR, id: b.id, patch: { fame: clamp((b.fame ?? 0) + repDelta * 100, 0, 999999) } })
            } else {
              d({ type: A.ADD_REPUTATION, amount: coRepDelta })
            }
            d({ type: A.PUSH_MODAL, modal: { type: 'generic', data: {
              title: `✨ ${ev.label} — SUCCESS!`,
              message: `The content landed perfectly!\n\n+${chemDelta} chemistry · ${isDuring ? `+${repDelta} actor fame` : `+${coRepDelta} company rep`}`
            } } })
          } else {
            // Failure
            const actorA = s.actors.find(x => x.id === a.id)
            const actorB = s.actors.find(x => x.id === b.id)
            if (actorA) {
              d({ type: A.UPDATE_ACTOR, id: a.id, patch: {
                chemistry_map: { ...(actorA.chemistry_map ?? {}), [b.id]: clamp((actorA.chemistry_map?.[b.id] ?? 0) + failChemDelta, 0, 100) }
              } })
            }
            if (actorB) {
              d({ type: A.UPDATE_ACTOR, id: b.id, patch: {
                chemistry_map: { ...(actorB.chemistry_map ?? {}), [a.id]: clamp((actorB.chemistry_map?.[a.id] ?? 0) + failChemDelta, 0, 100) }
              } })
            }
            if (isDuring) {
              d({ type: A.UPDATE_ACTOR, id: a.id, patch: { happiness: clamp((a.happiness ?? 70) - 8, 0, 100) } })
              d({ type: A.UPDATE_ACTOR, id: b.id, patch: { happiness: clamp((b.happiness ?? 70) - 8, 0, 100) } })
            } else {
              d({ type: A.ADD_REPUTATION, amount: -3 })
            }
            d({ type: A.PUSH_MODAL, modal: { type: 'generic', data: {
              title: `💔 ${ev.label} — FLOP`,
              message: `The content didn't land as hoped.\n\n${failChemDelta} chemistry · ${isDuring ? '−8 actor happiness' : '−3 company rep'}`
            } } })
          }
        },
      },
      {
        label: '🤝 Negotiate',
        effect: () => {}, // Keep existing negotiate flow — no extra logic
      },
      {
        label: `❌ Decline`,
        effect: (s, d) => {
          const actorA = s.actors.find(x => x.id === a.id)
          const actorB = s.actors.find(x => x.id === b.id)
          if (actorA) {
            d({ type: A.UPDATE_ACTOR, id: a.id, patch: {
              chemistry_map: { ...(actorA.chemistry_map ?? {}), [b.id]: clamp((actorA.chemistry_map?.[b.id] ?? 0) + declineChemD, 0, 100) }
            } })
          }
          if (actorB) {
            d({ type: A.UPDATE_ACTOR, id: b.id, patch: {
              chemistry_map: { ...(actorB.chemistry_map ?? {}), [a.id]: clamp((actorB.chemistry_map?.[a.id] ?? 0) + declineChemD, 0, 100) }
            } })
          }
          if (isDuring) {
            d({ type: A.ADD_REPUTATION, amount: declineRepD })
          } else {
            d({ type: A.ADD_REPUTATION, amount: declineRepD })
          }
        },
      },
    ],
  }
}

// Returns array of CP event modals for this week. Called from weekAdvance.js.
export function rollCpEvents(state, week) {
  const modals = []
  // 40% base chance per week to fire a CP event
  if (Math.random() > 0.40) return modals

  const activeProds = state.productions.filter(p => p.status === 'active')
  if (!activeProds.length) return modals

  // Collect all eligible CP pairs (filming or recently completed)
  const duringPairs = []
  const afterPairs  = []

  for (const prod of activeProds) {
    const leads = (prod.leadIds ?? []).map(id => state.actors.find(a => a.id === id)).filter(Boolean)
    if (leads.length >= 2) {
      if (prod.phase === 'filming') {
        duringPairs.push({ a: leads[0], b: leads[1], prod })
      } else if (prod.phase === 'releasing' || prod.phase === 'wrap') {
        afterPairs.push({ a: leads[0], b: leads[1], prod })
      }
    }
  }

  const allPairs = [...duringPairs.map(p => ({ ...p, isDuring: true })),
                    ...afterPairs.map(p => ({ ...p, isDuring: false }))]
  if (!allPairs.length) return modals

  const pair = allPairs[Math.floor(Math.random() * allPairs.length)]
  const pool = pair.isDuring ? DURING_PROD_EVENTS : AFTER_PROD_EVENTS
  const ev   = pool[Math.floor(Math.random() * pool.length)]

  // 6-week cooldown per CP pair per event
  const coolKey = `cpEvt_${ev.id}_${bondKey(pair.a.id, pair.b.id)}`
  const lastWk  = state.flags?.[coolKey] ?? -999
  if (week - lastWk < 6) return modals

  modals.push({
    flagKey: coolKey,
    modal: {
      type: 'event',
      data: rollCpEventData(ev, pair.a, pair.b, pair.isDuring),
    },
  })
  return modals
}

// ─── Chemistry Pulse — pure function, returns { modals, actions } ─────────────
// Called every week advance. Returns action objects + modals (no direct dispatch).
// 3.1: Chemistry deductions ONLY for actors in active productions.
export function runChemPulse(state, week) {
  const modals  = []
  const actions = []

  const signed = state.actors.filter(a => a.signed)

  // Build set of actor IDs currently in active productions
  const activeProds = state.productions.filter(p => p.status === 'active')
  const filmingActorIds = new Set(activeProds.flatMap(p => p.castIds ?? []))

  // ── Pair checks — only for actors currently filming together ───────────────
  for (const prod of activeProds) {
    const castIds = prod.castIds ?? []
    const castActors = signed.filter(a => castIds.includes(a.id))

    for (let i = 0; i < castActors.length; i++) {
      for (let j = i + 1; j < castActors.length; j++) {
        const a    = castActors[i]
        const b    = castActors[j]
        const chem = getChem(a, b.id)
        const key  = bondKey(a.id, b.id)

        const isFixed = (state.fixedCPs ?? []).some(
          ([x, y]) => bondKey(x, y) === key
        )

        // Fixed CP + chem < 20 → breakup crisis (3.2 spec: <20%)
        if (isFixed && chem < 20) {
          const coolKey = `cpBreakup_${key}`
          const lastWk  = state.flags?.[coolKey] ?? -999
          if (week - lastWk >= 4) {
            actions.push({ type: A.SET_FLAG, key: coolKey, value: week })
            modals.push({
              type: 'event',
              data: {
                label: '💔 CP BREAKUP CRISIS',
                message:
                  `The chemistry between ${a.name} and ${b.name} has fallen critically low (${chem}). `
                  + `Their Fixed CP contract is at risk of dissolving.`,
                choices: [
                  { label: '💰 Intensive bonding session (−₩1,500, +chemistry)',
                    effect: (s, d) => {
                      d({ type: A.ADD_MONEY, amount: -1500 })
                      const curA = s.actors.find(x => x.id === a.id)
                      if (curA) {
                        const newMap = { ...(curA.chemistry_map ?? {}), [b.id]: clamp(chem + 25, 0, 100) }
                        d({ type: A.UPDATE_ACTOR, id: a.id, patch: { chemistry_map: newMap } })
                      }
                      const curB = s.actors.find(x => x.id === b.id)
                      if (curB) {
                        const newMap = { ...(curB.chemistry_map ?? {}), [a.id]: clamp(chem + 25, 0, 100) }
                        d({ type: A.UPDATE_ACTOR, id: b.id, patch: { chemistry_map: newMap } })
                      }
                    } },
                  { label: '🔓 Dissolve the CP contract (−rep −loyalty)',
                    effect: (s, d) => {
                      d({ type: A.REMOVE_FIXED_CP, pair: [a.id, b.id] })
                      d({ type: A.ADD_REPUTATION, amount: -5 })
                      d({ type: A.UPDATE_ACTOR, id: a.id, patch: {
                        loyalty:   clamp((a.loyalty ?? 60) - 15, 0, 100),
                        happiness: clamp((a.happiness ?? 70) - 10, 0, 100),
                      } })
                      d({ type: A.UPDATE_ACTOR, id: b.id, patch: {
                        loyalty:   clamp((b.loyalty ?? 60) - 15, 0, 100),
                        happiness: clamp((b.happiness ?? 70) - 10, 0, 100),
                      } })
                    } },
                ],
              },
            })
          }
          continue
        }

        // chem ≥ 75 → endorsement deal (8-week cooldown) — positive, keep for filming pairs
        if (chem >= 75) {
          const coolKey = `chemHigh_${key}`
          const lastWk  = state.flags?.[coolKey] ?? -999
          if (week - lastWk >= 8) {
            actions.push({ type: A.SET_FLAG, key: coolKey, value: week })
            actions.push({ type: A.ADD_MONEY, amount: 1200 })
            modals.push({
              type: 'generic',
              data: {
                title: '💕 CP ENDORSEMENT DEAL!',
                message:
                  `${a.name} × ${b.name} chemistry (${chem}) caught a brand's eye!\n\n`
                  + `Endorsement income: +₩1,200`,
              },
            })
          }
        }
        // 3.1: Awkward rumours only for filming pairs (deduction)
        else if (chem < 20 && !isFixed) {
          const coolKey = `chemLow_${key}`
          const lastWk  = state.flags?.[coolKey] ?? -999
          if (week - lastWk >= 6) {
            actions.push({ type: A.SET_FLAG, key: coolKey, value: week })
            actions.push({ type: A.ADD_REPUTATION, amount: -2 })
            modals.push({
              type: 'generic',
              data: {
                title: '😬 AWKWARD ON-SET CO-STARS',
                message:
                  `${a.name} and ${b.name}'s on-set chemistry (${chem}) is painfully low. `
                  + `The tension leaked to fans — reputation −2.`,
              },
            })
          }
        }
      }
    }
  }

  // ── Quit threats: happiness < 20 + idle ≥ 4 weeks ─────────────────────────
  for (const actor of signed) {
    if ((actor.happiness ?? 70) < 20 && (actor.idleWeeks ?? 0) >= 4) {
      const coolKey = `quitThreat_${actor.id}`
      const lastWk  = state.flags?.[coolKey] ?? -999
      if (week - lastWk >= 4) {
        actions.push({ type: A.SET_FLAG, key: coolKey, value: week })
        modals.push({
          type: 'event',
          data: {
            label: `😤 QUIT THREAT — ${actor.name.toUpperCase()}`,
            message:
              `${actor.name} is miserable 😢 and hasn't worked in ${actor.idleWeeks} weeks. `
              + `They're seriously considering leaving the studio.`,
            choices: [
              { label: '💰 Retention bonus (−₩1,500, +happiness)',
                effect: (s, d) => {
                  d({ type: A.ADD_MONEY, amount: -1500 })
                  d({ type: A.UPDATE_ACTOR, id: actor.id,
                      patch: {
                        happiness: clamp((actor.happiness ?? 0) + 30, 0, 100),
                        loyalty:   clamp((actor.loyalty   ?? 60) + 10, 0, 100),
                      } })
                } },
              { label: '📣 Schedule them for a production ASAP',
                effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
                  patch: { happiness: clamp((actor.happiness ?? 0) + 10, 0, 100) } }) },
              { label: '👋 Let them leave',
                effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
                  patch: { signed: false, status: 'locked' } }) },
            ],
          },
        })
      }
    }
  }

  // ── Bankruptcy ─────────────────────────────────────────────────────────────
  if (state.money < 0) {
    const coolKey = 'bankruptcy'
    const lastWk  = state.flags?.[coolKey] ?? -999
    if (week - lastWk >= 4) {
      actions.push({ type: A.SET_FLAG, key: coolKey, value: week })
      modals.push({
        type: 'event',
        data: {
          label: '💸 BANKRUPTCY WARNING',
          message:
            `Your studio is in the red (₩${state.money.toLocaleString()})! `
            + `You need emergency funds or operations will shut down.`,
          choices: [
            { label: '🏦 Emergency loan (+₩5,000)',
              effect: (s, d) => d({ type: A.ADD_MONEY, amount: 5000 }) },
            { label: '🎬 Sell equipment (−3 rep, +₩3,000)',
              effect: (s, d) => {
                d({ type: A.ADD_MONEY,      amount: 3000 })
                d({ type: A.ADD_REPUTATION, amount: -3 })
              } },
          ],
        },
      })
    }
  }

  return { modals, actions }
}

// ─── Company event roller ─────────────────────────────────────────────────────
// Returns array of modal objects (may be empty).
// weekAdvance.js should dispatch SET_FLAG 'lastCompanyEvent' if any event fires.
export function rollWeeklyEvents(state) {
  // 1-3 week cooldown between company events
  const lastEvtWeek = state.flags?.lastCompanyEvent ?? -999
  const minCooldown = 1 + Math.floor(Math.random() * 3)
  if ((state.week - lastEvtWeek) < minCooldown) return []

  // 35% weekly chance
  if (Math.random() > 0.35) return []

  const eligible = COMPANY_EVENTS.filter(e => !e.condition || e.condition(state))
  if (!eligible.length) return []

  const totalWeight = eligible.reduce((s, e) => s + e.weight, 0)
  const roll        = Math.random() * totalWeight
  let acc = 0
  for (const ev of eligible) {
    acc += ev.weight
    if (roll < acc) {
      const makeData = ev.makeData(state)
      if (!makeData) return []
      return [{ type: 'event', data: { label: ev.label, ...makeData } }]
    }
  }
  return []
}
