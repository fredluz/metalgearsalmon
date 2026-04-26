"use strict";

function drawCardboardBox(x, y) {
  const bob = player.moving ? Math.round(Math.sin(performance.now() / 90) * 1) : 0;
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(x - 24, y + 10, 48, 8);
  ctx.fillStyle = "#7c6238";
  ctx.fillRect(x - 23, y - 24 + bob, 46, 38);
  ctx.fillStyle = "#a4824a";
  ctx.fillRect(x - 19, y - 20 + bob, 38, 30);
  ctx.fillStyle = "#5b4528";
  ctx.fillRect(x - 21, y - 11 + bob, 42, 4);
  ctx.fillRect(x - 3, y - 22 + bob, 6, 34);
  ctx.fillStyle = "#d0a45a";
  ctx.fillRect(x - 17, y - 18 + bob, 10, 4);
  ctx.fillRect(x + 8, y + 4 + bob, 8, 3);
  ctx.fillStyle = "#111514";
  ctx.fillRect(x - 10, y - 5 + bob, 20, 4);
  ctx.fillStyle = player.hidden ? "#7ed6c8" : "#ffd65a";
  ctx.fillRect(x - 7, y - 4 + bob, 3, 2);
  ctx.fillRect(x + 4, y - 4 + bob, 3, 2);
  const suspicious = player.moving || !nearPlausibleBoxSpot(rooms[player.room]);
  ctx.strokeStyle = boxCompromised(rooms[player.room]) ? "#f35d4c" : suspicious ? "#ffd65a" : "#111514";
  ctx.strokeRect(x - 23.5, y - 24.5 + bob, 46, 38);
  if (suspicious) {
    ctx.fillStyle = player.moving ? "#f35d4c" : "#ffd65a";
    ctx.font = "700 9px monospace";
    ctx.fillText(player.moving ? "!" : "?", x - 3, y - 29 + bob);
  }
}

function drawPlayer() {
  if (player.boxed) {
    drawCardboardBox(player.x, player.y);
    if (player.hidden) {
      ctx.strokeStyle = "rgba(255, 214, 90, 0.86)";
      ctx.strokeRect(player.x - 26, player.y - 27, 52, 44);
    }
    return;
  }
  if (!drawCatSprite(player.x, player.y, player.facing, "player")) {
    drawPixelCat(player.x, player.y, player.facing, {
      body: player.hidden ? "#5f725f" : "#e2dcb7",
      trim: player.soft ? "#7ed6c8" : "#42514f",
      eye: "#111514",
    }, 1.08);
  }
  if (extractionActive) {
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(player.x - 15, player.y - 27, 30, 14);
    drawTunaCan(player.x, player.y - 28);
  }
  if (player.hidden) {
    const room = rooms[player.room];
    ctx.strokeStyle = player.ventHidden > 0 || (player.soft && inShadow(room)) ? "rgba(126, 214, 200, 0.9)" : "rgba(255, 214, 90, 0.8)";
    ctx.strokeRect(player.x - 22, player.y - 20, 44, 40);
  }
  if (player.hitCooldown > 0) {
    ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 45) * 0.2;
    ctx.strokeStyle = "#f35d4c";
    ctx.strokeRect(player.x - 18, player.y - 30, 36, 34);
    ctx.globalAlpha = 1;
  }
}

function drawPrompts(room) {
  const prompts = [];
  roomKeycards(room).forEach((keycard) => {
    if (!keycard.taken && Math.hypot(player.x - keycard.x, player.y - keycard.y) < 52) {
      prompts.push({ x: keycard.x, y: keycard.y - 28, text: "E" });
    }
  });
  if (room.tuna && !room.tuna.taken && Math.hypot(player.x - room.tuna.x, player.y - room.tuna.y) < 58) {
    prompts.push({ x: room.tuna.x, y: room.tuna.y - 34, text: "E" });
  }
  room.rations?.forEach((ration) => {
    if (!ration.taken && Math.hypot(player.x - ration.x, player.y - ration.y) < 48) {
      prompts.push({ x: ration.x, y: ration.y - 24, text: "E" });
    }
  });
  room.catnipPickups?.forEach((pickup) => {
    if (!pickup.taken && Math.hypot(player.x - pickup.x, player.y - pickup.y) < 48) {
      prompts.push({ x: pickup.x, y: pickup.y - 24, text: "E" });
    }
  });
  room.vents?.forEach((vent) => {
    if (nearRect(vent, 38)) prompts.push({ x: vent.x + vent.w / 2, y: vent.y - 12, text: "E" });
  });
  room.panels?.forEach((panel) => {
    if (!panel.done && nearRect(panel, 38)) prompts.push({ x: panel.x + panel.w / 2, y: panel.y - 12, text: "E" });
  });
  if (room.alarm && !room.alarm.disabled && nearRect(room.alarm, 40)) {
    prompts.push({ x: room.alarm.x + room.alarm.w / 2, y: room.alarm.y - 12, text: "E" });
  }
  if (room.intel && !room.intel.done && nearRect(room.intel, 40)) {
    prompts.push({ x: room.intel.x + room.intel.w / 2, y: room.intel.y - 12, text: "E" });
  }
  const guard = scratchableGuard(room);
  if (guard) prompts.push({ x: guard.x, y: guard.y - 48, text: "E" });
  prompts.forEach((prompt) => {
    ctx.fillStyle = "#111514";
    ctx.fillRect(prompt.x - 9, prompt.y - 15, 18, 18);
    ctx.fillStyle = "#ffd65a";
    ctx.font = "700 14px monospace";
    ctx.fillText(prompt.text, prompt.x - 5, prompt.y - 1);
  });
}

function facilityRectFor(roomIndex, x, y, w, h) {
  const spec = facilityMapLayout.find((candidate) => candidate.room === roomIndex);
  if (!spec) return null;
  return {
    ...spec,
    x: x + spec.x * w,
    y: y + spec.y * h,
    w: spec.w * w,
    h: spec.h * h,
  };
}

function drawFacilityMap(room) {
  const x = PANEL_X + 12;
  const y = 42;
  const w = PANEL_W - 24;
  const h = 132;
  const mapX = x + 8;
  const mapY = y + 24;
  const mapW = w - 16;
  const mapH = h - 34;
  ctx.fillStyle = "#071110";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#0cc083";
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.fillStyle = "#7ed6c8";
  ctx.font = "700 11px monospace";
  ctx.fillText("FACILITY MAP", x + 8, y + 15);
  ctx.fillStyle = "rgba(12,192,131,0.12)";
  ctx.fillRect(mapX, mapY, mapW, mapH);
  ctx.strokeStyle = "rgba(126,214,200,0.16)";
  for (let gx = mapX + 10; gx < mapX + mapW; gx += 20) {
    ctx.beginPath();
    ctx.moveTo(gx, mapY);
    ctx.lineTo(gx, mapY + mapH);
    ctx.stroke();
  }
  for (let gy = mapY + 10; gy < mapY + mapH; gy += 20) {
    ctx.beginPath();
    ctx.moveTo(mapX, gy);
    ctx.lineTo(mapX + mapW, gy);
    ctx.stroke();
  }

  const drawnLinks = new Set();
  rooms.forEach((sourceRoom, sourceIndex) => {
    roomDoors(sourceRoom).forEach((door) => {
      const key = [sourceIndex, door.to].sort((a, b) => a - b).join(":");
      if (drawnLinks.has(key)) return;
      drawnLinks.add(key);
      const from = facilityRectFor(sourceIndex, mapX, mapY, mapW, mapH);
      const to = facilityRectFor(door.to, mapX, mapY, mapW, mapH);
      if (!from || !to) return;
      const unlocked = doorUnlocked(door);
      ctx.strokeStyle = unlocked ? "rgba(255, 214, 90, 0.72)" : "rgba(134, 75, 63, 0.7)";
      ctx.lineWidth = unlocked ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(from.x + from.w / 2, from.y + from.h / 2);
      ctx.lineTo(to.x + to.w / 2, to.y + to.h / 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    });
  });

  facilityMapLayout.forEach((spec) => {
    const rect = facilityRectFor(spec.room, mapX, mapY, mapW, mapH);
    const sourceRoom = rooms[spec.room];
    if (!rect || !sourceRoom) return;
    const current = spec.room === player.room;
    const lockedAhead = roomDoors(sourceRoom).some((door) => !doorUnlocked(door));
    ctx.fillStyle = current ? "rgba(255, 214, 90, 0.22)" : "rgba(5, 9, 9, 0.82)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = current ? "#ffd65a" : lockedAhead ? "#864b3f" : "#0cc083";
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w, rect.h);
    ctx.fillStyle = current ? "#ffd65a" : "#7ed6c8";
    ctx.font = "700 7px monospace";
    ctx.fillText(spec.code, rect.x + 3, rect.y + 8);
    sourceRoom.guards.forEach((guard) => {
      const gx = rect.x + 3 + clamp(guard.x / roomWidth(sourceRoom), 0, 1) * Math.max(1, rect.w - 7);
      const gy = rect.y + 10 + clamp(guard.y / roomHeight(sourceRoom), 0, 1) * Math.max(1, rect.h - 14);
      ctx.fillStyle = guard.state === "reinforce" || guard.suspicion > 0.5 ? "#f35d4c" : "#d16d4d";
      ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3);
    });
    if (spec.room === player.room) {
      const px = rect.x + 3 + clamp(player.x / roomWidth(sourceRoom), 0, 1) * Math.max(1, rect.w - 7);
      const py = rect.y + 10 + clamp(player.y / roomHeight(sourceRoom), 0, 1) * Math.max(1, rect.h - 14);
      ctx.fillStyle = "#f0edcf";
      ctx.fillRect(px - 2, py - 2, 5, 5);
    }
  });

  if (extractionActive) {
    const rect = facilityRectFor(START_ROOM, mapX, mapY, mapW, mapH);
    ctx.fillStyle = "#ffd65a";
    ctx.strokeStyle = "#ffd65a";
    const ex = rect.x + 3 + clamp(rooms[START_ROOM].start.x / roomWidth(rooms[START_ROOM]), 0, 1) * Math.max(1, rect.w - 7);
    const ey = rect.y + 10 + clamp(rooms[START_ROOM].start.y / roomHeight(rooms[START_ROOM]), 0, 1) * Math.max(1, rect.h - 14);
    ctx.strokeRect(ex - 3, ey - 3, 10, 10);
    ctx.fillRect(ex, ey, 4, 4);
  }

  ctx.fillStyle = "#98a08f";
  ctx.font = "700 7px monospace";
  ctx.fillText("WHITE YOU  RED PATROLS  GOLD LINKS", x + 8, y + h - 4);
}

function drawSideBox(x, y, w, h, title, accent) {
  ctx.fillStyle = "#020404";
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = "#6f7b70";
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = "#050706";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(0, 86, 199, 0.16)";
  ctx.fillRect(x + 5, y + 24, w - 10, Math.max(0, h - 30));
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let yy = y + 22; yy < y + h; yy += 4) ctx.fillRect(x, yy, w, 1);
  ctx.fillStyle = "#071110";
  ctx.fillRect(x, y, w, 18);
  ctx.fillStyle = accent || "#ffd65a";
  ctx.fillRect(x, y + 18, w, 3);
  ctx.fillStyle = accent || "#ffd65a";
  ctx.font = "700 10px monospace";
  ctx.fillText(title, x + 7, y + 13);
  ctx.strokeStyle = "#111514";
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

function drawHazardStripe(x, y, w, h) {
  ctx.fillStyle = "#f3a51c";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#111514";
  ctx.lineWidth = 5;
  for (let i = -h; i < w + h; i += 18) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h + 2);
    ctx.lineTo(x + i + h, y - 2);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

function drawHazardStrip(x, y, w) {
  drawHazardStripe(x, y, w, 20);
}
