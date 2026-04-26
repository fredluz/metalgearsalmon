# Extension Guide

## Before Editing

Check:

- which file owns the behavior,
- whether the change is authored data, simulation, render, or state,
- whether it belongs in authored source-room data or runtime unified-room logic,
- whether reset logic needs updates,
- whether line counts stay under 500.

## Adding Source Room Content

1. Add or edit a source room object in `src/rooms.js`.
2. Add local geometry: `start`, `walls`, `doors`, and content.
3. Add placement in `authoredRoomPlacements` in `src/rooms.js`.
4. Add gates when progression needs locked boundaries.
5. Add minimap data to `facilityMapLayout` if needed.
6. Confirm `baseGuardLayouts` clones new guard data correctly.
7. Run checks and a browser smoke test.

Common mistake: adding runtime-only coordinates by hand. Keep source-room content local and let `mergeAuthoredRooms()` offset it.

## Adding A Larger Room

Rooms can be larger than the visible playfield.

1. Add `width` and/or `height` to the room object.
2. Use `roomWidth(room)` and `roomHeight(room)` in systems that need boundaries.
3. Put boundary walls at the actual room dimensions.
4. Put edge doors on the actual room edge, not at `PLAY_W` unless the room is exactly one screen wide.
5. Keep props, guards, vents, panels, pickups, and routes in room-local coordinates.
6. Update `authoredRoomPlacements` so the larger source room lands in the intended unified-map location.
7. Browser-test camera behavior at left/top edge, middle, and right/bottom edge.

Expected camera behavior:

- edge of room: player is off-center and the camera is pinned,
- middle of room: player is centered or close to centered,
- far edge: camera clamps before showing blank space beyond walls.

Do not convert a large room to world coordinates internally. The current architecture still expects room-local simulation coordinates.

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
- `spawn` controls guard reinforcement placement, not normal player traversal.
- `trigger` is only used for locked-door feedback and special interaction zones.

After adding doors, consider whether reverse connectivity is needed.

For unified-map traversal:

- unlocked doors should behave like open gates,
- locked doors should block through `doorBlockRect(door)`,
- wall gaps must line up with gates,
- do not reintroduce trigger-based player teleporting.

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
3. Implement full behavior in `src/ai.js`.
4. Add timers/cooldowns only if persistence matters.
5. Add visual feedback in render files.
6. Smoke test alert, reset, room transition, and pause.

The runtime map is one room, so avoid cross-room special cases unless you are editing source-room authoring.

## Adding A Pickup

1. Add room data in `src/rooms.js`.
2. Add mutable reset behavior in `resetRoomSystems`.
3. Add interaction in `interact()` or a helper called by `interact()`.
4. Add drawing in a render file.
5. Add prompt logic in `drawPrompts` if it uses `E`.
6. Update HUD/objective logic if the pickup affects progression.

Pickup checks run in the unified room. Use arrays for repeated pickup types.

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

Unified-room-local:

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
- In a large room, can it cull to `roomViewRect()` or `rectVisibleInRoom()`?

Prefer:

- tier filtering,
- graph routing,
- spatial query filtering,
- cached paths,
- timers instead of per-frame expensive checks.
