"use strict";
  function notice(text, seconds) {
    noticeText = text;
    noticeTimer = seconds;
  }

  function radio(text, seconds = 1.35) {
    if (radioTimer > 0.4 && radioText === text) return;
    radioText = text;
    radioTimer = seconds;
  }

  function guardLine(text) {
    return text.replace(/^GUARD:\s*/i, "");
  }

  function sayGuard(guard, text, seconds = 1.35) {
    if (!guard || guard.stunned > 0) return;
    const line = guardLine(text);
    const existing = guardBarks.find((bark) => bark.guard === guard);
    if (existing) {
      existing.text = line;
      existing.ttl = seconds;
      existing.maxTtl = seconds;
      return;
    }
    guardBarks.push({ guard, text: line, ttl: seconds, maxTtl: seconds });
  }

  function nearestGuard(room, x, y, range = 220) {
    return (room.guards || [])
      .filter((guard) => guard.stunned <= 0)
      .map((guard) => ({ guard, dist: Math.hypot(guard.x - x, guard.y - y) }))
      .filter((candidate) => candidate.dist <= range)
      .sort((a, b) => a.dist - b.dist)[0]?.guard || null;
  }

  function sayNearestGuard(room, x, y, text, seconds = 1.35, range = 220) {
    sayGuard(nearestGuard(room, x, y, range), text, seconds);
  }

  function ensureAudio() {
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioContext = new AudioCtor();
    }
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function beep(freq, duration, type, gainValue) {
    const audio = ensureAudio();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue || 0.025, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  }

  function playCue(name) {
    if (name === "meow") {
      beep(760, 0.08, "triangle", 0.035);
      setTimeout(() => beep(980, 0.08, "triangle", 0.03), 70);
    } else if (name === "pickup") {
      beep(980, 0.05, "square", 0.03);
      setTimeout(() => beep(1320, 0.07, "square", 0.025), 55);
    } else if (name === "alert") {
      beep(180, 0.16, "sawtooth", 0.04);
      setTimeout(() => beep(140, 0.18, "sawtooth", 0.035), 120);
    } else if (name === "shot") {
      beep(95, 0.045, "square", 0.045);
    } else if (name === "hit") {
      beep(70, 0.18, "sawtooth", 0.05);
    } else if (name === "room") {
      beep(420, 0.07, "square", 0.025);
      setTimeout(() => beep(640, 0.08, "square", 0.02), 80);
    } else if (name === "yarn") {
      beep(520, 0.04, "triangle", 0.025);
      setTimeout(() => beep(460, 0.05, "triangle", 0.02), 40);
    }
  }

  function maxSuspicion() {
    return rooms[player.room].guards.reduce((max, guard) => Math.max(max, guard.suspicion || 0), 0);
  }

  function remainingRations(room) {
    return room.rations?.filter((ration) => !ration.taken).length || 0;
  }

  function roomKeycards(room) {
    return room.keycards || (room.keycard ? [room.keycard] : []);
  }

  function nextKeycard(room) {
    return roomKeycards(room).find((keycard) => !keycard.taken) || null;
  }

  function inShadow(room) {
    return room.shadows?.some((shadow) => circleRect(player.x, player.y, player.r, shadow)) || false;
  }

  function boxCompromised(room) {
    if (!player.boxed) return false;
    return room.guards.some((guard) => {
      if (guard.stunned > 0) return false;
      const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
      return dist < 54 && hasLineOfSight(guard.x, guard.y, player.x, player.y, room.walls);
    });
  }

  function boxCover(room) {
    return player.boxed && !player.moving && !boxCompromised(room);
  }

  function nearPlausibleBoxSpot(room) {
    const playerRect = { x: player.x - 18, y: player.y - 14, w: 36, h: 28 };
    const coverRects = [
      ...(room.hiding || []),
      ...(room.props || []).filter((prop) => prop.type === "crate"),
    ];
    return coverRects.some((rect) => {
      const expanded = { x: rect.x - 36, y: rect.y - 36, w: rect.w + 72, h: rect.h + 72 };
      return rectsOverlap(playerRect, expanded);
    });
  }

  function boxAnomalyScore(guard, room) {
    if (!player.boxed || guard.stunned > 0) return 0;
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 172 || dist < 1) return 0;
    if (!hasLineOfSight(guard.x, guard.y, player.x, player.y, room.walls)) return 0;
    const dir = guard.dir || { x: 1, y: 0 };
    const dot = (dx / dist) * dir.x + (dy / dist) * dir.y;
    if (dot < Math.cos(0.78)) return 0;
    if (player.moving) return clamp(1.05 - dist / 240, 0.22, 0.9);
    if (nearPlausibleBoxSpot(room)) return 0;
    return dist < 78 ? clamp(0.2 - dist / 520, 0.04, 0.12) : 0;
  }

  function securityFactor() {
    return 1 + securityLevel * 0.08;
  }

  function facilityPressure() {
    return 1 + securityLevel * 0.1 + (extractionActive ? 0.22 : 0);
  }

  function roomDoors(room) {
    return room?.doors || [];
  }

  function doorCenter(door) {
    return { x: door.x + door.w / 2, y: door.y + door.h / 2 };
  }

  function doorApproach(door) {
    return door.approach || doorCenter(door);
  }

  function roomForDoor(door) {
    return Number.isFinite(door.roomIndex) ? rooms[door.roomIndex] : rooms[player.room];
  }

  function doorTarget(door) {
    return {
      x: doorApproach(door).x,
      y: doorApproach(door).y,
      r: Math.max(door.w, door.h) / 2,
    };
  }

  function doorUnlocked(door) {
    return player.keys >= (door.need || 0);
  }

  function doorTriggerRect(door) {
    if (door.trigger) return door.trigger;
    const room = roomForDoor(door);
    const w = roomWidth(room);
    const h = roomHeight(room);
    if (door.y <= 0) return { x: door.x + 10, y: 28, w: Math.max(20, door.w - 20), h: 18 };
    if (door.y + door.h >= h) return { x: door.x + 10, y: h - 46, w: Math.max(20, door.w - 20), h: 18 };
    if (door.x <= 0) return { x: 28, y: door.y + 10, w: 18, h: Math.max(20, door.h - 20) };
    if (door.x + door.w >= w) return { x: w - 46, y: door.y + 10, w: 18, h: Math.max(20, door.h - 20) };
    const point = doorApproach(door);
    return { x: point.x - 30, y: point.y - 30, w: 60, h: 60 };
  }

  function doorBlockRect(door) {
    return door.block || { x: door.x, y: door.y, w: door.w, h: door.h };
  }

  function connectedDoors(roomIndex, ignoreLocks = false) {
    return roomDoors(rooms[roomIndex]).filter((door) => ignoreLocks || doorUnlocked(door));
  }

  function nextDoorToward(fromRoom, goalRoom, ignoreLocks = false) {
    if (fromRoom === goalRoom) return null;
    const queue = [{ room: fromRoom, firstDoor: null }];
    const visited = new Set([fromRoom]);
    while (queue.length) {
      const current = queue.shift();
      for (const door of connectedDoors(current.room, ignoreLocks)) {
        if (visited.has(door.to)) continue;
        const firstDoor = current.firstDoor || door;
        if (door.to === goalRoom) return firstDoor;
        visited.add(door.to);
        queue.push({ room: door.to, firstDoor });
      }
    }
    return null;
  }

  function lockedProgressDoor(room) {
    return roomDoors(room)
      .filter((door) => !doorUnlocked(door))
      .sort((a, b) => (a.need || 0) - (b.need || 0))[0] || null;
  }

  function primaryDoorObjective(room) {
    const roomIndex = rooms.indexOf(room);
    if (extractionActive) return nextDoorToward(roomIndex, START_ROOM);
    const progressStage = clamp(player.keys, 1, REQUIRED_TAGS);
    const progressDoor = roomDoors(room).find((door) => door.progress === progressStage);
    if (progressDoor) return progressDoor;
    const forwardDoor = nextDoorToward(roomIndex, FINAL_ROOM, true);
    return forwardDoor
      || lockedProgressDoor(room)
      || roomDoors(room).find((door) => doorUnlocked(door))
      || null;
  }

  function objectiveText(room) {
    if (extractionActive) return alert > 0 ? "EVAC UNDER FIRE" : "REACH EVAC";
    if (alert > 0) return "BREAK CONTACT";
    if (sweepTimer > 0) return "AVOID SWEEP";
    if (boxCover(room)) return "BOX COVER";
    if (player.soft && inShadow(room)) return "SHADOW COVER";
    if (room.tuna && !room.tuna.taken && player.keys >= REQUIRED_TAGS) return "SECURE TUNA";
    if (nextKeycard(room) && player.keys < REQUIRED_TAGS) return `FIND TAG ${player.keys + 1}`;
    const doorObjective = primaryDoorObjective(room);
    if (doorObjective && !doorUnlocked(doorObjective)) return `TAG ${doorObjective.need} NEEDED`;
    const lockedDoor = doorObjective ? null : lockedProgressDoor(room);
    if (lockedDoor) return `TAG ${lockedDoor.need} NEEDED`;
    if (room.panels?.some((panel) => !panel.done) && (room.sweeps?.length || room.cameras?.some((camera) => camera.disabledBySystem))) return "SCRATCH PANEL";
    if (roomDoors(room).length) return "USE DOOR";
    return "STAY LOW";
  }

  function objectiveTarget(room) {
    if (extractionActive) {
      if (player.room === START_ROOM) return { x: rooms[START_ROOM].start.x, y: rooms[START_ROOM].start.y, r: 42 };
      const door = primaryDoorObjective(room);
      return door ? doorTarget(door) : null;
    }
    if (room.tuna && !room.tuna.taken && player.keys >= REQUIRED_TAGS) return { x: room.tuna.x, y: room.tuna.y, r: 32 };
    const keycard = nextKeycard(room);
    if (keycard && player.keys < REQUIRED_TAGS) {
      return { x: keycard.x, y: keycard.y, r: 24 };
    }
    const panel = room.panels?.find((candidate) => !candidate.done);
    if (panel && (room.sweeps?.length || room.cameras?.some((camera) => camera.disabledBySystem))) {
      return { x: panel.x + panel.w / 2, y: panel.y + panel.h / 2, r: 30 };
    }
    const door = primaryDoorObjective(room);
    if (door) return doorTarget(door);
    return null;
  }

  function patrolShiftDelay() {
    const pressure = extractionActive ? 5 : securityLevel;
    return 13 + Math.random() * 9 - Math.min(5, pressure);
  }

  function tacticalPoints(room) {
    const points = [];
    const target = objectiveTarget(room);
    if (target) points.push({ x: target.x, y: target.y, label: extractionActive ? "EVAC" : "OBJ" });
    roomDoors(room).forEach((door) => {
      const point = doorApproach(door);
      points.push({ x: point.x, y: point.y, label: door.label || "DOOR" });
    });
    roomKeycards(room).forEach((keycard) => {
      if (!keycard.taken) points.push({ x: keycard.x, y: keycard.y, label: "TAG" });
    });
    if (room.tuna && !room.tuna.taken) points.push({ x: room.tuna.x, y: room.tuna.y, label: "TUNA" });
    room.panels?.forEach((panel) => {
      if (!panel.done) points.push({ x: panel.x + panel.w / 2, y: panel.y + panel.h / 2, label: "SYS" });
    });
    room.hiding?.forEach((spot) => {
      points.push({ x: spot.x + spot.w / 2, y: spot.y + spot.h / 2, label: "BOX" });
    });
    room.vents?.forEach((vent) => {
      points.push({ x: vent.x + vent.w / 2, y: vent.y + vent.h / 2, label: "VENT" });
    });
    return points;
  }

  function updateHud() {
    const suspicion = Math.round(maxSuspicion() * 100);
    roomLabel.textContent = rooms[player.room].name;
    keyLabel.textContent = `${player.keys}/${REQUIRED_TAGS}`;
    gadgetLabel.textContent = player.meowCooldown > 0 ? `${Math.ceil(player.meowCooldown)}s` : "Ready";
    if (gameOver) {
      alertLabel.textContent = "Down";
      alertLabel.style.color = "#f35d4c";
    } else if (won) {
      alertLabel.textContent = "Cleared";
      alertLabel.style.color = "#f0edcf";
    } else if (alert > 0) {
      alertLabel.textContent = "Alert";
      alertLabel.style.color = "#f35d4c";
    } else if (sweepTimer > 0) {
      alertLabel.textContent = "Sweep";
      alertLabel.style.color = "#ffd65a";
    } else if (player.hidden) {
      alertLabel.textContent = "Hidden";
      alertLabel.style.color = "#ffd65a";
    } else if (suspicion > 2) {
      alertLabel.textContent = `Sus ${suspicion}%`;
      alertLabel.style.color = suspicion > 65 ? "#f35d4c" : "#ffd65a";
    } else {
      alertLabel.textContent = "Clear";
      alertLabel.style.color = "#f0edcf";
    }
    gadgetLabel.style.color = player.meowCooldown > 0 ? "#98a08f" : "#7ed6c8";
  }
