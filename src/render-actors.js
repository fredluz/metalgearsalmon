"use strict";

function drawVision(room, guard) {
  const dir = guard.dir || { x: 1, y: 0 };
  const angle = Math.atan2(dir.y, dir.x);
  const heightened = guard.state === "investigate" || guard.state === "callAlarm" || guard.state === "reinforce" || guard.state === "search" || guard.state === "sweep";
  const baseRange = guard.range || (heightened ? 205 : 176);
  const darkRange = room.systemDown ? (guard.darkRangeFactor ?? 0.52) : 1;
  const range = baseRange * darkRange;
  const spread = guard.spread || (guard.state === "search" || guard.state === "sweep" ? 0.68 : 0.52);
  const tint = guard.suspicion > 0.6 ? "243, 93, 76" : "255, 214, 90";
  const rays = 24;
  const points = [];
  for (let i = 0; i <= rays; i += 1) {
    const t = i / rays;
    points.push(castVisionRay(room, guard.x, guard.y, angle - spread + spread * 2 * t, range));
  }

  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  points.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fillStyle = `rgba(${tint}, ${0.12 + guard.suspicion * 0.12})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${tint}, 0.18)`;
  ctx.stroke();
}

function drawCameraVision(room, camera) {
  if (!cameraActive(room, camera)) return;
  const angle = cameraAngle(camera);
  const spread = 0.38;
  const tint = (camera.suspicion || 0) > 0.55 || securityLevel >= 4 ? "243, 93, 76" : "126, 214, 200";
  const points = [];
  const range = camera.range * (1 + securityLevel * 0.06);
  for (let i = 0; i <= 18; i += 1) {
    const t = i / 18;
    points.push(castVisionRay(room, camera.x, camera.y, angle - spread + spread * 2 * t, range));
  }
  ctx.beginPath();
  ctx.moveTo(camera.x, camera.y);
  points.forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fillStyle = `rgba(${tint}, ${0.10 + (camera.suspicion || 0) * 0.1})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${tint}, 0.18)`;
  ctx.stroke();
}

function drawPixelCat(x, y, facing, colors, scale) {
  const flip = facing.x < -0.15 ? -1 : 1;
  const headLift = facing.y < -0.35 ? -2 : facing.y > 0.35 ? 2 : 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(flip * scale, scale);
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(-8, 8, 18, 5);
  ctx.fillStyle = colors.body;
  ctx.fillRect(-6, -5, 11, 12);
  ctx.fillRect(3, -10 + headLift, 7, 8);
  ctx.fillRect(4, -13 + headLift, 2, 4);
  ctx.fillRect(8, -13 + headLift, 2, 4);
  ctx.fillRect(-10, -4, 5, 4);
  ctx.fillRect(-12, -8, 3, 6);
  ctx.fillRect(-5, 7, 3, 4);
  ctx.fillRect(2, 7, 3, 4);
  ctx.fillStyle = colors.trim;
  ctx.fillRect(-5, -4, 3, 10);
  ctx.fillStyle = colors.eye;
  ctx.fillRect(8, -7 + headLift, 1, 1);
  ctx.fillRect(8, -4 + headLift, 1, 1);
  ctx.restore();
}

function drawSpriteFrame(frame, x, y, scale, flip) {
  const col = frame % 4;
  const row = Math.floor(frame / 4);
  const size = Math.round(SPRITE * scale);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(
    spriteSheet,
    col * SPRITE,
    row * SPRITE,
    SPRITE,
    SPRITE,
    -size / 2,
    -size + 12,
    size,
    size
  );
  ctx.restore();
}

function directionRow(facing, includeDiagonals = false) {
  if (includeDiagonals && Math.abs(facing.x) > 0.25 && Math.abs(facing.y) > 0.25) {
    if (facing.y > 0) return facing.x > 0 ? 4 : 5;
    return facing.x > 0 ? 6 : 7;
  }
  if (Math.abs(facing.x) > Math.abs(facing.y)) return facing.x < 0 ? 1 : 2;
  return facing.y > 0 ? 0 : 3;
}

function animationColumn(moving, speedOffset) {
  if (!moving) return 0;
  return Math.floor((performance.now() / 140 + speedOffset) % 4);
}

function drawSheetFrame(sheet, col, row, x, y, scale) {
  const size = Math.round(SPRITE * scale);
  ctx.drawImage(
    sheet,
    col * SPRITE,
    row * SPRITE,
    SPRITE,
    SPRITE,
    Math.round(x - size / 2),
    Math.round(y - size + 13),
    size,
    size
  );
}

function drawAnimatedSprite(sheet, x, y, facing, moving, scale, speedOffset, includeDiagonals = false) {
  const row = directionRow(facing, includeDiagonals);
  const col = animationColumn(moving, speedOffset);
  drawSheetFrame(sheet, col, row, x, y, scale);
}

function drawEnemyStateSprite(x, y, state, scale, speedOffset) {
  const row = state === "alert" ? 1 : 0;
  const col = animationColumn(true, speedOffset);
  drawSheetFrame(enemyAlertSheet, col, row, x, y, scale);
}

function drawCatSprite(x, y, facing, variant) {
  if (variant === "player" && playerWalkReady) {
    drawAnimatedSprite(playerWalkSheet, x, y, facing, player.moving, 0.78, 0, playerWalkSheet.height >= SPRITE * 8);
    return true;
  }

  if (variant === "investigating" && enemyFlashlightReady) {
    drawAnimatedSprite(enemyFlashlightSheet, x, y, facing, true, 0.66, (x + y) * 0.01);
    return true;
  }

  if (variant === "alert" && enemyAlertReady) {
    drawEnemyStateSprite(x, y, "alert", 0.64, (x + y) * 0.01);
    return true;
  }

  if (variant === "guard" && enemyWalkReady) {
    drawAnimatedSprite(enemyWalkSheet, x, y, facing, true, 0.62, (x + y) * 0.01);
    return true;
  }

  if (!spritesReady) return false;
  const flip = facing.x < -0.15;
  const frameMap = {
    player: player.hidden ? 4 : facing.y < -0.35 ? 1 : 0,
    guard: 2,
    investigating: 5,
    alert: 6,
  };
  const scale = variant === "player" ? 0.72 : 0.62;
  drawSpriteFrame(frameMap[variant] ?? 0, x, y, scale, flip);
  return true;
}

function drawGuard(guard) {
  if (guard.stunned > 0) {
    ctx.globalAlpha = 0.72;
  }
  const variant = guard.suspicion > 0.72 ? "alert" : guard.state === "investigate" || guard.state === "callAlarm" || guard.state === "reinforce" || guard.state === "search" || guard.state === "sweep" ? "investigating" : "guard";
  if (!drawCatSprite(guard.x, guard.y, guard.dir || { x: 1, y: 0 }, variant)) {
    drawPixelCat(guard.x, guard.y, guard.dir || { x: 1, y: 0 }, {
      body: guard.state === "investigate" || guard.state === "callAlarm" || guard.state === "reinforce" || guard.state === "search" || guard.state === "sweep" ? "#c76145" : "#9f4a37",
      trim: "#3a1f1a",
      eye: "#fff2a8",
    }, 1);
  }
  ctx.globalAlpha = 1;

  if (guard.stunned > 0) {
    ctx.fillStyle = "#7ed6c8";
    ctx.font = "700 13px monospace";
    ctx.fillText("Zz", guard.x - 8, guard.y - 42);
    ctx.strokeStyle = "rgba(126, 214, 200, 0.75)";
    ctx.strokeRect(guard.x - 18, guard.y - 26, 36, 30);
    if (guard.reported) {
      ctx.fillStyle = "#f35d4c";
      ctx.fillRect(guard.x - 20, guard.y - 30, 5, 5);
    }
    return;
  }

  if (guard.suspicion > 0.05) {
    const w = 34;
    ctx.fillStyle = "#111514";
    ctx.fillRect(guard.x - w / 2, guard.y - 34, w, 5);
    ctx.fillStyle = guard.suspicion > 0.72 ? "#f35d4c" : "#ffd65a";
    ctx.fillRect(guard.x - w / 2, guard.y - 34, w * guard.suspicion, 5);
  }

  if (guard.state === "investigate" || guard.state === "callAlarm" || guard.state === "reinforce" || guard.state === "search" || guard.state === "sweep") {
    ctx.fillStyle = guard.suspicion > 0.72 ? "#f35d4c" : "#ffd65a";
    ctx.font = "700 18px monospace";
    ctx.fillText(guard.suspicion > 0.72 ? "!" : guard.state === "sweep" ? "*" : guard.state === "reinforce" ? ">" : guard.state === "callAlarm" ? "!" : "?", guard.x - 5, guard.y - 42);
  } else if ((guard.pauseTimer || 0) > 0) {
    ctx.fillStyle = "#98a08f";
    ctx.font = "700 13px monospace";
    ctx.fillText("...", guard.x - 9, guard.y - 42);
  }
}

function wrapBubbleText(text, maxChars = 18) {
  const words = text.toUpperCase().split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function drawGuardBarks() {
  guardBarks.forEach((bark) => {
    const guard = bark.guard;
    if (!guard || guard.stunned > 0) return;
    const alpha = clamp(bark.ttl / bark.maxTtl, 0, 1);
    const lines = wrapBubbleText(bark.text);
    const textWidth = Math.max(...lines.map((line) => line.length)) * 6;
    const w = Math.max(42, textWidth + 14);
    const h = 14 + lines.length * 10;
    const x = Math.round(guard.x - w / 2);
    const y = Math.round(guard.y - 76 - (1 - alpha) * 6);

    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.25);
    ctx.fillStyle = "rgba(5, 9, 9, 0.9)";
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(guard.x - 4, y + h - 1, 8, 8);
    ctx.strokeStyle = guard.suspicion > 0.65 ? "#f35d4c" : "#ffd65a";
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.fillStyle = guard.suspicion > 0.65 ? "#ffb0a5" : "#f0edcf";
    ctx.font = "700 9px monospace";
    lines.forEach((line, index) => {
      ctx.fillText(line, x + 7, y + 12 + index * 10);
    });
    ctx.restore();
  });
}

function drawNoises() {
  noises.forEach((sound) => {
    const progress = 1 - sound.ttl / sound.maxTtl;
    const radius = sound.radius * progress;
    ctx.strokeStyle = sound.color;
    ctx.globalAlpha = 1 - progress;
    ctx.lineWidth = sound.kind === "meow" ? 3 : 2;
    ctx.beginPath();
    ctx.arc(sound.x, sound.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    if (sound.kind === "meow") {
      ctx.font = "700 12px monospace";
      ctx.fillStyle = "#7ed6c8";
      ctx.fillText(sound.label, sound.x - 16, sound.y - radius - 6);
    }
    ctx.globalAlpha = 1;
  });
}

function drawShots() {
  shots.forEach((shot) => {
    const alpha = shot.ttl / shot.maxTtl;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = shot.hit ? "#ffef9a" : "#f35d4c";
    ctx.lineWidth = shot.hit ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(shot.x1, shot.y1);
    ctx.lineTo(shot.x2, shot.y2);
    ctx.stroke();
    ctx.fillStyle = "#f35d4c";
    ctx.fillRect(shot.x1 - 3, shot.y1 - 3, 6, 6);
    ctx.globalAlpha = 1;
  });
}

function drawAimTelegraphs(room) {
  room.guards.forEach((guard) => {
    if (guard.aimTimer <= 0 || !guard.aimTarget) return;
    const progress = 1 - guard.aimTimer / (guard.aimMax || 0.4);
    const end = castVisionRay(room, guard.x, guard.y, Math.atan2(guard.dir.y, guard.dir.x), 235);
    ctx.globalAlpha = 0.38 + progress * 0.42;
    ctx.strokeStyle = progress > 0.72 ? "#ffef9a" : "#f35d4c";
    ctx.lineWidth = progress > 0.72 ? 3 : 2;
    ctx.setLineDash(progress > 0.72 ? [] : [8, 7]);
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y - 14);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f35d4c";
    ctx.fillRect(guard.x - 10, guard.y - 48, 20, 5);
    ctx.fillStyle = "#ffef9a";
    ctx.fillRect(guard.x - 10, guard.y - 48, 20 * progress, 5);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
  });
}

function drawPawPrints() {
  pawPrints.forEach((print) => {
    const alpha = (print.ttl / print.maxTtl) * (print.fresh ? 0.42 : 0.24);
    ctx.fillStyle = print.fresh ? `rgba(255, 214, 90, ${alpha})` : `rgba(240, 237, 207, ${alpha})`;
    const offset = print.flip ? 3 : -3;
    ctx.fillRect(print.x + offset - 2, print.y - 2, 4, 3);
    ctx.fillRect(print.x + offset + 2, print.y - 6, 2, 2);
    ctx.fillRect(print.x + offset - 3, print.y - 6, 2, 2);
  });
}

function drawLastKnown() {
  if (!lastKnown) return;
  const alpha = lastKnown.ttl / lastKnown.maxTtl;
  ctx.strokeStyle = `rgba(243, 93, 76, ${0.35 + alpha * 0.45})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(lastKnown.x - 13, lastKnown.y - 13, 26, 26);
  ctx.beginPath();
  ctx.moveTo(lastKnown.x - 18, lastKnown.y);
  ctx.lineTo(lastKnown.x + 18, lastKnown.y);
  ctx.moveTo(lastKnown.x, lastKnown.y - 18);
  ctx.lineTo(lastKnown.x, lastKnown.y + 18);
  ctx.stroke();
  ctx.lineWidth = 1;
}
