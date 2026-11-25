// layout.js — every clickable region on screen, computed once from W/H.
// One clear job: know where things are. input.js hits them, render.js draws them.

import { W, GRILL_SLOTS } from './config.js';

// Header strip.
export const HEADER = { x: 0, y: 0, w: W, h: 56 };
export const BTN_PAUSE = { x: W - 116, y: 10, w: 48, h: 36 };
export const BTN_MUTE = { x: W - 60, y: 10, w: 48, h: 36 };

// Order board: ticket cards in a row under the header.
export const BOARD = { x: 16, y: 64, w: W - 32, h: 104 };
export function ticketRect(i) {
  const tw = 296, gap = 12;
  return { x: BOARD.x + i * (tw + gap), y: BOARD.y, w: tw, h: BOARD.h };
}

// Kitchen floor.
export const KITCHEN = { x: 0, y: 176, w: W, h: 424 };

// Ingredient bins (left column): 3 meats, then 3 extras below.
export const BINS = { x: 16, y: 196, w: 236, h: 200 };
export function meatBinRect(i) {
  return { x: BINS.x + i * 80, y: BINS.y, w: 72, h: 92 };
}
export function extraBinRect(i) {
  return { x: BINS.x + i * 80, y: BINS.y + 104, w: 72, h: 76 };
}
export const BIN_LABEL = { x: BINS.x, y: BINS.y - 18, w: BINS.w, h: 16 };

// Charcoal grill (centre): 2 rows x 3 slots.
export const GRILL = { x: 288, y: 196, w: 560, h: 300 };
export function grillSlotRect(i) {
  const col = i % 3, row = Math.floor(i / 3);
  return {
    x: GRILL.x + 12 + col * 180,
    y: GRILL.y + 14 + row * 140,
    w: 164, h: 124,
  };
}

// Sauce pot (right of the grill).
export const SAUCE = { x: 872, y: 196, w: 150, h: 150 };
export const SAUCE_LABEL = { x: SAUCE.x, y: SAUCE.y + SAUCE.h + 6, w: SAUCE.w, h: 16 };

// Plating counter (far right): one plate spot.
export const PLATE = { x: 1040, y: 196, w: 224, h: 200 };
export const PLATE_LABEL = { x: PLATE.x, y: PLATE.y + PLATE.h + 6, w: PLATE.w, h: 16 };

// Trash bin (bottom-left of the kitchen).
export const TRASH = { x: 16, y: 420, w: 236, h: 76 };

// Bottom bar: held item, hints, messages.
export const FOOTER = { x: 0, y: 608, w: W, h: 112 };
export const HELD = { x: 16, y: 624, w: 220, h: 80 };
export const TOAST = { x: 260, y: 624, w: 780, h: 80 };

// Title / end screens: one big centred button.
export const BIG_BTN = { x: W / 2 - 140, y: 520, w: 280, h: 64 };

export function inside(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function grillSlotAt(x, y) {
  for (let i = 0; i < GRILL_SLOTS; i++) if (inside(grillSlotRect(i), x, y)) return i;
  return -1;
}
