"use strict";
  const rooms = [
    {
      name: "Cargo Kennel",
      floor: "#1a2118",
      wall: "#4c5742",
      trim: "#778060",
      start: { x: 86, y: 540 },
      doors: [
        {
          x: 722, y: 292, w: 38, h: 86,
          to: 4,
          need: 0,
          label: "SERVICE",
          approach: { x: 690, y: 335 },
          spawn: { x: 112, y: 328 },
        },
      ],
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
      alarm: { x: 606, y: 88, w: 38, h: 42, disabled: false, triggered: false },
      sweeps: [
        { x: 72, y: 414, w: 420, h: 110, axis: "x", phase: 0.2, speed: 0.0011 },
      ],
      walls: [
        { x: 0, y: 0, w: PLAY_W, h: 28 }, { x: 0, y: H - 28, w: PLAY_W, h: 28 },
        { x: 0, y: 0, w: 28, h: H },
        { x: PLAY_W - 28, y: 0, w: 28, h: 292 }, { x: PLAY_W - 28, y: 378, w: 28, h: H - 378 },
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
      start: { x: 506, y: 568 },
      doors: [
        {
          x: 454, y: 602, w: 96, h: 38,
          to: 4,
          need: 1,
          label: "SERVICE",
          approach: { x: 506, y: 568 },
          spawn: { x: 382, y: 126 },
        },
      ],
      keycard: { x: 650, y: 506, taken: false },
      intel: { x: 694, y: 312, w: 40, h: 48, done: false, text: "SHADOWS HIDE YOU ONLY WHILE SNEAKING." },
      briefings: [
        "ZERO: shadows only work with soft paws.",
        "ZERO: yarn can bait one patrol off-route.",
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
      alarm: { x: 642, y: 312, w: 38, h: 42, disabled: false, triggered: false },
      sweeps: [
        { x: 66, y: 78, w: 488, h: 112, axis: "x", phase: 1.6, speed: 0.001 },
      ],
      walls: [
        { x: 0, y: 0, w: PLAY_W, h: 28 }, { x: 0, y: H - 28, w: 454, h: 28 }, { x: 550, y: H - 28, w: PLAY_W - 550, h: 28 },
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
      start: { x: 70, y: 308 },
      doors: [
        {
          x: 0, y: 268, w: 38, h: 96,
          to: 4,
          need: 2,
          label: "SERVICE",
          approach: { x: 62, y: 316 },
          spawn: { x: 632, y: 328 },
        },
        {
          x: 722, y: 76, w: 38, h: 112,
          to: 3,
          need: 3,
          progress: 3,
          label: "TUNA",
          approach: { x: 690, y: 132 },
          spawn: { x: 70, y: 124 },
        },
      ],
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
      alarm: { x: 96, y: 72, w: 38, h: 42, disabled: false, triggered: false },
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
        { x: 0, y: 0, w: 28, h: 268 }, { x: 0, y: 364, w: 28, h: H - 364 },
        { x: PLAY_W - 28, y: 0, w: 28, h: 76 }, { x: PLAY_W - 28, y: 188, w: 28, h: H - 188 },
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
      doors: [
        {
          x: 0, y: 76, w: 38, h: 112,
          to: 2,
          need: 3,
          label: "LASER",
          approach: { x: 70, y: 124 },
          spawn: { x: 690, y: 132 },
        },
      ],
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
      alarm: { x: 224, y: 500, w: 38, h: 42, disabled: false, triggered: false },
      sweeps: [
        { x: 218, y: 252, w: 414, h: 116, axis: "y", phase: 0.7, speed: 0.00125 },
      ],
      walls: [
        { x: 0, y: 0, w: PLAY_W, h: 28 }, { x: 0, y: H - 28, w: PLAY_W, h: 28 },
        { x: 0, y: 0, w: 28, h: 76 }, { x: 0, y: 188, w: 28, h: H - 188 }, { x: PLAY_W - 28, y: 0, w: 28, h: H },
        { x: 186, y: 206, w: 500, h: 38 }, { x: 186, y: 406, w: 500, h: 38 },
        { x: 368, y: 244, w: 38, h: 162 }, { x: 560, y: 244, w: 38, h: 162 },
      ],
      guards: [
        { x: 200, y: 124, route: [[200, 124], [690, 124]], i: 1, speed: 82 },
        { x: 630, y: 324, route: [[630, 324], [690, 324], [690, 276], [630, 276]], i: 1, speed: 76 },
        { x: 470, y: 526, route: [[470, 526], [680, 526], [680, 470], [470, 470]], i: 1, speed: 55 },
      ],
    },
    {
      name: "Service Hall",
      width: PLAY_W * 2,
      height: H,
      floor: "#181f20",
      wall: "#3f5050",
      trim: "#7aa6a0",
      start: { x: 72, y: 328 },
      doors: [
        {
          x: 0, y: 286, w: 38, h: 86,
          to: 0,
          need: 0,
          label: "KENNEL",
          approach: { x: 68, y: 328 },
          spawn: { x: 656, y: 335 },
        },
        {
          x: 454, y: 0, w: 96, h: 34,
          to: 1,
          need: 1,
          progress: 1,
          label: "PANTRY",
          approach: { x: 506, y: 58 },
          trigger: { x: 464, y: 28, w: 72, h: 26 },
          spawn: { x: 506, y: 520 },
        },
        {
          x: PLAY_W * 2 - 38, y: 280, w: 38, h: 96,
          to: 2,
          need: 2,
          progress: 2,
          label: "LASER",
          approach: { x: PLAY_W * 2 - 80, y: 328 },
          spawn: { x: 120, y: 308 },
        },
      ],
      intel: { x: 364, y: 282, w: 40, h: 48, done: false, text: "ADJACENT PATROLS CAN ANSWER ALERTS THROUGH DOORS." },
      briefings: [
        "ZERO: this hall connects the whole kennel block.",
        "ZERO: alerts travel through adjacent doors.",
        "ZERO: use the hub to shake a pursuit.",
      ],
      rations: [{ x: 404, y: 480, taken: false }],
      catnipPickups: [{ x: 120, y: 194, taken: false }],
      hiding: [{ x: 180, y: 112, w: 82, h: 58 }, { x: 540, y: 454, w: 88, h: 58 }, { x: 1052, y: 112, w: 88, h: 58 }],
      shadows: [{ x: 48, y: 286, w: 112, h: 92 }, { x: 72, y: 420, w: 126, h: 84 }, { x: 520, y: 116, w: 112, h: 78 }, { x: 968, y: 420, w: 150, h: 82 }],
      props: [
        { type: "pipe", x: 86, y: 264, w: 214, h: 14 },
        { type: "pipe", x: 468, y: 364, w: 198, h: 14 },
        { type: "pipe", x: 826, y: 264, w: 270, h: 14 },
        { type: "crate", x: 982, y: 416, w: 92, h: 62 },
        { type: "drums", x: 1288, y: 450, w: 94, h: 62 },
        { type: "crate", x: 176, y: 108, w: 88, h: 62 },
        { type: "crate", x: 538, y: 450, w: 92, h: 62 },
        { type: "terminal", x: 364, y: 282, w: 40, h: 48 },
      ],
      cameras: [
        { x: 478, y: 72, base: Math.PI * 0.72, sweep: 0.5, range: 170, phase: 0.5 },
      ],
      panels: [{ x: 364, y: 282, w: 40, h: 48, done: false }],
      alarm: { x: 388, y: 330, w: 38, h: 42, disabled: false, triggered: false },
      sweeps: [
        { x: 298, y: 86, w: 168, h: 416, axis: "y", phase: 1.1, speed: 0.001 },
      ],
      walls: [
        { x: 0, y: 0, w: 454, h: 28 }, { x: 550, y: 0, w: PLAY_W * 2 - 550, h: 28 }, { x: 0, y: H - 28, w: PLAY_W * 2, h: 28 },
        { x: 0, y: 0, w: 28, h: 286 }, { x: 0, y: 372, w: 28, h: H - 372 },
        { x: PLAY_W * 2 - 28, y: 0, w: 28, h: 280 }, { x: PLAY_W * 2 - 28, y: 376, w: 28, h: H - 376 },
        { x: 132, y: 218, w: 176, h: 38 }, { x: 456, y: 218, w: 178, h: 38 },
        { x: 132, y: 382, w: 176, h: 38 }, { x: 456, y: 382, w: 178, h: 38 },
        { x: 820, y: 218, w: 204, h: 38 }, { x: 1188, y: 218, w: 184, h: 38 },
        { x: 820, y: 382, w: 204, h: 38 }, { x: 1188, y: 382, w: 184, h: 38 },
        { x: 1108, y: 28, w: 38, h: 166 },
        { x: 312, y: 28, w: 38, h: 166 },
        { x: 414, y: 446, w: 38, h: 166 },
      ],
      guards: [
        { x: 236, y: 328, route: [[236, 328], [292, 328], [292, 156], [156, 156]], i: 1, speed: 64 },
        { x: 622, y: 328, route: [[622, 328], [466, 328], [466, 502], [622, 502]], i: 1, speed: 60 },
        { x: 1038, y: 328, route: [[1038, 328], [1328, 328], [1328, 504], [1038, 504]], i: 1, speed: 58 },
      ],
    },
  ];

  const authoredRoomPlacements = [
    { room: 0, col: 0, row: 1 },
    { room: 4, col: 1, row: 1 },
    { room: 1, col: 1, row: 0 },
    { room: 2, col: 3, row: 1 },
    { room: 3, col: 4, row: 1 },
  ];

  function authoredRoomOffset(index) {
    const placement = authoredRoomPlacements.find((candidate) => candidate.room === index) || { col: index, row: 0 };
    return {
      x: Number.isFinite(placement.x) ? placement.x : placement.col * PLAY_W,
      y: Number.isFinite(placement.y) ? placement.y : placement.row * H,
    };
  }

  function offsetRect(rect, offset) {
    return { ...rect, x: rect.x + offset.x, y: rect.y + offset.y };
  }

  function offsetPoint(point, offset) {
    return point ? { x: point.x + offset.x, y: point.y + offset.y } : point;
  }

  function offsetDoor(door, offset) {
    return {
      ...offsetRect(door, offset),
      to: 0,
      approach: offsetPoint(door.approach, offset),
      spawn: offsetPoint(door.spawn, offset),
      trigger: door.trigger ? offsetRect(door.trigger, offset) : door.trigger,
    };
  }

  function offsetGuard(guard, offset, roomIndex) {
    return {
      ...guard,
      x: guard.x + offset.x,
      y: guard.y + offset.y,
      route: guard.route.map((point) => [point[0] + offset.x, point[1] + offset.y]),
      homeRoom: 0,
      sourceRoom: roomIndex,
    };
  }

  function mergeAuthoredRooms() {
    const sourceRooms = rooms.slice();
    const bounds = sourceRooms.reduce((rect, room, index) => {
      const offset = authoredRoomOffset(index);
      return {
        w: Math.max(rect.w, offset.x + (room.width || PLAY_W)),
        h: Math.max(rect.h, offset.y + (room.height || H)),
      };
    }, { w: 0, h: 0 });
    const startOffset = authoredRoomOffset(0);
    const finalOffset = authoredRoomOffset(3);
    const merged = {
      unified: true,
      name: "Kennel Block",
      width: bounds.w,
      height: bounds.h,
      floor: "#181f20",
      wall: "#4c5742",
      trim: "#7aa6a0",
      start: offsetPoint(sourceRooms[0].start, startOffset),
      doors: [],
      keycards: [],
      tuna: offsetPoint(sourceRooms[3].tuna, finalOffset),
      intel: offsetRect(sourceRooms[0].intel, startOffset),
      briefings: sourceRooms.flatMap((room) => room.briefings || []),
      rations: [],
      catnipPickups: [],
      hiding: [],
      shadows: [],
      vents: [],
      props: [],
      cameras: [],
      panels: [],
      sweeps: [],
      walls: [],
      lasers: [],
      guards: [],
    };

    sourceRooms.forEach((room, index) => {
      const offset = authoredRoomOffset(index);
      if (room.keycard) merged.keycards.push(offsetPoint(room.keycard, offset));
      merged.doors.push(...(room.doors || []).map((door) => offsetDoor(door, offset)));
      merged.rations.push(...(room.rations || []).map((ration) => offsetPoint(ration, offset)));
      merged.catnipPickups.push(...(room.catnipPickups || []).map((pickup) => offsetPoint(pickup, offset)));
      merged.hiding.push(...(room.hiding || []).map((spot) => offsetRect(spot, offset)));
      merged.shadows.push(...(room.shadows || []).map((shadow) => offsetRect(shadow, offset)));
      merged.vents.push(...(room.vents || []).map((vent) => ({ ...offsetRect(vent, offset), tx: vent.tx + offset.x, ty: vent.ty + offset.y })));
      merged.props.push(...(room.props || []).map((prop) => offsetRect(prop, offset)));
      merged.cameras.push(...(room.cameras || []).map((camera) => ({ ...camera, x: camera.x + offset.x, y: camera.y + offset.y })));
      merged.panels.push(...(room.panels || []).map((panel) => offsetRect(panel, offset)));
      merged.sweeps.push(...(room.sweeps || []).map((sweep) => offsetRect(sweep, offset)));
      merged.walls.push(...(room.walls || []).map((wall) => offsetRect(wall, offset)));
      merged.lasers.push(...(room.lasers || []).map((laser) => offsetRect(laser, offset)));
      merged.guards.push(...(room.guards || []).map((guard) => offsetGuard(guard, offset, index)));
    });

    rooms.length = 0;
    rooms.push(merged);
  }

  mergeAuthoredRooms();

  const START_ROOM = 0;
  const FINAL_ROOM = 3;
  const REQUIRED_TAGS = 3;
  const baseGuardLayouts = rooms.map((room, roomIndex) => room.guards.map((guard, guardIndex) => ({
    ...guard,
    id: `r${roomIndex}g${guardIndex}`,
    homeRoom: roomIndex,
    route: guard.route.map((point) => [point[0], point[1]]),
  })));
  const facilityMapLayout = [
    { room: 0, code: "KEN", x: 0.04, y: 0.48, w: 0.31, h: 0.30 },
    { room: 4, code: "HALL", x: 0.43, y: 0.38, w: 0.22, h: 0.40 },
    { room: 1, code: "PAN", x: 0.40, y: 0.05, w: 0.28, h: 0.26 },
    { room: 2, code: "LAS", x: 0.72, y: 0.44, w: 0.25, h: 0.31 },
    { room: 3, code: "TUNA", x: 0.72, y: 0.05, w: 0.25, h: 0.27 },
  ];
