# Documentation Index

This folder is the handoff documentation for future coding agents and maintainers.

Whisker Intrusion is a vanilla JavaScript canvas game. There is no bundler, no package manifest, no ES module graph, and no framework. `index.html` loads `game.js`; `game.js` loads ordered classic browser scripts from `src/`.

The project is organized around five ideas:

- authored rooms/sectors stay readable in `src/rooms.js`,
- `src/world.js` places those sectors into a larger world,
- only visible sectors render,
- only hot sectors run full simulation,
- expensive geometry checks go through spatial queries.

Read the doc that matches the task:

- [Runtime And File Layout](./runtime-and-file-layout.md): boot order, classic script globals, and each source file's job.
- [World, Sectors, And Performance](./world-sectors-performance.md): room placement, camera, hot/warm/cold tiers, spatial indexes, and performance rules.
- [Simulation Systems](./simulation-systems.md): update loop, player actions, AI, alerts, mutable state, and door transitions.
- [Rendering Pipeline](./rendering-pipeline.md): canvas draw flow, render file responsibilities, coordinate transforms, and UI/render rules.
- [Extension Guide](./extension-guide.md): how to add sectors, enemies, pickups, effects, and new system files safely.
- [Verification And Known Limits](./verification-and-limits.md): required checks, smoke tests, limitations, anti-patterns, and recommended next steps.

If you are not sure where to start:

- Maps: `src/rooms.js`
- World placement/camera/tiering: `src/world.js`
- Movement/collision/pathfinding: `src/navigation.js`
- Player verbs: `src/player-actions.js`
- Guard/camera behavior: `src/ai.js`
- Alerts/reinforcements: `src/alerts.js`
- Main frame sequence: `src/update.js`
- Rendering: `src/render-*.js`
- Boot order: `game.js`
