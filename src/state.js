"use strict";
  const player = {
    x: rooms[0].start.x,
    y: rooms[0].start.y,
    r: 15,
    room: 0,
    keys: 0,
    facing: { x: 1, y: 0 },
    hidden: false,
    moving: false,
    soft: false,
    boxed: false,
    catnip: 2,
    meowCooldown: 0,
    ventHidden: 0,
    entryGrace: 0,
    doorCooldown: 0,
    hitCooldown: 0,
    senseTimer: 0,
    senseCooldown: 0,
    life: 3,
  };

  let alert = 0;
  let alertReason = "";
  let footstepTimer = 0;
  let last = performance.now();
  let noticeText = "";
  let noticeTimer = 0;
  let radioText = "";
  let radioTimer = 0;
  let roomFlash = 0;
  let shake = 0;
  let pawTimer = 0;
  let tunaScentTimer = 0;
  let soundMeter = 0;
  let lastKnown = null;
  let sweepTimer = 0;
  let securityLevel = 0;
  let won = false;
  let gameOver = false;
  let paused = false;
  let extractionActive = false;
  let missionTime = 0;
  let roomTime = 0;
  let briefingIndex = 0;
  let directorTimer = 13;
  let audioContext = null;
  const stats = {
    alerts: 0,
    hits: 0,
    meows: 0,
    catnips: 0,
    rations: 0,
    scratches: 0,
  };

  function cloneGuardLayout(spec) {
    return {
      ...spec,
      route: spec.route.map((point) => [point[0], point[1]]),
      baseRoute: spec.route.map((point) => [point[0], point[1]]),
      room: spec.homeRoom,
    };
  }

  function restoreAllGuards() {
    rooms.forEach((room, roomIndex) => {
      room.guards = baseGuardLayouts[roomIndex].map(cloneGuardLayout);
      room.guardNav = null;
    });
  }

  function resetGuard(guard) {
    guard.x = guard.route[0][0];
    guard.y = guard.route[0][1];
    guard.i = 1;
    guard.state = "patrol";
    guard.target = null;
    guard.searchTimer = 0;
    guard.pauseTimer = 0.45 + Math.random() * 0.45;
    guard.pauseBase = 0;
    guard.suspicion = 0;
    guard.stunned = 0;
    guard.fireCooldown = 0.4 + Math.random() * 0.5;
    guard.boxRadioCooldown = 0;
    guard.aimTimer = 0;
    guard.aimMax = 0;
    guard.aimTarget = null;
    guard.path = [];
    guard.pathIndex = 0;
    guard.navTargetKey = "";
    guard.stuckTimer = 0;
    guard.repathCooldown = 0;
    guard.searchBaseAngle = 0;
    guard.searchPhase = Math.random() * Math.PI * 2;
    guard.reinforceTo = null;
    guard.reinforceDoor = null;
    guard.room = Number.isFinite(guard.room) ? guard.room : guard.homeRoom;
    pointGuardAtTarget(guard, guard.route[1]);
    guard.pauseBase = Math.atan2(guard.dir.y, guard.dir.x);
  }

  function resetRoomSystems(room) {
    room.systemDown = false;
    if (room.keycard) room.keycard.taken = false;
    if (room.tuna) room.tuna.taken = false;
    if (room.intel) room.intel.done = false;
    room.rations?.forEach((ration) => { ration.taken = false; });
    room.catnipPickups?.forEach((pickup) => { pickup.taken = false; });
    if (room.panels) room.panels.forEach((panel) => { panel.done = false; });
    if (room.alarm) {
      room.alarm.disabled = false;
      room.alarm.triggered = false;
    }
    room.cameras?.forEach((camera) => { camera.suspicion = 0; });
    room.guards.forEach(resetGuard);
  }

  function reset() {
    restoreAllGuards();
    rooms.forEach(resetRoomSystems);
    noises.length = 0;
    shots.length = 0;
    pawPrints.length = 0;
    catnips.length = 0;
    ventRattles.length = 0;
    tacticalPings.length = 0;
    player.room = START_ROOM;
    player.x = rooms[START_ROOM].start.x;
    player.y = rooms[START_ROOM].start.y;
    player.keys = 0;
    player.facing = { x: 1, y: 0 };
    player.hidden = false;
    player.boxed = false;
    player.catnip = 2;
    player.rationsHeld = 0;
    player.meowCooldown = 0;
    player.ventHidden = 0;
    player.entryGrace = 0;
    player.doorCooldown = 0;
    player.hitCooldown = 0;
    player.senseTimer = 0;
    player.senseCooldown = 0;
    player.life = MAX_LIFE;
    alert = 0;
    alertReason = "";
    footstepTimer = 0;
    radioText = "";
    radioTimer = 0;
    pawTimer = 0;
    tunaScentTimer = 0;
    soundMeter = 0;
    lastKnown = null;
    sweepTimer = 0;
    securityLevel = 0;
    won = false;
    paused = false;
    extractionActive = false;
    missionTime = 0;
    roomTime = 0;
    briefingIndex = 0;
    directorTimer = 13;
    stats.alerts = 0;
    stats.hits = 0;
    stats.meows = 0;
    stats.catnips = 0;
    stats.rations = 0;
    stats.scratches = 0;
    roomFlash = 1.2;
    shake = 0;
    notice("INFILTRATE: recover three collar tags", 2.4);
    gameOver = false;
    message.hidden = true;
    updateHud();
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function missionRank() {
    const penalty = stats.alerts * 18 + stats.hits * 28 + stats.rations * 5 + stats.scratches * 3 + stats.catnips * 2 + Math.floor(missionTime / 30);
    if (penalty <= 8) return "S";
    if (penalty <= 24) return "A";
    if (penalty <= 48) return "B";
    if (penalty <= 78) return "C";
    return "D";
  }

  function rankValue(rank) {
    return { S: 5, A: 4, B: 3, C: 2, D: 1 }[rank] || 0;
  }

  function readBestRun() {
    try {
      return JSON.parse(localStorage.getItem("whisker-best-run") || "null");
    } catch {
      return null;
    }
  }

  function writeBestRun(result) {
    try {
      localStorage.setItem("whisker-best-run", JSON.stringify(result));
    } catch {
      // Local storage can be unavailable in private browser modes.
    }
  }

  function recordRunResult() {
    const result = {
      rank: missionRank(),
      time: Math.round(missionTime),
      alerts: stats.alerts,
      hits: stats.hits,
      rations: stats.rations,
    };
    const best = readBestRun();
    const isBetter = !best
      || rankValue(result.rank) > rankValue(best.rank)
      || (result.rank === best.rank && result.time < best.time);
    if (isBetter) writeBestRun(result);
    return { result, best: isBetter ? result : best, isBetter };
  }

  function resetCurrentRoomAfterCatch() {
    const room = rooms[player.room];
    restoreAllGuards();
    player.x = room.start.x;
    player.y = room.start.y;
    player.hidden = false;
    player.moving = false;
    player.ventHidden = 0;
    player.entryGrace = 0.9;
    player.doorCooldown = 0.35;
    player.hitCooldown = 0.8;
    noises.length = 0;
    shots.length = 0;
    pawPrints.length = 0;
    catnips.length = 0;
    ventRattles.length = 0;
    tacticalPings.length = 0;
    lastKnown = null;
    room.guards.forEach(resetGuard);
    roomFlash = 1.1;
    notice("BACK TO ENTRY POINT", 1.4);
  }

