"use strict";

const WORLD_SECTOR_W = PLAY_W;
const WORLD_SECTOR_H = H;
const HOT_SECTOR_GRAPH_DISTANCE = 0;
const WARM_SECTOR_GRAPH_DISTANCE = 1;
const SPATIAL_CELL = 128;
const EDGE_DOOR_TOLERANCE = 40;
const SEAM_TRANSFER_INSET = 19;

const roomPlacements = typeof authoredRoomPlacements !== "undefined" ? authoredRoomPlacements : [
  { room: 0, col: 0, row: 0 },
];

const camera = {
  x: 0,
  y: 0,
  w: PLAY_W,
  h: H,
};

const world = {
  w: WORLD_SECTOR_W * 3,
  h: WORLD_SECTOR_H * 2,
  sectors: [],
  active: [],
};

function initializeWorld() {
  rooms.forEach((room, index) => {
    const placement = room.unified
      ? { x: 0, y: 0 }
      : roomPlacements.find((candidate) => candidate.room === index) || { col: index, row: 0 };
    room.index = index;
    room.width = roomWidth(room);
    room.height = roomHeight(room);
    room.worldX = Number.isFinite(placement.x) ? placement.x : placement.col * WORLD_SECTOR_W;
    room.worldY = Number.isFinite(placement.y) ? placement.y : placement.row * WORLD_SECTOR_H;
    room.worldBounds = { x: room.worldX, y: room.worldY, w: room.width, h: room.height };
    room.walls.roomIndex = index;
    (room.doors || []).forEach((door) => { door.roomIndex = index; });
    buildRoomSpatialIndex(room);
    world.sectors[index] = room;
  });

  world.w = Math.max(...rooms.map((room) => room.worldX + roomWidth(room)));
  world.h = Math.max(...rooms.map((room) => room.worldY + roomHeight(room)));
}

function roomWidth(room) {
  return room?.width || PLAY_W;
}

function roomHeight(room) {
  return room?.height || H;
}

function roomLocalRect(room) {
  return { x: 0, y: 0, w: roomWidth(room), h: roomHeight(room) };
}

function roomViewRect(room, pad = 0) {
  return {
    x: camera.x - (room.worldX || 0) - pad,
    y: camera.y - (room.worldY || 0) - pad,
    w: camera.w + pad * 2,
    h: camera.h + pad * 2,
  };
}

function rectVisibleInRoom(room, rect, pad = 32) {
  return rectsOverlap(roomViewRect(room, pad), rect);
}

function spatialCellRange(rect) {
  return {
    minX: Math.floor(rect.x / SPATIAL_CELL),
    maxX: Math.floor((rect.x + rect.w) / SPATIAL_CELL),
    minY: Math.floor(rect.y / SPATIAL_CELL),
    maxY: Math.floor((rect.y + rect.h) / SPATIAL_CELL),
  };
}

function spatialKey(x, y) {
  return `${x}:${y}`;
}

function insertSpatialRect(index, kind, rect) {
  const range = spatialCellRange(rect);
  for (let cy = range.minY; cy <= range.maxY; cy += 1) {
    for (let cx = range.minX; cx <= range.maxX; cx += 1) {
      const key = spatialKey(cx, cy);
      if (!index[kind].has(key)) index[kind].set(key, []);
      index[kind].get(key).push(rect);
    }
  }
}

function buildRoomSpatialIndex(room) {
  const index = {
    walls: new Map(),
    doors: new Map(),
  };
  room.walls.forEach((wall) => insertSpatialRect(index, "walls", wall));
  (room.doors || []).forEach((door) => insertSpatialRect(index, "doors", door));
  room.spatial = index;
}

function queryRoomSpatial(room, kind, rect) {
  if (!room.spatial) buildRoomSpatialIndex(room);
  const bucket = room.spatial[kind];
  if (!bucket) return [];
  const range = spatialCellRange(rect);
  const results = [];
  const seen = new Set();
  for (let cy = range.minY; cy <= range.maxY; cy += 1) {
    for (let cx = range.minX; cx <= range.maxX; cx += 1) {
      (bucket.get(spatialKey(cx, cy)) || []).forEach((item) => {
        if (seen.has(item)) return;
        seen.add(item);
        if (rectsOverlap(rect, item)) results.push(item);
      });
    }
  }
  return results;
}

function queryWallsForLine(walls, ax, ay, bx, by) {
  const roomIndex = walls.roomIndex;
  if (!Number.isFinite(roomIndex)) return walls;
  const room = rooms[roomIndex];
  return queryRoomSpatial(room, "walls", {
    x: Math.min(ax, bx) - 4,
    y: Math.min(ay, by) - 4,
    w: Math.abs(bx - ax) + 8,
    h: Math.abs(by - ay) + 8,
  });
}

function roomWorldRect(room) {
  return room.worldBounds || { x: room.worldX || 0, y: room.worldY || 0, w: roomWidth(room), h: roomHeight(room) };
}

function roomIntersectsCamera(room, pad = 0) {
  const bounds = roomWorldRect(room);
  return rectsOverlap(
    { x: camera.x - pad, y: camera.y - pad, w: camera.w + pad * 2, h: camera.h + pad * 2 },
    bounds
  );
}

function roomLocalToWorld(room, x, y) {
  return {
    x: (room.worldX || 0) + x,
    y: (room.worldY || 0) + y,
  };
}

function worldToRoomLocal(room, x, y) {
  return {
    x: x - (room.worldX || 0),
    y: y - (room.worldY || 0),
  };
}

function doorSide(room, door) {
  if (door.x <= EDGE_DOOR_TOLERANCE) return "left";
  if (door.x + door.w >= roomWidth(room) - EDGE_DOOR_TOLERANCE) return "right";
  if (door.y <= EDGE_DOOR_TOLERANCE) return "top";
  if (door.y + door.h >= roomHeight(room) - EDGE_DOOR_TOLERANCE) return "bottom";
  return "inside";
}

function oppositeSide(side) {
  return { left: "right", right: "left", top: "bottom", bottom: "top" }[side] || "inside";
}

function reverseDoorFor(door) {
  const target = rooms[door.to];
  return (target.doors || []).find((candidate) => candidate.to === door.roomIndex) || null;
}

function crossingDoorAt(room, localX, localY) {
  const pad = player.r + 14;
  return (room.doors || []).find((door) => {
    if (!doorUnlocked(door)) return false;
    const side = doorSide(room, door);
    if (side === "right") return localX > roomWidth(room) - player.r && localY >= door.y - pad && localY <= door.y + door.h + pad;
    if (side === "left") return localX < player.r && localY >= door.y - pad && localY <= door.y + door.h + pad;
    if (side === "top") return localY < player.r && localX >= door.x - pad && localX <= door.x + door.w + pad;
    if (side === "bottom") return localY > roomHeight(room) - player.r && localX >= door.x - pad && localX <= door.x + door.w + pad;
    return false;
  });
}

function transferPointForDoor(fromRoom, door, localX, localY) {
  const target = rooms[door.to];
  const sourceSide = doorSide(fromRoom, door);
  const targetDoor = reverseDoorFor(door);
  const targetSide = targetDoor ? doorSide(target, targetDoor) : oppositeSide(sourceSide);
  const worldPoint = roomLocalToWorld(fromRoom, localX, localY);
  const next = worldToRoomLocal(target, worldPoint.x, worldPoint.y);

  if (targetSide === "left") {
    next.x = SEAM_TRANSFER_INSET;
    if (targetDoor) next.y = clamp(next.y, targetDoor.y + player.r, targetDoor.y + targetDoor.h - player.r);
  } else if (targetSide === "right") {
    next.x = roomWidth(target) - SEAM_TRANSFER_INSET;
    if (targetDoor) next.y = clamp(next.y, targetDoor.y + player.r, targetDoor.y + targetDoor.h - player.r);
  } else if (targetSide === "top") {
    next.y = SEAM_TRANSFER_INSET;
    if (targetDoor) next.x = clamp(next.x, targetDoor.x + player.r, targetDoor.x + targetDoor.w - player.r);
  } else if (targetSide === "bottom") {
    next.y = roomHeight(target) - SEAM_TRANSFER_INSET;
    if (targetDoor) next.x = clamp(next.x, targetDoor.x + player.r, targetDoor.x + targetDoor.w - player.r);
  }

  next.x = clamp(next.x, player.r, roomWidth(target) - player.r);
  next.y = clamp(next.y, player.r, roomHeight(target) - player.r);
  return next;
}

function clearSectorTransients() {
  noises.length = 0;
  shots.length = 0;
  pawPrints.length = 0;
  catnips.length = 0;
  ventRattles.length = 0;
  tacticalPings.length = 0;
  guardBarks.length = 0;
}

function enterRoomSeamlessly(door, localX, localY) {
  const fromRoom = rooms[player.room];
  const next = transferPointForDoor(fromRoom, door, localX, localY);
  player.room = door.to;
  player.x = next.x;
  player.y = next.y;
  player.entryGrace = Math.max(player.entryGrace, 0.35);
  player.doorCooldown = 0.18;
  player.ventHidden = 0;
  clearSectorTransients();
  if (alert <= 0) {
    alertReason = "";
    lastKnown = null;
    sweepTimer = 0;
  }
  roomTime = 0;
  briefingIndex = 0;
  directorTimer = patrolShiftDelay();
  return true;
}

function tryPlayerSectorTransfer(localX, localY) {
  const room = rooms[player.room];
  const door = crossingDoorAt(room, localX, localY);
  return door ? enterRoomSeamlessly(door, localX, localY) : false;
}

function roomGraphNeighbors(roomIndex) {
  const neighbors = new Set();
  roomDoors(rooms[roomIndex]).forEach((door) => neighbors.add(door.to));
  rooms.forEach((room, index) => {
    if (roomDoors(room).some((door) => door.to === roomIndex)) neighbors.add(index);
  });
  return [...neighbors];
}

function roomGraphDistance(fromRoom, toRoom) {
  if (fromRoom === toRoom) return 0;
  const queue = [{ room: fromRoom, distance: 0 }];
  const visited = new Set([fromRoom]);
  while (queue.length) {
    const current = queue.shift();
    for (const neighbor of roomGraphNeighbors(current.room)) {
      if (visited.has(neighbor)) continue;
      const distance = current.distance + 1;
      if (neighbor === toRoom) return distance;
      visited.add(neighbor);
      queue.push({ room: neighbor, distance });
    }
  }
  return Infinity;
}

function sectorTier(roomIndex) {
  if (roomIndex === player.room) return "hot";
  const distance = roomGraphDistance(player.room, roomIndex);
  if (distance <= HOT_SECTOR_GRAPH_DISTANCE) return "hot";
  if (distance <= WARM_SECTOR_GRAPH_DISTANCE) return "warm";
  return "cold";
}

function refreshWorldActivity() {
  updateCamera();
  world.active = rooms.map((room, index) => ({
    room,
    index,
    tier: sectorTier(index),
    visible: roomIntersectsCamera(room, 80),
  }));
}

function activeRooms(tier = "hot") {
  const tiers = tier === "hot" ? ["hot"] : tier === "warm" ? ["hot", "warm"] : ["hot", "warm", "cold"];
  return world.active.filter((entry) => tiers.includes(entry.tier));
}

function visibleRooms() {
  return world.active.filter((entry) => entry.visible);
}

function playerWorldX() {
  return (rooms[player.room].worldX || 0) + player.x;
}

function playerWorldY() {
  return (rooms[player.room].worldY || 0) + player.y;
}

function updateCamera() {
  const xBounds = cameraAxisBounds("x");
  const yBounds = cameraAxisBounds("y");
  camera.x = viewAxis(playerWorldX(), xBounds.min, xBounds.max - xBounds.min, camera.w);
  camera.y = viewAxis(playerWorldY(), yBounds.min, yBounds.max - yBounds.min, camera.h);
}

function viewAxis(target, min, size, viewportSize) {
  if (size <= viewportSize) return min;
  return clamp(target - viewportSize / 2, min, min + size - viewportSize);
}

function rangesTouchOrOverlap(aMin, aMax, bMin, bMax) {
  return aMin <= bMax && aMax >= bMin;
}

function cameraAxisBounds(axis) {
  const current = roomWorldRect(rooms[player.room]);
  const horizontal = axis === "x";
  let min = horizontal ? current.x : current.y;
  let max = horizontal ? current.x + current.w : current.y + current.h;
  const spanMin = horizontal ? current.y : current.x;
  const spanMax = horizontal ? current.y + current.h : current.x + current.w;
  let changed = true;

  while (changed) {
    changed = false;
    rooms.forEach((room) => {
      const bounds = roomWorldRect(room);
      const roomMin = horizontal ? bounds.x : bounds.y;
      const roomMax = horizontal ? bounds.x + bounds.w : bounds.y + bounds.h;
      const roomSpanMin = horizontal ? bounds.y : bounds.x;
      const roomSpanMax = horizontal ? bounds.y + bounds.h : bounds.x + bounds.w;
      if (!rangesTouchOrOverlap(spanMin, spanMax, roomSpanMin, roomSpanMax)) return;
      if (!rangesTouchOrOverlap(min, max, roomMin, roomMax)) return;
      const nextMin = Math.min(min, roomMin);
      const nextMax = Math.max(max, roomMax);
      if (nextMin !== min || nextMax !== max) {
        min = nextMin;
        max = nextMax;
        changed = true;
      }
    });
  }

  return { min, max };
}

function withRoomView(room, drawFn) {
  ctx.save();
  ctx.translate((room.worldX || 0) - camera.x, (room.worldY || 0) - camera.y);
  drawFn(room);
  ctx.restore();
}

function setRoomSimulationTier(room, tier) {
  room.simTier = tier;
  room.guards.forEach((guard) => {
    guard.simTier = tier;
  });
}

function prepareSectorSimulation() {
  refreshWorldActivity();
  world.active.forEach((entry) => setRoomSimulationTier(entry.room, entry.tier));
}

initializeWorld();
