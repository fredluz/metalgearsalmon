# Whisker Intrusion Architecture

The detailed architecture docs live in [docs/](./docs/).

Start with [docs/README.md](./docs/README.md). It links to the focused docs by topic:

- [Runtime And File Layout](./docs/runtime-and-file-layout.md)
- [Unified World And Performance](./docs/world-sectors-performance.md)
- [Simulation Systems](./docs/simulation-systems.md)
- [Rendering Pipeline](./docs/rendering-pipeline.md)
- [Extension Guide](./docs/extension-guide.md)
- [Verification And Known Limits](./docs/verification-and-limits.md)

Core rules:

- Keep source files under 500 lines.
- Keep gameplay out of `game.js`; it is only the ordered loader.
- Use `src/rooms.js` for authored map data.
- Use `src/world.js` for unified-room camera bounds and spatial queries.
- The playable facility is one large room; do not reintroduce room-transition teleports.
- Run syntax checks and a browser smoke test after structural changes.
