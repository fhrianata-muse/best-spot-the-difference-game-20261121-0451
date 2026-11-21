# LOOK — Lantern & Lens · Spot the Difference

## The game
**Lantern & Lens** is a spot-the-difference game drawn entirely on HTML canvas:
two near-identical hand-drawn pictures sit side by side, and the player hunts
the differences between them. Three scenes, 27 differences in all, one warm
lantern-lit world that carries from dawn to midnight.

## Scenes and palettes
Every scene is flat illustration built from layered silhouettes — sky gradient,
a distant layer, a mid layer, then foreground props — finished with a light
grain and a soft vignette so the picture feels printed, not rendered.

### 1 · Dawn Harbour (morning, quiet)
- Sky: `#f7c98b` horizon → `#f29e7e` mid → `#7fb2c9` zenith
- Sea: `#3e7d8c` deep, `#79b5ad` sparkle
- Hills / rooftops silhouette: `#5d6e8c`, `#46536e`
- Boats: hull `#8a4b3a`, sails cream `#f4ead8`, accents coral `#e4572e`
- Lantern glow: `#ffd98a` core, `#ffb84d` halo

### 2 · Night Market (evening, busy)
- Sky: `#1f2a52` zenith → `#4a3a6b` → `#8a4a6e` horizon ember
- Stall canvas: `#c94f6d`, `#e8875b`, teal `#2e8b8b`
- Paper lanterns: `#ffd98a`, `#ff9d5c`, `#f26d6d` with warm halos
- Ground: `#3a2c4e` planks, puddle sheen `#6b5b95`
- Signage ink: `#2b2135` on cream `#f4ead8`

### 3 · Clockwork Observatory (night, still)
- Sky: `#101a38` → `#23355e`, stars `#e8ecf7`
- Dome: `#7d8aa5` metal, slit glow `#ffd98a`
- Brass gears: `#c9973f`, `#a8762a`, teeth shadow `#6e4f1c`
- Stone tower: `#4c5872`, lit windows `#ffca7a`
- Moon: `#eef1fa`, crater shade `#c9d2e4`

## Material language
- **Flat illustration, layered silhouettes.** No photos, no gradients-for-depth
  tricks beyond sky and sea; shapes are solid fills with one darker shade side.
- **Warm lantern light is the unifying motif.** Every scene has lanterns or lit
  windows in the same amber (`#ffd98a` core / `#ffb84d` halo), so the three
  scenes read as one world at three hours of the day.
- **Panel framing.** Each picture sits in a dark wood frame (`#4a3226` edge,
  `#2e1f18` inner bevel) with a small brass screw (`#c9973f`) in each corner,
  on a cream paper table (`#f1e7d0`).
- **UI is cream paper and brass.** Header and controls are paper cards
  (`#f7efdc`) with ink text (`#2b2135`), brass buttons (`#c9973f` →
  `#a8762a` pressed), coral reserved for action and markers.

## Typography
- Display: Georgia, 'Times New Roman', serif — title, scene names, overlays.
- UI: system sans (`-apple-system`, 'Segoe UI', Roboto) — counter, timer,
  buttons, hints. Numbers use tabular figures so the timer never jitters.

## Markers and feedback
- **Found marker:** coral-red ring (`#e4572e`, 3px) with a white core and a
  white tick inside; a soft coral halo on the frame it lands. Identical on
  both panels, at the mirrored spot.
- **Hint:** expanding amber ring (`#ffb84d`) that pulses twice around the
  difference, on both panels, then fades — never a permanent give-away.
- **Miss:** small ink-red X (`#b03030`) that fades in under a second.

## Checks (the bar every frame must pass)
1. Both panels are the same style, same palette, same framing — the only
   differences between them are the planted ones.
2. Every planted difference is readable at screenshot size (1280×800 page,
   panel ≈ 560×400): no sub-6px details, no differences that rely on colour
   vision alone where a shape change would do.
3. Found markers are coral-red rings with a white tick — visible at a glance
   in a contact sheet, never confused with scene content.
4. The counter ("N to find"), timer and scene name are legible in every
   screenshot without zooming.
