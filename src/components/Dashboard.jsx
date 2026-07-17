/**
 * Dashboard.jsx — Home screen: active productions, quick stats, history
 */
import React from 'react'
import { useGame } from '../game/state.jsx'
import { fmtMoney, fmtPop, calcRank, rankProgress } from '../game/ranking.js'
import { PROD_TYPES, BUDGET_TIERS } from '../game/productions.js'
import { SFX } from '../game/audio.js'

export default function Dashboard({ setScreen }) {
  const { state } = useGame()
  const rank = calcRank(state.reputation, state.popularity)
  const progress = rankProgress(state.reputation, state.popularity)
  const active = state.productions.filter(p => p.status === 'active')
  const recent = [...state.history].reverse().slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Studio snapshot ── */}
      <div className="panel">
        <div className="panel-title">📊 STUDIO STATUS</div>
        <div style={styles.statsGrid}>
          <BigStat label="MONEY"      value={fmtMoney(state.money)}      color="var(--gold)" />
          <BigStat label="REPUTATION" value={`${state.reputation}/100`}  color="var(--pink)" />
          <BigStat label="POPULARITY" value={fmtPop(state.popularity)}   color="var(--gold)" />
          <BigStat label="WEEK"       value={`#${state.week}`}           color="var(--lav)"  />
        </div>

        {/* Rank bar */}
        <div style={{ marginTop: 14 }}>
          <div style={styles.rankRow}>
            <span style={{ color: rank.color, fontSize: 9 }}>{rank.label}</span>
            <span style={{ fontSize: 7, color: 'var(--lav)' }}>
              {Math.round(progress * 100)}% to next rank
            </span>
          </div>
          <div style={styles.rankTrack}>
            <div style={{ ...styles.rankFill, width: `${progress * 100}%`, background: rank.color }} />
          </div>
        </div>
      </div>

      {/* ── Active productions ── */}
      <div className="panel">
        <div className="panel-title">🎬 ACTIVE PRODUCTIONS</div>

        {active.length === 0 ? (
          <div style={styles.empty}>
            No productions running.{' '}
            <button
              style={{ fontSize: 8, padding: '6px 10px', display: 'inline' }}
              onClick={() => { SFX.click(); setScreen('produce') }}
            >
              Start one →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.map(p => <ProductionRow key={p.id} prod={p} actors={state.actors} />)}
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div style={styles.actionRow}>
        <button className="btn-primary" style={styles.actionBtn} onClick={() => { SFX.click(); setScreen('produce') }}>
          🎬 NEW PRODUCTION
        </button>
        <button style={styles.actionBtn} onClick={() => { SFX.click(); setScreen('actors') }}>
          ⭐ VIEW ACTORS
        </button>
      </div>

      {/* ── Recent history ── */}
      {recent.length > 0 && (
        <div className="panel">
          <div className="panel-title">📜 RECENT RESULTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map(h => <HistoryRow key={h.id} record={h} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function BigStat({ label, value, color }) {
  return (
    <div style={styles.bigStat}>
      <span style={{ fontSize: 7, color: 'var(--lav)', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color }}>{value}</span>
    </div>
  )
}

function ProductionRow({ prod, actors }) {
  const typeInfo = PROD_TYPES[prod.type] ?? {}
  const cast = actors.filter(a => prod.castIds.includes(a.id))
  return (
    <div style={styles.prodRow}>
      <div style={styles.prodIcon}>{typeInfo.icon ?? '🎬'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: 'var(--white)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {prod.title}
        </div>
        <div style={{ fontSize: 7, color: 'var(--lav)', marginBottom: 6 }}>
          {typeInfo.label} · {cast.length} actors · {prod.weeksLeft}wk left
        </div>
        <div style={styles.progTrack}>
          <div style={{ ...styles.progFill, width: `${prod.progressPct}%` }} />
        </div>
        <div style={{ fontSize: 7, color: 'var(--lav)', marginTop: 3 }}>{prod.progressPct}% complete</div>
      </div>
    </div>
  )
}

function HistoryRow({ record }) {
  const gradeColor = {
    'S+': '#FFD700', S: '#FFD700', A: '#5CE1A0',
     B: '#6BC5FF',   C: '#9B86C4', D: '#FF5470', F: '#FF5470',
  }
  return (
    <div style={styles.histRow}>
      <span style={{ color: gradeColor[record.grade] ?? 'var(--white)', fontSize: 12, width: 28 }}>
        {record.grade}
      </span>
      <span style={{ flex: 1, fontSize: 8, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {record.title}
      </span>
      <span style={{ fontSize: 8, color: 'var(--gold)', flexShrink: 0 }}>
        {record.revenue ? fmtMoney(record.revenue) : '—'}
      </span>
    </div>
  )
}

const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  bigStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  rankRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankTrack: {
    height: 10,
    background: 'var(--bg-inset)',
    border: '2px solid var(--shadow)',
  },
  rankFill: {
    height: '100%',
    transition: 'width 0.5s ease',
  },
  empty: {
    fontSize: 8,
    color: 'var(--gray)',
    textAlign: 'center',
    padding: '20px 0',
    lineHeight: 2.5,
  },
  actionRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  actionBtn: {
    textAlign: 'center',
    fontSize: 9,
    padding: '14px 8px',
  },
  prodRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    background: 'var(--bg-inset)',
    padding: 10,
    border: '2px solid var(--shadow)',
  },
  prodIcon: { fontSize: 24, flexShrink: 0 },
  progTrack: {
    height: 8,
    background: 'var(--bg-deep)',
    border: '1px solid var(--shadow)',
  },
  progFill: {
    height: '100%',
    background: 'var(--pink)',
    transition: 'width 0.4s ease',
  },
  histRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 0',
    borderBottom: '1px solid var(--shadow)',
  },
}
