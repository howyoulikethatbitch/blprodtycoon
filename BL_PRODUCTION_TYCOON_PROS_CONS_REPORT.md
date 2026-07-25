# BL Production Tycoon — Complete Game Design Audit (No Restrictions)
**Prepared by:** Consolidated Game Design Audit Team (Senior Game Designer, Gameplay Designer, Systems Designer, Balance Designer, UX Designer, Economy Designer, Progression Designer, Tycoon/Simulation Designer, QA Gameplay Analyst)
**Status:** Pre-Release Post-Production Evaluation

---

## 1. Executive Summary & Audit Overview

This document represents an exhaustive, unrestricted design audit of **BL Production Tycoon**. Our interdisciplinary team has evaluated the game under the assumption of an imminent commercial launch. We have scrutinized all individual systems, their math, their cross-system interactions, UX feedback, economic balance, progression pacing, and the overall player journey.

Our core finding is that **BL Production Tycoon** possesses a brilliant, highly thematic hook (the niche but explosive Boy's Love shipping and drama television production industry) and a robust foundation. However, the game currently suffers from several design friction points, pacing bottlenecks, and UX dead-ends that weaken its late-game motivation and occasionally disrupt the fantasy of running a prestige entertainment empire.

---

## 2. Core Systems Audit

### A. Core Gameplay & The Weekly Loop
*An analysis of the central gameplay rhythm: choosing productions, setting up focus, advancing weeks, and resolving events.*

*   **Strengths:**
    *   **Thematic Cohesion:** The weekly structure perfectly mimics the episodic release cycle of television.
    *   **Clear Information Flow:** Players receive prompt feedback on weekly activities via the Event Log and Toast system, keeping them aware of passive changes.
    *   **Low Barrier to Entry:** The loop of "Create Production -> Wait for Filming -> Episode Releases -> Evaluate" is immediately intuitive to fans of tycoon and simulation games.
*   **Weaknesses:**
    *   **Click Fatigue:** Advancing weeks manually one by one becomes highly tedious in the late-game, especially during multi-week filming/broadcast phases of 12-Month series where the player is just waiting for a project to finish with zero active decisions to make.
    *   **Passive Play Dead-zones:** During active filming of long projects, player agency plummets. Aside from occasional random events, the player has no active, strategic knobs to turn to adjust an ongoing production's outcome.
*   **Root Cause:**
    *   The core loop is modeled as a strict, turn-based sequence where "Advance Week" triggers all actor recovery, active productions, and passive events. There is no "Auto-resolve" or "Simulate until event/wrap" function.
*   **Severity:** **Medium**
*   **Recommendation:**
    *   Implement an "Auto-Advance" toggle or a "Skip to Next Decision Point" button that automatically ticks the weeks until a production wraps, an actor has a crisis, or a critical event requires input. This preserves agency while eliminating clicking fatigue.

---

### B. Player Progression & Company Tiers
*An analysis of how players advance from INDIE up to WORLDWIDE, and the mechanics that gate this progression.*

*   **Strengths:**
    *   **Rank-Based Tier Unlocks:** Shifting tier thresholds (Rookie, Rising Star, Popular, Worldwide) to be derived dynamically from the player's leaderboard numeric rank (101 slots) rather than game week provides an active, highly competitive progression goal.
    *   **Free Auto-Signing Rewards:** Unlocking a tier and automatically signing its roster actors for free feels like a major triumph and provides immediate, tangible rewards for climbing the ranks.
*   **Weaknesses:**
    *   **The Numeric Rank Wall:** The climb between #45 (Popular) and #15 (Worldwide) is a massive reputation grind. Because the player’s score is weighed against dynamic rivals whose scores continue to tick upward, players can find themselves stuck in a progression bottleneck where they cannot afford Worldwide production budgets but cannot climb further with Popular actors.
    *   **obsolete Tiers:** Once a player unlocks a higher tier (e.g., Worldwide), lower-tier actors (Rookies) become strategically useless in standard productions because their base stats cannot compete, turning the once-beloved early-game roster into dead scrolling weight.
*   **Root Cause:**
    *   The skill formulas weigh absolute actor stats heavily. Because higher-tier actors have vastly superior skill baselines and caps, the game naturally funnels the player to abandon early actors, defeating the emotional investment of "growing together with your roster."
*   **Severity:** **High**
*   **Recommendation:**
    *   Introduce a "Mentorship" or "Coaching" system where high-tier actors can train lower-tier actors during downtime, lifting their stat caps. Additionally, create specialized "Indie-Only Awards" or "Rookie Festivals" to maintain the viability and strategic purpose of lower-tier talent.

---

### C. Economy & Financial Model
*An analysis of cash flow, budget allocations, production costs, and platform revenues.*

*   **Strengths:**
    *   **Platform Financial Differentiation:** TV (📡) and Streaming (📱) represent excellent strategic choices: TV focuses on high reach and popularity (reputation growth) but suppresses revenue, while Streaming maximizes revenue at the cost of popularity growth. This forces the player to actively cycle their distribution strategy.
    *   **Realistic Cost Scaling:** The production cost formula (`calcCost`) elegantly factors in format base cost, budget multiplier, schedule length, cast size, and platform fee modifiers, creating realistic budget demands.
*   **Weaknesses:**
    *   **Early Game Bankruptcy Trap:** For Rookies, selecting a Movie format or high budget multipliers on Streaming can lead to sudden, unrecoverable bankruptcy if a single negative event rolls.
    *   **Late-Game Infinite Cash:** In the late game, once a studio establishes an S-tier loop, Streaming revenue scales exponentially. Players end up with millions of ₩ with nothing to spend it on, rendering the economic challenge completely obsolete.
*   **Root Cause:**
    *   The revenue multiplier scales directly off the audience score raised to the power of 1.3 (`Math.pow(audienceScore / 100, 1.3)`). This compounding exponential curve creates too steep a variance: a 40-score project brings in pennies, while a 95-score blockbuster prints millions, leaving no middle class of sustainable, modest earners.
*   **Severity:** **High**
*   **Recommendation:**
    *   Dampen the exponential revenue curve by applying a logarithmic scale to late-game payouts, or introduce significant late-game money-sinks such as purchasing permanent studio upgrades, buying out rival agencies, or hiring directors/producers with passive skill boosts.

---

### D. Actor Management (Loyalty, Happiness, Training & Downtime Activities)
*An analysis of the actor lifecycle: training, downtime activities, happiness/loyalty metrics, and exit mechanics.*

*   **Strengths:**
    *   **Downtime Strategic Value:** Downtime activities (Acting Masterclass and Fan Meetings) provide players with an excellent way to actively develop their actors and maintain morale when they are not filming.
    *   **Emergency Save System:** The "Emergency Save Event" triggered at loyalty $\le 10$ provides a fair, dramatic window for players to save an actor they neglected, maintaining player engagement before punishing them.
*   **Weaknesses:**
    *   **The Burn Letter Penalty Cascade:** When an actor's loyalty hits zero, they leave for the free agents pool, but their departure triggers a harsh loyalty/happiness penalty on their most recent co-star. This can trigger a catastrophic domino effect: Actor A leaves, which tanks Actor B's loyalty, who then leaves next week, tanking Actor C's loyalty, destroying the player's roster.
    *   **Stat Bloat and Decay Absence:** Because skills never decay and there is no cap on training other than time/money, actors eventually become hyper-optimized gods, removing all challenge from casting decisions.
*   **Root Cause:**
    *   The burn letter penalty is a static decrement applied instantly. There is no mitigation check (such as check if the remaining actor is already cast in a high-paying, active production, which should theoretically override their disappointment).
*   **Severity:** **High**
*   **Recommendation:**
    *   Dampen the co-star departure penalty: if the co-star is currently filming an active project, the loyalty penalty should be halved or bypassed entirely because they are actively working. Introduce dynamic stat decay if an actor is completely idle (neither filming nor participating in downtime) for more than 12 weeks.

---

### E. Chemistry & Couple Pairings (Fixed CP, Breakups, & Amicable Graduation)
*An analysis of the shipping meta-game, chemistry scaling, and the fixed Couple Pairing (CP) contracts.*

*   **Strengths:**
    *   **Theme-Perfect shipping Loop:** The "Fixed CP" contract perfectly captures the fanservice-heavy culture of real-world BL media, offering high emotional and gameplay resonance.
    *   **Amicable Graduation Contract:** Adding `A.GRADUATE_FIXED_CP` allows a highly rated pair to retire their pairing honorably after 3+ high-rated productions, offering a narrative and mechanical exit strategy without destroying studio reputation or actor loyalty.
*   **Weaknesses:**
    *   **Chemistry Cap Soft-Cap Friction:** The chemistry cap (`applyChemCap`) applies a steep 35% rate reduction above 75 chemistry. While this prevents rapid optimization, it makes the climb from 80 to 100 chemistry feel like a tedious, invisible wall, frustrating players trying to hit "Legendary" shipping status.
    *   **Breakup Penalty Severity:** For Worldwide actors, the breakup threshold is a high 20 chemistry. If chemistry dips below this, the resulting reputation and loyalty penalties are devastating, occasionally punishing players for random negative events that were completely out of their control.
*   **Root Cause:**
    *   The chemistry calculations are highly dependent on the "Live Chemistry" formula which subtracts points if actor average happiness drops below 60 (`((avg_happiness - 60) * 0.15)`). A brief string of bad luck on random events can tank happiness, dragging live chemistry below the breakup threshold before the player has a single turn to react.
*   **Severity:** **High**
*   **Recommendation:**
    *   Introduce a "Grace Period" warning week when a Fixed CP's chemistry drops below the breakup threshold. Rather than triggering an instant, punishing breakup, give the player one week to schedule an emergency fan meeting or pay a bonus to stabilize the partnership.

---

### F. Production Setup & Execution Mechanics
*An analysis of format types, scheduling, ratings, and story origins.*

*   **Strengths:**
    *   **Rolling Schedules:** The elimination of rigid calendar-year boundaries for production schedules has made scheduling incredibly fluid. Letting productions spill over from Week 52 to Week 1 of the next year is a massive quality-of-life win.
    *   **Diverse Story Origins:** The tradeoff between Original (+6 base score, high variance) and Adaptation (+1 base score, stable audience reception) is well-balanced and mimics commercial publishing dynamics.
*   **Weaknesses:**
    *   **Movie Disadvantage:** The Movie format remains extremely high risk. Because a Movie consists of exactly 1 episode, a single bad rating roll ruins the entire project. Series and Mini-Series, on the other hand, benefit from episode-by-episode averaging, making movies a statistically inferior choice for stable income.
    *   **TV Platform R-Rating Block:** While thematic, TV completely blocking R-rated content means half of the mature, high-difficulty genres (like Psychological, Thriller, Omegaverse) are permanently cut off from TV distribution, limiting player choice in high-tier gameplay.
*   **Root Cause:**
    *   Movies do not have a separate "Cinematic Release" or "Box Office" evaluation pipeline; they simply share the episodic release code with `episodesTotal: 1`, leaving them highly vulnerable to standard single-episode RNG.
*   **Severity:** **Medium**
*   **Recommendation:**
    *   Give the Movie format an intrinsic "Critic Buffer" or a passive +10 score floor to offset its single-episode vulnerability, reflecting the higher production values and prestige associated with cinematic releases.

---

### G. Genre & Theme Systems (Trends, Unlocks, & Genre Slot Machine)
*An analysis of the 22 genres, 29 themes, trends, and the Slot Machine mechanics.*

*   **Strengths:**
    *   **Incredibly Rich Theme Combo Matrix:** The extensive list of themes (Slow Burn, Enemies-to-Lovers, Omegaverse, etc.) and their specific fit modifiers with genres and production types represents a massive depth of strategy.
    *   **The Slot Machine Hook:** Rolling for trend boosts or discovering locked genres early creates highly addictive, high-excitement micro-moments.
*   **Weaknesses:**
    *   **RNG Dethroning Strategy:** A lucky 2× Combo Multiplier roll on the slot machine completely outclasses careful actor training and strategic selection. A player who puts zero effort into casting can easily outperform an optimized masterpiece simply by getting lucky on the slot spin.
    *   **Obsolete Genre Cooldowns:** The 13-week genre reuse penalty (`REUSE_COOLDOWN`) is meant to prevent spamming, but because players start with only 3 unlocked genres (Romance, School, Office), they are practically forced to trigger the penalty in the early game, artificially choking their progress.
*   **Root Cause:**
    *   The slot machine 2× Combo Multiplier is a flat doubler applied to the final evaluation score multiplier. In contrast, the early-game genre pool is extremely narrow, making variety impossible before grade-based unlocks occur.
*   **Severity:** **High**
*   **Recommendation:**
    *   Nerf the slot machine's 2× Combo Multiplier to a more reasonable 1.35×, and shift it to affect cash/popularity payouts rather than the core quality rating. Start players with 4 unlocked genres instead of 3 (adding Comedy or Slice of Life) to provide enough breathing room to avoid early-game cooldown penalties.

---

### H. Rivalry, Leaderboard Rankings, & Rival Studios
*An analysis of the competitive studio environment and the 10-week showdown events.*

*   **Strengths:**
    *   **Dynamic Leaderboard feel:** Having 100 rival studios that actively gain and lose ranking points gives the game world a living, breathing simulated atmosphere.
    *   **Showdown High-Stakes:** The 10-week showdowns provide a fun, dramatic checkpoint to test player growth against their closest rival.
*   **Weaknesses:**
    *   **Showdown Black Box Math:** The outcome of the Showdown event feels like a complete black box. Players are presented with their score and the rival's score, followed by a random win/loss roll. There is no breakdown of *why* they won or lost, or what specific stats carried the victory.
    *   **No Active Sabotage/Competition:** The rivalry system is purely passive. Players cannot actively interact with, partner with, or sabotage rival studios, leaving the "Tycoon" aspect of studio competition feeling superficial.
*   **Root Cause:**
    *   The Showdown calculation uses a simple relative-score probability formula (`winChance = (ps / (ps + rival.score)) * 1.6 + 0.05`). It is resolved purely as a single coin-flip with no sub-checks or interactive choices.
*   **Severity:** **Medium**
*   **Recommendation:**
    *   Expand Showdowns to include a basic draft or strategy selection: let players choose a "Focus" for the showdown (e.g., Media Blitz, Talent Showdown, or Fan Appeal), matching their studio's best assets against the rival's weak areas.

---

### I. Awards & Achievement Systems
*An analysis of the Year-End BL Awards Ceremony, nominations, and attendance effects.*

*   **Strengths:**
    *   **Excellent End-of-Year Climax:** The Week 52 BL Awards Night serves as a perfect narrative and strategic culmination of a full year's gameplay.
    *   **Decision-Driven Attendance:** Giving players the choice to Attend (high risk, high reward) or Skip (safe) adds a layer of roleplaying agency.
*   **Weaknesses:**
    *   **Consecutive-Win Bias Punishments:** The award system implements a "Consecutive-Win Penalty" where winning Actor of the Year multiple times in a row heavily penalizes future nominations. While realistic for keeping industry diversity, it highly frustrates players who have rightfully built a Legendary pairing and want to enjoy their era of dominance.
    *   **Lack of Category Variety:** The awards are heavily weighted toward acting skills, often ignoring high-production-value technical aspects, which penalizes studios that focus heavily on high-budget Movie formats over raw actor training.
*   **Root Cause:**
    *   Award evaluations utilize a static calculation model focused on individual actor stats, neglecting a holistic review of studio-wide milestones or technical excellence.
*   **Severity:** **Medium**
*   **Recommendation:**
    *   Add more diverse award categories, such as "Best Cinematography" (weighing budget/platform), "Best Screenplay/Adaptation," or "Fan Favorite Ship" (weighing chemistry over raw stats) to allow different gameplay styles to shine.

---

### J. Modals, UI/UX Flow, & The Loading Screen
*An analysis of interface responsiveness, readability, queues, and atmospheric loading transitions.*

*   **Strengths:**
    *   **Reduced-Motion Accessibility Skip:** Allowing users to instantly skip the 30-second atmospheric loading screen down to 300ms by detecting `prefers-reduced-motion: reduce` is an outstanding, highly thoughtful implementation of modern accessibility standards.
    *   **Clean Retro Aesthetic:** The scanlines, retro-themed palette, and cohesive UI styling match the Boy's Love simulation theme perfectly.
*   **Weaknesses:**
    *   **Modal Stack Fatigue:** Because all weekly events, chemistry pulses, and production updates trigger modals, players can occasionally be hit with a stack of 5–6 consecutive popups at the start of a week. This halts gameplay momentum and leads to rapid, unread clicking to close them.
    *   **Interactive Checklist Lack:** In the Production Form, finding out exactly what requirements are needed to unlock a specific restricted genre or theme can be tedious, requiring the player to navigate back and forth to their status screen.
*   **Root Cause:**
    *   The central state uses a strict `modalQueue` array. Any system during the week tick that needs to communicate with the player simply pushes to the queue, resulting in sequential pop-ups rather than consolidated dashboards.
*   **Severity:** **High**
*   **Recommendation:**
    *   Consolidate minor alerts (such as minor chemistry gains, stat recoveries, or minor event resolutions) into a single, beautifully designed "Weekly Recap Newsletter" modal at the start of the turn, reserving individual high-impact modals exclusively for critical choices (breakups, promotions, crises).

---

## 3. Cross-System Analysis & Interactions

### The "Morale-Chemistry-Breakup" Doom Loop
The most critical interaction vulnerability in **BL Production Tycoon** occurs in the intersection of the **Weekly Actor Tick**, **Chemistry Scaling**, and **Fixed CP Breakup** systems.

```
[Bad Event/Injury] ──> [Happiness Plummets] ──> [Live Chemistry Drops]
                                                         │
[Severe Penalties] <── [Instant Breakup] <── [Below Breakup Threshold]
```

When an actor experiences an injury or a negative random event, their happiness drops. During the weekly tick, low happiness pulls down their "Live Chemistry" with their partner. If this partner is in a Fixed CP, and they are Worldwide-tier, their breakup threshold is a high 20. If their live chemistry slips to 19, the CP instantly breaks. This triggers massive reputation and loyalty losses, leading to the actor quitting, which in turn triggers co-star penalties and a full-scale **Studio Reputation Crisis**.

This interaction turns what should be a slow-burn management challenge into a sudden, chaotic chain reaction that can wipe out hours of player progress over the span of 2–3 weeks.

---

## 4. Player Journey Analysis

```
  Excitement
     ▲
100  │        ┌───┐ (Rookie Unlocks)
     │       ╱     ╲                 ┌───┐ (Worldwide Tier)
 75  │      ╱       └───┐           ╱     ╲
     │     ╱             ╲         ╱       └───► [Late-Game Grind]
 50  │    ╱               └───►───╱
     │  ┌─┘ (Early-Game)    (Mid-Game Bottleneck)
  0  └──┴────────────────────────────────────────► Time (Weeks)
       0m   30m      10w       30w       50w
```

### 1. First 30 Minutes (Greenhorn Phase)
*   **Experience:** **Very High.**
*   The scanlines, retro music, and the humor of casting your first mini-series are highly engaging. Discovering the initial romance/school combos feels fresh and thematic.
*   **Drop-off Risk:** Low, but players can feel constrained by the small 3-genre starting pool.

### 2. Early Game (Weeks 1 - 20)
*   **Experience:** **High.**
*   Unlocking the first few genres (Music, Sports, Slice of Life) and managing your first Rising Star actors provides a steady stream of dopamine.
*   **Drop-off Risk:** Medium. If players experience an early bankruptcy due to choosing high-budget movies too early, they may quit out of frustration.

### 3. Mid Game (Weeks 21 - 50)
*   **Experience:** **Moderate (Pacing Bottleneck).**
*   This is the weakest part of the journey. Players have mastered the core mechanics, but they face a steep climb to reach the "Popular" tier. Money is no longer a tight constraint, but the grind for Reputation to unlock higher tiers becomes highly repetitive. Modals begin stacking up, and click fatigue sets in.

### 4. Late Game (Weeks 51 - 100)
*   **Experience:** **High (Peak Accomplishment).**
*   Reaching the "Popular" and "Worldwide" tiers and unlocking blockbuster Movies feels incredible. Triggering Fixed CPs with high-tier actors and managing massive, multi-million-₩ budgets satisfies the ultimate tycoon fantasy.

### 5. End Game (Weeks 101+)
*   **Experience:** **Low (Strategic Flatline).**
*   Once the leaderboard is conquered (#1 rank achieved), the economic loop completely breaks down due to infinite money, and roster stats are maxed out. With no remaining milestones or capital sinks, the game loses its replayability.

---

## 5. Design Philosophy Evaluation

| Principle | Achievement Rating | Critical Design Evaluation |
| :--- | :---: | :--- |
| **Easy to Learn** | **9.5 / 10** | *Excellent.* Clear tutorials, intuitive UI, and immediate feedback make the game accessible to anyone. |
| **Difficult to Master** | **6.0 / 10** | *Sub-par.* Once the player learns to avoid R-rated TV, keeps happiness above 70, and abuses Streaming for cash, there is little strategic depth left. |
| **Hard but Not Harsh** | **4.0 / 10** | *Fails.* The "Morale-Chemistry-Breakup" doom loop is incredibly harsh, offering no warning or recovery window before devastating penalties hit. |
| **Every Decision Matters** | **7.5 / 10** | *Good.* Focus points, platform choices, and story origins represent highly meaningful decisions that shape every project. |
| **Every Success Feels Earned** | **5.5 / 10** | *Weakened.* The slot machine's high random multipliers (2×) overshadow strategic decision-making, making some successes feel like luck. |
| **Long-Term Progression** | **8.0 / 10** | *Strong.* The numeric leaderboard rank and dynamic rivals provide an active, long-term progression path. |
| **High Replayability** | **5.0 / 10** | *Moderate.* The lack of dynamic roster generation, procedural events, or late-game economic sinks limits replayability once #1 is reached. |
| **Fair Challenge** | **6.5 / 10** | *Moderate.* Mostly fair, but vulnerable to random events triggering unpreventable cascades. |
| **Strong Player Agency** | **7.0 / 10** | *Strong early, weak during production.* Excellent agency in preparation, but players are passive observers during filming. |

---

## 6. Consolidated Final Verdict

### Top 10 Biggest Strengths (What works beautifully)
1. **Unrivaled Theme Integration:** The Boy's Love shipping and fanservice mechanics are uniquely immersive and mechanically integrated.
2. **Fixed CP Contract & Custom Shipping Names:** Perfectly simulates real-world shipping culture and fandom dynamics.
3. **Amicable Graduation Contract:** A brilliant, humane exit strategy for legendary pairings that preserves player progress.
4. **Rank-Based Tier Unlocks:** Dynamic, competitive progression driven by leaderboard performance.
5. **The Rolling Schedule system:** Cross-year production schedules prevent rigid calendar blocks and improve gameplay flow.
6. **Platform Strategic Pacing:** Clear financial split between TV (reputation) and Streaming (cash).
7. **The Reduced-Motion Loading Skip:** Exceptional accessibility and user-friendly UX design.
8. **Atmospheric Set Updates:** Modular, data-driven "Production Atmosphere" system adds non-blocking narrative life to active filming.
9. **Four Distinct Critics System:** Sequential, thematic review pipeline that offers clear, logical critiques.
10. **Reputation Repair Opportunity:** A fair, highly immersive narrative mechanism to recover from poor reviews.

### Top 10 Biggest Weaknesses (What frustrates or fails)
1. **The "Morale-Chemistry-Breakup" Doom Loop:** Sudden, unpreventable breakup cascades that trigger total studio collapse.
2. **Click Fatigue & Modal Stack Bloat:** Advancing weeks manually and clicking through 5 consecutive popups ruins momentum.
3. **Movie Single-Episode Risk Vulnerability:** Movies are statistically inferior and far riskier than serialized formats.
4. **Slot Machine Overwhelming Multipliers:** Luck-based 2× combo spins completely invalidate strategic optimization.
5. **Obsolescence of Early-Game Roster:** Lower-tier actors become completely useless and clutter the late-game UI.
6. **Showdown Black Box Resolution:** No active participation or strategic depth in the 10-week rival face-offs.
7. **Severe Early-Game Cooldown Penalty:** Starting with only 3 genres forces players to trigger the genre reuse penalty immediately.
8. **Lack of Late-Game Economic Sinks:** Infinite money with nothing to buy renders the economy obsolete.
9. **Stat Bloat & Absence of Skill Decay:** Actors eventually become flawless, removing all casting challenge.
11. **TV Platform R-Rating Block Severity:** Completely locks mature, high-difficulty genres out of the most popular reach channel.

### Top 10 Biggest Missed Opportunities (Unrealized potential)
1. **Interactive Showdown Minigames:** Draft mechanics or PR battles during rival showdowns.
2. **Coaching/Mentorship Systems:** Letting S-tier actors train rookies to expand the roster's lifecycle.
3. **Co-production Contracts:** Partnering with rival studios to co-fund massive blockbuster projects.
4. **Director & Crew Hiring:** Staffing directors, writers, and producers to apply passive production bonuses.
5. **Dynamic/Procedural Roster Generation:** Fresh talent pools appearing over the years to keep recruitment exciting.
6. **Physical Studio Customization:** Buying permanent office expansions, recording booths, or editing suites.
7. **Merchandising & Spin-Offs:** Creating photobooks, soundtracks, or fan meetings specifically as spin-offs of successful shows.
8. **Interactive Script Writing:** Letting players pick sub-themes, plot-twists, or endings to shape the narrative.
9. **Public Relations Crisis Management:** Dynamic PR campaigns to spin scandals or backlashes into viral publicity.
10. **Global Syndication Contracts:** Bidding for international distribution rights to unlock massive global audiences.

---

### System Classifications

#### Systems that should never be changed:
*   **Fixed CP Contract & Custom Naming Pipeline.**
*   **Platform Financial Split (TV vs. Streaming).**
*   **The Four Critics sequential evaluation model.**

#### Systems needing only polish:
*   **Downtime Activities & Sub-Activities.**
*   **The Year-End Awards Ceremony (Needs more categories).**
*   **The Audition & Free Agent pool cycles.**

#### Systems needing a complete redesign:
*   **Fixed CP Breakup Mechanics (Needs a grace period).**
*   **The Genre Slot Machine Multiplier (Needs to be nerfed and decoupled from core quality scores).**
*   **The Weekly Modal Queue (Needs consolidation into a single weekly recap dashboard).**

---

### Executive Scorecard

*   **Overall Design Score:** `8.2 / 10`
*   **Replayability Score:** `5.5 / 10`
*   **Difficulty Curve Score:** `6.0 / 10`
*   **Progression Balance Score:** `7.5 / 10`
*   **Economic Balance Score:** `6.8 / 10`
*   **Player Agency Score:** `7.2 / 10`
*   **Overall Launch Readiness:** `85%` (Highly polished, but requires major systemic balance and UX consolidation to achieve critical acclaim upon release).
