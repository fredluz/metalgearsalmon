# Runtime And File Layout

## Runtime Model

Whisker Intrusion is a static browser game. It can be served with a simple HTTP server and does not require a build step.

`index.html` owns the page shell:

- DOM HUD above the canvas,
- the `canvas#game`,
- controls text,
- build badge,
- script injection for `game.js`.

`game.js` is an ordered script loader. It should stay small. Do not put gameplay code in it.

The source files in `src/` are classic browser scripts, not ES modules. They share top-level declarations through load order.

## Script Load Order

`game.js` loads the runtime in this order:

1. `src/core.js`
2. `src/rooms.js`
3. `src/world.js`
4. `src/state.js`
5. `src/objectives.js`
6. `src/navigation.js`
7. `src/alerts.js`
8. `src/player-actions.js`
9. `src/ai.js`
10. `src/update.js`
11. `src/render-environment.js`
12. `src/render-room.js`
13. `src/render-actors.js`
14. `src/render-tactics.js`
15. `src/render-player-ui.js`
16. `src/render-sidebar.js`
17. `src/main.js`

If a file references a symbol from another file, the provider must load first. Reordering the loader is a runtime change and needs a browser smoke test.

## Classic Script Rules

The current code intentionally uses classic script globals.

Follow these rules:

- Do not add `import` or `export` to one file in isolation.
- Do not wrap one `src/` file in an IIFE unless downstream symbols are explicitly exposed.
- Avoid duplicate top-level names.
- Keep new globals domain-specific and descriptive.
- Add new files to `game.js` in dependency order.

A future ES module conversion is possible, but it should be done as one coherent migration.

## Top-Level Files

`index.html`
: HTML shell, DOM HUD, canvas, controls, build badge, and dynamic script/style cache busting.

`styles.css`
: Page and DOM HUD styling. It does not style the in-canvas sidebar.

`game.js`
: Ordered loader for `src/` files.

`src/*.js`
: Runtime code.

`assets/*.png`
: Sprite sheets.

`docs/`
: Architecture and contributor docs.

## Source File Responsibilities

`src/core.js`
: DOM handles, canvas constants, global arrays, sprite loading, and small utilities.

`src/rooms.js`
: Authored source room data plus the merge step that creates the single `Kennel Block` gameplay room. This is where maps live.

`src/world.js`
: Unified-room camera, visible-room query compatibility, and spatial indexes.

`src/state.js`
: Player state, mission state, reset logic, ranking, best-run persistence.

`src/objectives.js`
: Objective helpers, door helpers, stealth helpers, audio/notice helpers, and DOM HUD updates.

`src/navigation.js`
: Collision, line-of-sight, guard pathfinding, guard movement.

`src/alerts.js`
: Noise, last-known-position, caught state, alarms, reinforcements, extraction, mission completion.

`src/player-actions.js`
: Player verbs and nearby interactive systems.

`src/ai.js`
: Guard vision, camera vision, sensor sweeps, and full unified-room AI.

`src/update.js`
: Main gameplay frame and interaction/transition orchestration.

`src/render-environment.js`
: Low-level map/environment drawing helpers.

`src/render-room.js`
: Composes the unified room from environment helpers.

`src/render-actors.js`
: Player, guards, sprites, shots, noises, paw prints, last-known markers.

`src/render-tactics.js`
: Tactical overlays: vision cones, routes, forecasts, objective markers, compass, whisker sense.

`src/render-player-ui.js`
: Player visuals and facility map.

`src/render-sidebar.js`
: Canvas sidebar, notice, radio callout, pause overlay, side boxes.

`src/main.js`
: Draw loop, keyboard input, startup reset, `requestAnimationFrame`.

## Authored Room Data

`src/rooms.js` exports-by-global:

```js
const rooms = [ ... ];
```

Source rooms are authored in readable room-local coordinates:

```js
{
  name,
  width,
  height,
  floor,
  wall,
  trim,
  start,
  doors,
  keycard,
  tuna,
  intel,
  briefings,
  rations,
  catnipPickups,
  hiding,
  shadows,
  vents,
  props,
  cameras,
  panels,
  alarm,
  sweeps,
  walls,
  lasers,
  guards
}
```

`mergeAuthoredRooms()` offsets those source rooms into one large `rooms[0]` object. Runtime systems should treat `rooms[0]` as the playable map.

`width` and `height` are optional on source rooms. If omitted, a source room defaults to the visible playfield size. Systems that need runtime bounds should use `roomWidth(room)` and `roomHeight(room)`.

Important supporting globals:

- `START_ROOM`
- `FINAL_ROOM`
- `REQUIRED_TAGS`
- `baseGuardLayouts`
- `facilityMapLayout`

`baseGuardLayouts` is used by reset logic. If guard authoring changes, confirm reset cloning still preserves the right baseline.
