/**
 * ModalSystem.jsx — Global modal queue renderer
 * Handles: productionResult, rankUp, event, generic confirm
 */
import React from 'react'
import { useGame, A } from '../game/state.jsx'
import { fmtMoney } from '../game/ranking.js'
import { SFX } from '../game/audio.js'

export default function ModalSystem() {
  const { state, dispatch } = useGame()
  const [modal] = state.modalQueue

  if (!modal) return null

  function dismiss() {
    SFX.click()
    dispatch({ type: A.POP_MODAL })
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && dismiss()}>
      {modal.type === 'productionResult' && (
        <ProductionResultModal data={modal.data} onClose={dismiss} />
      )}
      {modal.type === 'rankUp' && (
        <RankUpModal data={modal.data} onClose={dismiss} />
      )}
      {modal.type === 'event' && (
        <EventModal data={modal.data} onClose={dismiss} dispatch={dispatch} state={state} />
      )}
      {modal.type === 'generic' && (
        <GenericModal data={modal.data} onClose={dismiss} />
      )}
    </div>
  )
}

// ── Production Result ─────────────────────────────────────────────────────────
function ProductionResultModal({ data, onClose }) {
  const { prod, eval: ev, score, revenue } = data
  return (
    <div className="modal-box">
      <div className="modal-title">🎬 PRODUCTION COMPLETE</div>
      <button className="modal-close" onClick={onClose}>✕</button>

      <div style={{ fontSize: 11, color: ev.color, textAlign: 'center', marginBottom: 12 }}>
        {ev.grade} — {ev.label}
      </div>

      <div style={{ fontSize: 8, color: 'var(--lav)', textAlign: 'center', fontStyle: 'italic', marginBottom: 16, lineHeight: 2 }}>
        {ev.criticQuote}
      </div>

      <div style={styles.resultGrid}>
        <ResultStat label="SCORE"     value={`${score}/100`}        color="var(--pink)" />
        <ResultStat label="REVENUE"   value={fmtMoney(revenue)}     color="var(--gold)" />
        <ResultStat label="REP Δ"     value={`${ev.repDelta >= 0 ? '+' : ''}${ev.repDelta}`} color={ev.repDelta >= 0 ? 'var(--green)' : 'var(--red)'} />
        <ResultStat label="POP Δ"     value={`+${ev.popDelta.toLocaleString()}`} color="var(--blue)" />
        <ResultStat label="XP/ACTOR"  value={`+${ev.xpPerActor}`}  color="var(--lav)" />
      </div>

      <div style={{ marginTop: 14, fontSize: 8, color: 'var(--lav)', borderTop: '1px solid var(--shadow)', paddingTop: 10 }}>
        <div>Title: <span style={{ color: 'var(--white)' }}>{prod.title}</span></div>
        <div>Genre: <span style={{ color: 'var(--white)' }}>{prod.genre}</span></div>
        <div>Cast:  <span style={{ color: 'var(--white)' }}>{prod.castIds.length} actors</span></div>
      </div>

      <button
        className="btn-primary"
        style={styles.closeBtn}
        onClick={onClose}
      >
        ▶ CONTINUE
      </button>
    </div>
  )
}

// ── Rank Up ───────────────────────────────────────────────────────────────────
function RankUpModal({ data, onClose }) {
  const { rank } = data
  return (
    <div className="modal-box" style={{ textAlign: 'center' }}>
      <div className="modal-title">🏆 RANK UP!</div>
      <button className="modal-close" onClick={onClose}>✕</button>

      <div style={{ fontSize: 32, margin: '16px 0' }}>🎉</div>
      <div style={{ fontSize: 10, color: 'var(--gold)', marginBottom: 8 }}>
        STUDIO STATUS INCREASED
      </div>
      <div style={{ fontSize: 14, color: rank.color, marginBottom: 20 }}>
        {rank.label}
      </div>
      <div style={{ fontSize: 8, color: 'var(--lav)', marginBottom: 20 }}>
        Your reputation and reach have grown.<br />New opportunities await!
      </div>

      <button className="btn-gold" style={styles.closeBtn} onClick={onClose}>
        ✨ AMAZING!
      </button>
    </div>
  )
}

// ── Random Event ──────────────────────────────────────────────────────────────
function EventModal({ data, onClose, dispatch, state }) {
  function choose(choice) {
    SFX.confirm()
    try { choice.effect(state, dispatch) } catch (e) { console.error(e) }
    onClose()
  }

  return (
    <div className="modal-box">
      <div className="modal-title">{data.label ?? '📰 EVENT'}</div>

      <div style={{ fontSize: 8, color: 'var(--white)', lineHeight: 2, marginBottom: 16 }}>
        {data.message}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(data.choices ?? []).map((c, i) => (
          <button
            key={i}
            style={{ textAlign: 'center', fontSize: 8, padding: '12px' }}
            onClick={() => choose(c)}
          >
            {c.label}
          </button>
        ))}
        {(!data.choices || data.choices.length === 0) && (
          <button className="btn-primary" style={styles.closeBtn} onClick={onClose}>
            OK
          </button>
        )}
      </div>
    </div>
  )
}

// ── Generic ───────────────────────────────────────────────────────────────────
function GenericModal({ data, onClose }) {
  return (
    <div className="modal-box">
      <div className="modal-title">{data.title ?? 'Notice'}</div>
      <button className="modal-close" onClick={onClose}>✕</button>
      <div style={{ fontSize: 8, color: 'var(--white)', lineHeight: 2, marginBottom: 16 }}>
        {data.message}
      </div>
      <button className="btn-primary" style={styles.closeBtn} onClick={onClose}>
        OK
      </button>
    </div>
  )
}

// ── Result stat cell ──────────────────────────────────────────────────────────
function ResultStat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
      <span style={{ fontSize: 7, color: 'var(--lav)' }}>{label}</span>
      <span style={{ fontSize: 11, color }}>{value}</span>
    </div>
  )
}

const styles = {
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    textAlign: 'center',
    background: 'var(--bg-inset)',
    padding: 12,
    border: '2px solid var(--shadow)',
  },
  closeBtn: {
    width: '100%',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 10,
    padding: 14,
  },
}
