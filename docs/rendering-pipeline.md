# Rendering Pipeline

## Draw Loop

`draw()` lives in `src/main.js`.

Current draw order:

1. Read current room.
2. Refresh world activity and camera.
3. Clear canvas.
4. Clip the playfield to `PLAY_W` by `H`.
5. Apply screen shake transform.
6. Draw the visible unified room through `withRoomView`.
7. Draw unified-room transient overlays/effects through `withRoomView`.
8. Restore playfield transform.
9. Draw sidebar, radio, notice, and pause overlay.
10. Draw alert overlay and room flash overlay.

This split is important:

- Playfield/world content is camera-transformed.
- Sidebar and screen overlays are not camera-transformed.
- Current transient arrays are still room-local.

## Visible Room Rendering

Playfield drawing still uses `visibleRooms()` for compatibility:

```js
visibleRooms().forEach((entry) => {
  withRoomView(entry.room, (visibleRoom) => {
    drawRoom(visibleRoom);
    visibleRoom.cameras?.forEach((camera) => drawCameraVision(visibleRoom, camera));
    visibleRoom.guards.forEach((guard) => drawVision(visibleRoom, guard));
    visibleRoom.walls.forEach((wall) => {
      if (rectVisibleInRoom(visibleRoom, wall)) drawWall(visibleRoom, wall);
    });
    visibleRoom.guards.forEach(drawGuard);
  });
});
```

Do not replace this with `rooms.forEach(drawRoom)`. That defeats camera-windowed rendering.

The playfield is clipped before this loop. This matters because rooms can now be larger than the viewport; large floors and walls must never draw over the sidebar.

## Current-Sector Transients

After the room draws, the current room draws transient tactical/effect layers:

- paw prints,
- objective marker,
- tactical route,
- guard forecasts,
- objective compass,
- whisker sense,
- noises,
- radio links,
- last-known marker,
- aim telegraphs,
- shots,
- guard speech bubbles,
- player,
- interaction prompts.

These arrays are currently local to the active room experience. If a future system needs persistent world-space effects, create a new data model rather than reusing these blindly.

## Guard Speech Bubbles

`drawGuardBarks()` lives in `src/render-actors.js`. It draws `guardBarks` in room-local coordinates above each speaking guard, so it must run inside the playfield camera transform before `drawPlayer()`.

The speech bubble render path is intentionally actor-local:

- `radioText` and `radioTimer` are not used.
- Text follows `bark.guard.x/y`.
- Bubble lifetime and cleanup are handled by `updateGuardBarks(dt)`, not render code.
- The bubble fades by reading `bark.ttl / bark.maxTtl`.

Do not move guard speech into `src/render-sidebar.js`; the sidebar radio callout is reserved for radio communication. If another actor type needs in-world speech later, add a more general actor speech model instead of overloading `radio()`.

## Render File Responsibilities

`src/render-environment.js`
: Low-level environment helpers: floor, wall, crate, vent, panel, alarm panel, camera body, shadow zone, prop, pickups, doors, sensor sweep.

`src/render-room.js`
: Composes the unified room: floor, overlays, props, shadows, cover, vents, panels, cameras, sweeps, walls, doors, pickups, catnips, tuna, lasers.

`src/render-actors.js`
: Sprites and actor-adjacent effects: cat, guard, animated sheets, shots, noises, paw prints, last-known marker.

`src/render-tactics.js`
: Tactical overlays: guard vision, camera vision, aim telegraphs, radio links, tactical routes, forecasts, objective marker, compass, whisker sense.

`src/render-player-ui.js`
: Player-specific visuals and facility map.

`src/render-sidebar.js`
: Canvas sidebar, status panels, notice, radio callout, pause overlay.

`src/main.js`
: Top-level draw orchestration.

## Canvas State Rules

Render functions may mutate `ctx`, but should be careful with:

- `ctx.globalAlpha`
- `ctx.lineWidth`
- `ctx.setLineDash`
- transforms
- fonts

If a function uses `ctx.save()`, it should normally call `ctx.restore()`.

Render functions should not mutate gameplay state. They can read state.

## Coordinate Rules

Room render functions draw in room-local coordinates. The caller is responsible for wrapping them:

```js
withRoomView(room, () => {
  drawRoom(room);
});
```

Screen-space UI functions draw after the playfield transform is restored.

Room-local coordinates are not limited to `PLAY_W` and `H`. Use `roomWidth(room)` and `roomHeight(room)` for authored room bounds. Use `PLAY_W` and `H` only when reasoning about the visible camera window.

Examples of room-local rendering:

- walls,
- guards,
- player,
- pickups,
- lasers,
- tactical overlays.

Examples of screen-space rendering:

- sidebar,
- notice,
- radio callout,
- pause overlay,
- full-screen alert flash.

## Facility Map

The facility map is drawn in `src/render-player-ui.js`.

It uses `facilityMapLayout`, not `authoredRoomPlacements`. This means the minimap is hand-authored separately from source-room placement.

If the world grows, consider deriving minimap layout from `authoredRoomPlacements`.

## Render Performance Rules

Follow these rules:

- Playfield draw loops should use `visibleRooms()`.
- Large-room loops should cull with `roomViewRect()` or `rectVisibleInRoom()`.
- Avoid all-room rendering except lightweight metadata views.
- Avoid expensive queries inside render functions.
- Tactical overlays should stay unified-room-focused unless designed otherwise.
- Do not draw offscreen transient effects.
- Keep render code visual-only.

## Adding Visuals

Choose the right file:

- new object drawing primitive: `render-environment.js`
- whole-room composition change: `render-room.js`
- actor/sprite change: `render-actors.js`
- tactical overlay: `render-tactics.js`
- sidebar/status UI: `render-sidebar.js`
- facility/player UI: `render-player-ui.js`

Choose coordinate space first:

- room-local: draw inside `withRoomView`,
- screen-space: draw after `ctx.restore()`,
- world/global: define a clear world-space data model before drawing.
