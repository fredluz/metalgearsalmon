"use strict";

const WORLD_SECTOR_W = PLAY_W;
const WORLD_SECTOR_H = H;
const HOT_SECTOR_GRAPH_DISTANCE = 0;
const WARM_SECTOR_GRAPH_DISTANCE = 1;
const SPATIAL_CELL = 128;

const roomPlacements = [
  { room: 0, col: 0, row: 1 },
  { room: 4, col: 1, row: 1 },
  { room: 1, col: 1, row: 0 },
  { room: 2, col: 2, row: 1 },
  { room: 3, col: 2, row: 0 },
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
    const placement = roomPlacements.find((candidate) => candidate.room === index) || { col: index, row: 0 };
    room.index = index;
    room.worldX = placement.col * WORLD_SECTOR_W;
    room.worldY = placement.row * WORLD_SECTOR_H;
    room.worldBounds = { x: room.worldX, y: room.worldY, w: WORLD_SECTOR_W, h: WORLD_SECTOR_H };
    room.walls.roomIndex = index;
    buildRoomSpatialIndex(room);
    world.sectors[index] = room;
  });

  world.w = Math.max(...rooms.map((room) => room.worldX + WORLD_SECTOR_W));
  world.h = Math.max(...rooms.map((room) => room.worldY + WORLD_SECTOR_H));
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
  return room.worldBounds || { x: room.worldX || 0, y: room.worldY || 0, w: WORLD_SECTOR_W, h: WORLD_SECTOR_H };
}

function roomIntersectsCamera(room, pad = 0) {
  const bounds = roomWorldRect(room);
  return rectsOverlap(
    { x: camera.x - pad, y: camera.y - pad, w: camera.w + pad * 2, h: camera.h + pad * 2 },
    bounds
  );
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
  camera.x = clamp(playerWorldX() - camera.w / 2, 0, Math.max(0, world.w - camera.w));
  camera.y = clamp(playerWorldY() - camera.h / 2, 0, Math.max(0, world.h - camera.h));
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
