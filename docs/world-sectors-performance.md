# World, Sectors, And Performance

## Mental Model

Rooms are authored as discrete sectors, then placed into a larger world by `src/world.js`.

The game currently keeps gameplay in room-local coordinates:

```js
player.x
player.y
guard.x
guard.y
wall.x
wall.y
```

The world layer adds placement and camera state:

```js
room.worldX
room.worldY
camera.x
camera.y
```

This lets rendering behave like a larger connected map without requiring every gameplay system to be rewritten to global coordinates at once.

## Room Placement

`roomPlacements` in `src/world.js` maps room indexes onto a grid:

```js
const roomPlacements = [
  { room: 0, col: 0, row: 1 },
  { room: 4, col: 1, row: 1 },
  { room: 1, col: 1, row: 0 },
  { room: 2, col: 2, row: 1 },
  { room: 3, col: 2, row: 0 },
];
```

During `initializeWorld()`, each room receives:

- `room.index`
- `room.worldX`
- `room.worldY`
- `room.worldBounds`
- `room.spatial`

If a new room is added to `src/rooms.js`, add it to `roomPlacements`.

## Camera

The camera is world-space:

```js
const camera = {
  x: 0,
  y: 0,
  w: PLAY_W,
  h: H
};
```

Player world position is computed from the current room placement:

```js
playerWorldX() = rooms[player.room].worldX + player.x
playerWorldY() = rooms[player.room].worldY + player.y
```

`updateCamera()` centers the camera on the player and clamps it to world bounds.

Rendering should use:

```js
withRoomView(room, () => {
  drawRoom(room);
});
```

Inside the callback, draw functions still use room-local coordinates. The canvas transform handles world/camera offset.

## Activity Records

`refreshWorldActivity()` builds `world.active`, one record per room:

```js
{
  room,
  index,
  tier: "hot" | "warm" | "cold",
  visible
}
```

Use:

- `visibleRooms()` for playfield rendering,
- `activeRooms("hot")` for current full-simulation sector,
- `activeRooms("warm")` for hot plus warm sectors.

## Simulation Tiers

The game must not fully simulate every sector every frame.

Current tier policy:

- `hot`: current room only.
- `warm`: directly connected neighboring rooms.
- `cold`: all other rooms.

Constants:

```js
const HOT_SECTOR_GRAPH_DISTANCE = 0;
const WARM_SECTOR_GRAPH_DISTANCE = 1;
```

`prepareSectorSimulation()` refreshes world activity and assigns:

```js
room.simTier
guard.simTier
```

Rules:

- Full guard AI belongs in hot sectors only.
- Warm sectors may decay timers, cooldowns, suspicion, and reinforcement state.
- Cold sectors should not run per-frame simulation.

Increase warm range only with a clear reason.

## Door Graph

Room connectivity comes from `doors`.

`roomGraphNeighbors(roomIndex)` reads:

- outgoing doors from the room,
- reverse doors from other rooms that point back.

This graph supports tiering and cross-sector decisions. Cross-sector AI should use this graph first, then local pathfinding inside one sector.

## Spatial Index

Every room gets a fixed-cell spatial index:

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

- Do not render every sector every frame.
- Do not full-update every guard every frame.
- Do not pathfind every frame.
- Do not line-of-sight check against all walls.
- Do not make warm/cold sectors run player-facing AI.
- Do not put expensive unfiltered queries inside render functions.

Preferred patterns:

- draw playfield content through `visibleRooms()`,
- run full simulation only for `rooms[player.room]`,
- run abstract background simulation through `activeRooms("warm")`,
- use room graph routing for cross-sector behavior,
- use spatial queries for geometry,
- cache pathfinding and repath only on target changes or stuck state.

## Current Limits

The world layer is a foundation, not a complete seamless traversal rewrite.

Current limitations:

- `player.room` is still the primary gameplay room.
- Doors still call `changeRoom(door)`.
- Transient arrays are current-sector-local.
- Room object coordinates are still local, not global.

This is deliberate. It gives camera/windowing and performance boundaries before the harder traversal refactor.
