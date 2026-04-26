"use strict";
  function visionScore(guard, room) {
    if (guard.stunned > 0) return 0;
    if (player.entryGrace > 0) return 0;
    if (player.hidden) return 0;
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = Math.hypot(dx, dy);
    const heightened = guard.state === "investigate" || guard.state === "callAlarm" || guard.state === "reinforce" || guard.state === "search" || guard.state === "sweep";
    const range = (heightened ? 205 : 176) * securityFactor();
    if (dist > range || dist < 1) return 0;
    const dir = guard.dir || { x: 1, y: 0 };
    const dot = (dx / dist) * dir.x + (dy / dist) * dir.y;
    const spread = guard.state === "search" || guard.state === "sweep" ? 0.68 : 0.52;
    const threshold = Math.cos(spread);
    if (dot < threshold) return 0;
    if (!hasLineOfSight(guard.x, guard.y, player.x, player.y, room.walls)) return 0;
    const cone = (dot - threshold) / (1 - threshold);
    const proximity = 1 - dist / range;
    return clamp(0.3 + cone * 0.38 + proximity * 0.55, 0, 1.25);
  }

  function rayRectDistance(ox, oy, dx, dy, rect, maxDistance) {
    let tMin = 0;
    let tMax = maxDistance;
    const axes = [
      { origin: ox, dir: dx, min: rect.x, max: rect.x + rect.w },
      { origin: oy, dir: dy, min: rect.y, max: rect.y + rect.h },
    ];

    for (const axis of axes) {
      if (Math.abs(axis.dir) < 0.0001) {
        if (axis.origin < axis.min || axis.origin > axis.max) return maxDistance;
      } else {
        const inv = 1 / axis.dir;
        let t1 = (axis.min - axis.origin) * inv;
        let t2 = (axis.max - axis.origin) * inv;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return maxDistance;
      }
    }

    return tMin > 0 ? tMin : tMax > 0 ? tMax : maxDistance;
  }

  function castVisionRay(room, x, y, angle, range) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let distance = range;
    const walls = queryRoomSpatial(room, "walls", {
      x: x - range,
      y: y - range,
      w: range * 2,
      h: range * 2,
    });
    walls.forEach((wall) => {
      distance = Math.min(distance, rayRectDistance(x, y, dx, dy, wall, distance));
    });
    return {
      x: x + dx * Math.max(0, distance - 1),
      y: y + dy * Math.max(0, distance - 1),
    };
  }

  function cameraActive(room, camera) {
    return !(camera.disabledBySystem && room.systemDown);
  }

  function cameraAngle(camera) {
    return camera.base + Math.sin((performance.now() / 820) * facilityPressure() + camera.phase) * camera.sweep;
  }

  function cameraVisionScore(room, camera) {
    if (player.entryGrace > 0) return 0;
    if (player.hidden || !cameraActive(room, camera)) return 0;
    const angle = cameraAngle(camera);
    const dx = player.x - camera.x;
    const dy = player.y - camera.y;
    const dist = Math.hypot(dx, dy);
    const range = camera.range * (1 + securityLevel * 0.06);
    if (dist > range || dist < 1) return 0;
    const dot = (dx / dist) * Math.cos(angle) + (dy / dist) * Math.sin(angle);
    const spread = 0.38;
    const threshold = Math.cos(spread);
    if (dot < threshold) return 0;
    if (!hasLineOfSight(camera.x, camera.y, player.x, player.y, room.walls)) return 0;
    return clamp(0.45 + (1 - dist / range) * 0.7, 0, 1.15);
  }

  function sweepBeam(sweep) {
    const t = (Math.sin(performance.now() * sweep.speed * facilityPressure() + sweep.phase) + 1) / 2;
    const thickness = securityLevel >= 4 || extractionActive ? 12 : securityLevel >= 2 ? 10 : 8;
    if (sweep.axis === "y") {
      const y = sweep.y + 10 + t * Math.max(1, sweep.h - 20);
      return { x: sweep.x, y: y - thickness / 2, w: sweep.w, h: thickness };
    }
    const x = sweep.x + 10 + t * Math.max(1, sweep.w - 20);
    return { x: x - thickness / 2, y: sweep.y, w: thickness, h: sweep.h };
  }

  function updateSensorSweeps(room) {
    if (room.systemDown) return;
    room.sweeps?.forEach((sweep) => {
      const beam = sweepBeam(sweep);
      if (player.entryGrace <= 0 && !player.hidden && circleRect(player.x, player.y, player.r, beam)) {
        markLastKnown(player.x, player.y, "SENSOR");
        radio("CP: sensor sweep hit");
        triggerCaught("SENSOR SWEEP");
      }
    });
  }

  function updateCameras(room, dt) {
    room.cameras?.forEach((camera) => {
      camera.suspicion = Math.max(0, (camera.suspicion || 0) - dt * (player.hidden ? 1.2 : 0.28));
      const score = cameraVisionScore(room, camera);
      if (score > 0) {
        markLastKnown(player.x, player.y, "CAMERA");
        camera.suspicion = clamp((camera.suspicion || 0) + dt * score * 1.7, 0, 1);
        if (camera.suspicion >= 1) triggerCaught("CAMERA CONTACT");
      }
    });
  }

  function checkGuardWitnesses(room, guard, dt) {
    const downed = room.guards.find((other) => {
      if (other === guard || other.stunned <= 0) return false;
      const dist = Math.hypot(other.x - guard.x, other.y - guard.y);
      if (dist > 155) return false;
      return hasLineOfSight(guard.x, guard.y, other.x, other.y, room.walls);
    });
    if (!downed) return;

    const dx = downed.x - guard.x;
    const dy = downed.y - guard.y;
    const dist = Math.hypot(dx, dy) || 1;
    guard.dir = { x: dx / dist, y: dy / dist };
    guard.state = "investigate";
    guard.target = { x: downed.x, y: downed.y };
    guard.suspicion = clamp(guard.suspicion + dt * 0.9, 0, 1);
    clearGuardNavigation(guard);
    markLastKnown(downed.x, downed.y, "GUARD DOWN");
    if (!downed.reported) {
      downed.reported = true;
      sayGuard(guard, "unit down");
      notice("GUARD FOUND: SEARCH EXPANDING", 1.1);
    }
  }

  function updateGuards(room, dt) {
    room.guards.forEach((guard) => {
      if (guard.stunned > 0) {
        guard.stunned = Math.max(0, guard.stunned - dt);
        guard.suspicion = 0;
        guard.aimTimer = 0;
        guard.aimTarget = null;
        return;
      }
      guard.fireCooldown = Math.max(0, (guard.fireCooldown || 0) - dt);
      guard.boxRadioCooldown = Math.max(0, (guard.boxRadioCooldown || 0) - dt);
      if (updateGuardAim(room, guard, dt)) return;
      checkGuardWitnesses(room, guard, dt);
      const patrolPausing = guard.state === "patrol" && (guard.pauseTimer || 0) > 0;
      if (patrolPausing) {
        guard.pauseTimer = Math.max(0, guard.pauseTimer - dt);
        const base = Number.isFinite(guard.pauseBase)
          ? guard.pauseBase
          : Math.atan2((guard.dir || { y: 0 }).y, (guard.dir || { x: 1 }).x);
        const scan = Math.sin(performance.now() / 260 + guard.x * 0.01) * 0.85;
        guard.dir = { x: Math.cos(base + scan), y: Math.sin(base + scan) };
      }
      if (guard.state === "sweep") {
        guard.searchTimer -= dt;
        if (guard.searchTimer <= 0) {
          guard.state = "patrol";
          guard.target = null;
          guard.suspicion = Math.min(guard.suspicion, 0.12);
        }
      }
      if (guard.state === "search") {
        guard.searchTimer -= dt;
        const sweep = Math.sin(performance.now() / 230 + (guard.searchPhase || 0)) * 1.1;
        const base = Number.isFinite(guard.searchBaseAngle) ? guard.searchBaseAngle : 0;
        guard.dir = { x: Math.cos(base + sweep), y: Math.sin(base + sweep) };
        if (guard.searchTimer <= 0) {
          guard.state = "patrol";
          clearGuardNavigation(guard);
        }
      } else if (!patrolPausing) {
        const target = (guard.state === "investigate" || guard.state === "sweep" || guard.state === "reroute" || guard.state === "reinforce" || guard.state === "callAlarm") && guard.target
          ? [guard.target.x, guard.target.y]
          : guard.route[guard.i];
        const dx = target[0] - guard.x;
        const dy = target[1] - guard.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 5) {
          if (guard.state === "investigate") {
            setGuardSearch(guard, 1.25);
          } else if (guard.state === "callAlarm") {
            triggerRoomAlarm(room, guard);
            return;
          } else if (guard.state === "sweep") {
            setGuardSearch(guard, 0.9);
          } else if (guard.state === "reroute") {
            guard.state = "patrol";
            guard.target = null;
            guard.pauseBase = Math.atan2((guard.dir || { y: 0 }).y, (guard.dir || { x: 1 }).x);
            guard.pauseTimer = 0.35 + Math.random() * 0.25;
            clearGuardNavigation(guard);
          } else if (guard.state === "reinforce") {
            transferGuardToRoom(rooms.indexOf(room), guard, guard.reinforceTo, guard.reinforceDoor);
            return;
          } else {
            const next = guard.route[(guard.i + 1) % guard.route.length];
            guard.pauseBase = Math.atan2(next[1] - guard.y, next[0] - guard.x);
            guard.pauseTimer = 0.55 + Math.random() * 0.85;
            guard.i = (guard.i + 1) % guard.route.length;
            clearGuardNavigation(guard);
          }
        } else {
          const speed = guard.speed * securityFactor() * (guard.state === "investigate" ? 1.22 : guard.state === "callAlarm" ? 1.2 : guard.state === "reinforce" ? 1.14 : guard.state === "sweep" ? 1.08 : 1);
          const moved = moveGuardTowardTarget(room, guard, { x: target[0], y: target[1] }, speed, dt);
          if (!moved && (guard.state === "investigate" || guard.state === "sweep")) {
            setGuardSearch(guard, 1.1);
          } else if (!moved && guard.state === "callAlarm") {
            setGuardSearch(guard, 0.9);
          } else if (!moved && guard.state === "reinforce") {
            guard.target = { ...doorApproach(guard.reinforceDoor) };
            clearGuardNavigation(guard);
          } else if (!moved && guard.state === "reroute") {
            guard.state = "patrol";
            guard.target = null;
            clearGuardNavigation(guard);
          } else if (!moved) {
            guard.pauseTimer = 0.35;
            guard.pauseBase = Math.atan2((guard.dir || { y: 0 }).y, (guard.dir || { x: 1 }).x);
            guard.i = (guard.i + 1) % guard.route.length;
            clearGuardNavigation(guard);
          }
        }
      }

      const score = visionScore(guard, room);
      if (score > 0) {
        guard.state = guard.suspicion > 0.55 ? "investigate" : guard.state;
        guard.target = { x: player.x, y: player.y };
        markLastKnown(player.x, player.y, "VISUAL");
        const exposure = player.boxed ? 0.36 : player.moving && !player.soft ? 1.35 : player.soft ? 0.62 : 0.9;
        guard.suspicion = clamp(guard.suspicion + dt * score * exposure, 0, 1);
      } else {
        const decay = player.hidden ? 0.38 : 0.16;
        guard.suspicion = Math.max(0, guard.suspicion - dt * decay);
      }

      const boxScore = boxAnomalyScore(guard, room);
      if (boxScore > 0) {
        guard.state = "investigate";
        guard.target = { x: player.x, y: player.y };
        guard.searchTimer = 1.25;
        guard.suspicion = clamp(guard.suspicion + dt * boxScore * (player.moving ? 1.65 : 0.72), 0, 1);
        markLastKnown(player.x, player.y, "BOX");
        if (guard.boxRadioCooldown <= 0) {
          guard.boxRadioCooldown = 3.8;
          sayGuard(guard, player.moving ? "moving box" : "stray box");
          addTacticalPing(player.x, player.y, "BOX", guard.suspicion > 0.65 ? "#f35d4c" : "#ffd65a");
        }
      }

      if (player.boxed && Math.hypot(player.x - guard.x, player.y - guard.y) < 42 && hasLineOfSight(guard.x, guard.y, player.x, player.y, room.walls)) {
        player.boxed = false;
        player.hidden = false;
        guard.suspicion = 1;
        triggerCaught("BOX INSPECTED");
      }
      if (Math.hypot(player.x - guard.x, player.y - guard.y) < 26 && !player.hidden) {
        triggerCaught("COLLAR GRABBED");
      }
      if (guard.suspicion >= 1) {
        triggerCaught("VISUAL CONTACT");
      }
      if (guard.suspicion > 0.82 && guard.fireCooldown <= 0 && !player.hidden) {
        startGuardAim(guard);
      }
    });
  }

  function updateOffscreenReinforcements(dt) {
    activeRooms("warm").forEach(({ room, index: roomIndex, tier }) => {
      if (roomIndex === player.room) return;
      if (tier === "warm") updateWarmRoom(room, dt);
      for (let i = room.guards.length - 1; i >= 0; i -= 1) {
        const guard = room.guards[i];
        if (guard.state !== "reinforce" || !guard.target || guard.stunned > 0) continue;
        guard.fireCooldown = Math.max(0, (guard.fireCooldown || 0) - dt);
        const dist = Math.hypot(guard.target.x - guard.x, guard.target.y - guard.y);
        if (dist < 8) {
          transferGuardToRoom(roomIndex, guard, guard.reinforceTo, guard.reinforceDoor);
          continue;
        }
        const moved = moveGuardTowardTarget(room, guard, guard.target, guard.speed * securityFactor() * 1.08, dt);
        if (!moved) {
          guard.target = { ...doorApproach(guard.reinforceDoor) };
          clearGuardNavigation(guard);
        }
      }
    });
  }

  function updateWarmRoom(room, dt) {
    room.cameras?.forEach((camera) => {
      camera.suspicion = Math.max(0, (camera.suspicion || 0) - dt * 0.2);
    });
    room.guards.forEach((guard) => {
      if (guard.stunned > 0) {
        guard.stunned = Math.max(0, guard.stunned - dt);
        guard.suspicion = 0;
        return;
      }
      guard.fireCooldown = Math.max(0, (guard.fireCooldown || 0) - dt);
      guard.boxRadioCooldown = Math.max(0, (guard.boxRadioCooldown || 0) - dt);
      guard.suspicion = Math.max(0, (guard.suspicion || 0) - dt * 0.08);
      if (guard.state === "search" || guard.state === "sweep") {
        guard.searchTimer = Math.max(0, (guard.searchTimer || 0) - dt);
        if (guard.searchTimer <= 0) {
          guard.state = "patrol";
          guard.target = null;
          clearGuardNavigation(guard);
        }
      }
    });
  }
