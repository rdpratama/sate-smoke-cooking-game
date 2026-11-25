// SATE SMOKE — Charcoal Satay Rush
// config.js — every constant, menu item and tuning knob in one place.
// One clear job: describe the game. No logic lives here.

export const W = 1280;
export const H = 720;

export const SHIFT_SECONDS = 180; // one shift lasts 3 minutes
export const MAX_TICKETS = 4; // at most 4 orders on the board at once
export const GRILL_SLOTS = 6; // 2 rows of 3 over the charcoal

// How fast a skewer cooks: progress 0..100, perfect zone 70..100,
// overcooking 100..120, burnt past 120. A skewer must be flipped once
// before it can come off the grill; flipping stays possible until it
// burns. A flip while it is 30..90 is a perfect (even) flip.
export const COOK_RATE = 100 / 9; // ~9 seconds raw -> done
export const BURN_AT = 120;
export const PERFECT_FROM = 70;
export const FLIP_MIN = 30;
export const FLIP_MAX = 90;

// Patience (seconds) a ticket waits before the customer walks out.
export const PATIENCE_EASY = 60;
export const PATIENCE_HARD = 42;

// Spawn pacing: a new ticket every SPAWN_EARLY seconds at first,
// quickening to SPAWN_LATE as the shift wears on.
export const SPAWN_EARLY = 13;
export const SPAWN_LATE = 8;

// Coins: base pay per skewer, per extra, for sauce, and the rush bonus.
export const PAY = { chicken: 8, beef: 12, lamb: 15, extra: 3, sauce: 4 };
export const WRONG_SERVE_PENALTY = 5; // coins lost for serving the wrong plate
export const EXPIRED_PENALTY = 4; // coins lost when a customer walks out

// Star thresholds for the end-of-shift screen (coins).
export const STARS = [120, 220, 340];

// The meats: key, display name, colour, grill colour, pay.
export const MEATS = {
  chicken: { name: 'Ayam', label: 'Chicken', raw: '#f2b8a0', cooked: '#c97b2e', dark: '#8a4d16', pay: 8 },
  beef: { name: 'Sapi', label: 'Beef', raw: '#d97b7b', cooked: '#7e2f16', dark: '#4a1a0c', pay: 12 },
  lamb: { name: 'Kambing', label: 'Lamb', raw: '#e08a8a', cooked: '#9c3a20', dark: '#5d2010', pay: 15 },
};

// The extras a ticket can ask for (each adds 3 coins).
export const EXTRAS = {
  lontong: { name: 'Lontong', label: 'Rice cake', color: '#f5efdd', pay: 3 },
  cucumber: { name: 'Timun', label: 'Cucumber', color: '#7fc76a', pay: 3 },
  onion: { name: 'Bawang', label: 'Shallot', color: '#c9a0dc', pay: 3 },
};

// Customers who walk up to the stall. Names are original.
export const CUSTOMERS = [
  'Mbak Rini', 'Pak Darto', 'Bang Udin', 'Neng Sari', 'Mas Joko',
  'Bu Lastri', 'Kang Asep', 'Dek Putri', 'Om Bambang', 'Teh Dewi',
  'Pak Slamet', 'Mbak Yuni', 'Bang Fajar', 'Neng Ayu', 'Mas Rizky',
];

// How a ticket is built as the shift gets busier (index by difficulty 0..2).
export const DIFFICULTY = [
  { skewers: [1, 1, 2], extras: [0, 0, 1], sauce: 0.25, patience: PATIENCE_EASY },
  { skewers: [1, 2, 2], extras: [0, 1, 1], sauce: 0.45, patience: 52 },
  { skewers: [2, 2, 3], extras: [1, 1, 2], sauce: 0.6, patience: PATIENCE_HARD },
];

// Colours for the night-market look.
export const PALETTE = {
  bg: '#1c1210',
  bg2: '#2a1a14',
  counter: '#6b4226',
  counterTop: '#8a5a34',
  counterEdge: '#4a2c17',
  board: '#f7ead0',
  boardInk: '#3a2415',
  grill: '#241812',
  coal: '#ff5a1f',
  coalDeep: '#c22e08',
  header: '#120b08',
  cream: '#fff3d6',
  amber: '#ffb347',
  teal: '#2ec4b6',
  red: '#e63946',
  green: '#7bc96f',
  gold: '#ffd166',
};

// Keyboard shortcuts (also shown on the help strip).
export const KEYS = {
  pickChicken: '1',
  pickBeef: '2',
  pickLamb: '3',
  flip: 'f',
  serve: ' ',
  pause: 'p',
  mute: 'm',
  start: 'Enter',
};
