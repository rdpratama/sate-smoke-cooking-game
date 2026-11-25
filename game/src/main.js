// main.js — the entry point: boot the canvas, run the loop, wire input.
// One clear job: run the game. The rules live in state.js, the pixels
// in render.js, the clicks in input.js, the noise in audio.js.

import { W, H } from './config.js';
import { newGame, tick } from './state.js';
import { render } from './render.js';
import { handleClick, handleKey } from './input.js';
import { ensureAudio, setMuted, setGrillBusy, sfx } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

// The game must scale to the window while keeping its 1280x720 stage.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

let g = newGame();
let last = performance.now();
let muted = false;

// A shot query (?shot=cover&seed=1) poses a frozen demo state for photos.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const seed = parseInt(params.get('seed') || '1', 10);
  g = applyShot(newGame(), shot, seed);
  // A shot is a still: never advance the clock, never spawn, never cook.
  g.screen = shot === 'end' ? 'end' : 'play';
  g.__frozen = true;
}

// Expose the game state for debugging and automated play-tests.
window.__game = () => g;

// Expose the sound hooks state.js calls (kept off the game object).
window.__sfx = sfx;

function toGameCoords(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * W,
    y: ((e.clientY - r.top) / r.height) * H,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  ensureAudio();
  const p = toGameCoords(e);
  const out = handleClick(g, p.x, p.y, sfx);
  if (out === 'restart') { g = newGame(); g.screen = 'play'; sfx.start(); }
  if (out === 'mute') { muted = !muted; setMuted(muted); }
});

window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
  ensureAudio();
  const out = handleKey(g, e.key, sfx);
  if (out === 'restart') { g = newGame(); g.screen = 'play'; sfx.start(); }
  if (out === 'mute') { muted = !muted; setMuted(muted); }
});

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!g.__frozen && g.screen === 'play') {
    tick(g, dt, Math.random);
    // The grill sizzles louder the more skewers it holds.
    const busy = g.grill.filter(Boolean).length / g.grill.length;
    setGrillBusy(busy);
  }
  render(ctx, g, now / 1000, muted);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
