"use strict";
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const roomLabel = document.getElementById("roomLabel");
  const keyLabel = document.getElementById("keyLabel");
  const alertLabel = document.getElementById("alertLabel");
  const gadgetLabel = document.getElementById("gadgetLabel");
  const buildBadge = document.getElementById("buildBadge");
  const message = document.getElementById("message");
  const BUILD_ID = window.__BUILD_ID__ || "1ac3c0e";
  const urlParams = new URLSearchParams(window.location.search);
  const DEBUG_COLLISION = urlParams.get("debugCollision") === "1";
  const EDITOR_MODE = urlParams.get("editor") === "1";
  const DEBUG_START = {
    x: Number(urlParams.get("debugX")),
    y: Number(urlParams.get("debugY")),
  };
  const assetUrl = (path) => `${path}?v=${encodeURIComponent(BUILD_ID)}`;

  if (buildBadge) {
    buildBadge.textContent = `Build ${BUILD_ID}`;
  }

  ctx.imageSmoothingEnabled = false;

  const VIEW_W = canvas.width;
  const SIDEBAR = 190;
  const PLAY_W = VIEW_W - SIDEBAR;
  const H = canvas.height;
  const CAMERA_ZOOM = 2;
  const PANEL_X = PLAY_W;
  const PANEL_W = SIDEBAR;
  const TILE = 32;
  const DEPTH = 16;
  const MAX_LIFE = 3;
  const GUARD_RADIUS = 12;
  const NAV_CORNER_PAD = GUARD_RADIUS + 10;
  const NAV_POINT_EPSILON = 6;
  const NAV_TARGET_GRANULARITY = 24;
  const STUCK_REPATH_TIME = 0.35;
  const NORMAL_ROOM_GUARD_CAP = 3;
  const EXTRACTION_ROOM_GUARD_CAP = 4;
  const DOOR_OPEN_RANGE = 58;
  const DOOR_OPEN_HOLD = 0.95;
  const YARN_THROW_SPEED = 320;
  const YARN_THROW_RANGE = 170;
  const keys = new Set();
  const noises = [];
  const shots = [];
  const pawPrints = [];
  const catnips = [];
  const ventRattles = [];
  const tacticalPings = [];
  const guardBarks = [];
  const spriteSheet = new Image();
  const playerWalkSheet = new Image();
  const enemyWalkSheet = new Image();
  const enemyFlashlightSheet = new Image();
  const enemyAlertSheet = new Image();
  const dockBaseMap = new Image();
  const propImages = {};
  const SPRITE = 64;
  let spritesReady = false;
  let playerWalkReady = false;
  let enemyWalkReady = false;
  let enemyFlashlightReady = false;
  let enemyAlertReady = false;
  let dockBaseMapReady = false;

  spriteSheet.onload = () => {
    spritesReady = spriteSheet.width >= SPRITE * 4 && spriteSheet.height >= SPRITE * 2;
  };
  spriteSheet.onerror = () => {
    spritesReady = false;
  };
  spriteSheet.src = assetUrl("assets/whisker-sprites.png");

  playerWalkSheet.onload = () => {
    playerWalkReady = playerWalkSheet.width >= SPRITE * 4 && playerWalkSheet.height >= SPRITE * 4;
  };
  playerWalkSheet.onerror = () => {
    playerWalkReady = false;
  };
  playerWalkSheet.src = assetUrl("assets/player-walk.png");

  enemyWalkSheet.onload = () => {
    enemyWalkReady = enemyWalkSheet.width >= SPRITE * 4 && enemyWalkSheet.height >= SPRITE * 4;
  };
  enemyWalkSheet.onerror = () => {
    enemyWalkReady = false;
  };
  enemyWalkSheet.src = assetUrl("assets/enemy-walk.png");

  enemyFlashlightSheet.onload = () => {
    enemyFlashlightReady = enemyFlashlightSheet.width >= SPRITE * 4 && enemyFlashlightSheet.height >= SPRITE * 4;
  };
  enemyFlashlightSheet.onerror = () => {
    enemyFlashlightReady = false;
  };
  enemyFlashlightSheet.src = assetUrl("assets/enemy-flashlight.png");

  enemyAlertSheet.onload = () => {
    enemyAlertReady = enemyAlertSheet.width >= SPRITE * 4 && enemyAlertSheet.height >= SPRITE * 2;
  };
  enemyAlertSheet.onerror = () => {
    enemyAlertReady = false;
  };
  enemyAlertSheet.src = assetUrl("assets/enemy-alert.png");

  dockBaseMap.onload = () => {
    dockBaseMapReady = true;
  };
  dockBaseMap.onerror = () => {
    dockBaseMapReady = false;
  };
  dockBaseMap.src = assetUrl("assets/maps/dock-village/dock-village-base.png");

  const propImageSources = {
    dockFishingBoatSmall: "assets/props/dock-fishing-boat-small/prop.png",
    dockRowboat: "assets/props/dock-rowboat/prop.png",
    dockFishCrate: "assets/props/dock-fish-crate/prop.png",
    dockBarrelStack: "assets/props/dock-barrel-stack/prop.png",
    dockLanternPost: "assets/props/dock-lantern-post/prop.png",
    dockHangingLantern: "assets/props/dock-hanging-lantern/prop.png",
  };

  Object.entries(propImageSources).forEach(([key, src]) => {
    const image = new Image();
    image.ready = false;
    image.onload = () => {
      image.ready = true;
    };
    image.onerror = () => {
      image.ready = false;
    };
    image.src = assetUrl(src);
    propImages[key] = image;
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
