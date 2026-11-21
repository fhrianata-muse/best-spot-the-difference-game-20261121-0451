// shots.js — deterministic staged states for screenshots.
//
// With ?shot=<name> in the URL the game boots straight into a frozen,
// mid-hunt tableau instead of the title screen: a fixed set of differences
// already found, a fixed clock, and (for two shots) a hint pulse or the
// loupe held open. The render loop's clock is frozen in shot mode, so every
// capture is byte-stable and shows the game exactly as a player sees it
// mid-hunt. Without ?shot, this module changes nothing.

const SHOTS = {
  // The cover: Night Market mid-hunt, hint ring open on the tall jar.
  cover: {
    level: 1,
    found: ['star', 'lantern', 'melon', 'banner'],
    remainingSeconds: 221, // 03:41
    hintId: 'jar',
    score: 340,
    mistakes: 1,
  },
  // Dawn Harbour, three found and four to go.
  harbour: {
    level: 0,
    found: ['lamp', 'stripe', 'oar'],
    remainingSeconds: 252, // 04:12
    score: 285,
    mistakes: 1,
  },
  // Clockwork Observatory with the loupe open over the right panel.
  observatory: {
    level: 2,
    found: ['planet', 'comet', 'slit', 'owl', 'gear'],
    remainingSeconds: 277, // 04:37
    loupe: { panel: 1, x: 330, y: 130 },
    score: 460,
    mistakes: 2,
  },
  // Dawn Harbour cleared: every marker down, the clear card up.
  complete: {
    level: 0,
    found: ['lamp', 'flag', 'bird', 'stripe', 'oar', 'lantern', 'cat'],
    remainingSeconds: 96,
    cleared: true,
    score: 880,
    mistakes: 1,
  },
};

// readShot() — the staged state for this URL, or null for a normal game.
export function readShot() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('shot');
  if (!name || !SHOTS[name]) return null;
  return { name, ...SHOTS[name] };
}
