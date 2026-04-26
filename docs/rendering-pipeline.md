# Rendering Pipeline

## Draw Loop

`draw()` lives in `src/main.js`.

Current draw order:

1. Read current room.
2. Refresh world activity and camera.
3. Clear canvas.
4. Apply screen shake transform.
5. Draw visible sectors through `withRoomView`.
6. Draw current-sector transient overlays/effects through `withRoomView`.
7. Restore playfield transform.
8. Draw sidebar, radio, notice, and pause overlay.
9. Draw alert overlay and room flash overlay.

This split is important:

- Playfield/world content is camera-transformed.
- Sidebar and screen overlays are not camera-transformed.
- Current transient arrays are still room-local.

## Visible Sector Rendering

Playfield sector drawing uses:

```js
visibleRooms().forEach((entry) => {
  withRoomView(entry.room, (visibleRoom) => {
    drawRoom(visibleRoom);
    visibleRoom.cameras?.forEach(drawCameraVision);
    visibleRoom.guards.forEach((guard) => drawVision(guard));
    visibleRoom.walls.forEach((wall) => drawWall(visibleRoom, wall));
    visibleRoom.guards.forEach(drawGuard);
  });
});
```

Do not replace this with `rooms.forEach(drawRoom)`. That defeats camera-windowed rendering.

## Current-Sector Transients

After visible sectors draw, the current room draws transient tactical/effect layers:

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
- player,
- interaction prompts.

These arrays are currently local to the active room experience. If a future system needs persistent world-space effects, create a new data model rather than reusing these blindly.

## Render File Responsibilities

`src/render-environment.js`
: Low-level environment helpers: floor, wall, crate, vent, panel, alarm panel, camera body, shadow zone, prop, pickups, doors, sensor sweep.

`src/render-room.js`
: Composes a room/sector: floor, overlays, props, shadows, cover, vents, panels, cameras, sweeps, walls, doors, pickups, catnips, tuna, lasers.

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

It uses `facilityMapLayout`, not `roomPlacements`. This means the minimap is hand-authored separately from world placement.

If the world grows, consider moving minimap layout closer to `roomPlacements` or deriving it from sector placement.

## Render Performance Rules

Follow these rules:

- Playfield draw loops should use `visibleRooms()`.
- Avoid all-room rendering except lightweight metadata views.
- Avoid expensive queries inside render functions.
- Tactical overlays should stay current-sector-focused unless designed otherwise.
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
