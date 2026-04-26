"use strict";

const DOCK_W = 1511;
const DOCK_H = 1041;

const dockWalkBounds = [
  { id: "left-backpack-platform", type: "polygon", surface: "dock", points: [[34, 486], [186, 452], [346, 468], [356, 548], [204, 590], [42, 558]] },
  { id: "left-spine", type: "rect", x: 34, y: 516, w: 96, h: 404, surface: "dock" },
  { id: "left-lower-branch", type: "rect", x: 34, y: 822, w: 360, h: 100, surface: "dock" },
  { id: "left-upper-riser", type: "rect", x: 324, y: 348, w: 78, h: 178, surface: "dock" },
  { id: "upper-main-dock", type: "rect", x: 168, y: 302, w: 712, h: 78, surface: "dock" },
  { id: "upper-loop-left", type: "rect", x: 548, y: 196, w: 80, h: 178, surface: "dock" },
  { id: "upper-loop-top", type: "rect", x: 548, y: 196, w: 348, h: 68, surface: "dock" },
  { id: "upper-loop-right", type: "rect", x: 816, y: 196, w: 80, h: 190, surface: "dock" },
  { id: "central-drop", type: "rect", x: 780, y: 350, w: 96, h: 286, surface: "dock" },
  { id: "central-bridge", type: "polygon", surface: "dock", points: [[780, 526], [1016, 518], [1300, 526], [1300, 638], [1024, 656], [780, 628]] },
  { id: "lower-main-dock", type: "polygon", surface: "dock", points: [[292, 758], [720, 748], [1006, 752], [1308, 778], [1296, 884], [994, 872], [714, 884], [292, 872]] },
  { id: "lower-left-connector", type: "rect", x: 270, y: 806, w: 150, h: 118, surface: "dock" },
  { id: "right-spine", type: "rect", x: 1238, y: 126, w: 116, h: 1060, surface: "dock" },
  { id: "right-mid-branch", type: "rect", x: 1238, y: 526, w: 330, h: 112, surface: "dock" },
  { id: "right-top-base", type: "rect", x: 1238, y: 126, w: 482, h: 82, surface: "dock" },
  { id: "right-top-outer", type: "rect", x: 1640, y: 178, w: 78, h: 258, surface: "dock" },
  { id: "right-top-lower", type: "rect", x: 1462, y: 270, w: 256, h: 84, surface: "dock" },
  { id: "generator-room", type: "rect", x: 1430, y: 286, w: 162, h: 210, surface: "dock" },
  { id: "bottom-gangway", type: "rect", x: 1280, y: 840, w: 122, h: 350, surface: "dock" },
  { id: "bottom-exit-deck", type: "rect", x: 1168, y: 1070, w: 386, h: 110, surface: "dock" },
  { id: "muddy-exit-shore", type: "polygon", surface: "shore", points: [[1460, 1118], [1800, 1116], [1800, 1320], [1180, 1320], [1244, 1212]] },
];

const dockProps = [
  { id: "left-fish-boat", imageKey: "dockFishingBoatSmall", x: 190, y: 294, w: 190, h: 98, sortY: 294, fallback: "#394b54" },
  { id: "left-fish-crate", imageKey: "dockFishCrate", x: 222, y: 342, w: 94, h: 74, sortY: 342, fallback: "#77683e" },
  { id: "orange-crate", imageKey: "dockFishCrate", x: 382, y: 330, w: 92, h: 78, sortY: 330, fallback: "#b87923" },
  { id: "backpack-lantern", imageKey: "dockLanternPost", x: 226, y: 512, w: 58, h: 126, sortY: 512, fallback: "#9f7b3d" },
  { id: "upper-loop-rowboat", imageKey: "dockRowboat", x: 840, y: 338, w: 180, h: 96, sortY: 338, fallback: "#475b5f" },
  { id: "upper-loop-lantern", imageKey: "dockHangingLantern", x: 704, y: 250, w: 54, h: 70, sortY: 250, fallback: "#d89a43" },
  { id: "central-crate-cover", imageKey: "dockFishCrate", x: 980, y: 610, w: 112, h: 82, sortY: 610, fallback: "#77683e" },
  { id: "lower-fish-boat-a", imageKey: "dockFishingBoatSmall", x: 462, y: 944, w: 166, h: 92, sortY: 944, fallback: "#394b54" },
  { id: "lower-fish-boat-b", imageKey: "dockFishingBoatSmall", x: 604, y: 944, w: 166, h: 92, sortY: 944, fallback: "#394b54" },
  { id: "lower-fish-boat-c", imageKey: "dockFishingBoatSmall", x: 748, y: 944, w: 166, h: 92, sortY: 944, fallback: "#394b54" },
  { id: "lower-fish-boat-d", imageKey: "dockFishingBoatSmall", x: 892, y: 944, w: 166, h: 92, sortY: 944, fallback: "#394b54" },
  { id: "lower-fish-boat-e", imageKey: "dockFishingBoatSmall", x: 1036, y: 944, w: 166, h: 92, sortY: 944, fallback: "#394b54" },
  { id: "lower-fish-crate", imageKey: "dockFishCrate", x: 1144, y: 838, w: 124, h: 88, sortY: 838, fallback: "#77683e" },
  { id: "right-spine-lantern", imageKey: "dockLanternPost", x: 1310, y: 748, w: 62, h: 130, sortY: 748, fallback: "#9f7b3d" },
  { id: "right-top-fish-boat", imageKey: "dockFishingBoatSmall", x: 1514, y: 178, w: 218, h: 106, sortY: 178, fallback: "#394b54" },
  { id: "right-top-crates", imageKey: "dockFishCrate", x: 1554, y: 188, w: 116, h: 82, sortY: 188, fallback: "#77683e" },
  { id: "generator-barrels", imageKey: "dockBarrelStack", x: 1536, y: 414, w: 92, h: 92, sortY: 414, fallback: "#6d5735" },
  { id: "exit-fish-crate", imageKey: "dockFishCrate", x: 1428, y: 1106, w: 126, h: 92, sortY: 1106, fallback: "#c89b4c" },
  { id: "exit-boat", imageKey: "dockRowboat", x: 1612, y: 1194, w: 190, h: 104, sortY: 1194, fallback: "#475b5f" },
];

function staticGuard(id, x, y, dx, dy, range = 245, spread = 0.52, darkRangeFactor = 0.38) {
  const dist = Math.hypot(dx, dy) || 1;
  const dir = { x: dx / dist, y: dy / dist };
  return {
    id,
    x,
    y,
    route: [[x, y], [x + dir.x * 8, y + dir.y * 8]],
    i: 1,
    speed: 0,
    static: true,
    dir,
    range,
    spread,
    darkRangeFactor,
  };
}

const rooms = [
  {
    name: "Dock Village",
    width: DOCK_W,
    height: DOCK_H,
    baseImageKey: "dockVillageBase",
    useLayeredArt: true,
    drawWalls: false,
    floor: "#071119",
    wall: "#31413f",
    trim: "#7aa6a0",
    start: { x: 118, y: 872 },
    backpack: { x: 244, y: 520, w: 54, h: 42, taken: false },
    exitZone: { x: 1420, y: 1128, w: 122, h: 54, label: "EXIT" },
    doors: [],
    keycards: [],
    tuna: null,
    intel: null,
    briefings: [
      "ZERO: recover your gear from the pack before you leave.",
      "ZERO: the generator feeds every lantern on this dock.",
      "ZERO: once the lights die, the south sentries lose their reach.",
    ],
    rations: [
      { x: 354, y: 842, taken: false },
      { x: 1068, y: 822, taken: false },
    ],
    catnipPickups: [
      { x: 620, y: 236, taken: false },
    ],
    hiding: [
      { x: 184, y: 312, w: 86, h: 58 },
      { x: 326, y: 796, w: 82, h: 58 },
      { x: 940, y: 566, w: 92, h: 58 },
      { x: 1100, y: 786, w: 118, h: 66 },
      { x: 1494, y: 150, w: 122, h: 56 },
      { x: 1372, y: 1072, w: 116, h: 66 },
    ],
    shadows: [
      { x: 42, y: 626, w: 88, h: 108 },
      { x: 420, y: 756, w: 150, h: 92 },
      { x: 798, y: 530, w: 150, h: 82 },
      { x: 1238, y: 436, w: 110, h: 110 },
      { x: 1286, y: 914, w: 110, h: 126 },
    ],
    lightPools: [
      { x: 226, y: 512, radius: 140, alpha: 0.2 },
      { x: 704, y: 250, radius: 142, alpha: 0.18 },
      { x: 1012, y: 600, radius: 154, alpha: 0.18 },
      { x: 1310, y: 748, radius: 150, alpha: 0.19 },
      { x: 1508, y: 330, radius: 190, alpha: 0.22 },
      { x: 1418, y: 1112, radius: 166, alpha: 0.2 },
    ],
    vents: [],
    boatTransfers: [],
    props: dockProps,
    cameras: [],
    panels: [
      { x: 1472, y: 312, w: 78, h: 62, done: false, type: "generator" },
    ],
    alarm: null,
    sweeps: [],
    walkBounds: dockWalkBounds,
    walls: [
      { id: "orange-crate-block", x: 348, y: 300, w: 76, h: 52 },
      { id: "central-crate-block", x: 944, y: 572, w: 82, h: 44 },
      { id: "lower-crate-block", x: 1106, y: 790, w: 96, h: 48 },
      { id: "generator-barrel-block", x: 1498, y: 386, w: 76, h: 46 },
      { id: "exit-crate-block", x: 1378, y: 1078, w: 88, h: 48 },
    ],
    lasers: [],
    guards: [
      staticGuard("left-sentry", 326, 834, -0.92, 0.38, 250, 0.58, 0.42),
      staticGuard("upper-sentry", 804, 334, 0.38, 0.92, 285, 0.5, 0.42),
      staticGuard("right-top-sentry", 1322, 168, 0.98, 0.18, 280, 0.54, 0.34),
      staticGuard("generator-sentry", 1570, 470, -0.22, -1, 260, 0.52, 0.32),
      staticGuard("south-left-sentry", 1260, 1096, -0.8, 0.58, 300, 0.62, 0.2),
      staticGuard("south-center-sentry", 1352, 1088, 0.05, 1, 330, 0.6, 0.18),
      staticGuard("south-right-sentry", 1510, 1096, 0.7, 0.72, 310, 0.62, 0.2),
    ],
    navPoints: [
      { x: 118, y: 872 }, { x: 88, y: 540 }, { x: 244, y: 520 }, { x: 450, y: 342 },
      { x: 610, y: 342 }, { x: 704, y: 230 }, { x: 840, y: 342 }, { x: 828, y: 568 },
      { x: 1060, y: 590 }, { x: 1268, y: 590 }, { x: 1296, y: 170 }, { x: 1512, y: 168 },
      { x: 1570, y: 330 }, { x: 1664, y: 314 }, { x: 354, y: 842 }, { x: 640, y: 818 },
      { x: 930, y: 820 }, { x: 1240, y: 820 }, { x: 1312, y: 748 }, { x: 1340, y: 940 },
      { x: 1340, y: 1120 }, { x: 1512, y: 1138 }, { x: 1520, y: 1164 },
    ],
  },
];

const START_ROOM = 0;
const FINAL_ROOM = 0;
const REQUIRED_TAGS = 0;
const baseGuardLayouts = rooms.map((room, roomIndex) => room.guards.map((guard, guardIndex) => ({
  ...guard,
  id: guard.id || `r${roomIndex}g${guardIndex}`,
  homeRoom: roomIndex,
  dir: guard.dir ? { ...guard.dir } : undefined,
  route: guard.route.map((point) => [point[0], point[1]]),
})));
const facilityMapLayout = [
  { room: 0, code: "DOCK", x: 0.05, y: 0.07, w: 0.9, h: 0.84 },
];
