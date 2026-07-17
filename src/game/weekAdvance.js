/**
 * weekAdvance.js — Custom hook that encapsulates the NEXT WEEK logic.
 * Prompt 4: updated for new production schema (budgetMult, phase, combo, platform),
 *           pushes entries to eventLog.
 */
import { useState } from 'react'
import { useGame, A, pushToast, pushEventLog } from './state.jsx'
import { tickProduction, calcRevenue, calcScore, popularityDeltaByPlatform } from './productions.js'
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

    const week = state.week

    // 1. Tick all active productions
    const completedThisWeek  = []
    const wrappedThisWeek    = []
    const releasingThisWeek  = []

    for (const prod of state.productions) {
      if (prod.status !== 'active') continue
      const patch = tickProduction(prod)
      dispatch({ type: A.UPDATE_PRODUCTION, id: prod.id, patch })

      if (patch.status === 'completed') {
        completedThisWeek.push({ ...prod, ...patch })
      } else if (patch.phase === 'wrap' && prod.phase === 'filming') {
        wrappedThisWeek.push({ ...prod, ...patch })
      } else if (patch.phase === 'releasing') {
        releasingThisWeek.push({ ...prod, ...patch })
      }
    }

    // 2. Handle wrap events (combo reveal)
    for (const prod of wrappedThisWeek) {
      const combo = prod.comboResult
      if (combo) {
        pushEventLog(dispatch,
          `"${prod.title}" wrapped filming! Combo: ${combo.emoji} ${combo.label} (×${combo.mult})`,
          combo.mult >= 1.5 ? 'gold' : combo.mult < 1.0 ? 'red' : 'green',
          week,
        )
        dispatch({
          type: A.PUSH_MODAL,
          modal: {
            type: 'generic',
            data: {
              title: `🎬 ${prod.title} — WRAP!`,
              message: `Genre×Type Combo: ${combo.emoji} ${combo.label}\n\nScore multiplier: ×${combo.mult}. Episodes now releasing weekly.`,
            },
          },
        })
      }
    }

    // 3. Handle episode releases
    for (const prod of releasingThisWeek) {
      const ep  = prod.episodesReleased
      const rat = prod.episodeRatings?.[ep - 1]
      if (rat != null) {
        pushEventLog(dispatch,
          `"${prod.title}" Ep.${ep} aired — rating ${rat}/10`,
          rat >= 8 ? 'pink' : rat >= 6 ? 'green' : rat >= 4 ? '' : 'red',
          week,
        )
      }
    }

    // 4. Evaluate fully completed productions
    for (const prod of completedThisWeek) {
      const castActors = state.actors.filter(a => prod.castIds.includes(a.id))
      const chemBonus  = calcChemistryBonus(castActors)
      const baseScore  = calcScore(prod, castActors, chemBonus)
      const comboMult  = prod.comboResult?.mult ?? 1.0
      const score      = Math.round(Math.min(100, baseScore * comboMult))

      const revenue    = calcRevenue(
        score, prod.budget ?? 1.0, prod.type,
        state.reputation, prod.platform ?? 'tv', comboMult
      )
      const evalResult = evaluateProduction({ production: prod, score, revenue, reputation: state.reputation })

      const popDelta = popularityDeltaByPlatform(score, prod.platform ?? 'tv', prod.rating ?? 'pg13')

      dispatch({ type: A.ADD_MONEY,      amount: revenue })
      dispatch({ type: A.ADD_REPUTATION, amount: evalResult.repDelta })
      dispatch({ type: A.SET_POPULARITY, value: state.popularity + popDelta })

      // Chemistry + XP for cast
      const chemDeltas = calcBondGrowth(castActors, score)
      for (const actor of castActors) {
        const expPatch   = grantExp(actor, evalResult.xpPerActor)
        const newChemMap = applyBondDeltas(actor, chemDeltas)
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
          weekCompleted: week,
          castIds:       prod.castIds,
        },
      })

      // Event log + modal
      pushEventLog(dispatch,
        `"${prod.title}" finished! Grade: ${evalResult.grade} — ${evalResult.label}. Revenue: ₩${revenue.toLocaleString()}`,
        evalResult.grade === 'F' || evalResult.grade === 'D' ? 'red'
          : evalResult.grade === 'S+' || evalResult.grade === 'S' ? 'gold'
          : 'green',
        week,
      )

      dispatch({
        type: A.PUSH_MODAL,
        modal: { type: 'productionResult', data: { prod, eval: evalResult, score, revenue } },
      })
    }

    // 5. Weekly actor tick (skip actors who just wrapped)
    for (const actor of state.actors) {
      if (!actor.signed) continue
      if (completedThisWeek.find(p => p.castIds.includes(actor.id))) continue
      const patch = weeklyActorRecovery(actor)
      dispatch({ type: A.UPDATE_ACTOR, id: actor.id, patch })
    }

    // 6. Rank update
    const newRank = calcRank(state.reputation, state.popularity)
    if (newRank.id !== state.rank) {
      dispatch({ type: A.SET_RANK, rank: newRank.id })
      pushEventLog(dispatch, `Studio ranked up to ${newRank.label}! 🎉`, 'gold', week)
      dispatch({ type: A.PUSH_MODAL, modal: { type: 'rankUp', data: { rank: newRank } } })
    }

    // 7. Random events
    const events = rollWeeklyEvents(state)
    for (const ev of events) {
      pushEventLog(dispatch, `[EVENT] ${ev.label}: ${ev.message}`, 'pink', week)
      dispatch({ type: A.PUSH_MODAL, modal: { type: 'event', data: ev } })
    }

    // 8. Advance week counter
    dispatch({ type: A.ADVANCE_WEEK })
    pushToast(dispatch, `Week ${state.week + 1} begins.`)

    setAdvancing(false)
  }

  return { advanceWeek, advancing }
}
