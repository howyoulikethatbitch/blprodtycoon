# BL Production Tycoon

A turn-based Boys' Love production management tycoon game — mobile-first React + Vite webapp.

## Stack
- **React 18** + **Vite 5**
- **React Context** for global game state
- **CSS variables** for theming (dark purple / hot pink / gold)
- **Web Audio API** for SFX
- **localStorage** for auto-save

## Project Structure
```
src/
  components/     React UI components
  game/           Pure game logic modules
  styles/         Global theme CSS
public/
  images/         Actor portraits (actor_01.png – actor_20.png)
```

## Running
```bash
npm run dev       # Dev server on port 5000
npm run build     # Production build
npm run deploy    # Build + publish to GitHub Pages
```

## GitHub Pages Deployment
The Vite base path is set to `/bl-production-tycoon/` in `vite.config.js`.
Update this if your repo name differs or if deploying to a custom domain (use `'/'`).

## Mobile-First
- All layouts responsive; sidebar collapses to bottom nav on screens < 760px
- Touch targets minimum 44px
- No hover-dependent interactions

## User Preferences
- Preserve all game formulas exactly from source index.html
- Do not restructure or migrate existing systems without explicit request
- One click = one week (turn-based)
