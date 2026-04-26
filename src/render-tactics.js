"use strict";

function drawRadioLinks(room) {
  if (!lastKnown || (alert <= 0 && sweepTimer <= 0)) return;
  room.guards.forEach((guard) => {
    if (guard.stunned > 0 || (guard.suspicion < 0.7 && guard.state !== "sweep")) return;
    ctx.strokeStyle = alert > 0 ? "rgba(243, 93, 76, 0.16)" : "rgba(255, 214, 90, 0.14)";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y - 18);
    ctx.lineTo(lastKnown.x, lastKnown.y);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

function tacticalRoute(room, target) {
  const cell = 32;
  const cols = Math.floor(PLAY_W / cell);
  const rows = Math.floor(H / cell);
  const key = (x, y) => `${x},${y}`;
  const start = {
    x: clamp(Math.floor(player.x / cell), 0, cols - 1),
    y: clamp(Math.floor(player.y / cell), 0, rows - 1),
  };
  const goal = {
    x: clamp(Math.floor(target.x / cell), 0, cols - 1),
    y: clamp(Math.floor(target.y / cell), 0, rows - 1),
  };
  const blockedCell = (x, y) => {
    const px = x * cell + cell / 2;
    const py = y * cell + cell / 2;
    return guardBlocked(room, px, py);
  };
  const hazardCost = (x, y) => {
    const px = x * cell + cell / 2;
    const py = y * cell + cell / 2;
    let cost = room.shadows?.some((shadow) => circleRect(px, py, 8, shadow)) ? -0.35 : 0;

    room.guards.forEach((guard) => {
      if (guard.stunned > 0) return;
      const dx = px - guard.x;
      const dy = py - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 210 || !hasLineOfSight(guard.x, guard.y, px, py, room.walls)) return;
      const dir = guard.dir || { x: 1, y: 0 };
      const dot = (dx / (dist || 1)) * dir.x + (dy / (dist || 1)) * dir.y;
      if (dot > Math.cos(0.78)) cost += 4.8 * (1 - dist / 230);
      else if (dist < 76) cost += 1.1;
    });

    room.cameras?.forEach((camera) => {
      if (!cameraActive(room, camera)) return;
      const dx = px - camera.x;
      const dy = py - camera.y;
      const dist = Math.hypot(dx, dy);
      if (dist > camera.range || !hasLineOfSight(camera.x, camera.y, px, py, room.walls)) return;
      const angle = cameraAngle(camera);
      const dot = (dx / (dist || 1)) * Math.cos(angle) + (dy / (dist || 1)) * Math.sin(angle);
      if (dot > Math.cos(0.46)) cost += 3.6 * (1 - dist / camera.range);
    });

    if (!room.systemDown) {
      room.sweeps?.forEach((sweep) => {
        if (circleRect(px, py, 9, sweepBeam(sweep))) cost += 5;
      });
    }

    return Math.max(0.2, cost);
  };
  const open = [{ ...start, cost: 0 }];
  const cameFrom = new Map([[key(start.x, start.y), null]]);
  const costSoFar = new Map([[key(start.x, start.y), 0]]);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (open.length) {
    open.sort((a, b) => a.cost - b.cost);
    const current = open.shift();
    if (current.x === goal.x && current.y === goal.y) break;
    dirs.forEach(([dx, dy]) => {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const id = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || blockedCell(nx, ny)) return;
      const newCost = costSoFar.get(key(current.x, current.y)) + 1 + hazardCost(nx, ny);
      if (costSoFar.has(id) && newCost >= costSoFar.get(id)) return;
      costSoFar.set(id, newCost);
      cameFrom.set(id, current);
      const heuristic = Math.abs(goal.x - nx) + Math.abs(goal.y - ny);
      open.push({ x: nx, y: ny, cost: newCost + heuristic });
    });
  }

  const goalKey = key(goal.x, goal.y);
  if (!cameFrom.has(goalKey)) return [];
  const path = [];
  let danger = 0;
  let current = goal;
  while (current) {
    const point = { x: current.x * cell + cell / 2, y: current.y * cell + cell / 2 };
    danger += hazardCost(current.x, current.y);
    path.push(point);
    current = cameFrom.get(key(current.x, current.y));
  }
  path.danger = danger / Math.max(1, path.length);
  return path.reverse();
}

function drawTacticalRoute(room) {
  const target = objectiveTarget(room);
  if (!target || won || gameOver) return;
  if (!room.intel?.done && player.senseTimer <= 0) return;
  const path = tacticalRoute(room, target);
  if (path.length < 3) return;
  const routeHot = path.danger > 1.1 || extractionActive;
  const color = routeHot ? "243, 93, 76" : "126, 214, 200";
  const active = player.senseTimer > 0;

  ctx.save();
  ctx.globalAlpha = active ? 0.72 : 0.42;
  ctx.strokeStyle = `rgba(${color}, ${active ? 0.32 : 0.18})`;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  path.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  path.forEach((point, index) => {
    if (index % 2 !== 0 || index === 0) return;
    const bob = Math.sin(performance.now() / 180 + index) * 1.5;
    ctx.fillStyle = `rgba(${color}, ${active ? 0.78 : 0.48})`;
    ctx.fillRect(point.x - 3, point.y - 2 + bob, 6, 4);
    ctx.fillRect(point.x + 3, point.y - 6 + bob, 2, 2);
    ctx.fillRect(point.x - 5, point.y - 6 + bob, 2, 2);
  });
  ctx.restore();
}

function guardForecastPoints(guard) {
  if (guard.stunned > 0) return [];
  const points = [];
  let x = guard.x;
  let y = guard.y;
  let routeIndex = guard.i;
  let remaining = 52;

  for (let step = 0; step < 5; step += 1) {
    const target = guard.state === "patrol"
      ? guard.route[routeIndex % guard.route.length]
      : guard.target || guard.route[routeIndex % guard.route.length];
    const dx = target[0] !== undefined ? target[0] - x : target.x - x;
    const dy = target[1] !== undefined ? target[1] - y : target.y - y;
    const dist = Math.hypot(dx, dy) || 1;
    if (remaining < dist) {
      x += (dx / dist) * remaining;
      y += (dy / dist) * remaining;
      points.push({ x, y, caution: guard.state !== "patrol" || guard.suspicion > 0.42 });
      remaining += 52;
    } else {
      x = target[0] !== undefined ? target[0] : target.x;
      y = target[1] !== undefined ? target[1] : target.y;
      points.push({ x, y, caution: guard.state !== "patrol" || guard.suspicion > 0.42 });
      if (guard.state !== "patrol") break;
      routeIndex = (routeIndex + 1) % guard.route.length;
      remaining = 52;
    }
  }
  return points;
}

function drawGuardForecasts(room) {
  if (!room.intel?.done && player.senseTimer <= 0) return;
  const alpha = player.senseTimer > 0 ? 0.78 : 0.42;
  ctx.save();
  room.guards.forEach((guard) => {
    const points = guardForecastPoints(guard);
    if (!points.length) return;
    ctx.globalAlpha = alpha;
    ctx.setLineDash([2, 8]);
    ctx.strokeStyle = guard.suspicion > 0.55 ? "rgba(243, 93, 76, 0.5)" : "rgba(255, 214, 90, 0.36)";
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();
    ctx.setLineDash([]);
    points.forEach((point, index) => {
      ctx.fillStyle = point.caution ? "rgba(243, 93, 76, 0.72)" : "rgba(255, 214, 90, 0.62)";
      const size = Math.max(3, 7 - index);
      ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
    });
  });
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawObjectiveMarker(room) {
  const target = objectiveTarget(room);
  if (!target) return;
  const pulse = Math.sin(performance.now() / 180) * 3;
  const r = target.r + pulse;
  ctx.strokeStyle = "rgba(255, 214, 90, 0.82)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(target.x - r, target.y - r + 9);
  ctx.lineTo(target.x - r, target.y - r);
  ctx.lineTo(target.x - r + 9, target.y - r);
  ctx.moveTo(target.x + r - 9, target.y - r);
  ctx.lineTo(target.x + r, target.y - r);
  ctx.lineTo(target.x + r, target.y - r + 9);
  ctx.moveTo(target.x + r, target.y + r - 9);
  ctx.lineTo(target.x + r, target.y + r);
  ctx.lineTo(target.x + r - 9, target.y + r);
  ctx.moveTo(target.x - r + 9, target.y + r);
  ctx.lineTo(target.x - r, target.y + r);
  ctx.lineTo(target.x - r, target.y + r - 9);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawObjectiveCompass(room) {
  const target = objectiveTarget(room);
  if (!target || player.hidden || gameOver || won) return;
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 76) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const px = player.x + nx * 42;
  const py = player.y + ny * 42 - 10;
  const angle = Math.atan2(ny, nx);
  const pulse = 0.72 + Math.sin(performance.now() / 150) * 0.2;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.globalAlpha = alert > 0 ? 0.48 : pulse;
  ctx.fillStyle = extractionActive ? "#f35d4c" : "#ffd65a";
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, -7);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-8, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#111514";
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "rgba(5, 7, 6, 0.72)";
  ctx.fillRect(px - 18, py + 12, 36, 12);
  ctx.fillStyle = extractionActive ? "#f35d4c" : "#f0edcf";
  ctx.font = "700 8px monospace";
  ctx.fillText(`${Math.round(dist / 10)}m`, px - 10, py + 21);
  ctx.globalAlpha = 1;
}

function drawWhiskerSense(room) {
  if (player.senseTimer <= 0) return;
  const alpha = Math.min(1, player.senseTimer / 0.35);
  const pulse = Math.sin(performance.now() / 90) * 4;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "rgba(126, 214, 200, 0.62)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 96 + pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(126, 214, 200, 0.26)";
  ctx.beginPath();
  ctx.arc(player.x, player.y, 176 - pulse, 0, Math.PI * 2);
  ctx.stroke();

  room.guards.forEach((guard) => {
    if (guard.stunned > 0) return;
    const dist = Math.hypot(guard.x - player.x, guard.y - player.y);
    if (dist > 245) return;
    const los = hasLineOfSight(player.x, player.y, guard.x, guard.y, room.walls);
    const risk = visionScore(guard, room) > 0 || guard.suspicion > 0.45;
    ctx.setLineDash(los ? [] : [5, 6]);
    ctx.strokeStyle = risk ? "rgba(243, 93, 76, 0.72)" : "rgba(255, 214, 90, 0.46)";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 8);
    ctx.lineTo(guard.x, guard.y - 18);
    ctx.stroke();
    ctx.fillStyle = risk ? "#f35d4c" : "#ffd65a";
    ctx.font = "700 9px monospace";
    ctx.fillText(`${Math.round(dist / 10)}m`, (player.x + guard.x) / 2, (player.y + guard.y) / 2 - 6);
  });

  room.cameras?.forEach((camera) => {
    if (!cameraActive(room, camera)) return;
    const dist = Math.hypot(camera.x - player.x, camera.y - player.y);
    if (dist > 280) return;
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = cameraVisionScore(room, camera) > 0 ? "rgba(243, 93, 76, 0.62)" : "rgba(126, 214, 200, 0.42)";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 8);
    ctx.lineTo(camera.x, camera.y);
    ctx.stroke();
  });

  noises.forEach((sound) => {
    ctx.setLineDash([]);
    ctx.strokeStyle = sound.kind === "meow" ? "rgba(126, 214, 200, 0.45)" : "rgba(255, 214, 90, 0.34)";
    ctx.beginPath();
    ctx.arc(sound.x, sound.y, sound.radius * 0.24, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(5, 7, 6, 0.72)";
  ctx.fillRect(player.x - 38, player.y + 24, 76, 13);
  ctx.fillStyle = "#7ed6c8";
  ctx.font = "700 9px monospace";
  ctx.fillText("WHISKER SENSE", player.x - 35, player.y + 34);
  ctx.restore();
  ctx.lineWidth = 1;
}

