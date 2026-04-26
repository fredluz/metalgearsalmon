(function () {
  "use strict";

  const buildId = window.__BUILD_ID__ || "1ac3c0e";
  const sources = [
    "src/core.js",
    "src/rooms.js",
    "src/state.js",
    "src/objectives.js",
    "src/navigation.js",
    "src/alerts.js",
    "src/player-actions.js",
    "src/ai.js",
    "src/update.js",
    "src/render-environment.js",
    "src/render-room.js",
    "src/render-actors.js",
    "src/render-tactics.js",
    "src/render-player-ui.js",
    "src/render-sidebar.js",
    "src/main.js",
  ];

  function showLoadError(source) {
    const message = document.getElementById("message");
    if (message) {
      message.textContent = `Failed to load ${source}`;
      message.hidden = false;
    }
  }

  function loadNext(index) {
    if (index >= sources.length) return;

    const source = sources[index];
    const script = document.createElement("script");
    script.src = `${source}?v=${encodeURIComponent(buildId)}`;
    script.onload = () => loadNext(index + 1);
    script.onerror = () => {
      showLoadError(source);
      console.error(`Failed to load ${source}`);
    };
    document.body.appendChild(script);
  }

  loadNext(0);
})();
