# Verification And Known Limits

## Required Checks

Run after structural changes:

```sh
node --check game.js
for f in src/*.js; do node --check "$f" || exit 1; done
wc -l game.js src/*.js | sort -nr | head -20
```

Serve locally:

```sh
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

## Browser Smoke Test

Check:

- the page loads,
- all expected `src/` scripts load,
- the canvas is nonblank,
- the HUD shows a room name,
- movement works,
- interaction still works,
- door transition still works,
- pause/resume works,
- browser console has no errors.

Useful automated expectations:

- `document.title === "Whisker Intrusion"`
- `document.getElementById("roomLabel").textContent` is nonempty
- `document.scripts` includes all expected `src/` files
- canvas has nonblack pixels
- no `pageerror` events
- no console errors

## Line Count Rule

Source files should stay under 500 lines.

This is a hard maintainability rule for JS source. Split files by responsibility before they get large.

Docs may be longer when needed, but prefer focused files in `docs/` over one huge document.

## Known Limitations

Current expected limitations:

- Door traversal is still teleport-based through `changeRoom`.
- Most gameplay state is room-local.
- Current transient arrays are current-sector-local.
- The minimap is hand-authored through `facilityMapLayout`.
- There is no formal test suite.
- There is no save schema beyond best-run localStorage.
- Classic script globals make load order important.
- Warm simulation is intentionally abstract, not physically accurate.

Do not treat these as bugs unless the task specifically targets them.

## Recommended Next Architecture Steps

For MSX-style connected sectors:

1. Add a sector-boundary transition layer before removing `changeRoom`.
2. Separate current-sector transient effects from future world-space effects.
3. Add debug overlay for camera bounds, visible sectors, and sim tiers.
4. Derive or co-locate minimap layout with world placement.
5. Add a small smoke test script for load, movement, transition, and no console errors.
6. Consider an explicit input action map once gameplay verbs grow.

## Anti-Patterns

Avoid:

- putting gameplay back into `game.js`,
- adding new giant files,
- converting one script to an ES module in isolation,
- rendering every room every frame,
- full-updating every guard every frame,
- scanning all walls for line-of-sight,
- running pathfinding every frame,
- putting authored map data into render files,
- making render functions mutate simulation state,
- adding mutable room state without reset logic,
- hardcoding new room indexes across many files,
- adding cross-sector behavior without graph/tier thinking.

## Common Failure Modes

Script load error:

- check `game.js` order,
- check filename spelling,
- check browser network panel.

`ReferenceError` on startup:

- provider file loads too late,
- symbol was renamed,
- file was accidentally wrapped and no longer exposes a global.

Canvas is blank:

- check console errors,
- verify `src/main.js` loaded,
- verify `reset()` and `requestAnimationFrame(loop)` ran,
- verify camera transform did not move all visible sectors offscreen.

Collision feels wrong:

- check `blocked`,
- check `guardBlocked`,
- check spatial index rebuild if geometry changed,
- check door block rectangles.

Guards behave offscreen too expensively:

- ensure full logic is not running outside `rooms[player.room]`,
- inspect `updateOffscreenReinforcements`,
- inspect `updateWarmRoom`.

State persists after reset:

- update `reset`,
- update `resetRoomSystems`,
- update `resetGuard`,
- clear new transient arrays.
