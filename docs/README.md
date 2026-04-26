# Documentation Index

This folder is the handoff documentation for future coding agents and maintainers.

Whisker Intrusion is a vanilla JavaScript canvas game. There is no bundler, no package manifest, no ES module graph, and no framework. `index.html` loads `game.js`; `game.js` loads ordered classic browser scripts from `src/`.

The project is organized around five ideas:

- source rooms stay readable in `src/rooms.js`,
- those source rooms are flattened into one large `Kennel Block` gameplay room,
- the camera follows inside that single large room,
- all guards in the unified room run full simulation,
- expensive geometry checks go through spatial queries.

Read the doc that matches the task:

- [Runtime And File Layout](./runtime-and-file-layout.md): boot order, classic script globals, and each source file's job.
- [World, Sectors, And Performance](./world-sectors-performance.md): unified map construction, camera, spatial indexes, and performance rules.
- [Simulation Systems](./simulation-systems.md): update loop, player actions, AI, alerts, mutable state, and gate feedback.
- [Rendering Pipeline](./rendering-pipeline.md): canvas draw flow, render file responsibilities, coordinate transforms, and UI/render rules.
- [Extension Guide](./extension-guide.md): how to add source-room content, enemies, pickups, effects, and new system files safely.
- [Verification And Known Limits](./verification-and-limits.md): required checks, smoke tests, limitations, anti-patterns, and recommended next steps.

If you are not sure where to start:

- Maps: `src/rooms.js`
- Unified map/camera/spatial queries: `src/world.js`
- Movement/collision/pathfinding: `src/navigation.js`
- Player verbs: `src/player-actions.js`
- Guard/camera behavior: `src/ai.js`
- Alerts/reinforcements: `src/alerts.js`
- Main frame sequence: `src/update.js`
- Rendering: `src/render-*.js`
- Boot order: `game.js`
