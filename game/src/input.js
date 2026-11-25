// input.js — mouse and keyboard, translated into game actions.
// One clear job: turn clicks and keys into state.js calls.

import {
  BTN_PAUSE, BTN_MUTE, BIG_BTN, SAUCE, PLATE, TRASH, HELD,
  meatBinRect, extraBinRect, grillSlotAt, ticketRect, inside,
} from './layout.js';
import { MAX_TICKETS, MEATS, EXTRAS, KEYS } from './config.js';
import {
  pickMeat, placeOnGrill, flipSkewer, takeSkewer, trashHeld,
  dipSauce, addSkewerToPlate, addExtraToPlate, serveTicket, setMessage,
} from './state.js';
import { sfx } from './audio.js';

const MEAT_KEYS = Object.keys(MEATS);
const EXTRA_KEYS = Object.keys(EXTRAS);

// What the click did, for the cursor tooltip. Returns a short label.
export function handleClick(g, x, y, sfxApi) {
  const s = sfxApi || sfx;
  if (g.screen === 'title') {
    if (inside(BIG_BTN, x, y)) { g.screen = 'play'; s.start(); }
    return;
  }
  if (g.screen === 'end') {
    if (inside(BIG_BTN, x, y)) return 'restart';
    return;
  }
  if (g.screen === 'paused') {
    if (inside(BIG_BTN, x, y)) { g.screen = 'play'; }
    return;
  }
  // In play: header buttons first.
  if (inside(BTN_PAUSE, x, y)) { g.screen = 'paused'; return; }
  if (inside(BTN_MUTE, x, y)) return 'mute';

  const h = g.held;

  // Meat bins: pick up a raw skewer (hands must be empty).
  for (let i = 0; i < MEAT_KEYS.length; i++) {
    if (inside(meatBinRect(i), x, y)) {
      if (!h && pickMeat(g, MEAT_KEYS[i])) s.pick();
      else if (h) setMessage(g, 'Hands full — place or trash what you hold first', 'bad');
      return;
    }
  }
  // Extra bins: add straight to the waiting plate.
  for (let i = 0; i < EXTRA_KEYS.length; i++) {
    if (inside(extraBinRect(i), x, y)) {
      if (addExtraToPlate(g, EXTRA_KEYS[i])) s.place();
      else setMessage(g, 'No plate waiting — add skewers to the plate first', 'bad');
      return;
    }
  }
  // Grill: empty slot + raw skewer in hand = place; skewer there = flip or take.
  const slot = grillSlotAt(x, y);
  if (slot >= 0) {
    const s0 = g.grill[slot];
    if (!s0) {
      if (h && h.kind === 'skewer' && h.progress === 0 && placeOnGrill(g, slot)) s.place();
      else if (!h) setMessage(g, 'Pick a skewer from the bins first', 'info');
      else setMessage(g, 'That skewer is already cooked — plate it instead', 'bad');
      return;
    }
    // A skewer is on the grill. A flipped skewer that is golden comes
    // off; anything else gets flipped first (flipping stays possible
    // until it burns, so a skewer can never get stuck unflipped).
    if (!h) {
      if (s0.flipped && s0.progress >= 70 && !s0.burnt) {
        if (takeSkewer(g, slot)) s.pick();
      } else if (flipSkewer(g, slot)) {
        s.flip();
      } else if (s0.burnt) {
        setMessage(g, 'Burnt! Take it off and trash it', 'bad');
      } else {
        setMessage(g, 'Too early to flip — wait for the sizzle', 'info');
      }
      return;
    }
    // Hands full: taking a cooked skewer needs empty hands.
    setMessage(g, 'Hands full — place or trash what you hold first', 'bad');
    return;
  }
  // Sauce pot: dip a cooked skewer held in hand.
  if (inside(SAUCE, x, y)) {
    if (h && h.kind === 'skewer' && dipSauce(g)) s.place();
    else if (h) setMessage(g, 'Only a cooked skewer can be dipped', 'bad');
    else setMessage(g, 'Hold a cooked skewer, then dip it here', 'info');
    return;
  }
  // Plating counter: a held cooked skewer joins the plate.
  if (inside(PLATE, x, y)) {
    if (h && h.kind === 'skewer') {
      if (addSkewerToPlate(g)) s.place();
      else setMessage(g, 'Too raw or burnt to plate — grill it right first', 'bad');
    } else if (g.plate) {
      setMessage(g, 'Plate waiting — click a ticket to serve it', 'info');
    } else {
      setMessage(g, 'Bring cooked skewers here to build a plate', 'info');
    }
    return;
  }
  // Trash: discard whatever is held.
  if (inside(TRASH, x, y)) {
    if (h && trashHeld(g)) s.trash();
    return;
  }
  // Tickets: serve the waiting plate to the clicked order.
  for (let i = 0; i < Math.min(g.tickets.length, MAX_TICKETS); i++) {
    if (inside(ticketRect(i), x, y)) {
      const t = g.tickets[i];
      if (!g.plate) { setMessage(g, 'Build a plate first, then serve it here', 'info'); return; }
      if (serveTicket(g, t.id)) { s.ding(); s.coin(); }
      else s.error();
      return;
    }
  }
}

export function handleKey(g, key, sfxApi) {
  const s = sfxApi || sfx;
  const k = key.length === 1 ? key.toLowerCase() : key;
  if (g.screen === 'title' && (k === KEYS.start || k === ' ')) { g.screen = 'play'; s.start(); return; }
  if (g.screen === 'end' && (k === KEYS.start || k === 'r')) return 'restart';
  if (k === KEYS.pause) {
    if (g.screen === 'play') g.screen = 'paused';
    else if (g.screen === 'paused') g.screen = 'play';
    return;
  }
  if (k === KEYS.mute) return 'mute';
  if (g.screen !== 'play') return;
  // 1/2/3 pick a meat; F flips the most-cooked skewer; Space serves the
  // waiting plate to the first ticket it matches.
  if (k === KEYS.pickChicken || k === KEYS.pickBeef || k === KEYS.pickLamb) {
    const idx = [KEYS.pickChicken, KEYS.pickBeef, KEYS.pickLamb].indexOf(k);
    if (!g.held && pickMeat(g, MEAT_KEYS[idx])) s.pick();
    return;
  }
  if (k === KEYS.flip) {
    let best = -1, bestP = -1;
    g.grill.forEach((s0, i) => {
      if (s0 && !s0.burnt && s0.progress > bestP) { best = i; bestP = s0.progress; }
    });
    if (best >= 0 && flipSkewer(g, best)) s.flip();
    return;
  }
  if (k === KEYS.serve) {
    if (!g.plate) return;
    for (const t of g.tickets) {
      if (serveTicket(g, t.id)) { s.ding(); s.coin(); return; }
    }
    s.error();
  }
}
