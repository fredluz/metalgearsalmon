"use strict";

function drawIntelOverlay(room) {
  if (!room.intel?.done) return;
  ctx.save();
  ctx.setLineDash([6, 7]);
  room.guards.forEach((guard) => {
    ctx.strokeStyle = "rgba(243, 93, 76, 0.24)";
    ctx.beginPath();
    guard.route.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point[0], point[1]);
      else ctx.lineTo(point[0], point[1]);
    });
    ctx.closePath();
    ctx.stroke();
    guard.route.forEach((point) => {
      ctx.fillStyle = "rgba(243, 93, 76, 0.36)";
      ctx.fillRect(point[0] - 3, point[1] - 3, 6, 6);
    });
  });

  ctx.strokeStyle = "rgba(126, 214, 200, 0.28)";
  room.vents?.forEach((vent) => {
    ctx.beginPath();
    ctx.moveTo(vent.x + vent.w / 2, vent.y + vent.h / 2);
    ctx.lineTo(vent.tx, vent.ty);
    ctx.stroke();
  });

  ctx.setLineDash([]);
  room.panels?.forEach((panel) => {
    const px = panel.x + panel.w / 2;
    const py = panel.y + panel.h / 2;
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = room.systemDown ? "rgba(126, 214, 200, 0.22)" : "rgba(255, 214, 90, 0.28)";
    room.cameras?.forEach((camera) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(camera.x, camera.y);
      ctx.stroke();
    });
    room.sweeps?.forEach((sweep) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sweep.x + sweep.w / 2, sweep.y + sweep.h / 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.fillStyle = room.systemDown ? "rgba(126, 214, 200, 0.32)" : "rgba(255, 214, 90, 0.34)";
    ctx.fillRect(px - 4, py - 4, 8, 8);
  });

  room.cameras?.forEach((camera) => {
    ctx.strokeStyle = cameraActive(room, camera) ? "rgba(126, 214, 200, 0.42)" : "rgba(70, 80, 74, 0.42)";
    ctx.strokeRect(camera.x - 10, camera.y - 10, 20, 20);
  });
  ctx.restore();
}

function drawRoom(room) {
  const current = room.index === player.room;
  drawFloor(room);
  drawIntelOverlay(room);
  if (extractionActive && room.index === START_ROOM) drawEvacPad(rooms[START_ROOM].start.x, rooms[START_ROOM].start.y);
  room.props?.forEach((prop) => {
    if (rectVisibleInRoom(room, prop)) drawProp(prop, room);
  });
  room.shadows?.forEach((shadow) => {
    if (rectVisibleInRoom(room, shadow)) drawShadowZone(shadow);
  });
  room.hiding.forEach((spot) => {
    if (rectVisibleInRoom(room, spot)) drawCrate(spot, "#726b3e");
  });
  room.vents?.forEach((vent) => {
    if (rectVisibleInRoom(room, vent)) drawVent(vent);
  });
  if (current) {
    drawVentRattles();
    drawTacticalPings();
  }
  room.panels?.forEach((panel) => {
    if (rectVisibleInRoom(room, panel)) drawPanel(panel, panel.done);
  });
  if (room.alarm && rectVisibleInRoom(room, room.alarm)) drawAlarmPanel(room.alarm);
  room.cameras?.forEach((camera) => drawCamera(camera, cameraActive(room, camera)));
  room.sweeps?.forEach((sweep) => {
    if (rectVisibleInRoom(room, sweep)) drawSensorSweep(room, sweep);
  });
  room.walls.forEach((wall) => {
    if (rectVisibleInRoom(room, wall)) drawWall(room, wall);
  });
  const visibleDoors = roomDoors(room).filter((door) => shouldDrawDoor(room, door));
  visibleDoors.forEach((door) => drawDoorwayCutout(room, door));

  visibleDoors.forEach((door) => drawDoor(room, door));

  roomKeycards(room).forEach((keycard) => {
    if (!keycard.taken) drawKeycard(keycard.x, keycard.y);
  });
  room.rations?.forEach((ration) => {
    if (!ration.taken) drawTunaCan(ration.x, ration.y);
  });
  room.catnipPickups?.forEach((pickup) => {
    if (!pickup.taken) drawYarnBall(pickup.x, pickup.y, true);
  });
  if (current) catnips.forEach((pouch) => drawYarnBall(pouch.x, pouch.y, true, pouch.trail));
  if (room.tuna && !room.tuna.taken) drawTuna(room.tuna.x, room.tuna.y);

  if (room.lasers) {
    room.lasers.forEach((laser) => {
      const active = !room.systemDown && Math.sin(performance.now() / 380 + laser.phase) > -0.15;
      ctx.fillStyle = active ? "rgba(243, 93, 76, 0.82)" : "rgba(126, 214, 200, 0.16)";
      ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
      drawHazardStripe(laser.x - 12, laser.y - 10, 14, laser.h + 20);
      drawHazardStripe(laser.x + laser.w - 2, laser.y - 10, 14, laser.h + 20);
      ctx.fillStyle = active ? "#ffb0a5" : "#38484a";
      ctx.fillRect(laser.x - 8, laser.y - 5, 6, laser.h + 10);
      ctx.fillRect(laser.x + laser.w + 2, laser.y - 5, 6, laser.h + 10);
    });
  }
}
