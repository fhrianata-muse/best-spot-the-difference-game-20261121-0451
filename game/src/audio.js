// audio.js — every sound in the game is synthesised with WebAudio: no audio
// files, nothing to load. The context is created lazily on the first user
// gesture (browsers refuse to start one earlier) and every call is safe to
// make before that — it simply stays silent until the context exists.

let ctx = null;
let muted = false;

function ensureContext() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

// tone(freq, at, dur, type, gain) — one oscillator note starting `at` seconds
// from now, with a quick attack and a smooth decay.
function tone(freq, at, dur, type = 'sine', gain = 0.16) {
  const ac = ensureContext();
  if (!ac || muted) return;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// pop() — the find sound: a bright two-step blip.
export function pop() {
  tone(660, 0, 0.12, 'triangle', 0.2);
  tone(990, 0.055, 0.16, 'triangle', 0.18);
}

// thud() — the miss sound: a low, dull knock.
export function thud() {
  tone(140, 0, 0.16, 'sine', 0.24);
  tone(92, 0.02, 0.2, 'sine', 0.18);
}

// chime() — the scene-clear arpeggio.
export function chime() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(f, i * 0.09, 0.34, 'triangle', 0.16));
}

// tick() — one quiet clock tick, for the last ten seconds.
export function tick() {
  tone(1250, 0, 0.05, 'square', 0.05);
}

// unlock() — call from any click handler so the first gesture starts audio.
export function unlock() {
  ensureContext();
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}
