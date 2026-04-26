"use strict";
  function emitMeow() {
    if (player.meowCooldown > 0 || won || gameOver) return;
    const x = player.x;
    const y = player.y;
    makeNoise(x, y, 330, 1.35, "rgba(126, 214, 200, 0.85)", "MREOW", "meow");
    player.meowCooldown = alert > 0 ? 2.4 : 3;
    stats.meows += 1;
    playCue("meow");
    notice("LONG-RANGE DECOY MEOW", 1);
  }

  function activateWhiskerSense() {
    if (won || gameOver || paused) return;
    if (player.senseCooldown > 0) {
      notice(`WHISKERS RECALIBRATING ${Math.ceil(player.senseCooldown)}s`, 0.65);
      return;
    }
    player.senseTimer = 2.8;
    player.senseCooldown = 9.5;
    soundMeter = Math.max(soundMeter, 0.36);
    playCue("pickup");
    notice("WHISKER SENSE: READ THE ROOM", 0.9);
  }

  function throwYarnBall() {
    if (won || gameOver || paused) return;
    if (player.catnip <= 0) {
      notice("NO YARN LEFT", 0.75);
      return;
    }
    const facing = player.facing || { x: 1, y: 0 };
    const room = rooms[player.room];
    player.catnip -= 1;
    stats.catnips += 1;
    catnips.push({
      x: clamp(player.x + facing.x * 18, 40, roomWidth(room) - 40),
      y: clamp(player.y + facing.y * 18, 40, roomHeight(room) - 40),
      vx: facing.x * YARN_THROW_SPEED,
      vy: facing.y * YARN_THROW_SPEED,
      traveled: 0,
      trail: [{ x: player.x, y: player.y }],
      ttl: 2.4,
      maxTtl: 2.4,
      landed: false,
    });
    roomFlash = Math.max(roomFlash, 0.28);
    playCue("yarn");
    notice("YARN BALL TOSSED", 0.9);
  }

  function movePlayer(dt) {
    let dx = 0;
    let dy = 0;
    if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
    if (keys.has("arrowright") || keys.has("d")) dx += 1;
    if (keys.has("arrowup") || keys.has("w")) dy -= 1;
    if (keys.has("arrowdown") || keys.has("s")) dy += 1;

    player.moving = Boolean(dx || dy);
    player.soft = keys.has("shift");
    player.boxed = keys.has("c");
    if (player.insideProp) {
      player.moving = false;
      player.soft = false;
      player.boxed = false;
      return;
    }
    if (!player.moving) return;

    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    player.facing = { x: dx, y: dy };

    const baseSpeed = player.boxed ? 54 : player.soft ? 88 : 138;
    const speed = baseSpeed * (extractionActive ? 0.86 : 1);
    const nx = player.x + dx * speed * dt;
    const ny = player.y + dy * speed * dt;
    if (!blocked(nx, player.y)) {
      player.x = nx;
    } else if (tryPlayerSectorTransfer(nx, player.y)) {
      return;
    }
    if (!blocked(player.x, ny)) {
      player.y = ny;
    } else if (tryPlayerSectorTransfer(player.x, ny)) {
      return;
    }

    if (player.boxed) {
      footstepTimer -= dt;
      if (footstepTimer <= 0) {
        makeNoise(player.x, player.y, 54, 0.26, "rgba(255, 214, 90, 0.38)", "RUSTLE", "box");
        footstepTimer = 0.58;
      }
      pawTimer = Math.min(pawTimer, 0.08);
    } else if (!player.soft && !player.hidden) {
      footstepTimer -= dt;
      pawTimer -= dt;
      if (pawTimer <= 0) {
        pawPrints.push({
          x: player.x - dx * 10,
          y: player.y - dy * 10,
          ttl: 2.2,
          maxTtl: 2.2,
          flip: pawPrints.length % 2,
          fresh: true,
        });
        pawTimer = 0.16;
      }
      if (footstepTimer <= 0) {
        makeNoise(player.x, player.y, 88, 0.28, "rgba(255, 214, 90, 0.55)", "TAP", "step");
        footstepTimer = 0.33;
      }
    } else {
      footstepTimer = Math.min(footstepTimer, 0.1);
      pawTimer = Math.min(pawTimer, 0.08);
    }
  }

  function applyFreshNoises(room) {
    noises.forEach((sound) => {
      if (!sound.fresh) return;
      let responders = 0;
      if (sound.kind === "yarn") {
        const candidates = room.guards
          .map((guard, index) => ({ guard, index }))
          .filter(({ guard }) => {
            if (guard.stunned > 0) return false;
            const dist = Math.hypot(sound.x - guard.x, sound.y - guard.y);
            if (dist > sound.radius) return false;
            return hasLineOfSight(sound.x, sound.y, guard.x, guard.y, room.walls);
          })
          .sort((a, b) => Math.hypot(sound.x - a.guard.x, sound.y - a.guard.y) - Math.hypot(sound.x - b.guard.x, sound.y - b.guard.y));
        if (candidates.length) {
          const { guard } = candidates[0];
          guard.state = "investigate";
          guard.target = { x: sound.x, y: sound.y };
          guard.searchTimer = 0.85;
          guard.suspicion = Math.min(0.24, Math.max(guard.suspicion, 0.08));
          clearGuardNavigation(guard);
          responders = 1;
        }
      } else {
        room.guards.forEach((guard) => {
          if (guard.stunned > 0) return;
          const dist = Math.hypot(sound.x - guard.x, sound.y - guard.y);
          const muffled = hasLineOfSight(sound.x, sound.y, guard.x, guard.y, room.walls) ? 1 : 0.55;
          if (dist <= sound.radius * muffled) {
            guard.state = "investigate";
            guard.target = { x: sound.x, y: sound.y };
            guard.suspicion = Math.max(guard.suspicion, sound.kind === "meow" ? 0.34 : 0.16);
            clearGuardNavigation(guard);
            responders += 1;
          }
        });
      }
      if (responders > 0) {
        if (sound.kind === "meow") sayNearestGuard(room, sound.x, sound.y, "heard a meow");
        else if (sound.kind === "yarn") sayNearestGuard(room, sound.x, sound.y, "what's that?");
        else if (sound.kind === "tuna") sayNearestGuard(room, sound.x, sound.y, "tuna scent");
        else if (sound.kind === "box") sayNearestGuard(room, sound.x, sound.y, "box rustle");
        else if (sound.kind === "step") sayNearestGuard(room, sound.x, sound.y, "movement");
      }
      sound.fresh = false;
    });
  }

  function updateNoises(dt) {
    for (let i = noises.length - 1; i >= 0; i -= 1) {
      noises[i].ttl -= dt;
      if (noises[i].ttl <= 0) noises.splice(i, 1);
    }
  }

  function updateCatnips(room, dt) {
    for (let i = catnips.length - 1; i >= 0; i -= 1) {
      const pouch = catnips[i];
      if (!pouch.landed) {
        const stepX = pouch.vx * dt;
        const stepY = pouch.vy * dt;
        const nextX = clamp(pouch.x + stepX, 40, roomWidth(room) - 40);
        const nextY = clamp(pouch.y + stepY, 40, roomHeight(room) - 40);
        pouch.traveled += Math.hypot(stepX, stepY);
        pouch.trail.push({ x: pouch.x, y: pouch.y });
        if (pouch.trail.length > 8) pouch.trail.shift();
        pouch.x = nextX;
        pouch.y = nextY;
        const hitWall = smallBlocked(room, pouch.x, pouch.y, 7);
        if (hitWall || pouch.traveled >= YARN_THROW_RANGE) {
          pouch.landed = true;
          pouch.ttl = 1.6;
          pouch.maxTtl = 1.6;
          makeNoise(pouch.x, pouch.y, 190, 0.45, "rgba(126, 214, 200, 0.6)", "YARN", "yarn");
        }
      } else {
        pouch.ttl -= dt;
      }
      if (pouch.ttl <= 0) {
        catnips.splice(i, 1);
      }
    }
  }

  function updateTunaScent(dt) {
    if (!extractionActive) return;
    tunaScentTimer -= dt;
    if (tunaScentTimer > 0) return;
    tunaScentTimer = player.hidden ? 1.85 : player.soft ? 1.35 : 0.95;
    makeNoise(player.x, player.y, player.hidden ? 92 : 138, 0.4, "rgba(255, 214, 90, 0.48)", "TUNA", "tuna");
  }

  function addVentRattle(x, y) {
    ventRattles.push({ x, y, ttl: 3.2, maxTtl: 3.2 });
  }

  function updateVentRattles(dt) {
    for (let i = ventRattles.length - 1; i >= 0; i -= 1) {
      ventRattles[i].ttl -= dt;
      if (ventRattles[i].ttl <= 0) ventRattles.splice(i, 1);
    }
  }

  function addTacticalPing(x, y, label, color = "#ffd65a") {
    const room = rooms[player.room];
    tacticalPings.push({
      x: clamp(x, 36, roomWidth(room) - 36),
      y: clamp(y, 36, roomHeight(room) - 36),
      label,
      color,
      ttl: 2.6,
      maxTtl: 2.6,
    });
  }

  function updateTacticalPings(dt) {
    for (let i = tacticalPings.length - 1; i >= 0; i -= 1) {
      tacticalPings[i].ttl -= dt;
      if (tacticalPings[i].ttl <= 0) tacticalPings.splice(i, 1);
    }
  }

  function updateGuardBarks(dt) {
    for (let i = guardBarks.length - 1; i >= 0; i -= 1) {
      const bark = guardBarks[i];
      bark.ttl -= dt;
      if (bark.ttl <= 0 || !rooms[player.room].guards.includes(bark.guard)) guardBarks.splice(i, 1);
    }
  }

  function commandPatrolShift(room) {
    if (alert > 0 || sweepTimer > 0 || won || gameOver) return false;
    const guards = room.guards.filter((guard) => guard.stunned <= 0 && guard.state !== "investigate" && !guard.static);
    const points = tacticalPoints(room);
    if (!guards.length || !points.length) return false;

    const guard = guards[Math.floor(Math.random() * guards.length)];
    const sorted = points
      .map((point) => ({ ...point, dist: Math.hypot(point.x - guard.x, point.y - guard.y) }))
      .sort((a, b) => b.dist - a.dist);
    const pick = sorted[Math.floor(Math.random() * Math.min(3, sorted.length))];
    const target = openTacticalPoint(room, pick.x, pick.y, guard.route[guard.i]);
    guard.state = "reroute";
    guard.target = target;
    guard.searchTimer = 0;
    clearGuardNavigation(guard);
    if (extractionActive) {
      addTacticalPing(target.x, target.y, pick.label, "#f35d4c");
      radio(`CP: intercept ${pick.label}`);
    }
    return true;
  }

  function updateDirector(room, dt) {
    if (won || gameOver || paused) return;
    directorTimer -= dt;
    if (directorTimer > 0) return;
    directorTimer = patrolShiftDelay();
    if (missionTime < 10 && !extractionActive) return;
    if (commandPatrolShift(room) && extractionActive) notice("CP ORDER: INTERCEPT ROUTE", 0.9);
  }

  function updateBriefings(room) {
    if (alert > 0 || sweepTimer > 0 || radioTimer > 0 || noticeTimer > 0.35) return;
    const lines = room.briefings || [];
    if (briefingIndex >= lines.length) return;
    const due = 2.4 + briefingIndex * 8.5;
    if (roomTime < due) return;
    radio(lines[briefingIndex], 2.2);
    briefingIndex += 1;
  }

  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i -= 1) {
      shots[i].ttl -= dt;
      if (shots[i].ttl <= 0) shots.splice(i, 1);
    }
  }

  function updatePawPrints(dt) {
    for (let i = pawPrints.length - 1; i >= 0; i -= 1) {
      pawPrints[i].ttl -= dt;
      if (pawPrints[i].ttl <= 0) pawPrints.splice(i, 1);
    }
    if (lastKnown) {
      const decay = alert > 0 ? 0.18 : sweepTimer > 0 ? 0.45 : 1;
      lastKnown.ttl -= dt * decay;
      if (lastKnown.ttl <= 0) lastKnown = null;
    }
  }

  function applyFreshPawPrints(room) {
    pawPrints.forEach((print) => {
      if (!print.fresh || print.ttl < print.maxTtl * 0.35) return;
      room.guards.forEach((guard) => {
        if (guard.stunned > 0 || guard.suspicion > 0.8) return;
        const dist = Math.hypot(print.x - guard.x, print.y - guard.y);
        if (dist < 86 && hasLineOfSight(guard.x, guard.y, print.x, print.y, room.walls)) {
          guard.state = "investigate";
          guard.target = { x: print.x, y: print.y };
          guard.suspicion = Math.max(guard.suspicion, 0.24);
          clearGuardNavigation(guard);
          print.fresh = false;
          sayGuard(guard, "fresh paw prints");
        }
      });
    });
  }

  function damagePlayer(reason) {
    if (player.hidden || player.hitCooldown > 0 || gameOver || won) return;
    player.life -= 1;
    stats.hits += 1;
    player.hitCooldown = 1.15;
    roomFlash = 0.75;
    shake = 8;
    playCue("hit");
    notice(reason, 1.2);
    if (player.life <= 0) {
      gameOver = true;
      message.innerHTML = "Mission failed.<br>Too many paws in the line of fire.<br><small>Press R to retry.</small>";
      message.hidden = false;
    }
  }

  function guardShoot(room, guard) {
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = Math.hypot(dx, dy) || 1;
    guard.dir = { x: dx / dist, y: dy / dist };
    const hit = !player.hidden && hasLineOfSight(guard.x, guard.y, player.x, player.y, room.walls);
    const end = hit
      ? { x: player.x, y: player.y - 8 }
      : castVisionRay(room, guard.x, guard.y, Math.atan2(guard.dir.y, guard.dir.x), 220);
    shots.push({
      x1: guard.x,
      y1: guard.y - 14,
      x2: end.x,
      y2: end.y,
      ttl: 0.16,
      maxTtl: 0.16,
      hit,
    });
    playCue("shot");
    makeNoise(guard.x, guard.y, 150, 0.22, "rgba(243, 93, 76, 0.55)", "PFT", "shot");
    if (hit) damagePlayer("TAGGED: HIDE OR VENT");
  }

  function startGuardAim(guard) {
    guard.aimMax = Math.max(0.24, 0.42 - securityLevel * 0.025);
    guard.aimTimer = guard.aimMax;
    guard.aimTarget = { x: player.x, y: player.y };
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = Math.hypot(dx, dy) || 1;
    guard.dir = { x: dx / dist, y: dy / dist };
    sayGuard(guard, "taking aim", 0.9);
  }

  function updateGuardAim(room, guard, dt) {
    if (guard.aimTimer <= 0) return false;
    guard.aimTimer = Math.max(0, guard.aimTimer - dt);
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = Math.hypot(dx, dy) || 1;
    guard.dir = { x: dx / dist, y: dy / dist };
    guard.aimTarget = { x: player.x, y: player.y };

    if (player.hidden || !hasLineOfSight(guard.x, guard.y, player.x, player.y, room.walls)) {
      guard.aimTimer = 0;
      guard.aimTarget = null;
      setGuardSearch(guard, 0.9);
      guard.fireCooldown = 0.45;
      return true;
    }

    if (guard.aimTimer <= 0) {
      guardShoot(room, guard);
      guard.fireCooldown = Math.max(0.48, 0.92 - securityLevel * 0.06 + Math.random() * 0.28);
      guard.aimTarget = null;
    }
    return true;
  }

  function useRation() {
    if (won || gameOver || paused) return;
    if (player.rationsHeld <= 0) {
      notice("NO RATIONS STORED", 0.8);
      return;
    }
    if (player.life >= MAX_LIFE) {
      notice("LIFE FULL", 0.8);
      return;
    }
    player.rationsHeld -= 1;
    player.life = Math.min(MAX_LIFE, player.life + 1);
    stats.rations += 1;
    roomFlash = 0.45;
    playCue("pickup");
    notice("TUNA RATION USED: LIFE +1", 1.2);
  }

  function scratchableGuard(room) {
    return room.guards.find((guard) => {
      if (guard.stunned > 0) return false;
      const dx = player.x - guard.x;
      const dy = player.y - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 38) return false;
      if (!hasLineOfSight(player.x, player.y, guard.x, guard.y, room.walls)) return false;
      const dir = guard.dir || { x: 1, y: 0 };
      const behind = dist > 0 ? (dx / dist) * dir.x + (dy / dist) * dir.y < -0.28 : false;
      return player.hidden || player.soft || behind;
    });
  }

  function scratchGuard(room, guard) {
    guard.stunned = 4.2;
    guard.reported = false;
    guard.suspicion = 0;
    guard.state = "patrol";
    guard.target = null;
    stats.scratches += 1;
    roomFlash = 0.45;
    playCue("pickup");
    makeNoise(guard.x, guard.y, 105, 0.34, "rgba(255, 214, 90, 0.62)", "HISS", "scratch");
    notice("SILENT SCRATCH: GUARD STUNNED", 1.2);
  }
