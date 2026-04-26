"use strict";

function drawSidebar(room) {
  ctx.fillStyle = "#000";
  ctx.fillRect(PLAY_W, 0, VIEW_W - PLAY_W, H);
  ctx.fillStyle = "rgba(126,214,200,0.035)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(PLAY_W, y, PANEL_W, 1);
  ctx.fillStyle = "#111514";
  ctx.fillRect(PANEL_X + 5, 0, 3, H);
  drawHazardStrip(PANEL_X + 8, 178, PANEL_W - 18);
  drawHazardStrip(PANEL_X + 8, 550, PANEL_W - 18);

  ctx.fillStyle = "#071110";
  ctx.fillRect(PANEL_X + 12, 10, PANEL_W - 24, 24);
  ctx.strokeStyle = "#0cc083";
  ctx.strokeRect(PANEL_X + 12.5, 10.5, PANEL_W - 24, 24);
  ctx.fillStyle = "#0cc083";
  ctx.font = "700 13px monospace";
  ctx.fillText("MAP", PANEL_X + 20, 27);

  drawFacilityMap(room);

  const sweepActive = sweepTimer > 0;
  drawSideBox(PANEL_X + 12, 204, PANEL_W - 24, 76, "ALERT", alert > 0 ? "#f35d4c" : sweepActive ? "#ffd65a" : "#0cc083");
  ctx.fillStyle = alert > 0 ? "#f35d4c" : sweepActive ? "#ffd65a" : "#0cc083";
  ctx.font = "700 30px monospace";
  ctx.fillText(alert > 0 ? "!!!" : sweepActive ? "..." : "OK", PANEL_X + 78, 257);
  ctx.fillStyle = securityLevel >= 4 ? "#f35d4c" : securityLevel >= 2 ? "#ffd65a" : "#98a08f";
  ctx.font = "700 10px monospace";
  ctx.fillText(`SEC ${Math.ceil(securityLevel)}`, PANEL_X + 78, 270);
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i < Math.ceil(securityLevel) ? (securityLevel >= 4 ? "#f35d4c" : "#ffd65a") : "#29302e";
    ctx.fillRect(PANEL_X + 118 + i * 7, 263, 5, 8);
  }
  if (room.systemDown) {
    ctx.fillStyle = "#7ed6c8";
    ctx.font = "700 8px monospace";
    ctx.fillText("LOCAL OFF", PANEL_X + 118, 256);
  }
  ctx.strokeStyle = alert > 0 ? "#f35d4c" : "#0cc083";
  ctx.beginPath();
  ctx.moveTo(PANEL_X + 38, 246);
  ctx.lineTo(PANEL_X + 46, 232);
  ctx.lineTo(PANEL_X + 60, 232);
  ctx.lineTo(PANEL_X + 68, 246);
  ctx.lineTo(PANEL_X + 60, 260);
  ctx.lineTo(PANEL_X + 46, 260);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = "#071110";
  ctx.fillRect(PANEL_X + 12, 302, PANEL_W - 24, 76);
  ctx.strokeStyle = "#6f7b70";
  ctx.strokeRect(PANEL_X + 12.5, 302.5, PANEL_W - 24, 76);
  ctx.fillStyle = "#f0edcf";
  ctx.font = "700 13px monospace";
  ctx.fillText("LIFE", PANEL_X + 24, 324);
  for (let i = 0; i < MAX_LIFE; i += 1) {
    ctx.fillStyle = i < player.life ? "#f35d4c" : "#29302e";
    ctx.fillRect(PANEL_X + 24 + i * 38, 342, 30, 18);
  }
  ctx.fillStyle = "#98a08f";
  ctx.font = "700 10px monospace";
  ctx.fillText("SOUND", PANEL_X + 24, 372);
  ctx.fillStyle = soundMeter > 0.72 ? "#f35d4c" : soundMeter > 0.38 ? "#ffd65a" : "#7ed6c8";
  ctx.fillRect(PANEL_X + 70, 364, Math.round(82 * soundMeter), 8);
  ctx.strokeStyle = "#33413c";
  ctx.strokeRect(PANEL_X + 70.5, 363.5, 82, 9);

  drawSideBox(PANEL_X + 12, 398, PANEL_W - 24, 80, "RATION", "#7ed6c8");
  drawTunaCan(PANEL_X + 50, 446);
  ctx.fillStyle = "#f0edcf";
  ctx.font = "700 24px monospace";
  ctx.fillText(`x${player.rationsHeld}`, PANEL_X + 94, 452);
  ctx.fillStyle = player.rationsHeld > 0 ? "#7ed6c8" : "#46504a";
  ctx.font = "700 8px monospace";
  ctx.fillText("X USE", PANEL_X + 102, 468);

  drawSideBox(PANEL_X + 12, 498, PANEL_W - 24, 86, "ITEM", "#98a08f");
  drawKeycard(PANEL_X + 38, 545);
  ctx.fillStyle = "#f0edcf";
  ctx.font = "700 20px monospace";
  ctx.fillText(`x${player.keys}`, PANEL_X + 68, 552);
  ctx.fillStyle = room.intel?.done ? "#7ed6c8" : "#46504a";
  ctx.font = "700 9px monospace";
  ctx.fillText(room.intel?.done ? "MAP OK" : "NO MAP", PANEL_X + 24, 574);
  ctx.strokeStyle = "#46504a";
  ctx.strokeRect(PANEL_X + 106.5, 522.5, 28, 42);
  ctx.strokeRect(PANEL_X + 142.5, 522.5, 28, 42);
  ctx.fillStyle = player.boxed ? "#a4824a" : "#2b342d";
  ctx.fillRect(PANEL_X + 112, 538, 16, 14);
  ctx.fillStyle = player.boxed ? "#d0a45a" : "#46504a";
  ctx.fillRect(PANEL_X + 114, 541, 12, 3);
  ctx.strokeStyle = player.boxed ? "#ffd65a" : "#46504a";
  ctx.strokeRect(PANEL_X + 111.5, 537.5, 17, 15);
  ctx.fillStyle = player.boxed ? "#ffd65a" : "#46504a";
  ctx.font = "700 8px monospace";
  ctx.fillText("BOX", PANEL_X + 109, 562);
  drawYarnBall(PANEL_X + 156, 546, player.catnip > 0);
  ctx.fillStyle = player.catnip > 0 ? "#ffd65a" : "#46504a";
  ctx.font = "700 8px monospace";
  ctx.fillText(`x${player.catnip}`, PANEL_X + 148, 562);
  ctx.fillStyle = player.senseTimer > 0 ? "#7ed6c8" : player.senseCooldown > 0 ? "#46504a" : "#ffd65a";
  ctx.fillText(player.senseTimer > 0 ? "SENSE" : player.senseCooldown > 0 ? `${Math.ceil(player.senseCooldown)}s` : "F OK", PANEL_X + 62, 574);
  if (extractionActive) {
    ctx.fillStyle = "#ffd65a";
    ctx.font = "700 8px monospace";
    ctx.fillText("CARGO", PANEL_X + 136, 574);
  }

  const suspicion = maxSuspicion();
  ctx.fillStyle = "#071110";
  ctx.fillRect(PANEL_X + 12, 600, PANEL_W - 24, 28);
  ctx.strokeStyle = alert > 0 ? "#f35d4c" : "#33413c";
  ctx.strokeRect(PANEL_X + 12.5, 600.5, PANEL_W - 24, 28);
  ctx.fillStyle = suspicion > 0.65 ? "#f35d4c" : "#ffd65a";
  ctx.fillRect(PANEL_X + 20, 620, Math.round((PANEL_W - 40) * suspicion), 4);
  ctx.fillStyle = gameOver ? "#f35d4c" : won ? "#7ed6c8" : alert > 0 ? "#f35d4c" : sweepActive ? "#ffd65a" : "#ffd65a";
  ctx.font = "700 12px monospace";
  ctx.fillText(gameOver ? "MISSION FAIL" : won ? "TUNA SECURE" : alert > 0 ? "CONTACT" : sweepActive ? "TACTICAL SWEEP" : room.name.toUpperCase(), PANEL_X + 21, 616);
  ctx.fillStyle = "#98a08f";
  ctx.font = "700 9px monospace";
  ctx.fillText(objectiveText(room), PANEL_X + 21, 625);
  const target = objectiveTarget(room);
  if (target && !won && !gameOver) {
    const dist = Math.round(Math.hypot(target.x - player.x, target.y - player.y) / 10);
    ctx.fillStyle = extractionActive ? "#f35d4c" : "#ffd65a";
    ctx.fillText(`${dist}m`, PANEL_X + 150, 625);
  }

  const best = readBestRun();
  if (best) {
    ctx.fillStyle = "#98a08f";
    ctx.font = "700 9px monospace";
    ctx.fillText(`BEST ${best.rank} ${formatTime(best.time)}`, PANEL_X + 98, 616);
  }
}

function drawNotice() {
  const text = alert > 0 ? alertReason : noticeTimer > 0 ? noticeText : "";
  if (!text) return;
  ctx.fillStyle = "rgba(5, 9, 9, 0.88)";
  ctx.fillRect(128, 584, 504, 32);
  ctx.strokeStyle = alert > 0 ? "#f35d4c" : "#ffd65a";
  ctx.strokeRect(128.5, 584.5, 504, 32);
  ctx.fillStyle = alert > 0 ? "#f35d4c" : "#f0edcf";
  ctx.font = "700 16px monospace";
  const width = ctx.measureText(text).width;
  ctx.fillText(text, 380 - width / 2, 606);
}

function wrappedRadioLines(text, maxWidth) {
  const words = text.toUpperCase().split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function drawRadioCallout() {
  if (radioTimer <= 0 || !radioText) return;
  const alpha = Math.min(1, radioTimer / 0.25);
  const lines = wrappedRadioLines(radioText, 330);
  const h = 38 + lines.length * 16;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(5, 9, 9, 0.88)";
  ctx.fillRect(48, 42, 398, h);
  ctx.strokeStyle = "#7ed6c8";
  ctx.strokeRect(48.5, 42.5, 398, h);
  ctx.fillStyle = "#0cc083";
  ctx.fillRect(56, 51, 22, 22);
  ctx.fillStyle = "#071110";
  ctx.fillRect(62, 57, 10, 10);
  ctx.fillStyle = "#7ed6c8";
  ctx.font = "700 10px monospace";
  ctx.fillText("RADIO", 88, 58);
  ctx.fillStyle = "#f0edcf";
  ctx.font = "700 13px monospace";
  lines.forEach((line, index) => {
    ctx.fillText(line, 88, 76 + index * 16);
  });
  ctx.globalAlpha = 1;
}

function drawPauseOverlay() {
  if (!paused && !restartConfirm) return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
  ctx.fillRect(0, 0, VIEW_W, H);
  ctx.fillStyle = "#071110";
  ctx.fillRect(254, 238, 452, 136);
  ctx.strokeStyle = restartConfirm ? "#f35d4c" : "#ffd65a";
  ctx.strokeRect(254.5, 238.5, 452, 136);
  ctx.fillStyle = "#f0edcf";
  ctx.font = "700 28px monospace";
  ctx.fillText(restartConfirm ? "RESTART?" : "PAUSED", restartConfirm ? 392 : 426, 292);
  ctx.fillStyle = "#98a08f";
  ctx.font = "700 13px monospace";
  ctx.fillText(`TIME ${formatTime(missionTime)}   ALERTS ${stats.alerts}   HITS ${stats.hits}`, 336, 326);
  ctx.fillText(restartConfirm ? "PRESS R AGAIN TO CONFIRM" : "PRESS P OR ESC TO RESUME", restartConfirm ? 380 : 382, 350);
  if (restartConfirm) ctx.fillText("PRESS ANY OTHER KEY TO CANCEL", 366, 366);
}
