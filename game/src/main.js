// main.js — the game itself: the state machine and all the UI wiring.
//
// States: title -> playing -> cleared -> (next scene) playing -> finished,
// with failed dropping back to a retry of the same scene. This module owns
// the score, the clock, the hint budget and the overlays; scenes.js knows
// the pictures, render.js knows how to draw them, input.js knows the
// controls, audio.js knows the sounds.

import { LEVELS, SCORING, HINT_COOLDOWN_MS, LOW_TIME_SECONDS } from './config.js';
import { SCENES } from './scenes.js';
import { drawPanel } from './render.js';
import { attachInput, Crosshair } from './input.js';
import { readShot } from './shots.js';
import * as audio from './audio.js';

const $ = (id) => document.getElementById(id);
const canvases = [$('panel-left'), $('panel-right')];
const contexts = canvases.map((c) => c.getContext('2d'));
// The canvases are backed at 2x (1120x800) and displayed at 560x400, so all
// drawing happens in scene space through this scale.
contexts.forEach((ctx) => ctx.scale(2, 2));

const shot = readShot();

const game = {
  mode: 'title', // title | playing | cleared | failed | finished
  levelIndex: 0,
  found: new Map(), // difference id -> time found
  misses: [],
  popups: [],
  hint: null, // { id, t0 }
  hintsLeft: 0,
  hintsUsed: 0,
  hintReadyAt: 0,
  mistakes: 0,
  score: 0,
  sceneScore: 0,
  lastBonus: 0,
  remainingMs: 0,
  lastTickSecond: -1,
  shakeUntil: 0,
  mouse: [null, null],
  loupeHeld: false,
  loupeToggle: false,
  crosshair: new Crosshair(),
};

function level() {
  return LEVELS[game.levelIndex];
}

function scene() {
  return SCENES.find((s) => s.id === level().scene);
}

// In shot mode the clock is frozen, so animations hold a good frame and
// every screenshot is byte-stable.
function now() {
  return shot ? 1000 : performance.now();
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ------------------------------------------------------------ HUD sync

let lastTimerText = '';
let lastHintKey = '';

function syncTimer() {
  const text = formatTime(game.remainingMs);
  if (text !== lastTimerText) {
    lastTimerText = text;
    $('timer').textContent = text;
  }
  $('timer').classList.toggle('danger', game.remainingMs < LOW_TIME_SECONDS * 1000 && game.mode === 'playing');
}

function syncHud() {
  const sc = scene();
  $('scene-name').textContent = level().name;
  $('scene-subtitle').textContent = level().subtitle;
  $('counter-num').textContent = String(sc.differences.length - game.found.size);
  $('score-num').textContent = String(game.score);
  $('hint-count').textContent = String(game.hintsLeft);

  const pips = $('pips');
  pips.innerHTML = '';
  for (const diff of sc.differences) {
    const pip = document.createElement('span');
    pip.className = game.found.has(diff.id) ? 'pip on' : 'pip';
    pips.appendChild(pip);
  }

  const dots = $('scene-dots');
  dots.innerHTML = '';
  LEVELS.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i === game.levelIndex ? ' now' : i < game.levelIndex ? ' done' : '');
    dots.appendChild(dot);
  });

  syncTimer();
  syncHintButton();
}

function syncHintButton() {
  const key = `${game.hintsLeft}|${game.mode}|${now() >= game.hintReadyAt}`;
  if (key === lastHintKey) return;
  lastHintKey = key;
  $('btn-hint').disabled = game.mode !== 'playing' || game.hintsLeft <= 0 || now() < game.hintReadyAt;
}

// ------------------------------------------------------------ overlays

function showOverlay({ title, stars = 0, text, primary, secondary = null, dock = false }) {
  $('overlay-title').textContent = title;
  $('overlay-stars').textContent = stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
  $('overlay-text').textContent = text;
  $('btn-primary').textContent = primary;
  const sec = $('btn-secondary');
  if (secondary) {
    sec.textContent = secondary;
    sec.style.display = '';
  } else {
    sec.style.display = 'none';
  }
  // End-of-scene cards dock to the bottom of the screen: the finished
  // picture, with every marker down, is the trophy — the card must not
  // sit on top of it.
  $('overlay').classList.toggle('dock', dock);
  $('overlay').classList.remove('hidden');
}

function hideOverlay() {
  $('overlay').classList.add('hidden');
}

function starRating() {
  if (game.hintsUsed === 0 && game.mistakes <= 2) return 3;
  if (game.mistakes <= 5) return 2;
  return 1;
}

function showClearOverlay() {
  const last = game.levelIndex === LEVELS.length - 1;
  if (last) {
    showOverlay({
      title: 'Case Closed',
      stars: starRating(),
      text: `Every scene searched. Final score ${game.score}, with ${formatTime(game.remainingMs)} to spare on the last clock.`,
      primary: 'Play again',
      dock: true,
    });
  } else {
    showOverlay({
      title: 'Scene cleared',
      stars: starRating(),
      text: `All ${scene().differences.length} differences found. Scene score ${game.sceneScore}` +
        (game.lastBonus ? `, including a +${game.lastBonus} time bonus.` : '.'),
      primary: 'Next scene',
      secondary: 'Replay scene',
      dock: true,
    });
  }
}

function showFailOverlay() {
  showOverlay({
    title: 'The light faded',
    stars: 0,
    text: `Time ran out with ${scene().differences.length - game.found.size} differences still hiding in ${scene().title}.`,
    primary: 'Retry scene',
    dock: true,
  });
}

function showTitleOverlay() {
  showOverlay({
    title: 'Lantern & Lens',
    stars: 0,
    text: 'Two pictures, side by side — and they are not quite the same. ' +
      'Find every difference before the clock runs down: 7 in the harbour, 9 in the market, 11 at the observatory. ' +
      'Click a difference in either picture. Hints are limited, and mistakes cost points.',
    primary: 'Play',
  });
}

// ------------------------------------------------------------ game flow

function loadLevel(index) {
  game.levelIndex = index;
  game.found = new Map();
  game.misses = [];
  game.popups = [];
  game.hint = null;
  game.hintsLeft = level().hints;
  game.hintsUsed = 0;
  game.hintReadyAt = 0;
  game.mistakes = 0;
  game.sceneScore = 0;
  game.lastBonus = 0;
  game.remainingMs = level().seconds * 1000;
  game.lastTickSecond = -1;
  game.shakeUntil = 0;
  game.mode = 'playing';
  hideOverlay();
  syncHud();
}

function clearScene() {
  const bonus = Math.ceil(game.remainingMs / 1000) * SCORING.timeBonusPerSecond;
  game.lastBonus = bonus;
  game.score += bonus;
  game.sceneScore += bonus;
  game.mode = game.levelIndex === LEVELS.length - 1 ? 'finished' : 'cleared';
  audio.chime();
  syncHud();
  showClearOverlay();
}

function failScene() {
  game.mode = 'failed';
  audio.thud();
  syncHud();
  showFailOverlay();
}

function handlePoint(panel, point) {
  audio.unlock();
  if (game.mode !== 'playing') return;
  const t = now();
  const sc = scene();
  const scale = level().radiusScale;
  let best = null;
  let bestDist = Infinity;
  for (const diff of sc.differences) {
    if (game.found.has(diff.id)) continue;
    const d = Math.hypot(diff.x - point.x, diff.y - point.y);
    if (d <= diff.r * scale && d < bestDist) {
      best = diff;
      bestDist = d;
    }
  }
  if (best) {
    game.found.set(best.id, t);
    game.sceneScore += SCORING.perFind;
    game.score += SCORING.perFind;
    game.popups.push({ x: best.x, y: Math.max(18, best.y - best.r - 8), text: `+${SCORING.perFind}`, t0: t });
    if (game.hint && game.hint.id === best.id) game.hint = null;
    audio.pop();
    syncHud();
    if (game.found.size === sc.differences.length) clearScene();
  } else {
    game.mistakes += 1;
    game.sceneScore = Math.max(SCORING.sceneFloor, game.sceneScore - SCORING.mistakeCost);
    game.score = Math.max(0, game.score - SCORING.mistakeCost);
    game.misses.push({ x: point.x, y: point.y, t0: t });
    game.popups.push({ x: point.x, y: Math.max(18, point.y - 16), text: `-${SCORING.mistakeCost}`, t0: t });
    game.shakeUntil = t + 260;
    audio.thud();
    syncHud();
  }
}

function useHint() {
  if (game.mode !== 'playing') return;
  const t = now();
  if (game.hintsLeft <= 0 || t < game.hintReadyAt) return;
  const remaining = scene().differences.filter((d) => !game.found.has(d.id));
  if (!remaining.length) return;
  const diff = remaining[Math.floor(Math.random() * remaining.length)];
  game.hint = { id: diff.id, t0: t };
  game.hintsLeft -= 1;
  game.hintsUsed += 1;
  game.hintReadyAt = t + HINT_COOLDOWN_MS;
  game.sceneScore = Math.max(SCORING.sceneFloor, game.sceneScore - SCORING.hintCost);
  game.score = Math.max(0, game.score - SCORING.hintCost);
  audio.unlock();
  syncHud();
}

function restartScene() {
  if (game.mode === 'title') return;
  const keepScore = game.score - game.sceneScore;
  loadLevel(game.levelIndex);
  game.score = keepScore;
  syncHud();
}

// ------------------------------------------------------------ wiring

$('btn-hint').addEventListener('click', useHint);
$('btn-restart').addEventListener('click', restartScene);
$('btn-loupe').addEventListener('click', () => {
  game.loupeToggle = !game.loupeToggle;
  $('btn-loupe').classList.toggle('active', game.loupeToggle);
});
function toggleMute() {
  audio.unlock();
  audio.setMuted(!audio.isMuted());
  $('btn-mute').textContent = audio.isMuted() ? 'Sound: off' : 'Sound: on';
}

$('btn-mute').addEventListener('click', toggleMute);
window.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') toggleMute();
});
$('btn-primary').addEventListener('click', () => {
  audio.unlock();
  if (game.mode === 'title') loadLevel(0);
  else if (game.mode === 'cleared') loadLevel(game.levelIndex + 1);
  else if (game.mode === 'failed') restartScene();
  else if (game.mode === 'finished') { game.score = 0; loadLevel(0); }
});
$('btn-secondary').addEventListener('click', () => {
  audio.unlock();
  if (game.mode === 'cleared') restartScene();
});

attachInput(canvases, game.crosshair, {
  onPoint: (panel, point) => handlePoint(panel, point),
  onHover: (panel, point) => { game.mouse[panel] = point; },
  onHint: useHint,
  onRestart: restartScene,
  onNext: () => { if (game.mode === 'cleared') loadLevel(game.levelIndex + 1); },
  onLoupe: (down) => { game.loupeHeld = down; },
});

// ------------------------------------------------------------ shot staging

function stageShot() {
  loadLevel(shot.level);
  for (const id of shot.found) game.found.set(id, 100); // settled at the frozen clock
  game.remainingMs = shot.remainingSeconds * 1000;
  game.score = shot.score;
  game.sceneScore = shot.score;
  game.mistakes = shot.mistakes || 0;
  if (shot.hintId) {
    game.hint = { id: shot.hintId, t0: 280 }; // pulse mid-flight at the frozen clock
    game.hintsUsed = 1;
    game.hintsLeft = level().hints - 1;
  }
  if (shot.cleared) {
    game.mode = 'cleared';
    syncHud();
    showClearOverlay();
    return;
  }
  syncHud();
}

// ------------------------------------------------------------ main loop

function loupeFor(panel) {
  if (shot && shot.loupe && shot.loupe.panel === panel) {
    return { x: shot.loupe.x, y: shot.loupe.y };
  }
  if ((game.loupeHeld || game.loupeToggle) && game.mouse[panel]) return game.mouse[panel];
  return null;
}

let lastFrameAt = performance.now();

function frame() {
  const realNow = performance.now();
  // Clamp the step: when the tab is hidden, requestAnimationFrame stops and
  // the gap until the next frame can be minutes. Without the clamp the
  // clock would drain in one frame and fail the scene through no fault of
  // the player; with it, time spent away simply does not count.
  const dt = Math.min(100, realNow - lastFrameAt);
  lastFrameAt = realNow;

  if (!shot && game.mode === 'playing') {
    game.remainingMs -= dt;
    const sec = Math.ceil(game.remainingMs / 1000);
    if (sec <= 10 && sec >= 0 && sec !== game.lastTickSecond) {
      game.lastTickSecond = sec;
      audio.tick();
    }
    if (game.remainingMs <= 0) {
      game.remainingMs = 0;
      failScene();
    }
    syncTimer();
    syncHintButton();
  }

  const t = now();
  game.misses = game.misses.filter((m) => t - m.t0 < 900);
  game.popups = game.popups.filter((p) => t - p.t0 < 1200);

  const sc = scene();
  for (let panel = 0; panel < 2; panel++) {
    drawPanel(contexts[panel], sc, panel === 1, {
      found: game.found,
      hint: game.hint,
      misses: game.misses,
      popups: game.popups,
      crosshair: game.crosshair.active && game.crosshair.panel === panel && game.mode === 'playing'
        ? { x: game.crosshair.x, y: game.crosshair.y }
        : null,
      loupe: loupeFor(panel),
      shakeUntil: game.shakeUntil,
    }, t);
  }

  requestAnimationFrame(frame);
}

// ------------------------------------------------------------ boot

if (shot) {
  stageShot();
} else {
  loadLevel(0);
  game.mode = 'title';
  showTitleOverlay();
  syncHud();
}
requestAnimationFrame(frame);
