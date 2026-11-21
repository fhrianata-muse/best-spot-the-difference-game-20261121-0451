// random.js — a tiny seeded random number generator (mulberry32) plus the two
// helpers the painters use. Seeding is what makes the two panels identical:
// each panel is painted with a fresh generator on the same seed, so every
// star, sparkle and grain fleck lands in exactly the same place on both.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// range(rng, min, max) — a float in [min, max) drawn from rng.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// pick(rng, list) — one element of list, chosen by rng.
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// hashSeed(text) — turn a scene id into a stable numeric seed.
export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
