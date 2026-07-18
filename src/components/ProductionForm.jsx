/**
 * ProductionForm.jsx — Create a new production
 * Prompt 4: Lead1/Lead2 dropdowns, CP name, chemistry preview, schedule/platform/rating/story,
 *           title auto-suggest, budget slider, live cost preview.
 */
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useGame, A, pushToast } from '../game/state.jsx'
import {
  PROD_TYPES, SCHEDULES, PLATFORMS, RATINGS, GENRES, GENRE_EMOJI, STORY_TYPES,
  BUDGET_TIERS, TITLE_POOL, calcCost, createProduction,
  genCpName, getComboResult, DEFAULT_GENRES,
} from '../game/productions.js'
import { getGameTierByRank } from '../game/tiers.js'
import { calcChemistryBonus, chemTier, getChem } from '../game/chemistry.js'
import { canAssign, moodEmoji } from '../game/actors.js'
import { fmtMoney } from '../game/ranking.js'
import { SFX } from '../game/audio.js'
import { ActorPortrait } from './ActorRoster.jsx'

const BASE = import.meta.env.BASE_URL

const DEFAULT_BUDGET = 1.0
const BUDGET_MIN     = 0.5
const BUDGET_MAX     = 3.0  // Prompt 3: increased from 2.5

// 5.1: Pick 3 random title suggestions fresh on each component mount
function pickRandomTitles() {
  const shuffled = [...TITLE_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

// Fixed CP signing cost: 30% of average sign cost of both leads
function fixedCpCost(lead1, lead2) {
  if (!lead1 || !lead2) return 0
  return Math.round(((lead1.signCost ?? 200) + (lead2.signCost ?? 200)) * 0.3)
}

export default function ProductionForm({ setScreen }) {
  const { state, dispatch } = useGame()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [prodType,  setProdType]  = useState('series')
  const [title,     setTitle]     = useState('')
  const [genre,     setGenre]     = useState('Romance')
  const [story,     setStory]     = useState('original')
  const [schedule,  setSchedule]  = useState('6m')
  const [platform,  setPlatform]  = useState('tv')
  const [rating,    setRating]    = useState('pg13')
  const [budgetMult,setBudgetMult]= useState(DEFAULT_BUDGET)
  const [lead1Id,   setLead1Id]   = useState('')
  const [lead2Id,   setLead2Id]   = useState('')
  const [cpName,    setCpName]    = useState('')
  const [cpEdited,  setCpEdited]  = useState(false)
  const [showChem,  setShowChem]  = useState(true)
  const [cpFixed,       setCpFixed]       = useState(false)
  const [showGenrePick, setShowGenrePick] = useState(false)  // genre select modal
  const [showSlotMachine, setShowSlotMachine] = useState(false)  // random genre modal

  // 5.1: Randomized title suggestions (fresh on mount, never change during session)
  const [titleSuggestions] = useState(pickRandomTitles)

  const titleRef = useRef(null)

  // Available actors (signed + available)
  const availableActors = useMemo(
    () => state.actors.filter(canAssign),
    [state.actors]
  )

  // Auto-generate CP name when leads change
  const lead1 = state.actors.find(a => a.id === Number(lead1Id))
  const lead2 = state.actors.find(a => a.id === Number(lead2Id))

  useEffect(() => {
    if (!cpEdited) {
      setCpName(genCpName(lead1?.name ?? '', lead2?.name ?? ''))
    }
  }, [lead1Id, lead2Id, cpEdited])

  // Prompt 5: CP auto-fill — when a lead with a fixed CP is selected,
  // automatically fill the partner slot.
  const [lead2FixedLocked, setLead2FixedLocked] = useState(false)
  const [lead1FixedLocked, setLead1FixedLocked] = useState(false)

  function findFixedPartner(actorId) {
    if (!actorId) return null
    const id = Number(actorId)
    for (const [x, y] of (state.fixedCPs ?? [])) {
      if (x === id) return y
      if (y === id) return x
    }
    return null
  }

  function handleLead1Change(v) {
    SFX.click()
    setLead1Id(v)
    setCpEdited(false)
    setLead1FixedLocked(false)
    const partner = findFixedPartner(v)
    if (partner) {
      setLead2Id(String(partner))
      setLead2FixedLocked(true)
    } else {
      setLead2FixedLocked(false)
    }
  }

  function handleLead2Change(v) {
    SFX.click()
    setLead2Id(v)
    setCpEdited(false)
    setLead2FixedLocked(false)
    const partner = findFixedPartner(v)
    if (partner) {
      setLead1Id(String(partner))
      setLead1FixedLocked(true)
    } else {
      setLead1FixedLocked(false)
    }
  }

  // Cast: leads + any additional from the cast pool
  const castIds = useMemo(() => {
    const ids = []
    if (lead1Id) ids.push(Number(lead1Id))
    if (lead2Id && lead2Id !== lead1Id) ids.push(Number(lead2Id))
    return ids
  }, [lead1Id, lead2Id])

  const castActors = useMemo(
    () => state.actors.filter(a => castIds.includes(a.id)),
    [state.actors, castIds]
  )

  // Chemistry data
  const chemValue = useMemo(() => {
    if (!lead1 || !lead2) return 0
    return getChem(lead1, lead2.id)
  }, [lead1, lead2])

  const chemInfo = chemTier(chemValue)

  const sharedTraits = useMemo(() => {
    if (!lead1 || !lead2) return []
    return (lead1.characteristics ?? []).filter(c =>
      (lead2.characteristics ?? []).includes(c)
    )
  }, [lead1, lead2])

  // TV blocks R rating
  const effectiveRating = platform === 'tv' && rating === 'r' ? 'pg13' : rating

  // Combo preview
  const combo = getComboResult(prodType, genre)

  // Prompt 1: tier now rank-based
  const gameTier = getGameTierByRank(state.numericRank ?? 50)

  // Cost & affordability
  const cost     = calcCost(prodType, budgetMult, schedule, castIds.length, gameTier.productionCostMod)
  const schedInfo  = SCHEDULES.find(s => s.id === schedule)
  const platInfo   = PLATFORMS.find(p => p.id === platform)
  const typeInfo   = PROD_TYPES[prodType]

  // 3.2: Fixed CP is only allowed if avg chemistry ≥ 20
  const avgChem = lead1 && lead2 ? Math.round((chemValue) ) : 0
  const fixedCpAllowed = lead1 && lead2 && avgChem >= 20
  const fixedCpPrice   = fixedCpCost(lead1, lead2)
  const totalCost      = cost + (cpFixed && fixedCpAllowed ? fixedCpPrice : 0)
  const canAffordTotal = state.money >= totalCost

  function handleSubmit(e) {
    e.preventDefault()
    if (!canAffordTotal) { SFX.fail(); return }
    if (!title.trim()) {
      SFX.fail()
      pushToast(dispatch, 'Please enter a title.', 'red')
      return
    }
    if (!lead1Id) {
      SFX.fail()
      pushToast(dispatch, 'Select at least one lead actor.', 'red')
      return
    }

    SFX.confirm()

    const prod = createProduction({
      type:      prodType,
      title:     title.trim(),
      genre,
      budget:    budgetMult,
      schedule,
      platform,
      rating:    effectiveRating,
      story,
      castIds,
      leadIds:   castIds.slice(0, 2),
      cpName,
      weekStarted: state.week,
      fixedCP:   cpFixed && fixedCpAllowed,
    })

    dispatch({ type: A.ADD_PRODUCTION, production: prod })
    dispatch({ type: A.ADD_MONEY, amount: -totalCost })

    // Register Fixed CP pair if selected (3.2)
    if (cpFixed && fixedCpAllowed && lead1 && lead2) {
      dispatch({ type: A.ADD_FIXED_CP, pair: [lead1.id, lead2.id] })
    }

    for (const id of castIds) {
      dispatch({ type: A.UPDATE_ACTOR, id, patch: { assignedTo: prod.id, status: 'filming' } })
    }

    pushToast(dispatch, `"${prod.title}" production started!${cpFixed && fixedCpAllowed ? ' 💕 Fixed CP registered!' : ''}`, 'green')
    setScreen('dashboard')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-title">🎬 NEW PRODUCTION</div>

        <div className="field">
          <label>PRODUCTION TITLE</label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            maxLength={48}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter a title…"
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
                onClick={() => { SFX.click(); setProdType(id) }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 7, color: 'var(--lav)', marginTop: 4 }}>
            {typeInfo?.episodes} episode{typeInfo?.episodes !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Genre */}
        <div className="field">
          <label>GENRE</label>
          {/* Selected genre display */}
          <div style={styles.genreDisplay}>
            <span style={{ fontSize: 16 }}>{GENRE_EMOJI[genre] ?? '🎬'}</span>
            <span style={{ fontSize: 10, color: 'var(--white)', fontWeight: 'bold' }}>{genre}</span>
          </div>
          {/* Two action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" style={styles.genreBtn}
              onClick={() => { SFX.click(); setShowGenrePick(true) }}
            >
              🎭 Select Genre
            </button>
            <button type="button" style={{ ...styles.genreBtn, background: 'var(--lav)', color: 'var(--bg-deep)' }}
              onClick={() => { SFX.click(); setShowSlotMachine(true) }}
            >
              🎰 Random Genre
            </button>
          </div>
        </div>

        {/* Genre pick modal */}
        {showGenrePick && (
          <GenrePickModal
            current={genre}
            onSelect={g => { setGenre(g); setShowGenrePick(false); SFX.confirm() }}
            onClose={() => setShowGenrePick(false)}
            unlockedGenres={state.unlockedGenres ?? DEFAULT_GENRES}
          />
        )}

        {/* Slot machine modal */}
        {showSlotMachine && (
          <SlotMachineModal
            onSelect={g => { setGenre(g); setShowSlotMachine(false); SFX.confirm() }}
            onClose={() => setShowSlotMachine(false)}
            unlockedGenres={state.unlockedGenres ?? DEFAULT_GENRES}
          />
        )}

      </div>

      {/* ── Leads & CP name ───────────────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-title">⭐ LEADS & CHEMISTRY</div>

        <div style={styles.leadsRow}>
          {/* Lead 1 — Prompt 5: auto-filled if lead2 has a fixed CP */}
          <LeadDropdown
            label={lead1FixedLocked ? 'LEAD 1 🔒 Fixed' : 'LEAD 1'}
            value={lead1Id}
            onChange={handleLead1Change}
            actors={availableActors}
            excludeId={Number(lead2Id)}
            locked={lead1FixedLocked}
          />
          {/* Lead 2 — Prompt 5: auto-filled if lead1 has a fixed CP */}
          <LeadDropdown
            label={lead2FixedLocked ? 'LEAD 2 🔒 Fixed' : 'LEAD 2'}
            value={lead2Id}
            onChange={handleLead2Change}
            actors={availableActors}
            excludeId={Number(lead1Id)}
            locked={lead2FixedLocked}
          />
        </div>

        {/* Portraits */}
        {(lead1 || lead2) && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            {lead1 && <LeadMini actor={lead1} />}
            {lead1 && lead2 && <span style={{ fontSize: 14, color: 'var(--pink)' }}>💞</span>}
            {lead2 && <LeadMini actor={lead2} />}
          </div>
        )}

        {/* Chemistry panel */}
        {lead1 && lead2 && (
          <div style={styles.chemPanel}>
            <button
              type="button"
              style={{ ...styles.chemToggle }}
              onClick={() => setShowChem(v => !v)}
            >
              💕 CHEMISTRY {showChem ? '▲' : '▼'}
            </button>

            {showChem && (
              <div style={{ marginTop: 8 }}>
                {/* Chemistry bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, height: 10, background: 'var(--bg-inset)', border: '1px solid var(--shadow)' }}>
                    <div style={{ width: `${chemValue}%`, height: '100%', background: chemInfo.color, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 10, color: chemInfo.color }}>{chemInfo.emoji} {chemValue}</span>
                  <span style={{ fontSize: 8, color: chemInfo.color }}>{chemInfo.label}</span>
                </div>

                {/* Shared traits */}
                {sharedTraits.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 7, color: 'var(--lav)' }}>Shared: </span>
                    {sharedTraits.map(t => (
                      <span key={t} style={styles.traitChip}>{t}</span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 7, color: 'var(--gray)', marginBottom: 6 }}>No shared traits</div>
                )}

                {/* Unhappy warnings */}
                {[lead1, lead2].map(a => (a.happiness ?? 70) < 40 && (
                  <div key={a.id} style={{ fontSize: 7, color: 'var(--red)', marginBottom: 4 }}>
                    ⚠️ {a.name} is unhappy — chemistry may suffer
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CP name */}
        <div className="field" style={{ marginTop: 10 }}>
          <label>CP NAME (couple pairing)</label>
          <input
            type="text"
            value={cpName}
            maxLength={20}
            onChange={e => { setCpName(e.target.value); setCpEdited(true) }}
            placeholder="Auto-generated from lead names"
          />
        </div>

        {/* 3.2: Fixed vs Unfixed CP toggle */}
        {lead1 && lead2 && (
          <div style={styles.cpTypeBox}>
            <div style={{ fontSize: 7, color: 'var(--lav)', marginBottom: 6, letterSpacing: 1 }}>
              CP CONTRACT TYPE
            </div>
            <div className="seg">
              <button type="button"
                className={!cpFixed ? 'sel' : ''}
                onClick={() => { SFX.click(); setCpFixed(false) }}
              >
                🔓 Unfixed (free — can pair with others later)
              </button>
              <button type="button"
                className={cpFixed ? 'sel' : ''}
                onClick={() => { SFX.click(); if (fixedCpAllowed) setCpFixed(true) }}
                disabled={!fixedCpAllowed}
                title={!fixedCpAllowed ? `Chemistry must be ≥20 to lock a Fixed CP (current: ${avgChem})` : ''}
              >
                💕 Fixed CP {fixedCpAllowed ? `(−₩${fixedCpPrice.toLocaleString()})` : `(need chem ≥20)`}
              </button>
            </div>
            {cpFixed && fixedCpAllowed && (
              <div style={{ fontSize: 7, color: 'var(--pink)', marginTop: 6 }}>
                💕 Fixed CPs are locked together for all future productions.
                Chemistry must stay ≥20 or the contract breaks.
              </div>
            )}
            {!fixedCpAllowed && (
              <div style={{ fontSize: 7, color: 'var(--gray)', marginTop: 4 }}>
                Chemistry {avgChem}/100 — need ≥20 to offer a Fixed CP contract.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Production details ────────────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-title">🗓️ PRODUCTION DETAILS</div>

        {/* Story */}
        <div className="field">
          <label>STORY</label>
          <div className="seg">
            {STORY_TYPES.map(s => (
              <button key={s.id} type="button"
                className={story === s.id ? 'sel' : ''}
                onClick={() => { SFX.click(); setStory(s.id) }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="field">
          <label>SCHEDULE</label>
          <div className="seg">
            {SCHEDULES.map(s => (
              <button key={s.id} type="button"
                className={schedule === s.id ? 'sel' : ''}
                onClick={() => { SFX.click(); setSchedule(s.id) }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 7, color: 'var(--lav)', marginTop: 4 }}>
            {schedInfo?.weeks} filming weeks · quality ×{schedInfo?.qMult}
          </div>
        </div>

        {/* Platform */}
        <div className="field">
          <label>PLATFORM</label>
          <div className="seg">
            {PLATFORMS.map(p => (
              <button key={p.id} type="button"
                className={platform === p.id ? 'sel' : ''}
                onClick={() => { SFX.click(); setPlatform(p.id) }}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 7, color: 'var(--lav)', marginTop: 4 }}>
            {platInfo?.label === 'TV'
              ? 'Wide reach (×1.3 pop) · lower revenue · R rating blocked'
              : 'Niche reach · higher revenue (×1.3) · all ratings allowed'}
          </div>
        </div>

        {/* Rating */}
        <div className="field">
          <label>CONTENT RATING</label>
          <div className="seg">
            {RATINGS.map(r => {
              const blocked = platform === 'tv' && r.id === 'r'
              return (
                <button key={r.id} type="button"
                  className={effectiveRating === r.id ? 'sel' : ''}
                  onClick={() => { SFX.click(); if (!blocked) setRating(r.id) }}
                  disabled={blocked}
                  title={blocked ? 'TV does not allow R-rated content' : ''}
                >
                  {r.label}
                  {blocked && ' 🚫'}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Budget ────────────────────────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-title">💰 BUDGET</div>

        {/* Quick-pick */}
        <div className="seg" style={{ marginBottom: 10 }}>
          {[{ label: 'Min ×0.5', v: 0.5 }, { label: 'Standard ×1.0', v: 1.0 }, { label: 'Max ×2.0', v: 2.0 }].map(b => (
            <button key={b.v} type="button"
              className={budgetMult === b.v ? 'sel' : ''}
              onClick={() => { SFX.click(); setBudgetMult(b.v) }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Custom slider */}
        <div className="field">
          <label>CUSTOM: ×{budgetMult.toFixed(2)}</label>
          <input
            type="range"
            min={BUDGET_MIN} max={BUDGET_MAX} step={0.05}
            value={budgetMult}
            onChange={e => setBudgetMult(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: 'var(--lav)' }}>
            <span>×0.5 (min)</span><span>×3.0 (blockbuster)</span>
          </div>
        </div>
      </div>

      {/* ── Cost preview ──────────────────────────────────────────────────── */}
      <div className="cost-preview">
        <div>Type: {typeInfo?.label} · {typeInfo?.episodes} ep{typeInfo?.episodes !== 1 ? 's' : ''}</div>
        <div>Schedule: {schedInfo?.label} ({schedInfo?.weeks}wk, q×{schedInfo?.qMult})</div>
        <div>Platform: {platInfo?.label} · Rating: {effectiveRating.toUpperCase()}</div>
        <div>Story: {STORY_TYPES.find(s => s.id === story)?.label}</div>
        <div>Budget: ×{budgetMult.toFixed(2)} · Cast: {castIds.length} actor{castIds.length !== 1 ? 's' : ''}</div>
        <div style={{ fontSize: 7, color: 'var(--lav)' }}>
          Tier: {gameTier.label} · Cost ×{gameTier.productionCostMod.toFixed(2)} · Rev ×{gameTier.revenueMod.toFixed(2)}
        </div>
        {cpName && <div>CP: <span style={{ color: 'var(--pink)' }}>{cpName}</span>{cpFixed && fixedCpAllowed ? ' 💕 FIXED' : ''}</div>}
        {cpFixed && fixedCpAllowed && (
          <div style={{ color: 'var(--pink)', fontSize: 7 }}>Fixed CP fee: {fmtMoney(fixedCpPrice)}</div>
        )}
        <div style={{ borderTop: '1px dashed var(--gold)', marginTop: 6, paddingTop: 6 }}>
          <span style={{ color: canAffordTotal ? 'var(--gold)' : 'var(--red)', fontSize: 10 }}>
            TOTAL: {fmtMoney(totalCost)}
          </span>
          {!canAffordTotal && (
            <span style={{ color: 'var(--red)', fontSize: 7, marginLeft: 8 }}>
              (need {fmtMoney(totalCost - state.money)} more)
            </span>
          )}
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          className="btn-primary"
          style={{ flex: 1, textAlign: 'center', fontSize: 11, padding: 16 }}
          disabled={!canAffordTotal || !lead1Id}
        >
          🎬 GREENLIGHT!
        </button>
        <button type="button"
          onClick={() => { SFX.click(); setScreen('dashboard') }}
          style={{ padding: '12px 16px' }}
        >
          ✕
        </button>
      </div>

    </form>
  )
}

// ─── Lead actor dropdown ──────────────────────────────────────────────────────
// Prompt 5: `locked` shows a 🔒 Fixed badge and disables the dropdown
function LeadDropdown({ label, value, onChange, actors, excludeId, locked }) {
  const filtered = actors.filter(a => a.id !== excludeId)
  return (
    <div style={styles.leadDropWrap}>
      <label style={{ fontSize: 7, color: locked ? 'var(--pink)' : 'var(--lav)', letterSpacing: 1 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => !locked && onChange(e.target.value)}
        disabled={locked}
        style={{ fontSize: 8, width: '100%', opacity: locked ? 0.85 : 1 }}
      >
        <option value="">— Select —</option>
        {filtered.map(a => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.tier}) {(a.happiness ?? 70) < 40 ? '⚠️' : ''}
          </option>
        ))}
      </select>
      {locked && (
        <div style={{ fontSize: 6, color: 'var(--pink)', marginTop: 2 }}>
          🔒 Fixed CP partner — locked
        </div>
      )}
    </div>
  )
}

// ─── Lead mini card ───────────────────────────────────────────────────────────
function LeadMini({ actor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <ActorPortrait actor={actor} size={44} />
      <div>
        <div style={{ fontSize: 8, color: 'var(--white)' }}>{actor.name}</div>
        <div style={{ fontSize: 7, color: 'var(--lav)' }}>{actor.tier}</div>
        <div style={{ fontSize: 12 }}>{moodEmoji(actor.happiness ?? 70)}</div>
      </div>
    </div>
  )
}

// ─── Genre Pick Modal ─────────────────────────────────────────────────────────
// Prompt 4: only shows unlocked genres; locked genres shown dimmed with 🔒
function GenrePickModal({ current, onSelect, onClose, unlockedGenres }) {
  const unlocked = unlockedGenres ?? DEFAULT_GENRES
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.box} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.title}>🎭 SELECT GENRE</div>
        <div style={{ fontSize: 7, color: 'var(--lav)', textAlign: 'center', marginBottom: 8 }}>
          {unlocked.length}/{GENRES.length} genres unlocked · Complete productions to unlock more
        </div>
        <div style={modalStyles.grid}>
          {GENRES.map(g => {
            const isUnlocked = unlocked.includes(g)
            return (
            <button
              key={g}
              type="button"
              disabled={!isUnlocked}
              style={{
                ...modalStyles.genreCard,
                ...(current === g ? modalStyles.genreCardSel : {}),
                opacity: isUnlocked ? 1 : 0.35,
                cursor:  isUnlocked ? 'pointer' : 'not-allowed',
              }}
              onClick={() => isUnlocked && onSelect(g)}
            >
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>
                {GENRE_EMOJI[g] ?? '🎬'}
              </span>
              <span style={{
                fontSize:    7,
                color:       current === g ? 'var(--bg-deep)' : isUnlocked ? 'var(--white)' : 'var(--gray)',
                lineHeight:  1.3,
                wordBreak:   'break-word',
                overflowWrap:'break-word',
                textAlign:   'center',
                maxWidth:    '100%',
                display:     'block',
              }}>
                {isUnlocked ? g : `🔒 ${g}`}
              </span>
            </button>
            )
          })}
        </div>
        <button type="button" style={modalStyles.closeBtn} onClick={onClose}>✕ CANCEL</button>
      </div>
    </div>
  )
}

// ─── Slot Machine Modal ───────────────────────────────────────────────────────
// Prompt 4: only cycles through unlocked genres
function SlotMachineModal({ onSelect, onClose, unlockedGenres }) {
  const pool = (unlockedGenres ?? DEFAULT_GENRES).filter(g => GENRES.includes(g))
  const [spinning,    setSpinning]    = React.useState(false)
  const [landed,      setLanded]      = React.useState(null)
  const [displayIdx,  setDisplayIdx]  = React.useState(0)
  const intervalRef = React.useRef(null)

  function spin() {
    if (spinning) return
    setLanded(null)
    setSpinning(true)

    let tick = 0
    const totalTicks = 28 + Math.floor(Math.random() * 10)  // 28–37 ticks
    let delay = 60

    function nextTick() {
      setDisplayIdx(i => (i + 1) % pool.length)
      tick++
      if (tick >= totalTicks) {
        // Land on a random unlocked genre
        const winner = pool[Math.floor(Math.random() * pool.length)]
        setDisplayIdx(pool.indexOf(winner))
        setLanded(winner)
        setSpinning(false)
        return
      }
      // Slow down near the end
      if (tick > totalTicks - 8) delay = 80 + (tick - (totalTicks - 8)) * 40
      intervalRef.current = setTimeout(nextTick, delay)
    }
    intervalRef.current = setTimeout(nextTick, delay)
  }

  React.useEffect(() => {
    spin()
    return () => clearTimeout(intervalRef.current)
  }, [])

  const displayGenre = pool[displayIdx] ?? pool[0] ?? 'Romance'

  return (
    <div style={modalStyles.overlay} onClick={!spinning ? onClose : undefined}>
      <div style={modalStyles.box} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.title}>🎰 RANDOM GENRE</div>

        {/* Slot window */}
        <div style={modalStyles.slotWindow}>
          <div style={{
            fontSize: 40,
            transition: spinning ? 'none' : 'transform 0.3s',
            filter: spinning ? 'blur(1px)' : 'none',
          }}>
            {GENRE_EMOJI[displayGenre] ?? '🎬'}
          </div>
          <div style={{
            fontSize: 12,
            color: landed ? 'var(--gold)' : 'var(--lav)',
            marginTop: 8,
            letterSpacing: 2,
            fontWeight: 'bold',
            minHeight: 20,
            transition: 'color 0.2s',
          }}>
            {spinning ? displayGenre : (landed ?? displayGenre)}
          </div>
          {landed && (
            <div style={{ fontSize: 7, color: 'var(--green)', marginTop: 6, letterSpacing: 1 }}>
              ✨ LANDED!
            </div>
          )}
        </div>

        {/* Spinning strip preview — only unlocked genres */}
        <div style={modalStyles.slotStrip}>
          {pool.slice(displayIdx, displayIdx + 5).concat(pool.slice(0, Math.max(0, 5 - (pool.length - displayIdx)))).map((g, i) => (
            <span key={i} style={{
              fontSize: 16,
              opacity: i === 0 ? 1 : 0.3 - i * 0.04,
              transition: 'opacity 0.1s',
            }}>
              {GENRE_EMOJI[g] ?? '🎬'}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" style={modalStyles.spinBtn}
            onClick={spin} disabled={spinning}
          >
            {spinning ? '⏳ SPINNING…' : '🎰 SPIN AGAIN'}
          </button>
          {landed && (
            <button type="button" style={modalStyles.acceptBtn}
              onClick={() => onSelect(landed)}
            >
              ✅ USE {landed.toUpperCase()}
            </button>
          )}
        </div>
        {!spinning && (
          <button type="button" style={modalStyles.closeBtn} onClick={onClose}>✕ CANCEL</button>
        )}
      </div>
    </div>
  )
}

const modalStyles = {
  overlay: {
    position:       'fixed',
    inset:          0,
    background:     'rgba(0,0,0,0.82)',
    zIndex:         200,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  box: {
    background:  'var(--bg-deep)',
    border:      '3px solid var(--pink)',
    padding:     '20px 18px',
    maxWidth:    380,
    width:       '94%',
    maxHeight:   '85vh',
    overflowY:   'auto',
    boxShadow:   '4px 4px 0 #8A2B52',
    display:     'flex',
    flexDirection: 'column',
    alignItems:  'center',
    gap:         10,
  },
  title: {
    fontSize:    11,
    color:       'var(--pink)',
    letterSpacing: 2,
    fontWeight:  'bold',
    marginBottom: 4,
  },
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap:                 8,
    width:               '100%',
  },
  genreCard: {
    padding:       '10px 4px',
    background:    'var(--bg-inset)',
    border:        '2px solid var(--shadow)',
    cursor:        'pointer',
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    justifyContent:'center',
    minHeight:     'auto',
    transition:    'border-color 0.15s',
    textAlign:     'center',
  },
  genreCardSel: {
    background:  'var(--pink)',
    border:      '2px solid var(--gold)',
  },
  closeBtn: {
    marginTop:   8,
    fontSize:    7,
    padding:     '5px 14px',
    background:  'var(--bg-inset)',
    border:      '2px solid var(--gray)',
    color:       'var(--gray)',
    cursor:      'pointer',
    boxShadow:   'none',
    minHeight:   'auto',
  },
  slotWindow: {
    background:  'var(--bg-inset)',
    border:      '3px solid var(--gold)',
    padding:     '20px 40px',
    textAlign:   'center',
    minWidth:    180,
  },
  slotStrip: {
    display:     'flex',
    gap:         8,
    alignItems:  'center',
    padding:     '4px 0',
  },
  spinBtn: {
    fontSize:    8,
    padding:     '8px 14px',
    background:  'var(--lav)',
    color:       'var(--bg-deep)',
    border:      'none',
    boxShadow:   '2px 2px 0 #4a3a8a',
    cursor:      'pointer',
    minHeight:   'auto',
  },
  acceptBtn: {
    fontSize:    8,
    padding:     '8px 14px',
    background:  'var(--green)',
    color:       'var(--bg-deep)',
    border:      'none',
    boxShadow:   '2px 2px 0 #1a5a2a',
    cursor:      'pointer',
    minHeight:   'auto',
    fontWeight:  'bold',
  },
}

const styles = {
  genreDisplay: {
    display:     'flex',
    alignItems:  'center',
    gap:         10,
    padding:     '10px 12px',
    background:  'var(--bg-inset)',
    border:      '2px solid var(--pink-dim)',
    marginTop:   6,
  },
  genreBtn: {
    flex:        1,
    fontSize:    8,
    padding:     '9px 10px',
    background:  'var(--pink)',
    color:       'var(--bg-deep)',
    border:      'none',
    boxShadow:   '2px 2px 0 #8A2B52',
    cursor:      'pointer',
    minHeight:   'auto',
    fontWeight:  'bold',
    letterSpacing: 1,
  },
  suggestChip: {
    fontSize:   7,
    padding:    '5px 8px',
    background: 'var(--bg-inset)',
    border:     '1px solid var(--pink-dim)',
    color:      'var(--lav)',
    cursor:     'pointer',
    boxShadow:  'none',
    minHeight:  'auto',
  },
  cpTypeBox: {
    marginTop:  10,
    padding:    '10px 10px',
    background: 'var(--bg-inset)',
    border:     '2px solid var(--shadow)',
  },
  comboBadge: {
    marginTop:  10,
    padding:    '7px 10px',
    border:     '2px solid var(--gray)',
    fontSize:   8,
    display:    'flex',
    alignItems: 'center',
    gap:        4,
    flexWrap:   'wrap',
  },
  leadsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 10,
  },
  leadDropWrap: {
    display:       'flex',
    flexDirection: 'column',
    gap:           4,
  },
  chemPanel: {
    background: 'var(--bg-inset)',
    border:     '2px solid var(--shadow)',
    padding:    '8px 10px',
    marginBottom: 4,
  },
  chemToggle: {
    background:  'transparent',
    border:      'none',
    boxShadow:   'none',
    color:       'var(--pink)',
    fontSize:    8,
    padding:     0,
    minHeight:   'auto',
    cursor:      'pointer',
  },
  traitChip: {
    fontSize:   6,
    padding:    '2px 5px',
    background: 'rgba(255,107,157,0.15)',
    border:     '1px solid var(--pink-dim)',
    color:      'var(--pink)',
  },
}
