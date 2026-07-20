/**
 * AwardsCeremony.jsx — Full-screen BL Awards ceremony and summary
 * Triggered when state.awardsPhase === 'ceremony' | 'summary'
 */
import React, { useState } from 'react'
import { useGame, A, pushEventLog } from '../game/state.jsx'
import {
  AWARD_DEFS,
  calcAttendanceEffects,
  getLackingArea,
  getYearHistory,
} from '../game/awards.js'
import { SFX } from '../game/audio.js'
import { triggerConfetti } from './Confetti.jsx'

export default function AwardsCeremony() {
  const { state, dispatch } = useGame()
  const { awardsData, awardsPhase } = state
  const [view, setView]             = useState(awardsPhase === 'summary' ? 'summary' : 'ceremony')
  const [revealIdx, setRevealIdx]   = useState(0)
  const [winnerVisible, setWinnerVisible] = useState(false)

  if (!awardsData) return null

  const { results = [], userWins = [], year } = awardsData
  const attended  = awardsData.attended ?? false
  const resultMap = Object.fromEntries(results.map(r => [r.awardId, r]))

  // ── Leave: apply effects → push result modal → clear awards ────────────────
  function handleLeave() {
    SFX.click()
    const effects = calcAttendanceEffects(attended, userWins)

    if (effects.repDelta !== 0) {
      dispatch({ type: A.ADD_REPUTATION, amount: effects.repDelta })
    }
    if (effects.popDelta !== 0) {
      dispatch({ type: A.SET_POPULARITY, value: Math.max(0, state.popularity + effects.popDelta) })
    }
    if (effects.fameDelta > 0) {
      const yearH     = getYearHistory(state.history, state.week)
      const castIdSet = new Set(yearH.flatMap(h => h.castIds ?? []))
      state.actors
        .filter(a => a.signed && castIdSet.has(a.id))
        .forEach(a => {
          dispatch({ type: A.UPDATE_ACTOR, id: a.id, patch: { fame: (a.fame ?? 0) + effects.fameDelta } })
        })
    }
    if (userWins.length > 0) {
      dispatch({ type: A.ADD_AWARD, amount: userWins.length })
    }

    pushEventLog(
      dispatch,
      `🏆 BL Awards Year ${year}: ${userWins.length} award(s) won. Rep ${effects.repDelta >= 0 ? '+' : ''}${effects.repDelta}`,
      userWins.length > 0 ? 'gold' : 'red',
      state.week,
    )

    if (userWins.length > 0) triggerConfetti(userWins.length >= 3 ? 2.0 : 1.0)

    dispatch({ type: A.PUSH_MODAL, modal: buildResultModal(awardsData, state) })
    dispatch({ type: A.CLEAR_AWARDS })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CEREMONY VIEW — award-by-award reveal
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === 'ceremony') {
    const currentAward  = AWARD_DEFS[revealIdx]
    const currentResult = resultMap[currentAward.id]
    const isPlayerWin   = userWins.includes(currentAward.id)
    const isLast        = revealIdx >= AWARD_DEFS.length - 1
    const isMajor       = currentAward.category === 'major'

    function handleReveal() {
      SFX.modal()
      setWinnerVisible(true)
      if (isPlayerWin) {
        triggerConfetti(isLast ? 1.5 : 0.6)
        SFX.success && SFX.success()
      }
    }

    function handleNext() {
      SFX.click()
      if (isLast) { setView('summary') }
      else { setRevealIdx(i => i + 1); setWinnerVisible(false) }
    }

    return (
      <div style={S.overlay}>
        {/* ── Header ── */}
        <div style={S.header}>
          <div style={S.headerTitle}>✨ BL AWARDS — YEAR {year} ✨</div>
          <div style={S.headerSub}>{state.companyName ?? 'Your Studio'}</div>
        </div>

        {/* ── Progress bar ── */}
        <div style={S.progressWrap}>
          <div style={{ ...S.progressFill, width: `${((revealIdx + 1) / AWARD_DEFS.length) * 100}%` }} />
        </div>
        <div style={S.progressLabel}>
          Award {revealIdx + 1} of {AWARD_DEFS.length}
          {isMajor && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>⭐ MAJOR</span>}
        </div>

        {/* ── Award card ── */}
        <div style={{ ...S.card, borderColor: isMajor ? 'var(--gold)' : 'var(--shadow)' }}>
          <div style={{ fontSize: isMajor ? 52 : 40, lineHeight: 1 }}>{currentAward.icon}</div>
          <div style={{ fontSize: isMajor ? 12 : 10, color: 'var(--white)', textAlign: 'center', letterSpacing: 0.5 }}>
            {currentAward.label}
          </div>

          {!winnerVisible ? (
            <button style={S.revealBtn} onClick={handleReveal}>
              🎭 REVEAL WINNER
            </button>
          ) : (
            <div style={{ ...S.winnerCard, borderColor: isPlayerWin ? 'var(--gold)' : 'var(--lav)' }}>
              {isPlayerWin && (
                <div style={S.playerBadge}>🏆 YOUR STUDIO WINS!</div>
              )}
              <WinnerDisplay result={currentResult} award={currentAward} isPlayer={isPlayerWin} />
              <button
                style={{ ...S.nextBtn, background: isLast ? 'var(--pink)' : 'var(--lav)' }}
                onClick={handleNext}
              >
                {isLast ? '📋 VIEW FULL SUMMARY →' : 'NEXT AWARD →'}
              </button>
            </div>
          )}
        </div>

        {/* ── Bottom controls ── */}
        <div style={S.bottomRow}>
          <button style={S.ghostBtn} onClick={() => { SFX.click(); setView('summary') }}>
            📋 Skip to Summary
          </button>
          <button style={{ ...S.ghostBtn, color: 'var(--red)' }} onClick={handleLeave}>
            🚪 Leave
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY VIEW — full winners list
  // ═══════════════════════════════════════════════════════════════════════════
  const minorAwards = AWARD_DEFS.filter(a => a.category === 'minor')
  const majorAwards = AWARD_DEFS.filter(a => a.category === 'major')

  return (
    <div style={S.overlay}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerTitle}>✨ BL AWARDS — YEAR {year} ✨</div>
        <div style={S.headerSub}>
          {state.companyName ?? 'Your Studio'}
          {userWins.length > 0 && (
            <span style={{ color: 'var(--gold)', marginLeft: 10 }}>
              🏆 {userWins.length} / {AWARD_DEFS.length} Won
            </span>
          )}
          {!attended && (
            <span style={{ color: 'var(--lav)', marginLeft: 10 }}>· Watched from home</span>
          )}
        </div>
      </div>

      {/* ── Awards list ── */}
      <div style={S.summaryScroll}>
        <div style={S.sectionHead}>— MINOR AWARDS —</div>
        {minorAwards.map(award => (
          <SummaryRow
            key={award.id}
            award={award}
            result={resultMap[award.id]}
            isPlayer={userWins.includes(award.id)}
          />
        ))}

        <div style={{ ...S.sectionHead, marginTop: 20, color: 'var(--gold)' }}>
          ⭐ MAJOR AWARDS ⭐
        </div>
        {majorAwards.map(award => (
          <SummaryRow
            key={award.id}
            award={award}
            result={resultMap[award.id]}
            isPlayer={userWins.includes(award.id)}
          />
        ))}
      </div>

      {/* ── Leave bar ── */}
      <div style={S.leaveBar}>
        <button style={S.leaveBtn} onClick={handleLeave}>
          🚪 LEAVE
        </button>
      </div>
    </div>
  )
}

// ─── Winner display (inside ceremony card) ────────────────────────────────────
function WinnerDisplay({ result, award, isPlayer }) {
  if (!result) {
    return <div style={{ color: 'var(--gray)', fontSize: 8, textAlign: 'center' }}>No eligible candidates this year.</div>
  }
  const { winner } = result
  const nameColor  = isPlayer ? 'var(--gold)' : 'var(--white)'

  if (award.kind === 'actor') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>🎭</div>
        <div style={{ fontSize: 13, color: nameColor, marginBottom: 4 }}>
          {winner.actorName ?? winner.name}
        </div>
        <div style={{ fontSize: 8, color: 'var(--lav)' }}>{winner.company}</div>
      </div>
    )
  }
  if (award.kind === 'production') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>🎬</div>
        <div style={{ fontSize: 12, color: nameColor, marginBottom: 4, lineHeight: 1.5 }}>
          {winner.title ?? winner.name}
        </div>
        <div style={{ fontSize: 8, color: 'var(--lav)' }}>{winner.company}</div>
        {winner.extra && (
          <div style={{ fontSize: 7, color: 'var(--pink)', marginTop: 3 }}>{winner.extra}</div>
        )}
      </div>
    )
  }
  // company award
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>🏢</div>
      <div style={{ fontSize: 13, color: nameColor, marginBottom: 4 }}>{winner.name}</div>
    </div>
  )
}

// ─── Summary row ──────────────────────────────────────────────────────────────
function SummaryRow({ award, result, isPlayer }) {
  const winner = result?.winner
  return (
    <div style={{
      display:     'flex',
      alignItems:  'center',
      gap:         10,
      padding:     '8px 10px',
      border:      `2px solid ${isPlayer ? 'var(--gold)' : 'var(--shadow)'}`,
      background:  isPlayer ? 'rgba(255,215,0,0.07)' : 'var(--bg-inset)',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{award.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 7, color: 'var(--lav)', marginBottom: 2 }}>{award.label}</div>
        {winner ? (
          <>
            <div style={{
              fontSize: 9,
              color: isPlayer ? 'var(--gold)' : 'var(--white)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {award.kind === 'actor'
                ? (winner.actorName ?? winner.name)
                : (winner.title ?? winner.name)}
            </div>
            <div style={{ fontSize: 7, color: 'var(--lav)' }}>
              {winner.company}
              {winner.extra && (
                <span style={{ color: 'var(--pink)', marginLeft: 8 }}>{winner.extra}</span>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 7, color: 'var(--gray)' }}>No eligible candidates</div>
        )}
      </div>
      {isPlayer && <span style={{ fontSize: 16, flexShrink: 0 }}>🏆</span>}
    </div>
  )
}

// ─── Result modal builder ─────────────────────────────────────────────────────
function buildResultModal(awardsData, state) {
  const wins  = awardsData?.userWins ?? []
  const total = AWARD_DEFS.length
  const year  = awardsData?.year ?? '?'
  let title, message

  if (wins.length === total) {
    title   = 'History has been made! 🌟'
    message = `You completely swept EVERY SINGLE AWARD this Year ${year} season! 🏆\n\nAn absolute masterpiece of a performance that left the entire industry speechless.\n\nYou have officially set the high standard in BL Industry—everyone else is just living in your shadow! 👑`
  } else if (wins.length >= 3) {
    title   = 'Congratulations! 🎉'
    message = `You have won ${wins.length} awards this Year ${year} season! ✨\n\nYour hard work and dedication have officially set a new standard in BL industry.\n\nKeep up the incredible momentum!`
  } else if (wins.length >= 1) {
    const names = wins.map(id => AWARD_DEFS.find(a => a.id === id)?.label ?? id)
    const list  = names.length === 1
      ? names[0]
      : names.slice(0, -1).join(', ') + ' and ' + names.at(-1)
    title   = 'Congratulations! 🎉'
    message = `You have won ${list} this Year ${year} season! ⚔️\n\nA beautiful performance, but you must keep up the momentum to stay the ultimate power couple next time.\n\nThe competition is fierce, and your rivals are closing in—don't let your guard down!`
  } else {
    const lacking = getLackingArea(state, state.week)
    title   = `The Year ${year} BL Awards Night has come to an end.`
    message = `Unfortunately, you didn't take home any trophies this time. 💔\n\nDon't lose heart—the fans are still cheering for your story! 📣\n\nWork on your ${lacking} and show them who truly rules the charts! 🔥`
  }

  return { type: 'generic', data: { title, message } }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position:       'fixed',
    inset:          0,
    background:     'var(--bg-deep)',
    display:        'flex',
    flexDirection:  'column',
    zIndex:         9000,
    fontFamily:     'inherit',
  },
  header: {
    padding:        '16px 16px 12px',
    borderBottom:   '2px solid var(--gold)',
    background:     'linear-gradient(180deg,rgba(255,215,0,0.10) 0%,transparent 100%)',
    textAlign:      'center',
    flexShrink:     0,
  },
  headerTitle: {
    fontSize:       12,
    color:          'var(--gold)',
    letterSpacing:  2,
    marginBottom:   4,
  },
  headerSub: {
    fontSize:       8,
    color:          'var(--lav)',
    letterSpacing:  1,
  },
  progressWrap: {
    height:         4,
    background:     'var(--shadow)',
    flexShrink:     0,
  },
  progressFill: {
    height:         '100%',
    background:     'var(--gold)',
    transition:     'width 0.4s ease',
  },
  progressLabel: {
    textAlign:      'center',
    fontSize:       7,
    color:          'var(--lav)',
    padding:        '6px 16px 0',
    flexShrink:     0,
  },
  card: {
    margin:         '12px 16px',
    padding:        '20px 16px',
    border:         '2px solid',
    background:     'var(--bg-panel)',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            12,
    flexShrink:     0,
    overflowY:      'auto',
    maxHeight:      'calc(100dvh - 240px)',
  },
  revealBtn: {
    fontSize:       9,
    padding:        '12px 24px',
    background:     'var(--pink)',
    color:          'var(--bg-deep)',
    border:         '2px solid #8A2B52',
    cursor:         'pointer',
    letterSpacing:  1,
    width:          '100%',
    textAlign:      'center',
  },
  winnerCard: {
    width:          '100%',
    padding:        '14px 12px',
    border:         '2px solid',
    background:     'var(--bg-inset)',
    display:        'flex',
    flexDirection:  'column',
    gap:            10,
    alignItems:     'center',
  },
  playerBadge: {
    fontSize:       8,
    color:          'var(--bg-deep)',
    background:     'var(--gold)',
    padding:        '4px 12px',
    letterSpacing:  1,
    textAlign:      'center',
    width:          '100%',
    boxSizing:      'border-box',
  },
  nextBtn: {
    width:          '100%',
    fontSize:       9,
    padding:        '12px',
    color:          'var(--bg-deep)',
    border:         'none',
    cursor:         'pointer',
    letterSpacing:  1,
    textAlign:      'center',
  },
  bottomRow: {
    display:        'flex',
    gap:            10,
    padding:        '0 16px 16px',
    justifyContent: 'center',
    flexShrink:     0,
    marginTop:      'auto',
  },
  ghostBtn: {
    fontSize:       8,
    padding:        '10px 16px',
    color:          'var(--lav)',
    background:     'transparent',
    border:         '1px solid var(--shadow)',
    cursor:         'pointer',
  },
  // Summary
  summaryScroll: {
    flex:           1,
    overflowY:      'auto',
    padding:        '12px 16px',
    display:        'flex',
    flexDirection:  'column',
    gap:            6,
  },
  sectionHead: {
    fontSize:       7,
    color:          'var(--lav)',
    textAlign:      'center',
    letterSpacing:  2,
    padding:        '4px 0 6px',
    borderBottom:   '1px solid var(--shadow)',
  },
  leaveBar: {
    padding:        '12px 16px 20px',
    flexShrink:     0,
    borderTop:      '2px solid var(--shadow)',
  },
  leaveBtn: {
    width:          '100%',
    fontSize:       10,
    padding:        '14px',
    background:     'var(--pink)',
    color:          'var(--bg-deep)',
    border:         '2px solid #8A2B52',
    cursor:         'pointer',
    textAlign:      'center',
    letterSpacing:  1,
  },
}
