/**
 * ActorRoster.jsx — Grid of all actors with status & quick stats
 */
import React, { useState } from 'react'
import { useGame } from '../game/state.jsx'
import { effectiveStat, STAT_LABELS, portraitUrl } from '../game/actors.js'
import { SFX } from '../game/audio.js'

const BASE = import.meta.env.BASE_URL

const FILTER_OPTIONS = ['ALL', 'AVAILABLE', 'WORKING', 'LOCKED']

export default function ActorRoster({ openProfile }) {
  const { state } = useGame()
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = state.actors.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'AVAILABLE') return a.available && !a.assignedTo
    if (filter === 'WORKING')   return !!a.assignedTo
    if (filter === 'LOCKED')    return a.locked
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div className="panel" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="panel-title" style={{ margin: 0, border: 'none', padding: 0 }}>
            ⭐ ACTORS ({state.actors.length})
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ flex: 1, minWidth: 100, fontSize: 8, padding: '6px 8px', minHeight: 36 }}
          />
        </div>
        <div className="seg" style={{ marginTop: 10 }}>
          {FILTER_OPTIONS.map(f => (
            <button key={f} type="button"
              className={filter === f ? 'sel' : ''}
              style={{ fontSize: 7, padding: '6px 8px' }}
              onClick={() => { SFX.click(); setFilter(f) }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ fontSize: 8, color: 'var(--gray)', textAlign: 'center', padding: 32 }}>
          No actors found.
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(a => (
            <ActorCard
              key={a.id}
              actor={a}
              onClick={() => { SFX.click(); openProfile(a.id) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ActorCard({ actor, onClick }) {
  const isLocked    = actor.locked
  const isWorking   = !!actor.assignedTo
  const isAvailable = actor.available && !actor.assignedTo && !actor.locked

  const borderColor = isLocked    ? 'var(--gray)'
                    : isWorking   ? 'var(--blue)'
                    : isAvailable ? 'var(--pink)'
                    : 'var(--gray)'

  const statusLabel = isLocked    ? '🔒 LOCKED'
                    : isWorking   ? '🎬 WORKING'
                    : isAvailable ? '✅ FREE'
                    : '😴 TIRED'

  return (
    <button
      onClick={onClick}
      style={{ ...styles.card, border: `3px solid ${borderColor}` }}
    >
      {/* Portrait */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={`${BASE}images/actor_${String(actor.id).padStart(2,'0')}.png`}
          alt={actor.name}
          style={{
            ...styles.portrait,
            filter: isLocked ? 'brightness(0) opacity(0.6)' : 'none',
          }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <div style={{ ...styles.statusBadge, color: borderColor }}>{statusLabel}</div>
      </div>

      {/* Info */}
      <div style={styles.info}>
        <div style={{ fontSize: 9, color: 'var(--white)', marginBottom: 4 }}>
          {isLocked ? '???' : actor.name}
        </div>
        <div style={{ fontSize: 7, color: 'var(--lav)', marginBottom: 6 }}>
          {isLocked ? '???' : actor.archetype} · Lv.{actor.level}
        </div>

        {!isLocked && (
          <>
            {/* Mini stat bars */}
            {['act', 'charm'].map(key => (
              <MiniBar
                key={key}
                label={STAT_LABELS[key]}
                value={effectiveStat(actor, key)}
              />
            ))}
            {/* Fatigue */}
            <div style={styles.fatigueRow}>
              <span style={{ fontSize: 7, color: 'var(--lav)' }}>FATIGUE</span>
              <span style={{ fontSize: 7, color: actor.fatigue > 70 ? 'var(--red)' : 'var(--green)' }}>
                {actor.fatigue}%
              </span>
            </div>
          </>
        )}
      </div>
    </button>
  )
}

function MiniBar({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
      <span style={{ fontSize: 6, color: 'var(--lav)', width: 26 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-inset)', border: '1px solid var(--shadow)' }}>
        <div style={{ width: `${value}%`, height: '100%', background: 'var(--pink)', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 6, color: 'var(--white)', width: 18, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
    gap: 12,
  },
  card: {
    display: 'flex',
    gap: 10,
    background: 'var(--bg-panel)',
    padding: 12,
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '4px 4px 0 rgba(0,0,0,0.35)',
    alignItems: 'flex-start',
  },
  portrait: {
    width: 64,
    height: 64,
    objectFit: 'cover',
    borderRadius: 4,
    imageRendering: 'pixelated',
    display: 'block',
  },
  info: { flex: 1, minWidth: 0 },
  statusBadge: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    fontSize: 6,
    textAlign: 'center',
    background: 'var(--bg-deep)',
    padding: '1px 0',
  },
  fatigueRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 4,
  },
}
