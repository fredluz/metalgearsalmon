"use strict";
  function makeNoise(x, y, radius, ttl, color, label, kind) {
    const room = rooms[player.room];
    soundMeter = Math.max(soundMeter, kind === "meow" ? 1 : kind === "shot" ? 0.9 : kind === "scratch" ? 0.7 : kind === "step" ? 0.42 : 0.32);
    noises.push({
      x: clamp(x, 36, roomWidth(room) - 36),
      y: clamp(y, 36, roomHeight(room) - 36),
      radius,
      ttl,
      maxTtl: ttl,
      color,
      label,
      kind,
      fresh: true,
    });
  }

  function markLastKnown(x, y, reason) {
    const room = rooms[player.room];
    lastKnown = {
      x: clamp(x, 32, roomWidth(room) - 32),
      y: clamp(y, 32, roomHeight(room) - 32),
      ttl: 2.8,
      maxTtl: 2.8,
      reason,
    };
  }

  function responseRouteForRoom(room, x, y, focus) {
    const safeFocus = openTacticalPoint(room, focus?.x || x, focus?.y || y, [x, y]);
    const offsetA = openTacticalPoint(room, safeFocus.x + 72, safeFocus.y, [x, y]);
    const offsetB = openTacticalPoint(room, safeFocus.x - 72, safeFocus.y + 54, [x, y]);
    return [[x, y], [safeFocus.x, safeFocus.y], [offsetA.x, offsetA.y], [offsetB.x, offsetB.y]];
  }

  function roomGuardCap() {
    return extractionActive ? EXTRACTION_ROOM_GUARD_CAP : NORMAL_ROOM_GUARD_CAP;
  }

  function activeAlarm(room) {
    return room.alarm && !room.alarm.disabled ? room.alarm : null;
  }

  function alarmCenter(alarm) {
    return { x: alarm.x + alarm.w / 2, y: alarm.y + alarm.h / 2 };
  }

  function dispatchReinforcement(roomIndex, door, sourceRoomIndex, target, reason) {
    if (rooms[sourceRoomIndex].guards.length >= roomGuardCap()) return false;
    const room = rooms[roomIndex];
    const guard = room.guards
      .filter((candidate) => candidate.stunned <= 0 && candidate.state !== "reinforce")
      .sort((a, b) => {
        const point = doorApproach(door);
        return Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y);
      })[0];
    if (!guard) return false;
    const point = doorApproach(door);
    guard.state = "reinforce";
    guard.target = { x: point.x, y: point.y };
    guard.reinforceTo = sourceRoomIndex;
    guard.reinforceDoor = door;
    guard.searchTimer = 0;
    guard.suspicion = Math.max(guard.suspicion, 0.58);
    clearGuardNavigation(guard);
    addTacticalPing(target.x, target.y, "CALL", "#f35d4c");
    radio(`CP: adjacent unit moving from ${room.name}`, 1.4);
    return true;
  }

  function callAdjacentReinforcement(sourceRoomIndex, target, reason) {
    const candidates = roomDoors(rooms[sourceRoomIndex])
      .filter((sourceDoor) => doorUnlocked(sourceDoor))
      .map((sourceDoor) => {
      const adjacentIndex = sourceDoor.to;
      const adjacentDoor = roomDoors(rooms[adjacentIndex]).find((door) => door.to === sourceRoomIndex);
        if (!adjacentDoor || !doorUnlocked(adjacentDoor)) return null;
        const guards = rooms[adjacentIndex].guards.filter((guard) => guard.stunned <= 0 && guard.state !== "reinforce");
        if (!guards.length) return null;
        return { adjacentIndex, adjacentDoor, count: guards.length };
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count);

    let called = 0;
    const limit = extractionActive ? 2 : 1;
    for (const candidate of candidates) {
      if (called >= limit || rooms[sourceRoomIndex].guards.length + called >= roomGuardCap()) break;
      if (dispatchReinforcement(candidate.adjacentIndex, candidate.adjacentDoor, sourceRoomIndex, target, reason)) called += 1;
    }
    return called;
  }

  function orderAlarmCall(room, target, reason) {
    const alarm = activeAlarm(room);
    if (!alarm || alarm.triggered) return false;
    const point = alarmCenter(alarm);
    const caller = room.guards
      .filter((guard) => guard.stunned <= 0 && guard.state !== "reinforce" && guard.state !== "callAlarm")
      .sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y))[0];
    if (!caller) return false;
    caller.state = "callAlarm";
    caller.target = point;
    caller.suspicion = Math.max(caller.suspicion, 0.9);
    caller.searchTimer = 0;
    caller.alarmReason = reason;
    clearGuardNavigation(caller);
    addTacticalPing(point.x, point.y, "ALARM", "#f35d4c");
    sayGuard(caller, "reaching alarm", 1.15);
    return true;
  }

  function triggerRoomAlarm(room, guard) {
    const alarm = activeAlarm(room);
    if (!alarm || alarm.triggered) {
      setGuardSearch(guard, 0.8);
      return;
    }
    alarm.triggered = true;
    const called = callAdjacentReinforcement(rooms.indexOf(room), lastKnown || { x: guard.x, y: guard.y }, guard.alarmReason || "ALARM");
    guard.state = "sweep";
    guard.target = lastKnown ? { x: lastKnown.x, y: lastKnown.y } : null;
    guard.searchTimer = 2.3;
    guard.alarmReason = "";
    clearGuardNavigation(guard);
    playCue("alert");
    addTacticalPing(alarm.x + alarm.w / 2, alarm.y + alarm.h / 2, called ? "CALL" : "NO UNIT", called ? "#f35d4c" : "#ffd65a");
    radio(called ? "CP: backup requested" : "CP: no adjacent unit available", 1.4);
  }

  function transferGuardToRoom(fromRoomIndex, guard, toRoomIndex, door) {
    const fromRoom = rooms[fromRoomIndex];
    const toRoom = rooms[toRoomIndex];
    const reverseDoor = roomDoors(toRoom).find((candidate) => candidate.to === fromRoomIndex);
    markDoorOpen(door, DOOR_OPEN_HOLD);
    markDoorOpen(reverseDoor, DOOR_OPEN_HOLD);
    const index = fromRoom.guards.indexOf(guard);
    if (index >= 0) fromRoom.guards.splice(index, 1);
    const spawn = door.spawn || toRoom.start;
    guard.x = spawn.x;
    guard.y = spawn.y;
    guard.room = toRoomIndex;
    guard.route = responseRouteForRoom(toRoom, guard.x, guard.y, toRoomIndex === player.room ? lastKnown : toRoom.start);
    guard.i = 1;
    guard.state = toRoomIndex === player.room && alert > 0 ? "investigate" : "patrol";
    guard.target = toRoomIndex === player.room && lastKnown
      ? { x: lastKnown.x, y: lastKnown.y }
      : null;
    guard.reinforceTo = null;
    guard.reinforceDoor = null;
    guard.searchTimer = 1.1;
    guard.suspicion = Math.max(guard.suspicion, toRoomIndex === player.room ? 0.72 : 0.28);
    clearGuardNavigation(guard);
    toRoom.guards.push(guard);
    fromRoom.guardNav = null;
    toRoom.guardNav = null;
    if (toRoomIndex === player.room) {
      addTacticalPing(guard.x, guard.y, "UNIT", "#f35d4c");
      radio("CP: unit entering your sector", 1.15);
    }
  }

  function triggerCaught(reason) {
    if (won || gameOver) return;
    const wasClear = alert <= 0;
    const sourceRoomIndex = player.room;
    const room = rooms[sourceRoomIndex];
    const target = {
      x: clamp(player.x, 44, roomWidth(room) - 44),
      y: clamp(player.y, 44, roomHeight(room) - 44),
    };
    alert = Math.max(alert, 4.2);
    alertReason = reason;
    shake = Math.max(shake, 5);
    if (wasClear) {
      stats.alerts += 1;
      securityLevel = Math.min(5, securityLevel + 1);
      playCue("alert");
    }
    markLastKnown(target.x, target.y, reason);
    rooms[sourceRoomIndex].guards.forEach((guard, index) => {
      const angle = index * 2.35;
      const offset = index === 0 ? 0 : 34;
      guard.state = "investigate";
      guard.searchTimer = 1.6;
      guard.suspicion = 1;
      guard.target = {
        x: clamp(target.x + Math.cos(angle) * offset, 44, roomWidth(room) - 44),
        y: clamp(target.y + Math.sin(angle) * offset, 44, roomHeight(room) - 44),
      };
      clearGuardNavigation(guard);
    });
    if (wasClear && !orderAlarmCall(rooms[sourceRoomIndex], target, reason)) {
      radio("CP: local alarm unavailable", 1.1);
    }
    radio(`CP: ${reason}`);
    notice(`${reason}: BREAK LINE OF SIGHT`, 1.2);
  }

  function startRoomSweep(room) {
    if (!lastKnown) return;
    sweepTimer = 5.5 + securityLevel * 0.7;
    const offsets = [
      [0, 0],
      [92, 0],
      [-92, 0],
      [0, 92],
      [0, -92],
    ];
    room.guards.forEach((guard, index) => {
      if (guard.stunned > 0) return;
      const offset = offsets[index % offsets.length];
      guard.state = "sweep";
      guard.target = openTacticalPoint(room, lastKnown.x + offset[0], lastKnown.y + offset[1], guard.route[guard.i]);
      guard.searchTimer = sweepTimer - index * 0.45;
      guard.suspicion = Math.max(guard.suspicion, 0.34);
      clearGuardNavigation(guard);
    });
    markLastKnown(lastKnown.x, lastKnown.y, "SWEEP");
    radio("CP: sweep last known");
    notice("CONTACT LOST: SWEEP TEAM MOVING", 1.35);
  }

  function startExtraction(room) {
    extractionActive = true;
    tunaScentTimer = 0.45;
    securityLevel = Math.max(securityLevel, 4);
    alert = Math.max(alert, 3.8);
    alertReason = "TUNA BREACH";
    roomFlash = 1;
    shake = Math.max(shake, 5);
    markLastKnown(player.x, player.y, "TUNA");
    room.guards.forEach((guard, index) => {
      if (guard.stunned > 0) return;
      const spread = index * 1.9;
      guard.state = "investigate";
      guard.target = openTacticalPoint(
        room,
        player.x + Math.cos(spread) * 52,
        player.y + Math.sin(spread) * 52,
        guard.route[guard.i]
      );
      guard.suspicion = Math.max(guard.suspicion, 0.72);
      guard.searchTimer = 1.4;
      clearGuardNavigation(guard);
    });
    orderAlarmCall(room, { x: player.x, y: player.y }, "TUNA BREACH");
    playCue("alert");
    radio("CP: tuna breach. seal exits.");
    notice("TUNA SECURED: RETURN TO EVAC", 1.8);
  }

  function completeMission() {
    won = true;
    extractionActive = false;
    tunaScentTimer = 0;
    notice("MISSION COMPLETE", 2);
    playCue("pickup");
    const { result, best, isBetter } = recordRunResult();
    message.innerHTML = `Mission complete.<br>The dock exit is clear.<br><small>Rank ${result.rank} | Time ${formatTime(result.time)} | Alerts ${result.alerts} | Hits ${result.hits} | Scratches ${stats.scratches}${isBetter ? "<br>New best infiltration." : `<br>Best ${best.rank} | ${formatTime(best.time)}`}<br>Press R to infiltrate again.</small>`;
    message.hidden = false;
  }
