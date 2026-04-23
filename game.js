(function () {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const roomLabel = document.getElementById("roomLabel");
  const keyLabel = document.getElementById("keyLabel");
  const alertLabel = document.getElementById("alertLabel");
  const message = document.getElementById("message");

  const W = canvas.width;
  const H = canvas.height;
  const keys = new Set();
  const TILE = 40;
  const roomNames = [
    "Kennel Gate",
    "Vent Pantry",
    "Laser Litter",
    "The Warm Box",
  ];

  const rooms = [
    {
      start: { x: 86, y: 540 },
      exit: { x: 920, y: 292, w: 38, h: 86, to: 1, need: 1 },
      keycard: { x: 790, y: 112, taken: false },
      hiding: [{ x: 462, y: 470, w: 78, h: 58 }, { x: 212, y: 96, w: 86, h: 58 }],
      walls: [
        { x: 0, y: 0, w: W, h: 28 }, { x: 0, y: H - 28, w: W, h: 28 },
        { x: 0, y: 0, w: 28, h: H }, { x: W - 28, y: 0, w: 28, h: H },
        { x: 150, y: 170, w: 300, h: 36 }, { x: 560, y: 170, w: 210, h: 36 },
        { x: 150, y: 350, w: 120, h: 36 }, { x: 390, y: 350, w: 390, h: 36 },
        { x: 600, y: 450, w: 42, h: 130 }, { x: 320, y: 28, w: 36, h: 108 },
      ],
      guards: [
        { x: 620, y: 104, route: [[620, 104], [825, 104], [825, 270], [620, 270]], i: 1, speed: 58 },
        { x: 250, y: 290, route: [[250, 290], [480, 290], [480, 520], [250, 520]], i: 1, speed: 50 },
      ],
    },
    {
      start: { x: 70, y: 334 },
      exit: { x: 454, y: 0, w: 96, h: 38, to: 2, need: 2 },
      keycard: { x: 822, y: 506, taken: false },
      hiding: [{ x: 126, y: 114, w: 74, h: 60 }, { x: 724, y: 246, w: 86, h: 58 }],
      walls: [
        { x: 0, y: 0, w: W, h: 28 }, { x: 0, y: H - 28, w: W, h: 28 },
        { x: 0, y: 0, w: 28, h: H }, { x: W - 28, y: 0, w: 28, h: H },
        { x: 96, y: 230, w: 360, h: 38 }, { x: 582, y: 230, w: 280, h: 38 },
        { x: 318, y: 398, w: 42, h: 170 }, { x: 584, y: 70, w: 42, h: 198 },
        { x: 770, y: 382, w: 44, h: 164 }, { x: 450, y: 0, w: 104, h: 28 },
      ],
      guards: [
        { x: 168, y: 522, route: [[168, 522], [662, 522]], i: 1, speed: 68 },
        { x: 812, y: 118, route: [[812, 118], [690, 118], [690, 330], [858, 330]], i: 1, speed: 54 },
        { x: 480, y: 326, route: [[480, 326], [540, 326], [540, 150], [480, 150]], i: 1, speed: 45 },
      ],
    },
    {
      start: { x: 506, y: 590 },
      exit: { x: 920, y: 76, w: 38, h: 112, to: 3, need: 3 },
      keycard: { x: 124, y: 88, taken: false },
      hiding: [{ x: 172, y: 476, w: 92, h: 58 }, { x: 690, y: 84, w: 76, h: 60 }],
      walls: [
        { x: 0, y: 0, w: W, h: 28 }, { x: 0, y: H - 28, w: W, h: 28 },
        { x: 0, y: 0, w: 28, h: H }, { x: W - 28, y: 0, w: 28, h: H },
        { x: 124, y: 190, w: 700, h: 34 }, { x: 124, y: 376, w: 690, h: 34 },
        { x: 330, y: 224, w: 38, h: 152 }, { x: 618, y: 224, w: 38, h: 152 },
      ],
      lasers: [
        { x: 150, y: 300, w: 654, h: 9, phase: 0 },
        { x: 150, y: 466, w: 514, h: 9, phase: 1.4 },
      ],
      guards: [
        { x: 224, y: 300, route: [[224, 300], [760, 300]], i: 1, speed: 72 },
        { x: 476, y: 522, route: [[476, 522], [842, 522], [842, 104], [476, 104]], i: 1, speed: 62 },
      ],
    },
    {
      start: { x: 70, y: 124 },
      exit: null,
      tuna: { x: 820, y: 520, taken: false },
      hiding: [{ x: 132, y: 494, w: 84, h: 58 }, { x: 708, y: 96, w: 84, h: 58 }],
      walls: [
        { x: 0, y: 0, w: W, h: 28 }, { x: 0, y: H - 28, w: W, h: 28 },
        { x: 0, y: 0, w: 28, h: H }, { x: W - 28, y: 0, w: 28, h: H },
        { x: 186, y: 206, w: 590, h: 38 }, { x: 186, y: 406, w: 590, h: 38 },
        { x: 368, y: 244, w: 38, h: 162 }, { x: 596, y: 244, w: 38, h: 162 },
      ],
      guards: [
        { x: 200, y: 124, route: [[200, 124], [830, 124]], i: 1, speed: 82 },
        { x: 835, y: 324, route: [[835, 324], [130, 324]], i: 1, speed: 76 },
        { x: 470, y: 526, route: [[470, 526], [750, 526], [750, 90], [470, 90]], i: 1, speed: 55 },
      ],
    },
  ];

  const player = {
    x: rooms[0].start.x,
    y: rooms[0].start.y,
    r: 15,
    room: 0,
    keys: 0,
    facing: { x: 1, y: 0 },
    hidden: false,
  };

  let alert = 0;
  let last = performance.now();
  let won = false;
  let roomFlash = 0;

  function reset() {
    rooms.forEach((room) => {
      if (room.keycard) room.keycard.taken = false;
      if (room.tuna) room.tuna.taken = false;
      room.guards.forEach((guard) => {
        guard.x = guard.route[0][0];
        guard.y = guard.route[0][1];
        guard.i = 1;
      });
    });
    player.room = 0;
    player.x = rooms[0].start.x;
    player.y = rooms[0].start.y;
    player.keys = 0;
    player.hidden = false;
    alert = 0;
    won = false;
    roomFlash = 1.2;
    message.hidden = true;
    updateHud();
  }

  function updateHud() {
    roomLabel.textContent = roomNames[player.room];
    keyLabel.textContent = `${player.keys}/3`;
    alertLabel.textContent = won ? "Cleared" : alert > 0 ? "Spotted" : player.hidden ? "Hidden" : "Clear";
    alertLabel.style.color = alert > 0 ? "#ff7b66" : player.hidden ? "#e8c659" : "#f4f1dc";
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRect(cx, cy, r, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r ** 2;
  }

  function blocked(x, y) {
    const room = rooms[player.room];
    return room.walls.some((wall) => circleRect(x, y, player.r, wall));
  }

  function hasLineOfSight(ax, ay, bx, by, walls) {
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 12);
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const p = { x: ax + (bx - ax) * t - 2, y: ay + (by - ay) * t - 2, w: 4, h: 4 };
      if (walls.some((wall) => rectsOverlap(p, wall))) return false;
    }
    return true;
  }

  function inVision(guard, room) {
    if (player.hidden) return false;
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 170 || dist < 1) return false;
    const dir = guard.dir || { x: 1, y: 0 };
    const dot = (dx / dist) * dir.x + (dy / dist) * dir.y;
    return dot > 0.52 && hasLineOfSight(guard.x, guard.y, player.x, player.y, room.walls);
  }

  function movePlayer(dt) {
    let dx = 0;
    let dy = 0;
    if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
    if (keys.has("arrowright") || keys.has("d")) dx += 1;
    if (keys.has("arrowup") || keys.has("w")) dy -= 1;
    if (keys.has("arrowdown") || keys.has("s")) dy += 1;
    if (!dx && !dy) return;

    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    player.facing = { x: dx, y: dy };

    const speed = keys.has("shift") ? 92 : 136;
    const nx = player.x + dx * speed * dt;
    const ny = player.y + dy * speed * dt;
    if (!blocked(nx, player.y)) player.x = nx;
    if (!blocked(player.x, ny)) player.y = ny;
  }

  function updateGuards(room, dt) {
    room.guards.forEach((guard) => {
      const target = guard.route[guard.i];
      const dx = target[0] - guard.x;
      const dy = target[1] - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        guard.i = (guard.i + 1) % guard.route.length;
        return;
      }
      guard.dir = { x: dx / dist, y: dy / dist };
      guard.x += guard.dir.x * guard.speed * dt;
      guard.y += guard.dir.y * guard.speed * dt;
    });
  }

  function interact() {
    const room = rooms[player.room];
    if (room.keycard && !room.keycard.taken && Math.hypot(player.x - room.keycard.x, player.y - room.keycard.y) < 44) {
      room.keycard.taken = true;
      player.keys += 1;
      roomFlash = 0.6;
    }
    if (room.tuna && !room.tuna.taken && Math.hypot(player.x - room.tuna.x, player.y - room.tuna.y) < 52) {
      room.tuna.taken = true;
      won = true;
      message.innerHTML = "Mission complete.<br>You rescued the smoked tuna and escaped with clean paws.<br><small>Press R to play again.</small>";
      message.hidden = false;
    }
  }

  function changeRoom(next) {
    player.room = next;
    player.x = rooms[next].start.x;
    player.y = rooms[next].start.y;
    alert = 0;
    roomFlash = 1;
  }

  function update(dt) {
    if (won) return;
    const room = rooms[player.room];
    movePlayer(dt);
    updateGuards(room, dt);

    player.hidden = room.hiding.some((spot) => circleRect(player.x, player.y, player.r, spot));

    if (room.exit && circleRect(player.x, player.y, player.r, room.exit)) {
      if (player.keys >= room.exit.need) changeRoom(room.exit.to);
      else roomFlash = 0.18;
    }

    if (room.lasers) {
      room.lasers.forEach((laser) => {
        const active = Math.sin(performance.now() / 380 + laser.phase) > -0.15;
        if (active && !player.hidden && circleRect(player.x, player.y, player.r, laser)) alert = 1.3;
      });
    }

    if (room.guards.some((guard) => inVision(guard, room))) alert = 1.45;
    if (alert > 0) {
      alert -= dt;
      if (alert <= 0) {
        player.x = room.start.x;
        player.y = room.start.y;
      }
    }
    roomFlash = Math.max(0, roomFlash - dt);
    updateHud();
  }

  function drawRoom(room) {
    ctx.fillStyle = "#11150f";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(233, 229, 185, 0.055)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += TILE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += TILE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    room.hiding.forEach((spot) => {
      ctx.fillStyle = "#50502e";
      ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
      ctx.fillStyle = "#6e6a3c";
      ctx.fillRect(spot.x + 8, spot.y + 8, spot.w - 16, spot.h - 16);
    });

    room.walls.forEach((wall) => {
      ctx.fillStyle = "#333b2b";
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(wall.x, wall.y, wall.w, Math.min(5, wall.h));
    });

    if (room.exit) {
      ctx.fillStyle = player.keys >= room.exit.need ? "#d2b24d" : "#6e332c";
      ctx.fillRect(room.exit.x, room.exit.y, room.exit.w, room.exit.h);
      ctx.fillStyle = "#11150f";
      ctx.font = "14px monospace";
      ctx.fillText(`${room.exit.need}`, room.exit.x + 13, room.exit.y + room.exit.h / 2 + 5);
    }

    if (room.keycard && !room.keycard.taken) drawKeycard(room.keycard.x, room.keycard.y);
    if (room.tuna && !room.tuna.taken) drawTuna(room.tuna.x, room.tuna.y);

    if (room.lasers) {
      room.lasers.forEach((laser) => {
        const active = Math.sin(performance.now() / 380 + laser.phase) > -0.15;
        ctx.fillStyle = active ? "rgba(223, 77, 63, 0.78)" : "rgba(223, 77, 63, 0.16)";
        ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
        ctx.fillStyle = active ? "#ffb0a5" : "#7e3a32";
        ctx.fillRect(laser.x - 8, laser.y - 5, 12, laser.h + 10);
        ctx.fillRect(laser.x + laser.w - 4, laser.y - 5, 12, laser.h + 10);
      });
    }
  }

  function drawVision(guard) {
    const dir = guard.dir || { x: 1, y: 0 };
    const angle = Math.atan2(dir.y, dir.x);
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(170, -92);
    ctx.arc(0, 0, 193, -0.5, 0.5);
    ctx.closePath();
    ctx.fillStyle = "rgba(221, 196, 88, 0.18)";
    ctx.fill();
    ctx.restore();
  }

  function drawCat(x, y, facing, body, eyes, scale) {
    const angle = Math.atan2(facing.y, facing.x);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, -10);
    ctx.lineTo(15, -20);
    ctx.lineTo(18, -7);
    ctx.moveTo(7, 10);
    ctx.lineTo(15, 20);
    ctx.lineTo(18, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = body;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-15, -9, 13, 1.2, 3.9);
    ctx.stroke();
    ctx.fillStyle = eyes;
    ctx.beginPath();
    ctx.arc(19, -4, 2, 0, Math.PI * 2);
    ctx.arc(19, 4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawKeycard(x, y) {
    ctx.fillStyle = "#e8c659";
    ctx.fillRect(x - 14, y - 10, 28, 20);
    ctx.fillStyle = "#1b1d13";
    ctx.fillRect(x - 8, y - 4, 10, 3);
    ctx.fillRect(x - 8, y + 3, 18, 3);
  }

  function drawTuna(x, y) {
    ctx.fillStyle = "#b7d6dc";
    ctx.beginPath();
    ctx.ellipse(x, y, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 24, y);
    ctx.lineTo(x + 48, y - 16);
    ctx.lineTo(x + 48, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2d3c3f";
    ctx.beginPath();
    ctx.arc(x - 15, y - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    const room = rooms[player.room];
    drawRoom(room);
    room.guards.forEach(drawVision);
    room.guards.forEach((guard) => drawCat(guard.x, guard.y, guard.dir || { x: 1, y: 0 }, "#a94d37", "#fff2b2", 1));
    drawCat(player.x, player.y, player.facing, player.hidden ? "#4c6955" : "#d9d3b2", "#16180f", 1.08);

    if (alert > 0) {
      ctx.fillStyle = `rgba(223, 77, 63, ${0.12 + Math.sin(performance.now() / 90) * 0.05})`;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ffb0a5";
      ctx.font = "700 24px monospace";
      ctx.fillText("ALERT: return to cover", 32, 58);
    }

    if (roomFlash > 0) {
      ctx.fillStyle = `rgba(232, 198, 89, ${roomFlash * 0.18})`;
      ctx.fillRect(0, 0, W, H);
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
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "shift"].includes(key)) {
      event.preventDefault();
    }
    keys.add(key);
    if (key === "e") interact();
    if (key === "r") reset();
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });

  reset();
  requestAnimationFrame(loop);
})();
