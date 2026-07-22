/**
 * LoadingScreen.jsx
 * Loading screen for BL Production Tycoon.
 * Uses loading-bg.mp4 as background video and game-logo.png as the title logo.
 * Canvas animations for ambient particles (clouds, petals, sparkles).
 * Supports: PWA offline, Capacitor Android, prefers-reduced-motion, all viewports.
 */
import React, { useState, useEffect, useRef } from 'react'
import './LoadingScreen.css'
import gameLogo from '../assets/game-logo.png'

const MESSAGES = [
  '🎬 Building your dream studio...',
  '🎭 Auditioning talented actors...',
  '✍️ Writing unforgettable romances...',
  '💖 Finding the perfect on-screen chemistry...',
  '🎥 Preparing today\'s filming...',
  '🎞️ Editing emotional scenes...',
  '🎵 Recording beautiful OSTs...',
  '🌸 Designing stunning filming locations...',
  '⭐ Discovering future superstars...',
  '📺 Negotiating with streaming platforms...',
  '💰 Managing production budgets...',
  '🏆 Preparing award-winning productions...',
  '❤️ Creating unforgettable BL couples...',
  '🌎 Expanding your production company...',
  '✨ Almost ready, Producer...',
]

// ── Ambient canvas: clouds, petals, sparkles ──────────────────────────────────
function useAmbientCanvas(canvasRef, reducedMotion) {
  useEffect(() => {
    if (reducedMotion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let running = true

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // ── Particle factories ──
    const makePetal = () => ({
      x:        Math.random() * (canvas.width || window.innerWidth),
      y:        -20 - Math.random() * 200,
      size:     Math.floor(Math.random() * 5 + 4),
      vy:       Math.random() * 0.8 + 0.4,
      vx:       Math.random() * 0.4 - 0.2,
      rot:      Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      opacity:  Math.random() * 0.5 + 0.3,
      hue:      Math.random() * 20 + 330,
    })

    const makeSparkle = () => ({
      x:       Math.random() * (canvas.width || window.innerWidth),
      y:       Math.random() * (canvas.height || window.innerHeight) * 0.8,
      size:    Math.random() * 3 + 1.5,
      phase:   Math.random() * Math.PI * 2,
      speed:   Math.random() * 0.025 + 0.01,
    })

    const makeCloud = (i) => ({
      x:       (i / 4) * (canvas.width || window.innerWidth) - 100,
      y:       20 + Math.random() * 70,
      w:       130 + Math.random() * 90,
      h:       28 + Math.random() * 18,
      speed:   0.12 + Math.random() * 0.1,
      opacity: 0.1 + Math.random() * 0.08,
    })

    const petals   = Array.from({ length: 22 }, makePetal)
    const sparkles = Array.from({ length: 18 }, makeSparkle)
    const clouds   = Array.from({ length: 5 }, (_, i) => makeCloud(i))

    // ── Draw helpers ──
    function drawPetal(p) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = `hsl(${p.hue}, 75%, 82%)`
      const s = p.size
      ctx.fillRect(-s * 0.5, -s * 0.25, s, s * 0.5)
      ctx.fillRect(-s * 0.25, -s * 0.5, s * 0.5, s)
      ctx.restore()
    }

    function drawSparkle(s, opacity) {
      if (opacity <= 0) return
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.globalAlpha = opacity * 0.85
      ctx.fillStyle = '#FFD700'
      const r = s.size
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const a  = (i / 4) * Math.PI * 2
        const ai = a + Math.PI / 4
        ctx.lineTo(Math.cos(a) * r,       Math.sin(a) * r)
        ctx.lineTo(Math.cos(ai) * r * 0.3, Math.sin(ai) * r * 0.3)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    function drawCloud(c) {
      ctx.save()
      ctx.globalAlpha = c.opacity
      ctx.fillStyle = '#FFF4E6'
      ctx.fillRect(c.x + c.w * 0.2,  c.y,            c.w * 0.6, c.h * 0.65)
      ctx.fillRect(c.x + c.w * 0.1,  c.y + c.h * 0.3, c.w * 0.8, c.h * 0.7)
      ctx.fillRect(c.x,              c.y + c.h * 0.5, c.w,       c.h * 0.5)
      ctx.restore()
    }

    // ── Tick ──
    let last = performance.now()
    function tick(now) {
      if (!running) return
      const dt = now - last
      last = now
      // skip frame if tab was sleeping
      if (dt > 200) { raf = requestAnimationFrame(tick); return }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      clouds.forEach(c => {
        c.x += c.speed
        if (c.x > canvas.width + 250) c.x = -280
        drawCloud(c)
      })

      petals.forEach(p => {
        p.y   += p.vy
        p.x   += p.vx + Math.sin(p.y * 0.018) * 0.25
        p.rot += p.rotSpeed
        if (p.y > canvas.height + 20) Object.assign(p, makePetal(), { y: -20 })
        drawPetal(p)
      })

      sparkles.forEach(s => {
        s.phase += s.speed
        drawSparkle(s, Math.max(0, Math.sin(s.phase) * 0.9))
      })

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // Pause when tab is hidden
    const onVisibility = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf) }
      else                 { running = true;  raf = requestAnimationFrame(tick) }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [canvasRef, reducedMotion])
}

// ── Chibi character (pure CSS pixel art) ────────────────────────────────────
function ChibiCharacter({ colorScheme, flip, phase }) {
  const hair  = colorScheme === 'blue' ? '#3A5FA8' : '#7B3A14'
  const body  = colorScheme === 'blue' ? '#4A7FC1' : '#E87B9A'
  const pants = colorScheme === 'blue' ? '#2A4F8A' : '#C94F7C'
  const done  = phase === 'complete'
  return (
    <div className={[
      'ls-chibi',
      flip  ? 'ls-chibi-flip'  : '',
      done  ? 'ls-chibi-done'  : 'ls-chibi-walk',
    ].join(' ')}>
      {/* Head */}
      <div className="ls-ch-head">
        <div className="ls-ch-hair" style={{ background: hair }} />
        <div className="ls-ch-eyes">
          <div className="ls-ch-eye" />
          <div className="ls-ch-eye" />
        </div>
        <div className={`ls-ch-mouth ${done ? 'ls-ch-mouth-smile' : ''}`} />
        <div className="ls-ch-blush-row">
          <div className="ls-ch-blush" />
          <div className="ls-ch-blush" />
        </div>
      </div>
      {/* Body */}
      <div className="ls-ch-body" style={{ background: body }}>
        <div className="ls-ch-collar" style={{ background: pants }} />
      </div>
      {/* Legs */}
      <div className="ls-ch-legs">
        <div className={`ls-ch-leg ls-ch-leg-l ${done ? 'ls-leg-still' : ''}`} style={{ background: pants }} />
        <div className={`ls-ch-leg ls-ch-leg-r ${done ? 'ls-leg-still' : ''}`} style={{ background: pants }} />
      </div>
    </div>
  )
}

// ── Floating heart ───────────────────────────────────────────────────────────
function Heart({ delay, burst }) {
  return (
    <div
      className={`ls-heart ${burst ? 'ls-heart-burst' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >♥</div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function LoadingScreen({ onComplete }) {
  const [progress,   setProgress]   = useState(0)
  const [msgIndex,   setMsgIndex]   = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)
  // 'loading' → 'complete' → 'exit'
  const [phase,      setPhase]      = useState('loading')
  const canvasRef = useRef(null)

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useAmbientCanvas(canvasRef, reducedMotion)

  // ── Skip instantly for reduced-motion users ──
  useEffect(() => {
    if (!reducedMotion) return
    const t = setTimeout(() => onComplete?.(), 300)
    return () => clearTimeout(t)
  }, [reducedMotion, onComplete])

  // ── Simulated loading progress ──
  // To wire real asset progress, call window.__blSetLoadProgress(0-100) from outside.
  useEffect(() => {
    if (reducedMotion) return
    const DURATION = 4800 // ms — tune to taste
    const start = performance.now()

    let raf
    function tick(now) {
      const t = Math.min((now - start) / DURATION, 1)
      // Ease-in-out quad: fast → slow → done
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const p = Math.floor(eased * 100)
      setProgress(p)

      if (p < 100) {
        raf = requestAnimationFrame(tick)
      } else {
        setProgress(100)
        setPhase('complete')
        // Pause on complete so player sees the characters react
        setTimeout(() => {
          setPhase('exit')
          setTimeout(() => onComplete?.(), 650)
        }, 1300)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion, onComplete])

  // ── Rotating messages ──
  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % MESSAGES.length)
        setMsgVisible(true)
      }, 380)
    }, 3600)
    return () => clearInterval(id)
  }, [reducedMotion])

  const isComplete = phase === 'complete' || phase === 'exit'

  return (
    <div className={`ls-root${phase === 'exit' ? ' ls-exit' : ''}`}
      aria-label="Loading BL Production Tycoon"
      aria-live="polite"
    >
      {/* Background video */}
      <video
        className="ls-bg-video"
        src="./loading-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

      {/* Ambient particles canvas (clouds, petals, sparkles) */}
      <canvas ref={canvasRef} className="ls-canvas" aria-hidden="true" />

      {/* Static scene: buildings, trees, ground */}
      <div className="ls-scene" aria-hidden="true">
        <div className="ls-bldg ls-bldg-a" />
        <div className="ls-bldg ls-bldg-b" />
        <div className="ls-bldg ls-bldg-c" />

        <div className="ls-tree ls-tree-l">
          <div className="ls-tree-crown" />
          <div className="ls-tree-trunk" />
        </div>
        <div className="ls-tree ls-tree-r">
          <div className="ls-tree-crown ls-tree-crown-r" />
          <div className="ls-tree-trunk" />
        </div>

        {/* Studio banners */}
        <div className="ls-banner ls-banner-l" aria-hidden="true">🎬</div>
        <div className="ls-banner ls-banner-r" aria-hidden="true">⭐</div>

        <div className="ls-ground" />
      </div>

      {/* Game title logo */}
      <div className="ls-title-wrap" aria-hidden="true">
        <img src={gameLogo} alt="BL Production Tycoon" className="ls-logo" />
      </div>

      {/* Chibi characters + hearts */}
      <div className={`ls-chars-wrap${isComplete ? ' ls-chars-complete' : ''}`} aria-hidden="true">
        <ChibiCharacter colorScheme="blue" phase={phase} />
        <div className="ls-hearts">
          <Heart delay={0}   burst={isComplete} />
          <Heart delay={0.7} burst={isComplete} />
          <Heart delay={1.4} burst={isComplete} />
        </div>
        <ChibiCharacter colorScheme="pink" flip phase={phase} />
      </div>

      {/* Bottom HUD: message + progress bar */}
      <div className="ls-hud">
        <div className={`ls-msg${msgVisible ? ' ls-msg-in' : ' ls-msg-out'}`}>
          {MESSAGES[msgIndex]}
        </div>

        <div className="ls-bar-wrap">
          <div className="ls-bar-track" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
            <div className="ls-bar-fill" style={{ width: `${progress}%` }}>
              <div className="ls-bar-glint" />
            </div>
          </div>
          <div className="ls-bar-label">
            {progress < 100 ? `Loading Assets...  ${progress}%` : '✨  Ready, Producer!'}
          </div>
        </div>
      </div>
    </div>
  )
}
