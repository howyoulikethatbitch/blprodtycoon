/**
 * TitleScreen.jsx — Intro / new game / load game screen
 */
import React, { useState, useEffect } from 'react'
import { useGame, A } from '../game/state.jsx'
import { initActor, ACTOR_DATA, initChemistry } from '../game/actors.js'
import { initAudio, SFX } from '../game/audio.js'

export default function TitleScreen() {
  const { dispatch } = useGame()
  const [phase, setPhase]             = useState('title')   // 'title' | 'newgame'
  const [companyName, setCompanyName] = useState('Studio Sakura')
  const [blink, setBlink]             = useState(true)
  const [hasSave, setHasSave]         = useState(false)

  useEffect(() => {
    const save = localStorage.getItem('bl_tycoon_save')
    setHasSave(!!save)
    const t = setInterval(() => setBlink(b => !b), 600)
    return () => clearInterval(t)
  }, [])

  function handleStart() {
    initAudio()
    SFX.click()
    setPhase('newgame')
  }

  function handleLoad() {
    initAudio()
    SFX.confirm?.() ?? SFX.click()
    try {
      const raw = localStorage.getItem('bl_tycoon_save')
      if (!raw) return
      const save = JSON.parse(raw)
      dispatch({ type: A.LOAD_SAVE, saveData: save })
    } catch (e) {
      alert('Save data corrupted.')
    }
  }

  function handleNewGame(e) {
    e.preventDefault()
    SFX.success?.() ?? SFX.click()
    // Build actors: init each one, then wire up chemistry maps between all pairs
    const rawActors  = ACTOR_DATA.map(initActor)
    const actors     = initChemistry(rawActors)
    dispatch({
      type: A.START_GAME,
      companyName: companyName.trim() || 'Studio Sakura',
      actors,
    })
  }

  if (phase === 'newgame') {
    return (
      <div style={styles.wrap}>
        <div style={styles.box}>
          <div style={styles.bigTitle}>BL PRODUCTION<br />TYCOON</div>
          <div style={styles.subtitle}>— NEW STUDIO —</div>

          <form onSubmit={handleNewGame} style={{ width: '100%' }}>
            <div className="field" style={{ marginTop: 24 }}>
              <label>STUDIO NAME</label>
              <input
                type="text"
                value={companyName}
                maxLength={28}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Studio Sakura"
                style={{ fontSize: 10 }}
                autoFocus
              />
            </div>

            <div style={styles.startRow}>
              <button type="submit" className="btn-primary" style={styles.bigBtn}>
                🎬 BEGIN!
              </button>
              <button type="button" onClick={() => setPhase('title')} style={{ fontSize: 8, padding: '10px 14px' }}>
                ← BACK
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrap} onClick={phase === 'title' ? handleStart : undefined}>
      <div style={styles.box}>
        <div style={styles.deco}>🎬</div>

        <div style={styles.bigTitle}>
          BL<br />PRODUCTION<br />TYCOON
        </div>

        <div style={styles.tagline}>
          produce love · manage stars<br />build the dream
        </div>

        <div style={{ ...styles.blinkText, opacity: blink ? 1 : 0 }}>
          ▶ TAP TO START ◀
        </div>

        <div style={styles.btnRow}>
          <button
            className="btn-primary"
            style={styles.menuBtn}
            onClick={e => { e.stopPropagation(); handleStart() }}
          >
            🆕 NEW GAME
          </button>

          {hasSave && (
            <button
              style={styles.menuBtn}
              onClick={e => { e.stopPropagation(); handleLoad() }}
            >
              💾 CONTINUE
            </button>
          )}
        </div>

        <div style={styles.ver}>v1.0 · mobile edition</div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 40%, #3D2860 0%, #1F1338 70%)',
    padding: 16,
  },
  box: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    maxWidth: 380,
    width: '100%',
    textAlign: 'center',
  },
  deco: {
    fontSize: 48,
    filter: 'drop-shadow(0 0 16px #FF6B9D)',
  },
  bigTitle: {
    fontSize: 22,
    color: '#FF6B9D',
    lineHeight: 1.5,
    textShadow: '3px 3px 0 #120A24, 0 0 20px rgba(255,107,157,0.5)',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 9,
    color: '#9B86C4',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 8,
    color: '#9B86C4',
    lineHeight: 2,
  },
  blinkText: {
    fontSize: 9,
    color: '#FFD700',
    letterSpacing: 2,
    transition: 'opacity 0.1s',
    marginTop: 8,
  },
  btnRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  menuBtn: {
    textAlign: 'center',
    width: '100%',
    fontSize: 10,
    padding: '14px 12px',
  },
  startRow: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  bigBtn: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    padding: '16px 12px',
  },
  ver: {
    fontSize: 7,
    color: '#6E6390',
    marginTop: 8,
  },
}
