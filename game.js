(function () {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const roomLabel = document.getElementById("roomLabel");
  const keyLabel = document.getElementById("keyLabel");
  const alertLabel = document.getElementById("alertLabel");
  const gadgetLabel = document.getElementById("gadgetLabel");
  const message = document.getElementById("message");

  ctx.imageSmoothingEnabled = false;

  const VIEW_W = canvas.width;
  const SIDEBAR = 190;
  const PLAY_W = VIEW_W - SIDEBAR;
  const H = canvas.height;
  const PANEL_X = PLAY_W;
  const PANEL_W = SIDEBAR;
  const TILE = 32;
  const DEPTH = 16;
  const MAX_LIFE = 3;
  const keys = new Set();
  const noises = [];
  const shots = [];
  const pawPrints = [];
  const catnips = [];
  const ventRattles = [];
  const tacticalPings = [];
  const spriteSheet = new Image();
  const playerWalkSheet = new Image();
  const enemyWalkSheet = new Image();
  const enemyFlashlightSheet = new Image();
  const enemyAlertSheet = new Image();
  const SPRITE = 64;
  let spritesReady = false;
  let playerWalkReady = false;
  let enemyWalkReady = false;
  let enemyFlashlightReady = false;
  let enemyAlertReady = false;

  spriteSheet.onload = () => {
    spritesReady = spriteSheet.width >= SPRITE * 4 && spriteSheet.height >= SPRITE * 2;
  };
  spriteSheet.onerror = () => {
    spritesReady = false;
  };
  spriteSheet.src = "assets/whisker-sprites.png";

  playerWalkSheet.onload = () => {
    playerWalkReady = playerWalkSheet.width >= SPRITE * 4 && playerWalkSheet.height >= SPRITE * 4;
  };
  playerWalkSheet.onerror = () => {
    playerWalkReady = false;
  };
  playerWalkSheet.src = "assets/player-walk.png";

  enemyWalkSheet.onload = () => {
    enemyWalkReady = enemyWalkSheet.width >= SPRITE * 4 && enemyWalkSheet.height >= SPRITE * 4;
  };
  enemyWalkSheet.onerror = () => {
    enemyWalkReady = false;
  };
  enemyWalkSheet.src = "assets/enemy-walk.png";

  enemyFlashlightSheet.onload = () => {
    enemyFlashlightReady = enemyFlashlightSheet.width >= SPRITE * 4 && enemyFlashlightSheet.height >= SPRITE * 4;
  };
  enemyFlashlightSheet.onerror = () => {
    enemyFlashlightReady = false;
  };
  enemyFlashlightSheet.src = "assets/enemy-flashlight.png";

  enemyAlertSheet.onload = () => {
    enemyAlertReady = enemyAlertSheet.width >= SPRITE * 4 && enemyAlertSheet.height >= SPRITE * 2;
  };
  enemyAlertSheet.onerror = () => {
    enemyAlertReady = false;
  };
  enemyAlertSheet.src = "assets/enemy-alert.png";

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const rooms = [
    {
      name: "Cargo Kennel",
      floor: "#1a2118",
      wall: "#4c5742",
      trim: "#778060",
      start: { x: 86, y: 540 },
      exit: { x: 722, y: 292, w: 38, h: 86, to: 1, need: 1 },
      keycard: { x: 664, y: 112, taken: false },
      intel: { x: 220, y: 232, w: 40, h: 48, done: false, text: "VENT PAIRS CAN BREAK CONTACT FAST." },
      briefings: [
        "ZERO: tags unlock the next sector.",
        "ZERO: vents make noise, but break pursuit.",
        "ZERO: moving in the box still looks wrong.",
      ],
      rations: [{ x: 82, y: 96, taken: false }, { x: 704, y: 548, taken: false }],
      hiding: [{ x: 462, y: 470, w: 78, h: 58 }, { x: 212, y: 96, w: 86, h: 58 }],
      shadows: [{ x: 54, y: 186, w: 86, h: 106 }, { x: 326, y: 392, w: 88, h: 92 }],
      vents: [
        { x: 188, y: 122, w: 54, h: 32, tx: 662, ty: 520 },
        { x: 654, y: 498, w: 54, h: 32, tx: 224, ty: 140 },
      ],
      props: [
        { type: "pipe", x: 88, y: 258, w: 210, h: 14 },
        { type: "crate", x: 612, y: 248, w: 82, h: 54 },
        { type: "drums", x: 620, y: 448, w: 88, h: 58 },
        { type: "terminal", x: 220, y: 232, w: 40, h: 48 },
      ],
      cameras: [
        { x: 728, y: 44, base: Math.PI * 0.78, sweep: 0.46, range: 180, phase: 0 },
      ],
      panels: [{ x: 220, y: 232, w: 40, h: 48, done: false }],
      sweeps: [
        { x: 72, y: 414, w: 420, h: 110, axis: "x", phase: 0.2, speed: 0.0011 },
      ],
      walls: [
        { x: 0, y: 0, w: PLAY_W, h: 28 }, { x: 0, y: H - 28, w: PLAY_W, h: 28 },
        { x: 0, y: 0, w: 28, h: H }, { x: PLAY_W - 28, y: 0, w: 28, h: H },
        { x: 150, y: 170, w: 300, h: 36 }, { x: 540, y: 170, w: 164, h: 36 },
        { x: 150, y: 350, w: 120, h: 36 }, { x: 390, y: 350, w: 300, h: 36 },
        { x: 600, y: 450, w: 42, h: 130 }, { x: 320, y: 28, w: 36, h: 108 },
      ],
      guards: [
        { x: 560, y: 104, route: [[560, 104], [690, 104], [690, 145], [560, 145]], i: 1, speed: 58 },
        { x: 250, y: 290, route: [[250, 290], [350, 290], [350, 520], [250, 520]], i: 1, speed: 50 },
      ],
    },
    {
      name: "Vent Pantry",
      floor: "#202822",
      wall: "#45534f",
      trim: "#77918b",
      start: { x: 70, y: 334 },
      exit: { x: 454, y: 0, w: 96, h: 38, to: 2, need: 2 },
      keycard: { x: 650, y: 506, taken: false },
      intel: { x: 694, y: 312, w: 40, h: 48, done: false, text: "SHADOWS HIDE YOU ONLY WHILE SNEAKING." },
      briefings: [
        "ZERO: shadows only work with soft paws.",
        "ZERO: catnip pulls patrols off their route.",
        "ZERO: cameras build suspicion before contact.",
      ],
      rations: [{ x: 236, y: 132, taken: false }, { x: 614, y: 340, taken: false }],
      catnipPickups: [{ x: 520, y: 120, taken: false }],
      hiding: [{ x: 126, y: 114, w: 74, h: 60 }, { x: 642, y: 286, w: 74, h: 54 }],
      shadows: [{ x: 384, y: 156, w: 114, h: 70 }, { x: 94, y: 506, w: 118, h: 74 }],
      vents: [
        { x: 76, y: 468, w: 54, h: 32, tx: 725, ty: 110 },
        { x: 670, y: 92, w: 54, h: 32, tx: 104, ty: 488 },
      ],
      props: [
        { type: "crate", x: 396, y: 94, w: 88, h: 62 },
        { type: "pipe", x: 510, y: 404, w: 176, h: 14 },
        { type: "terminal", x: 694, y: 312, w: 40, h: 48 },
      ],
      cameras: [
        { x: 720, y: 58, base: Math.PI * 0.86, sweep: 0.54, range: 190, phase: 0.9 },
      ],
      panels: [{ x: 694, y: 312, w: 40, h: 48, done: false }],
      sweeps: [
        { x: 66, y: 78, w: 488, h: 112, axis: "x", phase: 1.6, speed: 0.001 },
      ],
      walls: [
        { x: 0, y: 0, w: PLAY_W, h: 28 }, { x: 0, y: H - 28, w: PLAY_W, h: 28 },
        { x: 0, y: 0, w: 28, h: H }, { x: PLAY_W - 28, y: 0, w: 28, h: H },
        { x: 96, y: 230, w: 300, h: 38 }, { x: 506, y: 230, w: 198, h: 38 },
        { x: 318, y: 398, w: 42, h: 170 }, { x: 584, y: 70, w: 42, h: 198 },
        { x: 650, y: 382, w: 44, h: 164 }, { x: 450, y: 0, w: 104, h: 28 },
      ],
      guards: [
        { x: 168, y: 522, route: [[168, 522], [288, 522], [288, 330], [168, 330]], i: 1, speed: 68 },
        { x: 682, y: 118, route: [[682, 118], [650, 118], [650, 210], [708, 210]], i: 1, speed: 54 },
        { x: 430, y: 326, route: [[430, 326], [540, 326], [540, 300], [430, 300]], i: 1, speed: 45 },
      ],
    },
    {
      name: "Laser Litter",
      floor: "#1c2026",
      wall: "#4a4f5d",
      trim: "#7d86a0",
      start: { x: 506, y: 590 },
      exit: { x: 722, y: 76, w: 38, h: 112, to: 3, need: 3 },
      keycard: { x: 124, y: 88, taken: false },
      intel: { x: 84, y: 532, w: 46, h: 54, done: false, text: "PANEL CLAWS CUT LASERS AND CAMERAS." },
      briefings: [
        "ZERO: scratch panels before crossing beams.",
        "ZERO: patrol routes are visible after intel.",
        "ZERO: a stunned guard can still be found.",
      ],
      rations: [{ x: 558, y: 126, taken: false }, { x: 224, y: 532, taken: false }],
      catnipPickups: [{ x: 674, y: 316, taken: false }],
      hiding: [{ x: 172, y: 476, w: 92, h: 58 }, { x: 690, y: 84, w: 76, h: 60 }],
      shadows: [{ x: 370, y: 414, w: 132, h: 82 }, { x: 662, y: 212, w: 72, h: 84 }],
      panels: [{ x: 84, y: 532, w: 46, h: 54, done: false }],
      props: [
        { type: "terminal", x: 84, y: 532, w: 46, h: 54 },
        { type: "pipe", x: 590, y: 280, w: 124, h: 14 },
        { type: "crate", x: 432, y: 266, w: 74, h: 60 },
      ],
      cameras: [
        { x: 706, y: 344, base: Math.PI, sweep: 0.72, range: 210, phase: 1.4, disabledBySystem: true },
        { x: 62, y: 174, base: 0.28, sweep: 0.5, range: 180, phase: 2.3, disabledBySystem: true },
      ],
      walls: [
        { x: 0, y: 0, w: PLAY_W, h: 28 }, { x: 0, y: H - 28, w: PLAY_W, h: 28 },
        { x: 0, y: 0, w: 28, h: H }, { x: PLAY_W - 28, y: 0, w: 28, h: H },
        { x: 124, y: 190, w: 580, h: 34 }, { x: 124, y: 376, w: 570, h: 34 },
        { x: 330, y: 224, w: 38, h: 152 }, { x: 618, y: 224, w: 38, h: 152 },
      ],
      lasers: [
        { x: 150, y: 300, w: 520, h: 9, phase: 0 },
        { x: 150, y: 466, w: 430, h: 9, phase: 1.4 },
      ],
      guards: [
        { x: 150, y: 300, route: [[150, 300], [300, 300]], i: 1, speed: 72 },
        { x: 476, y: 522, route: [[476, 522], [680, 522], [680, 430], [476, 430]], i: 1, speed: 62 },
      ],
    },
    {
      name: "Warm Box",
      floor: "#211d18",
      wall: "#584a3e",
      trim: "#8f7458",
      start: { x: 70, y: 124 },
      exit: null,
      tuna: { x: 660, y: 520, taken: false },
      intel: { x: 644, y: 92, w: 42, h: 48, done: false, text: "FINAL ROOM: STUN ONLY WHEN CLOSE." },
      briefings: [
        "ZERO: the tuna scent will wake the base.",
        "ZERO: evac is back at the entry pad.",
        "ZERO: do not fight the room, bend it.",
      ],
      rations: [{ x: 262, y: 532, taken: false }, { x: 104, y: 300, taken: false }],
      catnipPickups: [{ x: 458, y: 330, taken: false }],
      hiding: [{ x: 132, y: 494, w: 84, h: 58 }, { x: 636, y: 96, w: 84, h: 58 }],
      shadows: [{ x: 70, y: 146, w: 96, h: 80 }, { x: 606, y: 446, w: 110, h: 82 }],
      vents: [{ x: 454, y: 64, w: 54, h: 32, tx: 252, ty: 532 }],
      props: [
        { type: "pipe", x: 124, y: 84, w: 234, h: 14 },
        { type: "crate", x: 650, y: 92, w: 74, h: 58 },
        { type: "drums", x: 80, y: 276, w: 94, h: 62 },
      ],
      cameras: [
        { x: 712, y: 584, base: -Math.PI * 0.72, sweep: 0.58, range: 190, phase: 3.1 },
      ],
      panels: [{ x: 644, y: 92, w: 42, h: 48, done: false }],
      sweeps: [
        { x: 218, y: 252, w: 414, h: 116, axis: "y", phase: 0.7, speed: 0.00125 },
      ],
      walls: [
        { x: 0, y: 0, w: PLAY_W, h: 28 }, { x: 0, y: H - 28, w: PLAY_W, h: 28 },
        { x: 0, y: 0, w: 28, h: H }, { x: PLAY_W - 28, y: 0, w: 28, h: H },
        { x: 186, y: 206, w: 500, h: 38 }, { x: 186, y: 406, w: 500, h: 38 },
        { x: 368, y: 244, w: 38, h: 162 }, { x: 560, y: 244, w: 38, h: 162 },
      ],
      guards: [
        { x: 200, y: 124, route: [[200, 124], [690, 124]], i: 1, speed: 82 },
        { x: 630, y: 324, route: [[630, 324], [690, 324], [690, 276], [630, 276]], i: 1, speed: 76 },
        { x: 470, y: 526, route: [[470, 526], [680, 526], [680, 470], [470, 470]], i: 1, speed: 55 },
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
    moving: false,
    soft: false,
    boxed: false,
    catnip: 2,
    meowCooldown: 0,
    ventHidden: 0,
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
    pointGuardAtTarget(guard, guard.route[1]);
  }

  function resetRoomSystems(room) {
    room.systemDown = false;
    if (room.keycard) room.keycard.taken = false;
    if (room.tuna) room.tuna.taken = false;
    if (room.intel) room.intel.done = false;
    room.rations?.forEach((ration) => { ration.taken = false; });
    room.catnipPickups?.forEach((pickup) => { pickup.taken = false; });
    if (room.panels) room.panels.forEach((panel) => { panel.done = false; });
    room.cameras?.forEach((camera) => { camera.suspicion = 0; });
    room.guards.forEach(resetGuard);
  }

  function reset() {
    rooms.forEach(resetRoomSystems);
    noises.length = 0;
    shots.length = 0;
    pawPrints.length = 0;
    catnips.length = 0;
    ventRattles.length = 0;
    tacticalPings.length = 0;
    player.room = 0;
    player.x = rooms[0].start.x;
    player.y = rooms[0].start.y;
    player.keys = 0;
    player.facing = { x: 1, y: 0 };
    player.hidden = false;
    player.boxed = false;
    player.catnip = 2;
    player.meowCooldown = 0;
    player.ventHidden = 0;
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
    player.x = room.start.x;
    player.y = room.start.y;
    player.hidden = false;
    player.moving = false;
    player.ventHidden = 0;
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

  function notice(text, seconds) {
    noticeText = text;
    noticeTimer = seconds;
  }

  function radio(text, seconds = 1.35) {
    if (radioTimer > 0.4 && radioText === text) return;
    radioText = text;
    radioTimer = seconds;
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
    }
  }

  function maxSuspicion() {
    return rooms[player.room].guards.reduce((max, guard) => Math.max(max, guard.suspicion || 0), 0);
  }

  function remainingRations(room) {
    return room.rations?.filter((ration) => !ration.taken).length || 0;
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
    if (player.moving) return clamp(1.2 - dist / 230, 0.28, 1);
    return nearPlausibleBoxSpot(room) ? 0 : clamp(0.48 - dist / 460, 0.12, 0.42);
  }

  function securityFactor() {
    return 1 + securityLevel * 0.08;
  }

  function facilityPressure() {
    return 1 + securityLevel * 0.1 + (extractionActive ? 0.22 : 0);
  }

  function objectiveText(room) {
    if (extractionActive) return alert > 0 ? "EVAC UNDER FIRE" : "REACH EVAC";
    if (alert > 0) return "BREAK CONTACT";
    if (sweepTimer > 0) return "AVOID SWEEP";
    if (boxCover(room)) return "BOX COVER";
    if (player.soft && inShadow(room)) return "SHADOW COVER";
    if (room.tuna && !room.tuna.taken) return "SECURE TUNA";
    if (room.exit && player.keys < room.exit.need) return `FIND TAG ${room.exit.need}`;
    if (room.panels?.some((panel) => !panel.done) && (room.sweeps?.length || room.cameras?.some((camera) => camera.disabledBySystem))) return "SCRATCH PANEL";
    if (room.exit) return "REACH EXIT";
    return "STAY LOW";
  }

  function objectiveTarget(room) {
    if (extractionActive) return { x: room.start.x, y: room.start.y, r: 42 };
    if (room.tuna && !room.tuna.taken) return { x: room.tuna.x, y: room.tuna.y, r: 32 };
    if (room.exit && player.keys < room.exit.need && room.keycard && !room.keycard.taken) {
      return { x: room.keycard.x, y: room.keycard.y, r: 24 };
    }
    const panel = room.panels?.find((candidate) => !candidate.done);
    if (panel && (room.sweeps?.length || room.cameras?.some((camera) => camera.disabledBySystem))) {
      return { x: panel.x + panel.w / 2, y: panel.y + panel.h / 2, r: 30 };
    }
    if (room.exit) return { x: room.exit.x + room.exit.w / 2, y: room.exit.y + room.exit.h / 2, r: 34 };
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
    if (room.exit) points.push({ x: room.exit.x + room.exit.w / 2, y: room.exit.y + room.exit.h / 2, label: "EXIT" });
    if (room.keycard && !room.keycard.taken) points.push({ x: room.keycard.x, y: room.keycard.y, label: "TAG" });
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
    keyLabel.textContent = `${player.keys}/3`;
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
    return room.walls.some((wall) => circleRect(x, y, player.r, wall));
  }

  function guardBlocked(room, x, y) {
    return room.walls.some((wall) => circleRect(x, y, 12, wall));
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

  function makeNoise(x, y, radius, ttl, color, label, kind) {
    soundMeter = Math.max(soundMeter, kind === "meow" ? 1 : kind === "shot" ? 0.9 : kind === "scratch" ? 0.7 : kind === "step" ? 0.42 : 0.32);
    noises.push({
      x: clamp(x, 36, PLAY_W - 36),
      y: clamp(y, 36, H - 36),
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
    lastKnown = {
      x: clamp(x, 32, PLAY_W - 32),
      y: clamp(y, 32, H - 32),
      ttl: 2.8,
      maxTtl: 2.8,
      reason,
    };
  }

  function triggerCaught(reason) {
    if (won || gameOver) return;
    const wasClear = alert <= 0;
    const target = {
      x: clamp(player.x, 44, PLAY_W - 44),
      y: clamp(player.y, 44, H - 44),
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
    rooms[player.room].guards.forEach((guard, index) => {
      const angle = index * 2.35;
      const offset = index === 0 ? 0 : 34;
      guard.state = "investigate";
      guard.searchTimer = 1.6;
      guard.suspicion = 1;
      guard.target = {
        x: clamp(target.x + Math.cos(angle) * offset, 44, PLAY_W - 44),
        y: clamp(target.y + Math.sin(angle) * offset, 44, H - 44),
      };
    });
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
    });
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
    message.innerHTML = `Mission complete.<br>The smoked tuna is secure.<br><small>Rank ${result.rank} | Time ${formatTime(result.time)} | Alerts ${result.alerts} | Hits ${result.hits} | Scratches ${stats.scratches}${isBetter ? "<br>New best infiltration." : `<br>Best ${best.rank} | ${formatTime(best.time)}`}<br>Press R to infiltrate again.</small>`;
    message.hidden = false;
  }

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

  function dropCatnip() {
    if (won || gameOver || paused) return;
    if (player.catnip <= 0) {
      notice("CATNIP EMPTY", 0.75);
      return;
    }
    player.catnip -= 1;
    stats.catnips += 1;
    catnips.push({
      x: clamp(player.x, 40, PLAY_W - 40),
      y: clamp(player.y, 40, H - 40),
      ttl: 7.2,
      maxTtl: 7.2,
      pulse: 0,
    });
    roomFlash = Math.max(roomFlash, 0.28);
    makeNoise(player.x, player.y, 210, 0.55, "rgba(126, 214, 200, 0.72)", "CATNIP", "catnip");
    playCue("pickup");
    notice("CATNIP POUCH DROPPED", 0.9);
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
    if (!player.moving) return;

    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    player.facing = { x: dx, y: dy };

    const baseSpeed = player.boxed ? 54 : player.soft ? 88 : 138;
    const speed = baseSpeed * (extractionActive ? 0.86 : 1);
    const nx = player.x + dx * speed * dt;
    const ny = player.y + dy * speed * dt;
    if (!blocked(nx, player.y)) player.x = nx;
    if (!blocked(player.x, ny)) player.y = ny;

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
      room.guards.forEach((guard) => {
        if (guard.stunned > 0) return;
        const dist = Math.hypot(sound.x - guard.x, sound.y - guard.y);
        const muffled = hasLineOfSight(sound.x, sound.y, guard.x, guard.y, room.walls) ? 1 : 0.55;
        if (dist <= sound.radius * muffled) {
          guard.state = "investigate";
          guard.target = { x: sound.x, y: sound.y };
          guard.suspicion = Math.max(guard.suspicion, sound.kind === "meow" ? 0.34 : 0.16);
          responders += 1;
        }
      });
      if (responders > 0) {
        if (sound.kind === "meow") radio("GUARD: heard a meow");
        else if (sound.kind === "catnip") radio("GUARD: strange scent");
        else if (sound.kind === "tuna") radio("GUARD: tuna scent");
        else if (sound.kind === "box") radio("GUARD: box rustle");
        else if (sound.kind === "step") radio("GUARD: movement");
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

  function updateCatnips(dt) {
    for (let i = catnips.length - 1; i >= 0; i -= 1) {
      const pouch = catnips[i];
      pouch.ttl -= dt;
      pouch.pulse -= dt;
      if (pouch.ttl <= 0) {
        catnips.splice(i, 1);
      } else if (pouch.pulse <= 0) {
        pouch.pulse = 1.05;
        makeNoise(pouch.x, pouch.y, 190, 0.46, "rgba(126, 214, 200, 0.58)", "SNIFF", "catnip");
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
    tacticalPings.push({
      x: clamp(x, 36, PLAY_W - 36),
      y: clamp(y, 36, H - 36),
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

  function commandPatrolShift(room) {
    if (alert > 0 || sweepTimer > 0 || won || gameOver) return false;
    const guards = room.guards.filter((guard) => guard.stunned <= 0 && guard.state !== "investigate");
    const points = tacticalPoints(room);
    if (!guards.length || !points.length) return false;

    const guard = guards[Math.floor(Math.random() * guards.length)];
    const sorted = points
      .map((point) => ({ ...point, dist: Math.hypot(point.x - guard.x, point.y - guard.y) }))
      .sort((a, b) => b.dist - a.dist);
    const pick = sorted[Math.floor(Math.random() * Math.min(3, sorted.length))];
    const target = openTacticalPoint(room, pick.x, pick.y, guard.route[guard.i]);
    guard.state = "investigate";
    guard.target = target;
    guard.searchTimer = 1.8;
    guard.suspicion = Math.max(guard.suspicion, extractionActive ? 0.58 : 0.24);
    addTacticalPing(target.x, target.y, pick.label, extractionActive ? "#f35d4c" : "#ffd65a");
    radio(extractionActive ? `CP: intercept ${pick.label}` : `CP: check ${pick.label}`);
    return true;
  }

  function updateDirector(room, dt) {
    if (won || gameOver || paused) return;
    directorTimer -= dt;
    if (directorTimer > 0) return;
    directorTimer = patrolShiftDelay();
    if (missionTime < 10 && !extractionActive) return;
    if (commandPatrolShift(room)) {
      notice(extractionActive ? "CP ORDER: INTERCEPT ROUTE" : "CP ORDER: PATROL SHIFT", 0.9);
    }
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
          print.fresh = false;
          radio("GUARD: fresh paw prints");
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
    radio("GUARD: taking aim", 0.9);
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
      guard.state = "search";
      guard.searchTimer = 0.9;
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

  function visionScore(guard, room) {
    if (guard.stunned > 0) return 0;
    if (player.hidden) return 0;
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = Math.hypot(dx, dy);
    const heightened = guard.state === "investigate" || guard.state === "search" || guard.state === "sweep";
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
    room.walls.forEach((wall) => {
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
      if (!player.hidden && circleRect(player.x, player.y, player.r, beam)) {
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
    markLastKnown(downed.x, downed.y, "GUARD DOWN");
    if (!downed.reported) {
      downed.reported = true;
      radio("GUARD: unit down");
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
        const base = guard.pauseBase || Math.atan2((guard.dir || { y: 0 }).y, (guard.dir || { x: 1 }).x);
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
        const base = Math.atan2(guard.dir.y, guard.dir.x);
        const sweep = Math.sin(performance.now() / 230) * 1.1;
        guard.dir = { x: Math.cos(base + sweep), y: Math.sin(base + sweep) };
        if (guard.searchTimer <= 0) guard.state = "patrol";
      } else if (!patrolPausing) {
        const target = (guard.state === "investigate" || guard.state === "sweep") && guard.target
          ? [guard.target.x, guard.target.y]
          : guard.route[guard.i];
        const dx = target[0] - guard.x;
        const dy = target[1] - guard.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 5) {
          if (guard.state === "investigate") {
            guard.state = "search";
            guard.searchTimer = 1.25;
          } else if (guard.state === "sweep") {
            guard.state = "search";
            guard.searchTimer = 0.9;
            guard.target = null;
          } else {
            const next = guard.route[(guard.i + 1) % guard.route.length];
            guard.pauseBase = Math.atan2(next[1] - guard.y, next[0] - guard.x);
            guard.pauseTimer = 0.55 + Math.random() * 0.85;
            guard.i = (guard.i + 1) % guard.route.length;
          }
        } else {
          guard.dir = { x: dx / dist, y: dy / dist };
          const speed = guard.speed * securityFactor() * (guard.state === "investigate" ? 1.22 : guard.state === "sweep" ? 1.08 : 1);
          const moved = moveGuardWithCollision(room, guard, guard.dir.x * speed * dt, guard.dir.y * speed * dt);
          if (!moved && (guard.state === "investigate" || guard.state === "sweep")) {
            guard.state = "search";
            guard.searchTimer = 1.1;
            guard.target = null;
          } else if (!moved) {
            guard.pauseTimer = 0.35;
            guard.pauseBase = Math.atan2((guard.dir || { y: 0 }).y, (guard.dir || { x: 1 }).x);
            guard.i = (guard.i + 1) % guard.route.length;
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
          radio(player.moving ? "GUARD: moving box" : "GUARD: stray box");
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

  function interact() {
    if (won || gameOver) return;
    const room = rooms[player.room];

    const guard = scratchableGuard(room);
    if (guard) {
      scratchGuard(room, guard);
      return;
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
        roomFlash = 0.55;
        addVentRattle(entryX, entryY);
        addVentRattle(player.x, player.y);
        makeNoise(entryX, entryY, 128, 0.46, "rgba(126, 214, 200, 0.62)", "GRATE", "vent");
        makeNoise(player.x, player.y, 116, 0.46, "rgba(126, 214, 200, 0.6)", "VENT", "vent");
        alert = Math.max(0, alert - 0.9);
        radio("GUARD: vent rattle");
        playCue("room");
        notice("DUCT ROUTE USED: STAY LOW", 1.1);
        return;
      }
    }

    if (room.panels) {
      const panel = room.panels.find((candidate) => !candidate.done && nearRect(candidate, 32));
      if (panel) {
        panel.done = true;
        if (room.intel && Math.abs((panel.x + panel.w / 2) - (room.intel.x + room.intel.w / 2)) < 8 && Math.abs((panel.y + panel.h / 2) - (room.intel.y + room.intel.h / 2)) < 8) {
          room.intel.done = true;
        }
        room.systemDown = true;
        if (!extractionActive) securityLevel = Math.max(0, securityLevel - 1.1);
        roomFlash = 0.7;
        makeNoise(panel.x + panel.w / 2, panel.y + panel.h / 2, 124, 0.5, "rgba(255, 214, 90, 0.65)", "SCRATCH", "scratch");
        playCue("pickup");
        radio("CP: local security offline");
        notice(room.intel?.text || "SECURITY PANEL CLAWED: SYSTEM DOWN", 2.2);
        return;
      }
    }

    if (room.intel && !room.intel.done && nearRect(room.intel, 34)) {
      room.intel.done = true;
      roomFlash = 0.5;
      makeNoise(room.intel.x + room.intel.w / 2, room.intel.y + room.intel.h / 2, 94, 0.36, "rgba(126, 214, 200, 0.58)", "DATA", "intel");
      playCue("pickup");
      notice(room.intel.text, 2.2);
      return;
    }

    if (room.keycard && !room.keycard.taken && Math.hypot(player.x - room.keycard.x, player.y - room.keycard.y) < 44) {
      room.keycard.taken = true;
      player.keys += 1;
      roomFlash = 0.55;
      playCue("pickup");
      notice("COLLAR TAG ACQUIRED", 1.2);
      return;
    }

    const ration = room.rations?.find((candidate) => !candidate.taken && Math.hypot(player.x - candidate.x, player.y - candidate.y) < 42);
    if (ration) {
      if (player.life >= MAX_LIFE) {
        notice("RATION HELD: LIFE FULL", 0.9);
        return;
      }
      ration.taken = true;
      player.life = Math.min(MAX_LIFE, player.life + 1);
      stats.rations += 1;
      roomFlash = 0.45;
      playCue("pickup");
      notice("TUNA RATION USED: LIFE +1", 1.2);
      return;
    }

    const catnipPickup = room.catnipPickups?.find((candidate) => !candidate.taken && Math.hypot(player.x - candidate.x, player.y - candidate.y) < 42);
    if (catnipPickup) {
      if (player.catnip >= 3) {
        notice("CATNIP FULL", 0.9);
        return;
      }
      catnipPickup.taken = true;
      player.catnip = Math.min(3, player.catnip + 1);
      roomFlash = 0.38;
      playCue("pickup");
      notice("CATNIP POUCH ACQUIRED", 1.05);
      return;
    }

    if (room.tuna && !room.tuna.taken && Math.hypot(player.x - room.tuna.x, player.y - room.tuna.y) < 52) {
      room.tuna.taken = true;
      playCue("pickup");
      startExtraction(room);
    }
  }

  function changeRoom(next) {
    player.room = next;
    player.x = rooms[next].start.x;
    player.y = rooms[next].start.y;
    player.hidden = false;
    player.boxed = false;
    player.ventHidden = 0;
    alert = 0;
    alertReason = "";
    noises.length = 0;
    shots.length = 0;
    pawPrints.length = 0;
    catnips.length = 0;
    ventRattles.length = 0;
    tacticalPings.length = 0;
    lastKnown = null;
    sweepTimer = 0;
    roomTime = 0;
    briefingIndex = 0;
    directorTimer = patrolShiftDelay();
    roomFlash = 1;
    playCue("room");
    notice(`ENTERING ${rooms[next].name.toUpperCase()}`, 1.4);
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
    if (player.hitCooldown > 0) player.hitCooldown = Math.max(0, player.hitCooldown - dt);
    if (noticeTimer > 0) noticeTimer = Math.max(0, noticeTimer - dt);
    if (radioTimer > 0) radioTimer = Math.max(0, radioTimer - dt);
    shake = Math.max(0, shake - dt * 18);
    soundMeter = Math.max(0, soundMeter - dt * 1.7);
    if (alert <= 0 && player.hidden) securityLevel = Math.max(0, securityLevel - dt * 0.075);
    roomFlash = Math.max(0, roomFlash - dt);

    const room = rooms[player.room];

    movePlayer(dt);
    player.hidden = player.ventHidden > 0
      || room.hiding.some((spot) => circleRect(player.x, player.y, player.r, spot))
      || (player.soft && inShadow(room))
      || boxCover(room);

    updateCatnips(dt);
    updateTunaScent(dt);
    updateVentRattles(dt);
    updateTacticalPings(dt);
    applyFreshNoises(room);
    applyFreshPawPrints(room);
    updateNoises(dt);
    updateShots(dt);
    updatePawPrints(dt);
    updateSensorSweeps(room);
    updateCameras(room, dt);
    updateGuards(room, dt);
    updateDirector(room, dt);
    updateBriefings(room);

    if (alert > 0) {
      const pressure = maxSuspicion();
      const decay = player.hidden ? 1.65 : pressure < 0.3 ? 0.55 : 0.16;
      alert = Math.max(0, alert - dt * decay);
      if (alert <= 0) {
        alertReason = "";
        startRoomSweep(room);
      }
    }
    if (sweepTimer > 0) sweepTimer = Math.max(0, sweepTimer - dt);

    if (room.exit && circleRect(player.x, player.y, player.r, room.exit)) {
      if (alert > 0) {
        roomFlash = 0.2;
        shake = Math.max(shake, 1.2);
        notice("LOCKDOWN: BREAK CONTACT", 0.7);
      } else if (player.keys >= room.exit.need) {
        changeRoom(room.exit.to);
      } else {
        roomFlash = 0.16;
        notice(`TAG ${room.exit.need} REQUIRED`, 0.5);
      }
    }

    if (room.lasers && !room.systemDown) {
      room.lasers.forEach((laser) => {
        const active = Math.sin(performance.now() / 380 + laser.phase) > -0.15;
        if (active && !player.hidden && circleRect(player.x, player.y, player.r, laser)) {
          triggerCaught("LASER TRIP");
        }
      });
    }

    if (extractionActive && Math.hypot(player.x - room.start.x, player.y - room.start.y) < 38) {
      completeMission();
    }

    updateHud();
  }

  function drawFloor(room) {
    ctx.fillStyle = room.floor;
    ctx.fillRect(0, 0, PLAY_W, H);
    for (let y = 28; y < H - 28; y += TILE) {
      for (let x = 28; x < PLAY_W - 28; x += TILE) {
        const alt = ((x / TILE) + (y / TILE)) % 2;
        ctx.fillStyle = alt ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.055)";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = "rgba(12, 18, 16, 0.5)";
        ctx.strokeRect(x + 0.5, y + 0.5, TILE, TILE);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(x + 4, y + 4, 3, 3);
        ctx.fillRect(x + 24, y + 24, 3, 3);
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(x + 1, y + TILE - 4, TILE - 2, 3);
      }
    }
  }

  function drawWall(room, wall) {
    const face = wall.y + wall.h + DEPTH <= H ? DEPTH : 0;
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(wall.x + 7, wall.y + 9, wall.w, wall.h + face);

    if (face) {
      ctx.fillStyle = "#27302a";
      ctx.fillRect(wall.x, wall.y + wall.h, wall.w, face);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(wall.x, wall.y + wall.h + face - 5, wall.w, 5);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      for (let x = wall.x + 18; x < wall.x + wall.w; x += 34) {
        ctx.beginPath();
        ctx.moveTo(x, wall.y + wall.h + 2);
        ctx.lineTo(x - 8, wall.y + wall.h + face - 3);
        ctx.stroke();
      }
    }

    ctx.fillStyle = room.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = room.trim;
    ctx.fillRect(wall.x, wall.y, wall.w, Math.min(5, wall.h));
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(wall.x, wall.y + wall.h - 5, wall.w, 5);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(wall.x + 3, wall.y + 5, Math.max(0, wall.w - 6), 4);
    ctx.strokeStyle = "rgba(12, 17, 16, 0.5)";
    ctx.lineWidth = 1;
    for (let x = wall.x + 28; x < wall.x + wall.w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, wall.y + 5);
      ctx.lineTo(x, wall.y + wall.h - 5);
      ctx.stroke();
    }
  }

  function drawCrate(rect, color) {
    const face = 12;
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    ctx.fillRect(rect.x + 5, rect.y + 7, rect.w, rect.h + face);
    ctx.fillStyle = "#484528";
    ctx.fillRect(rect.x, rect.y + rect.h, rect.w, face);
    ctx.fillStyle = color || "#7b7443";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(rect.x + 8, rect.y + 7, rect.w - 16, rect.h - 16);
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.fillRect(rect.x, rect.y + rect.h - 5, rect.w, 5);
    ctx.strokeStyle = "rgba(20,20,12,0.45)";
    ctx.beginPath();
    ctx.moveTo(rect.x + 8, rect.y + 8);
    ctx.lineTo(rect.x + rect.w - 8, rect.y + rect.h - 8);
    ctx.moveTo(rect.x + rect.w - 8, rect.y + 8);
    ctx.lineTo(rect.x + 8, rect.y + rect.h - 8);
    ctx.stroke();
  }

  function drawVent(vent) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(vent.x + 4, vent.y + 7, vent.w, vent.h);
    ctx.fillStyle = "#12181b";
    ctx.fillRect(vent.x, vent.y, vent.w, vent.h);
    ctx.fillStyle = "#7ed6c8";
    ctx.fillRect(vent.x + 4, vent.y + 4, vent.w - 8, 3);
    for (let x = vent.x + 8; x < vent.x + vent.w - 6; x += 10) {
      ctx.fillStyle = "#364345";
      ctx.fillRect(x, vent.y + 9, 4, vent.h - 14);
    }
  }

  function drawVentRattles() {
    ventRattles.forEach((rattle) => {
      const alpha = rattle.ttl / rattle.maxTtl;
      ctx.strokeStyle = `rgba(126, 214, 200, ${0.18 + alpha * 0.45})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(rattle.x - 19, rattle.y - 13, 38, 26);
      ctx.beginPath();
      ctx.moveTo(rattle.x - 24, rattle.y);
      ctx.lineTo(rattle.x - 30, rattle.y - 6);
      ctx.moveTo(rattle.x + 24, rattle.y);
      ctx.lineTo(rattle.x + 30, rattle.y + 6);
      ctx.stroke();
      ctx.lineWidth = 1;
    });
  }

  function drawTacticalPings() {
    tacticalPings.forEach((ping) => {
      const alpha = ping.ttl / ping.maxTtl;
      const radius = 10 + (1 - alpha) * 28;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ping.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(ping.x - radius / 2, ping.y - radius / 2, radius, radius);
      ctx.beginPath();
      ctx.moveTo(ping.x - 18, ping.y);
      ctx.lineTo(ping.x + 18, ping.y);
      ctx.moveTo(ping.x, ping.y - 18);
      ctx.lineTo(ping.x, ping.y + 18);
      ctx.stroke();
      ctx.fillStyle = "#050706";
      ctx.fillRect(ping.x - 16, ping.y - 30, 32, 12);
      ctx.fillStyle = ping.color;
      ctx.font = "700 8px monospace";
      ctx.fillText(ping.label, ping.x - Math.min(13, ping.label.length * 3), ping.y - 21);
      ctx.restore();
      ctx.lineWidth = 1;
    });
  }

  function drawPanel(panel, active) {
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    ctx.fillRect(panel.x + 4, panel.y + 7, panel.w, panel.h);
    ctx.fillStyle = "#111415";
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = active ? "#7ed6c8" : "#f35d4c";
    ctx.fillRect(panel.x + 8, panel.y + 8, panel.w - 16, 9);
    ctx.fillStyle = "#30383a";
    ctx.fillRect(panel.x + 10, panel.y + 25, panel.w - 20, 18);
    if (active) {
      ctx.fillStyle = "#071110";
      ctx.fillRect(panel.x + 11, panel.y + 28, panel.w - 22, 11);
      ctx.fillStyle = "#7ed6c8";
      ctx.font = "700 8px monospace";
      ctx.fillText("OFF", panel.x + 13, panel.y + 37);
    }
  }

  function drawCamera(camera, active) {
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.rotate(cameraAngle(camera));
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(-13, -6, 28, 14);
    ctx.fillStyle = active ? "#2a3432" : "#1b2220";
    ctx.fillRect(-12, -7, 22, 14);
    ctx.fillStyle = active ? "#f35d4c" : "#46504a";
    ctx.fillRect(8, -4, 7, 8);
    ctx.fillStyle = "#9aa8a3";
    ctx.fillRect(-8, -10, 10, 3);
    ctx.restore();
  }

  function drawShadowZone(shadow) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(shadow.x, shadow.y, shadow.w, shadow.h);
    ctx.fillStyle = "rgba(126, 214, 200, 0.045)";
    for (let y = shadow.y + 8; y < shadow.y + shadow.h; y += 14) {
      ctx.fillRect(shadow.x + 6, y, shadow.w - 12, 2);
    }
    ctx.strokeStyle = "rgba(126, 214, 200, 0.12)";
    ctx.strokeRect(shadow.x + 0.5, shadow.y + 0.5, shadow.w, shadow.h);
  }

  function drawProp(prop) {
    if (prop.type === "crate") {
      drawCrate(prop, "#6f7044");
    } else if (prop.type === "pipe") {
      ctx.fillStyle = "rgba(0,0,0,0.24)";
      ctx.fillRect(prop.x + 3, prop.y + 8, prop.w, prop.h + 4);
      ctx.fillStyle = "#7b8b86";
      ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
      ctx.fillStyle = "#3a4744";
      ctx.fillRect(prop.x, prop.y + prop.h, prop.w, 6);
      ctx.fillStyle = "#263331";
      for (let x = prop.x + 18; x < prop.x + prop.w; x += 44) ctx.fillRect(x, prop.y - 4, 8, prop.h + 8);
    } else if (prop.type === "drums") {
      for (let i = 0; i < 3; i += 1) {
        const x = prop.x + i * 28;
        ctx.fillStyle = "#2c3534";
        ctx.fillRect(x, prop.y, 22, prop.h);
        ctx.fillStyle = "#9d7b45";
        ctx.fillRect(x + 3, prop.y + 6, 16, 8);
        ctx.fillRect(x + 3, prop.y + prop.h - 14, 16, 8);
      }
    } else if (prop.type === "terminal") {
      const room = rooms[player.room];
      drawPanel(prop, room.intel?.done || false);
    }
  }

  function drawKeycard(x, y) {
    ctx.fillStyle = "#ffd65a";
    ctx.fillRect(x - 15, y - 10, 30, 20);
    ctx.fillStyle = "#131715";
    ctx.fillRect(x - 9, y - 4, 11, 3);
    ctx.fillRect(x - 9, y + 3, 19, 3);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(x - 13, y - 8, 26, 3);
  }

  function drawTunaFallback(x, y) {
    ctx.fillStyle = "#c4dfe3";
    ctx.fillRect(x - 24, y - 10, 42, 20);
    ctx.fillStyle = "#9fc1c7";
    ctx.fillRect(x - 14, y - 14, 25, 28);
    ctx.fillStyle = "#c4dfe3";
    ctx.fillRect(x + 16, y - 16, 22, 12);
    ctx.fillRect(x + 16, y + 4, 22, 12);
    ctx.fillStyle = "#223337";
    ctx.fillRect(x - 18, y - 4, 4, 4);
  }

  function drawTuna(x, y) {
    if (spritesReady) {
      drawSpriteFrame(7, x, y, 0.58, false);
      return;
    }
    drawTunaFallback(x, y);
  }

  function drawTunaCan(x, y) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x - 16, y + 9, 32, 7);

    ctx.fillStyle = "#9aa8a3";
    ctx.fillRect(x - 15, y - 6, 30, 15);
    ctx.fillStyle = "#d9e6df";
    ctx.fillRect(x - 13, y - 9, 26, 6);
    ctx.fillStyle = "#eef6ee";
    ctx.fillRect(x - 10, y - 11, 20, 4);
    ctx.fillStyle = "#58635f";
    ctx.fillRect(x - 8, y - 10, 16, 2);
    ctx.fillRect(x - 2, y - 12, 5, 3);

    ctx.fillStyle = "#0f7f91";
    ctx.fillRect(x - 12, y - 3, 24, 5);
    ctx.fillStyle = "#f35d4c";
    ctx.fillRect(x - 12, y + 3, 24, 4);
    ctx.fillStyle = "#f0edcf";
    ctx.font = "700 6px monospace";
    ctx.fillText("TUNA", x - 9, y + 2);

    ctx.strokeStyle = "#111514";
    ctx.strokeRect(x - 15.5, y - 9.5, 30, 18);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 8);
    ctx.lineTo(x + 12, y - 8);
    ctx.stroke();
  }

  function drawCatnipPouch(x, y, active = true) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x - 12, y + 7, 24, 6);
    ctx.fillStyle = active ? "#6f7044" : "#2b342d";
    ctx.fillRect(x - 11, y - 8, 22, 17);
    ctx.fillStyle = active ? "#9fb27b" : "#46504a";
    ctx.fillRect(x - 8, y - 5, 16, 10);
    ctx.fillStyle = active ? "#7ed6c8" : "#303a36";
    ctx.fillRect(x - 5, y - 2, 10, 3);
    ctx.strokeStyle = active ? "#111514" : "#46504a";
    ctx.strokeRect(x - 11.5, y - 8.5, 22, 17);
  }

  function drawEvacPad(x, y) {
    const pulse = 0.55 + Math.sin(performance.now() / 120) * 0.25;
    ctx.fillStyle = "rgba(255, 214, 90, 0.08)";
    ctx.fillRect(x - 42, y - 30, 84, 60);
    ctx.strokeStyle = `rgba(255, 214, 90, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 42.5, y - 30.5, 84, 60);
    drawHazardStripe(x - 42, y + 22, 84, 10);
    ctx.fillStyle = "#071110";
    ctx.fillRect(x - 27, y - 12, 54, 22);
    ctx.strokeStyle = "#7ed6c8";
    ctx.strokeRect(x - 26.5, y - 11.5, 53, 21);
    ctx.fillStyle = "#ffd65a";
    ctx.font = "700 12px monospace";
    ctx.fillText("EVAC", x - 15, y + 3);
    ctx.lineWidth = 1;
  }

  function drawSensorSweep(sweep) {
    const room = rooms[player.room];
    if (room.systemDown) {
      ctx.fillStyle = "rgba(70, 80, 74, 0.055)";
      ctx.fillRect(sweep.x, sweep.y, sweep.w, sweep.h);
      ctx.strokeStyle = "rgba(70, 80, 74, 0.22)";
      ctx.strokeRect(sweep.x + 0.5, sweep.y + 0.5, sweep.w, sweep.h);
      return;
    }
    const beam = sweepBeam(sweep);
    ctx.fillStyle = "rgba(126, 214, 200, 0.035)";
    ctx.fillRect(sweep.x, sweep.y, sweep.w, sweep.h);
    ctx.strokeStyle = "rgba(126, 214, 200, 0.18)";
    ctx.strokeRect(sweep.x + 0.5, sweep.y + 0.5, sweep.w, sweep.h);

    const hot = securityLevel >= 4 || extractionActive;
    ctx.fillStyle = hot ? "rgba(243, 93, 76, 0.72)" : "rgba(126, 214, 200, 0.72)";
    ctx.fillRect(beam.x, beam.y, beam.w, beam.h);
    ctx.fillStyle = "rgba(240, 237, 207, 0.58)";
    if (sweep.axis === "y") {
      ctx.fillRect(beam.x, beam.y + 2, beam.w, 2);
      drawHazardStripe(sweep.x - 8, sweep.y - 8, 12, 18);
      drawHazardStripe(sweep.x + sweep.w - 4, sweep.y + sweep.h - 10, 12, 18);
    } else {
      ctx.fillRect(beam.x + 2, beam.y, 2, beam.h);
      drawHazardStripe(sweep.x - 8, sweep.y - 8, 18, 12);
      drawHazardStripe(sweep.x + sweep.w - 10, sweep.y + sweep.h - 4, 18, 12);
    }
  }

  function drawIntelOverlay(room) {
    if (!room.intel?.done) return;
    ctx.save();
    ctx.setLineDash([6, 7]);
    room.guards.forEach((guard) => {
      ctx.strokeStyle = "rgba(243, 93, 76, 0.24)";
      ctx.beginPath();
      guard.route.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point[0], point[1]);
        else ctx.lineTo(point[0], point[1]);
      });
      ctx.closePath();
      ctx.stroke();
      guard.route.forEach((point) => {
        ctx.fillStyle = "rgba(243, 93, 76, 0.36)";
        ctx.fillRect(point[0] - 3, point[1] - 3, 6, 6);
      });
    });

    ctx.strokeStyle = "rgba(126, 214, 200, 0.28)";
    room.vents?.forEach((vent) => {
      ctx.beginPath();
      ctx.moveTo(vent.x + vent.w / 2, vent.y + vent.h / 2);
      ctx.lineTo(vent.tx, vent.ty);
      ctx.stroke();
    });

    ctx.setLineDash([]);
    room.panels?.forEach((panel) => {
      const px = panel.x + panel.w / 2;
      const py = panel.y + panel.h / 2;
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = room.systemDown ? "rgba(126, 214, 200, 0.22)" : "rgba(255, 214, 90, 0.28)";
      room.cameras?.forEach((camera) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(camera.x, camera.y);
        ctx.stroke();
      });
      room.sweeps?.forEach((sweep) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sweep.x + sweep.w / 2, sweep.y + sweep.h / 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.fillStyle = room.systemDown ? "rgba(126, 214, 200, 0.32)" : "rgba(255, 214, 90, 0.34)";
      ctx.fillRect(px - 4, py - 4, 8, 8);
    });

    room.cameras?.forEach((camera) => {
      ctx.strokeStyle = cameraActive(room, camera) ? "rgba(126, 214, 200, 0.42)" : "rgba(70, 80, 74, 0.42)";
      ctx.strokeRect(camera.x - 10, camera.y - 10, 20, 20);
    });
    ctx.restore();
  }

  function drawRoom(room) {
    drawFloor(room);
    drawIntelOverlay(room);
    if (extractionActive) drawEvacPad(room.start.x, room.start.y);
    room.props?.forEach(drawProp);
    room.shadows?.forEach(drawShadowZone);
    room.hiding.forEach((spot) => drawCrate(spot, "#726b3e"));
    room.vents?.forEach(drawVent);
    drawVentRattles();
    drawTacticalPings();
    room.panels?.forEach((panel) => drawPanel(panel, panel.done));
    room.cameras?.forEach((camera) => drawCamera(camera, cameraActive(room, camera)));
    room.sweeps?.forEach(drawSensorSweep);
    room.walls.forEach((wall) => drawWall(room, wall));

    if (room.exit) {
      const lockdown = alert > 0;
      const unlocked = player.keys >= room.exit.need && !lockdown;
      drawHazardStripe(room.exit.x, room.exit.y, room.exit.w, room.exit.h);
      ctx.fillStyle = lockdown ? "#5a1e1e" : unlocked ? "#b99a35" : "#864b3f";
      ctx.fillRect(room.exit.x + 7, room.exit.y + 7, Math.max(8, room.exit.w - 14), Math.max(8, room.exit.h - 14));
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      for (let y = room.exit.y + 12; y < room.exit.y + room.exit.h - 8; y += 16) {
        ctx.fillRect(room.exit.x + 7, y, Math.max(8, room.exit.w - 14), 4);
      }
      if (lockdown) {
        ctx.fillStyle = "rgba(243, 93, 76, 0.42)";
        ctx.fillRect(room.exit.x + 7, room.exit.y + 7, Math.max(8, room.exit.w - 14), 8);
        ctx.fillRect(room.exit.x + 7, room.exit.y + room.exit.h - 15, Math.max(8, room.exit.w - 14), 8);
      }
      ctx.fillStyle = lockdown ? "#ffd65a" : "#111514";
      ctx.font = "16px monospace";
      ctx.fillText(lockdown ? "!" : `${room.exit.need}`, room.exit.x + 13, room.exit.y + room.exit.h / 2 + 5);
    }

    if (room.keycard && !room.keycard.taken) drawKeycard(room.keycard.x, room.keycard.y);
    room.rations?.forEach((ration) => {
      if (!ration.taken) drawTunaCan(ration.x, ration.y);
    });
    room.catnipPickups?.forEach((pickup) => {
      if (!pickup.taken) drawCatnipPouch(pickup.x, pickup.y, true);
    });
    catnips.forEach((pouch) => drawCatnipPouch(pouch.x, pouch.y, true));
    if (room.tuna && !room.tuna.taken) drawTuna(room.tuna.x, room.tuna.y);

    if (room.lasers) {
      room.lasers.forEach((laser) => {
        const active = !room.systemDown && Math.sin(performance.now() / 380 + laser.phase) > -0.15;
        ctx.fillStyle = active ? "rgba(243, 93, 76, 0.82)" : "rgba(126, 214, 200, 0.16)";
        ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
        drawHazardStripe(laser.x - 12, laser.y - 10, 14, laser.h + 20);
        drawHazardStripe(laser.x + laser.w - 2, laser.y - 10, 14, laser.h + 20);
        ctx.fillStyle = active ? "#ffb0a5" : "#38484a";
        ctx.fillRect(laser.x - 8, laser.y - 5, 6, laser.h + 10);
        ctx.fillRect(laser.x + laser.w + 2, laser.y - 5, 6, laser.h + 10);
      });
    }
  }

  function drawVision(guard) {
    const dir = guard.dir || { x: 1, y: 0 };
    const angle = Math.atan2(dir.y, dir.x);
    const heightened = guard.state === "investigate" || guard.state === "search" || guard.state === "sweep";
    const range = heightened ? 205 : 176;
    const spread = guard.state === "search" || guard.state === "sweep" ? 0.68 : 0.52;
    const tint = guard.suspicion > 0.6 ? "243, 93, 76" : "255, 214, 90";
    const room = rooms[player.room];
    const rays = 24;
    const points = [];
    for (let i = 0; i <= rays; i += 1) {
      const t = i / rays;
      points.push(castVisionRay(room, guard.x, guard.y, angle - spread + spread * 2 * t, range));
    }

    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.fillStyle = `rgba(${tint}, ${0.12 + guard.suspicion * 0.12})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${tint}, 0.18)`;
    ctx.stroke();
  }

  function drawCameraVision(camera) {
    const room = rooms[player.room];
    if (!cameraActive(room, camera)) return;
    const angle = cameraAngle(camera);
    const spread = 0.38;
    const tint = (camera.suspicion || 0) > 0.55 || securityLevel >= 4 ? "243, 93, 76" : "126, 214, 200";
    const points = [];
    const range = camera.range * (1 + securityLevel * 0.06);
    for (let i = 0; i <= 18; i += 1) {
      const t = i / 18;
      points.push(castVisionRay(room, camera.x, camera.y, angle - spread + spread * 2 * t, range));
    }
    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.fillStyle = `rgba(${tint}, ${0.10 + (camera.suspicion || 0) * 0.1})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${tint}, 0.18)`;
    ctx.stroke();
  }

  function drawPixelCat(x, y, facing, colors, scale) {
    const flip = facing.x < -0.15 ? -1 : 1;
    const headLift = facing.y < -0.35 ? -2 : facing.y > 0.35 ? 2 : 0;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(flip * scale, scale);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(-8, 8, 18, 5);
    ctx.fillStyle = colors.body;
    ctx.fillRect(-6, -5, 11, 12);
    ctx.fillRect(3, -10 + headLift, 7, 8);
    ctx.fillRect(4, -13 + headLift, 2, 4);
    ctx.fillRect(8, -13 + headLift, 2, 4);
    ctx.fillRect(-10, -4, 5, 4);
    ctx.fillRect(-12, -8, 3, 6);
    ctx.fillRect(-5, 7, 3, 4);
    ctx.fillRect(2, 7, 3, 4);
    ctx.fillStyle = colors.trim;
    ctx.fillRect(-5, -4, 3, 10);
    ctx.fillStyle = colors.eye;
    ctx.fillRect(8, -7 + headLift, 1, 1);
    ctx.fillRect(8, -4 + headLift, 1, 1);
    ctx.restore();
  }

  function drawSpriteFrame(frame, x, y, scale, flip) {
    const col = frame % 4;
    const row = Math.floor(frame / 4);
    const size = Math.round(SPRITE * scale);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(
      spriteSheet,
      col * SPRITE,
      row * SPRITE,
      SPRITE,
      SPRITE,
      -size / 2,
      -size + 12,
      size,
      size
    );
    ctx.restore();
  }

  function directionRow(facing) {
    if (Math.abs(facing.x) > Math.abs(facing.y)) return facing.x < 0 ? 1 : 2;
    return facing.y > 0 ? 0 : 3;
  }

  function animationColumn(moving, speedOffset) {
    if (!moving) return 0;
    return Math.floor((performance.now() / 140 + speedOffset) % 4);
  }

  function drawSheetFrame(sheet, col, row, x, y, scale) {
    const size = Math.round(SPRITE * scale);
    ctx.drawImage(
      sheet,
      col * SPRITE,
      row * SPRITE,
      SPRITE,
      SPRITE,
      Math.round(x - size / 2),
      Math.round(y - size + 13),
      size,
      size
    );
  }

  function drawAnimatedSprite(sheet, x, y, facing, moving, scale, speedOffset) {
    const row = directionRow(facing);
    const col = animationColumn(moving, speedOffset);
    drawSheetFrame(sheet, col, row, x, y, scale);
  }

  function drawEnemyStateSprite(x, y, state, scale, speedOffset) {
    const row = state === "alert" ? 1 : 0;
    const col = animationColumn(true, speedOffset);
    drawSheetFrame(enemyAlertSheet, col, row, x, y, scale);
  }

  function drawCatSprite(x, y, facing, variant) {
    if (variant === "player" && playerWalkReady) {
      drawAnimatedSprite(playerWalkSheet, x, y, facing, player.moving, 0.78, 0);
      return true;
    }

    if (variant === "investigating" && enemyFlashlightReady) {
      drawAnimatedSprite(enemyFlashlightSheet, x, y, facing, true, 0.66, (x + y) * 0.01);
      return true;
    }

    if (variant === "alert" && enemyAlertReady) {
      drawEnemyStateSprite(x, y, "alert", 0.64, (x + y) * 0.01);
      return true;
    }

    if (variant === "guard" && enemyWalkReady) {
      drawAnimatedSprite(enemyWalkSheet, x, y, facing, true, 0.62, (x + y) * 0.01);
      return true;
    }

    if (!spritesReady) return false;
    const flip = facing.x < -0.15;
    const frameMap = {
      player: player.hidden ? 4 : facing.y < -0.35 ? 1 : 0,
      guard: 2,
      investigating: 5,
      alert: 6,
    };
    const scale = variant === "player" ? 0.72 : 0.62;
    drawSpriteFrame(frameMap[variant] ?? 0, x, y, scale, flip);
    return true;
  }

  function drawGuard(guard) {
    if (guard.stunned > 0) {
      ctx.globalAlpha = 0.72;
    }
    const variant = guard.suspicion > 0.72 ? "alert" : guard.state === "investigate" || guard.state === "search" || guard.state === "sweep" ? "investigating" : "guard";
    if (!drawCatSprite(guard.x, guard.y, guard.dir || { x: 1, y: 0 }, variant)) {
      drawPixelCat(guard.x, guard.y, guard.dir || { x: 1, y: 0 }, {
        body: guard.state === "investigate" || guard.state === "search" || guard.state === "sweep" ? "#c76145" : "#9f4a37",
        trim: "#3a1f1a",
        eye: "#fff2a8",
      }, 1);
    }
    ctx.globalAlpha = 1;

    if (guard.stunned > 0) {
      ctx.fillStyle = "#7ed6c8";
      ctx.font = "700 13px monospace";
      ctx.fillText("Zz", guard.x - 8, guard.y - 42);
      ctx.strokeStyle = "rgba(126, 214, 200, 0.75)";
      ctx.strokeRect(guard.x - 18, guard.y - 26, 36, 30);
      if (guard.reported) {
        ctx.fillStyle = "#f35d4c";
        ctx.fillRect(guard.x - 20, guard.y - 30, 5, 5);
      }
      return;
    }

    if (guard.suspicion > 0.05) {
      const w = 34;
      ctx.fillStyle = "#111514";
      ctx.fillRect(guard.x - w / 2, guard.y - 34, w, 5);
      ctx.fillStyle = guard.suspicion > 0.72 ? "#f35d4c" : "#ffd65a";
      ctx.fillRect(guard.x - w / 2, guard.y - 34, w * guard.suspicion, 5);
    }

    if (guard.state === "investigate" || guard.state === "search" || guard.state === "sweep") {
      ctx.fillStyle = guard.suspicion > 0.72 ? "#f35d4c" : "#ffd65a";
      ctx.font = "700 18px monospace";
      ctx.fillText(guard.suspicion > 0.72 ? "!" : guard.state === "sweep" ? "*" : "?", guard.x - 5, guard.y - 42);
    } else if ((guard.pauseTimer || 0) > 0) {
      ctx.fillStyle = "#98a08f";
      ctx.font = "700 13px monospace";
      ctx.fillText("...", guard.x - 9, guard.y - 42);
    }
  }

  function drawNoises() {
    noises.forEach((sound) => {
      const progress = 1 - sound.ttl / sound.maxTtl;
      const radius = sound.radius * progress;
      ctx.strokeStyle = sound.color;
      ctx.globalAlpha = 1 - progress;
      ctx.lineWidth = sound.kind === "meow" ? 3 : 2;
      ctx.beginPath();
      ctx.arc(sound.x, sound.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      if (sound.kind === "meow") {
        ctx.font = "700 12px monospace";
        ctx.fillStyle = "#7ed6c8";
        ctx.fillText(sound.label, sound.x - 16, sound.y - radius - 6);
      }
      ctx.globalAlpha = 1;
    });
  }

  function drawShots() {
    shots.forEach((shot) => {
      const alpha = shot.ttl / shot.maxTtl;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = shot.hit ? "#ffef9a" : "#f35d4c";
      ctx.lineWidth = shot.hit ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(shot.x1, shot.y1);
      ctx.lineTo(shot.x2, shot.y2);
      ctx.stroke();
      ctx.fillStyle = "#f35d4c";
      ctx.fillRect(shot.x1 - 3, shot.y1 - 3, 6, 6);
      ctx.globalAlpha = 1;
    });
  }

  function drawAimTelegraphs(room) {
    room.guards.forEach((guard) => {
      if (guard.aimTimer <= 0 || !guard.aimTarget) return;
      const progress = 1 - guard.aimTimer / (guard.aimMax || 0.4);
      const end = castVisionRay(room, guard.x, guard.y, Math.atan2(guard.dir.y, guard.dir.x), 235);
      ctx.globalAlpha = 0.38 + progress * 0.42;
      ctx.strokeStyle = progress > 0.72 ? "#ffef9a" : "#f35d4c";
      ctx.lineWidth = progress > 0.72 ? 3 : 2;
      ctx.setLineDash(progress > 0.72 ? [] : [8, 7]);
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y - 14);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#f35d4c";
      ctx.fillRect(guard.x - 10, guard.y - 48, 20, 5);
      ctx.fillStyle = "#ffef9a";
      ctx.fillRect(guard.x - 10, guard.y - 48, 20 * progress, 5);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    });
  }

  function drawPawPrints() {
    pawPrints.forEach((print) => {
      const alpha = (print.ttl / print.maxTtl) * (print.fresh ? 0.42 : 0.24);
      ctx.fillStyle = print.fresh ? `rgba(255, 214, 90, ${alpha})` : `rgba(240, 237, 207, ${alpha})`;
      const offset = print.flip ? 3 : -3;
      ctx.fillRect(print.x + offset - 2, print.y - 2, 4, 3);
      ctx.fillRect(print.x + offset + 2, print.y - 6, 2, 2);
      ctx.fillRect(print.x + offset - 3, print.y - 6, 2, 2);
    });
  }

  function drawLastKnown() {
    if (!lastKnown) return;
    const alpha = lastKnown.ttl / lastKnown.maxTtl;
    ctx.strokeStyle = `rgba(243, 93, 76, ${0.35 + alpha * 0.45})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(lastKnown.x - 13, lastKnown.y - 13, 26, 26);
    ctx.beginPath();
    ctx.moveTo(lastKnown.x - 18, lastKnown.y);
    ctx.lineTo(lastKnown.x + 18, lastKnown.y);
    ctx.moveTo(lastKnown.x, lastKnown.y - 18);
    ctx.lineTo(lastKnown.x, lastKnown.y + 18);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawRadioLinks(room) {
    if (!lastKnown || (alert <= 0 && sweepTimer <= 0)) return;
    room.guards.forEach((guard) => {
      if (guard.stunned > 0 || (guard.suspicion < 0.7 && guard.state !== "sweep")) return;
      ctx.strokeStyle = alert > 0 ? "rgba(243, 93, 76, 0.16)" : "rgba(255, 214, 90, 0.14)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y - 18);
      ctx.lineTo(lastKnown.x, lastKnown.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  function tacticalRoute(room, target) {
    const cell = 32;
    const cols = Math.floor(PLAY_W / cell);
    const rows = Math.floor(H / cell);
    const key = (x, y) => `${x},${y}`;
    const start = {
      x: clamp(Math.floor(player.x / cell), 0, cols - 1),
      y: clamp(Math.floor(player.y / cell), 0, rows - 1),
    };
    const goal = {
      x: clamp(Math.floor(target.x / cell), 0, cols - 1),
      y: clamp(Math.floor(target.y / cell), 0, rows - 1),
    };
    const blockedCell = (x, y) => {
      const px = x * cell + cell / 2;
      const py = y * cell + cell / 2;
      return guardBlocked(room, px, py);
    };
    const hazardCost = (x, y) => {
      const px = x * cell + cell / 2;
      const py = y * cell + cell / 2;
      let cost = room.shadows?.some((shadow) => circleRect(px, py, 8, shadow)) ? -0.35 : 0;

      room.guards.forEach((guard) => {
        if (guard.stunned > 0) return;
        const dx = px - guard.x;
        const dy = py - guard.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 210 || !hasLineOfSight(guard.x, guard.y, px, py, room.walls)) return;
        const dir = guard.dir || { x: 1, y: 0 };
        const dot = (dx / (dist || 1)) * dir.x + (dy / (dist || 1)) * dir.y;
        if (dot > Math.cos(0.78)) cost += 4.8 * (1 - dist / 230);
        else if (dist < 76) cost += 1.1;
      });

      room.cameras?.forEach((camera) => {
        if (!cameraActive(room, camera)) return;
        const dx = px - camera.x;
        const dy = py - camera.y;
        const dist = Math.hypot(dx, dy);
        if (dist > camera.range || !hasLineOfSight(camera.x, camera.y, px, py, room.walls)) return;
        const angle = cameraAngle(camera);
        const dot = (dx / (dist || 1)) * Math.cos(angle) + (dy / (dist || 1)) * Math.sin(angle);
        if (dot > Math.cos(0.46)) cost += 3.6 * (1 - dist / camera.range);
      });

      if (!room.systemDown) {
        room.sweeps?.forEach((sweep) => {
          if (circleRect(px, py, 9, sweepBeam(sweep))) cost += 5;
        });
      }

      return Math.max(0.2, cost);
    };
    const open = [{ ...start, cost: 0 }];
    const cameFrom = new Map([[key(start.x, start.y), null]]);
    const costSoFar = new Map([[key(start.x, start.y), 0]]);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    while (open.length) {
      open.sort((a, b) => a.cost - b.cost);
      const current = open.shift();
      if (current.x === goal.x && current.y === goal.y) break;
      dirs.forEach(([dx, dy]) => {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const id = key(nx, ny);
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || blockedCell(nx, ny)) return;
        const newCost = costSoFar.get(key(current.x, current.y)) + 1 + hazardCost(nx, ny);
        if (costSoFar.has(id) && newCost >= costSoFar.get(id)) return;
        costSoFar.set(id, newCost);
        cameFrom.set(id, current);
        const heuristic = Math.abs(goal.x - nx) + Math.abs(goal.y - ny);
        open.push({ x: nx, y: ny, cost: newCost + heuristic });
      });
    }

    const goalKey = key(goal.x, goal.y);
    if (!cameFrom.has(goalKey)) return [];
    const path = [];
    let danger = 0;
    let current = goal;
    while (current) {
      const point = { x: current.x * cell + cell / 2, y: current.y * cell + cell / 2 };
      danger += hazardCost(current.x, current.y);
      path.push(point);
      current = cameFrom.get(key(current.x, current.y));
    }
    path.danger = danger / Math.max(1, path.length);
    return path.reverse();
  }

  function drawTacticalRoute(room) {
    const target = objectiveTarget(room);
    if (!target || won || gameOver) return;
    if (!room.intel?.done && player.senseTimer <= 0) return;
    const path = tacticalRoute(room, target);
    if (path.length < 3) return;
    const routeHot = path.danger > 1.1 || extractionActive;
    const color = routeHot ? "243, 93, 76" : "126, 214, 200";
    const active = player.senseTimer > 0;

    ctx.save();
    ctx.globalAlpha = active ? 0.72 : 0.42;
    ctx.strokeStyle = `rgba(${color}, ${active ? 0.32 : 0.18})`;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    path.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    path.forEach((point, index) => {
      if (index % 2 !== 0 || index === 0) return;
      const bob = Math.sin(performance.now() / 180 + index) * 1.5;
      ctx.fillStyle = `rgba(${color}, ${active ? 0.78 : 0.48})`;
      ctx.fillRect(point.x - 3, point.y - 2 + bob, 6, 4);
      ctx.fillRect(point.x + 3, point.y - 6 + bob, 2, 2);
      ctx.fillRect(point.x - 5, point.y - 6 + bob, 2, 2);
    });
    ctx.restore();
  }

  function guardForecastPoints(guard) {
    if (guard.stunned > 0) return [];
    const points = [];
    let x = guard.x;
    let y = guard.y;
    let routeIndex = guard.i;
    let remaining = 52;

    for (let step = 0; step < 5; step += 1) {
      const target = guard.state === "patrol"
        ? guard.route[routeIndex % guard.route.length]
        : guard.target || guard.route[routeIndex % guard.route.length];
      const dx = target[0] !== undefined ? target[0] - x : target.x - x;
      const dy = target[1] !== undefined ? target[1] - y : target.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      if (remaining < dist) {
        x += (dx / dist) * remaining;
        y += (dy / dist) * remaining;
        points.push({ x, y, caution: guard.state !== "patrol" || guard.suspicion > 0.42 });
        remaining += 52;
      } else {
        x = target[0] !== undefined ? target[0] : target.x;
        y = target[1] !== undefined ? target[1] : target.y;
        points.push({ x, y, caution: guard.state !== "patrol" || guard.suspicion > 0.42 });
        if (guard.state !== "patrol") break;
        routeIndex = (routeIndex + 1) % guard.route.length;
        remaining = 52;
      }
    }
    return points;
  }

  function drawGuardForecasts(room) {
    if (!room.intel?.done && player.senseTimer <= 0) return;
    const alpha = player.senseTimer > 0 ? 0.78 : 0.42;
    ctx.save();
    room.guards.forEach((guard) => {
      const points = guardForecastPoints(guard);
      if (!points.length) return;
      ctx.globalAlpha = alpha;
      ctx.setLineDash([2, 8]);
      ctx.strokeStyle = guard.suspicion > 0.55 ? "rgba(243, 93, 76, 0.5)" : "rgba(255, 214, 90, 0.36)";
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      points.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();
      ctx.setLineDash([]);
      points.forEach((point, index) => {
        ctx.fillStyle = point.caution ? "rgba(243, 93, 76, 0.72)" : "rgba(255, 214, 90, 0.62)";
        const size = Math.max(3, 7 - index);
        ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
      });
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawObjectiveMarker(room) {
    const target = objectiveTarget(room);
    if (!target) return;
    const pulse = Math.sin(performance.now() / 180) * 3;
    const r = target.r + pulse;
    ctx.strokeStyle = "rgba(255, 214, 90, 0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(target.x - r, target.y - r + 9);
    ctx.lineTo(target.x - r, target.y - r);
    ctx.lineTo(target.x - r + 9, target.y - r);
    ctx.moveTo(target.x + r - 9, target.y - r);
    ctx.lineTo(target.x + r, target.y - r);
    ctx.lineTo(target.x + r, target.y - r + 9);
    ctx.moveTo(target.x + r, target.y + r - 9);
    ctx.lineTo(target.x + r, target.y + r);
    ctx.lineTo(target.x + r - 9, target.y + r);
    ctx.moveTo(target.x - r + 9, target.y + r);
    ctx.lineTo(target.x - r, target.y + r);
    ctx.lineTo(target.x - r, target.y + r - 9);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawObjectiveCompass(room) {
    const target = objectiveTarget(room);
    if (!target || player.hidden || gameOver || won) return;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 76) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const px = player.x + nx * 42;
    const py = player.y + ny * 42 - 10;
    const angle = Math.atan2(ny, nx);
    const pulse = 0.72 + Math.sin(performance.now() / 150) * 0.2;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.globalAlpha = alert > 0 ? 0.48 : pulse;
    ctx.fillStyle = extractionActive ? "#f35d4c" : "#ffd65a";
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#111514";
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "rgba(5, 7, 6, 0.72)";
    ctx.fillRect(px - 18, py + 12, 36, 12);
    ctx.fillStyle = extractionActive ? "#f35d4c" : "#f0edcf";
    ctx.font = "700 8px monospace";
    ctx.fillText(`${Math.round(dist / 10)}m`, px - 10, py + 21);
    ctx.globalAlpha = 1;
  }

  function drawWhiskerSense(room) {
    if (player.senseTimer <= 0) return;
    const alpha = Math.min(1, player.senseTimer / 0.35);
    const pulse = Math.sin(performance.now() / 90) * 4;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(126, 214, 200, 0.62)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 96 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(126, 214, 200, 0.26)";
    ctx.beginPath();
    ctx.arc(player.x, player.y, 176 - pulse, 0, Math.PI * 2);
    ctx.stroke();

    room.guards.forEach((guard) => {
      if (guard.stunned > 0) return;
      const dist = Math.hypot(guard.x - player.x, guard.y - player.y);
      if (dist > 245) return;
      const los = hasLineOfSight(player.x, player.y, guard.x, guard.y, room.walls);
      const risk = visionScore(guard, room) > 0 || guard.suspicion > 0.45;
      ctx.setLineDash(los ? [] : [5, 6]);
      ctx.strokeStyle = risk ? "rgba(243, 93, 76, 0.72)" : "rgba(255, 214, 90, 0.46)";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 8);
      ctx.lineTo(guard.x, guard.y - 18);
      ctx.stroke();
      ctx.fillStyle = risk ? "#f35d4c" : "#ffd65a";
      ctx.font = "700 9px monospace";
      ctx.fillText(`${Math.round(dist / 10)}m`, (player.x + guard.x) / 2, (player.y + guard.y) / 2 - 6);
    });

    room.cameras?.forEach((camera) => {
      if (!cameraActive(room, camera)) return;
      const dist = Math.hypot(camera.x - player.x, camera.y - player.y);
      if (dist > 280) return;
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = cameraVisionScore(room, camera) > 0 ? "rgba(243, 93, 76, 0.62)" : "rgba(126, 214, 200, 0.42)";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 8);
      ctx.lineTo(camera.x, camera.y);
      ctx.stroke();
    });

    noises.forEach((sound) => {
      ctx.setLineDash([]);
      ctx.strokeStyle = sound.kind === "meow" ? "rgba(126, 214, 200, 0.45)" : "rgba(255, 214, 90, 0.34)";
      ctx.beginPath();
      ctx.arc(sound.x, sound.y, sound.radius * 0.24, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(5, 7, 6, 0.72)";
    ctx.fillRect(player.x - 38, player.y + 24, 76, 13);
    ctx.fillStyle = "#7ed6c8";
    ctx.font = "700 9px monospace";
    ctx.fillText("WHISKER SENSE", player.x - 35, player.y + 34);
    ctx.restore();
    ctx.lineWidth = 1;
  }

  function drawCardboardBox(x, y) {
    const bob = player.moving ? Math.round(Math.sin(performance.now() / 90) * 1) : 0;
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(x - 24, y + 10, 48, 8);
    ctx.fillStyle = "#7c6238";
    ctx.fillRect(x - 23, y - 24 + bob, 46, 38);
    ctx.fillStyle = "#a4824a";
    ctx.fillRect(x - 19, y - 20 + bob, 38, 30);
    ctx.fillStyle = "#5b4528";
    ctx.fillRect(x - 21, y - 11 + bob, 42, 4);
    ctx.fillRect(x - 3, y - 22 + bob, 6, 34);
    ctx.fillStyle = "#d0a45a";
    ctx.fillRect(x - 17, y - 18 + bob, 10, 4);
    ctx.fillRect(x + 8, y + 4 + bob, 8, 3);
    ctx.fillStyle = "#111514";
    ctx.fillRect(x - 10, y - 5 + bob, 20, 4);
    ctx.fillStyle = player.hidden ? "#7ed6c8" : "#ffd65a";
    ctx.fillRect(x - 7, y - 4 + bob, 3, 2);
    ctx.fillRect(x + 4, y - 4 + bob, 3, 2);
    const suspicious = player.moving || !nearPlausibleBoxSpot(rooms[player.room]);
    ctx.strokeStyle = boxCompromised(rooms[player.room]) ? "#f35d4c" : suspicious ? "#ffd65a" : "#111514";
    ctx.strokeRect(x - 23.5, y - 24.5 + bob, 46, 38);
    if (suspicious) {
      ctx.fillStyle = player.moving ? "#f35d4c" : "#ffd65a";
      ctx.font = "700 9px monospace";
      ctx.fillText(player.moving ? "!" : "?", x - 3, y - 29 + bob);
    }
  }

  function drawPlayer() {
    if (player.boxed) {
      drawCardboardBox(player.x, player.y);
      if (player.hidden) {
        ctx.strokeStyle = "rgba(255, 214, 90, 0.86)";
        ctx.strokeRect(player.x - 26, player.y - 27, 52, 44);
      }
      return;
    }
    if (!drawCatSprite(player.x, player.y, player.facing, "player")) {
      drawPixelCat(player.x, player.y, player.facing, {
        body: player.hidden ? "#5f725f" : "#e2dcb7",
        trim: player.soft ? "#7ed6c8" : "#42514f",
        eye: "#111514",
      }, 1.08);
    }
    if (extractionActive) {
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(player.x - 15, player.y - 27, 30, 14);
      drawTunaCan(player.x, player.y - 28);
    }
    if (player.hidden) {
      const room = rooms[player.room];
      ctx.strokeStyle = player.ventHidden > 0 || (player.soft && inShadow(room)) ? "rgba(126, 214, 200, 0.9)" : "rgba(255, 214, 90, 0.8)";
      ctx.strokeRect(player.x - 22, player.y - 20, 44, 40);
    }
    if (player.hitCooldown > 0) {
      ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 45) * 0.2;
      ctx.strokeStyle = "#f35d4c";
      ctx.strokeRect(player.x - 18, player.y - 30, 36, 34);
      ctx.globalAlpha = 1;
    }
  }

  function drawPrompts(room) {
    const prompts = [];
    if (room.keycard && !room.keycard.taken && Math.hypot(player.x - room.keycard.x, player.y - room.keycard.y) < 52) {
      prompts.push({ x: room.keycard.x, y: room.keycard.y - 28, text: "E" });
    }
    if (room.tuna && !room.tuna.taken && Math.hypot(player.x - room.tuna.x, player.y - room.tuna.y) < 58) {
      prompts.push({ x: room.tuna.x, y: room.tuna.y - 34, text: "E" });
    }
    room.rations?.forEach((ration) => {
      if (!ration.taken && Math.hypot(player.x - ration.x, player.y - ration.y) < 48) {
        prompts.push({ x: ration.x, y: ration.y - 24, text: "E" });
      }
    });
    room.catnipPickups?.forEach((pickup) => {
      if (!pickup.taken && Math.hypot(player.x - pickup.x, player.y - pickup.y) < 48) {
        prompts.push({ x: pickup.x, y: pickup.y - 24, text: "E" });
      }
    });
    room.vents?.forEach((vent) => {
      if (nearRect(vent, 38)) prompts.push({ x: vent.x + vent.w / 2, y: vent.y - 12, text: "E" });
    });
    room.panels?.forEach((panel) => {
      if (!panel.done && nearRect(panel, 38)) prompts.push({ x: panel.x + panel.w / 2, y: panel.y - 12, text: "E" });
    });
    if (room.intel && !room.intel.done && nearRect(room.intel, 40)) {
      prompts.push({ x: room.intel.x + room.intel.w / 2, y: room.intel.y - 12, text: "E" });
    }
    const guard = scratchableGuard(room);
    if (guard) prompts.push({ x: guard.x, y: guard.y - 48, text: "E" });
    prompts.forEach((prompt) => {
      ctx.fillStyle = "#111514";
      ctx.fillRect(prompt.x - 9, prompt.y - 15, 18, 18);
      ctx.fillStyle = "#ffd65a";
      ctx.font = "700 14px monospace";
      ctx.fillText(prompt.text, prompt.x - 5, prompt.y - 1);
    });
  }

  function drawRadar(room) {
    const x = PANEL_X + 12;
    const y = 42;
    const w = PANEL_W - 24;
    const h = 132;
    ctx.fillStyle = "#071110";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#0cc083";
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.fillStyle = "#7ed6c8";
    ctx.font = "700 11px monospace";
    ctx.fillText("CAT RADAR", x + 8, y + 15);
    ctx.fillStyle = "rgba(12,192,131,0.12)";
    ctx.fillRect(x + 8, y + 24, w - 16, h - 34);
    ctx.strokeStyle = "rgba(126,214,200,0.16)";
    for (let gx = x + 18; gx < x + w - 8; gx += 22) {
      ctx.beginPath();
      ctx.moveTo(gx, y + 24);
      ctx.lineTo(gx, y + h - 10);
      ctx.stroke();
    }
    for (let gy = y + 34; gy < y + h - 10; gy += 22) {
      ctx.beginPath();
      ctx.moveTo(x + 8, gy);
      ctx.lineTo(x + w - 8, gy);
      ctx.stroke();
    }

    const sx = (w - 22) / PLAY_W;
    const sy = (h - 38) / H;
    room.guards.forEach((guard) => {
      ctx.fillStyle = guard.suspicion > 0.5 ? "#f35d4c" : "#d16d4d";
      ctx.fillRect(x + 10 + guard.x * sx, y + 24 + guard.y * sy, 4, 4);
    });
    room.cameras?.forEach((camera) => {
      ctx.fillStyle = cameraActive(room, camera) ? ((camera.suspicion || 0) > 0.5 ? "#f35d4c" : "#7ed6c8") : "#33413c";
      ctx.fillRect(x + 10 + camera.x * sx, y + 24 + camera.y * sy, 5, 3);
    });
    if (!room.systemDown) room.sweeps?.forEach((sweep) => {
      const beam = sweepBeam(sweep);
      ctx.fillStyle = "#7ed6c8";
      ctx.fillRect(
        x + 10 + (beam.x + beam.w / 2) * sx - 1,
        y + 24 + (beam.y + beam.h / 2) * sy - 1,
        3,
        3
      );
    });
    if (room.intel?.done) {
      const mark = (px, py, color, size = 4) => {
        ctx.fillStyle = color;
        ctx.fillRect(x + 10 + px * sx, y + 24 + py * sy, size, size);
      };
      if (room.keycard && !room.keycard.taken) mark(room.keycard.x, room.keycard.y, "#ffd65a", 5);
      room.rations?.forEach((ration) => {
        if (!ration.taken) mark(ration.x, ration.y, "#7ed6c8", 3);
      });
      room.catnipPickups?.forEach((pickup) => {
        if (!pickup.taken) mark(pickup.x, pickup.y, "#9fb27b", 3);
      });
      room.vents?.forEach((vent) => mark(vent.x + vent.w / 2, vent.y + vent.h / 2, "#98a08f", 3));
      room.panels?.forEach((panel) => {
        if (!panel.done) mark(panel.x + panel.w / 2, panel.y + panel.h / 2, "#f35d4c", 4);
      });
    }
    if (extractionActive) {
      ctx.fillStyle = "#ffd65a";
      ctx.strokeStyle = "#ffd65a";
      const ex = x + 10 + room.start.x * sx;
      const ey = y + 24 + room.start.y * sy;
      ctx.strokeRect(ex - 3, ey - 3, 10, 10);
      ctx.fillRect(ex, ey, 4, 4);
    }
    noises.forEach((sound) => {
      ctx.fillStyle = sound.kind === "meow" ? "#7ed6c8" : "#ffd65a";
      ctx.fillRect(x + 10 + sound.x * sx, y + 24 + sound.y * sy, 3, 3);
    });
    catnips.forEach((pouch) => {
      ctx.fillStyle = "#9fb27b";
      ctx.fillRect(x + 10 + pouch.x * sx, y + 24 + pouch.y * sy, 4, 4);
    });
    ventRattles.forEach((rattle) => {
      ctx.strokeStyle = "#7ed6c8";
      ctx.strokeRect(x + 10 + rattle.x * sx - 2, y + 24 + rattle.y * sy - 2, 5, 5);
    });
    tacticalPings.forEach((ping) => {
      const alpha = ping.ttl / ping.maxTtl;
      const px = x + 10 + ping.x * sx;
      const py = y + 24 + ping.y * sy;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ping.color;
      ctx.strokeRect(px - 4, py - 4, 9, 9);
      ctx.fillStyle = ping.color;
      ctx.fillRect(px - 1, py - 1, 3, 3);
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = "#f0edcf";
    ctx.fillRect(x + 10 + player.x * sx, y + 24 + player.y * sy, 5, 5);
  }

  function drawSideBox(x, y, w, h, title, accent) {
    ctx.fillStyle = "#020404";
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.fillStyle = "#6f7b70";
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = "#050706";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(0, 86, 199, 0.16)";
    ctx.fillRect(x + 5, y + 24, w - 10, Math.max(0, h - 30));
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let yy = y + 22; yy < y + h; yy += 4) ctx.fillRect(x, yy, w, 1);
    ctx.fillStyle = "#071110";
    ctx.fillRect(x, y, w, 18);
    ctx.fillStyle = accent || "#ffd65a";
    ctx.fillRect(x, y + 18, w, 3);
    ctx.fillStyle = accent || "#ffd65a";
    ctx.font = "700 10px monospace";
    ctx.fillText(title, x + 7, y + 13);
    ctx.strokeStyle = "#111514";
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  }

  function drawHazardStripe(x, y, w, h) {
    ctx.fillStyle = "#f3a51c";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#111514";
    ctx.lineWidth = 5;
    for (let i = -h; i < w + h; i += 18) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + h + 2);
      ctx.lineTo(x + i + h, y - 2);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }

  function drawHazardStrip(x, y, w) {
    drawHazardStripe(x, y, w, 20);
  }

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
    ctx.fillText("RADAR", PANEL_X + 20, 27);

    drawRadar(room);

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
    ctx.fillText(`x${remainingRations(room)}`, PANEL_X + 94, 452);

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
    drawCatnipPouch(PANEL_X + 156, 546, player.catnip > 0);
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
    if (!paused) return;
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.fillRect(0, 0, VIEW_W, H);
    ctx.fillStyle = "#071110";
    ctx.fillRect(254, 238, 452, 136);
    ctx.strokeStyle = "#ffd65a";
    ctx.strokeRect(254.5, 238.5, 452, 136);
    ctx.fillStyle = "#f0edcf";
    ctx.font = "700 28px monospace";
    ctx.fillText("PAUSED", 426, 292);
    ctx.fillStyle = "#98a08f";
    ctx.font = "700 13px monospace";
    ctx.fillText(`TIME ${formatTime(missionTime)}   ALERTS ${stats.alerts}   HITS ${stats.hits}`, 336, 326);
    ctx.fillText("PRESS P OR ESC TO RESUME", 382, 350);
  }

  function draw() {
    const room = rooms[player.room];
    const jitterX = alert > 0 ? Math.round(Math.sin(performance.now() / 30) * shake) : 0;
    const jitterY = alert > 0 ? Math.round(Math.cos(performance.now() / 37) * shake) : 0;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VIEW_W, H);
    ctx.save();
    ctx.translate(jitterX, jitterY);
    drawRoom(room);
    drawPawPrints();
    drawObjectiveMarker(room);
    drawTacticalRoute(room);
    drawGuardForecasts(room);
    drawObjectiveCompass(room);
    drawWhiskerSense(room);
    drawNoises();
    drawRadioLinks(room);
    drawLastKnown();
    room.cameras?.forEach(drawCameraVision);
    room.guards.forEach((guard) => drawVision(guard));
    drawAimTelegraphs(room);
    drawShots();
    room.walls.forEach((wall) => drawWall(room, wall));
    room.guards.forEach(drawGuard);
    drawPlayer();
    drawPrompts(room);
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
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "shift", "q", "f"].includes(key)) {
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
    if (key === "q" && !event.repeat) dropCatnip();
    if (key === "f" && !event.repeat) activateWhiskerSense();
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });

  reset();
  requestAnimationFrame(loop);
})();
