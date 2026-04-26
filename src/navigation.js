"use strict";
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRect(cx, cy, r, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r ** 2;
  }

  function nearRect(rect, range) {
    return circleRect(player.x, player.y, range, rect);
  }

  function blocked(x, y) {
    const room = rooms[player.room];
    if (x < player.r || x > PLAY_W - player.r || y < player.r || y > H - player.r) return true;
    if (roomDoors(room).some((door) => !doorUnlocked(door) && circleRect(x, y, player.r, doorBlockRect(door)))) return true;
    return room.walls.some((wall) => circleRect(x, y, player.r, wall));
  }

  function guardBlocked(room, x, y) {
    if (x < GUARD_RADIUS || x > PLAY_W - GUARD_RADIUS || y < GUARD_RADIUS || y > H - GUARD_RADIUS) return true;
    if (roomDoors(room).some((door) => !doorUnlocked(door) && circleRect(x, y, GUARD_RADIUS, doorBlockRect(door)))) return true;
    return room.walls.some((wall) => circleRect(x, y, GUARD_RADIUS, wall));
  }

  function openTacticalPoint(room, x, y, fallback) {
    const point = {
      x: clamp(x, 44, PLAY_W - 44),
      y: clamp(y, 44, H - 44),
    };
    return guardBlocked(room, point.x, point.y)
      ? { x: fallback[0], y: fallback[1] }
      : point;
  }

  function clearGuardNavigation(guard) {
    guard.path = [];
    guard.pathIndex = 0;
    guard.navTargetKey = "";
    guard.stuckTimer = 0;
    guard.repathCooldown = 0;
  }

  function setGuardSearch(guard, duration) {
    guard.state = "search";
    guard.searchTimer = duration;
    guard.target = null;
    guard.searchBaseAngle = Math.atan2((guard.dir || { y: 0 }).y, (guard.dir || { x: 1 }).x);
    if (!Number.isFinite(guard.searchBaseAngle)) guard.searchBaseAngle = 0;
    guard.searchPhase = Math.random() * Math.PI * 2;
    clearGuardNavigation(guard);
  }

  function addNavNode(nodes, room, x, y) {
    const point = {
      x: clamp(x, 36, PLAY_W - 36),
      y: clamp(y, 36, H - 36),
    };
    if (guardBlocked(room, point.x, point.y)) return;
    if (nodes.some((node) => Math.hypot(node.x - point.x, node.y - point.y) < NAV_POINT_EPSILON)) return;
    nodes.push(point);
  }

  function guardLineClear(room, ax, ay, bx, by) {
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 8));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      if (guardBlocked(room, x, y)) return false;
    }
    return true;
  }

  function buildRoomNav(room) {
    if (room.guardNav) return room.guardNav;
    const nodes = [];

    room.guards.forEach((guard) => {
      guard.route.forEach((point) => addNavNode(nodes, room, point[0], point[1]));
    });

    addNavNode(nodes, room, room.start.x, room.start.y);
    roomDoors(room).forEach((door) => {
      const point = doorApproach(door);
      addNavNode(nodes, room, point.x, point.y);
    });

    room.walls.forEach((wall) => {
      addNavNode(nodes, room, wall.x - NAV_CORNER_PAD, wall.y - NAV_CORNER_PAD);
      addNavNode(nodes, room, wall.x + wall.w + NAV_CORNER_PAD, wall.y - NAV_CORNER_PAD);
      addNavNode(nodes, room, wall.x - NAV_CORNER_PAD, wall.y + wall.h + NAV_CORNER_PAD);
      addNavNode(nodes, room, wall.x + wall.w + NAV_CORNER_PAD, wall.y + wall.h + NAV_CORNER_PAD);
    });

    const edges = nodes.map(() => []);
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        if (!guardLineClear(room, nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y)) continue;
        const cost = Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y);
        edges[i].push({ to: j, cost });
        edges[j].push({ to: i, cost });
      }
    }

    room.guardNav = { nodes, edges };
    return room.guardNav;
  }

  function reconstructGuardPath(cameFrom, nodes, current) {
    const path = [];
    let cursor = current;
    while (cameFrom[cursor] !== -1) {
      path.push({ x: nodes[cursor].x, y: nodes[cursor].y });
      cursor = cameFrom[cursor];
    }
    return path.reverse();
  }

  function findGuardPath(room, start, goal) {
    const safeGoal = openTacticalPoint(room, goal.x, goal.y, [start.x, start.y]);
    if (guardLineClear(room, start.x, start.y, safeGoal.x, safeGoal.y)) return [safeGoal];

    const nav = buildRoomNav(room);
    const nodes = nav.nodes.map((node) => ({ x: node.x, y: node.y }));
    const edges = nav.edges.map((neighbors) => neighbors.map((edge) => ({ to: edge.to, cost: edge.cost })));
    const startIndex = nodes.push({ x: start.x, y: start.y }) - 1;
    const goalIndex = nodes.push({ x: safeGoal.x, y: safeGoal.y }) - 1;
    edges.push([]);
    edges.push([]);

    for (let i = 0; i < nodes.length - 2; i += 1) {
      const startCost = Math.hypot(nodes[i].x - start.x, nodes[i].y - start.y);
      if (guardLineClear(room, start.x, start.y, nodes[i].x, nodes[i].y)) {
        edges[startIndex].push({ to: i, cost: startCost });
        edges[i].push({ to: startIndex, cost: startCost });
      }

      const goalCost = Math.hypot(nodes[i].x - safeGoal.x, nodes[i].y - safeGoal.y);
      if (guardLineClear(room, safeGoal.x, safeGoal.y, nodes[i].x, nodes[i].y)) {
        edges[goalIndex].push({ to: i, cost: goalCost });
        edges[i].push({ to: goalIndex, cost: goalCost });
      }
    }

    if (guardLineClear(room, start.x, start.y, safeGoal.x, safeGoal.y)) {
      const direct = Math.hypot(safeGoal.x - start.x, safeGoal.y - start.y);
      edges[startIndex].push({ to: goalIndex, cost: direct });
      edges[goalIndex].push({ to: startIndex, cost: direct });
    }

    const gScore = new Array(nodes.length).fill(Infinity);
    const fScore = new Array(nodes.length).fill(Infinity);
    const cameFrom = new Array(nodes.length).fill(-1);
    const open = [startIndex];
    gScore[startIndex] = 0;
    fScore[startIndex] = Math.hypot(safeGoal.x - start.x, safeGoal.y - start.y);

    while (open.length) {
      let best = 0;
      for (let i = 1; i < open.length; i += 1) {
        if (fScore[open[i]] < fScore[open[best]]) best = i;
      }
      const current = open.splice(best, 1)[0];
      if (current === goalIndex) return reconstructGuardPath(cameFrom, nodes, current);

      edges[current].forEach((edge) => {
        const tentative = gScore[current] + edge.cost;
        if (tentative >= gScore[edge.to]) return;
        cameFrom[edge.to] = current;
        gScore[edge.to] = tentative;
        fScore[edge.to] = tentative + Math.hypot(nodes[edge.to].x - safeGoal.x, nodes[edge.to].y - safeGoal.y);
        if (!open.includes(edge.to)) open.push(edge.to);
      });
    }

    return [];
  }

  function guardTargetKey(state, target) {
    return `${state}:${Math.round(target.x / NAV_TARGET_GRANULARITY)}:${Math.round(target.y / NAV_TARGET_GRANULARITY)}`;
  }

  function blendGuardDirection(guard, desiredX, desiredY, dt, turnRate = 7) {
    const desiredLen = Math.hypot(desiredX, desiredY) || 1;
    const desired = { x: desiredX / desiredLen, y: desiredY / desiredLen };
    const current = guard.dir || desired;
    const factor = Math.min(1, dt * turnRate);
    const mixX = current.x + (desired.x - current.x) * factor;
    const mixY = current.y + (desired.y - current.y) * factor;
    const mixLen = Math.hypot(mixX, mixY) || 1;
    guard.dir = { x: mixX / mixLen, y: mixY / mixLen };
  }

  function moveGuardTowardTarget(room, guard, target, speed, dt) {
    const key = guardTargetKey(guard.state, target);
    if (guard.navTargetKey !== key || !guard.path.length || guard.pathIndex >= guard.path.length) {
      guard.path = findGuardPath(room, { x: guard.x, y: guard.y }, target);
      guard.pathIndex = 0;
      guard.navTargetKey = key;
      guard.stuckTimer = 0;
    }
    if (!guard.path.length) return false;

    while (guard.pathIndex < guard.path.length && Math.hypot(guard.path[guard.pathIndex].x - guard.x, guard.path[guard.pathIndex].y - guard.y) < 10) {
      guard.pathIndex += 1;
    }
    if (guard.pathIndex >= guard.path.length) {
      guard.path = [{ x: target.x, y: target.y }];
      guard.pathIndex = 0;
    }

    let next = guard.path[guard.pathIndex];
    for (let i = guard.path.length - 1; i > guard.pathIndex; i -= 1) {
      const candidate = guard.path[i];
      if (guardLineClear(room, guard.x, guard.y, candidate.x, candidate.y)) {
        guard.pathIndex = i;
        next = candidate;
        break;
      }
    }
    const dx = next.x - guard.x;
    const dy = next.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) {
      guard.pathIndex += 1;
      return true;
    }

    const turnRate = guard.state === "patrol" || guard.state === "reroute" ? 5.5 : 8;
    blendGuardDirection(guard, dx, dy, dt, turnRate);
    const arrival = clamp(dist / 34, 0.42, 1);
    const moved = moveGuardWithCollision(room, guard, guard.dir.x * speed * arrival * dt, guard.dir.y * speed * arrival * dt);
    const newDist = Math.hypot(next.x - guard.x, next.y - guard.y);

    if (!moved || newDist > dist - 0.35) {
      guard.stuckTimer += dt;
    } else {
      guard.stuckTimer = Math.max(0, guard.stuckTimer - dt * 2.5);
    }

    if (guard.stuckTimer >= STUCK_REPATH_TIME) {
      guard.path = findGuardPath(room, { x: guard.x, y: guard.y }, target);
      guard.pathIndex = 0;
      guard.navTargetKey = key;
      guard.stuckTimer = 0;
      return guard.path.length > 0;
    }

    return moved;
  }

  function moveGuardWithCollision(room, guard, dx, dy) {
    let moved = false;
    const nx = guard.x + dx;
    if (!guardBlocked(room, nx, guard.y)) {
      guard.x = nx;
      moved = moved || Math.abs(dx) > 0.001;
    }

    const ny = guard.y + dy;
    if (!guardBlocked(room, guard.x, ny)) {
      guard.y = ny;
      moved = moved || Math.abs(dy) > 0.001;
    }

    return moved;
  }

  function pointGuardAtTarget(guard, target) {
    const dx = target[0] - guard.x;
    const dy = target[1] - guard.y;
    const dist = Math.hypot(dx, dy) || 1;
    guard.dir = { x: dx / dist, y: dy / dist };
  }

  function hasLineOfSight(ax, ay, bx, by, walls) {
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 11);
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const p = { x: ax + (bx - ax) * t - 2, y: ay + (by - ay) * t - 2, w: 4, h: 4 };
      if (walls.some((wall) => rectsOverlap(p, wall))) return false;
    }
    return true;
  }

