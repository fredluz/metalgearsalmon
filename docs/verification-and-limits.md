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
- walking through former room boundaries does not change `player.room`,
- large-room camera follows and clamps,
- pause/resume works,
- browser console has no errors.

Useful automated expectations:

- `document.title === "Whisker Intrusion"`
- `document.getElementById("roomLabel").textContent` is nonempty
- `document.scripts` includes all expected `src/` files
- canvas has nonblack pixels
- `rooms.length === 1`
- `rooms[0].name === "Kennel Block"`
- `rooms[0].guards.length` includes all authored guards
- camera pans across former room boundaries without a cut
- no `pageerror` events
- no console errors

## Line Count Rule

Source files should stay under 500 lines.

This is a hard maintainability rule for JS source. Split files by responsibility before they get large.

Docs may be longer when needed, but prefer focused files in `docs/` over one huge document.

## Known Limitations

Current expected limitations:

- The playable facility is one large room.
- Current transient arrays are unified-room-local.
- The minimap is hand-authored through `facilityMapLayout`.
- There is no formal test suite.
- There is no save schema beyond best-run localStorage.
- Classic script globals make load order important.
- Warm simulation is intentionally abstract, not physically accurate.

Do not treat these as bugs unless the task specifically targets them.

## Recommended Next Architecture Steps

For the unified facility:

1. Separate transient effects from future persistent world event objects.
2. Add debug overlay for camera bounds, gates, and spatial cells.
3. Derive or co-locate minimap layout with world placement.
4. Add a small smoke test script for load, movement, gate collision, guard movement, and no console errors.
5. Consider an explicit input action map once gameplay verbs grow.

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
- adding fake room transitions for normal traversal.

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
- verify camera transform did not move the unified room offscreen.

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
