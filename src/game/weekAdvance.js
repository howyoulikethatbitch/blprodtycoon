/**
 * weekAdvance.js — Custom hook: NEXT WEEK logic
 * Prompt 5: passes castActors + chemValue to evaluateProduction,
 *           handles awards dispatch and controversy modal.
 */
import { useState } from 'react'
import { useGame, A, pushToast, pushEventLog } from './state.jsx'
import { tickProduction, calcRevenue, calcScore, popularityDeltaByPlatform } from './productions.js'
import { weeklyActorRecovery, grantExp, NEW_TALENT_POOL } from './actors.js'
import { calcChemistryBonus, calcBondGrowth, applyBondDeltas, getChem } from './chemistry.js'
import { evaluateProduction } from './evaluators.js'
import { rollWeeklyEvents, rollActorEvent, runChemPulse, rollCpEvents } from './events.js'
import { calcRank, computeNumericRank, playerScore } from './ranking.js'
import { SFX, resumeAudio } from './audio.js'

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

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

      // ── 3.3 Loyalty drain — check after patch applied ────────────────────
      const newLoyalty = patch.loyalty ?? actor.loyalty ?? 60
      if (newLoyalty <= 0 && actor.status === 'available') {
        const coolKey = `loyaltyZero_${actor.id}`
        const lastWk  = state.flags?.[coolKey] ?? -999
        if (week - lastWk >= 4) {
          dispatch({ type: A.SET_FLAG, key: coolKey, value: week })
          dispatch({
            type: A.PUSH_MODAL,
            modal: {
              type: 'event',
              data: {
                label: `💔 LOYALTY CRISIS — ${actor.name.toUpperCase()}`,
                message:
                  `${actor.name} has been idle for ${actor.idleWeeks} weeks and their loyalty has hit zero! `
                  + `"${actor.name} is planning to leave... If this continues, they will leave the company. Add a new production now?"\n\n`
                  + `Act now or they will leave!`,
                choices: [
                  { label: '🎬 Commit to scheduling them soon (+loyalty)',
                    effect: (s, d) => d({ type: A.UPDATE_ACTOR, id: actor.id,
                      patch: { loyalty: 20, happiness: clamp((actor.happiness ?? 0) + 10, 0, 100) } }) },
                  { label: `💸 Emergency bonus (−₩3,000, +loyalty)`,
                    effect: (s, d) => {
                      d({ type: A.ADD_MONEY, amount: -3000 })
                      d({ type: A.UPDATE_ACTOR, id: actor.id,
                        patch: { loyalty: 30, happiness: clamp((actor.happiness ?? 0) + 20, 0, 100) } })
                    } },
                  { label: `👋 Let ${actor.name} leave → Free Agents Pool`,
                    effect: (s, d) => {
                      // Move actor to free agents pool as ex-actor (Type A)
                      const boostedSkills = {}
                      for (const [k, v] of Object.entries(actor.skills ?? {})) {
                        boostedSkills[k] = Math.min(100, Math.round(v * 2))
                      }
                      const resignCost = Math.round((actor.signCost ?? 200) * 3)
                      d({ type: A.UPDATE_ACTOR, id: actor.id,
                        patch: { signed: false, status: 'locked', loyalty: 0 } })
                      d({ type: A.ADD_FREE_AGENT, entry: {
                        poolId:           `ex_${actor.id}_${week}`,
                        type:             'ex_actor',
                        originalActorId:  actor.id,
                        name:             actor.name,
                        tier:             actor.tier,
                        skills:           boostedSkills,
                        characteristics:  actor.characteristics ?? [],
                        signCost:         resignCost,
                        happiness:        actor.happiness ?? 20,
                        loyalty:          0,
                        weeksInPool:      0,
                        availableWeek:    week + 12,  // 12-week cooldown
                        permanentlyGone:  false,
                        idleReturnCount:  0,
                      } })
                      pushEventLog(d,
                        `💔 ${actor.name} left the studio (loyalty=0) → Free Agents Pool`,
                        'red', week,
                      )
                    } },
                ],
              },
            },
          })
          pushEventLog(dispatch,
            `⚠️ ${actor.name} loyalty at zero! Intervention needed.`, 'red', week,
          )
        }
      }
    }

    // ── 5.1 Tick pool entries (weeksInPool++, remove ex-actors after 24 weeks) ─
    if ((state.freeAgentsPool ?? []).length > 0) {
      const updatedPool = (state.freeAgentsPool ?? [])
        .map(e => ({ ...e, weeksInPool: (e.weeksInPool ?? 0) + 1 }))
        .filter(e => {
          if (e.permanentlyGone) return false
          if (e.type === 'ex_actor' && e.weeksInPool >= 24) {
            pushEventLog(dispatch,
              `⌛ ${e.name} left the free agent pool permanently (24-week limit).`, 'red', week)
            return false
          }
          return true
        })
      dispatch({ type: A.INIT_FREE_AGENTS, pool: updatedPool })
    }

    // ── 5.5 Numeric rank + tier unlocks ─────────────────────────────────────
    const numRank = computeNumericRank(state)
    if (numRank !== state.numericRank) {
      dispatch({ type: A.SET_NUMERIC_RANK, rank: numRank })
    }
    // Unlock tiers when crossing numeric rank thresholds
    if (numRank <= 39 && !state.unlockedTiers.includes('Rising Star')) {
      dispatch({ type: A.UNLOCK_TIER, tier: 'Rising Star' })
      pushEventLog(dispatch, '🌟 Rising Star tier unlocked! New actors available.', 'gold', week)
      dispatch({ type: A.PUSH_MODAL, modal: { type: 'generic', data: {
        title: '🌟 TIER UNLOCKED — RISING STAR',
        message: `Studio reached rank #${numRank}!\n\nRising Star actors are now available for audition.`,
      } } })
    }
    if (numRank <= 24 && !state.unlockedTiers.includes('Popular')) {
      dispatch({ type: A.UNLOCK_TIER, tier: 'Popular' })
      pushEventLog(dispatch, '💕 Popular tier unlocked! New actors available.', 'gold', week)
      dispatch({ type: A.PUSH_MODAL, modal: { type: 'generic', data: {
        title: '💕 TIER UNLOCKED — POPULAR',
        message: `Studio reached rank #${numRank}!\n\nPopular tier actors are now available for audition.`,
      } } })
    }
    if (numRank <= 9 && !state.unlockedTiers.includes('Worldwide')) {
      dispatch({ type: A.UNLOCK_TIER, tier: 'Worldwide' })
      pushEventLog(dispatch, '🌍 Worldwide tier unlocked! Elite actors available.', 'gold', week)
      dispatch({ type: A.PUSH_MODAL, modal: { type: 'generic', data: {
        title: '🌍 TIER UNLOCKED — WORLDWIDE',
        message: `Studio reached rank #${numRank}!\n\nWorldwide elite actors are now available for audition.`,
      } } })
    }

    // ── 5.6 Rivalry showdown (every 10 weeks) ────────────────────────────────
    if (week > 0 && week % 10 === 0 && (state.rivals ?? []).length > 0) {
      const ps       = playerScore(state)
      // Find the rival ranked just above the player (lowest score still above player)
      const rivals   = [...state.rivals].sort((a, b) => a.score - b.score)
      const rival    = rivals.find(r => r.score > ps)
      if (rival) {
        // Win chance proportional to relative scores; small random factor for drama
        const winChance  = Math.min(0.88, (ps / (ps + rival.score)) * 1.6 + 0.05)
        const playerWins = Math.random() < winChance
        if (playerWins) {
          dispatch({ type: A.ADD_REPUTATION,  amount: 8 })
          dispatch({ type: A.SET_POPULARITY,  value: state.popularity + 15000 })
          dispatch({ type: A.UPDATE_RIVALS,   id: rival.id, scoreDelta: -25 })
          pushEventLog(dispatch,
            `⚔️ Showdown vs ${rival.name}: WON! +8 rep +15K pop`, 'gold', week)
          dispatch({ type: A.PUSH_MODAL, modal: { type: 'event', data: {
            label: '⚔️ RIVALRY SHOWDOWN — VICTORY!',
            message:
              `Your studio faced off against ${rival.name} in the weekly rankings!\n\n` +
              `Your score: ${ps.toLocaleString()}\nRival score: ${rival.score.toLocaleString()}\n\n` +
              `VICTORY! +8 rep · +15,000 pop · rival weakened.`,
            choices: [{ label: '🏆 CELEBRATE!', effect: () => {} }],
          } } })
        } else {
          dispatch({ type: A.ADD_REPUTATION, amount: -4 })
          dispatch({ type: A.UPDATE_RIVALS,  id: rival.id, scoreDelta: 10 })
          pushEventLog(dispatch,
            `⚔️ Showdown vs ${rival.name}: lost. −4 rep`, 'red', week)
          dispatch({ type: A.PUSH_MODAL, modal: { type: 'event', data: {
            label: '⚔️ RIVALRY SHOWDOWN — DEFEAT',
            message:
              `Your studio faced off against ${rival.name} in the weekly rankings.\n\n` +
              `Your score: ${ps.toLocaleString()}\nRival score: ${rival.score.toLocaleString()}\n\n` +
              `DEFEAT. −4 rep · rival grows stronger. Improve your score!`,
            choices: [{ label: '😤 NOTED', effect: () => {} }],
          } } })
        }
      }
    }

    // ── 5.7 Audition week (every 4 weeks) ────────────────────────────────────
    if (week > 0 && week % 4 === 0) {
      const unsigned = state.actors.filter(
        a => !a.signed && state.unlockedTiers.includes(a.tier)
      )
      if (unsigned.length > 0) {
        const shuffled   = [...unsigned].sort(() => Math.random() - 0.5)
        const candidates = shuffled.slice(0, Math.min(3, shuffled.length))
        dispatch({ type: A.PUSH_MODAL, modal: { type: 'audition', data: { candidates } } })
        pushEventLog(dispatch,
          `🎭 Audition week! ${candidates.length} candidate(s) seeking contracts.`, 'pink', week)
      }
    }

    // ── 6. Label rank update ─────────────────────────────────────────────────
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

    // ── 7a2. CP events (Prompt 2) ─────────────────────────────────────────────
    const cpEvents = rollCpEvents(state, week)
    for (const { flagKey, modal } of cpEvents) {
      dispatch({ type: A.SET_FLAG, key: flagKey, value: week })
      const lbl = modal.data?.label ?? 'CP Event'
      pushEventLog(dispatch, `[CP] ${lbl}`, 'pink', week)
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
