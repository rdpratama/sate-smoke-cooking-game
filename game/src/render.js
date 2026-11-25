// render.js — everything the player sees, drawn on one canvas.
// One clear job: draw. No rules, no input, just pixels.

import { W, H, MEATS, EXTRAS, PAY, SHIFT_SECONDS, STARS } from './config.js';
import {
  HEADER, BTN_PAUSE, BTN_MUTE, BOARD, KITCHEN, BINS, GRILL, SAUCE,
  PLATE, TRASH, FOOTER, HELD, TOAST, BIG_BTN,
  ticketRect, meatBinRect, extraBinRect, grillSlotRect, inside,
} from './layout.js';
import { PERFECT_FROM, BURN_AT } from './config.js';
import { starsEarned } from './state.js';

export function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function text(c, s, x, y, size, color, align, weight) {
  c.fillStyle = color || '#fff';
  c.font = `${weight || 700} ${size}px system-ui, sans-serif`;
  c.textAlign = align || 'left';
  c.textBaseline = 'middle';
  c.fillText(s, x, y);
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// --- Food drawing --------------------------------------------------------

// One skewer: a stick with three meat cubes. progress 0..115 drives colour.
export function drawSkewer(c, x, y, len, meat, progress, flipped, burnt, vertical) {
  const m = MEATS[meat];
  c.save();
  c.translate(x, y);
  if (vertical) c.rotate(Math.PI / 2);
  // Stick.
  c.fillStyle = '#d9b380';
  c.fillRect(-len / 2 - 8, -2.5, len + 16, 5);
  // Meat cubes along the stick.
  for (let i = -1; i <= 1; i++) {
    const cx = i * (len / 3.4);
    let col = m.raw;
    if (burnt) col = '#1a1210';
    else if (progress >= PERFECT_FROM) col = m.cooked;
    else if (progress > 25) col = mix(m.raw, m.cooked, progress / 100);
    c.fillStyle = col;
    rr(c, cx - 13, -13, 26, 26, 6);
    c.fill();
    // Grill marks once it has cooked a little.
    if (progress > 30 && !burnt) {
      c.strokeStyle = 'rgba(60,20,5,0.55)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx - 8, -8); c.lineTo(cx + 2, 8);
      c.moveTo(cx - 2, -9); c.lineTo(cx + 8, 8);
      c.stroke();
    }
    // Charred spots when burnt.
    if (burnt) {
      c.fillStyle = 'rgba(255,90,31,0.35)';
      c.beginPath(); c.arc(cx - 5, -4, 3, 0, 7); c.fill();
    }
  }
  // A flipped skewer shows a small gold star (even cooking bonus).
  if (flipped && !burnt) {
    c.fillStyle = '#ffd166';
    c.beginPath(); c.arc(len / 2 - 2, -16, 5, 0, 7); c.fill();
    text(c, '★', len / 2 - 2, -16, 9, '#7a4d00', 'center', 900);
  }
  c.restore();
}

function mix(a, b, f) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  const pc = pa.map((v, i) => Math.round(v + (pb[i] - v) * f));
  return `rgb(${pc[0]},${pc[1]},${pc[2]})`;
}

// A small extra icon (lontong / cucumber / onion).
export function drawExtra(c, x, y, key, size) {
  const e = EXTRAS[key];
  const s = size || 22;
  c.save();
  c.translate(x, y);
  if (key === 'lontong') {
    c.fillStyle = '#f5efdd';
    rr(c, -s / 2, -s / 2, s, s, 5);
    c.fill();
    c.strokeStyle = '#c9b98a';
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = '#8a7a4d';
    c.fillRect(-s / 4, -2, s / 2, 4);
  } else if (key === 'cucumber') {
    c.fillStyle = '#2f7d32';
    c.beginPath(); c.arc(0, 0, s / 2, 0, 7); c.fill();
    c.fillStyle = '#a8e063';
    c.beginPath(); c.arc(0, 0, s / 2 - 4, 0, 7); c.fill();
    c.fillStyle = '#e8f7d0';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      c.beginPath();
      c.ellipse(Math.cos(a) * s / 5, Math.sin(a) * s / 5, 2.5, 4, a, 0, 7);
      c.fill();
    }
  } else {
    c.strokeStyle = '#c9a0dc';
    c.lineWidth = 3;
    for (let r = s / 2; r > 4; r -= 5) {
      c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke();
    }
  }
  c.restore();
}

// Peanut sauce: a glossy brown blob with a swirl.
export function drawSauceBlob(c, x, y, r) {
  c.fillStyle = '#a15c1a';
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.fillStyle = '#c97b2e';
  c.beginPath(); c.arc(x - r * 0.25, y - r * 0.25, r * 0.55, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,220,150,0.7)';
  c.lineWidth = 2;
  c.beginPath(); c.arc(x, y, r * 0.45, 0.5, 2.6); c.stroke();
}

// --- Header + order board -------------------------------------------------

function drawHeader(c, g, muted) {
  c.fillStyle = '#120b08';
  c.fillRect(HEADER.x, HEADER.y, HEADER.w, HEADER.h);
  // String lights.
  for (let i = 0; i < 24; i++) {
    const x = 20 + i * 52;
    const y = 8 + Math.sin(i * 1.7) * 3;
    c.fillStyle = ['#ffd166', '#ff6b6b', '#2ec4b6', '#ffb347'][i % 4];
    c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill();
  }
  text(c, 'SATE SMOKE', 16, 36, 24, '#ffb347', 'left', 900);
  text(c, 'charcoal satay rush', 188, 38, 13, '#d9a05b', 'left', 600);
  // Shift timer, big in the middle; red under 30 seconds.
  const low = g.timeLeft <= 30;
  text(c, '⏱ ' + fmtTime(g.timeLeft), W / 2, 30, 30, low ? '#ff5a5a' : '#fff3d6', 'center', 900);
  text(c, 'SHIFT', W / 2, 50, 10, '#d9a05b', 'center', 700);
  // Coins and combo.
  text(c, '🪙 ' + g.coins, W - 260, 30, 22, '#ffd166', 'right', 800);
  if (g.combo > 1) text(c, `COMBO x${g.combo}`, W - 260, 50, 12, '#2ec4b6', 'right', 800);
  // Pause / mute buttons.
  for (const [r, label] of [[BTN_PAUSE, g.screen === 'paused' ? '▶' : '⏸'], [BTN_MUTE, muted ? '🔇' : '🔊']]) {
    c.fillStyle = '#3a2415';
    rr(c, r.x, r.y, r.w, r.h, 8); c.fill();
    text(c, label, r.x + r.w / 2, r.y + r.h / 2 + 1, 16, '#fff3d6', 'center');
  }
}

function drawTicket(c, g, t, i, now) {
  const r = ticketRect(i);
  const frac = Math.max(0, t.patience / t.maxPatience);
  const urgent = frac < 0.35;
  c.fillStyle = g.flashTicket === t.id && now - g.time < 1 ? '#fff3d6' : '#f7ead0';
  rr(c, r.x, r.y, r.w, r.h, 10);
  c.fill();
  c.strokeStyle = urgent ? '#e63946' : '#c9a86a';
  c.lineWidth = urgent ? 3 : 2;
  c.stroke();
  text(c, t.name, r.x + 12, r.y + 18, 15, '#3a2415', 'left', 800);
  text(c, `🪙 ${t.reward}`, r.x + r.w - 12, r.y + 18, 14, '#8a5a34', 'right', 800);
  // Wanted skewers as mini icons.
  let x = r.x + 14;
  for (const w of t.wants) {
    drawSkewer(c, x + 26, r.y + 52, 44, w.meat, 85, true, false, false);
    x += 56;
  }
  // Extras + sauce.
  let ex = r.x + 14;
  for (const k of t.extras) { drawExtra(c, ex + 10, r.y + 82, k, 18); ex += 26; }
  if (t.sauce) drawSauceBlob(c, ex + 12, r.y + 82, 9);
  // Patience bar.
  c.fillStyle = '#e0cba8';
  rr(c, r.x + 12, r.y + r.h - 14, r.w - 24, 8, 4); c.fill();
  c.fillStyle = frac > 0.5 ? '#7bc96f' : frac > 0.25 ? '#ffb347' : '#e63946';
  rr(c, r.x + 12, r.y + r.h - 14, (r.w - 24) * frac, 8, 4); c.fill();
}

function drawBoard(c, g, now) {
  text(c, 'ORDER BOARD', BOARD.x, BOARD.y - 10, 12, '#d9a05b', 'left', 800);
  if (g.tickets.length === 0) {
    c.fillStyle = 'rgba(247,234,208,0.14)';
    rr(c, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 10); c.fill();
    text(c, 'No orders yet — the night is young…', BOARD.x + 20, BOARD.y + BOARD.h / 2, 16, '#d9a05b', 'left', 600);
    return;
  }
  g.tickets.forEach((t, i) => drawTicket(c, g, t, i, now));
}

// --- Kitchen --------------------------------------------------------------

function drawBins(c, g) {
  text(c, 'INGREDIENTS — click to pick a skewer', BINS.x, BINS.y - 18, 12, '#d9a05b', 'left', 800);
  const keys = Object.keys(MEATS);
  keys.forEach((k, i) => {
    const r = meatBinRect(i);
    c.fillStyle = '#8a5a34';
    rr(c, r.x, r.y, r.w, r.h, 8); c.fill();
    c.fillStyle = '#6b4226';
    rr(c, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 6); c.fill();
    drawSkewer(c, r.x + r.w / 2, r.y + 34, 52, k, 0, false, false, false);
    text(c, MEATS[k].name, r.x + r.w / 2, r.y + 68, 12, '#fff3d6', 'center', 700);
    text(c, `${i + 1}`, r.x + r.w - 10, r.y + 12, 11, '#ffb347', 'center', 800);
  });
  const exKeys = Object.keys(EXTRAS);
  exKeys.forEach((k, i) => {
    const r = extraBinRect(i);
    c.fillStyle = '#8a5a34';
    rr(c, r.x, r.y, r.w, r.h, 8); c.fill();
    c.fillStyle = '#6b4226';
    rr(c, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 6); c.fill();
    drawExtra(c, r.x + r.w / 2, r.y + 28, k, 26);
    text(c, EXTRAS[k].name, r.x + r.w / 2, r.y + 60, 11, '#fff3d6', 'center', 700);
  });
}

function drawGrill(c, g, now) {
  const gr = GRILL;
  // Charcoal bed with a pulsing glow.
  const pulse = 0.75 + Math.sin(now * 3) * 0.15;
  const grad = c.createRadialGradient(gr.x + gr.w / 2, gr.y + gr.h / 2, 40, gr.x + gr.w / 2, gr.y + gr.h / 2, 320);
  grad.addColorStop(0, `rgba(255,90,31,${0.35 * pulse})`);
  grad.addColorStop(1, 'rgba(255,90,31,0)');
  c.fillStyle = grad;
  c.fillRect(gr.x - 40, gr.y - 40, gr.w + 80, gr.h + 80);
  c.fillStyle = '#241812';
  rr(c, gr.x, gr.y, gr.w, gr.h, 12); c.fill();
  c.strokeStyle = '#4a2c17';
  c.lineWidth = 3;
  c.stroke();
  // Charcoal lumps.
  for (let i = 0; i < 14; i++) {
    const cx = gr.x + 30 + (i % 7) * 78 + ((i * 37) % 13);
    const cy = gr.y + gr.h - 26 - Math.floor(i / 7) * 18 + ((i * 53) % 7);
    c.fillStyle = i % 3 === 0 ? '#ff5a1f' : '#c22e08';
    c.globalAlpha = 0.55 + Math.sin(now * 4 + i) * 0.25;
    c.beginPath(); c.arc(cx, cy, 9, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  text(c, 'CHARCOAL GRILL — click a skewer to flip, click again when golden to take it', gr.x + 6, gr.y - 8, 12, '#d9a05b', 'left', 800);
  // Slots.
  g.grill.forEach((s, i) => {
    const r = grillSlotRect(i);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    rr(c, r.x, r.y, r.w, r.h, 8); c.fill();
    c.strokeStyle = '#6b4226';
    c.lineWidth = 2;
    c.stroke();
    if (!s) {
      text(c, '+', r.x + r.w / 2, r.y + r.h / 2, 28, 'rgba(255,243,214,0.25)', 'center', 300);
      return;
    }
    drawSkewer(c, r.x + r.w / 2, r.y + 46, 120, s.meat, s.progress, s.flipped, s.burnt, false);
    // Doneness gauge: a ring around the slot.
    const frac = Math.min(1, s.progress / 100);
    c.strokeStyle = 'rgba(255,243,214,0.2)';
    c.lineWidth = 6;
    c.beginPath(); c.arc(r.x + r.w / 2, r.y + 46, 46, -Math.PI / 2, Math.PI * 1.5); c.stroke();
    c.strokeStyle = s.burnt ? '#1a1210' : !s.flipped && s.progress >= PERFECT_FROM ? '#ff8c42' : s.progress >= 100 ? '#ff8c42' : s.progress >= PERFECT_FROM ? '#7bc96f' : s.progress >= 40 ? '#ffb347' : '#e8d9b0';
    c.beginPath(); c.arc(r.x + r.w / 2, r.y + 46, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); c.stroke();
    const label = s.burnt ? 'BURNT!' : s.flipped && s.progress >= 100 ? 'HURRY!' : s.flipped && s.progress >= PERFECT_FROM ? 'READY' : !s.flipped && s.progress >= PERFECT_FROM ? 'FLIP IT!' : s.progress >= 40 ? 'COOKING…' : 'RAW';
    text(c, label, r.x + r.w / 2, r.y + r.h - 16, 13, s.burnt ? '#ff5a5a' : !s.flipped && s.progress >= PERFECT_FROM ? '#ff8c42' : s.progress >= 100 ? '#ff8c42' : '#fff3d6', 'center', 800);
    if (s.progress >= PERFECT_FROM && s.progress < BURN_AT && !s.burnt) {
      text(c, 'click to take', r.x + r.w / 2, r.y + r.h - 2, 10, '#7bc96f', 'center', 600);
    }
  });
  // Smoke wisps rising off the grill, staying inside the grill panel.
  for (let i = 0; i < 8; i++) {
    const t = ((now * 0.35 + i * 0.13) % 1);
    const sx = gr.x + 60 + ((i * 97) % (gr.w - 120));
    const sy = gr.y + 40 - t * 55;
    c.fillStyle = `rgba(220,220,220,${0.12 * (1 - t)})`;
    c.beginPath(); c.arc(sx + Math.sin(now * 2 + i) * 8, sy, 8 + t * 10, 0, 7); c.fill();
  }
}

function drawSauceAndPlate(c, g) {
  // Sauce pot.
  text(c, 'PEANUT SAUCE', SAUCE.x + SAUCE.w / 2, SAUCE.y - 8, 12, '#d9a05b', 'center', 800);
  c.fillStyle = '#3a3a3a';
  rr(c, SAUCE.x, SAUCE.y + 40, SAUCE.w, SAUCE.h - 40, 12); c.fill();
  c.fillStyle = '#555';
  rr(c, SAUCE.x + 6, SAUCE.y + 34, SAUCE.w - 12, 20, 8); c.fill();
  drawSauceBlob(c, SAUCE.x + SAUCE.w / 2, SAUCE.y + 88, 46);
  text(c, 'click to dip', SAUCE.x + SAUCE.w / 2, SAUCE.y + SAUCE.h + 22, 11, '#d9a05b', 'center', 600);
  // Plating counter.
  text(c, 'PLATING — build the plate here', PLATE.x, PLATE.y - 8, 12, '#d9a05b', 'left', 800);
  c.fillStyle = '#8a5a34';
  rr(c, PLATE.x, PLATE.y, PLATE.w, PLATE.h, 12); c.fill();
  c.fillStyle = '#6b4226';
  rr(c, PLATE.x + 6, PLATE.y + 6, PLATE.w - 12, PLATE.h - 12, 8); c.fill();
  if (!g.plate) {
    text(c, 'empty plate', PLATE.x + PLATE.w / 2, PLATE.y + 70, 14, 'rgba(255,243,214,0.5)', 'center', 600);
    text(c, 'bring cooked skewers', PLATE.x + PLATE.w / 2, PLATE.y + 92, 12, 'rgba(255,243,214,0.4)', 'center', 600);
  } else {
    // The plate itself.
    c.fillStyle = '#f7ead0';
    c.beginPath(); c.ellipse(PLATE.x + PLATE.w / 2, PLATE.y + 92, 92, 62, 0, 0, 7); c.fill();
    c.strokeStyle = '#c9a86a';
    c.lineWidth = 3;
    c.stroke();
    g.plate.skewers.forEach((s, i) => {
      drawSkewer(c, PLATE.x + PLATE.w / 2, PLATE.y + 62 + i * 34, 130, s.meat, 85, s.flipped, false, false);
    });
    g.plate.extras.forEach((k, i) => {
      drawExtra(c, PLATE.x + 34 + i * 30, PLATE.y + 152, k, 22);
    });
    if (g.plate.sauced) drawSauceBlob(c, PLATE.x + PLATE.w - 40, PLATE.y + 152, 12);
    text(c, `${g.plate.skewers.length} skewer${g.plate.skewers.length === 1 ? '' : 's'} on the plate`, PLATE.x + PLATE.w / 2, PLATE.y + PLATE.h - 16, 12, '#fff3d6', 'center', 700);
  }
  // Trash bin.
  c.fillStyle = '#3a3a3a';
  rr(c, TRASH.x, TRASH.y, TRASH.w, TRASH.h, 10); c.fill();
  c.fillStyle = '#555';
  rr(c, TRASH.x + 8, TRASH.y + 6, TRASH.w - 16, 14, 6); c.fill();
  text(c, '🗑  TRASH — click to discard what you hold', TRASH.x + TRASH.w / 2, TRASH.y + 48, 13, '#fff3d6', 'center', 700);
}

function drawFooter(c, g) {
  c.fillStyle = '#120b08';
  c.fillRect(FOOTER.x, FOOTER.y, FOOTER.w, FOOTER.h);
  // Held item.
  c.fillStyle = '#2a1a14';
  rr(c, HELD.x, HELD.y, HELD.w, HELD.h, 10); c.fill();
  text(c, 'IN HAND', HELD.x + 12, HELD.y + 14, 11, '#d9a05b', 'left', 800);
  const h = g.held;
  if (!h) {
    text(c, 'empty hands', HELD.x + 12, HELD.y + 44, 14, 'rgba(255,243,214,0.55)', 'left', 600);
  } else {
    drawSkewer(c, HELD.x + 62, HELD.y + 50, 76, h.meat, h.progress, h.flipped, h.progress >= BURN_AT, false);
    const label = h.progress >= BURN_AT ? 'burnt' : h.progress >= PERFECT_FROM ? 'cooked ✓' : h.progress > 0 ? 'raw' : 'raw skewer';
    text(c, `${MEATS[h.meat].name}${h.sauced ? ' + sauce' : ''} — ${label}`, HELD.x + 112, HELD.y + 44, 13, '#fff3d6', 'left', 700);
  }
  // Toast message.
  if (g.message && g.time - g.messageAt < 4) {
    const col = g.messageKind === 'bad' ? '#ff8a8a' : g.messageKind === 'good' ? '#7bc96f' : '#fff3d6';
    text(c, g.message, TOAST.x, TOAST.y + 24, 17, col, 'left', 700);
  }
  text(c, '1/2/3 pick skewer · F flip · Space serve matching ticket · P pause · M mute', TOAST.x, TOAST.y + 56, 13, '#d9a05b', 'left', 600);
  // Shift progress bar.
  const frac = g.time / SHIFT_SECONDS;
  c.fillStyle = '#3a2415';
  rr(c, W - 240, FOOTER.y + 20, 220, 10, 5); c.fill();
  c.fillStyle = '#ffb347';
  rr(c, W - 240, FOOTER.y + 20, 220 * frac, 10, 5); c.fill();
  text(c, `served ${g.served} · burnt ${g.burnt}`, W - 240, FOOTER.y + 48, 13, '#fff3d6', 'left', 700);
}

// --- Screens ----------------------------------------------------------------

function drawTitle(c, g, now) {
  c.fillStyle = '#1c1210';
  c.fillRect(0, 0, W, H);
  // Warm glow behind the logo.
  const grad = c.createRadialGradient(W / 2, 240, 20, W / 2, 240, 420);
  grad.addColorStop(0, 'rgba(255,90,31,0.4)');
  grad.addColorStop(1, 'rgba(255,90,31,0)');
  c.fillStyle = grad;
  c.fillRect(0, 0, W, H);
  // String lights.
  for (let i = 0; i < 26; i++) {
    const x = 20 + i * 49;
    const y = 24 + Math.sin(i * 1.7 + now) * 4;
    c.fillStyle = ['#ffd166', '#ff6b6b', '#2ec4b6', '#ffb347'][i % 4];
    c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill();
  }
  // Decorative skewers.
  drawSkewer(c, W / 2 - 260, 300, 150, 'chicken', 85, true, false, false);
  drawSkewer(c, W / 2 + 260, 300, 150, 'beef', 85, true, false, false);
  drawSauceBlob(c, W / 2 - 330, 380, 26);
  drawExtra(c, W / 2 + 330, 380, 'lontong', 34);
  text(c, 'SATE SMOKE', W / 2, 190, 84, '#ffb347', 'center', 900);
  text(c, 'CHARCOAL SATAY RUSH', W / 2, 250, 26, '#fff3d6', 'center', 800);
  text(c, 'Run the night-market satay stall. Grill it golden, sauce it, plate it, serve it hot.', W / 2, 300, 17, '#d9a05b', 'center', 600);
  text(c, '1 · Click a bin to pick a skewer, click the grill to cook it', W / 2, 360, 16, '#fff3d6', 'center', 600);
  text(c, '2 · Click to flip while it sizzles — golden, not burnt', W / 2, 388, 16, '#fff3d6', 'center', 600);
  text(c, '3 · Dip in peanut sauce, build the plate, click the ticket to serve', W / 2, 416, 16, '#fff3d6', 'center', 600);
  text(c, `One ${SHIFT_SECONDS / 60}-minute shift · serve fast for combo bonuses · burnt skewers go in the trash`, W / 2, 452, 14, '#d9a05b', 'center', 600);
  c.fillStyle = '#ffb347';
  rr(c, BIG_BTN.x, BIG_BTN.y, BIG_BTN.w, BIG_BTN.h, 12); c.fill();
  text(c, 'START SHIFT  ▶', BIG_BTN.x + BIG_BTN.w / 2, BIG_BTN.y + BIG_BTN.h / 2 + 1, 22, '#3a2415', 'center', 900);
  text(c, 'or press Enter — mouse and keyboard both work', W / 2, BIG_BTN.y + 92, 13, '#d9a05b', 'center', 600);
}

function drawPaused(c) {
  c.fillStyle = 'rgba(10,5,3,0.72)';
  c.fillRect(0, 0, W, H);
  text(c, 'PAUSED', W / 2, 300, 56, '#fff3d6', 'center', 900);
  text(c, 'Take a breath. The charcoal waits.', W / 2, 350, 17, '#d9a05b', 'center', 600);
  c.fillStyle = '#ffb347';
  rr(c, BIG_BTN.x, BIG_BTN.y, BIG_BTN.w, BIG_BTN.h, 12); c.fill();
  text(c, 'RESUME  ▶', BIG_BTN.x + BIG_BTN.w / 2, BIG_BTN.y + BIG_BTN.h / 2 + 1, 22, '#3a2415', 'center', 900);
}

function drawEnd(c, g) {
  c.fillStyle = '#1c1210';
  c.fillRect(0, 0, W, H);
  text(c, 'SHIFT OVER', W / 2, 130, 56, '#ffb347', 'center', 900);
  const stars = starsEarned(g);
  let starLine = '';
  for (let i = 0; i < 3; i++) starLine += i < stars ? '★' : '☆';
  text(c, starLine, W / 2, 200, 64, '#ffd166', 'center', 900);
  text(c, `${g.coins} coins earned`, W / 2, 280, 30, '#fff3d6', 'center', 800);
  text(c, `Served ${g.served} plates · ${g.burnt} skewer${g.burnt === 1 ? '' : 's'} burnt · ${g.expired} customer${g.expired === 1 ? '' : 's'} walked out · best combo x${g.bestCombo}`, W / 2, 330, 17, '#d9a05b', 'center', 600);
  text(c, `Perfectly flipped skewers: ${g.stats.perfect} · uneven: ${g.stats.uneven}`, W / 2, 360, 15, '#d9a05b', 'center', 600);
  const verdict = stars === 3 ? 'A legendary night at the stall!' : stars === 2 ? 'The crowd keeps coming back.' : stars === 1 ? 'A solid shift — the grill can do better.' : 'The charcoal beat you tonight. Run it back!';
  text(c, verdict, W / 2, 410, 18, '#fff3d6', 'center', 700);
  c.fillStyle = '#ffb347';
  rr(c, BIG_BTN.x, BIG_BTN.y, BIG_BTN.w, BIG_BTN.h, 12); c.fill();
  text(c, 'PLAY AGAIN  ↻', BIG_BTN.x + BIG_BTN.w / 2, BIG_BTN.y + BIG_BTN.h / 2 + 1, 22, '#3a2415', 'center', 900);
}

// --- Main dispatch ----------------------------------------------------------

export function render(c, g, now, muted) {
  c.clearRect(0, 0, W, H);
  if (g.screen === 'title') { drawTitle(c, g, now); return; }
  if (g.screen === 'end') { drawEnd(c, g); return; }
  // Kitchen backdrop.
  c.fillStyle = '#2a1a14';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#6b4226';
  c.fillRect(KITCHEN.x, KITCHEN.y, KITCHEN.w, KITCHEN.h);
  c.fillStyle = '#8a5a34';
  c.fillRect(KITCHEN.x, KITCHEN.y, KITCHEN.w, 10);
  drawHeader(c, g, muted);
  drawBoard(c, g, now);
  drawBins(c, g);
  drawGrill(c, g, now);
  drawSauceAndPlate(c, g);
  drawFooter(c, g);
  if (g.screen === 'paused') drawPaused(c);
}
