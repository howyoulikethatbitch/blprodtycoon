/**
 * TopBar.jsx — Sticky header with stats and week advance button
 */
import React, { useState } from 'react'
import { useGame, A, pushToast } from '../game/state.jsx'
import { fmtMoney, fmtPop, calcRank } from '../game/ranking.js'
import { rollWeeklyEvents } from '../game/events.js'
import { tickProduction } from '../game/productions.js'
import { calcRevenue, calcScore } from '../game/productions.js'
import { weeklyActorRecovery, grantExp } from '../game/actors.js'
import { calcChemistryBonus, calcBondGrowth, applyBondDeltas } from '../game/chemistry.js'
import { evaluateProduction } from '../game/evaluators.js'
import { SFX, resumeAudio } from '../game/audio.js'

export default function TopBar() {
  const { state, dispatch } = useGame()
  const [advancing, setAdvancing] = useState(false)

  const rank = calcRank(state.reputation, state.popularity)

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
      const eval_      = evaluateProduction({ production: prod, score, revenue, reputation: state.reputation })

      // Apply financial & reputation effects
      dispatch({ type: A.ADD_MONEY,       amount: revenue })
      dispatch({ type: A.ADD_REPUTATION,  amount: eval_.repDelta })
      dispatch({ type: A.SET_POPULARITY,  value: state.popularity + eval_.popDelta })

      // Bond growth
      const bondDeltas = calcBondGrowth(castActors, score)
      for (const actor of castActors) {
        const expPatch  = grantExp(actor, eval_.xpPerActor)
        const bondPatch = applyBondDeltas(actor, bondDeltas)
        dispatch({
          type: A.UPDATE_ACTOR, id: actor.id,
          patch: { ...expPatch, bond: bondPatch, assignedTo: null, available: true },
        })
      }

      // Mark completed
      dispatch({
        type: A.COMPLETE_PRODUCTION,
        id: prod.id,
        record: { ...prod, score, revenue, grade: eval_.grade, weekCompleted: state.week },
      })

      // Show result modal
      dispatch({
        type: A.PUSH_MODAL,
        modal: { type: 'productionResult', data: { prod, eval: eval_, score, revenue } },
      })
    }

    // 3. Actor weekly recovery
    for (const actor of state.actors) {
      if (!completedThisWeek.find(p => p.castIds.includes(actor.id))) {
        const patch = weeklyActorRecovery(actor)
        dispatch({ type: A.UPDATE_ACTOR, id: actor.id, patch })
      }
    }

    // 4. Update rank
    const newRep = Math.max(0, Math.min(100, state.reputation))
    const newRank = calcRank(newRep, state.popularity)
    if (newRank.id !== state.rank) {
      dispatch({ type: A.SET_RANK, rank: newRank.id })
      dispatch({
        type: A.PUSH_MODAL,
        modal: { type: 'rankUp', data: { rank: newRank } },
      })
    }

    // 5. Random events
    const events = rollWeeklyEvents(state)
    for (const ev of events) {
      dispatch({ type: A.PUSH_MODAL, modal: { type: 'event', data: ev } })
    }

    // 6. Advance week counter
    dispatch({ type: A.ADVANCE_WEEK })
    pushToast(dispatch, `Week ${state.week + 1} begins.`)

    setAdvancing(false)
  }

  return (
    <header style={styles.bar}>
      {/* Company name */}
      <div style={styles.company}>{state.companyName}</div>

      {/* Stats row */}
      <div style={styles.stats}>
        <Stat label="₩" value={fmtMoney(state.money)} color="var(--gold)" />
        <Stat label="REP" value={state.reputation} color="var(--pink)" />
        <Stat label="POP" value={fmtPop(state.popularity)} color="var(--gold)" />
        <Stat label="RANK" value={rank.id} color="var(--green)" small />
      </div>

      {/* Week display */}
      <div style={styles.week}>WK{state.week}</div>

      {/* Advance button */}
      <button
        className="btn-primary"
        style={styles.nextBtn}
        onClick={advanceWeek}
        disabled={advancing}
        aria-label="Advance one week"
      >
        {advancing ? '⏳' : '▶ NEXT'}
      </button>
    </header>
  )
}

function Stat({ label, value, color, small }) {
  return (
    <div style={styles.statWrap}>
      <span style={styles.statLbl}>{label}</span>
      <span style={{ ...styles.statVal, color, fontSize: small ? 8 : 11 }}>{value}</span>
    </div>
  )
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--bg-deep)',
    borderBottom: '3px solid var(--pink)',
    padding: '8px 12px',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    flexWrap: 'wrap',
    minHeight: 'var(--topbar-h)',
  },
  company: {
    color: 'var(--pink)',
    fontSize: 9,
    borderBottom: '2px dashed var(--pink-dim)',
    paddingBottom: 2,
    flexShrink: 0,
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stats: {
    display: 'flex',
    gap: 10,
    flex: 1,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  statWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 48,
  },
  statLbl: {
    fontSize: 7,
    color: 'var(--lav)',
    letterSpacing: 1,
  },
  statVal: {
    fontSize: 11,
    fontFamily: 'inherit',
  },
  week: {
    fontSize: 8,
    color: 'var(--lav)',
    flexShrink: 0,
  },
  nextBtn: {
    fontSize: 10,
    padding: '10px 14px',
    textAlign: 'center',
    flexShrink: 0,
  },
}
