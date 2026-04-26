"use strict";
  function propExitCandidates(room, prop) {
    const rect = hidePropRect(prop);
    const center = hidePropCenter(prop);
    const candidates = [];
    if (player.insideProp && Number.isFinite(player.insideProp.exitX) && Number.isFinite(player.insideProp.exitY)) {
      candidates.push({ x: player.insideProp.exitX, y: player.insideProp.exitY });
    }
    const distances = [player.r + 10, player.r + 24, player.r + 40];
    const edges = [
      { x: center.x, y: rect.y - player.r - 8 },
      { x: center.x, y: rect.y + rect.h + player.r + 8 },
      { x: rect.x - player.r - 8, y: center.y },
      { x: rect.x + rect.w + player.r + 8, y: center.y },
    ];
    edges.forEach((point) => candidates.push(point));
    for (let step = 0; step < 16; step += 1) {
      const angle = (Math.PI * 2 * step) / 16;
      distances.forEach((distance) => {
        candidates.push({
          x: center.x + Math.cos(angle) * (prop.w / 2 + distance),
          y: center.y + Math.sin(angle) * (prop.h / 2 + distance),
        });
      });
    }
    return candidates
      .map((point) => ({
        x: clamp(point.x, player.r, roomWidth(room) - player.r),
        y: clamp(point.y, player.r, roomHeight(room) - player.r),
      }))
      .sort((a, b) => Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y));
  }

  function exitHideProp(room, prop) {
    const exit = propExitCandidates(room, prop).find((point) => !movementBlocked(room, point.x, point.y, player.r));
    if (!exit) {
      notice("EXIT BLOCKED: STAY HIDDEN", 0.9);
      return false;
    }
    player.x = exit.x;
    player.y = exit.y;
    player.insideProp = null;
    player.hidden = false;
    player.ventHidden = 0;
    player.entryGrace = Math.max(player.entryGrace, 0.35);
    roomFlash = 0.35;
    playCue("pickup");
    notice("COVER EXITED", 0.8);
    return true;
  }

  function enterHideProp(room, prop) {
    const center = hidePropCenter(prop);
    player.insideProp = {
      room: player.room,
      id: prop.id,
      exitX: player.x,
      exitY: player.y,
    };
    player.x = center.x;
    player.y = center.y;
    player.hidden = true;
    player.boxed = false;
    player.ventHidden = 0;
    player.moving = false;
    roomFlash = 0.35;
    playCue("pickup");
    notice(`HIDDEN INSIDE ${propHideLabel(prop)}`, 1);
  }

  function interact() {
    if (won || gameOver) return;
    const room = rooms[player.room];

    const insideProp = playerInsideProp(room);
    if (insideProp) {
      exitHideProp(room, insideProp);
      return;
    }

    const guard = scratchableGuard(room);
    if (guard) {
      scratchGuard(room, guard);
      return;
    }

    if (room.boatTransfers) {
      const boat = room.boatTransfers.find((candidate) => nearRect(candidate, 34));
      if (boat) {
        const entryX = boat.x + boat.w / 2;
        const entryY = boat.y + boat.h / 2;
        player.x = boat.tx;
        player.y = boat.ty;
        player.hidden = false;
        player.ventHidden = 0;
        player.insideProp = null;
        player.entryGrace = Math.max(player.entryGrace, 0.45);
        roomFlash = 0.55;
        makeNoise(entryX, entryY, 128, 0.46, "rgba(255, 214, 90, 0.58)", "BOAT", "boat");
        makeNoise(player.x, player.y, 108, 0.42, "rgba(255, 214, 90, 0.48)", "DOCK", "boat");
        sayNearestGuard(room, entryX, entryY, "boat creak");
        playCue("room");
        notice(boat.label === "NEXT" ? "BOAT RELEASED: NEXT DOCK" : "BOAT RELEASED: CROSSING", 1.15);
        return;
      }
    }

    if (room.vents) {
      const vent = room.vents.find((candidate) => nearRect(candidate, 30));
      if (vent) {
        const entryX = vent.x + vent.w / 2;
        const entryY = vent.y + vent.h / 2;
        player.x = vent.tx;
        player.y = vent.ty;
        player.hidden = true;
        player.ventHidden = 2.4;
        player.insideProp = null;
        roomFlash = 0.55;
        addVentRattle(entryX, entryY);
        addVentRattle(player.x, player.y);
        makeNoise(entryX, entryY, 128, 0.46, "rgba(126, 214, 200, 0.62)", "GRATE", "vent");
        makeNoise(player.x, player.y, 116, 0.46, "rgba(126, 214, 200, 0.6)", "VENT", "vent");
        alert = Math.max(0, alert - 0.9);
        sayNearestGuard(room, entryX, entryY, "vent rattle");
        playCue("room");
        notice("DUCT ROUTE USED: STAY LOW", 1.1);
        return;
      }
    }

    const hideProp = enterableHideProps(room).find((candidate) => nearRect(hidePropRect(candidate), 38));
    if (hideProp) {
      enterHideProp(room, hideProp);
      return;
    }

    if (room.backpack && !room.backpack.taken && nearRect(room.backpack, 36)) {
      room.backpack.taken = true;
      player.gearRecovered = true;
      roomFlash = 0.55;
      playCue("pickup");
      notice("GEAR RECOVERED: FIND THE GENERATOR", 1.45);
      return;
    }

    if (room.exitZone && nearRect(room.exitZone, 38)) {
      if (!player.gearRecovered) {
        notice("GEAR STILL ON THE DOCK", 1);
        return;
      }
      if (!room.systemDown) {
        notice("LIGHTS STILL COVER THE EXIT", 1);
        return;
      }
      completeMission();
      return;
    }

    if (room.panels) {
      const panel = room.panels.find((candidate) => !candidate.done && nearRect(candidate, 32));
      if (panel) {
        panel.done = true;
        if (room.intel && Math.abs((panel.x + panel.w / 2) - (room.intel.x + room.intel.w / 2)) < 8 && Math.abs((panel.y + panel.h / 2) - (room.intel.y + room.intel.h / 2)) < 8) {
          room.intel.done = true;
        }
        room.systemDown = true;
        if (room.alarm) room.alarm.disabled = true;
        if (!extractionActive) securityLevel = Math.max(0, securityLevel - 1.1);
        roomFlash = 0.7;
        makeNoise(panel.x + panel.w / 2, panel.y + panel.h / 2, 124, 0.5, "rgba(255, 214, 90, 0.65)", "SCRATCH", "scratch");
        playCue("pickup");
        radio(panel.type === "generator" ? "CP: dock lights offline" : "CP: local security offline");
        notice(panel.type === "generator" ? "GENERATOR CLAWED: LIGHTS OUT" : room.intel?.text || "SECURITY PANEL CLAWED: ALARM OFF", 2.2);
        return;
      }
    }

    if (room.alarm && !room.alarm.disabled && nearRect(room.alarm, 34)) {
      room.alarm.disabled = true;
      room.alarm.triggered = false;
      roomFlash = 0.58;
      makeNoise(room.alarm.x + room.alarm.w / 2, room.alarm.y + room.alarm.h / 2, 92, 0.35, "rgba(255, 214, 90, 0.5)", "SNIP", "scratch");
      playCue("pickup");
      notice("ALARM BUTTON DISABLED", 1.15);
      return;
    }

    if (room.intel && !room.intel.done && nearRect(room.intel, 34)) {
      room.intel.done = true;
      roomFlash = 0.5;
      makeNoise(room.intel.x + room.intel.w / 2, room.intel.y + room.intel.h / 2, 94, 0.36, "rgba(126, 214, 200, 0.58)", "DATA", "intel");
      playCue("pickup");
      notice(room.intel.text, 2.2);
      return;
    }

    const keycard = roomKeycards(room).find((candidate) => !candidate.taken && Math.hypot(player.x - candidate.x, player.y - candidate.y) < 44);
    if (keycard) {
      keycard.taken = true;
      player.keys += 1;
      roomFlash = 0.55;
      playCue("pickup");
      notice("COLLAR TAG ACQUIRED", 1.2);
      return;
    }

    const ration = room.rations?.find((candidate) => !candidate.taken && Math.hypot(player.x - candidate.x, player.y - candidate.y) < 42);
    if (ration) {
      if (player.rationsHeld >= 3) {
        notice("RATION POUCH FULL", 0.9);
        return;
      }
      ration.taken = true;
      player.rationsHeld += 1;
      roomFlash = 0.45;
      playCue("pickup");
      notice("TUNA RATION STORED", 1.2);
      return;
    }

    const catnipPickup = room.catnipPickups?.find((candidate) => !candidate.taken && Math.hypot(player.x - candidate.x, player.y - candidate.y) < 42);
    if (catnipPickup) {
      if (player.catnip >= 3) {
        notice("YARN STASH FULL", 0.9);
        return;
      }
      catnipPickup.taken = true;
      player.catnip = Math.min(3, player.catnip + 1);
      roomFlash = 0.38;
      playCue("pickup");
      notice("YARN BALL ACQUIRED", 1.05);
      return;
    }

    if (room.tuna && !room.tuna.taken && Math.hypot(player.x - room.tuna.x, player.y - room.tuna.y) < 52) {
      room.tuna.taken = true;
      playCue("pickup");
      startExtraction(room);
    }
  }

  function update(dt) {
    if (paused) {
      updateHud();
      return;
    }

    if (won || gameOver) {
      updateHud();
      return;
    }

    missionTime += dt;
    roomTime += dt;
    if (player.meowCooldown > 0) player.meowCooldown = Math.max(0, player.meowCooldown - dt);
    if (player.senseCooldown > 0) player.senseCooldown = Math.max(0, player.senseCooldown - dt);
    if (player.senseTimer > 0) player.senseTimer = Math.max(0, player.senseTimer - dt);
    if (player.ventHidden > 0) player.ventHidden = Math.max(0, player.ventHidden - dt);
    if (player.entryGrace > 0) player.entryGrace = Math.max(0, player.entryGrace - dt);
    if (player.doorCooldown > 0) player.doorCooldown = Math.max(0, player.doorCooldown - dt);
    if (player.hitCooldown > 0) player.hitCooldown = Math.max(0, player.hitCooldown - dt);
    if (noticeTimer > 0) noticeTimer = Math.max(0, noticeTimer - dt);
    if (radioTimer > 0) radioTimer = Math.max(0, radioTimer - dt);
    shake = Math.max(0, shake - dt * 18);
    soundMeter = Math.max(0, soundMeter - dt * 1.7);
    if (alert <= 0 && player.hidden) securityLevel = Math.max(0, securityLevel - dt * 0.075);
    roomFlash = Math.max(0, roomFlash - dt);

    prepareSectorSimulation();
    const room = rooms[player.room];

    movePlayer(dt);
    player.hidden = player.ventHidden > 0
      || Boolean(playerInsideProp(room))
      || room.hiding.some((spot) => circleRect(player.x, player.y, player.r, spot))
      || (player.soft && inShadow(room))
      || boxCover(room);

    updateCatnips(room, dt);
    updateTunaScent(dt);
    updateVentRattles(dt);
    updateTacticalPings(dt);
    updateGuardBarks(dt);
    applyFreshNoises(room);
    applyFreshPawPrints(room);
    updateNoises(dt);
    updateShots(dt);
    updatePawPrints(dt);
    updateSensorSweeps(room);
    updateCameras(room, dt);
    updateGuards(room, dt);
    updateOffscreenReinforcements(dt);
    updateDirector(room, dt);
    updateBriefings(room);

    if (alert > 0) {
      const pressure = maxSuspicion();
      const decay = player.hidden ? 1.65 : pressure < 0.3 ? 0.55 : 0.16;
      alert = Math.max(0, alert - dt * decay);
      if (alert <= 0) {
        alertReason = "";
        rooms.forEach((candidate) => {
          if (candidate.alarm) candidate.alarm.triggered = false;
        });
        startRoomSweep(room);
      }
    }
    if (sweepTimer > 0) sweepTimer = Math.max(0, sweepTimer - dt);

    const lockedDoor = player.doorCooldown <= 0
      ? roomDoors(room).find((candidate) => !doorUnlocked(candidate) && circleRect(player.x, player.y, player.r, doorTriggerRect(candidate)))
      : null;
    if (lockedDoor) {
      roomFlash = 0.16;
      notice(`TAG ${lockedDoor.need} REQUIRED`, 0.5);
    }

    if (room.lasers && !room.systemDown) {
      room.lasers.forEach((laser) => {
        const active = Math.sin(performance.now() / 380 + laser.phase) > -0.15;
        if (active && !player.hidden && circleRect(player.x, player.y, player.r, laser)) {
          triggerCaught("LASER TRIP");
        }
      });
    }

    if (extractionActive && player.room === START_ROOM && Math.hypot(player.x - rooms[START_ROOM].start.x, player.y - rooms[START_ROOM].start.y) < 38) {
      completeMission();
    }

    updateHud();
  }
