import React, { useState } from 'react'
import { GameProvider, useGame } from './game/state.jsx'
import TitleScreen from './components/TitleScreen.jsx'
import TopBar from './components/TopBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import ProductionForm from './components/ProductionForm.jsx'
import ActorRoster from './components/ActorRoster.jsx'
import ActorProfile from './components/ActorProfile.jsx'
import Settings from './components/Settings.jsx'
import ModalSystem from './components/ModalSystem.jsx'

// Inner app that has access to game context
function GameApp() {
  const { state } = useGame()
  const [screen, setScreen] = useState('dashboard')
  const [profileActor, setProfileActor] = useState(null)

  // Show title/intro until game is started
  if (!state.started) {
    return <TitleScreen />
  }

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
      case 'dashboard':    return <Dashboard setScreen={setScreen} />
      case 'produce':      return <ProductionForm setScreen={setScreen} />
      case 'actors':       return <ActorRoster openProfile={openProfile} />
      case 'profile':      return <ActorProfile actorId={profileActor} onBack={closeProfile} />
      case 'settings':     return <Settings />
      default:             return <Dashboard setScreen={setScreen} />
    }
  }

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
