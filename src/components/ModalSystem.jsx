/**
 * ModalSystem.jsx — Global modal queue renderer
 * Prompt 5: productionResult now shows four critics, fan reviews, social posts, awards.
 */
import React, { useState } from 'react'
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

// ── Production Result — Four Critics ─────────────────────────────────────────
function ProductionResultModal({ data, onClose }) {
  const { prod, eval: ev, score, revenue } = data
  const [tab, setTab] = useState('critics')    // 'critics' | 'fans' | 'social'

  const hasCritics = ev.critics?.length === 4
  const awarded    = ev.awarded
  const avgStars   = ev.avgStars ?? 0

  return (
    <div className="modal-box" style={{ maxHeight: '90dvh', overflowY: 'auto', padding: 0 }}>

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>🎬 FINAL CRITIQUE</div>
        <button className="modal-close" onClick={onClose} style={{ position: 'static', marginLeft: 'auto' }}>✕</button>
      </div>

      <div style={{ padding: '0 14px 14px' }}>

        {/* Production title & grade */}
        <div style={styles.gradeRow}>
          <div>
            <div style={{ fontSize: 8, color: 'var(--lav)', marginBottom: 2 }}>{prod.title}</div>
            <div style={{ fontSize: 14, color: ev.color }}>{ev.grade} — {ev.label}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StarDisplay stars={avgStars} />
            <div style={{ fontSize: 7, color: 'var(--lav)' }}>{avgStars}/5 avg</div>
          </div>
        </div>

        {/* Awards banner */}
        {awarded && (
          <div style={styles.awardBanner}>
            🏆 INDUSTRY AWARD — Studio earns +10 rep · +₩3,000 · cast awarded!
          </div>
        )}

        {/* Tabs */}
        {hasCritics && (
          <div className="seg" style={{ marginBottom: 12 }}>
            {[
              { id: 'critics', label: '📝 Critics' },
              { id: 'fans',    label: '💬 Reviews' },
              { id: 'social',  label: '📱 Social'  },
            ].map(t => (
              <button key={t.id} type="button"
                className={tab === t.id ? 'sel' : ''}
                style={{ fontSize: 7, flex: 1, textAlign: 'center' }}
                onClick={() => { SFX.click(); setTab(t.id) }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Critics tab ── */}
        {tab === 'critics' && hasCritics && (
          <div style={styles.criticsGrid}>
            {ev.critics.map(c => (
              <CriticCard key={c.id} critic={c} />
            ))}
          </div>
        )}

        {/* ── Fan reviews tab ── */}
        {tab === 'fans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(ev.fanReviews ?? []).map((r, i) => (
              <div key={i} style={styles.reviewCard}>
                <div style={{ fontSize: 7, color: 'var(--lav)', lineHeight: 2 }}>{r}</div>
              </div>
            ))}
            {(!ev.fanReviews || ev.fanReviews.length === 0) && (
              <div style={{ fontSize: 8, color: 'var(--gray)', textAlign: 'center', padding: '16px 0' }}>
                No fan reviews yet.
              </div>
            )}
          </div>
        )}

        {/* ── Social posts tab ── */}
        {tab === 'social' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(ev.socialPosts ?? []).map((p, i) => (
              <div key={i} style={styles.socialCard}>
                <div style={{ fontSize: 7, color: 'var(--white)', lineHeight: 2 }}>{p}</div>
              </div>
            ))}
            {(!ev.socialPosts || ev.socialPosts.length === 0) && (
              <div style={{ fontSize: 8, color: 'var(--gray)', textAlign: 'center', padding: '16px 0' }}>
                Nothing trending yet.
              </div>
            )}
          </div>
        )}

        {/* Fallback — no critics data */}
        {!hasCritics && (
          <div style={{ fontSize: 8, color: 'var(--lav)', textAlign: 'center', fontStyle: 'italic', marginBottom: 16, lineHeight: 2 }}>
            {ev.criticQuote}
          </div>
        )}

        {/* ── Stats bar ── */}
        <div style={styles.statsBar}>
          <Stat label="SCORE"    value={`${score}/100`}          color="var(--pink)"  />
          <Stat label="REVENUE"  value={fmtMoney(revenue)}       color="var(--gold)"  />
          <Stat label="REP Δ"    value={delta(ev.repDelta)}      color={ev.repDelta >= 0 ? 'var(--green)' : 'var(--red)'} />
          <Stat label="POP Δ"    value={`+${(ev.popDelta ?? 0).toLocaleString()}`} color="var(--blue)" />
          <Stat label="XP"       value={`+${ev.xpPerActor ?? 0}/actor`} color="var(--lav)" />
        </div>

        {/* Details */}
        <div style={styles.detailRow}>
          <span style={{ color: 'var(--lav)' }}>Genre:</span> {prod.genre}
          {prod.cpName && <> · <span style={{ color: 'var(--pink)' }}>♥ {prod.cpName}</span></>}
          {prod.platform && <> · <span style={{ color: 'var(--lav)' }}>{prod.platform.toUpperCase()}</span></>}
        </div>

        <button className="btn-primary" style={styles.closeBtn} onClick={onClose}>
          ▶ CONTINUE
        </button>
      </div>
    </div>
  )
}

// ─── Critic card ──────────────────────────────────────────────────────────────
function CriticCard({ critic }) {
  const starColor = critic.stars >= 4 ? 'var(--gold)' : critic.stars >= 3 ? 'var(--pink)' : 'var(--gray)'
  return (
    <div style={styles.criticCard}>
      <div style={styles.criticHeader}>
        <span style={{ fontSize: 18 }}>{critic.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8, color: 'var(--white)' }}>{critic.name}</div>
          <div style={{ fontSize: 6, color: 'var(--lav)' }}>{critic.role}</div>
        </div>
      </div>
      <StarDisplay stars={critic.stars} color={starColor} size={18} />
      <div style={{ fontSize: 6, color: 'var(--gray)', marginTop: 6, fontStyle: 'italic', lineHeight: 1.8 }}>
        {critic.quote}
      </div>
    </div>
  )
}

// ─── Star display ─────────────────────────────────────────────────────────────
function StarDisplay({ stars, color = 'var(--gold)', size = 14 }) {
  const full  = Math.floor(stars)
  const half  = (stars % 1) >= 0.5 ? 1 : 0
  const empty = Math.max(0, 5 - full - half)
  return (
    <span style={{ fontSize: size, color, letterSpacing: 1, lineHeight: 1 }}>
      {'★'.repeat(full)}
      {half ? <span style={{ opacity: 0.6 }}>★</span> : null}
      <span style={{ opacity: 0.25 }}>{'★'.repeat(empty)}</span>
    </span>
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
      <div style={{ fontSize: 10, color: 'var(--gold)', marginBottom: 8 }}>STUDIO STATUS INCREASED</div>
      <div style={{ fontSize: 14, color: rank.color, marginBottom: 20 }}>{rank.label}</div>
      <div style={{ fontSize: 8, color: 'var(--lav)', marginBottom: 20 }}>
        Your reputation and reach have grown.<br />New opportunities await!
      </div>
      <button className="btn-gold" style={styles.closeBtn} onClick={onClose}>✨ AMAZING!</button>
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
          <button key={i} style={{ textAlign: 'center', fontSize: 8, padding: '12px' }} onClick={() => choose(c)}>
            {c.label}
          </button>
        ))}
        {(!data.choices || data.choices.length === 0) && (
          <button className="btn-primary" style={styles.closeBtn} onClick={onClose}>OK</button>
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
      <div style={{ fontSize: 8, color: 'var(--white)', lineHeight: 2, marginBottom: 16, whiteSpace: 'pre-line' }}>
        {data.message}
      </div>
      <button className="btn-primary" style={styles.closeBtn} onClick={onClose}>OK</button>
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
      <span style={{ fontSize: 6, color: 'var(--lav)' }}>{label}</span>
      <span style={{ fontSize: 9, color }}>{value}</span>
    </div>
  )
}

function delta(n) {
  return `${n >= 0 ? '+' : ''}${n}`
}

const styles = {
  header: {
    display:        'flex',
    alignItems:     'center',
    padding:        '12px 14px 10px',
    borderBottom:   '2px solid var(--shadow)',
    position:       'sticky',
    top:            0,
    background:     'var(--bg-panel)',
    zIndex:         2,
  },
  headerTitle: {
    fontSize: 10,
    color:    'var(--pink)',
  },
  gradeRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    margin:         '12px 0 10px',
  },
  awardBanner: {
    background:   'rgba(255,215,0,0.12)',
    border:       '2px solid var(--gold)',
    color:        'var(--gold)',
    fontSize:     7,
    padding:      '7px 10px',
    textAlign:    'center',
    marginBottom: 12,
    lineHeight:   2,
  },
  criticsGrid: {
    display:               'grid',
    gridTemplateColumns:   'repeat(2, 1fr)',
    gap:                   10,
    marginBottom:          12,
  },
  criticCard: {
    background:  'var(--bg-inset)',
    border:      '2px solid var(--shadow)',
    padding:     '8px 10px',
    display:     'flex',
    flexDirection: 'column',
    gap:         4,
  },
  criticHeader: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        6,
    marginBottom: 4,
  },
  reviewCard: {
    background: 'var(--bg-inset)',
    border:     '1px solid var(--shadow)',
    padding:    '8px 10px',
    borderLeft: '3px solid var(--pink)',
  },
  socialCard: {
    background: 'var(--bg-inset)',
    border:     '1px solid var(--shadow)',
    padding:    '8px 10px',
    borderLeft: '3px solid var(--blue)',
  },
  statsBar: {
    display:      'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap:          8,
    textAlign:    'center',
    background:   'var(--bg-inset)',
    padding:      10,
    border:       '2px solid var(--shadow)',
    margin:       '12px 0 8px',
  },
  detailRow: {
    fontSize: 7,
    color:    'var(--white)',
    marginBottom: 12,
  },
  closeBtn: {
    width:     '100%',
    textAlign: 'center',
    fontSize:  10,
    padding:   14,
  },
}

// Inject responsive CSS for critic grid on mobile
if (typeof document !== 'undefined') {
  const id = 'critic-modal-css'
  if (!document.getElementById(id)) {
    const s = document.createElement('style')
    s.id = id
    s.textContent = `
      @media (max-width: 480px) {
        .critics-grid-2col { grid-template-columns: 1fr !important; }
      }
    `
    document.head.appendChild(s)
  }
}
