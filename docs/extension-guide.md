# Extension Guide

## Before Editing

Check:

- which file owns the behavior,
- whether the change is authored data, simulation, render, or state,
- whether it is hot-sector-only, warm-sector, cold-sector, or global,
- whether reset logic needs updates,
- whether line counts stay under 500.

## Adding A Sector

1. Add a room object to `rooms` in `src/rooms.js`.
2. Add local geometry: `start`, `walls`, `doors`, and content.
3. Add placement in `roomPlacements` in `src/world.js`.
4. Add forward and reverse doors when AI/reinforcements need bidirectional routing.
5. Add minimap data to `facilityMapLayout` if the sector should appear in the sidebar map.
6. Confirm `baseGuardLayouts` clones new guard data correctly.
7. Run checks and a browser smoke test.

Common mistake: one-way door links. The player may move, but graph routing and reinforcements may fail.

## Adding A Door

Door fields:

```js
{
  x,
  y,
  w,
  h,
  to,
  need,
  label,
  approach,
  spawn,
  trigger
}
```

Rules:

- `to` is the destination room index.
- `need` is required tag count.
- `approach` helps objectives and AI.
- `spawn` controls destination player/guard placement.
- `trigger` overrides default player transition rectangle.

After adding doors, consider whether reverse connectivity is needed.

## Adding A Guard

1. Add guard data in a room:

```js
{
  x,
  y,
  route: [[x1, y1], [x2, y2]],
  i,
  speed
}
```

2. If new guard properties are needed, update `resetGuard`.
3. If the behavior needs new rendering, update `render-actors.js` or `render-tactics.js`.
4. If the behavior matters offscreen, add cheap approximation to `updateWarmRoom`.

Avoid per-frame pathfinding and global all-guard loops.

## Adding Enemy Behavior

Good flow:

1. Author config in `src/rooms.js` only if needed.
2. Initialize/reset fields in `src/state.js`.
3. Implement full hot-sector behavior in `src/ai.js`.
4. Add warm-sector approximation only if offscreen persistence matters.
5. Add visual feedback in render files.
6. Smoke test alert, reset, room transition, and pause.

If behavior crosses rooms, use the room graph for high-level routing and local pathfinding for one sector at a time.

## Adding A Pickup

1. Add room data in `src/rooms.js`.
2. Add mutable reset behavior in `resetRoomSystems`.
3. Add interaction in `interact()` or a helper called by `interact()`.
4. Add drawing in a render file.
5. Add prompt logic in `drawPrompts` if it uses `E`.
6. Update HUD/objective logic if the pickup affects progression.

Keep pickup checks current-sector-local unless the pickup is intentionally global.

## Adding A Player Verb

1. Add key handling in `src/main.js`.
2. Add cooldown/state fields to `player` in `src/state.js`.
3. Reset those fields in `reset`.
4. Implement the verb in `src/player-actions.js`.
5. Add visual/audio feedback through existing cue/notice systems.
6. Add rendering if needed.

Current input is physical-key based. Do not partially migrate to an action map unless you finish the input migration.

## Adding A Rendered Effect

Decide coordinate space first.

Current-sector-local:

- add a transient array in `src/core.js`,
- update it in a simulation file,
- draw it in the current room's `withRoomView` block.

Sector-authored:

- add data to room object,
- draw it in `drawRoom(room)`,
- make sure it only renders when visible.

Screen-space:

- draw after playfield transform is restored,
- usually in `render-sidebar.js` or `main.js`.

## Adding A New System File

When a system grows or a file approaches 500 lines:

1. Create `src/new-system-name.js` with `"use strict";`.
2. Move related functions only.
3. Add the file to `game.js` in dependency order.
4. Run syntax checks.
5. Run browser smoke test.

Naming:

- `render-*` for drawing-only code,
- `*-actions` for verbs,
- concrete domain names for systems.

Avoid vague catch-all files.

## Changing Reset Behavior

If new state persists across restart by accident, check:

- `reset()`
- `resetRoomSystems(room)`
- `resetGuard(guard)`
- transient arrays in `src/core.js`

Mutable room fields must be restored explicitly.

## Changing Performance-Sensitive Systems

Before adding a loop, ask:

- Does this run every frame?
- Does it scan all rooms?
- Does it scan all guards?
- Does it scan all walls?
- Can it use `visibleRooms()`, `activeRooms()`, or `queryRoomSpatial()`?

Prefer:

- tier filtering,
- graph routing,
- spatial query filtering,
- cached paths,
- timers instead of per-frame expensive checks.
