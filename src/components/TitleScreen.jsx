/**
 * TitleScreen.jsx — Intro / new game / continue / settings screen
 * Prompt 3: animated bg, gold/pink glow title, SETTINGS button, fade-out on start.
 */
import React, { useState, useEffect, useRef } from 'react'
import { useGame, A } from '../game/state.jsx'
import { initActor, ACTOR_DATA, initChemistry } from '../game/actors.js'
import { initAudio, SFX } from '../game/audio.js'

export default function TitleScreen() {
  const { dispatch } = useGame()
  const [phase, setPhase]             = useState('title')   // 'title' | 'newgame' | 'settings'
  const [companyName, setCompanyName] = useState('Studio Sakura')
  const [blink, setBlink]             = useState(true)
  const [hasSave, setHasSave]         = useState(false)
  const [fading, setFading]           = useState(false)
  const inputRef                      = useRef(null)

  useEffect(() => {
    const save = localStorage.getItem('bl_tycoon_save')
    setHasSave(!!save)
    const t = setInterval(() => setBlink(b => !b), 600)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (phase === 'newgame') inputRef.current?.focus()
  }, [phase])

  function handleLoad() {
    initAudio()
    SFX.confirm()
    try {
      const raw = localStorage.getItem('bl_tycoon_save')
      if (!raw) return
      const save = JSON.parse(raw)
      setFading(true)
      setTimeout(() => dispatch({ type: A.LOAD_SAVE, saveData: save }), 400)
    } catch {
      alert('Save data corrupted.')
    }
  }

  function handleNewGame(e) {
    e.preventDefault()
    SFX.success()
    const rawActors = ACTOR_DATA.map(initActor)
    const actors    = initChemistry(rawActors)
    setFading(true)
    setTimeout(() => {
      dispatch({
        type: A.START_GAME,
        companyName: companyName.trim() || 'Studio Sakura',
        actors,
      })
    }, 400)
  }

  // ── Settings mini-screen ───────────────────────────────────────────────────
  if (phase === 'settings') {
    return (
      <div style={styles.wrap}>
        <div style={{ ...styles.box, gap: 20 }}>
          <div style={styles.bigTitle}>SETTINGS</div>
          <div style={{ fontSize: 8, color: 'var(--lav)', lineHeight: 2.5, textAlign: 'left', width: '100%' }}>
            <div>Audio, scanlines and speed are available in-game via the Settings screen.</div>
          </div>
          <button
            style={{ ...styles.menuBtn, width: '100%' }}
            onClick={() => { SFX.click(); setPhase('title') }}
          >
            ← BACK
          </button>
          <div style={styles.ver}>v1.0 · mobile edition</div>
        </div>
      </div>
    )
  }

  // ── New game name entry ────────────────────────────────────────────────────
  if (phase === 'newgame') {
    return (
      <div style={{ ...styles.wrap, opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease' }}>
        <div style={styles.box}>
          <div style={styles.bigTitle}>BL PRODUCTION<br />TYCOON</div>
          <div style={styles.subtitle}>— NEW STUDIO —</div>

          <form onSubmit={handleNewGame} style={{ width: '100%', marginTop: 8 }}>
            <div className="field">
              <label>STUDIO NAME</label>
              <input
                ref={inputRef}
                type="text"
                value={companyName}
                maxLength={28}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Studio Sakura"
                style={{ fontSize: 10 }}
              />
            </div>
            <div style={styles.startRow}>
              <button type="submit" className="btn-primary" style={styles.bigBtn}>
                🎬 BEGIN!
              </button>
              <button type="button" onClick={() => { SFX.click(); setPhase('title') }}
                style={{ fontSize: 8, padding: '10px 14px' }}>
                ← BACK
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ── Main title screen ──────────────────────────────────────────────────────
  return (
    <div style={{
      ...styles.wrap,
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.4s ease',
    }}>
      {/* Animated background layer */}
      <div style={styles.animBg} aria-hidden="true" />

      <div style={styles.box}>
        {/* Clapperboard icon with glow */}
        <div style={styles.deco}>🎬</div>

        {/* Title with gold/pink glow */}
        <div style={styles.bigTitle}>
          BL<br />PRODUCTION<br />TYCOON
        </div>

        <div style={styles.tagline}>
          produce love · manage stars<br />build the dream
        </div>

        {/* Blinking prompt */}
        <div style={{ ...styles.blinkText, opacity: blink ? 1 : 0 }}>
          ▶ TAP TO START ◀
        </div>

        {/* Buttons */}
        <div style={styles.btnRow}>
          <button
            className="btn-primary"
            style={styles.menuBtn}
            onClick={() => { initAudio(); SFX.click(); setPhase('newgame') }}
          >
            🆕 NEW GAME
          </button>

          {hasSave && (
            <button style={styles.menuBtn} onClick={handleLoad}>
              💾 CONTINUE
            </button>
          )}

          <button
            style={{ ...styles.menuBtn, fontSize: 8, padding: '10px 12px' }}
            onClick={() => { SFX.click(); setPhase('settings') }}
          >
            ⚙️ SETTINGS
          </button>
        </div>

        <div style={styles.ver}>
          v1.0 · mobile edition · Press Start 2P font
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight:      '100dvh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     'radial-gradient(ellipse at 50% 40%, #3D2860 0%, #1F1338 70%)',
    padding:        16,
    position:       'relative',
    overflow:       'hidden',
  },
  animBg: {
    position:   'absolute',
    inset:      0,
    background: 'radial-gradient(ellipse at 30% 60%, rgba(255,107,157,0.12) 0%, transparent 60%), ' +
                'radial-gradient(ellipse at 70% 30%, rgba(107,197,255,0.10) 0%, transparent 50%)',
    animation:  'title-pulse 6s ease-in-out infinite',
    pointerEvents: 'none',
  },
  box: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            16,
    maxWidth:       380,
    width:          '100%',
    textAlign:      'center',
    position:       'relative',
    zIndex:         1,
  },
  deco: {
    fontSize:   52,
    filter:     'drop-shadow(0 0 20px #FF6B9D) drop-shadow(0 0 40px rgba(255,107,157,0.4))',
    animation:  'float 3s ease-in-out infinite',
  },
  bigTitle: {
    fontSize:    22,
    color:       '#FF6B9D',
    lineHeight:  1.5,
    textShadow:  '3px 3px 0 #120A24, 0 0 30px rgba(255,107,157,0.7), 0 0 60px rgba(255,107,157,0.3)',
    letterSpacing: 2,
    animation:   'title-glow 4s ease-in-out infinite',
  },
  subtitle: {
    fontSize:     9,
    color:        '#9B86C4',
    letterSpacing: 4,
  },
  tagline: {
    fontSize:   8,
    color:      '#9B86C4',
    lineHeight: 2,
  },
  blinkText: {
    fontSize:     9,
    color:        '#FFD700',
    letterSpacing: 2,
    transition:   'opacity 0.1s',
    textShadow:   '0 0 10px rgba(255,215,0,0.6)',
  },
  btnRow: {
    display:       'flex',
    flexDirection: 'column',
    gap:           10,
    width:         '100%',
    marginTop:     8,
  },
  menuBtn: {
    textAlign: 'center',
    width:     '100%',
    fontSize:  10,
    padding:   '14px 12px',
  },
  startRow: {
    display:    'flex',
    gap:        10,
    marginTop:  16,
    alignItems: 'center',
  },
  bigBtn: {
    flex:      1,
    textAlign: 'center',
    fontSize:  11,
    padding:   '16px 12px',
  },
  ver: {
    fontSize: 6,
    color:    '#6E6390',
    marginTop: 4,
    lineHeight: 2,
  },
}

// Inject title screen animations once
if (typeof document !== 'undefined') {
  const id = 'title-screen-css'
  if (!document.getElementById(id)) {
    const s = document.createElement('style')
    s.id = id
    s.textContent = `
      @keyframes title-pulse {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.6; }
      }
      @keyframes title-glow {
        0%, 100% { text-shadow: 3px 3px 0 #120A24, 0 0 30px rgba(255,107,157,0.7), 0 0 60px rgba(255,107,157,0.3); }
        50%       { text-shadow: 3px 3px 0 #120A24, 0 0 40px rgba(255,107,157,1),   0 0 80px rgba(255,215,0,0.4); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-8px); }
      }
    `
    document.head.appendChild(s)
  }
}
