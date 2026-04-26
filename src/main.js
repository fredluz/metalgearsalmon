"use strict";

function draw() {
  const room = rooms[player.room];
  const jitterX = alert > 0 ? Math.round(Math.sin(performance.now() / 30) * shake) : 0;
  const jitterY = alert > 0 ? Math.round(Math.cos(performance.now() / 37) * shake) : 0;
  refreshWorldActivity();

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, VIEW_W, H);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, PLAY_W, H);
  ctx.clip();
  ctx.translate(jitterX, jitterY);
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
  withRoomView(room, () => {
    drawPawPrints();
    drawObjectiveMarker(room);
    drawTacticalRoute(room);
    drawGuardForecasts(room);
    drawObjectiveCompass(room);
    drawWhiskerSense(room);
    drawNoises();
    drawRadioLinks(room);
    drawLastKnown();
    drawAimTelegraphs(room);
    drawShots();
    drawGuardBarks();
    drawPlayer();
    drawPrompts(room);
  });
  ctx.restore();

  drawSidebar(room);
  drawRadioCallout();
  drawNotice();
  drawPauseOverlay();

  if (alert > 0) {
    ctx.fillStyle = `rgba(243, 93, 76, ${0.10 + Math.sin(performance.now() / 90) * 0.04})`;
    ctx.fillRect(0, 0, PLAY_W, H);
    ctx.fillStyle = "#ffb0a5";
    ctx.font = "700 25px monospace";
    ctx.fillText("ALERT", PLAY_W - 104, 52);
  }

  if (roomFlash > 0) {
    ctx.fillStyle = `rgba(255, 214, 90, ${roomFlash * 0.16})`;
    ctx.fillRect(0, 0, PLAY_W, H);
  }
}

function loop(now) {
  const dt = Math.min(0.035, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  ensureAudio();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "shift", "q", "f", "x"].includes(key)) {
    event.preventDefault();
  }
  if ((key === "p" || key === "escape") && !won && !gameOver) {
    paused = !paused;
    notice(paused ? "MISSION PAUSED" : "MISSION RESUMED", 0.8);
    return;
  }
  keys.add(key);
  if (key === "r") reset();
  if (paused) return;
  if (key === "e") interact();
  if (key === " ") emitMeow();
  if (key === "q" && !event.repeat) throwYarnBall();
  if (key === "f" && !event.repeat) activateWhiskerSense();
  if (key === "x" && !event.repeat) useRation();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

reset();
requestAnimationFrame(loop);
