"use strict";

function drawFloor(room) {
  const w = roomWidth(room);
  const h = roomHeight(room);
  if (room.baseImageKey === "dockVillageBase" && dockBaseMapReady) {
    ctx.drawImage(dockBaseMap, 0, 0, w, h);
    return;
  }
  const view = roomViewRect(room, TILE);
  const startX = Math.max(28, Math.floor(view.x / TILE) * TILE);
  const endX = Math.min(w - 28, Math.ceil((view.x + view.w) / TILE) * TILE);
  const startY = Math.max(28, Math.floor(view.y / TILE) * TILE);
  const endY = Math.min(h - 28, Math.ceil((view.y + view.h) / TILE) * TILE);
  ctx.fillStyle = room.floor;
  ctx.fillRect(0, 0, w, h);
  for (let y = startY; y < endY; y += TILE) {
    for (let x = startX; x < endX; x += TILE) {
      const alt = ((x / TILE) + (y / TILE)) % 2;
      ctx.fillStyle = alt ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.055)";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = "rgba(12, 18, 16, 0.5)";
      ctx.strokeRect(x + 0.5, y + 0.5, TILE, TILE);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x + 4, y + 4, 3, 3);
      ctx.fillRect(x + 24, y + 24, 3, 3);
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(x + 1, y + TILE - 4, TILE - 2, 3);
    }
  }
}

function propRenderRect(prop) {
  if (prop.imageKey) {
    return {
      x: prop.x - prop.w / 2,
      y: prop.y - prop.h,
      w: prop.w,
      h: prop.h,
    };
  }
  return prop;
}

function drawLayeredProp(prop) {
  const image = propImages[prop.imageKey];
  const rect = propRenderRect(prop);
  if (image?.ready) {
    ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
    return;
  }

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(rect.x + 5, rect.y + 7, rect.w, rect.h);
  ctx.fillStyle = prop.fallback || "#6f7044";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "#111514";
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w, rect.h);
}

function drawLightPool(light) {
  const radius = light.radius || 90;
  const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, radius);
  gradient.addColorStop(0, `rgba(255, 194, 92, ${light.alpha || 0.22})`);
  gradient.addColorStop(0.48, "rgba(255, 156, 60, 0.09)");
  gradient.addColorStop(1, "rgba(255, 156, 60, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(light.x, light.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawDebugShape(shape) {
  ctx.beginPath();
  if (shape.type === "rect") {
    ctx.rect(shape.x, shape.y, shape.w, shape.h);
  } else if (shape.type === "ellipse") {
    ctx.ellipse(shape.x, shape.y, shape.rx, shape.ry, 0, 0, Math.PI * 2);
  } else if (shape.type === "polygon" && shape.points?.length) {
    shape.points.forEach((point, index) => {
      const x = Array.isArray(point) ? point[0] : point.x;
      const y = Array.isArray(point) ? point[1] : point.y;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
}

function drawCollisionDebugOverlay(room) {
  if (!DEBUG_COLLISION) return;
  ctx.save();
  ctx.fillStyle = "rgba(255, 214, 0, 0.24)";
  ctx.fillRect(0, 0, roomWidth(room), roomHeight(room));

  ctx.fillStyle = "rgba(24, 232, 124, 0.34)";
  ctx.strokeStyle = "rgba(24, 255, 160, 0.85)";
  ctx.lineWidth = 2;
  room.walkBounds?.forEach((shape) => {
    drawDebugShape(shape);
    ctx.fill();
    ctx.stroke();
  });

  ctx.fillStyle = "rgba(255, 47, 68, 0.48)";
  ctx.strokeStyle = "rgba(255, 235, 235, 0.92)";
  ctx.lineWidth = 1.5;
  room.walls?.forEach((wall) => {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w, wall.h);
  });

  ctx.fillStyle = "#050706";
  ctx.fillRect(14, 14, 314, 42);
  ctx.strokeStyle = "#f0edcf";
  ctx.strokeRect(14.5, 14.5, 314, 42);
  ctx.fillStyle = "#ffd600";
  ctx.fillRect(24, 25, 12, 12);
  ctx.fillStyle = "#18e87c";
  ctx.fillRect(112, 25, 12, 12);
  ctx.fillStyle = "#ff2f44";
  ctx.fillRect(210, 25, 12, 12);
  ctx.fillStyle = "#f0edcf";
  ctx.font = "700 10px monospace";
  ctx.fillText("YELLOW WATER", 42, 35);
  ctx.fillText("GREEN WALK", 130, 35);
  ctx.fillText("RED BLOCK", 228, 35);
  ctx.restore();
}

function drawWall(room, wall) {
  const face = wall.y + wall.h + DEPTH <= roomHeight(room) ? DEPTH : 0;
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(wall.x + 7, wall.y + 9, wall.w, wall.h + face);

  if (face) {
    ctx.fillStyle = "#27302a";
    ctx.fillRect(wall.x, wall.y + wall.h, wall.w, face);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(wall.x, wall.y + wall.h + face - 5, wall.w, 5);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    for (let x = wall.x + 18; x < wall.x + wall.w; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, wall.y + wall.h + 2);
      ctx.lineTo(x - 8, wall.y + wall.h + face - 3);
      ctx.stroke();
    }
  }

  ctx.fillStyle = room.wall;
  ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  ctx.fillStyle = room.trim;
  ctx.fillRect(wall.x, wall.y, wall.w, Math.min(5, wall.h));
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(wall.x, wall.y + wall.h - 5, wall.w, 5);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(wall.x + 3, wall.y + 5, Math.max(0, wall.w - 6), 4);
  ctx.strokeStyle = "rgba(12, 17, 16, 0.5)";
  ctx.lineWidth = 1;
  for (let x = wall.x + 28; x < wall.x + wall.w; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, wall.y + 5);
    ctx.lineTo(x, wall.y + wall.h - 5);
    ctx.stroke();
  }
}

function drawCrate(rect, color) {
  const face = 12;
  ctx.fillStyle = "rgba(0,0,0,0.26)";
  ctx.fillRect(rect.x + 5, rect.y + 7, rect.w, rect.h + face);
  ctx.fillStyle = "#484528";
  ctx.fillRect(rect.x, rect.y + rect.h, rect.w, face);
  ctx.fillStyle = color || "#7b7443";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(rect.x + 8, rect.y + 7, rect.w - 16, rect.h - 16);
  ctx.fillStyle = "rgba(0,0,0,0.20)";
  ctx.fillRect(rect.x, rect.y + rect.h - 5, rect.w, 5);
  ctx.strokeStyle = "rgba(20,20,12,0.45)";
  ctx.beginPath();
  ctx.moveTo(rect.x + 8, rect.y + 8);
  ctx.lineTo(rect.x + rect.w - 8, rect.y + rect.h - 8);
  ctx.moveTo(rect.x + rect.w - 8, rect.y + 8);
  ctx.lineTo(rect.x + 8, rect.y + rect.h - 8);
  ctx.stroke();
}

function drawVent(vent) {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(vent.x + 4, vent.y + 7, vent.w, vent.h);
  ctx.fillStyle = "#12181b";
  ctx.fillRect(vent.x, vent.y, vent.w, vent.h);
  ctx.fillStyle = "#7ed6c8";
  ctx.fillRect(vent.x + 4, vent.y + 4, vent.w - 8, 3);
  for (let x = vent.x + 8; x < vent.x + vent.w - 6; x += 10) {
    ctx.fillStyle = "#364345";
    ctx.fillRect(x, vent.y + 9, 4, vent.h - 14);
  }
}

function drawVentRattles() {
  ventRattles.forEach((rattle) => {
    const alpha = rattle.ttl / rattle.maxTtl;
    ctx.strokeStyle = `rgba(126, 214, 200, ${0.18 + alpha * 0.45})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(rattle.x - 19, rattle.y - 13, 38, 26);
    ctx.beginPath();
    ctx.moveTo(rattle.x - 24, rattle.y);
    ctx.lineTo(rattle.x - 30, rattle.y - 6);
    ctx.moveTo(rattle.x + 24, rattle.y);
    ctx.lineTo(rattle.x + 30, rattle.y + 6);
    ctx.stroke();
    ctx.lineWidth = 1;
  });
}

function drawTacticalPings() {
  tacticalPings.forEach((ping) => {
    const alpha = ping.ttl / ping.maxTtl;
    const radius = 10 + (1 - alpha) * 28;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ping.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(ping.x - radius / 2, ping.y - radius / 2, radius, radius);
    ctx.beginPath();
    ctx.moveTo(ping.x - 18, ping.y);
    ctx.lineTo(ping.x + 18, ping.y);
    ctx.moveTo(ping.x, ping.y - 18);
    ctx.lineTo(ping.x, ping.y + 18);
    ctx.stroke();
    ctx.fillStyle = "#050706";
    ctx.fillRect(ping.x - 16, ping.y - 30, 32, 12);
    ctx.fillStyle = ping.color;
    ctx.font = "700 8px monospace";
    ctx.fillText(ping.label, ping.x - Math.min(13, ping.label.length * 3), ping.y - 21);
    ctx.restore();
    ctx.lineWidth = 1;
  });
}

function drawPanel(panel, active) {
  if (panel.type === "generator") {
    drawGenerator(panel, active);
    return;
  }
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.fillRect(panel.x + 4, panel.y + 7, panel.w, panel.h);
  ctx.fillStyle = "#111415";
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.fillStyle = active ? "#7ed6c8" : "#f35d4c";
  ctx.fillRect(panel.x + 8, panel.y + 8, panel.w - 16, 9);
  ctx.fillStyle = "#30383a";
  ctx.fillRect(panel.x + 10, panel.y + 25, panel.w - 20, 18);
  if (active) {
    ctx.fillStyle = "#071110";
    ctx.fillRect(panel.x + 11, panel.y + 28, panel.w - 22, 11);
    ctx.fillStyle = "#7ed6c8";
    ctx.font = "700 8px monospace";
    ctx.fillText("OFF", panel.x + 13, panel.y + 37);
  }
}

function drawGenerator(generator, off) {
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(generator.x + 6, generator.y + 8, generator.w, generator.h);
  ctx.fillStyle = off ? "#2c2941" : "#6b4fd8";
  ctx.fillRect(generator.x, generator.y, generator.w, generator.h);
  ctx.fillStyle = off ? "#46504a" : "#ffd65a";
  ctx.fillRect(generator.x + 10, generator.y + 10, generator.w - 20, 10);
  ctx.fillStyle = off ? "#171d21" : "#33276f";
  ctx.fillRect(generator.x + 14, generator.y + 26, generator.w - 28, generator.h - 38);
  ctx.strokeStyle = off ? "#7ed6c8" : "#f0edcf";
  ctx.strokeRect(generator.x + 0.5, generator.y + 0.5, generator.w, generator.h);
  ctx.fillStyle = off ? "#7ed6c8" : "#ffdc75";
  ctx.font = "700 8px monospace";
  ctx.fillText(off ? "OFF" : "GEN", generator.x + 22, generator.y + generator.h - 13);
}

function drawBackpackIcon(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(-20, 13, 42, 10);
  ctx.fillStyle = "#d486bd";
  ctx.fillRect(-18, -12, 36, 32);
  ctx.fillStyle = "#bf6fa6";
  ctx.fillRect(-12, -20, 24, 14);
  ctx.fillStyle = "#f0a8d5";
  ctx.fillRect(-13, -7, 26, 15);
  ctx.fillStyle = "#ffd65a";
  ctx.fillRect(10, -2, 8, 4);
  ctx.strokeStyle = "#5d354f";
  ctx.strokeRect(-18.5, -12.5, 37, 33);
  ctx.restore();
}

function drawBackpack(pack) {
  drawBackpackIcon(pack.x + pack.w / 2, pack.y + pack.h / 2, 1);
}

function drawExitZone(exitZone, active) {
  const pulse = 0.55 + Math.sin(performance.now() / 130) * 0.22;
  ctx.fillStyle = active ? "rgba(126, 214, 200, 0.08)" : "rgba(243, 93, 76, 0.08)";
  ctx.fillRect(exitZone.x, exitZone.y, exitZone.w, exitZone.h);
  ctx.strokeStyle = active ? `rgba(126, 214, 200, ${pulse})` : "rgba(243, 93, 76, 0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(exitZone.x + 0.5, exitZone.y + 0.5, exitZone.w, exitZone.h);
  drawHazardStripe(exitZone.x, exitZone.y + exitZone.h - 10, exitZone.w, 10);
  ctx.lineWidth = 1;
}

function drawBlackoutOverlay(room) {
  ctx.fillStyle = "rgba(0, 9, 18, 0.3)";
  ctx.fillRect(0, 0, roomWidth(room), roomHeight(room));
}

function drawAlarmPanel(alarm) {
  const off = alarm.disabled;
  const hot = alarm.triggered;
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.fillRect(alarm.x + 4, alarm.y + 7, alarm.w, alarm.h);
  ctx.fillStyle = off ? "#18211f" : hot ? "#3f1414" : "#171313";
  ctx.fillRect(alarm.x, alarm.y, alarm.w, alarm.h);
  ctx.strokeStyle = off ? "#46504a" : hot ? "#f35d4c" : "#ffd65a";
  ctx.strokeRect(alarm.x + 0.5, alarm.y + 0.5, alarm.w, alarm.h);
  ctx.fillStyle = off ? "#46504a" : hot ? "#f35d4c" : "#ffd65a";
  ctx.fillRect(alarm.x + 8, alarm.y + 8, alarm.w - 16, 8);
  ctx.fillStyle = off ? "#26302c" : "#111514";
  ctx.fillRect(alarm.x + 9, alarm.y + 22, alarm.w - 18, 13);
  ctx.fillStyle = off ? "#98a08f" : hot ? "#ffd65a" : "#f35d4c";
  ctx.font = "700 7px monospace";
  ctx.fillText(off ? "OFF" : "CALL", alarm.x + 10, alarm.y + 32);
}

function drawCamera(camera, active) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.rotate(cameraAngle(camera));
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(-13, -6, 28, 14);
  ctx.fillStyle = active ? "#2a3432" : "#1b2220";
  ctx.fillRect(-12, -7, 22, 14);
  ctx.fillStyle = active ? "#f35d4c" : "#46504a";
  ctx.fillRect(8, -4, 7, 8);
  ctx.fillStyle = "#9aa8a3";
  ctx.fillRect(-8, -10, 10, 3);
  ctx.restore();
}

function drawShadowZone(shadow) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.fillRect(shadow.x, shadow.y, shadow.w, shadow.h);
  ctx.fillStyle = "rgba(126, 214, 200, 0.045)";
  for (let y = shadow.y + 8; y < shadow.y + shadow.h; y += 14) {
    ctx.fillRect(shadow.x + 6, y, shadow.w - 12, 2);
  }
  ctx.strokeStyle = "rgba(126, 214, 200, 0.12)";
  ctx.strokeRect(shadow.x + 0.5, shadow.y + 0.5, shadow.w, shadow.h);
}

function drawProp(prop, room) {
  if (prop.imageKey) {
    drawLayeredProp(prop);
  } else if (prop.type === "crate") {
    drawCrate(prop, "#6f7044");
  } else if (prop.type === "pipe") {
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.fillRect(prop.x + 3, prop.y + 8, prop.w, prop.h + 4);
    ctx.fillStyle = "#7b8b86";
    ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
    ctx.fillStyle = "#3a4744";
    ctx.fillRect(prop.x, prop.y + prop.h, prop.w, 6);
    ctx.fillStyle = "#263331";
    for (let x = prop.x + 18; x < prop.x + prop.w; x += 44) ctx.fillRect(x, prop.y - 4, 8, prop.h + 8);
  } else if (prop.type === "drums") {
    for (let i = 0; i < 3; i += 1) {
      const x = prop.x + i * 28;
      ctx.fillStyle = "#2c3534";
      ctx.fillRect(x, prop.y, 22, prop.h);
      ctx.fillStyle = "#9d7b45";
      ctx.fillRect(x + 3, prop.y + 6, 16, 8);
      ctx.fillRect(x + 3, prop.y + prop.h - 14, 16, 8);
    }
  } else if (prop.type === "terminal") {
    drawPanel(prop, room.intel?.done || false);
  }
}

function drawKeycard(x, y) {
  ctx.fillStyle = "#ffd65a";
  ctx.fillRect(x - 15, y - 10, 30, 20);
  ctx.fillStyle = "#131715";
  ctx.fillRect(x - 9, y - 4, 11, 3);
  ctx.fillRect(x - 9, y + 3, 19, 3);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x - 13, y - 8, 26, 3);
}

function drawTunaFallback(x, y) {
  ctx.fillStyle = "#c4dfe3";
  ctx.fillRect(x - 24, y - 10, 42, 20);
  ctx.fillStyle = "#9fc1c7";
  ctx.fillRect(x - 14, y - 14, 25, 28);
  ctx.fillStyle = "#c4dfe3";
  ctx.fillRect(x + 16, y - 16, 22, 12);
  ctx.fillRect(x + 16, y + 4, 22, 12);
  ctx.fillStyle = "#223337";
  ctx.fillRect(x - 18, y - 4, 4, 4);
}

function drawTuna(x, y) {
  if (spritesReady) {
    drawSpriteFrame(7, x, y, 0.58, false);
    return;
  }
  drawTunaFallback(x, y);
}

function drawTunaCan(x, y) {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(x - 16, y + 9, 32, 7);

  ctx.fillStyle = "#9aa8a3";
  ctx.fillRect(x - 15, y - 6, 30, 15);
  ctx.fillStyle = "#d9e6df";
  ctx.fillRect(x - 13, y - 9, 26, 6);
  ctx.fillStyle = "#eef6ee";
  ctx.fillRect(x - 10, y - 11, 20, 4);
  ctx.fillStyle = "#58635f";
  ctx.fillRect(x - 8, y - 10, 16, 2);
  ctx.fillRect(x - 2, y - 12, 5, 3);

  ctx.fillStyle = "#0f7f91";
  ctx.fillRect(x - 12, y - 3, 24, 5);
  ctx.fillStyle = "#f35d4c";
  ctx.fillRect(x - 12, y + 3, 24, 4);
  ctx.fillStyle = "#f0edcf";
  ctx.font = "700 6px monospace";
  ctx.fillText("TUNA", x - 9, y + 2);

  ctx.strokeStyle = "#111514";
  ctx.strokeRect(x - 15.5, y - 9.5, 30, 18);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 8);
  ctx.lineTo(x + 12, y - 8);
  ctx.stroke();
}

function drawYarnBall(x, y, active = true, trail = []) {
  if (trail.length > 1) {
    ctx.strokeStyle = active ? "rgba(240, 237, 207, 0.55)" : "rgba(70, 80, 74, 0.4)";
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i += 1) ctx.lineTo(trail[i].x, trail[i].y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.arc(x + 2, y + 6, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = active ? "#9b4967" : "#3d3138";
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = active ? "#f0edcf" : "#5d5358";
  ctx.beginPath();
  ctx.arc(x - 1, y, 4.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 1);
  ctx.lineTo(x + 5, y + 1);
  ctx.moveTo(x - 1, y - 7);
  ctx.lineTo(x + 1, y + 5);
  ctx.stroke();
}

function drawCatnipPouch(x, y, active = true) {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(x - 12, y + 7, 24, 6);
  ctx.fillStyle = active ? "#6f7044" : "#2b342d";
  ctx.fillRect(x - 11, y - 8, 22, 17);
  ctx.fillStyle = active ? "#9fb27b" : "#46504a";
  ctx.fillRect(x - 8, y - 5, 16, 10);
  ctx.fillStyle = active ? "#7ed6c8" : "#303a36";
  ctx.fillRect(x - 5, y - 2, 10, 3);
  ctx.strokeStyle = active ? "#111514" : "#46504a";
  ctx.strokeRect(x - 11.5, y - 8.5, 22, 17);
}

function drawEvacPad(x, y) {
  const pulse = 0.55 + Math.sin(performance.now() / 120) * 0.25;
  ctx.fillStyle = "rgba(255, 214, 90, 0.08)";
  ctx.fillRect(x - 42, y - 30, 84, 60);
  ctx.strokeStyle = `rgba(255, 214, 90, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 42.5, y - 30.5, 84, 60);
  drawHazardStripe(x - 42, y + 22, 84, 10);
  ctx.fillStyle = "#071110";
  ctx.fillRect(x - 27, y - 12, 54, 22);
  ctx.strokeStyle = "#7ed6c8";
  ctx.strokeRect(x - 26.5, y - 11.5, 53, 21);
  ctx.fillStyle = "#ffd65a";
  ctx.font = "700 12px monospace";
  ctx.fillText("EVAC", x - 15, y + 3);
  ctx.lineWidth = 1;
}

function drawDoorwayCutout(room, door) {
  if (!doorIsOpen(room, door)) return;
  const center = doorCenter(door);
  const trigger = doorTriggerRect(door);
  const point = { x: trigger.x + trigger.w / 2, y: trigger.y + trigger.h / 2 };
  ctx.save();
  ctx.strokeStyle = "rgba(255, 214, 90, 0.18)";
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(center.x, center.y);
  ctx.stroke();
  ctx.strokeStyle = "rgba(7, 17, 16, 0.92)";
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(center.x, center.y);
  ctx.stroke();
  ctx.fillStyle = room.floor;
  ctx.fillRect(door.x + 4, door.y + 4, Math.max(10, door.w - 8), Math.max(10, door.h - 8));
  ctx.strokeStyle = "rgba(255, 214, 90, 0.62)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(center.x, center.y);
  ctx.stroke();
  ctx.restore();
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
}

function drawDoor(room, door) {
  const unlocked = doorUnlocked(door);
  const open = doorIsOpen(room, door);
  const activeAlert = alert > 0;
  const trigger = doorTriggerRect(door);
  const triggerCenter = { x: trigger.x + trigger.w / 2, y: trigger.y + trigger.h / 2 };
  const innerX = door.x + 7;
  const innerY = door.y + 7;
  const innerW = Math.max(8, door.w - 14);
  const innerH = Math.max(8, door.h - 14);
  drawHazardStripe(door.x, door.y, door.w, door.h);

  if (open) {
    ctx.fillStyle = room.floor;
    ctx.fillRect(innerX, innerY, innerW, innerH);
    ctx.fillStyle = "rgba(240, 237, 207, 0.18)";
    if (door.h >= door.w) {
      const panelH = Math.max(10, innerH * 0.25);
      ctx.fillRect(innerX, innerY, innerW, panelH);
      ctx.fillRect(innerX, innerY + innerH - panelH, innerW, panelH);
    } else {
      const panelW = Math.max(10, innerW * 0.25);
      ctx.fillRect(innerX, innerY, panelW, innerH);
      ctx.fillRect(innerX + innerW - panelW, innerY, panelW, innerH);
    }
    ctx.strokeStyle = "rgba(240, 237, 207, 0.52)";
    ctx.lineWidth = 2;
    ctx.strokeRect(innerX + 0.5, innerY + 0.5, innerW, innerH);
  } else {
    ctx.fillStyle = unlocked ? "#56615c" : "#5f3430";
    ctx.fillRect(innerX, innerY, innerW, innerH);
    ctx.fillStyle = "rgba(5, 9, 9, 0.32)";
    if (door.h >= door.w) {
      for (let y = door.y + 12; y < door.y + door.h - 8; y += 14) {
        ctx.fillRect(innerX, y, innerW, 4);
      }
    } else {
      for (let x = door.x + 12; x < door.x + door.w - 8; x += 14) {
        ctx.fillRect(x, innerY, 4, innerH);
      }
    }
  }

  if (activeAlert) {
    ctx.fillStyle = "rgba(243, 93, 76, 0.24)";
    ctx.fillRect(innerX, innerY, innerW, innerH);
  }
  ctx.strokeStyle = open ? "rgba(240, 237, 207, 0.78)" : unlocked ? "rgba(152, 160, 143, 0.9)" : "rgba(243, 93, 76, 0.66)";
  ctx.lineWidth = open ? 3 : 2;
  ctx.strokeRect(door.x + 4.5, door.y + 4.5, Math.max(10, door.w - 9), Math.max(10, door.h - 9));
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  const label = open ? "OPEN" : unlocked ? "CLOSED" : `TAG ${door.need}`;
  const labelX = clamp(triggerCenter.x - label.length * 3 - 4, 34, roomWidth(room) - 82);
  const labelY = clamp(trigger.y - 18, 40, roomHeight(room) - 38);
  ctx.fillStyle = "rgba(5, 9, 9, 0.86)";
  ctx.fillRect(labelX, labelY, label.length * 6 + 8, 14);
  ctx.strokeStyle = open ? "#f0edcf" : unlocked ? "#98a08f" : "#f35d4c";
  ctx.strokeRect(labelX + 0.5, labelY + 0.5, label.length * 6 + 8, 14);
  ctx.fillStyle = open ? "#f0edcf" : unlocked ? "#98a08f" : "#f35d4c";
  ctx.font = "700 10px monospace";
  ctx.fillText(label, labelX + 4, labelY + 10);
}

function drawSensorSweep(room, sweep) {
  if (room.systemDown) {
    ctx.fillStyle = "rgba(70, 80, 74, 0.055)";
    ctx.fillRect(sweep.x, sweep.y, sweep.w, sweep.h);
    ctx.strokeStyle = "rgba(70, 80, 74, 0.22)";
    ctx.strokeRect(sweep.x + 0.5, sweep.y + 0.5, sweep.w, sweep.h);
    return;
  }
  const beam = sweepBeam(sweep);
  ctx.fillStyle = "rgba(126, 214, 200, 0.035)";
  ctx.fillRect(sweep.x, sweep.y, sweep.w, sweep.h);
  ctx.strokeStyle = "rgba(126, 214, 200, 0.18)";
  ctx.strokeRect(sweep.x + 0.5, sweep.y + 0.5, sweep.w, sweep.h);

  const hot = securityLevel >= 4 || extractionActive;
  ctx.fillStyle = hot ? "rgba(243, 93, 76, 0.72)" : "rgba(126, 214, 200, 0.72)";
  ctx.fillRect(beam.x, beam.y, beam.w, beam.h);
  ctx.fillStyle = "rgba(240, 237, 207, 0.58)";
  if (sweep.axis === "y") {
    ctx.fillRect(beam.x, beam.y + 2, beam.w, 2);
    drawHazardStripe(sweep.x - 8, sweep.y - 8, 12, 18);
    drawHazardStripe(sweep.x + sweep.w - 4, sweep.y + sweep.h - 10, 12, 18);
  } else {
    ctx.fillRect(beam.x + 2, beam.y, 2, beam.h);
    drawHazardStripe(sweep.x - 8, sweep.y - 8, 18, 12);
    drawHazardStripe(sweep.x + sweep.w - 10, sweep.y + sweep.h - 4, 18, 12);
  }
}
