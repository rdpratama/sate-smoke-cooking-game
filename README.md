[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun rank](https://make.fun/badge/best-cooking-game-20261125-0137/rdpratama/sate-smoke-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun reward](https://make.fun/badge/best-cooking-game-20261125-0137/rdpratama/sate-smoke-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# SATE SMOKE — Charcoal Satay Rush

A complete 2D canvas cooking game for the [make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). Run the night-market satay stall: pick skewers from the bins, grill them golden over charcoal, dip them in peanut sauce, build the plate and serve each ticket before the customer walks out.

## How to play

- **Pick** a skewer from the ingredient bins (click, or keys `1`/`2`/`3` for chicken/beef/lamb).
- **Grill** it: click an empty grill slot to place it. Click a skewer to **flip** it while it sizzles — golden (70–100) is perfect, past 115 it burns.
- **Dip** a cooked skewer in the peanut sauce pot when the order asks for sauce.
- **Plate** cooked skewers on the plating counter, add lontong / cucumber / shallot extras, then **click the ticket** to serve (or press `Space` to serve the first matching ticket).
- Serve fast to build a **combo**; burnt skewers go in the trash. One 3-minute shift, then your stars.

## Play it

Serve `game/` with any static HTTP server and open `game/index.html` in a desktop browser. No network requests, no libraries, no build step — all art is drawn in canvas and all sounds are synthesized with WebAudio.

## Layout

- `game/index.html` — the page, canvas only
- `game/src/config.js` — constants, menu, tuning
- `game/src/state.js` — orders, grill, plates, coins, combo
- `game/src/layout.js` — every clickable region on screen
- `game/src/input.js` — mouse and keyboard
- `game/src/render.js` — everything drawn on the canvas
- `game/src/audio.js` — synthesized sounds (sizzle, ding, flips)
- `game/src/shots.js` — deterministic demo states for the screenshots
- `game/src/main.js` — boot and game loop
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)
- `screenshots/` — 4 real renders of the game's own code
