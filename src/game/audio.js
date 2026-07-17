/**
 * audio.js — SFX / BGM management via Web Audio API
 * Graceful no-op if AudioContext not available.
 * Full implementation will be fleshed out in later prompts.
 */

let ctx = null
let gainNode = null
let sfxGain = null

export function initAudio() {
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    gainNode = ctx.createGain()
    gainNode.gain.value = 0.4
    gainNode.connect(ctx.destination)

    sfxGain = ctx.createGain()
    sfxGain.gain.value = 0.6
    sfxGain.connect(ctx.destination)
  } catch (e) {
    console.warn('Web Audio not available:', e)
  }
}

export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume()
}

export function setSfxVolume(v) {
  if (sfxGain) sfxGain.gain.value = Math.max(0, Math.min(1, v))
}

export function setBgmVolume(v) {
  if (gainNode) gainNode.gain.value = Math.max(0, Math.min(1, v))
}

// ─── SFX generators ───────────────────────────────────────────────────────────

function beep(freq = 440, type = 'square', duration = 0.08, vol = 0.3) {
  if (!ctx || !sfxGain) return
  try {
    const osc = ctx.createOscillator()
    const g   = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    g.gain.setValueAtTime(vol, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(g)
    g.connect(sfxGain)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch (e) {
    // silent fail
  }
}

export const SFX = {
  click:    () => beep(600,  'square',   0.05, 0.2),
  confirm:  () => beep(880,  'sine',     0.12, 0.3),
  success:  () => { beep(660, 'sine', 0.1, 0.3); setTimeout(() => beep(990, 'sine', 0.15, 0.25), 100) },
  fail:     () => beep(220,  'sawtooth', 0.2,  0.3),
  levelUp:  () => { beep(440, 'sine', 0.08, 0.3); setTimeout(() => beep(660, 'sine', 0.08, 0.3), 90); setTimeout(() => beep(880, 'sine', 0.15, 0.35), 180) },
  nextTurn: () => { beep(550, 'square', 0.06, 0.25); setTimeout(() => beep(700, 'square', 0.1, 0.2), 70) },
  modal:    () => beep(700,  'sine',     0.08, 0.2),
}
