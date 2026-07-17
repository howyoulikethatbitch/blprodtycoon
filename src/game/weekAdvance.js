/**
 * weekAdvance.js — Custom hook that encapsulates the NEXT WEEK logic.
 * Extracted from TopBar so any component (Sidebar, FAB) can trigger it.
 */
import { useState } from 'react'
import { useGame, A, pushToast } from './state.jsx'
import { tickProduction, calcRevenue, calcScore } from './productions.js'
import { weeklyActorRecovery, grantExp } from './actors.js'
import { calcChemistryBonus, calcBondGrowth, applyBondDeltas } from './chemistry.js'
import { evaluateProduction } from './evaluators.js'
import { rollWeeklyEvents } from './events.js'
import { calcRank } from './ranking.js'
import { SFX, resumeAudio } from './audio.js'

export function useWeekAdvance() {
  const { state, dispatch } = useGame()
  const [advancing, setAdvancing] = useState(false)

  async function advanceWeek() {
    if (advancing) return
    resumeAudio()
    SFX.nextTurn()
    setAdvancing(true)

    // 1. Tick all active productions
    const completedThisWeek = []
    for (const prod of state.productions) {
      if (prod.status !== 'active') continue
      const patch = tickProduction(prod)
      dispatch({ type: A.UPDATE_PRODUCTION, id: prod.id, patch })
      if (patch.status === 'completed') {
        completedThisWeek.push({ ...prod, ...patch })
      }
    }

    // 2. Evaluate completed productions
    for (const prod of completedThisWeek) {
      const castActors = state.actors.filter(a => prod.castIds.includes(a.id))
      const chemBonus  = calcChemistryBonus(castActors)
      const score      = calcScore(prod, castActors, chemBonus)
      const revenue    = calcRevenue(score, prod.budget, prod.type, state.reputation)
      const evalResult = evaluateProduction({ production: prod, score, revenue, reputation: state.reputation })

      dispatch({ type: A.ADD_MONEY,      amount: revenue })
      dispatch({ type: A.ADD_REPUTATION, amount: evalResult.repDelta })
      dispatch({ type: A.SET_POPULARITY, value: state.popularity + evalResult.popDelta })

      const chemDeltas = calcBondGrowth(castActors, score)
      for (const actor of castActors) {
        const expPatch    = grantExp(actor, evalResult.xpPerActor)
        const newChemMap  = applyBondDeltas(actor, chemDeltas)
        dispatch({
          type: A.UPDATE_ACTOR, id: actor.id,
          patch: {
            ...expPatch,
            chemistry_map:  newChemMap,
            status:         'available',
            assignedTo:     null,
            completedProds: (actor.completedProds ?? 0) + 1,
          },
        })
      }

      dispatch({
        type: A.COMPLETE_PRODUCTION, id: prod.id,
        record: {
          ...prod, score, revenue,
          grade:         evalResult.grade,
          weekCompleted: state.week,
          castIds:       prod.castIds,
        },
      })

      dispatch({
        type: A.PUSH_MODAL,
        modal: { type: 'productionResult', data: { prod, eval: evalResult, score, revenue } },
      })
    }

    // 3. Weekly actor tick (skip actors who just wrapped — already updated)
    for (const actor of state.actors) {
      if (!actor.signed) continue
      if (completedThisWeek.find(p => p.castIds.includes(actor.id))) continue
      const patch = weeklyActorRecovery(actor)
      dispatch({ type: A.UPDATE_ACTOR, id: actor.id, patch })
    }

    // 4. Rank string update
    const newRank = calcRank(state.reputation, state.popularity)
    if (newRank.id !== state.rank) {
      dispatch({ type: A.SET_RANK, rank: newRank.id })
      dispatch({ type: A.PUSH_MODAL, modal: { type: 'rankUp', data: { rank: newRank } } })
    }

    // 5. Random events
    const events = rollWeeklyEvents(state)
    for (const ev of events) {
      dispatch({ type: A.PUSH_MODAL, modal: { type: 'event', data: ev } })
    }

    // 6. Advance week
    dispatch({ type: A.ADVANCE_WEEK })
    pushToast(dispatch, `Week ${state.week + 1} begins.`)

    setAdvancing(false)
  }

  return { advanceWeek, advancing }
}
