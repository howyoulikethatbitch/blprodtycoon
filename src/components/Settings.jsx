/**
 * Settings.jsx — Game settings + save/load controls
 */
import React from 'react'
import { useGame, A, pushToast } from '../game/state.jsx'
import { INITIAL_STATE } from '../game/state.jsx'
import { setSfxVolume, setBgmVolume, SFX } from '../game/audio.js'

export default function Settings() {
  const { state, dispatch } = useGame()
  const { settings } = state

  function updateSetting(key, value) {
    dispatch({ type: A.SET_SETTINGS, patch: { [key]: value } })
    if (key === 'sfxVolume') setSfxVolume(value)
    if (key === 'bgmVolume') setBgmVolume(value)
  }

  function handleSave() {
    SFX.confirm()
    try {
      localStorage.setItem('bl_tycoon_save', JSON.stringify(state))
      pushToast(dispatch, 'Game saved!', 'green')
    } catch (e) {
      pushToast(dispatch, 'Save failed.', 'red')
    }
  }

  function handleLoad() {
    SFX.click()
    try {
      const raw = localStorage.getItem('bl_tycoon_save')
      if (!raw) { pushToast(dispatch, 'No save found.', 'red'); return }
      const save = JSON.parse(raw)
      dispatch({ type: A.LOAD_SAVE, saveData: save })
      pushToast(dispatch, 'Game loaded!', 'green')
    } catch (e) {
      pushToast(dispatch, 'Load failed — save may be corrupted.', 'red')
    }
  }

  function handleReset() {
    SFX.fail()
    if (!window.confirm('Reset ALL progress? This cannot be undone.')) return
    localStorage.removeItem('bl_tycoon_save')
    dispatch({ type: A.LOAD_SAVE, saveData: { ...INITIAL_STATE, started: false } })
  }

  function handleRename() {
    SFX.click()
    const name = window.prompt('Enter new studio name:', state.companyName)
    if (name && name.trim()) {
      dispatch({ type: A.SET_COMPANY_NAME, name: name.trim() })
      pushToast(dispatch, `Studio renamed to "${name.trim()}"`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div className="panel">
        <div className="panel-title">⚙️ SETTINGS</div>

        {/* SFX Volume */}
        <div className="field">
          <label>SFX VOLUME: {Math.round(settings.sfxVolume * 100)}%</label>
          <input
            type="range" min={0} max={1} step={0.05}
            value={settings.sfxVolume}
            onChange={e => updateSetting('sfxVolume', Number(e.target.value))}
          />
        </div>

        {/* BGM Volume */}
        <div className="field">
          <label>MUSIC VOLUME: {Math.round(settings.bgmVolume * 100)}%</label>
          <input
            type="range" min={0} max={1} step={0.05}
            value={settings.bgmVolume}
            onChange={e => updateSetting('bgmVolume', Number(e.target.value))}
          />
        </div>

        {/* Animation speed */}
        <div className="field">
          <label>ANIMATION SPEED</label>
          <div className="seg">
            {[{ id: 0.5, label: 'SLOW' }, { id: 1, label: 'NORMAL' }, { id: 2, label: 'FAST' }].map(s => (
              <button key={s.id} type="button"
                className={settings.animSpeed === s.id ? 'sel' : ''}
                onClick={() => updateSetting('animSpeed', s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Studio */}
      <div className="panel">
        <div className="panel-title">🏢 STUDIO</div>
        <div style={{ fontSize: 8, color: 'var(--lav)', marginBottom: 10 }}>
          Current name: <span style={{ color: 'var(--pink)' }}>{state.companyName}</span>
        </div>
        <button onClick={handleRename} style={{ fontSize: 8, padding: '10px 14px' }}>
          ✏️ RENAME STUDIO
        </button>
      </div>

      {/* Save / Load */}
      <div className="panel">
        <div className="panel-title">💾 SAVE DATA</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-gold" onClick={handleSave} style={{ textAlign: 'center', fontSize: 9 }}>
            💾 SAVE GAME
          </button>
          <button onClick={handleLoad} style={{ textAlign: 'center', fontSize: 9 }}>
            📂 LOAD GAME
          </button>
          <button className="btn-danger" onClick={handleReset} style={{ textAlign: 'center', fontSize: 9, marginTop: 8 }}>
            🗑️ RESET ALL DATA
          </button>
        </div>
      </div>

      {/* Game info */}
      <div className="panel">
        <div className="panel-title">ℹ️ GAME INFO</div>
        <div style={{ fontSize: 7, color: 'var(--lav)', lineHeight: 2.5 }}>
          <div>BL PRODUCTION TYCOON</div>
          <div>Version: 1.0</div>
          <div>Week: {state.week}</div>
          <div>Productions completed: {state.history.length}</div>
          <div>Company: {state.companyName}</div>
        </div>
      </div>
    </div>
  )
}
