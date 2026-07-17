/**
 * weekAdvance.js — Custom hook: NEXT WEEK logic
 * Prompt 5: passes castActors + chemValue to evaluateProduction,
 *           handles awards dispatch and controversy modal.
 */
import { useState } from 'react'
import { useGame, A, pushToast, pushEventLog } from './state.jsx'
import { tickProduction, calcRevenue, calcScore, popularityDeltaByPlatform } from './productions.js'
import { weeklyActorRecovery, grantExp } from './actors.js'
import { calcChemistryBonus, calcBondGrowth, applyBondDeltas, getChem } from './chemistry.js'
import { evaluateProduction } from './evaluators.js'
import { rollWeeklyEvents, rollActorEvent, runChemPulse } from './events.js'
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

    // ── 1. Tick productions ───────────────────────────────────────────────────
    const completedThisWeek = []
    const wrappedThisWeek   = []
    const releasingThisWeek = []

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

    // ── 2. Wrap events ────────────────────────────────────────────────────────
    for (const prod of wrappedThisWeek) {
      const combo = prod.comboResult
      if (combo) {
        pushEventLog(dispatch,
          `"${prod.title}" filming wrapped! Combo: ${combo.emoji} ${combo.label} ×${combo.mult}`,
          combo.mult >= 1.5 ? 'gold' : combo.mult < 1.0 ? 'red' : 'green', week,
        )
        dispatch({
          type: A.PUSH_MODAL,
          modal: {
            type: 'generic',
            data: {
              title: `🎬 ${prod.title} — WRAP!`,
              message: `Genre×Type Combo: ${combo.emoji} ${combo.label}\n\nScore multiplier: ×${combo.mult}\nEpisodes now releasing weekly.`,
            },
          },
        })
      }
    }

    // ── 3. Episode releases ───────────────────────────────────────────────────
    for (const prod of releasingThisWeek) {
      const ep  = prod.episodesReleased
      const rat = prod.episodeRatings?.[ep - 1]
      if (rat != null) {
        pushEventLog(dispatch,
          `"${prod.title}" Ep.${ep} aired — rating ${rat}/10`,
          rat >= 8 ? 'pink' : rat >= 5 ? 'green' : 'red', week,
        )
      }
    }

    // ── 4. Evaluate completed productions ─────────────────────────────────────
    for (const prod of completedThisWeek) {
      const castActors = state.actors.filter(a => prod.castIds.includes(a.id))

      // Chemistry between lead pair
      const leads   = castActors.filter(a => (prod.leadIds ?? []).includes(a.id))
      const chemValue = leads.length >= 2
        ? getChem(leads[0], leads[1].id)
        : castActors.length >= 2
          ? getChem(castActors[0], castActors[1].id)
          : 0

      const chemBonus  = calcChemistryBonus(castActors)
      const baseScore  = calcScore(prod, castActors, chemBonus)
      const comboMult  = prod.comboResult?.mult ?? 1.0
      const adjBase    = Math.round(Math.min(100, baseScore * comboMult))

      const revenue    = calcRevenue(
        adjBase, prod.budget ?? 1.0, prod.type,
        state.reputation, prod.platform ?? 'tv', comboMult,
      )

      // Four-critics evaluation
      const evalResult = evaluateProduction({
        production: prod,
        score:      adjBase,
        revenue,
        reputation: state.reputation,
        castActors,
        chemValue,
      })

      const finalScore = evalResult.score

      // Apply stat deltas
      dispatch({ type: A.ADD_MONEY,      amount: revenue })
      dispatch({ type: A.ADD_REPUTATION, amount: evalResult.repDelta })
      dispatch({ type: A.SET_POPULARITY, value: state.popularity + evalResult.popDelta })

      // Chemistry + XP for cast
      const chemDeltas = calcBondGrowth(castActors, finalScore)
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

      // Record completion
      dispatch({
        type: A.COMPLETE_PRODUCTION, id: prod.id,
        record: {
          ...prod,
          score:         finalScore,
          revenue,
          grade:         evalResult.grade,
          weekCompleted: week,
        },
      })

      // ── Awards (avgStars ≥ 4.5) ───────────────────────────────────────────
      if (evalResult.awarded) {
        dispatch({ type: A.ADD_REPUTATION, amount: 10 })
        dispatch({ type: A.SET_POPULARITY, value: state.popularity + evalResult.popDelta + 25000 })
        dispatch({ type: A.ADD_MONEY, amount: 3000 })
        dispatch({ type: A.ADD_AWARD })
        for (const actor of castActors) {
          dispatch({ type: A.UPDATE_ACTOR, id: actor.id, patch: { awards: (actor.awards ?? 0) + 1 } })
        }
        pushEventLog(dispatch,
          `🏆 "${prod.title}" wins an industry award! +10 rep · +₩3,000`,
          'gold', week,
        )
      }

      // ── Controversy (social critic ≤ 2) ───────────────────────────────────
      if (evalResult.controversy) {
        dispatch({
          type: A.PUSH_MODAL,
          modal: {
            type: 'event',
            data: {
              label: '⚠️ CONTROVERSY',
              message: `The Social Critic's review of "${prod.title}" sparked backlash over LGBTQ+ representation. Your studio is under scrutiny.`,
              choices: [
                { label: '🤝 Issue apology (-3 rep)',   effect: (s, d) => d({ type: A.ADD_REPUTATION, amount: -3 }) },
                { label: '🗣️ Stand firm (-6 rep)',      effect: (s, d) => d({ type: A.ADD_REPUTATION, amount: -6 }) },
                { label: '💰 Donate & rebrand (-₩8000)', effect: (s, d) => {
                  d({ type: A.ADD_MONEY, amount: -8000 })
                  d({ type: A.ADD_REPUTATION, amount: 2 })
                }},
              ],
            },
          },
        })
        pushEventLog(dispatch,
          `"${prod.title}" faces representation controversy. Choices matter.`,
          'red', week,
        )
      }

      // Event log + main result modal
      pushEventLog(dispatch,
        `"${prod.title}" critique: ${evalResult.grade} (${evalResult.avgStars}★). Revenue ₩${revenue.toLocaleString()}`,
        evalResult.grade === 'F' || evalResult.grade === 'D' ? 'red'
          : evalResult.grade === 'S+' || evalResult.grade === 'S' ? 'gold'
          : 'green',
        week,
      )

      dispatch({
        type: A.PUSH_MODAL,
        modal: {
          type: 'productionResult',
          data: { prod, eval: evalResult, score: finalScore, revenue },
        },
      })
    }

    // ── 5. Weekly actor tick ──────────────────────────────────────────────────
    for (const actor of state.actors) {
      if (!actor.signed) continue
      if (completedThisWeek.find(p => p.castIds.includes(actor.id))) continue
      const patch = weeklyActorRecovery(actor)
      dispatch({ type: A.UPDATE_ACTOR, id: actor.id, patch })
    }

    // ── 6. Rank update ────────────────────────────────────────────────────────
    const newRank = calcRank(state.reputation, state.popularity)
    if (newRank.id !== state.rank) {
      dispatch({ type: A.SET_RANK, rank: newRank.id })
      pushEventLog(dispatch, `Studio ranked up to ${newRank.label}! 🎉`, 'gold', week)
      dispatch({ type: A.PUSH_MODAL, modal: { type: 'rankUp', data: { rank: newRank } } })
    }

    // ── 7a. Chemistry pulse ───────────────────────────────────────────────────
    const pulse = runChemPulse(state, week)
    for (const action of pulse.actions) {
      dispatch(action)
    }
    for (const modal of pulse.modals) {
      const lbl = modal.data?.label ?? modal.data?.title ?? 'Chemistry Event'
      pushEventLog(dispatch, `[CHEM] ${lbl}`, 'pink', week)
      dispatch({ type: A.PUSH_MODAL, modal })
    }

    // ── 7b. Company event ─────────────────────────────────────────────────────
    const companyEvents = rollWeeklyEvents(state)
    if (companyEvents.length > 0) {
      dispatch({ type: A.SET_FLAG, key: 'lastCompanyEvent', value: week })
    }
    for (const ev of companyEvents) {
      const lbl = ev.data?.label ?? 'Company Event'
      pushEventLog(dispatch, `[EVENT] ${lbl}`, 'pink', week)
      dispatch({ type: A.PUSH_MODAL, modal: ev })
    }

    // ── 7c. Actor event ───────────────────────────────────────────────────────
    const actorEvent = rollActorEvent(state)
    if (actorEvent) {
      const lbl = actorEvent.data?.label ?? 'Actor Event'
      pushEventLog(dispatch, `[ACTOR] ${lbl}`, 'pink', week)
      dispatch({ type: A.PUSH_MODAL, modal: actorEvent })
    }

    // ── 8. Advance week ───────────────────────────────────────────────────────
    dispatch({ type: A.ADVANCE_WEEK })
    pushToast(dispatch, `Week ${state.week + 1} begins.`)

    setAdvancing(false)
  }

  return { advanceWeek, advancing }
}
