/**
 * Sidebar.jsx — Navigation
 * Desktop: left sidebar (230px)
 * Mobile (<760px): bottom navigation bar
 */
import React from 'react'
import { useGame } from '../game/state.jsx'
import { SFX } from '../game/audio.js'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', shortLabel: 'HOME' },
  { id: 'produce',   label: 'Produce',   icon: '🎬', shortLabel: 'MAKE' },
  { id: 'actors',    label: 'Actors',    icon: '⭐', shortLabel: 'CAST' },
  { id: 'settings',  label: 'Settings',  icon: '⚙️', shortLabel: 'SET'  },
]

export default function Sidebar({ currentScreen, setScreen }) {
  const { state } = useGame()

  function navigate(id) {
    SFX.click()
    setScreen(id)
  }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <nav style={styles.sidebar} aria-label="Main navigation">
        <div style={styles.sideInner}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              style={{
                ...styles.navBtn,
                ...(currentScreen === item.id ? styles.navActive : {}),
              }}
              aria-current={currentScreen === item.id ? 'page' : undefined}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Mini status */}
        <div style={styles.sideFooter}>
          <div style={styles.miniStat}>
            <span style={{ color: 'var(--lav)', fontSize: 7 }}>ACTIVE</span>
            <span style={{ color: 'var(--green)', fontSize: 9 }}>
              {state.productions.filter(p => p.status === 'active').length} prod.
            </span>
          </div>
          <div style={styles.miniStat}>
            <span style={{ color: 'var(--lav)', fontSize: 7 }}>HISTORY</span>
            <span style={{ color: 'var(--pink)', fontSize: 9 }}>
              {state.history.length} done
            </span>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav style={styles.bottomNav} aria-label="Bottom navigation">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            style={{
              ...styles.bottomBtn,
              ...(currentScreen === item.id ? styles.bottomActive : {}),
            }}
            aria-current={currentScreen === item.id ? 'page' : undefined}
          >
            <span style={styles.bottomIcon}>{item.icon}</span>
            <span style={styles.bottomLabel}>{item.shortLabel}</span>
          </button>
        ))}
      </nav>
    </>
  )
}

const styles = {
  /* Desktop sidebar */
  sidebar: {
    width: 'var(--sidebar-w)',
    flexShrink: 0,
    background: 'var(--bg-panel)',
    borderRight: '3px solid var(--shadow)',
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflowY: 'auto',
    // Hide on mobile via CSS (media query in theme.css doesn't cover inline styles,
    // so we use a data attribute + style tag below)
  },
  sideInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    textAlign: 'left',
    fontSize: 9,
    padding: '12px 10px',
    background: 'transparent',
    border: '2px solid transparent',
    boxShadow: 'none',
    color: 'var(--lav)',
    minHeight: 44,
  },
  navActive: {
    background: 'var(--bg-inset)',
    border: '2px solid var(--pink-dim)',
    color: 'var(--pink)',
    boxShadow: '2px 2px 0 var(--shadow)',
  },
  navIcon:  { fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 },
  navLabel: { fontSize: 9 },

  sideFooter: {
    borderTop: '2px solid var(--shadow)',
    paddingTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  miniStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* Mobile bottom nav */
  bottomNav: {
    display: 'none',   // shown via media query override in <style> tag below
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 'var(--bottom-nav-h)',
    background: 'var(--bg-deep)',
    borderTop: '3px solid var(--pink)',
    zIndex: 100,
    // flex set by media query
  },
  bottomBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    color: 'var(--gray)',
    padding: '6px 4px',
    minHeight: 'var(--bottom-nav-h)',
    fontSize: 7,
  },
  bottomActive: {
    color: 'var(--pink)',
    background: 'rgba(255,107,157,0.08)',
    borderTop: '3px solid var(--pink)',
  },
  bottomIcon:  { fontSize: 20 },
  bottomLabel: { fontSize: 7, letterSpacing: 1 },
}

// Inject responsive rules into document head once
if (typeof document !== 'undefined') {
  const id = 'sidebar-responsive-css'
  if (!document.getElementById(id)) {
    const s = document.createElement('style')
    s.id = id
    s.textContent = `
      @media (max-width: 759px) {
        nav[aria-label="Main navigation"]:first-of-type { display: none !important; }
        nav[aria-label="Bottom navigation"] { display: flex !important; }
      }
      @media (min-width: 760px) {
        nav[aria-label="Bottom navigation"] { display: none !important; }
      }
    `
    document.head.appendChild(s)
  }
}
