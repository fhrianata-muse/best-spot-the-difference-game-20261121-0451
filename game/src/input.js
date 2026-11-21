// input.js — mouse and keyboard control for the two panels.
//
// Mouse: moving over a panel tracks the point (for the loupe); clicking a
// panel reports the scene-space point to the game. Keyboard: a brass
// crosshair lives on one panel at a time — arrows/WASD move it, Tab swaps
// panels, Enter/Space checks the spot under it. All coordinates that leave
// this module are in scene space (560x400), never pixels.

import { VIEW_W, VIEW_H } from './scenes.js';

// toScene(canvas, event) — map a mouse event to scene coordinates, or null
// when the point falls outside the picture.
export function toScene(canvas, event) {
  const box = canvas.getBoundingClientRect();
  const x = ((event.clientX - box.left) / box.width) * VIEW_W;
  const y = ((event.clientY - box.top) / box.height) * VIEW_H;
  if (x < 0 || y < 0 || x > VIEW_W || y > VIEW_H) return null;
  return { x, y };
}

export class Crosshair {
  constructor() {
    this.panel = 0; // 0 = left (original), 1 = right (copy)
    this.x = VIEW_W / 2;
    this.y = VIEW_H / 2;
    this.active = false; // appears on the first keyboard move
  }

  move(dx, dy) {
    this.active = true;
    this.x = Math.max(4, Math.min(VIEW_W - 4, this.x + dx));
    this.y = Math.max(4, Math.min(VIEW_H - 4, this.y + dy));
  }

  swapPanel() {
    this.active = true;
    this.panel = this.panel === 0 ? 1 : 0;
  }
}

// attachInput(handlers) — wire both canvases and the keyboard.
// handlers: { onPoint(panel, point, source), onHover(panel, point|null),
//             onHint(), onRestart(), onNext(), onLoupe(down) }
export function attachInput(canvases, crosshair, handlers) {
  canvases.forEach((canvas, panel) => {
    canvas.addEventListener('mousemove', (event) => {
      handlers.onHover(panel, toScene(canvas, event));
    });
    canvas.addEventListener('mouseleave', () => handlers.onHover(panel, null));
    canvas.addEventListener('click', (event) => {
      const point = toScene(canvas, event);
      if (point) handlers.onPoint(panel, point, 'mouse');
    });
  });

  window.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 14 : 6;
    switch (event.key) {
      case 'ArrowLeft': case 'a': case 'A':
        crosshair.move(-step, 0); break;
      case 'ArrowRight': case 'd': case 'D':
        crosshair.move(step, 0); break;
      case 'ArrowUp': case 'w': case 'W':
        crosshair.move(0, -step); break;
      case 'ArrowDown': case 's': case 'S':
        crosshair.move(0, step); break;
      case 'Tab':
        event.preventDefault();
        crosshair.swapPanel();
        break;
      case 'Enter': case ' ':
        if (crosshair.active) {
          event.preventDefault();
          handlers.onPoint(crosshair.panel, { x: crosshair.x, y: crosshair.y }, 'keyboard');
        }
        return; // let buttons keep their own Enter/Space behaviour otherwise
      case 'h': case 'H':
        handlers.onHint(); break;
      case 'r': case 'R':
        handlers.onRestart(); break;
      case 'n': case 'N':
        handlers.onNext(); break;
      case 'Shift':
        handlers.onLoupe(true); break;
      default:
        return;
    }
    if (event.key.startsWith('Arrow')) event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (event.key === 'Shift') handlers.onLoupe(false);
  });
}
