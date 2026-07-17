/**
 * CompanyStatus.jsx — Company overview panel
 * Prompt 3: "Company Status" nav item
 */
import React from 'react'
import { useGame } from '../game/state.jsx'
import { fmtMoney, fmtPop, calcRank, rankProgress, RANKS } from '../game/ranking.js'
import { TIER_COLOR } from '../game/actors.js'
import { SFX } from '../game/audio.js'

export default function CompanyStatus({ setScreen }) {
  const { state } = useGame()
  const rank      = calcRank(state.reputation, state.popularity)
  const progress  = rankProgress(state.reputation, state.popularity)
  const nextRank  = RANKS[RANKS.findIndex(r => r.id === rank.id) + 1] ?? null

  const signedActors   = state.actors.filter(a => a.signed)
  const filmingActors  = signedActors.filter(a => a.status === 'filming')
  const activeProds    = state.productions.filter(p => p.status === 'active')

  // Tier breakdown of signed actors
  const byTier = ['Rookie', 'Rising Star', 'Popular', 'Worldwide'].map(tier => ({
    tier,
    count: signedActors.filter(a => a.tier === tier).length,
    color: TIER_COLOR[tier],
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Studio identity ── */}
      <div className="panel">
        <div className="panel-title">🏢 {state.companyName}</div>
        <div style={styles.grid2}>
          <BigStat label="TREASURY"    value={fmtMoney(state.money)}        color="var(--gold)" />
          <BigStat label="REPUTATION"  value={`${state.reputation}/100`}    color="var(--pink)" />
          <BigStat label="POPULARITY"  value={fmtPop(state.popularity)}     color="var(--blue)" />
          <BigStat label="WEEK"        value={`#${state.week}`}             color="var(--lav)"  />
          <BigStat label="AWARDS"      value={state.awards ?? 0}            color="var(--gold)" />
          <BigStat label="PRODUCTIONS" value={state.history.length}         color="var(--green)" />
        </div>
      </div>

      {/* ── Current rank + progress ── */}
      <div className="panel">
        <div className="panel-title">🏆 RANK STATUS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: rank.color }}>{rank.label}</span>
          {nextRank && (
            <span style={{ fontSize: 7, color: 'var(--lav)' }}>
              Next: <span style={{ color: nextRank.color }}>{nextRank.label}</span>
            </span>
          )}
        </div>
        <div style={styles.rankTrack}>
          <div style={{ ...styles.rankFill, width: `${progress * 100}%`, background: rank.color }} />
        </div>
        <div style={{ fontSize: 7, color: 'var(--lav)', marginTop: 6 }}>
          {Math.round(progress * 100)}% progress to next rank
        </div>
        {nextRank && (
          <div style={{ fontSize: 7, color: 'var(--gray)', marginTop: 4 }}>
            Needs: REP {nextRank.repMin} · POP {fmtPop(nextRank.popMin)}
          </div>
        )}
      </div>

      {/* ── Roster summary ── */}
      <div className="panel">
        <div className="panel-title">⭐ ROSTER ({signedActors.length} signed)</div>
        <div style={styles.tierRow}>
          {byTier.map(({ tier, count, color }) => (
            <div key={tier} style={styles.tierCell}>
              <span style={{ fontSize: 7, color }}>{tier === 'Rising Star' ? 'RISING' : tier.toUpperCase()}</span>
              <span style={{ fontSize: 16, color }}>{count}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <Chip label={`${filmingActors.length} filming`}  color="var(--blue)"  />
          <Chip label={`${signedActors.filter(a => a.status === 'available').length} available`} color="var(--green)" />
          <Chip label={`${signedActors.filter(a => a.status === 'resting').length} resting`}    color="var(--gold)"  />
          <Chip label={`${signedActors.filter(a => a.status === 'injured').length} injured`}    color="var(--red)"   />
        </div>
        <button
          style={{ marginTop: 12, fontSize: 8, padding: '8px 12px', width: '100%', textAlign: 'center' }}
          onClick={() => { SFX.click(); setScreen('actors') }}
        >
          ⭐ VIEW FULL ROSTER →
        </button>
      </div>

      {/* ── Active productions ── */}
      <div className="panel">
        <div className="panel-title">🎬 ACTIVE PRODUCTIONS ({activeProds.length})</div>
        {activeProds.length === 0 ? (
          <div style={{ fontSize: 8, color: 'var(--gray)', padding: '10px 0' }}>
            No productions running.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeProds.map(p => (
              <div key={p.id} style={styles.prodRow}>
                <span style={{ fontSize: 9, color: 'var(--white)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title}
                </span>
                <span style={{ fontSize: 7, color: 'var(--lav)', flexShrink: 0 }}>{p.weeksLeft}wk left</span>
              </div>
            ))}
          </div>
        )}
        <button
          className="btn-primary"
          style={{ marginTop: 12, fontSize: 8, padding: '10px 12px', width: '100%', textAlign: 'center' }}
          onClick={() => { SFX.click(); setScreen('produce') }}
        >
          🎬 NEW PRODUCTION
        </button>
      </div>

    </div>
  )
}

function BigStat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 6, color: 'var(--lav)', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 11, color }}>{value}</span>
    </div>
  )
}

function Chip({ label, color }) {
  return (
    <span style={{
      fontSize: 7, padding: '3px 7px',
      background: 'var(--bg-inset)',
      border: `1px solid ${color}`,
      color,
    }}>
      {label}
    </span>
  )
}

const styles = {
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginTop: 4,
  },
  rankTrack: {
    height:     10,
    background: 'var(--bg-inset)',
    border:     '2px solid var(--shadow)',
  },
  rankFill: {
    height:     '100%',
    transition: 'width 0.5s ease',
  },
  tierRow: {
    display:       'flex',
    justifyContent: 'space-between',
    gap:           8,
  },
  tierCell: {
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    flex:          1,
    gap:           4,
    padding:       '8px 4px',
    background:    'var(--bg-inset)',
    border:        '1px solid var(--shadow)',
  },
  prodRow: {
    display:    'flex',
    gap:        8,
    alignItems: 'center',
    padding:    '6px 0',
    borderBottom: '1px solid var(--shadow)',
  },
}
