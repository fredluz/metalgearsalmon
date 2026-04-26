# Unified World And Performance

## Mental Model

`src/rooms.js` still keeps the original room authoring readable, but the runtime no longer plays them as separate rooms.

At load time, `mergeAuthoredRooms()` converts the authored room list into one large gameplay room:

```js
rooms.length === 1
rooms[0].name === "Kennel Block"
```

All gameplay coordinates are now local to that single large room:

```js
player.x
player.y
guard.x
guard.y
wall.x
wall.y
```

That removes room-transition cuts. Moving from the kennel into the hall is just movement across a larger coordinate space.

## Source Room Placement

The source rooms are offset by `authoredRoomPlacements` in `src/rooms.js` before being merged:

```js
const authoredRoomPlacements = [
  { room: 0, col: 0, row: 1 },
  { room: 4, col: 1, row: 1 },
  { room: 1, col: 1, row: 0 },
  { room: 2, col: 3, row: 1 },
  { room: 3, col: 4, row: 1 },
];
```

Room 4, Service Hall, is authored at `PLAY_W * 2` width. The merge step preserves that larger span.

The merged room receives:

- one `start`,
- one `width` and `height`,
- combined `walls`,
- combined `doors`,
- combined `guards`,
- combined pickups and hazards,
- combined cameras, panels, sweeps, and lasers.

## Camera

The camera follows the player inside the unified room:

```js
const camera = {
  x: 0,
  y: 0,
  w: PLAY_W,
  h: H
};
```

`updateCamera()` centers on `playerWorldX()` and `playerWorldY()` where possible, then clamps to the unified room bounds.

Expected behavior:

- no camera cut when crossing former room boundaries,
- player is centered in open middle areas,
- camera pins near outer map edges,
- no blank space beyond the unified room bounds.

## Doors And Gates

Doors are now gates inside the single room.

Important behavior:

- unlocked doors do not teleport,
- locked doors still block collision through `doorBlockRect(door)`,
- locked doors still show tag requirement feedback through `doorTriggerRect(door)`,
- `spawn` remains for legacy guard reinforcement helpers, not player movement.

Do not reintroduce player room teleporting for normal map traversal.

## Activity Records

`refreshWorldActivity()` still builds `world.active`, but in the unified map it contains only the single room.

This keeps the render/update code shape stable:

```js
visibleRooms().forEach((entry) => {
  withRoomView(entry.room, drawRoom);
});
```

The old hot/warm/cold tier helpers remain for compatibility, but all active guard gameplay is now in `rooms[0]`.

## Spatial Index

The unified room gets a fixed-cell spatial index:

```js
room.spatial = {
  walls: Map,
  doors: Map
};
```

Cell size:

```js
const SPATIAL_CELL = 128;
```

Indexed geometry:

- static `walls`,
- static `doors`.

Query helpers:

```js
queryRoomSpatial(room, "walls", rect)
queryRoomSpatial(room, "doors", rect)
queryWallsForLine(walls, ax, ay, bx, by)
```

`navigation.js` uses these helpers for player collision, guard collision, and line-of-sight.

If static geometry changes at runtime, rebuild:

```js
buildRoomSpatialIndex(room);
```

Mutable gameplay state like pickups, guards, cameras, alarms, and panels is not currently spatially indexed.

## Performance Rules

Hard rules:

- Do not scan every wall directly for collision or line-of-sight.
- Do not pathfind every frame.
- Do not put expensive unfiltered queries inside render functions.
- Do not re-split gameplay into hidden inactive rooms just to save work.

Preferred patterns:

- draw playfield content through `visibleRooms()`,
- run guard AI against `rooms[player.room]`,
- use spatial queries for geometry,
- cache pathfinding and repath only on target changes or stuck state,
- cull large-room rendering with `roomViewRect()` and `rectVisibleInRoom()`.

## Current Limits

Current expected limitations:

- The minimap is still hand-authored through `facilityMapLayout`.
- Some systems still use old room/gate vocabulary for compatibility.
- Transient arrays are unified-room-local, not true world event objects.
- `FINAL_ROOM` remains a legacy constant, but normal progression now uses keycards and tuna inside the unified room.

These are not bugs unless the task targets them directly.
