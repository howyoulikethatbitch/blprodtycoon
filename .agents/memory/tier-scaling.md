---
name: Tier scaling system
description: How the Prompt-8 tier-based balance system is wired across the codebase.
---

# Tier scaling system

## Rule
Game difficulty scales by current week (not company rank) via `getGameTier(week)` from `src/game/tiers.js`. The four tiers are: Rookie (0–19), Rising Star (20–49), Popular (50–99), Worldwide (100+).

**Why:** Prompt 8 spec — early game should be forgiving, late game challenging but fair.

**How to apply:**
- `getGameTier(week)` → returns tier config object with all balance params
- `getNextGameTier(week)` → returns next tier config (or null at Worldwide)
- Tier is read at the top of `advanceWeek()` in weekAdvance.js and threaded through all sub-calls
- To add new tier-scaled parameters, add the field to each entry in `GAME_TIERS` in tiers.js

## Key wiring points
- **events.js**: CP event frequency (cpEventFreq), decline penalties, free:paid ratio, CP breakup threshold — all read from tier
- **actors.js**: `weeklyActorTick(actor, tier)` — idle happiness/loyalty thresholds and tick rate from tier; filming gives +5 loyalty/week; tracks activeFilmingWeeks and wasHappyBeforeIdle for happiness recovery
- **productions.js**: `calcCost(..., costMod)` and `calcRevenue(..., revenueMod)` accept optional tier multipliers
- **evaluators.js / critics.js**: `runAllCritics(..., tier)` applies reviewStarBonus and repLossCap
- **weekAdvance.js**: computes `tier = getGameTier(week)` at start; passes to all sub-calls; handles emergency save at loyalty ≤ 10 (flag: loyaltyEmergency_<actorId>); adds reputation repair events (30% after rep loss); applies resignCostMult to ex-actor resign cost
- **ProductionForm.jsx**: reads `getGameTier(state.week)` and passes `productionCostMod` to `calcCost`; shows tier info in cost preview
- **TopBar.jsx**: renders `TierStat` component showing current tier label, color, and weeks until next tier
