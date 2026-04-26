# Simulation Systems

## Main Update Loop

`src/main.js` owns the animation loop:

```js
function loop(now) {
  const dt = Math.min(0.035, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
```

`dt` is capped to avoid huge jumps after tab stalls.

The gameplay frame is `update(dt)` in `src/update.js`.

## Update Ordering

Current frame order:

1. Return early if paused, won, or game over.
2. Advance mission/player/feedback timers.
3. Call `prepareSectorSimulation()`.
4. Read `room = rooms[player.room]`.
5. Move player.
6. Resolve player hidden state.
7. Update current-room item/effect systems.
8. Apply fresh noises and paw prints.
9. Update current-room sensors, cameras, and guards.
10. Update offscreen warm-sector reinforcement/timer state.
11. Decay alert and sweep state.
12. Handle door transition.
13. Handle lasers.
14. Check extraction completion.
15. Update DOM HUD.

Be careful changing order. Stealth behavior depends on movement, hidden state, and vision checks happening in the current sequence.

## State Ownership

`src/state.js` owns persistent runtime state:

- `player`
- mission flags: `won`, `gameOver`, `paused`, `extractionActive`
- timers: `missionTime`, `roomTime`, `briefingIndex`, `directorTimer`
- alert state: `alert`, `alertReason`, `lastKnown`, `sweepTimer`, `securityLevel`
- feedback state: `noticeText`, `noticeTimer`, `radioText`, `radioTimer`, `roomFlash`, `shake`
- audio context
- `stats`

Important reset functions:

- `restoreAllGuards`
- `resetGuard`
- `resetRoomSystems`
- `reset`
- `resetCurrentRoomAfterCatch`

If new mutable state is added, update reset logic.

## Player State

The `player` object stores:

- current room: `room`
- room-local position: `x`, `y`
- radius: `r`
- progression: `keys`
- direction: `facing`
- stealth flags: `hidden`, `moving`, `soft`, `boxed`
- inventory: `catnip`, `rationsHeld`
- cooldowns: `meowCooldown`, `senseCooldown`, `hitCooldown`, `doorCooldown`
- timers: `ventHidden`, `entryGrace`, `senseTimer`
- health: `life`

Most systems assume `player.x/y` are local to `rooms[player.room]`.

## Player Actions

`src/player-actions.js` owns player verbs and nearby interactive systems.

Core verbs:

- `emitMeow`
- `activateWhiskerSense`
- `throwYarnBall`
- `movePlayer`
- `useRation`
- `scratchGuard`

Effect/update systems:

- `updateNoises`
- `updateCatnips`
- `updateTunaScent`
- `updateVentRattles`
- `updateTacticalPings`
- `updateShots`
- `updatePawPrints`
- `applyFreshNoises`
- `applyFreshPawPrints`

Most player action logic is hot-sector-only. If an effect must exist across sectors, decide whether it should become world-space or remain room-local.

## Interaction System

`interact()` in `src/update.js` handles `E`.

Current interaction order:

1. scratchable guard,
2. vent,
3. security panel,
4. alarm,
5. intel,
6. keycard,
7. ration,
8. yarn pickup,
9. tuna.

The order matters. A nearby scratchable guard can consume the interaction before a pickup.

If a new interaction is added, choose its priority deliberately.

## Door Transitions

Doors are authored in room data:

```js
{
  x,
  y,
  w,
  h,
  to,
  need,
  label,
  approach,
  spawn,
  trigger
}
```

`update()` checks `doorTriggerRect(door)` and calls `changeRoom(door)` if unlocked.

`changeRoom(door)`:

- changes `player.room`,
- moves player to destination `spawn`,
- clears current-room transient arrays,
- applies entry grace,
- updates alert state,
- resets room timers,
- plays room cue,
- shows notice text.

The next seamless traversal refactor should preserve room authoring but replace teleport transitions with boundary/passage crossing.

## Guard AI

`src/ai.js` owns full hot-sector guard behavior.

Important guard states:

- `patrol`
- `investigate`
- `search`
- `sweep`
- `reroute`
- `reinforce`
- `callAlarm`

Full update path:

```js
updateGuards(room, dt)
```

This handles:

- stun timers,
- fire cooldowns,
- aiming,
- witnessing downed guards,
- patrol/search/sweep/reinforce movement,
- vision checks,
- suspicion decay/growth,
- box anomaly checks,
- caught triggers,
- shooting.

Full AI should only run in the hot/current sector.

## Warm-Sector Simulation

`updateWarmRoom(room, dt)` is cheap background simulation.

It currently handles:

- camera suspicion decay,
- guard stun decay,
- guard cooldown decay,
- guard suspicion decay,
- search/sweep timer decay,
- returning expired search/sweep guards to patrol.

It should not:

- run line-of-sight,
- pathfind,
- shoot,
- inspect the player,
- raycast camera vision,
- run tactical overlays.

## Alerts And Reinforcements

`src/alerts.js` owns alert escalation and cross-room responses.

Important functions:

- `makeNoise`
- `markLastKnown`
- `triggerCaught`
- `orderAlarmCall`
- `triggerRoomAlarm`
- `callAdjacentReinforcement`
- `dispatchReinforcement`
- `transferGuardToRoom`
- `startRoomSweep`
- `startExtraction`
- `completeMission`

Alert state is global, but guard reactions are usually room-local.

Cross-sector reinforcements should use room graph decisions before local guard movement. Do not run global pathfinding over the whole world.

## Mutable Room State

Mutable room state includes:

- `room.systemDown`
- `keycard.taken`
- `tuna.taken`
- `intel.done`
- `ration.taken`
- `catnipPickup.taken`
- `panel.done`
- `alarm.disabled`
- `alarm.triggered`
- `camera.suspicion`

`resetRoomSystems(room)` must restore mutable room state.

## Objectives And HUD State

`src/objectives.js` owns:

- objective text,
- objective target,
- tactical points,
- door route helpers,
- DOM HUD labels.

`updateHud()` is called at the end of update and during paused/won/game-over early returns.

Do not put expensive simulation in objective helpers. They are called often and used by render/UI systems.
