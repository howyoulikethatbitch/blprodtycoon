/**
 * ActorProfile.jsx — Detailed actor page with full stats, bond map, history
 */
import React, { useMemo } from 'react'
import { useGame } from '../game/state.jsx'
import { effectiveStat, STAT_KEYS, STAT_LABELS, xpToNextLevel } from '../game/actors.js'
import { chemTier, getBond } from '../game/chemistry.js'
import { SFX } from '../game/audio.js'

const BASE = import.meta.env.BASE_URL

export default function ActorProfile({ actorId, onBack }) {
  const { state } = useGame()
  const actor = state.actors.find(a => a.id === actorId)

  if (!actor) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={onBack}>← BACK</button>
        <p style={{ marginTop: 16, color: 'var(--red)', fontSize: 9 }}>Actor not found.</p>
      </div>
    )
  }

  const isLocked = actor.locked

  // Productions this actor appeared in
  const appearances = useMemo(
    () => state.history.filter(h => h.castIds?.includes(actor.id)),
    [state.history, actor.id]
  )

  const xpNeeded = xpToNextLevel(actor.level)
  const xpPct = Math.min((actor.exp / xpNeeded) * 100, 100)

  // Bond list (sorted by value)
  const bonds = useMemo(() => {
    if (!actor.bond) return []
    return Object.entries(actor.bond)
      .map(([otherId, val]) => ({
        actor: state.actors.find(a => a.id === Number(otherId)),
        val,
      }))
      .filter(b => b.actor)
      .sort((a, b) => b.val - a.val)
  }, [actor.bond, state.actors])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Back button */}
      <button
        onClick={() => { SFX.click(); onBack() }}
        style={{ fontSize: 8, padding: '8px 12px', alignSelf: 'flex-start' }}
      >
        ← BACK TO ROSTER
      </button>

      {/* Identity panel */}
      <div className="panel">
        <div style={styles.identityRow}>
          <div style={styles.portraitWrap}>
            <img
              src={`${BASE}images/actor_${String(actor.id).padStart(2, '0')}.png`}
              alt={actor.name}
              style={{
                ...styles.bigPortrait,
                filter: isLocked ? 'brightness(0) opacity(0.7)' : 'none',
              }}
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>

          <div style={styles.identityInfo}>
            <div style={{ fontSize: 12, color: 'var(--pink)', marginBottom: 6 }}>
              {isLocked ? '???' : actor.name}
            </div>
            <div style={{ fontSize: 8, color: 'var(--lav)', marginBottom: 4 }}>
              {isLocked ? '???' : actor.archetype}
            </div>
            {!isLocked && actor.tags && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {actor.tags.map(t => (
                  <span key={t} className="tag-chip">{t}</span>
                ))}
              </div>
            )}
            <div style={{ fontSize: 8, color: 'var(--gold)' }}>
              Lv.{actor.level} · {appearances.length} productions
            </div>

            {/* XP bar */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 7, color: 'var(--lav)', marginBottom: 4 }}>
                EXP: {actor.exp} / {xpNeeded}
              </div>
              <div style={styles.xpTrack}>
                <div style={{ ...styles.xpFill, width: `${xpPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Status indicators */}
        {!isLocked && (
          <div style={styles.statusRow}>
            <StatusPill label="FATIGUE" value={actor.fatigue} max={100}
              color={actor.fatigue > 70 ? 'var(--red)' : 'var(--green)'} />
            <StatusPill label="MOOD" value={actor.mood} max={100}
              color={actor.mood > 60 ? 'var(--green)' : 'var(--gold)'} />
            <div style={styles.statusItem}>
              <span style={{ fontSize: 7, color: 'var(--lav)' }}>STATUS</span>
              <span style={{ fontSize: 8, color: actor.assignedTo ? 'var(--blue)' : 'var(--green)' }}>
                {actor.assignedTo ? '🎬 WORKING' : '✅ FREE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stats panel */}
      {!isLocked && (
        <div className="panel">
          <div className="panel-title">📊 STATS</div>
          {STAT_KEYS.map(key => {
            const base = actor.stats?.[key] ?? 0
            const eff  = effectiveStat(actor, key)
            return (
              <div key={key} className="stat-bar-wrap">
                <span className="bar-label">{STAT_LABELS[key]}</span>
                <div className="bar-track" style={{ flex: 1 }}>
                  <div className="bar-fill" style={{ width: `${eff}%` }} />
                </div>
                <span className="bar-val">
                  {eff}
                  {eff !== base && <span style={{ color: 'var(--lav)', fontSize: 6 }}> ({base})</span>}
                </span>
              </div>
            )
          })}
          <div style={{ fontSize: 7, color: 'var(--lav)', marginTop: 8 }}>
            * Effective stats account for fatigue & mood penalties
          </div>
        </div>
      )}

      {/* Chemistry / bonds */}
      {!isLocked && bonds.length > 0 && (
        <div className="panel">
          <div className="panel-title">💕 CHEMISTRY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bonds.slice(0, 8).map(({ actor: other, val }) => {
              const tier = chemTier(val)
              return (
                <div key={other.id} style={styles.bondRow}>
                  <img
                    src={`${BASE}images/actor_${String(other.id).padStart(2, '0')}.png`}
                    alt={other.name}
                    style={styles.tinyPortrait}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8, color: 'var(--white)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {other.locked ? '???' : other.name}
                    </div>
                    <div style={styles.bondTrack}>
                      <div style={{ ...styles.bondFill, width: `${val}%`, background: tier.color }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 8, color: tier.color, flexShrink: 0 }}>
                    {tier.emoji} {val}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Appearances */}
      {appearances.length > 0 && (
        <div className="panel">
          <div className="panel-title">🎬 FILMOGRAPHY</div>
          {appearances.map(h => (
            <div key={h.id} style={styles.filmRow}>
              <span style={{ fontSize: 9, color: 'var(--gold)', width: 24 }}>{h.grade}</span>
              <span style={{ flex: 1, fontSize: 8, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.title}
              </span>
              <span style={{ fontSize: 7, color: 'var(--lav)', flexShrink: 0 }}>Wk{h.weekCompleted}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusPill({ label, value, max, color }) {
  return (
    <div style={styles.statusItem}>
      <span style={{ fontSize: 7, color: 'var(--lav)' }}>{label}</span>
      <span style={{ fontSize: 8, color }}>{value}/{max}</span>
    </div>
  )
}

const styles = {
  identityRow: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
  },
  portraitWrap: {
    flexShrink: 0,
  },
  bigPortrait: {
    width: 128,
    height: 128,
    objectFit: 'cover',
    borderRadius: 4,
    border: '3px solid var(--pink)',
    imageRendering: 'pixelated',
    display: 'block',
  },
  identityInfo: { flex: 1, minWidth: 140 },
  xpTrack: {
    height: 8,
    background: 'var(--bg-inset)',
    border: '2px solid var(--shadow)',
  },
  xpFill: {
    height: '100%',
    background: 'var(--gold)',
    transition: 'width 0.4s ease',
  },
  statusRow: {
    display: 'flex',
    gap: 16,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  statusItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  bondRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 0',
    borderBottom: '1px solid var(--shadow)',
  },
  bondTrack: {
    height: 6,
    background: 'var(--bg-inset)',
    border: '1px solid var(--shadow)',
  },
  bondFill: { height: '100%', transition: 'width 0.3s' },
  tinyPortrait: {
    width: 32,
    height: 32,
    objectFit: 'cover',
    borderRadius: 2,
    border: '2px solid var(--pink-dim)',
    flexShrink: 0,
    imageRendering: 'pixelated',
  },
  filmRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '5px 0',
    borderBottom: '1px solid var(--shadow)',
  },
}
