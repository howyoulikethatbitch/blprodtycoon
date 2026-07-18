/**
 * ActorProfile.jsx — Detailed actor page with full stats, chemistry map, filmography
 * Updated for Prompt 2: 8 skills, characteristics, chemistry_map, mood emoji.
 */
import React, { useMemo } from 'react'
import { useGame } from '../game/state.jsx'
import { SKILL_KEYS, SKILL_LABELS, STATUS_LABEL, STATUS_COLOR, TIER_COLOR, moodEmoji } from '../game/actors.js'
import { getChem, chemTier } from '../game/chemistry.js'
import { SFX } from '../game/audio.js'
import { ActorPortrait } from './ActorRoster.jsx'

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

  const isLocked   = !actor.signed
  const status     = actor.status ?? (isLocked ? 'locked' : 'available')
  const tierColor  = TIER_COLOR[actor.tier] ?? 'var(--lav)'
  const mood       = moodEmoji(actor.happiness ?? 70)

  // Productions this actor appeared in
  const appearances = useMemo(
    () => state.history.filter(h => h.castIds?.includes(actor.id)),
    [state.history, actor.id]
  )

  // 3.1: Chemistry only shown when actor is filming; only show CP partner
  const isFilming = actor.status === 'filming'

  const cpChemInfo = useMemo(() => {
    if (!isFilming) return null
    // Find their active production
    const activeProd = state.productions.find(
      p => p.status === 'active' && (p.castIds ?? []).includes(actor.id)
    )
    if (!activeProd) return null
    const leadIds = activeProd.leadIds ?? []
    // Find the partner (other lead)
    const partnerId = leadIds.find(id => id !== actor.id)
    if (!partnerId) return { partner: null, val: 0 }
    const partner = state.actors.find(a => a.id === partnerId)
    if (!partner) return { partner: null, val: 0 }
    return { partner, val: getChem(actor, partner.id) }
  }, [actor, state.actors, state.productions, isFilming])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Back button */}
      <button
        onClick={() => { SFX.click(); onBack() }}
        style={{ fontSize: 8, padding: '8px 12px', alignSelf: 'flex-start' }}
      >
        ← BACK TO ROSTER
      </button>

      {/* ── Identity panel ── */}
      <div className="panel">
        <div style={styles.identityRow}>
          {/* Portrait */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ActorPortrait actor={actor} size={120} isLocked={isLocked}
              style={{ border: `3px solid ${isLocked ? 'var(--gray)' : tierColor}` }}
            />
            {actor.tier === 'Worldwide' && !isLocked && (
              <div style={styles.wwGlow} />
            )}
          </div>

          <div style={styles.identityInfo}>
            {/* Name + mood */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: isLocked ? 'var(--gray)' : 'var(--pink)' }}>
                {isLocked ? '???' : actor.name}
              </span>
              {!isLocked && <span style={{ fontSize: 20 }}>{mood}</span>}
            </div>

            {/* Tier badge */}
            <div style={{ fontSize: 8, color: tierColor, marginBottom: 6 }}>
              {actor.tier}
              {actor.tier === 'Worldwide' && (
                <span style={{ color: 'var(--gold)', marginLeft: 6 }}>★ $150/wk retainer</span>
              )}
            </div>

            {/* Characteristics */}
            {!isLocked && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {(actor.characteristics ?? []).map(c => (
                  <span key={c} className="tag-chip">{c}</span>
                ))}
              </div>
            )}

            {/* Status */}
            <div style={{ fontSize: 8, color: STATUS_COLOR[status] ?? 'var(--gray)', marginBottom: 6 }}>
              {STATUS_LABEL[status]}
            </div>

            {/* Productions count + awards */}
            {!isLocked && (
              <div style={{ fontSize: 7, color: 'var(--gold)' }}>
                {appearances.length} production{appearances.length !== 1 ? 's' : ''}
                {(actor.awards ?? 0) > 0 && ` · ${actor.awards} 🏆`}
              </div>
            )}

            {/* Locked info */}
            {isLocked && (
              <div style={{ fontSize: 7, color: 'var(--gray)', marginTop: 4 }}>
                Appears at Audition Weeks<br />
                Sign cost: ₩{(actor.signCost ?? 0).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats panel ── */}
      {!isLocked && (
        <div className="panel">
          <div className="panel-title">📊 SKILLS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
            {SKILL_KEYS.map(key => (
              <SkillBar
                key={key}
                label={SKILL_LABELS[key]}
                value={actor.skills?.[key] ?? 0}
                tier={actor.tier}
              />
            ))}
          </div>
          <div style={{ fontSize: 7, color: 'var(--lav)', marginTop: 8 }}>
            Sign cost: ₩{(actor.signCost ?? 0).toLocaleString()}
          </div>
        </div>
      )}

      {/* ── Chemistry panel — 3.1: only visible when actor is actively filming ── */}
      {!isLocked && isFilming && (
        <div className="panel">
          <div className="panel-title">💕 CHEMISTRY (ON-SET)</div>
          {cpChemInfo?.partner ? (() => {
            const { partner, val } = cpChemInfo
            const tier = chemTier(val)
            return (
              <div>
                <div style={styles.chemRow}>
                  <ActorPortrait actor={partner} size={32} isLocked={!partner.signed} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 7, color: 'var(--white)', marginBottom: 3 }}>
                      {partner.name} (CP Partner)
                    </div>
                    <div style={styles.chemTrack}>
                      <div style={{ ...styles.chemFill, width: `${val}%`, background: tier.color }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 8, color: tier.color, flexShrink: 0, textAlign: 'right' }}>
                    <div>{tier.emoji} {val}</div>
                    <div style={{ fontSize: 6 }}>{tier.label}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 7, color: 'var(--lav)' }}>
                  ★ Chemistry grows through filming together. Revealed fully after production.
                </div>
              </div>
            )
          })() : (
            <div style={{ fontSize: 8, color: 'var(--gray)', padding: '8px 0' }}>
              No CP assigned for current production.
            </div>
          )}
        </div>
      )}
      {!isLocked && !isFilming && (
        <div className="panel" style={{ opacity: 0.55 }}>
          <div className="panel-title">💕 CHEMISTRY</div>
          <div style={{ fontSize: 7, color: 'var(--gray)', padding: '6px 0' }}>
            Chemistry details are only visible while this actor is in an active production.
          </div>
        </div>
      )}

      {/* ── Filmography ── */}
      {appearances.length > 0 && (
        <div className="panel">
          <div className="panel-title">🎬 FILMOGRAPHY</div>
          {appearances.map(h => (
            <FilmRow key={h.id} record={h} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Skill bar with tier-coloured fill ────────────────────────────────────────
function SkillBar({ label, value, tier }) {
  const fillColor =
    tier === 'Worldwide'   ? 'var(--gold)'  :
    tier === 'Popular'     ? 'var(--pink)'  :
    tier === 'Rising Star' ? 'var(--blue)'  :
    'var(--lav)'

  return (
    <div className="stat-bar-wrap">
      <span className="bar-label" style={{ width: 28 }}>{label}</span>
      <div className="bar-track" style={{ flex: 1 }}>
        <div className="bar-fill" style={{ width: `${value}%`, background: fillColor }} />
      </div>
      <span className="bar-val">{value}</span>
    </div>
  )
}

function FilmRow({ record }) {
  const gradeColor = {
    'S+': '#FFD700', S: '#FFD700', A: '#5CE1A0',
     B: '#6BC5FF',  C: '#9B86C4', D: '#FF5470', F: '#FF5470',
  }
  return (
    <div style={styles.filmRow}>
      <span style={{ color: gradeColor[record.grade] ?? 'var(--white)', fontSize: 12, width: 24 }}>
        {record.grade}
      </span>
      <span style={{ flex: 1, fontSize: 8, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {record.title}
      </span>
      <span style={{ fontSize: 7, color: 'var(--lav)', flexShrink: 0 }}>Wk{record.weekCompleted}</span>
    </div>
  )
}

const styles = {
  identityRow: {
    display:  'flex',
    gap:      14,
    flexWrap: 'wrap',
  },
  identityInfo: {
    flex:    1,
    minWidth: 140,
  },
  wwGlow: {
    position:   'absolute',
    inset:      -4,
    borderRadius: 6,
    boxShadow:  '0 0 18px rgba(255,215,0,0.5)',
    pointerEvents: 'none',
  },
  chemRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        8,
    padding:    '3px 0',
    borderBottom: '1px solid var(--shadow)',
  },
  chemTrack: {
    height:     6,
    background: 'var(--bg-inset)',
    border:     '1px solid var(--shadow)',
  },
  chemFill: {
    height:     '100%',
    transition: 'width 0.3s',
  },
  filmRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        10,
    padding:    '5px 0',
    borderBottom: '1px solid var(--shadow)',
  },
}
