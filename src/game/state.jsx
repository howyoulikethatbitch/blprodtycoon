/**
 * state.js — Central game state via React Context
 * All game-wide data lives here. Logic modules (actors, productions, etc.)
 * import from here and dispatch actions via the reducer.
 */
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'

// ─── Initial State ────────────────────────────────────────────────────────────
export const INITIAL_STATE = {
  started: false,
  companyName: 'Studio Sakura',
  week: 1,
  money: 50000,
  reputation: 10,
  popularity: 0,
  rank: 'INDIE',
  actors: [],          // populated by actors.js ACTOR_DATA on init
  productions: [],     // active & completed productions
  history: [],         // completed production records
  events: [],          // pending event queue
  modalQueue: [],      // pending modals to show
  toasts: [],          // ephemeral notification toasts
  settings: {
    sfxVolume: 0.6,
    bgmVolume: 0.4,
    animSpeed: 1,
  },
  flags: {},           // arbitrary boolean/value flags for events
}

// ─── Action Types ─────────────────────────────────────────────────────────────
export const A = {
  START_GAME:        'START_GAME',
  ADVANCE_WEEK:      'ADVANCE_WEEK',
  SET_MONEY:         'SET_MONEY',
  ADD_MONEY:         'ADD_MONEY',
  SET_REPUTATION:    'SET_REPUTATION',
  ADD_REPUTATION:    'ADD_REPUTATION',
  SET_POPULARITY:    'SET_POPULARITY',
  SET_RANK:          'SET_RANK',
  UPDATE_ACTOR:      'UPDATE_ACTOR',
  SET_ACTORS:        'SET_ACTORS',
  ADD_PRODUCTION:    'ADD_PRODUCTION',
  UPDATE_PRODUCTION: 'UPDATE_PRODUCTION',
  COMPLETE_PRODUCTION:'COMPLETE_PRODUCTION',
  PUSH_MODAL:        'PUSH_MODAL',
  POP_MODAL:         'POP_MODAL',
  PUSH_TOAST:        'PUSH_TOAST',
  DISMISS_TOAST:     'DISMISS_TOAST',
  PUSH_EVENT:        'PUSH_EVENT',
  RESOLVE_EVENT:     'RESOLVE_EVENT',
  SET_COMPANY_NAME:  'SET_COMPANY_NAME',
  SET_SETTINGS:      'SET_SETTINGS',
  SET_FLAG:          'SET_FLAG',
  LOAD_SAVE:         'LOAD_SAVE',
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function gameReducer(state, action) {
  switch (action.type) {

    case A.START_GAME:
      return {
        ...state,
        started: true,
        companyName: action.companyName ?? state.companyName,
        actors: action.actors ?? state.actors,
      }

    case A.ADVANCE_WEEK:
      return { ...state, week: state.week + 1 }

    case A.SET_MONEY:
      return { ...state, money: action.amount }

    case A.ADD_MONEY:
      return { ...state, money: state.money + action.amount }

    case A.SET_REPUTATION:
      return { ...state, reputation: Math.max(0, Math.min(100, action.value)) }

    case A.ADD_REPUTATION:
      return { ...state, reputation: Math.max(0, Math.min(100, state.reputation + action.amount)) }

    case A.SET_POPULARITY:
      return { ...state, popularity: Math.max(0, action.value) }

    case A.SET_RANK:
      return { ...state, rank: action.rank }

    case A.SET_ACTORS:
      return { ...state, actors: action.actors }

    case A.UPDATE_ACTOR:
      return {
        ...state,
        actors: state.actors.map(a =>
          a.id === action.id ? { ...a, ...action.patch } : a
        ),
      }

    case A.ADD_PRODUCTION:
      return { ...state, productions: [...state.productions, action.production] }

    case A.UPDATE_PRODUCTION:
      return {
        ...state,
        productions: state.productions.map(p =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      }

    case A.COMPLETE_PRODUCTION:
      return {
        ...state,
        productions: state.productions.filter(p => p.id !== action.id),
        history: [...state.history, action.record],
      }

    case A.PUSH_MODAL:
      return { ...state, modalQueue: [...state.modalQueue, action.modal] }

    case A.POP_MODAL:
      return { ...state, modalQueue: state.modalQueue.slice(1) }

    case A.PUSH_TOAST:
      return {
        ...state,
        toasts: [
          ...state.toasts.slice(-4), // cap at 5
          { id: Date.now() + Math.random(), ...action.toast },
        ],
      }

    case A.DISMISS_TOAST:
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }

    case A.PUSH_EVENT:
      return { ...state, events: [...state.events, action.event] }

    case A.RESOLVE_EVENT:
      return { ...state, events: state.events.filter(e => e.id !== action.id) }

    case A.SET_COMPANY_NAME:
      return { ...state, companyName: action.name }

    case A.SET_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.patch } }

    case A.SET_FLAG:
      return { ...state, flags: { ...state.flags, [action.key]: action.value } }

    case A.LOAD_SAVE:
      return { ...action.saveData, started: true }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE)
  const saveTimer = useRef(null)

  // Auto-save to localStorage on state change (debounced)
  useEffect(() => {
    if (!state.started) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem('bl_tycoon_save', JSON.stringify(state))
      } catch (e) {
        console.warn('Auto-save failed:', e)
      }
    }, 1000)
    return () => clearTimeout(saveTimer.current)
  }, [state])

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

// ─── Helper dispatchers ───────────────────────────────────────────────────────
export function pushToast(dispatch, message, variant = '') {
  dispatch({ type: A.PUSH_TOAST, toast: { message, variant } })
}

export function pushModal(dispatch, modal) {
  dispatch({ type: A.PUSH_MODAL, modal })
}
