// audio.js — every sound in the game, synthesized with WebAudio.
// One clear job: make noise. No sound files, no network, no assets.

let ctx = null;
let muted = false;
let sizzleGain = null;
let sizzleSrc = null;

// Lazily create the audio context on the first user gesture
// (browsers block audio before any interaction).
export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    // Sizzle: looped filtered noise, gain follows how many skewers grill.
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    sizzleSrc = ctx.createBufferSource();
    sizzleSrc.buffer = buf;
    sizzleSrc.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 4200;
    filt.Q.value = 0.6;
    sizzleGain = ctx.createGain();
    sizzleGain.gain.value = 0;
    sizzleSrc.connect(filt).connect(sizzleGain).connect(ctx.destination);
    sizzleSrc.start();
  } catch (e) {
    ctx = null;
  }
}

export function setMuted(m) {
  muted = m;
  if (ctx) ctx.destination.gain?.setValueAtTime(m ? 0 : 1, ctx.currentTime);
}
export function isMuted() { return muted; }

// How busy the grill sounds: 0 = silent, 1 = full sizzle.
export function setGrillBusy(frac) {
  if (!ctx || !sizzleGain) return;
  const target = muted ? 0 : Math.min(1, frac) * 0.05;
  sizzleGain.gain.setTargetAtTime(target, ctx.currentTime, 0.2);
}

function blip(freq, dur, type, vol, slideTo) {
  if (!ctx || muted) return;
  try {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch (e) { /* audio is best-effort */ }
}

function noiseBurst(dur, freq, vol) {
  if (!ctx || muted) return;
  try {
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq || 1200;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = vol || 0.15;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t);
  } catch (e) { /* audio is best-effort */ }
}

export const sfx = {
  pick() { blip(520, 0.07, 'triangle', 0.1, 700); },
  place() { blip(340, 0.08, 'triangle', 0.12, 240); },
  flip() { noiseBurst(0.16, 900, 0.16); },
  ding() { blip(880, 0.12, 'sine', 0.14); setTimeout(() => blip(1318, 0.22, 'sine', 0.12), 90); },
  coin() { blip(988, 0.09, 'square', 0.06, 1319); },
  error() { blip(180, 0.22, 'sawtooth', 0.08, 120); },
  trash() { noiseBurst(0.2, 300, 0.18); },
  ticket() { blip(660, 0.08, 'triangle', 0.1, 990); },
  expired() { blip(220, 0.3, 'sawtooth', 0.07, 140); },
  start() { blip(523, 0.1, 'triangle', 0.12); setTimeout(() => blip(659, 0.1, 'triangle', 0.12), 100); setTimeout(() => blip(784, 0.18, 'triangle', 0.12), 200); },
  end() { blip(784, 0.15, 'triangle', 0.12); setTimeout(() => blip(659, 0.15, 'triangle', 0.12), 150); setTimeout(() => blip(523, 0.3, 'triangle', 0.12), 300); },
};
