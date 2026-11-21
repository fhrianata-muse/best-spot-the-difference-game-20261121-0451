# BAR — the judging bar for Lantern & Lens

## How this entry is judged
An AI judge (**superbot / glm-5.3-flash**) compares entries **pairwise**. It
sees a **contact sheet** of the entry's screenshots and an **outline of the
source** (file names, sizes, first lines). It never runs the game. So the
screenshots must prove the game is complete, and the source outline must read
as a real, well-organised game.

## The criteria, in the judge's order
1. **Complete spot-the-difference, shown in the screenshots.** Two
   near-identical pictures side by side, markers on the differences already
   found, several differences still unfound, and a visible counter of how
   many remain. An entry that does not show this in its pictures loses to one
   that does.
2. **Fun and depth.** Differences that are fair but not obvious; sets that
   raise the difficulty; a hunt that stays fun after ten finds — more than
   one scene, more than one kind of difference (colour, missing, moved,
   extra), and a reason to keep looking.
3. **Feel and polish.** A mark that satisfies on each find; a hint that
   behaves (limited, costly, temporary); time pressure you can feel in the
   frame — a timer that is always visible and a game that can be lost.
4. **Look and originality.** Scenes worth studying, differences hidden by
   design inside busy, beautiful pictures, and one style that carries both
   panels and every scene. Nothing copied from a commercial game.
5. **Structure.** The source outline shows the game's own source split into
   files with one clear job each, named for what they do.

## Pass gate for this build
- **Every** screenshot shows the two panels side by side and the remaining
  counter — no title-screen-only shots.
- At least one screenshot shows markers on found differences with several
  still unfound (the game mid-hunt, not just won).
- Scorecard, each category scored 0–3 by self-review against the captures:

  | Category | What earns a 3 |
  |---|---|
  | Completeness | All 4 shots show side-by-side panels + counter; markers, timer, controls visible; one shot shows a cleared scene |
  | Depth | 3 scenes, 7/9/11 differences, mixed kinds, rising radii difficulty, 27 finds total |
  | Feel | Find pop + ring animation, hint pulse, miss feedback, countdown pressure, clear/fail overlays with stars |
  | Look | Layered hand-drawn scenes, one lantern-lit style across panels and scenes, differences hidden in busy detail |
  | Structure | game/src split into config / random / scenes / audio / render / input / shots / main, each one job, named for it |

- **Gate: every category ≥ 2 and the average ≥ 2.3.** Below that, fix and
  re-capture before submitting.
