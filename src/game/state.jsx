/**
 * state.jsx — Central game state via React Context
 * Prompt 4: added eventLog array + PUSH_EVENT_LOG action.
 */
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'

// ─── Initial State ────────────────────────────────────────────────────────────
export const INITIAL_STATE = {
  started:       false,
  companyName:   'Studio Sakura',
  week:          1,
  money:         50000,
  reputation:    10,
  popularity:    0,
  rank:          'INDIE',
  numericRank:   50,
  awards:        0,
  unlockedTiers: ['Rookie'],
  actors:        [],
  productions:   [],
  history:       [],
  events:        [],
  eventLog:      [],   // color-coded game log entries
  modalQueue:    [],
  toasts:        [],
  fixedCPs:      [],   // array of [actorIdA, actorIdB] pairs
  settings: {
    sfxOn:      true,
    scanlines:  true,
    animSpeed:  'normal',
  },
  flags:         {},
  lastSaved:     null,
}

// ─── Action Types ─────────────────────────────────────────────────────────────
export const A = {
  START_GAME:         'START_GAME',
  ADVANCE_WEEK:       'ADVANCE_WEEK',
  SET_MONEY:          'SET_MONEY',
  ADD_MONEY:          'ADD_MONEY',
  SET_REPUTATION:     'SET_REPUTATION',
  ADD_REPUTATION:     'ADD_REPUTATION',
  SET_POPULARITY:     'SET_POPULARITY',
  SET_RANK:           'SET_RANK',
  SET_NUMERIC_RANK:   'SET_NUMERIC_RANK',
  ADD_AWARD:          'ADD_AWARD',
  UNLOCK_TIER:        'UNLOCK_TIER',
  UPDATE_ACTOR:       'UPDATE_ACTOR',
  SET_ACTORS:         'SET_ACTORS',
  SIGN_ACTOR:         'SIGN_ACTOR',
  ADD_PRODUCTION:     'ADD_PRODUCTION',
  UPDATE_PRODUCTION:  'UPDATE_PRODUCTION',
  COMPLETE_PRODUCTION:'COMPLETE_PRODUCTION',
  PUSH_MODAL:         'PUSH_MODAL',
  POP_MODAL:          'POP_MODAL',
  PUSH_TOAST:         'PUSH_TOAST',
  DISMISS_TOAST:      'DISMISS_TOAST',
  PUSH_EVENT:         'PUSH_EVENT',
  RESOLVE_EVENT:      'RESOLVE_EVENT',
  PUSH_EVENT_LOG:     'PUSH_EVENT_LOG',
  ADD_FIXED_CP:       'ADD_FIXED_CP',
  REMOVE_FIXED_CP:    'REMOVE_FIXED_CP',
  SET_COMPANY_NAME:   'SET_COMPANY_NAME',
  SET_SETTINGS:       'SET_SETTINGS',
  SET_FLAG:           'SET_FLAG',
  LOAD_SAVE:          'LOAD_SAVE',
  MARK_SAVED:         'MARK_SAVED',
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function gameReducer(state, action) {
  switch (action.type) {

    case A.START_GAME:
      return {
        ...state,
        started:     true,
        companyName: action.companyName ?? state.companyName,
        actors:      action.actors     ?? state.actors,
      }

    case A.ADVANCE_WEEK:
      return { ...state, week: state.week + 1 }

    case A.SET_MONEY:
      return { ...state, money: action.amount }

    case A.ADD_MONEY:
      return { ...state, money: state.money + action.amount }

    case A.SET_REPUTATION:
      return { ...state, reputation: clamp(action.value, 0, 100) }

    case A.ADD_REPUTATION:
      return { ...state, reputation: clamp(state.reputation + action.amount, 0, 100) }

    case A.SET_POPULARITY:
      return { ...state, popularity: Math.max(0, action.value) }

    case A.SET_RANK:
      return { ...state, rank: action.rank }

    case A.SET_NUMERIC_RANK:
      return { ...state, numericRank: action.rank }

    case A.ADD_AWARD:
      return { ...state, awards: state.awards + (action.amount ?? 1) }

    case A.UNLOCK_TIER:
      if (state.unlockedTiers.includes(action.tier)) return state
      return { ...state, unlockedTiers: [...state.unlockedTiers, action.tier] }

    case A.SET_ACTORS:
      return { ...state, actors: action.actors }

    case A.UPDATE_ACTOR:
      return {
        ...state,
        actors: state.actors.map(a =>
          a.id === action.id ? { ...a, ...action.patch } : a
        ),
      }

    case A.SIGN_ACTOR:
      return {
        ...state,
        money:  state.money - action.cost,
        actors: state.actors.map(a =>
          a.id === action.id
            ? { ...a, signed: true, status: 'available' }
            : a
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
        history:     [...state.history, action.record],
      }

    case A.PUSH_MODAL:
      return { ...state, modalQueue: [...state.modalQueue, action.modal] }

    case A.POP_MODAL:
      return { ...state, modalQueue: state.modalQueue.slice(1) }

    case A.PUSH_TOAST:
      return {
        ...state,
        toasts: [
          ...state.toasts.slice(-4),
          { id: Date.now() + Math.random(), ...action.toast },
        ],
      }

    case A.DISMISS_TOAST:
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }

    case A.PUSH_EVENT:
      return { ...state, events: [...state.events, action.event] }

    case A.RESOLVE_EVENT:
      return { ...state, events: state.events.filter(e => e.id !== action.id) }

    case A.PUSH_EVENT_LOG:
      return {
        ...state,
        eventLog: [
          action.entry,
          ...(state.eventLog ?? []),
        ].slice(0, 80),   // keep last 80 entries
      }

    case A.ADD_FIXED_CP: {
      const [x, y] = action.pair
      const already = (state.fixedCPs ?? []).some(([a, b]) => (
        (a === x && b === y) || (a === y && b === x)
      ))
      if (already) return state
      return { ...state, fixedCPs: [...(state.fixedCPs ?? []), [x, y]] }
    }

    case A.REMOVE_FIXED_CP: {
      const [x, y] = action.pair
      return {
        ...state,
        fixedCPs: (state.fixedCPs ?? []).filter(
          ([a, b]) => !((a === x && b === y) || (a === y && b === x))
        ),
      }
    }

    case A.SET_COMPANY_NAME:
      return { ...state, companyName: action.name }

    case A.SET_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.patch } }

    case A.SET_FLAG:
      return { ...state, flags: { ...state.flags, [action.key]: action.value } }

    case A.LOAD_SAVE:
      return {
        ...action.saveData,
        started:   true,
        eventLog:  action.saveData.eventLog  ?? [],
        fixedCPs:  action.saveData.fixedCPs  ?? [],
      }

    case A.MARK_SAVED:
      return { ...state, lastSaved: action.ts }

    default:
      return state
  }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

// ─── Context ──────────────────────────────────────────────────────────────────
const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE)
  const saveTimer = useRef(null)

  // Auto-save (debounced 1 s)
  useEffect(() => {
    if (!state.started) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem('bl_tycoon_save', JSON.stringify(state))
        dispatch({ type: A.MARK_SAVED, ts: Date.now() })
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

// ─── Dispatch helpers ─────────────────────────────────────────────────────────
export function pushToast(dispatch, message, variant = '') {
  dispatch({ type: A.PUSH_TOAST, toast: { message, variant } })
}

export function pushModal(dispatch, modal) {
  dispatch({ type: A.PUSH_MODAL, modal })
}

/**
 * Push a color-coded entry to the Event Log.
 * variant: 'green' | 'red' | 'gold' | 'pink' | ''
 */
export function pushEventLog(dispatch, message, variant = '', week = null) {
  dispatch({
    type: A.PUSH_EVENT_LOG,
    entry: {
      id:      Date.now() + Math.random(),
      message,
      variant,
      week,
    },
  })
}
