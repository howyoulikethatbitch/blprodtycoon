/**
 * ProductionForm.jsx — Create a new production
 */
import React, { useState, useMemo } from 'react'
import { useGame, A, pushToast } from '../game/state.jsx'
import { PROD_TYPES, BUDGET_TIERS, GENRES, calcCost, createProduction } from '../game/productions.js'
import { calcChemistryBonus, chemTier, getBond } from '../game/chemistry.js'
import { canAssign, portraitUrl } from '../game/actors.js'
import { fmtMoney } from '../game/ranking.js'
import { SFX } from '../game/audio.js'

const BASE = import.meta.env.BASE_URL

export default function ProductionForm({ setScreen }) {
  const { state, dispatch } = useGame()

  const [prodType, setProdType]   = useState('drama')
  const [title, setTitle]         = useState('')
  const [genre, setGenre]         = useState('Romance')
  const [budget, setBudget]       = useState('standard')
  const [weeks, setWeeks]         = useState(6)
  const [castIds, setCastIds]     = useState([])

  const typeInfo   = PROD_TYPES[prodType]
  const budgetInfo = BUDGET_TIERS.find(b => b.id === budget)
  const cost       = calcCost(prodType, budget, weeks, castIds.length)
  const canAfford  = state.money >= cost

  const castActors = useMemo(
    () => state.actors.filter(a => castIds.includes(a.id)),
    [state.actors, castIds]
  )
  const chemBonus = useMemo(() => calcChemistryBonus(castActors), [castActors])
  const chemInfo  = chemTier(chemBonus * 10)

  function toggleActor(actorId) {
    SFX.click()
    setCastIds(prev =>
      prev.includes(actorId)
        ? prev.filter(id => id !== actorId)
        : [...prev, actorId]
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!canAfford) { SFX.fail(); return }
    if (!title.trim()) { SFX.fail(); pushToast(dispatch, 'Please enter a title.', 'red'); return }

    SFX.confirm()
    const prod = createProduction({
      type: prodType, title: title.trim(), genre, budget, weeks,
      castIds, weekStarted: state.week,
    })
    dispatch({ type: A.ADD_PRODUCTION, production: prod })
    dispatch({ type: A.ADD_MONEY, amount: -cost })

    // Mark actors as assigned / filming
    for (const id of castIds) {
      dispatch({ type: A.UPDATE_ACTOR, id, patch: { assignedTo: prod.id, status: 'filming' } })
    }

    pushToast(dispatch, `"${prod.title}" production started!`, 'green')
    setScreen('dashboard')
  }

  const availActors = state.actors.filter(a => canAssign(a) || castIds.includes(a.id))

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div className="panel">
        <div className="panel-title">🎬 NEW PRODUCTION</div>

        {/* Title */}
        <div className="field">
          <label>PRODUCTION TITLE</label>
          <input
            type="text"
            value={title}
            maxLength={40}
            onChange={e => setTitle(e.target.value)}
            placeholder="My BL Drama..."
            required
          />
        </div>

        {/* Type */}
        <div className="field">
          <label>TYPE</label>
          <div className="seg">
            {Object.entries(PROD_TYPES).map(([id, t]) => (
              <button key={id} type="button"
                className={prodType === id ? 'sel' : ''}
                onClick={() => { SFX.click(); setProdType(id); setWeeks(t.weeksMin + 1) }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Genre */}
        <div className="field">
          <label>GENRE</label>
          <select value={genre} onChange={e => setGenre(e.target.value)}>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>

        {/* Budget */}
        <div className="field">
          <label>BUDGET TIER</label>
          <div className="seg">
            {BUDGET_TIERS.map(b => (
              <button key={b.id} type="button"
                className={budget === b.id ? 'sel' : ''}
                onClick={() => { SFX.click(); setBudget(b.id) }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="field">
          <label>DURATION: {weeks} WEEKS</label>
          <input
            type="range"
            min={typeInfo.weeksMin}
            max={typeInfo.weeksMax}
            value={weeks}
            onChange={e => setWeeks(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: 'var(--lav)' }}>
            <span>{typeInfo.weeksMin}wk</span>
            <span>{typeInfo.weeksMax}wk</span>
          </div>
        </div>
      </div>

      {/* Cast selection */}
      <div className="panel">
        <div className="panel-title">⭐ CAST ({castIds.length} selected)</div>
        {availActors.length === 0 ? (
          <div style={{ fontSize: 8, color: 'var(--gray)', padding: '12px 0' }}>No available actors.</div>
        ) : (
          <div style={styles.castGrid}>
            {availActors.map(a => (
              <CastCard
                key={a.id}
                actor={a}
                selected={castIds.includes(a.id)}
                onToggle={() => toggleActor(a.id)}
                peers={castActors}
                base={BASE}
              />
            ))}
          </div>
        )}

        {/* Chemistry preview */}
        {castIds.length >= 2 && (
          <div style={styles.chemPreview}>
            <span style={{ color: 'var(--lav)', fontSize: 7 }}>CAST CHEMISTRY: </span>
            <span style={{ color: chemInfo.color, fontSize: 9 }}>{chemInfo.emoji} {chemInfo.label}</span>
            <span style={{ color: 'var(--gold)', fontSize: 8 }}> +{chemBonus} score bonus</span>
          </div>
        )}
      </div>

      {/* Cost preview */}
      <div className="cost-preview">
        <div>TYPE: {typeInfo.label} ({typeInfo.icon})</div>
        <div>BUDGET: {budgetInfo?.label} (×{budgetInfo?.mult})</div>
        <div>DURATION: {weeks} weeks</div>
        <div>CAST: {castIds.length} actors</div>
        <div style={{ borderTop: '1px dashed var(--gold)', marginTop: 6, paddingTop: 6 }}>
          <span style={{ color: canAfford ? 'var(--gold)' : 'var(--red)' }}>
            TOTAL COST: {fmtMoney(cost)}
          </span>
          {!canAfford && <span style={{ color: 'var(--red)', fontSize: 8 }}> (insufficient funds)</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          className="btn-primary"
          style={{ flex: 1, textAlign: 'center', fontSize: 11, padding: 16 }}
          disabled={!canAfford}
        >
          🎬 GREENLIGHT!
        </button>
        <button type="button" onClick={() => { SFX.click(); setScreen('dashboard') }} style={{ padding: '12px 16px' }}>
          ✕
        </button>
      </div>
    </form>
  )
}

function CastCard({ actor, selected, onToggle, peers, base }) {
  const borderColor = selected ? 'var(--pink)' : 'var(--shadow)'
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        ...styles.castCard,
        border: `3px solid ${borderColor}`,
        background: selected ? 'rgba(255,107,157,0.1)' : 'var(--bg-inset)',
      }}
    >
      <img
        src={`${base}images/actor_${String(actor.id).padStart(2, '0')}.jpg`}
        alt={actor.name}
        style={styles.miniPortrait}
        onError={e => { e.target.style.display = 'none' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, color: selected ? 'var(--pink)' : 'var(--white)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {actor.name}
        </div>
        <div style={{ fontSize: 7, color: 'var(--lav)' }}>
          {actor.tier}
        </div>
      </div>
      {selected && <span style={{ color: 'var(--pink)', fontSize: 14, flexShrink: 0 }}>✓</span>}
    </button>
  )
}

const styles = {
  castGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 8,
  },
  castCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    textAlign: 'left',
    cursor: 'pointer',
    minHeight: 52,
    boxShadow: 'none',
  },
  miniPortrait: {
    width: 36,
    height: 36,
    objectFit: 'cover',
    borderRadius: 2,
    flexShrink: 0,
    border: '2px solid var(--pink-dim)',
    imageRendering: 'pixelated',
  },
  chemPreview: {
    marginTop: 10,
    padding: 10,
    background: 'var(--bg-inset)',
    border: '2px solid var(--shadow)',
    fontSize: 8,
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
}
