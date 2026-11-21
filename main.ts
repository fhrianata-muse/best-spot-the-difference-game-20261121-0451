// main.ts — the hand-in program for Lantern & Lens on make.fun.
//
// It copies the playable game (game/) and its screenshots (screenshots/)
// into the output directory and writes dossier.json there with the kit's
// buildDossier — the exact bytes the judge's dossier check recomputes.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { buildDossier } from "./vendor/makefun-game.ts";
import { chmodSync, cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Everything copied lands writable, even when the source checkout is
// read-only: cpSync preserves modes, and a read-only file in the output
// would break the grader's own writes.
function makeWritable(dir: string): void {
  chmodSync(dir, 0o755);
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) makeWritable(path);
    else chmodSync(path, 0o644);
  }
}

// Start from an empty output directory so no stale file can leak into the
// entry. The output directory may be a mount point in the grader, so it is
// emptied, never removed: create it if needed, then delete only its
// contents.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

for (const part of ["game", "screenshots"]) {
  cpSync(join(root, part), join(out, part), { recursive: true });
  makeWritable(join(out, part));
}

const dossier = buildDossier(out, CAPS);
writeFileSync(join(out, "dossier.json"), dossier);

// Verify before declaring success: every source file must have arrived in
// the output, and the dossier on disk must be byte-identical to a fresh
// buildDossier over the output — the same recomputation the grader runs.
// A mismatch throws, so a broken hand-in exits non-zero instead of quietly
// shipping.
function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return n;
}

for (const part of ["game", "screenshots"]) {
  const want = countFiles(join(root, part));
  const got = countFiles(join(out, part));
  if (want !== got) throw new Error(`main.ts: ${part} copy incomplete (${got}/${want} files)`);
}

const onDisk = readFileSync(join(out, "dossier.json"));
const rebuilt = buildDossier(out, CAPS);
if (!onDisk.equals(Buffer.from(rebuilt))) {
  throw new Error("main.ts: dossier.json on disk does not match a fresh buildDossier");
}

const shots = readdirSync(join(out, "screenshots")).length;
console.log(`Lantern & Lens: game + ${shots} screenshots copied to ${out}; dossier.json is ${dossier.length} bytes (verified).`);
