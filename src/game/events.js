/**
 * events.js — Random weekly event system
 * Events fire during week advance and may modify state.
 */
import { A } from './state.jsx'

// ─── Event pool ───────────────────────────────────────────────────────────────
// Each event: { id, weight, condition?, effect(state, dispatch) }
// Full event pool will be populated in later prompts.
// This module wires up the trigger/resolve mechanism.

export const EVENT_POOL = [
  {
    id: 'scandal_rumor',
    weight: 3,
    label: '📰 Tabloid Rumour',
    message: 'A gossip outlet ran a story about your studio. Reputation takes a small hit.',
    condition: (state) => state.reputation > 5,
    choices: [
      { label: 'No comment',    effect: (s, d) => d({ type: A.ADD_REPUTATION, amount: -3 }) },
      { label: 'Issue denial',  effect: (s, d) => d({ type: A.ADD_REPUTATION, amount: -1 }) },
    ],
  },
  {
    id: 'viral_moment',
    weight: 4,
    label: '🔥 Viral Moment',
    message: 'A clip from one of your productions went viral! Huge popularity boost.',
    condition: (state) => state.productions.length > 0 || state.history.length > 0,
    choices: [
      { label: 'Capitalise on it', effect: (s, d) => {
        d({ type: A.ADD_REPUTATION, amount: 3 })
        d({ type: A.SET_POPULARITY, value: s.popularity + 15000 })
      }},
    ],
  },
  {
    id: 'sponsor_offer',
    weight: 3,
    label: '💼 Sponsorship Offer',
    message: 'A beverage brand wants to sponsor your next production.',
    choices: [
      { label: 'Accept (₩10,000)', effect: (s, d) => d({ type: A.ADD_MONEY, amount: 10000 }) },
      { label: 'Decline',          effect: () => {} },
    ],
  },
  {
    id: 'equipment_failure',
    weight: 2,
    label: '🔧 Equipment Failure',
    message: 'Studio equipment broke down mid-production. Emergency repair costs ₩5,000.',
    condition: (state) => state.productions.length > 0,
    choices: [
      { label: 'Pay for repairs', effect: (s, d) => d({ type: A.ADD_MONEY, amount: -5000 }) },
      { label: 'Improvise',       effect: (s, d) => d({ type: A.ADD_REPUTATION, amount: -2 }) },
    ],
  },
  {
    id: 'award_nomination',
    weight: 2,
    label: '🏆 Award Nomination',
    message: 'Your studio received an industry award nomination!',
    condition: (state) => state.history.some(h => h.grade === 'A' || h.grade === 'S' || h.grade === 'S+'),
    choices: [
      { label: 'Attend ceremony', effect: (s, d) => {
        d({ type: A.ADD_REPUTATION, amount: 5 })
        d({ type: A.ADD_MONEY, amount: -3000 })
      }},
      { label: 'Skip it', effect: () => {} },
    ],
  },
]

// ─── Event trigger logic ──────────────────────────────────────────────────────

/**
 * Roll for random events this week.
 * Returns array of event objects that should fire.
 */
export function rollWeeklyEvents(state) {
  const eligible = EVENT_POOL.filter(e => {
    if (e.condition && !e.condition(state)) return false
    return true
  })
  if (!eligible.length) return []

  // Weighted random selection
  const totalWeight = eligible.reduce((s, e) => s + e.weight, 0)
  const roll = Math.random() * totalWeight
  let acc = 0
  for (const ev of eligible) {
    acc += ev.weight
    if (roll < acc) {
      // ~30% chance any event fires per week
      return Math.random() < 0.30 ? [ev] : []
    }
  }
  return []
}
