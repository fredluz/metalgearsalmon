"use strict";

const EDITOR_STORAGE_KEY = "whisker-dock-editor-v2";
const EDITOR_PANEL_POSITION_KEY = "whisker-dock-editor-panel-v1";
const EDITOR_RESET_CONFIRM_MS = 4200;
const EDITOR_MAP_W = 1511;
const EDITOR_MAP_H = 1041;
const EDITOR_PROPS = [
  { label: "Fish crate", imageKey: "dockFishCrate", w: 112, h: 86, fallback: "#77683e" },
  { label: "Barrels", imageKey: "dockBarrelStack", w: 86, h: 86, fallback: "#6d5735" },
  { label: "Fishing boat", imageKey: "dockFishingBoatSmall", w: 212, h: 106, fallback: "#394b54" },
  { label: "Rowboat", imageKey: "dockRowboat", w: 170, h: 94, fallback: "#475b5f" },
  { label: "Lantern post", imageKey: "dockLanternPost", w: 64, h: 132, fallback: "#9f7b3d" },
  { label: "Hanging lantern", imageKey: "dockHangingLantern", w: 54, h: 70, fallback: "#d89a43" },
];

const editorState = {
  enabled: false,
  tool: "walk",
  propIndex: 0,
  objective: "backpack",
  dragStart: null,
  dragCurrent: null,
  draft: null,
  panel: null,
  output: null,
  resetButton: null,
  resetConfirmUntil: 0,
  resetConfirmReadyAt: 0,
};

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function rectFromPoints(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(Math.abs(a.x - b.x)),
    h: Math.round(Math.abs(a.y - b.y)),
  };
}

function pointInRect(point, rect, pad = 0) {
  return point.x >= rect.x - pad
    && point.x <= rect.x + rect.w + pad
    && point.y >= rect.y - pad
    && point.y <= rect.y + rect.h + pad;
}

function editorPropRect(prop) {
  return prop.imageKey
    ? { x: prop.x - prop.w / 2, y: prop.y - prop.h, w: prop.w, h: prop.h }
    : prop;
}

function createEditorDraft(room) {
  return {
    version: 1,
    map: "dock-village",
    width: EDITOR_MAP_W,
    height: EDITOR_MAP_H,
    start: { x: 92, y: 812 },
    walkBounds: [],
    walls: [],
    hiding: [],
    props: [],
    guards: [],
    objectives: {
      backpack: { x: 166, y: 458, w: 54, h: 42, taken: false },
      generator: { x: 1126, y: 236, w: 78, h: 62, done: false, type: "generator" },
      exitZone: { x: 1160, y: 856, w: 122, h: 54, label: "EXIT" },
    },
  };
}

function loadEditorDraft(room) {
  try {
    const raw = localStorage.getItem(EDITOR_STORAGE_KEY);
    if (!raw) return createEditorDraft(room);
    const draft = JSON.parse(raw);
    if (draft?.width !== EDITOR_MAP_W || draft?.height !== EDITOR_MAP_H) return createEditorDraft(room);
    return draft?.version ? draft : createEditorDraft(room);
  } catch {
    return createEditorDraft(room);
  }
}

function editorGuardSpecToRoomGuard(spec, index) {
  const dir = spec.dir || { x: 1, y: 0 };
  const dist = Math.hypot(dir.x, dir.y) || 1;
  const unit = { x: dir.x / dist, y: dir.y / dist };
  return {
    id: spec.id || `editor-guard-${index + 1}`,
    x: spec.x,
    y: spec.y,
    route: [[spec.x, spec.y], [spec.x + unit.x * 8, spec.y + unit.y * 8]],
    i: 1,
    speed: 0,
    static: true,
    dir: unit,
    range: spec.range || 245,
    spread: spec.spread || 0.52,
    darkRangeFactor: spec.darkRangeFactor ?? 0.38,
  };
}

function syncEditorDraftToRoom() {
  if (!editorState.draft) return;
  const room = rooms[START_ROOM];
  const draft = editorState.draft;
  room.width = draft.width;
  room.height = draft.height;
  room.start = clonePlain(draft.start);
  room.walkBounds = clonePlain(draft.walkBounds || []);
  room.walls = clonePlain(draft.walls || []);
  room.hiding = clonePlain(draft.hiding || []);
  room.props = clonePlain(draft.props || []);
  room.keycards = [];
  room.tuna = null;
  room.rations = [];
  room.catnipPickups = [];
  room.shadows = [];
  room.lightPools = [];
  room.cameras = [];
  room.sweeps = [];
  room.boatTransfers = [];
  room.vents = [];
  room.alarm = null;
  room.intel = null;
  room.backpack = { ...clonePlain(draft.objectives?.backpack), taken: false };
  room.exitZone = { ...clonePlain(draft.objectives?.exitZone), label: "EXIT" };
  const generator = { ...clonePlain(draft.objectives?.generator), type: "generator", done: false };
  room.panels = generator ? [generator] : [];
  room.guards = clonePlain(draft.guards || []).map(editorGuardSpecToRoomGuard);
  room.guardNav = null;
  buildRoomSpatialIndex(room);
  baseGuardLayouts[START_ROOM] = room.guards.map((guard, guardIndex) => ({
    ...guard,
    id: guard.id || `r${START_ROOM}g${guardIndex}`,
    homeRoom: START_ROOM,
    dir: guard.dir ? { ...guard.dir } : undefined,
    route: guard.route.map((point) => [point[0], point[1]]),
  }));
}

function saveEditorDraft() {
  if (!editorState.draft) return;
  localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(editorState.draft));
  updateEditorOutput();
}

function editorJson() {
  return JSON.stringify(editorState.draft, null, 2);
}

function updateEditorOutput() {
  if (editorState.output) editorState.output.value = editorJson();
}

function updateEditorResetButton() {
  if (!editorState.resetButton) return;
  const armed = Date.now() < editorState.resetConfirmUntil;
  editorState.resetButton.textContent = armed ? "Confirm Reset" : "Reset Draft";
  editorState.resetButton.classList.toggle("is-danger", armed);
}

function cancelEditorResetConfirmation() {
  if (!editorState.resetConfirmUntil) return;
  editorState.resetConfirmUntil = 0;
  editorState.resetConfirmReadyAt = 0;
  updateEditorResetButton();
}

function resetEditorDraftWithConfirmation() {
  const now = Date.now();
  if (now >= editorState.resetConfirmUntil) {
    editorState.resetConfirmUntil = now + EDITOR_RESET_CONFIRM_MS;
    editorState.resetConfirmReadyAt = now + 650;
    updateEditorResetButton();
    notice("CLICK CONFIRM RESET TO CLEAR DRAFT", 1.25);
    window.setTimeout(() => {
      if (Date.now() >= editorState.resetConfirmUntil) cancelEditorResetConfirmation();
    }, EDITOR_RESET_CONFIRM_MS + 80);
    return;
  }
  if (now < editorState.resetConfirmReadyAt) {
    notice("RESET ARMED: CLICK AGAIN AFTER THE FLASH", 0.9);
    return;
  }

  editorState.resetConfirmUntil = 0;
  editorState.resetConfirmReadyAt = 0;
  localStorage.removeItem(EDITOR_STORAGE_KEY);
  editorState.draft = createEditorDraft(rooms[START_ROOM]);
  syncEditorDraftToRoom();
  saveEditorDraft();
  updateEditorResetButton();
  notice("EDITOR DRAFT RESET", 0.9);
}

function editorPointFromEvent(event) {
  const bounds = canvas.getBoundingClientRect();
  const canvasX = (event.clientX - bounds.left) * (VIEW_W / bounds.width);
  const canvasY = (event.clientY - bounds.top) * (H / bounds.height);
  if (canvasX < 0 || canvasY < 0 || canvasX > PLAY_W || canvasY > H) return null;
  const room = rooms[player.room];
  return {
    x: clamp(canvasX / CAMERA_ZOOM + camera.x - (room.worldX || 0), 0, roomWidth(room)),
    y: clamp(canvasY / CAMERA_ZOOM + camera.y - (room.worldY || 0), 0, roomHeight(room)),
  };
}

function addEditorRect(rect) {
  if (rect.w < 8 || rect.h < 8) return;
  if (editorState.tool === "walk") {
    editorState.draft.walkBounds.push({ id: `walk-${Date.now()}`, type: "rect", surface: "dock", ...rect });
  } else if (editorState.tool === "block") {
    editorState.draft.walls.push({ id: `block-${Date.now()}`, ...rect });
  } else if (editorState.tool === "hide") {
    editorState.draft.hiding.push(rect);
  } else if (editorState.tool === "exit") {
    editorState.draft.objectives.exitZone = { ...rect, label: "EXIT" };
  }
}

function addEditorProp(point) {
  const spec = EDITOR_PROPS[editorState.propIndex] || EDITOR_PROPS[0];
  editorState.draft.props.push({
    id: `editor-${spec.imageKey}-${Date.now()}`,
    imageKey: spec.imageKey,
    x: Math.round(point.x),
    y: Math.round(point.y),
    w: spec.w,
    h: spec.h,
    sortY: Math.round(point.y),
    fallback: spec.fallback,
  });
}

function setEditorObjective(point) {
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  if (editorState.objective === "start") {
    editorState.draft.start = { x, y };
    player.x = x;
    player.y = y;
  } else if (editorState.objective === "backpack") {
    editorState.draft.objectives.backpack = { x: x - 27, y: y - 21, w: 54, h: 42, taken: false };
  } else if (editorState.objective === "generator") {
    editorState.draft.objectives.generator = { x: x - 39, y: y - 31, w: 78, h: 62, done: false, type: "generator" };
  }
}

function addEditorGuard(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy) || 1;
  editorState.draft.guards.push({
    id: `editor-guard-${Date.now()}`,
    x: Math.round(start.x),
    y: Math.round(start.y),
    dir: { x: dx / dist, y: dy / dist },
    range: 250,
    spread: 0.56,
    darkRangeFactor: 0.35,
    static: true,
  });
}

function eraseEditorThing(point) {
  const draft = editorState.draft;
  const propIndex = draft.props.findIndex((prop) => pointInRect(point, editorPropRect(prop), 8));
  if (propIndex >= 0) {
    draft.props.splice(propIndex, 1);
    return;
  }
  const guardIndex = draft.guards.findIndex((guard) => Math.hypot(point.x - guard.x, point.y - guard.y) < 24);
  if (guardIndex >= 0) {
    draft.guards.splice(guardIndex, 1);
    return;
  }
  for (const key of ["walls", "hiding", "walkBounds"]) {
    const index = draft[key].findIndex((shape) => shape.type !== "polygon" && pointInRect(point, shape, 5));
    if (index >= 0) {
      draft[key].splice(index, 1);
      return;
    }
  }
}

function finishEditorDrag(end) {
  cancelEditorResetConfirmation();
  const start = editorState.dragStart;
  if (!start) return;
  const rect = rectFromPoints(start, end);
  if (editorState.tool === "prop") {
    addEditorProp(end);
  } else if (editorState.tool === "objective") {
    setEditorObjective(end);
  } else if (editorState.tool === "guard") {
    addEditorGuard(start, end);
  } else if (editorState.tool === "erase") {
    eraseEditorThing(end);
  } else {
    addEditorRect(rect);
  }
  editorState.dragStart = null;
  editorState.dragCurrent = null;
  syncEditorDraftToRoom();
  saveEditorDraft();
}

function setEditorTool(tool) {
  cancelEditorResetConfirmation();
  editorState.tool = tool;
  editorState.panel?.querySelectorAll("[data-editor-tool]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.editorTool === tool);
  });
  const propRow = editorState.panel?.querySelector("[data-editor-prop-row]");
  const objectiveRow = editorState.panel?.querySelector("[data-editor-objective-row]");
  if (propRow) propRow.hidden = tool !== "prop";
  if (objectiveRow) objectiveRow.hidden = tool !== "objective";
}

function createEditorButton(label, tool) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.editorTool = tool;
  button.addEventListener("click", () => setEditorTool(tool));
  return button;
}

function createEditorPanel() {
  const panel = document.createElement("aside");
  panel.className = "editor-panel";
  panel.innerHTML = `
    <div class="editor-title" data-editor-drag>Dock Editor</div>
    <div class="editor-row editor-tools"></div>
    <label data-editor-prop-row>Prop <select data-editor-prop></select></label>
    <label data-editor-objective-row>Objective <select data-editor-objective>
      <option value="backpack">Backpack</option>
      <option value="generator">Generator</option>
      <option value="start">Spawn</option>
    </select></label>
    <div class="editor-row">
      <button type="button" data-editor-copy>Copy JSON</button>
      <button type="button" data-editor-apply>Apply JSON</button>
      <button type="button" data-editor-reset>Reset Draft</button>
    </div>
    <textarea spellcheck="false" data-editor-output></textarea>
  `;
  const tools = panel.querySelector(".editor-tools");
  [
    ["Walk", "walk"],
    ["Block", "block"],
    ["Hide", "hide"],
    ["Prop", "prop"],
    ["Guard", "guard"],
    ["Objective", "objective"],
    ["Exit", "exit"],
    ["Erase", "erase"],
  ].forEach(([label, tool]) => tools.appendChild(createEditorButton(label, tool)));

  const propSelect = panel.querySelector("[data-editor-prop]");
  EDITOR_PROPS.forEach((prop, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = prop.label;
    propSelect.appendChild(option);
  });
  propSelect.addEventListener("change", () => {
    cancelEditorResetConfirmation();
    editorState.propIndex = Number(propSelect.value) || 0;
  });

  panel.querySelector("[data-editor-objective]").addEventListener("change", (event) => {
    cancelEditorResetConfirmation();
    editorState.objective = event.target.value;
  });
  panel.querySelector("[data-editor-copy]").addEventListener("click", async () => {
    cancelEditorResetConfirmation();
    updateEditorOutput();
    await navigator.clipboard.writeText(editorJson());
    notice("EDITOR JSON COPIED", 0.9);
  });
  panel.querySelector("[data-editor-apply]").addEventListener("click", () => {
    cancelEditorResetConfirmation();
    try {
      editorState.draft = JSON.parse(editorState.output.value);
      syncEditorDraftToRoom();
      saveEditorDraft();
      notice("EDITOR JSON APPLIED", 0.9);
    } catch {
      notice("EDITOR JSON INVALID", 0.9);
    }
  });
  editorState.resetButton = panel.querySelector("[data-editor-reset]");
  editorState.resetButton.addEventListener("click", resetEditorDraftWithConfirmation);
  editorState.output = panel.querySelector("[data-editor-output]");
  document.body.appendChild(panel);
  editorState.panel = panel;
  restoreEditorPanelPosition();
  makeEditorPanelDraggable();
  setEditorTool(editorState.tool);
  updateEditorOutput();
}

function restoreEditorPanelPosition() {
  try {
    const position = JSON.parse(localStorage.getItem(EDITOR_PANEL_POSITION_KEY) || "null");
    if (!position) return;
    editorState.panel.style.left = `${clamp(position.x, 0, window.innerWidth - 80)}px`;
    editorState.panel.style.top = `${clamp(position.y, 0, window.innerHeight - 60)}px`;
  } catch {
    // Ignore stale editor panel positions.
  }
}

function makeEditorPanelDraggable() {
  const handle = editorState.panel?.querySelector("[data-editor-drag]");
  if (!handle) return;
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  handle.addEventListener("pointerdown", (event) => {
    dragging = true;
    offsetX = event.clientX - editorState.panel.offsetLeft;
    offsetY = event.clientY - editorState.panel.offsetTop;
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  handle.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const maxX = Math.max(0, window.innerWidth - editorState.panel.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - 48);
    const x = clamp(event.clientX - offsetX, 0, maxX);
    const y = clamp(event.clientY - offsetY, 0, maxY);
    editorState.panel.style.left = `${x}px`;
    editorState.panel.style.top = `${y}px`;
  });
  handle.addEventListener("pointerup", (event) => {
    if (!dragging) return;
    dragging = false;
    handle.releasePointerCapture(event.pointerId);
    localStorage.setItem(EDITOR_PANEL_POSITION_KEY, JSON.stringify({
      x: editorState.panel.offsetLeft,
      y: editorState.panel.offsetTop,
    }));
  });
}

function drawEditorRect(rect, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w, rect.h);
}

function drawEditorOverlay(room) {
  if (!editorState.enabled || room.index !== START_ROOM || !editorState.draft) return;
  ctx.save();
  editorState.draft.walkBounds.forEach((shape) => {
    if (shape.type === "rect") drawEditorRect(shape, "rgba(24, 232, 124, 0.16)", "rgba(24, 255, 160, 0.8)");
  });
  editorState.draft.walls.forEach((wall) => drawEditorRect(wall, "rgba(255, 47, 68, 0.25)", "rgba(255, 235, 235, 0.9)"));
  editorState.draft.hiding.forEach((spot) => drawEditorRect(spot, "rgba(255, 214, 90, 0.2)", "rgba(255, 214, 90, 0.9)"));
  editorState.draft.guards.forEach((guard) => {
    ctx.fillStyle = "rgba(243, 93, 76, 0.85)";
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(243, 93, 76, 0.72)";
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + (guard.dir?.x || 1) * 48, guard.y + (guard.dir?.y || 0) * 48);
    ctx.stroke();
  });
  if (editorState.dragStart && editorState.dragCurrent) {
    const rect = rectFromPoints(editorState.dragStart, editorState.dragCurrent);
    drawEditorRect(rect, "rgba(126, 214, 200, 0.18)", "rgba(126, 214, 200, 0.95)");
  }
  ctx.restore();
}

function initEditorMode() {
  if (!EDITOR_MODE) return;
  editorState.enabled = true;
  editorState.draft = loadEditorDraft(rooms[START_ROOM]);
  syncEditorDraftToRoom();
  createEditorPanel();
  canvas.addEventListener("pointerdown", (event) => {
    const point = editorPointFromEvent(event);
    if (!point) return;
    event.preventDefault();
    editorState.dragStart = point;
    editorState.dragCurrent = point;
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!editorState.dragStart) return;
    const point = editorPointFromEvent(event);
    if (!point) return;
    editorState.dragCurrent = point;
  });
  canvas.addEventListener("pointerup", (event) => {
    const point = editorPointFromEvent(event);
    if (!point) return;
    event.preventDefault();
    finishEditorDrag(point);
  });
  notice("EDITOR MODE", 1.1);
}
