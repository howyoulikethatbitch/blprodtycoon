/**
 * App.jsx — Root game app, screen routing
 * Prompt 8: Confetti mounted, settings → body class wiring
 */
import React, { useState, useEffect } from 'react'
import { GameProvider, useGame } from './game/state.jsx'
import TitleScreen from './components/TitleScreen.jsx'
import TopBar from './components/TopBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import ProductionForm from './components/ProductionForm.jsx'
import ActorRoster from './components/ActorRoster.jsx'
import ActorProfile from './components/ActorProfile.jsx'
import Settings from './components/Settings.jsx'
import CompanyStatus from './components/CompanyStatus.jsx'
import ModalSystem from './components/ModalSystem.jsx'
import Confetti from './components/Confetti.jsx'
import { setSfxEnabled } from './game/audio.js'

function GameApp() {
  const { state } = useGame()
  const [screen, setScreen]             = useState('dashboard')
  const [profileActor, setProfileActor] = useState(null)

  // ── Wire settings → body classes + audio ─────────────────────────────────
  useEffect(() => {
    const b = document.body
    // Scanlines
    b.classList.toggle('no-scanlines', !state.settings?.scanlines)
    // Animation speed
    b.classList.remove('anim-slow', 'anim-fast')
    if (state.settings?.animSpeed === 'slow') b.classList.add('anim-slow')
    if (state.settings?.animSpeed === 'fast') b.classList.add('anim-fast')
    // SFX
    setSfxEnabled(state.settings?.sfxOn !== false)
  }, [state.settings?.scanlines, state.settings?.animSpeed, state.settings?.sfxOn])

  if (!state.started) return <TitleScreen />

  const openProfile = (actorId) => {
    setProfileActor(actorId)
    setScreen('profile')
  }
  const closeProfile = () => {
    setProfileActor(null)
    setScreen('actors')
  }

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <Dashboard setScreen={setScreen} />
      case 'produce':   return <ProductionForm setScreen={setScreen} />
      case 'actors':    return <ActorRoster openProfile={openProfile} />
      case 'profile':   return <ActorProfile actorId={profileActor} onBack={closeProfile} />
      case 'company':   return <CompanyStatus setScreen={setScreen} />
      case 'settings':  return <Settings />
      default:          return <Dashboard setScreen={setScreen} />
    }
  }

  // Lock body scroll when a modal is open
  useEffect(() => {
    document.body.classList.toggle('modal-open', state.modalQueue.length > 0)
    return () => document.body.classList.remove('modal-open')
  }, [state.modalQueue.length])

  return (
    <div className="app-layout">
      <TopBar />
      <div className="app-body">
        <Sidebar currentScreen={screen} setScreen={setScreen} />
        <main className="app-main">
          {renderScreen()}
        </main>
      </div>
      <ModalSystem />
      <Confetti />
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  )
}
