// render.js — everything that gets drawn onto a panel canvas, in order:
// the scene itself, then the player's marks on top of it (found rings, the
// hint pulse, miss flashes, score popups), then the tools (crosshair, loupe).
// main.js owns the state; this module only reads it and draws.

import { VIEW_W, VIEW_H, variantKeys } from './scenes.js';
import { MARKER_POP_MS, MISS_FLASH_MS, HINT_PULSE_MS } from './config.js';

const CORAL = '#e4572e';
const AMBER = '#ffb84d';
const BRASS = '#c9973f';
const INK = '#2b2135';

const ORIGINAL = new Set(); // the left panel paints with no vary keys

// paintScene(ctx, scene, isCopy) — the bare picture, no player marks.
export function paintScene(ctx, scene, isCopy) {
  scene.paint(ctx, isCopy ? variantKeys(scene) : ORIGINAL);
}

function ring(ctx, x, y, r, color, width, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function foundMarker(ctx, x, y, r, ageMs) {
  // Pop: the ring springs from 60% to full size with a soft overshoot, then
  // settles as a steady coral ring with a white core and a tick.
  const t = Math.min(1, ageMs / MARKER_POP_MS);
  const scale = 0.6 + 0.4 * (1 - Math.pow(1 - t, 3)) + Math.sin(t * Math.PI) * 0.08;
  const rr = Math.max(13, r * 0.72) * scale;
  ring(ctx, x, y, rr + 5, CORAL, 2, 0.25 * t);
  ring(ctx, x, y, rr, CORAL, 3.5, 1);
  ctx.beginPath();
  ctx.arc(x, y, rr * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - rr * 0.26, y + rr * 0.02);
  ctx.lineTo(x - rr * 0.08, y + rr * 0.22);
  ctx.lineTo(x + rr * 0.3, y - rr * 0.2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = CORAL;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function hintPulse(ctx, x, y, r, ageMs) {
  // Two expanding amber rings over the pulse's life, fading as they grow.
  const phase = (ageMs % (HINT_PULSE_MS / 2)) / (HINT_PULSE_MS / 2);
  const overall = 1 - ageMs / HINT_PULSE_MS;
  for (const off of [0, 0.5]) {
    const p = (phase + off) % 1;
    ring(ctx, x, y, r * (0.55 + p * 1.15), AMBER, 3.5, (1 - p) * 0.95 * Math.max(0, overall + 0.35));
  }
  ring(ctx, x, y, r * 0.55, AMBER, 2, 0.8 * Math.max(0, overall + 0.3));
}

function missFlash(ctx, x, y, ageMs) {
  const a = 1 - ageMs / MISS_FLASH_MS;
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#b03030';
  ctx.lineCap = 'round';
  const s = 8;
  ctx.beginPath();
  ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
  ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
  ctx.stroke();
  ctx.restore();
}

function scorePopup(ctx, popup, now) {
  const age = now - popup.t0;
  if (age < 0 || age > 1100) return;
  const rise = (age / 1100) * 30;
  ctx.save();
  ctx.globalAlpha = 1 - age / 1100;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = popup.text.startsWith('+') ? '#1f7a4d' : '#b03030';
  ctx.strokeStyle = 'rgba(247,239,220,0.9)';
  ctx.lineWidth = 3;
  ctx.strokeText(popup.text, popup.x, popup.y - rise);
  ctx.fillText(popup.text, popup.x, popup.y - rise);
  ctx.restore();
}

function crosshair(ctx, x, y) {
  ring(ctx, x, y, 13, BRASS, 2, 0.95);
  ctx.save();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, y); ctx.lineTo(x - 7, y);
  ctx.moveTo(x + 7, y); ctx.lineTo(x + 20, y);
  ctx.moveTo(x, y - 20); ctx.lineTo(x, y - 7);
  ctx.moveTo(x, y + 7); ctx.lineTo(x, y + 20);
  ctx.stroke();
  ctx.restore();
}

function loupe(ctx, scene, isCopy, x, y) {
  // A 2x magnifier: repaint the scene clipped to a brass-rimmed circle,
  // scaled about the lens centre so the point under the mouse stays put.
  const R = 54;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(x, y);
  ctx.scale(2, 2);
  ctx.translate(-x, -y);
  paintScene(ctx, scene, isCopy);
  ctx.restore();
  ring(ctx, x, y, R, BRASS, 4, 1);
  ring(ctx, x, y, R - 4, INK, 1.5, 0.6);
}

// drawPanel(ctx, scene, isCopy, view, now)
// view = { found: Map(id -> t0), hint: {id, t0} | null, misses: [{x,y,t0}],
//          popups: [{x,y,text,t0}], crosshair: {x,y} | null,
//          loupe: {x,y} | null, shakeUntil, levelIndex }
export function drawPanel(ctx, scene, isCopy, view, now) {
  ctx.save();
  if (view.shakeUntil && now < view.shakeUntil) {
    const left = (view.shakeUntil - now) / 260;
    ctx.translate(Math.sin(now / 22) * 3.2 * left, Math.cos(now / 19) * 2 * left);
  }
  paintScene(ctx, scene, isCopy);

  for (const diff of scene.differences) {
    const t0 = view.found.get(diff.id);
    if (t0 !== undefined) foundMarker(ctx, diff.x, diff.y, diff.r, now - t0);
  }

  if (view.hint) {
    const diff = scene.differences.find((d) => d.id === view.hint.id);
    if (diff && now - view.hint.t0 < HINT_PULSE_MS) {
      hintPulse(ctx, diff.x, diff.y, diff.r, now - view.hint.t0);
    }
  }

  for (const miss of view.misses) {
    if (now - miss.t0 < MISS_FLASH_MS) missFlash(ctx, miss.x, miss.y, now - miss.t0);
  }
  for (const popup of view.popups) scorePopup(ctx, popup, now);

  if (view.crosshair) crosshair(ctx, view.crosshair.x, view.crosshair.y);
  if (view.loupe) loupe(ctx, scene, isCopy, view.loupe.x, view.loupe.y);
  ctx.restore();
}

export { VIEW_W, VIEW_H };
