/**
 * LoadingScreen.jsx
 * Loading screen for BL Production Tycoon.
 * Background: loading-bg.mp4 (video, autoplay forced for Android WebView).
 * Title: game-logo.png
 * Ambient canvas: petals + sparkles.
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

// ── Ambient canvas: petals + sparkles ─────────────────────────────────────────
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
      x:     Math.random() * (canvas.width || window.innerWidth),
      y:     Math.random() * (canvas.height || window.innerHeight) * 0.8,
      size:  Math.random() * 3 + 1.5,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.025 + 0.01,
    })

    const petals   = Array.from({ length: 22 }, makePetal)
    const sparkles = Array.from({ length: 18 }, makeSparkle)

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
        ctx.lineTo(Math.cos(a) * r,        Math.sin(a) * r)
        ctx.lineTo(Math.cos(ai) * r * 0.3, Math.sin(ai) * r * 0.3)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    let last = performance.now()
    function tick(now) {
      if (!running) return
      const dt = now - last
      last = now
      if (dt > 200) { raf = requestAnimationFrame(tick); return }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

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

// ── Main component ────────────────────────────────────────────────────────────
export default function LoadingScreen({ onComplete }) {
  const [progress,   setProgress]   = useState(0)
  const [msgIndex,   setMsgIndex]   = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)
  const [phase,      setPhase]      = useState('loading')
  const canvasRef = useRef(null)
  const videoRef  = useRef(null)

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useAmbientCanvas(canvasRef, reducedMotion)

  // ── Force video play on Android WebView (autoPlay attr alone is not enough) ──
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const tryPlay = () => {
      vid.muted = true
      vid.play().catch(() => {/* silently ignore if still blocked */})
    }
    // Try immediately, then again on first user interaction as fallback
    tryPlay()
    document.addEventListener('touchstart', tryPlay, { once: true })
    document.addEventListener('click',      tryPlay, { once: true })
    return () => {
      document.removeEventListener('touchstart', tryPlay)
      document.removeEventListener('click',      tryPlay)
    }
  }, [])

  // ── Skip instantly for reduced-motion users ──
  useEffect(() => {
    if (!reducedMotion) return
    const t = setTimeout(() => onComplete?.(), 300)
    return () => clearTimeout(t)
  }, [reducedMotion, onComplete])

  // ── Simulated loading progress ──
  useEffect(() => {
    if (reducedMotion) return
    const DURATION = 4800
    const start = performance.now()
    let raf
    function tick(now) {
      const t = Math.min((now - start) / DURATION, 1)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const p = Math.floor(eased * 100)
      setProgress(p)
      if (p < 100) {
        raf = requestAnimationFrame(tick)
      } else {
        setProgress(100)
        setPhase('complete')
        setTimeout(() => {
          setPhase('exit')
          setTimeout(() => onComplete?.(), 650)
        }, 800)
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

  return (
    <div
      className={`ls-root${phase === 'exit' ? ' ls-exit' : ''}`}
      aria-label="Loading BL Production Tycoon"
      aria-live="polite"
    >
      {/* Background video */}
      <video
        ref={videoRef}
        className="ls-bg-video"
        src="./loading-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

      {/* Ambient particles canvas */}
      <canvas ref={canvasRef} className="ls-canvas" aria-hidden="true" />

      {/* Game title logo */}
      <div className="ls-title-wrap" aria-hidden="true">
        <img src={gameLogo} alt="BL Production Tycoon" className="ls-logo" />
      </div>

      {/* Bottom HUD: message + progress bar */}
      <div className="ls-hud">
        <div className={`ls-msg${msgVisible ? ' ls-msg-in' : ' ls-msg-out'}`}>
          {MESSAGES[msgIndex]}
        </div>

        <div className="ls-bar-wrap">
          <div
            className="ls-bar-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
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
