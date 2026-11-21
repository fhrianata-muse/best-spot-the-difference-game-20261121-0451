// config.js — the game's tuning in one place: level order, per-level clock and
// hint allowances, hit-radius scaling, and the scoring constants every other
// module reads. No logic lives here, only numbers and names.

export const LEVELS = [
  {
    scene: 'harbour',
    name: 'Scene One · Dawn Harbour',
    subtitle: 'First light over the quay — seven things are not as they were.',
    seconds: 300,
    hints: 3,
    radiusScale: 1.15,
  },
  {
    scene: 'market',
    name: 'Scene Two · Night Market',
    subtitle: 'Lanterns, steam and crowds — nine things have slipped.',
    seconds: 300,
    hints: 3,
    radiusScale: 1.0,
  },
  {
    scene: 'observatory',
    name: 'Scene Three · Clockwork Observatory',
    subtitle: 'Brass, glass and starlight — eleven things are out of place.',
    seconds: 360,
    hints: 3,
    radiusScale: 0.92,
  },
];

export const SCORING = {
  perFind: 100, // points for each difference found
  hintCost: 25, // points a hint takes back
  mistakeCost: 10, // points a wrong click takes back
  timeBonusPerSecond: 2, // points per second left when a scene is cleared
  sceneFloor: 0, // a scene's score never drops below this
};

export const HINT_PULSE_MS = 1600; // how long a hint ring stays on the panels
export const HINT_COOLDOWN_MS = 5000; // time between hints
export const MARKER_POP_MS = 350; // find-marker pop animation length
export const MISS_FLASH_MS = 800; // wrong-click X fade length
export const LOW_TIME_SECONDS = 60; // timer turns red below this
