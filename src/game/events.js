/**
 * events.js — Company events, actor events, chemistry pulse
 * Prompt 6: 7 company events, 10 actor event types, weekly chemistry pulse
 * Prompt 8: tier-based CP frequency, always-succeed, decline penalties, breakup threshold
 */
import { A } from './state.jsx'
import { getChem, bondKey } from './chemistry.js'
import { getGameTierByRank } from './tiers.js'

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
    // Prompt 6.4: only fires when studio is actually struggling for cash
    condition: s => s.money < 15000,
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
    // Prompt 6.3: only for actors who do NOT already have any fixed CP partner
    condition: s => {
      const signed   = s.actors.filter(a => a.signed)
      const fixedIds = new Set((s.fixedCPs ?? []).flat())
      const free     = signed.filter(a => !fixedIds.has(a.id))
      for (let i = 0; i < free.length; i++) {
        for (let j = i + 1; j < free.length; j++) {
          if (getChem(free[i], free[j].id) >= 75) return true
        }
      }
      return false
    },
    makeData: (s) => {
      const signed   = s.actors.filter(a => a.signed)
      const fixedIds = new Set((s.fixedCPs ?? []).flat())
      const free     = signed.filter(a => !fixedIds.has(a.id))
      let bestPair = null, bestChem = 0
      for (let i = 0; i < free.length; i++) {
        for (let j = i + 1; j < free.length; j++) {
          const c = getChem(free[i], free[j].id)
          if (c > bestChem) { bestChem = c; bestPair = [free[i], free[j]] }
        }
      }
      if (!bestPair) return null
      const [a, b] = bestPair
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

// ─── Tricky Events (Prompt 6.5 — 30% of all events, ⚠️ badge, both choices cost something) ──
// Pop rewards capped at 10–25K so no single event can skip tier thresholds.
// Every choice has a real downside — no free win on either option.
const TRICKY_COMPANY_EVENTS = [
  {
    id: 'tricky_viral_stunt',
    weight: 3,
    label: '⚠️ VIRAL STUNT OFFER',
    makeData: () => ({
      badge: '⚠️ RISKY CHOICE',
      message:
        'A media agency offers a viral marketing stunt. '
        + 'It\'ll spike fan attention but the content is edgy and divisive. '
        + 'Turning it down means sitting out the trend — fans notice.',
      choices: [
        { label: '✅ Accept (+12,000 pop, −8 rep)',
          effect: (s, d) => {
            d({ type: A.SET_POPULARITY, value: s.popularity + 12000 })
            d({ type: A.ADD_REPUTATION, amount: -8 })
          } },
        { label: '❌ Decline (−5,000 pop, +4 rep)',
          effect: (s, d) => {
            d({ type: A.SET_POPULARITY, value: Math.max(0, s.popularity - 5000) })
            d({ type: A.ADD_REPUTATION, amount: 4 })
          } },
      ],
    }),
  },
  {
    id: 'tricky_budget_raid',
    weight: 3,
    label: '⚠️ BUDGET REALLOCATION',
    makeData: () => ({
      badge: '⚠️ RISKY CHOICE',
      message:
        'Finance suggests raiding the equipment reserve for quick cash. '
        + 'Good for funds but industry insiders will notice. '
        + 'A proper audit keeps your standing but costs time and money.',
      choices: [
        { label: '✅ Raid reserve (+₩8,000, −6 rep)',
          effect: (s, d) => {
            d({ type: A.ADD_MONEY,      amount: 8000 })
            d({ type: A.ADD_REPUTATION, amount: -6 })
          } },
        { label: '❌ Proper audit (−₩2,000, +4 rep)',
          effect: (s, d) => {
            d({ type: A.ADD_MONEY,      amount: -2000 })
            d({ type: A.ADD_REPUTATION, amount: 4 })
          } },
      ],
    }),
  },
  {
    id: 'tricky_rival_alliance',
    weight: 2,
    label: '⚠️ RIVAL ALLIANCE OFFER',
    condition: s => s.reputation >= 15,
    makeData: () => ({
      badge: '⚠️ RISKY CHOICE',
      message:
        'A rival studio proposes a co-branding deal. '
        + 'Accepting builds your credibility — but sharing the spotlight costs fans. '
        + 'Declining runs counter-marketing, boosting your pop but burning a bridge.',
      choices: [
        { label: '✅ Accept (+7 rep, −8,000 pop — sharing spotlight)',
          effect: (s, d) => {
            d({ type: A.ADD_REPUTATION, amount: 7 })
            d({ type: A.SET_POPULARITY, value: Math.max(0, s.popularity - 8000) })
          } },
        { label: '❌ Decline (+8,000 pop, −3 rep — seen as territorial)',
          effect: (s, d) => {
            d({ type: A.SET_POPULARITY, value: s.popularity + 8000 })
            d({ type: A.ADD_REPUTATION, amount: -3 })
          } },
      ],
    }),
  },
  {
    id: 'tricky_fan_demand',
    weight: 3,
    label: '⚠️ EXTREME FAN DEMAND',
    condition: s => s.actors.some(a => a.signed),
    makeData: (s) => {
      const actor = s.actors.filter(a => a.signed)[0]
      if (!actor) return null
      return {
        badge: '⚠️ RISKY CHOICE',
        message:
          `Fans are demanding ${actor.name} do a solo fan meet ASAP. `
          + `Pushing them delivers pop but hammers their happiness. `
          + `Protecting them keeps morale up but disappoints the fanbase.`,
        choices: [
          { label: `✅ Push ${actor.name} (+18,000 pop, −12 happiness)`,
            effect: (s2, d) => {
              d({ type: A.SET_POPULARITY, value: s2.popularity + 18000 })
              const cur = s2.actors.find(x => x.id === actor.id)
              d({ type: A.UPDATE_ACTOR, id: actor.id,
                  patch: { happiness: clamp(((cur ?? actor).happiness ?? 70) - 12, 0, 100) } })
            } },
          { label: `❌ Protect ${actor.name} (+10 happiness, −6,000 pop)`,
            effect: (s2, d) => {
              d({ type: A.SET_POPULARITY, value: Math.max(0, s2.popularity - 6000) })
              const cur = s2.actors.find(x => x.id === actor.id)
              d({ type: A.UPDATE_ACTOR, id: actor.id,
                  patch: { happiness: clamp(((cur ?? actor).happiness ?? 70) + 10, 0, 100) } })
            } },
        ],
      }
    },
  },
  {
    id: 'tricky_controversial_shoot',
    weight: 2,
    label: '⚠️ CONTROVERSIAL PHOTOSHOOT',
    makeData: () => ({
      badge: '⚠️ RISKY CHOICE',
      message:
        'A top magazine offers a provocative cover shoot. '
        + 'Good money and a pop spike, but the community is divided. '
        + 'Declining protects your rep — but the planning fee is already spent.',
      choices: [
        { label: '✅ Accept (+₩4,000, +15,000 pop, −5 rep)',
          effect: (s, d) => {
            d({ type: A.ADD_MONEY,      amount: 4000 })
            d({ type: A.SET_POPULARITY, value: s.popularity + 15000 })
            d({ type: A.ADD_REPUTATION, amount: -5 })
          } },
        { label: '❌ Decline (−₩1,000 sunk cost, +4 rep)',
          effect: (s, d) => {
            d({ type: A.ADD_MONEY,      amount: -1000 })
            d({ type: A.ADD_REPUTATION, amount: 4 })
          } },
      ],
    }),
  },
  {
    id: 'tricky_hidden_romance',
    weight: 2,
    label: '⚠️ HIDDEN RELATIONSHIP RUMOUR',
    condition: s => s.actors.filter(a => a.signed).length >= 2,
    makeData: (s) => {
      const signed = s.actors.filter(a => a.signed)
      if (signed.length < 2) return null
      const a = signed[0], b = signed[1]
      return {
        badge: '⚠️ RISKY CHOICE',
        message:
          `Tabloids claim ${a.name} and ${b.name} are secretly dating. `
          + `Confirming thrills fans and builds chemistry — but the spotlight strains their loyalty. `
          + `Denying protects them professionally but fans lose interest.`,
        choices: [
          { label: `✅ Confirm (+20,000 pop, +15 chem, −10 loyalty each)`,
            effect: (s2, d) => {
              d({ type: A.SET_POPULARITY, value: s2.popularity + 20000 })
              const curA = s2.actors.find(x => x.id === a.id)
              const curB = s2.actors.find(x => x.id === b.id)
              if (curA) d({ type: A.UPDATE_ACTOR, id: a.id, patch: {
                loyalty:       clamp((curA.loyalty ?? 60) - 10, 0, 100),
                chemistry_map: { ...(curA.chemistry_map ?? {}), [b.id]: clamp((curA.chemistry_map?.[b.id] ?? 0) + 15, 0, 100) },
              } })
              if (curB) d({ type: A.UPDATE_ACTOR, id: b.id, patch: {
                loyalty:       clamp((curB.loyalty ?? 60) - 10, 0, 100),
                chemistry_map: { ...(curB.chemistry_map ?? {}), [a.id]: clamp((curB.chemistry_map?.[a.id] ?? 0) + 15, 0, 100) },
              } })
            } },
          { label: `❌ Deny (−8,000 pop, +10 loyalty each)`,
            effect: (s2, d) => {
              d({ type: A.SET_POPULARITY, value: Math.max(0, s2.popularity - 8000) })
              const curA = s2.actors.find(x => x.id === a.id)
              const curB = s2.actors.find(x => x.id === b.id)
              if (curA) d({ type: A.UPDATE_ACTOR, id: a.id, patch: { loyalty: clamp((curA.loyalty ?? 60) + 10, 0, 100) } })
              if (curB) d({ type: A.UPDATE_ACTOR, id: b.id, patch: { loyalty: clamp((curB.loyalty ?? 60) + 10, 0, 100) } })
            } },
        ],
      }
    },
  },
  {
    id: 'tricky_awards_gamble',
    weight: 2,
    label: '⚠️ AWARDS CAMPAIGN GAMBLE',
    condition: s => s.history.length > 0 && s.money >= 5000,
    makeData: () => ({
      badge: '⚠️ RISKY CHOICE',
      message:
        'An awards strategist offers a guaranteed nomination campaign — costly but high rep impact. '
        + 'Declining saves the budget but the missed PR causes your fanbase to stagnate.',
      choices: [
        { label: '✅ Launch campaign (−₩5,000, +10 rep, +1 award)',
          effect: (s, d) => {
            d({ type: A.ADD_MONEY,      amount: -5000 })
            d({ type: A.ADD_REPUTATION, amount: 10 })
            d({ type: A.ADD_AWARD })
          } },
        { label: '❌ Save the money (−8,000 pop, +2 rep)',
          effect: (s, d) => {
            d({ type: A.SET_POPULARITY, value: Math.max(0, s.popularity - 8000) })
            d({ type: A.ADD_REPUTATION, amount: 2 })
          } },
      ],
    }),
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

// Prompt 8: CP events always succeed when accepted. Decline penalties scale by tier.
function rollCpEventData(ev, a, b, isDuring, tier) {
  const chemDelta   = isDuring ? 8 : 5
  const repDelta    = isDuring ? 4 : 0
  const coRepDelta  = isDuring ? 0 : 5

  // Tier-scaled decline penalties (None at Rookie)
  const declineChemD = tier.declineChemPenalty
  const declineRepD  = tier.declineRepPenalty

  // Negotiate cost: base event cost × tier modifier
  const negotiateCost = ev.cost ? Math.round(ev.cost * tier.negotiateMod) : 0

  // Shared success effect (always triggers on Accept or Negotiate)
  function applySuccess(s, d, paidCost) {
    if (paidCost) d({ type: A.ADD_MONEY, amount: -paidCost })
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
      message: `The content landed perfectly!\n\n+${chemDelta} chemistry · ${isDuring ? `+${repDelta} actor fame` : `+${coRepDelta} company rep`}`,
    } } })
  }

  return {
    label: `${ev.label} — ${a.name} × ${b.name}`,
    message:
      (isDuring
        ? `${a.name} and ${b.name} want to post ${ev.label.toLowerCase()} together. `
          + `Fans are waiting! Will you greenlight this?`
        : `Company promo opportunity: ${ev.label} featuring ${a.name} × ${b.name}.${ev.cost ? ` Cost: ₩${ev.cost.toLocaleString()}` : ' Free.'} Will you proceed?`)
      + `\n\nThis will always succeed — results guaranteed!`,
    choices: [
      {
        // Accept — always succeeds; Prompt 6.1: +happiness to both actors
        label: `✅ Accept${ev.cost ? ` (−₩${ev.cost.toLocaleString()})` : ''}`,
        effect: (s, d) => {
          applySuccess(s, d, ev.cost ?? 0)
          // Prompt 6.1: happiness boost on good CP event outcome
          const curA = s.actors.find(x => x.id === a.id)
          const curB = s.actors.find(x => x.id === b.id)
          if (curA) d({ type: A.UPDATE_ACTOR, id: a.id, patch: { happiness: clamp((curA.happiness ?? 70) + 10, 0, 100) } })
          if (curB) d({ type: A.UPDATE_ACTOR, id: b.id, patch: { happiness: clamp((curB.happiness ?? 70) + 10, 0, 100) } })
        },
      },
      // Prompt 6.2: Negotiate option REMOVED — Accept / Decline only
      {
        label: `❌ Decline${declineChemD < 0 || declineRepD < 0
          ? ` (${declineChemD < 0 ? `${declineChemD} chem` : ''}${declineChemD < 0 && declineRepD < 0 ? ', ' : ''}${declineRepD < 0 ? `${declineRepD} rep` : ''})`
          : ' (no penalty)'}`,
        effect: (s, d) => {
          if (declineChemD !== 0) {
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
          }
          if (declineRepD !== 0) {
            d({ type: A.ADD_REPUTATION, amount: declineRepD })
          }
        },
      },
    ],
  }
}

// Returns array of CP event modals for this week. Called from weekAdvance.js.
// Prompt 8: frequency scales by tier; always succeed; free:paid ratio by tier.
// Prompt 1: tier now derived from numericRank (not week).
export function rollCpEvents(state, week) {
  const modals = []
  const tier = getGameTierByRank(state.numericRank ?? 50)

  // Tier-scaled event frequency
  if (Math.random() > tier.cpEventFreq) return modals

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

  // Tier-scaled free:paid ratio — prefer free events at lower tiers
  let pool = pair.isDuring ? DURING_PROD_EVENTS : AFTER_PROD_EVENTS
  const freePool = pool.filter(e => !e.cost)
  const paidPool = pool.filter(e =>  e.cost)
  if (freePool.length && paidPool.length) {
    pool = Math.random() < tier.freePaidRatio ? freePool : paidPool
  }

  const ev = pool[Math.floor(Math.random() * pool.length)]

  // 6-week cooldown per CP pair per event
  const coolKey = `cpEvt_${ev.id}_${bondKey(pair.a.id, pair.b.id)}`
  const lastWk  = state.flags?.[coolKey] ?? -999
  if (week - lastWk < 6) return modals

  modals.push({
    flagKey: coolKey,
    modal: {
      type: 'event',
      data: rollCpEventData(ev, pair.a, pair.b, pair.isDuring, tier),
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

        // Fixed CP + chem below tier threshold → breakup crisis (Prompt 1/8: rank-based tier)
        const breakupThreshold = getGameTierByRank(state.numericRank ?? 50).cpBreakupThreshold
        if (isFixed && chem < breakupThreshold) {
          const coolKey = `cpBreakup_${key}`
          const lastWk  = state.flags?.[coolKey] ?? -999
          if (week - lastWk >= 4) {
            actions.push({ type: A.SET_FLAG, key: coolKey, value: week })
            modals.push({
              type: 'event',
              data: {
                label: '💔 CP BREAKUP CRISIS',
                message:
                  `The chemistry between ${a.name} and ${b.name} has fallen critically low (${chem}, threshold: ${breakupThreshold}). `
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
// Prompt 6.5: 30% of events are tricky (⚠️ badge, mixed outcomes).
// weekAdvance.js should dispatch SET_FLAG 'lastCompanyEvent' if any event fires.
export function rollWeeklyEvents(state) {
  // 1-3 week cooldown between company events
  const lastEvtWeek = state.flags?.lastCompanyEvent ?? -999
  const minCooldown = 1 + Math.floor(Math.random() * 3)
  if ((state.week - lastEvtWeek) < minCooldown) return []

  // 35% weekly chance
  if (Math.random() > 0.35) return []

  // Route: 30% → tricky events, 70% → standard events
  const useTricky = Math.random() < 0.30
  const pool = useTricky
    ? TRICKY_COMPANY_EVENTS.filter(e => !e.condition || e.condition(state))
    : COMPANY_EVENTS.filter(e => !e.condition || e.condition(state))

  if (!pool.length) {
    // Fall back to the other pool if chosen pool is empty
    const fallback = useTricky
      ? COMPANY_EVENTS.filter(e => !e.condition || e.condition(state))
      : TRICKY_COMPANY_EVENTS.filter(e => !e.condition || e.condition(state))
    if (!fallback.length) return []
    const fEv = fallback[Math.floor(Math.random() * fallback.length)]
    const fData = fEv.makeData(state)
    if (!fData) return []
    return [{ type: 'event', data: { label: fEv.label, ...fData } }]
  }

  const totalWeight = pool.reduce((s, e) => s + e.weight, 0)
  const roll        = Math.random() * totalWeight
  let acc = 0
  for (const ev of pool) {
    acc += ev.weight
    if (roll < acc) {
      const makeData = ev.makeData(state)
      if (!makeData) return []
      return [{ type: 'event', data: { label: ev.label, ...makeData } }]
    }
  }
  return []
}
