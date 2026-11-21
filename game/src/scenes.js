// scenes.js — the three pictures and their planted differences.
//
// Each scene paints itself twice from the same code: once plain (the original,
// left panel) and once with a set of "vary" keys switched on (the copy, right
// panel). A difference is data — { id, x, y, r, label, vary } — and the painter
// branches on that vary key at exactly that spot, so the data and the drawing
// can never drift apart.
//
// Determinism rule: painters draw their seeded decoration (stars, sparkles,
// grain) from fresh generators in a fixed order, and a vary branch never
// consumes from a generator — so both panels come out identical except for
// the planted differences.

import { mulberry32, hashSeed } from './random.js';

export const VIEW_W = 560;
export const VIEW_H = 400;

// ---------------------------------------------------------------- helpers

function fill(ctx, color) {
  ctx.fillStyle = color;
}

function circle(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  fill(ctx, color);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  fill(ctx, color);
  ctx.fill();
}

function rect(ctx, x, y, w, h, color) {
  fill(ctx, color);
  ctx.fillRect(x, y, w, h);
}

function poly(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  fill(ctx, color);
  ctx.fill();
}

function stroke(ctx, x1, y1, x2, y2, width, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function glow(ctx, x, y, r, inner, outer) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  fill(ctx, g);
  ctx.fill();
}

function skyGradient(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  for (const [at, color] of stops) g.addColorStop(at, color);
  fill(ctx, g);
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function starField(ctx, seedKey, count, maxY, color) {
  const rng = mulberry32(hashSeed(seedKey));
  for (let i = 0; i < count; i++) {
    const x = rng() * VIEW_W;
    const y = rng() * maxY;
    const r = 0.6 + rng() * 1.3;
    ctx.globalAlpha = 0.35 + rng() * 0.6;
    circle(ctx, x, y, r, color);
  }
  ctx.globalAlpha = 1;
}

function sparkStar(ctx, x, y, r, color) {
  poly(ctx, [[x, y - r], [x + r * 0.28, y - r * 0.28], [x + r, y], [x + r * 0.28, y + r * 0.28],
    [x, y + r], [x - r * 0.28, y + r * 0.28], [x - r, y], [x - r * 0.28, y - r * 0.28]], color);
}

function cloud(ctx, x, y, s, color) {
  ellipse(ctx, x, y, 34 * s, 13 * s, color);
  ellipse(ctx, x - 22 * s, y + 3 * s, 22 * s, 10 * s, color);
  ellipse(ctx, x + 24 * s, y + 3 * s, 24 * s, 11 * s, color);
  ellipse(ctx, x + 2 * s, y - 8 * s, 20 * s, 11 * s, color);
}

function bird(ctx, x, y, s, color) {
  ctx.beginPath();
  ctx.arc(x - 6 * s, y, 6 * s, Math.PI * 1.15, Math.PI * 1.85);
  ctx.arc(x + 6 * s, y, 6 * s, Math.PI * 1.15, Math.PI * 1.85);
  ctx.lineWidth = 2 * s;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// A hanging paper lantern: ribbed oval body, caps, cord. `lit` adds the halo.
function paperLantern(ctx, x, y, body, lit) {
  if (lit) glow(ctx, x, y, 30, 'rgba(255,217,138,0.55)', 'rgba(255,184,77,0)');
  rect(ctx, x - 2, y - 20, 4, 8, '#2b2135');
  ellipse(ctx, x, y, 13, 16, body);
  ctx.beginPath();
  ctx.ellipse(x, y, 6.5, 16, 0, 0, Math.PI * 2);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(43,33,53,0.35)';
  ctx.stroke();
  rect(ctx, x - 6, y - 19, 12, 4, '#c9973f');
  rect(ctx, x - 6, y + 15, 12, 4, '#c9973f');
  if (lit) circle(ctx, x, y, 5, '#ffe9b0');
}

// A sitting cat silhouette, facing left or right.
function cat(ctx, x, y, flip, color) {
  const d = flip ? -1 : 1;
  ellipse(ctx, x, y, 11, 13, color); // body
  circle(ctx, x + 2 * d, y - 14, 8, color); // head
  poly(ctx, [[x - 4 * d, y - 20], [x - 1 * d, y - 27], [x + 3 * d, y - 21]], color); // ear
  poly(ctx, [[x + 5 * d, y - 21], [x + 9 * d, y - 27], [x + 11 * d, y - 19]], color); // ear
  ctx.beginPath(); // tail curling round the feet
  ctx.arc(x - 10 * d, y + 8, 8, Math.PI * 0.2, Math.PI * 1.5, d < 0);
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();
  circle(ctx, x + 4 * d, y - 14, 1.4, '#ffd98a'); // eye
}

// A brass gear with teeth and a hub.
function gear(ctx, x, y, r, teeth, color, dark) {
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const tx = x + Math.cos(a) * r;
    const ty = y + Math.sin(a) * r;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(a);
    rect(ctx, -3, -r * 0.22, r * 0.34, r * 0.44, color);
    ctx.restore();
  }
  circle(ctx, x, y, r, color);
  circle(ctx, x, y, r * 0.55, dark);
  circle(ctx, x, y, r * 0.3, color);
  circle(ctx, x, y, r * 0.12, dark);
}

// Printed-paper finish: deterministic grain flecks + a soft vignette. Called
// last by every painter, with the same seed for both panels.
function finish(ctx, seedKey) {
  const rng = mulberry32(hashSeed(seedKey));
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 420; i++) {
    const x = rng() * VIEW_W;
    const y = rng() * VIEW_H;
    rect(ctx, x, y, 1.4, 1.4, rng() > 0.5 ? '#000000' : '#ffffff');
  }
  ctx.globalAlpha = 1;
  const g = ctx.createRadialGradient(280, 200, 210, 280, 200, 430);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(20,12,8,0.28)');
  fill(ctx, g);
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

// ---------------------------------------------------------------- harbour

function paintHarbour(ctx, v) {
  skyGradient(ctx, [[0, '#7fb2c9'], [0.42, '#f29e7e'], [0.62, '#f7c98b'], [0.63, '#79b5ad'], [1, '#3e7d8c']]);

  // Sun, low over the water.
  glow(ctx, 452, 92, 62, 'rgba(255,217,138,0.8)', 'rgba(255,184,77,0)');
  circle(ctx, 452, 92, 25, '#ffd98a');
  circle(ctx, 452, 92, 19, '#ffe9b0');

  cloud(ctx, 110, 58, 1, 'rgba(244,234,216,0.9)');
  cloud(ctx, 318, 40, 0.7, 'rgba(244,234,216,0.75)');
  cloud(ctx, 492, 152, 0.55, 'rgba(244,234,216,0.6)');

  bird(ctx, 150, 96, 1, '#46536e');
  bird(ctx, 205, 74, 0.75, '#46536e');
  if (!v.has('bird-gone')) bird(ctx, 400, 70, 0.85, '#46536e');

  // Distant hills.
  poly(ctx, [[0, 238], [0, 190], [40, 150], [95, 128], [150, 150], [185, 200], [200, 238]], '#5d6e8c');
  poly(ctx, [[428, 238], [478, 196], [528, 182], [560, 196], [560, 238]], '#5d6e8c');

  // Lighthouse on the left hill.
  poly(ctx, [[70, 198], [102, 198], [97, 140], [75, 140]], '#f4ead8');
  poly(ctx, [[73, 182], [99, 182], [97, 168], [75, 168]], '#e4572e');
  poly(ctx, [[76, 156], [96, 156], [95, 146], [77, 146]], '#e4572e');
  rect(ctx, 74, 118, 24, 24, '#2e1f18');
  if (v.has('lamp-dark')) {
    rect(ctx, 78, 122, 16, 16, '#6b7a8c');
  } else {
    glow(ctx, 86, 130, 30, 'rgba(255,217,138,0.75)', 'rgba(255,184,77,0)');
    rect(ctx, 78, 122, 16, 16, '#ffd98a');
    circle(ctx, 86, 130, 5, '#fff3cf');
  }
  poly(ctx, [[70, 118], [102, 118], [86, 104]], '#8a4b3a');

  // Sea sparkle (seeded, identical on both panels).
  const sea = mulberry32(hashSeed('harbour-sea'));
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 90; i++) {
    const x = sea() * VIEW_W;
    const y = 246 + sea() * 78;
    rect(ctx, x, y, 5 + sea() * 9, 1.6, '#cfe8dd');
  }
  ctx.globalAlpha = 1;

  // The big sailboat.
  stroke(ctx, 222, 262, 222, 118, 5, '#4a3226'); // mast
  poly(ctx, [[228, 128], [228, 258], [306, 258]], '#f4ead8'); // mainsail
  if (!v.has('stripe-gone')) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(228, 128); ctx.lineTo(228, 258); ctx.lineTo(306, 258); ctx.closePath();
    ctx.clip();
    rect(ctx, 228, 198, 60, 16, '#e4572e');
    ctx.restore();
  }
  poly(ctx, [[216, 140], [216, 258], [164, 258]], '#efe0c2'); // jib
  poly(ctx, [[140, 262], [316, 262], [296, 288], [164, 288]], '#8a4b3a'); // hull
  rect(ctx, 140, 262, 176, 6, '#5d3427');
  // Mast flag: coral in the original, teal in the copy.
  poly(ctx, [[222, 108], [250, 115], [222, 123]], v.has('flag-teal') ? '#2e8b8b' : '#e4572e');

  // The little rowboat, right.
  poly(ctx, [[398, 258], [508, 258], [488, 282], [416, 282]], '#5d6e8c');
  rect(ctx, 398, 258, 110, 5, '#46536e');
  rect(ctx, 428, 246, 34, 6, '#4a3226'); // seat plank
  if (!v.has('oar-gone')) {
    stroke(ctx, 424, 264, 396, 292, 5, '#8a6b45');
    ellipse(ctx, 392, 297, 10, 5, '#8a6b45');
  }

  // Quay.
  rect(ctx, 0, 336, VIEW_W, 64, '#4a3226');
  rect(ctx, 0, 336, VIEW_W, 7, '#2e1f18');
  const plank = mulberry32(hashSeed('harbour-planks'));
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 26; i++) rect(ctx, plank() * VIEW_W, 348 + plank() * 46, 26, 2, '#2e1f18');
  ctx.globalAlpha = 1;

  // Two lantern posts on the quay.
  for (const px of [120, 330]) {
    rect(ctx, px - 3, 302, 6, 36, '#2e1f18');
    const dark = px === 330 && v.has('lantern-dark');
    if (!dark) glow(ctx, px, 296, 24, 'rgba(255,217,138,0.65)', 'rgba(255,184,77,0)');
    rect(ctx, px - 7, 288, 14, 16, '#2e1f18');
    rect(ctx, px - 5, 290, 10, 12, dark ? '#5d6e8c' : '#ffd98a');
  }

  // Crates and a barrel, right end of the quay.
  rect(ctx, 438, 306, 34, 30, '#8a6b45'); rect(ctx, 438, 306, 34, 5, '#6e5433');
  rect(ctx, 474, 306, 34, 30, '#977950'); rect(ctx, 474, 306, 34, 5, '#7a5f36');
  rect(ctx, 456, 278, 34, 28, '#8a6b45'); rect(ctx, 456, 278, 34, 5, '#6e5433');
  ellipse(ctx, 428, 322, 13, 15, '#7a4a35');
  rect(ctx, 416, 314, 24, 3, '#5d3427'); rect(ctx, 416, 328, 24, 3, '#5d3427');

  // The cat: on the crates in the original, on the barrel in the copy.
  if (v.has('cat-moved')) cat(ctx, 428, 300, true, '#2b2135');
  else cat(ctx, 470, 268, false, '#2b2135');

  // A gull on the left post.
  ellipse(ctx, 120, 282, 8, 5, '#f4ead8');
  circle(ctx, 127, 278, 3.6, '#f4ead8');
  poly(ctx, [[130, 278], [136, 280], [130, 281]], '#e8875b');

  finish(ctx, 'harbour-grain');
}

// ---------------------------------------------------------------- market

function paintMarket(ctx, v) {
  skyGradient(ctx, [[0, '#1f2a52'], [0.3, '#4a3a6b'], [0.42, '#8a4a6e'], [0.46, '#3a2c4e'], [1, '#241a36']]);
  starField(ctx, 'market-stars', 70, 105, '#e8ecf7');

  // Moon: crescent in the original, full in the copy.
  glow(ctx, 492, 52, 44, 'rgba(238,241,250,0.35)', 'rgba(238,241,250,0)');
  circle(ctx, 492, 52, 21, '#eef1fa');
  if (!v.has('moon-full')) circle(ctx, 483, 46, 18, '#232f5c');

  // One bright star the copy is missing.
  if (!v.has('star-gone')) sparkStar(ctx, 205, 48, 9, '#ffe9b0');

  // Rooftop silhouettes with lit windows (seeded, identical both panels).
  rect(ctx, 0, 96, 120, 96, '#2b2140');
  rect(ctx, 128, 82, 150, 110, '#33264a');
  rect(ctx, 286, 92, 130, 100, '#2b2140');
  rect(ctx, 424, 84, 136, 108, '#33264a');
  const win = mulberry32(hashSeed('market-windows'));
  for (let i = 0; i < 26; i++) {
    const x = 12 + win() * 530;
    const y = 100 + win() * 74;
    rect(ctx, x, y, 7, 9, win() > 0.45 ? 'rgba(255,202,122,0.85)' : 'rgba(20,16,34,0.9)');
  }

  // String lights: two swags with bulbs.
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#171126';
  const swag = (x0, y0, cx, cy, x1, y1, bulbs, darkIndex) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
    for (let i = 0; i < bulbs; i++) {
      const t = (i + 1) / (bulbs + 1);
      const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
      if (i === darkIndex) {
        circle(ctx, bx, by + 5, 4.5, '#4c5872');
      } else {
        glow(ctx, bx, by + 5, 13, 'rgba(255,217,138,0.6)', 'rgba(255,184,77,0)');
        circle(ctx, bx, by + 5, 4.5, '#ffd98a');
      }
    }
  };
  swag(0, 74, 140, 108, 280, 68, 6, -1);
  swag(280, 68, 350, 116, 560, 60, 6, v.has('bulb-dark') ? 1 : -1);

  // The festoon beam the lanterns and sign hang from.
  rect(ctx, 0, 110, VIEW_W, 5, '#171126');

  // Hanging paper lanterns.
  stroke(ctx, 60, 112, 60, 128, 2, '#171126');
  paperLantern(ctx, 60, 146, '#e8875b', true);
  stroke(ctx, 150, 112, 150, 124, 2, '#171126');
  paperLantern(ctx, 150, 142, v.has('lantern-teal') ? '#2e8b8b' : '#f26d6d', true);
  stroke(ctx, 240, 112, 240, 130, 2, '#171126');
  paperLantern(ctx, 240, 148, '#e8875b', true);
  stroke(ctx, 455, 112, 455, 126, 2, '#171126');
  paperLantern(ctx, 455, 144, '#f26d6d', true);

  // The noodle stall's round sign: a fish in the original, blank in the copy.
  stroke(ctx, 292, 112, 292, 128, 2, '#171126');
  circle(ctx, 292, 148, 19, '#f4ead8');
  ctx.beginPath(); ctx.arc(292, 148, 19, 0, Math.PI * 2);
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#c9973f'; ctx.stroke();
  if (!v.has('sign-blank')) {
    ellipse(ctx, 290, 148, 10, 5.5, '#c94f6d');
    poly(ctx, [[299, 148], [307, 142], [307, 154]], '#c94f6d');
    circle(ctx, 285, 146, 1.8, '#2b2135');
  }

  // Three stalls: striped canopies, counters, goods.
  const stall = (x, w, stripeA, stripeB) => {
    poly(ctx, [[x - 6, 200], [x + 10, 174], [x + w - 10, 174], [x + w + 6, 200]], stripeA);
    for (let i = 0; i < 5; i++) {
      const sx = x + 6 + i * ((w - 12) / 5);
      poly(ctx, [[sx, 197], [sx + 8, 177], [sx + 22, 177], [sx + 14, 197]], stripeB);
    }
    rect(ctx, x - 6, 198, w + 12, 5, '#2b2135');
    rect(ctx, x, 288, w, 44, '#5d4033');
    rect(ctx, x, 288, w, 6, '#77543d');
    rect(ctx, x + 4, 210, 5, 78, '#3a2a20');
    rect(ctx, x + w - 9, 210, 5, 78, '#3a2a20');
  };
  stall(24, 162, '#c94f6d', '#f4ead8'); // fruit stall, left
  stall(198, 164, '#2e8b8b', '#f4ead8'); // noodle stall, middle
  stall(374, 162, '#e8875b', '#f4ead8'); // pottery stall, right

  // Fruit stall goods: melon pile (one melon short in the copy), oranges, greens.
  ellipse(ctx, 88, 276, 14, 11, '#7fa653');
  ellipse(ctx, 128, 276, 14, 11, '#7fa653');
  if (!v.has('melon-gone')) ellipse(ctx, 108, 268, 14, 11, '#8fbc5e');
  for (let i = 0; i < 5; i++) circle(ctx, 52 + i * 11, 282, 5.5, '#e8875b');
  rect(ctx, 140, 262, 30, 24, '#8a6b45');
  ellipse(ctx, 155, 260, 15, 6, '#5e8c4a');

  // Noodle stall: steaming bowls and a banner across the counter.
  for (const bx of [228, 268, 308]) {
    ellipse(ctx, bx, 282, 17, 7, '#f4ead8');
    ellipse(ctx, bx, 280, 13, 5, '#e8b04b');
    ctx.beginPath();
    ctx.arc(bx - 5, 262, 6, Math.PI, Math.PI * 1.7);
    ctx.arc(bx + 5, 256, 6, Math.PI, Math.PI * 1.7);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(244,234,216,0.55)'; ctx.stroke();
  }
  const banner = v.has('banner-coral') ? '#c94f6d' : '#f4ead8';
  const bannerInk = v.has('banner-coral') ? '#f4ead8' : '#c94f6d';
  rect(ctx, 210, 296, 140, 24, banner);
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  fill(ctx, bannerInk);
  ctx.fillText('HOT NOODLES', 280, 313);
  ctx.textAlign = 'left';

  // Pottery stall: jars on the counter — the tall one is gone in the copy.
  ellipse(ctx, 420, 272, 11, 14, '#b06a4a');
  rect(ctx, 415, 256, 10, 5, '#8a4b3a');
  if (!v.has('jar-gone')) {
    ellipse(ctx, 452, 258, 13, 20, '#7d8aa5');
    rect(ctx, 446, 236, 12, 6, '#5d6e8c');
    ellipse(ctx, 452, 250, 5, 8, '#5d6e8c');
  }
  ellipse(ctx, 486, 274, 10, 12, '#c9973f');
  rect(ctx, 481, 260, 10, 5, '#a8762a');

  // In the copy only: an extra small lantern under the right awning.
  if (v.has('lantern-extra')) {
    stroke(ctx, 505, 200, 505, 206, 2, '#171126');
    paperLantern(ctx, 505, 222, '#ffd98a', true);
  }

  // Ground: planks and puddles with lantern light in them.
  rect(ctx, 0, 332, VIEW_W, 68, '#3a2c4e');
  const pl = mulberry32(hashSeed('market-planks'));
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 20; i++) rect(ctx, pl() * VIEW_W, 340 + pl() * 52, 30, 2, '#241a36');
  ctx.globalAlpha = 1;
  ellipse(ctx, 130, 362, 52, 8, 'rgba(107,91,149,0.7)');
  ellipse(ctx, 130, 360, 30, 4, 'rgba(255,184,77,0.35)');
  ellipse(ctx, 420, 376, 62, 9, 'rgba(107,91,149,0.7)');
  ellipse(ctx, 420, 374, 36, 4, 'rgba(255,157,92,0.35)');

  finish(ctx, 'market-grain');
}

// ---------------------------------------------------------------- observatory

function paintObservatory(ctx, v) {
  skyGradient(ctx, [[0, '#101a38'], [0.55, '#23355e'], [0.78, '#2c3a5e'], [1, '#1a2440']]);
  starField(ctx, 'obs-stars', 110, 240, '#e8ecf7');

  // Moon with a crater the copy has lost.
  glow(ctx, 480, 64, 56, 'rgba(238,241,250,0.3)', 'rgba(238,241,250,0)');
  circle(ctx, 480, 64, 30, '#eef1fa');
  circle(ctx, 462, 78, 7, '#c9d2e4');
  circle(ctx, 494, 82, 5, '#c9d2e4');
  if (!v.has('crater-gone')) circle(ctx, 470, 54, 9, '#c9d2e4');

  if (!v.has('star-gone')) sparkStar(ctx, 300, 40, 8, '#ffe9b0');

  // The ringed planet drifts between the two pictures.
  const px = v.has('planet-moved') ? 168 : 136;
  const py = v.has('planet-moved') ? 92 : 80;
  glow(ctx, px, py, 30, 'rgba(232,135,91,0.35)', 'rgba(232,135,91,0)');
  circle(ctx, px, py, 14, '#e8875b');
  ellipse(ctx, px, py - 3, 6, 4, '#c94f6d');
  ctx.beginPath();
  ctx.ellipse(px, py, 24, 7, -0.35, 0, Math.PI * 2);
  ctx.lineWidth = 3; ctx.strokeStyle = '#c9973f'; ctx.stroke();

  // A comet, only in the original.
  if (!v.has('comet-gone')) {
    stroke(ctx, 74, 128, 106, 152, 3, 'rgba(232,236,247,0.5)');
    stroke(ctx, 82, 118, 108, 150, 2, 'rgba(232,236,247,0.35)');
    glow(ctx, 112, 158, 16, 'rgba(238,241,250,0.6)', 'rgba(238,241,250,0)');
    circle(ctx, 112, 158, 5, '#eef1fa');
  }

  // Far hills.
  poly(ctx, [[0, 400], [0, 322], [90, 300], [180, 322], [260, 306], [360, 322], [450, 304], [560, 326], [560, 400]], '#141f3a');

  // The dead tree and its owl, left.
  poly(ctx, [[64, 400], [74, 300], [82, 252], [90, 300], [96, 400]], '#0e1526');
  stroke(ctx, 80, 258, 138, 230, 7, '#0e1526');
  stroke(ctx, 82, 282, 128, 268, 5, '#0e1526');
  if (!v.has('owl-gone')) {
    ellipse(ctx, 104, 218, 10, 13, '#7d6a52');
    circle(ctx, 104, 204, 8, '#8f7c60');
    circle(ctx, 101, 203, 2.6, '#eef1fa'); circle(ctx, 107, 203, 2.6, '#eef1fa');
    circle(ctx, 101, 203, 1.3, '#101a38'); circle(ctx, 107, 203, 1.3, '#101a38');
    poly(ctx, [[97, 196], [100, 190], [103, 196]], '#7d6a52');
    poly(ctx, [[105, 196], [108, 190], [111, 196]], '#7d6a52');
  }

  // Stone tower.
  rect(ctx, 232, 196, 96, 142, '#4c5872');
  rect(ctx, 232, 196, 96, 10, '#3c4763');
  const stone = mulberry32(hashSeed('obs-stone'));
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 22; i++) rect(ctx, 236 + stone() * 86, 212 + stone() * 118, 12, 2.4, '#333f59');
  ctx.globalAlpha = 1;
  // Windows: the upper one is dark in the copy.
  if (v.has('window-dark')) {
    rect(ctx, 250, 228, 16, 20, '#1a2440');
  } else {
    glow(ctx, 258, 238, 18, 'rgba(255,202,122,0.55)', 'rgba(255,202,122,0)');
    rect(ctx, 250, 228, 16, 20, '#ffca7a');
  }
  rect(ctx, 252, 236, 12, 2, '#4c5872');
  glow(ctx, 302, 282, 18, 'rgba(255,202,122,0.55)', 'rgba(255,202,122,0)');
  rect(ctx, 294, 272, 16, 20, '#ffca7a');
  rect(ctx, 296, 280, 12, 2, '#4c5872');
  // Door.
  poly(ctx, [[266, 338], [266, 306], [280, 296], [294, 306], [294, 338]], '#2b2135');
  circle(ctx, 288, 322, 2.2, '#c9973f');

  // The dome.
  ctx.beginPath();
  ctx.arc(280, 196, 54, Math.PI, 0);
  ctx.closePath();
  fill(ctx, '#7d8aa5');
  ctx.fill();
  ctx.beginPath();
  ctx.arc(280, 196, 54, Math.PI, 0);
  ctx.lineWidth = 3; ctx.strokeStyle = '#5d6e8c'; ctx.stroke();
  rect(ctx, 222, 192, 116, 7, '#5d6e8c');
  // Dome slit: glowing in the original, dark in the copy.
  poly(ctx, [[293, 196], [293, 152], [303, 148], [309, 196]], v.has('slit-dark') ? '#232f4a' : '#ffca7a');
  if (!v.has('slit-dark')) glow(ctx, 300, 170, 20, 'rgba(255,202,122,0.45)', 'rgba(255,202,122,0)');

  // The telescope, poking out of the slit — gone in the copy.
  if (!v.has('scope-gone')) {
    stroke(ctx, 302, 158, 368, 106, 13, '#3c4763');
    stroke(ctx, 302, 158, 368, 106, 7, '#c9973f');
    circle(ctx, 370, 104, 8, '#23355e');
    stroke(ctx, 306, 164, 292, 178, 6, '#3c4763');
  }

  // Finial and pennant: coral in the original, teal in the copy.
  stroke(ctx, 280, 142, 280, 112, 3, '#5d6e8c');
  circle(ctx, 280, 110, 3.5, '#c9973f');
  poly(ctx, [[280, 112], [301, 119], [280, 126]], v.has('pennant-teal') ? '#2e8b8b' : '#e4572e');

  // Foreground hill and the winding path.
  poly(ctx, [[0, 400], [0, 352], [120, 338], [240, 348], [380, 340], [560, 356], [560, 400]], '#1c2a4a');
  poly(ctx, [[266, 338], [294, 338], [306, 372], [322, 400], [238, 400], [252, 370]], '#8d8574');
  ellipse(ctx, 280, 366, 16, 4, 'rgba(20,26,48,0.35)');
  ellipse(ctx, 272, 388, 20, 4, 'rgba(20,26,48,0.35)');

  // Path lanterns: the left one is unlit in the copy.
  for (const [lx, ly, dark] of [[322, 348, false], [232, 362, v.has('path-dark')]]) {
    rect(ctx, lx - 2, ly, 4, 22, '#0e1526');
    if (!dark) glow(ctx, lx, ly - 6, 17, 'rgba(255,202,122,0.6)', 'rgba(255,202,122,0)');
    rect(ctx, lx - 5, ly - 13, 10, 12, '#0e1526');
    rect(ctx, lx - 3.5, ly - 11, 7, 8, dark ? '#3c4763' : '#ffca7a');
  }

  // The exposed clockwork at the hill's foot.
  gear(ctx, 192, 334, 27, 12, '#c9973f', '#6e4f1c');
  gear(ctx, 424, 320, 20, 10, '#a8762a', '#54390f');
  if (!v.has('gear-gone')) gear(ctx, 452, 350, 13, 8, '#c9973f', '#6e4f1c');

  // Grass tufts (seeded, identical both panels).
  const grass = mulberry32(hashSeed('obs-grass'));
  ctx.lineWidth = 2; ctx.strokeStyle = '#2c4a3a';
  for (let i = 0; i < 34; i++) {
    const x = grass() * VIEW_W;
    const y = 356 + grass() * 40;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 8);
    ctx.moveTo(x + 3, y); ctx.lineTo(x + 4, y - 9);
    ctx.stroke();
  }

  finish(ctx, 'obs-grain');
}

// ---------------------------------------------------------------- catalogue

export const SCENES = [
  {
    id: 'harbour',
    title: 'Dawn Harbour',
    paint: paintHarbour,
    differences: [
      { id: 'lamp', vary: 'lamp-dark', x: 86, y: 129, r: 19, label: 'The lighthouse lamp has gone dark' },
      { id: 'flag', vary: 'flag-teal', x: 234, y: 115, r: 15, label: 'The mast flag changed from coral to teal' },
      { id: 'bird', vary: 'bird-gone', x: 400, y: 70, r: 18, label: 'One gull is missing from the sky' },
      { id: 'stripe', vary: 'stripe-gone', x: 250, y: 206, r: 20, label: 'The sail lost its coral stripe' },
      { id: 'oar', vary: 'oar-gone', x: 405, y: 282, r: 20, label: 'The rowboat lost its oar' },
      { id: 'lantern', vary: 'lantern-dark', x: 330, y: 296, r: 17, label: 'The right quay lantern is unlit' },
      { id: 'cat', vary: 'cat-moved', x: 452, y: 282, r: 25, label: 'The cat moved from the crates to the barrel' },
    ],
  },
  {
    id: 'market',
    title: 'Night Market',
    paint: paintMarket,
    differences: [
      { id: 'star', vary: 'star-gone', x: 205, y: 48, r: 14, label: 'A bright star is missing' },
      { id: 'moon', vary: 'moon-full', x: 492, y: 52, r: 20, label: 'The crescent moon filled out' },
      { id: 'bulb', vary: 'bulb-dark', x: 346, y: 94, r: 13, label: 'One string-light bulb is dark' },
      { id: 'lantern', vary: 'lantern-teal', x: 150, y: 142, r: 17, label: 'A paper lantern changed from coral to teal' },
      { id: 'sign', vary: 'sign-blank', x: 292, y: 148, r: 18, label: 'The fish vanished from the round sign' },
      { id: 'melon', vary: 'melon-gone', x: 108, y: 270, r: 20, label: 'One melon is missing from the pile' },
      { id: 'banner', vary: 'banner-coral', x: 280, y: 308, r: 20, label: 'The noodle banner swapped its colours' },
      { id: 'jar', vary: 'jar-gone', x: 452, y: 256, r: 16, label: 'The tall jar left the pottery counter' },
      { id: 'extra', vary: 'lantern-extra', x: 505, y: 222, r: 15, label: 'An extra lantern hangs by the pottery stall' },
    ],
  },
  {
    id: 'observatory',
    title: 'Clockwork Observatory',
    paint: paintObservatory,
    differences: [
      { id: 'star', vary: 'star-gone', x: 300, y: 40, r: 12, label: 'A bright star is missing' },
      { id: 'crater', vary: 'crater-gone', x: 470, y: 54, r: 12, label: 'The moon lost a crater' },
      { id: 'planet', vary: 'planet-moved', x: 152, y: 86, r: 27, label: 'The ringed planet drifted' },
      { id: 'pennant', vary: 'pennant-teal', x: 289, y: 119, r: 13, label: 'The dome pennant changed from coral to teal' },
      { id: 'comet', vary: 'comet-gone', x: 112, y: 158, r: 20, label: 'The comet is gone' },
      { id: 'scope', vary: 'scope-gone', x: 340, y: 128, r: 22, label: 'The telescope is missing from the slit' },
      { id: 'slit', vary: 'slit-dark', x: 300, y: 170, r: 18, label: 'The dome slit has gone dark' },
      { id: 'owl', vary: 'owl-gone', x: 104, y: 212, r: 17, label: 'The owl left its branch' },
      { id: 'window', vary: 'window-dark', x: 258, y: 238, r: 13, label: 'A tower window went dark' },
      { id: 'pathlight', vary: 'path-dark', x: 232, y: 356, r: 14, label: 'A path lantern is unlit' },
      { id: 'gear', vary: 'gear-gone', x: 452, y: 350, r: 18, label: 'The smallest gear is missing' },
    ],
  },
];

// variantKeys(scene) — the vary keys that turn the original into the copy.
export function variantKeys(scene) {
  return new Set(scene.differences.map((d) => d.vary));
}
