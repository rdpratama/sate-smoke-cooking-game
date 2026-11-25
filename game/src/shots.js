// shots.js — deterministic demo states for the screenshots.
// One clear job: pose the game for its photos. Each shot builds a real
// game state with the game's own rules, frozen at a telling moment:
// a busy kitchen, a dish mid-assembly, a plate ready to serve, the
// end-of-shift screen. Nothing here is drawn by hand — the game draws it.

import { newGame, makeTicket } from './state.js';

// Small seeded RNG so every screenshot is reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The cover: a busy kitchen at 1:45 left — full grill, a plate
// mid-assembly, three tickets, a combo running.
function shotCover(g, rnd) {
  g.time = 75; g.timeLeft = 105; g.coins = 86; g.combo = 3; g.comboTimer = 8;
  g.served = 5; g.bestCombo = 3;
  g.grill = [
    { meat: 'chicken', progress: 22, flipped: false, burnt: false },
    { meat: 'beef', progress: 48, flipped: false, burnt: false },
    { meat: 'lamb', progress: 78, flipped: true, burnt: false },
    { meat: 'chicken', progress: 92, flipped: true, burnt: false },
    { meat: 'beef', progress: 106, flipped: true, burnt: false },
    null,
  ];
  g.held = { kind: 'skewer', meat: 'lamb', progress: 88, flipped: true, sauced: false };
  g.heldFrom = 'grill';
  g.plate = { kind: 'plate', skewers: [{ meat: 'chicken', sauced: false, flipped: true }], extras: ['lontong'], sauced: false };
  g.tickets = [makeTicket(g, rnd), makeTicket(g, rnd), makeTicket(g, rnd)];
  g.tickets[0].patience = 18; g.tickets[1].patience = 34; g.tickets[2].patience = 48;
  g.message = 'Served Mbak Rini! +24 coins (combo x3)';
  g.messageAt = g.time; g.messageKind = 'good';
}

// Early game: two orders in, two skewers sizzling, one raw skewer in hand.
function shotPlay(g, rnd) {
  g.time = 12; g.timeLeft = 168; g.coins = 0; g.combo = 0; g.served = 0;
  g.grill = [
    { meat: 'chicken', progress: 35, flipped: false, burnt: false },
    { meat: 'beef', progress: 55, flipped: true, burnt: false },
    null, null, null, null,
  ];
  g.held = { kind: 'skewer', meat: 'chicken', progress: 0, flipped: false, sauced: false };
  g.heldFrom = 'bin';
  g.tickets = [makeTicket(g, rnd), makeTicket(g, rnd)];
  g.tickets[0].patience = 52; g.tickets[1].patience = 58;
  g.message = 'Click a bin, then the grill — flip when golden';
  g.messageAt = g.time; g.messageKind = 'info';
}

// The money shot: a finished plate, ready to serve, matching ticket one.
function shotServe(g, rnd) {
  g.time = 40; g.timeLeft = 140; g.coins = 64; g.combo = 2; g.comboTimer = 9;
  g.served = 4; g.bestCombo = 2;
  g.grill = [
    { meat: 'lamb', progress: 62, flipped: true, burnt: false },
    { meat: 'chicken', progress: 30, flipped: false, burnt: false },
    null, null, null, null,
  ];
  g.held = null;
  g.plate = {
    kind: 'plate',
    skewers: [
      { meat: 'chicken', sauced: true, flipped: true },
      { meat: 'chicken', sauced: true, flipped: true },
    ],
    extras: ['lontong'],
    sauced: true,
  };
  const t = makeTicket(g, rnd);
  t.name = 'Pak Darto';
  t.wants = [{ meat: 'chicken' }, { meat: 'chicken' }];
  t.extras = ['lontong'];
  t.sauce = true;
  t.reward = 8 + 8 + 3 + 4;
  t.patience = 38; t.maxPatience = 60;
  g.tickets = [t, makeTicket(g, rnd)];
  g.tickets[1].patience = 44;
  g.flashTicket = t.id;
  g.message = 'Plate ready — click Pak Darto’s ticket to serve!';
  g.messageAt = g.time; g.messageKind = 'good';
}

// The end of a great shift: three stars, the stall did well.
function shotEnd(g) {
  g.screen = 'end';
  g.time = 180; g.timeLeft = 0; g.coins = 352; g.served = 16;
  g.burnt = 1; g.expired = 0; g.bestCombo = 6;
  g.stats = { raw: 0, uneven: 2, perfect: 12 };
  g.endAt = 180;
}

const SHOTS = { cover: shotCover, play: shotPlay, serve: shotServe, end: shotEnd };

export function applyShot(g, name, seed) {
  const rnd = mulberry32(seed || 1);
  const fn = SHOTS[name] || SHOTS.cover;
  // Fresh tickets need the RNG warmed the same way every run.
  fn(g, rnd);
  return g;
}

export function shotNames() { return Object.keys(SHOTS); }
