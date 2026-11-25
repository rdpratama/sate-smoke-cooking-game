// state.js — the whole game state and its rules: orders, the grill,
// plates, coins, combo and the shift clock.
// One clear job: own the rules. Rendering and input live elsewhere.

import {
  SHIFT_SECONDS, MAX_TICKETS, GRILL_SLOTS, COOK_RATE, BURN_AT,
  PERFECT_FROM, FLIP_MIN, FLIP_MAX, PAY, WRONG_SERVE_PENALTY,
  EXPIRED_PENALTY, STARS, MEATS, EXTRAS, CUSTOMERS, DIFFICULTY,
  SPAWN_EARLY, SPAWN_LATE,
} from './config.js';

export function newGame() {
  return {
    screen: 'title', // title | play | paused | end
    time: 0, // seconds since the shift started
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    burnt: 0,
    expired: 0,
    bestCombo: 0,
    combo: 0,
    comboTimer: 0,
    tickets: [], // {id, name, wants:[{meat}], extras:[key], sauce, patience, maxPatience, reward}
    grill: Array.from({ length: GRILL_SLOTS }, () => null), // {meat, progress, flipped, burnt}
    held: null, // {kind:'skewer', meat, progress, flipped, sauced} — one thing in hand
    heldFrom: null, // 'bin' | 'grill' — where the held skewer came from
    plate: null, // the plate on the plating counter: {skewers:[], extras:[], sauced}
    nextTicketId: 1,
    spawnIn: 2.5, // first order arrives quickly
    message: '',
    messageAt: 0,
    messageKind: 'info',
    flashTicket: null, // ticket id to highlight after a serve
    stats: { raw: 0, uneven: 0, perfect: 0 },
    endAt: 0,
  };
}

export function difficultyAt(time) {
  const f = time / SHIFT_SECONDS;
  return f < 0.33 ? 0 : f < 0.66 ? 1 : 2;
}

function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

export function makeTicket(g, rnd) {
  const d = DIFFICULTY[difficultyAt(g.time)];
  const meatKeys = Object.keys(MEATS);
  const nSkewers = pick(d.skewers, rnd);
  const wants = [];
  for (let i = 0; i < nSkewers; i++) wants.push({ meat: pick(meatKeys, rnd) });
  const nExtras = pick(d.extras, rnd);
  const extraKeys = Object.keys(EXTRAS);
  const extras = [];
  for (let i = 0; i < nExtras; i++) {
    const k = pick(extraKeys, rnd);
    if (!extras.includes(k)) extras.push(k);
  }
  const sauce = rnd() < d.sauce;
  let reward = wants.reduce((s, w) => s + PAY[w.meat], 0)
    + extras.length * PAY.extra + (sauce ? PAY.sauce : 0);
  const name = pick(CUSTOMERS, rnd);
  return {
    id: g.nextTicketId++,
    name,
    wants,
    extras,
    sauce,
    patience: d.patience,
    maxPatience: d.patience,
    reward,
  };
}

// Advance the clock, spawn orders, cook the grill, drain patience.
export function tick(g, dt, rnd) {
  if (g.screen !== 'play') return;
  g.time += dt;
  g.timeLeft = Math.max(0, SHIFT_SECONDS - g.time);
  if (g.comboTimer > 0) {
    g.comboTimer -= dt;
    if (g.comboTimer <= 0) g.combo = 0;
  }
  // Spawn a new ticket when the board has room.
  g.spawnIn -= dt;
  if (g.spawnIn <= 0 && g.tickets.length < MAX_TICKETS) {
    g.tickets.push(makeTicket(g, rnd));
    g.spawnIn = SPAWN_EARLY + (SPAWN_LATE - SPAWN_EARLY) * (g.time / SHIFT_SECONDS);
    if (typeof window !== 'undefined' && window.__sfx) window.__sfx.ticket();
  }
  // Cook every skewer on the grill.
  for (const slot of g.grill) {
    if (!slot || slot.burnt) continue;
    slot.progress += COOK_RATE * dt;
    if (slot.progress >= BURN_AT) slot.burnt = true;
  }
  // Drain patience; a ticket at zero walks out.
  for (let i = g.tickets.length - 1; i >= 0; i--) {
    const t = g.tickets[i];
    t.patience -= dt;
    if (t.patience <= 0) {
      g.tickets.splice(i, 1);
      g.expired++;
      g.combo = 0;
      g.coins = Math.max(0, g.coins - EXPIRED_PENALTY);
      setMessage(g, `${t.name} walked out! -${EXPIRED_PENALTY} coins`, 'bad');
      if (typeof window !== 'undefined' && window.__sfx) window.__sfx.expired();
    }
  }
  if (g.timeLeft <= 0) endShift(g);
}

export function setMessage(g, text, kind) {
  g.message = text;
  g.messageAt = g.time;
  g.messageKind = kind || 'info';
}

// --- Player actions -------------------------------------------------------

export function pickMeat(g, meat) {
  if (g.screen !== 'play' || g.held) return false;
  g.held = { kind: 'skewer', meat, progress: 0, flipped: false, flipPerfect: false, sauced: false };
  g.heldFrom = 'bin';
  return true;
}

export function placeOnGrill(g, slot) {
  if (g.screen !== 'play') return false;
  const h = g.held;
  if (!h || h.kind !== 'skewer' || h.progress > 0) return false;
  if (g.grill[slot]) return false;
  g.grill[slot] = { meat: h.meat, progress: 0, flipped: false, flipPerfect: false, burnt: false };
  g.held = null;
  return true;
}

export function flipSkewer(g, slot) {
  if (g.screen !== 'play') return false;
  const s = g.grill[slot];
  if (!s || s.burnt || s.flipped) return false;
  // Flipping stays possible until it burns, so a skewer can never get
  // stuck unflipped; a flip while it is still in the window counts as
  // a perfect (even) flip, a later flip counts as uneven.
  if (s.progress < FLIP_MIN || s.progress >= BURN_AT) return false;
  s.flipped = true;
  s.flipPerfect = s.progress <= FLIP_MAX;
  return true;
}

export function takeSkewer(g, slot) {
  if (g.screen !== 'play' || g.held) return false;
  const s = g.grill[slot];
  if (!s) return false;
  // A skewer only comes off the grill flipped and golden — the flip is
  // part of the loop, not a shortcut the player can skip.
  if (!s.flipped || s.progress < PERFECT_FROM || s.burnt) return false;
  g.held = { kind: 'skewer', meat: s.meat, progress: s.progress, flipped: s.flipped, flipPerfect: s.flipPerfect, sauced: false };
  g.heldFrom = 'grill';
  g.grill[slot] = null;
  return true;
}

export function trashHeld(g) {
  if (!g.held) return false;
  if (g.held.kind === 'skewer' && g.held.progress >= BURN_AT) g.burnt++;
  g.held = null;
  return true;
}

// Dip a cooked skewer in the peanut sauce pot.
export function dipSauce(g) {
  if (g.screen !== 'play') return false;
  const h = g.held;
  if (!h || h.kind !== 'skewer') return false;
  if (h.progress < PERFECT_FROM || h.progress >= BURN_AT) return false;
  if (h.sauced) return false;
  h.sauced = true;
  return true;
}

// Put a held skewer onto the plate waiting on the plating counter.
export function addSkewerToPlate(g) {
  if (g.screen !== 'play') return false;
  const h = g.held;
  if (!h || h.kind !== 'skewer') return false;
  if (h.progress < PERFECT_FROM || h.progress >= BURN_AT) return false;
  // A plate is assembled on the plating counter: the held skewer joins
  // the plate that waits there. If no plate is waiting, start one.
  if (!g.plate) g.plate = { kind: 'plate', skewers: [], extras: [], sauced: false };
  if (g.plate.skewers.length >= 3) return false;
  g.plate.skewers.push({ meat: h.meat, sauced: h.sauced, flipped: h.flipped, flipPerfect: h.flipPerfect });
  if (h.sauced) g.plate.sauced = true;
  g.held = null;
  return true;
}

export function addExtraToPlate(g, extra) {
  if (g.screen !== 'play' || !g.plate) return false;
  if (g.plate.extras.includes(extra)) return false;
  if (g.plate.extras.length >= 2) return false;
  g.plate.extras.push(extra);
  return true;
}

// Does a plate satisfy a ticket exactly? Skewers by meat, extras, sauce.
export function plateMatches(plate, ticket) {
  if (!plate || plate.skewers.length !== ticket.wants.length) return false;
  const wantMeats = ticket.wants.map(w => w.meat).sort();
  const gotMeats = plate.skewers.map(s => s.meat).sort();
  for (let i = 0; i < wantMeats.length; i++) if (wantMeats[i] !== gotMeats[i]) return false;
  const wantEx = [...ticket.extras].sort();
  const gotEx = [...plate.extras].sort();
  if (wantEx.length !== gotEx.length) return false;
  for (let i = 0; i < wantEx.length; i++) if (wantEx[i] !== gotEx[i]) return false;
  if (ticket.sauce && !plate.sauced) return false;
  if (!ticket.sauce && plate.sauced) return false;
  return true;
}

export function serveTicket(g, ticketId) {
  if (g.screen !== 'play' || !g.plate) return false;
  const idx = g.tickets.findIndex(t => t.id === ticketId);
  if (idx < 0) return false;
  const t = g.tickets[idx];
  if (!plateMatches(g.plate, t)) {
    g.coins = Math.max(0, g.coins - WRONG_SERVE_PENALTY);
    setMessage(g, `Wrong order for ${t.name}! -${WRONG_SERVE_PENALTY} coins`, 'bad');
    return false;
  }
  // Pay: base reward + a rush bonus for patience left, times the combo.
  const rush = Math.round(t.reward * (t.patience / t.maxPatience) * 0.5);
  g.combo++;
  g.bestCombo = Math.max(g.bestCombo, g.combo);
  g.comboTimer = 12; // combo lives 12s; serve again to keep it
  const mult = 1 + Math.min(g.combo - 1, 5) * 0.1;
  const earned = Math.round((t.reward + rush) * mult);
  g.coins += earned;
  g.served++;
  g.flashTicket = t.id;
  // Quality tracking for the end screen.
  for (const s of g.plate.skewers) {
    if (s.flipPerfect) g.stats.perfect++;
    else g.stats.uneven++;
  }
  g.tickets.splice(idx, 1);
  g.plate = null;
  setMessage(g, `Served ${t.name}! +${earned} coins${g.combo > 1 ? ` (combo x${g.combo})` : ''}`, 'good');
  return true;
}

export function endShift(g) {
  g.screen = 'end';
  g.endAt = g.time;
  g.combo = 0;
  if (typeof window !== 'undefined' && window.__sfx) window.__sfx.end();
}

export function starsEarned(g) {
  let s = 0;
  for (const bar of STARS) if (g.coins >= bar) s++;
  return s;
}
