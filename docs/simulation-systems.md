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
10. Update legacy offscreen reinforcement/timer state.
11. Decay alert and sweep state.
12. Show locked-door feedback.
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

Most player action logic runs in `rooms[player.room]`. In the unified map, that is the full `Kennel Block`.

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

## Gates

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

Player traversal does not use trigger-based room teleporting. In the unified map, doors are collision gates inside one large room.

Current gate flow:

- `movePlayer()` attempts normal movement.
- `blocked()` checks walls and locked doors.
- If a door is unlocked, it no longer blocks and does not move the player.
- If a door is locked, `update()` uses `doorTriggerRect(door)` for tag requirement feedback.
- No room cue, flash, notice, or arbitrary destination spawn is used for normal traversal.

`spawn` still exists on door data because guard reinforcement transfer uses destination spawn points. Do not use `spawn` for player movement unless the task is explicitly adding a non-continuous transport mechanic.

## Guard AI

`src/ai.js` owns full guard behavior. Since the facility is now one unified room, all guards in `rooms[0]` are eligible for the normal guard update.

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

Full AI runs in the current unified room.

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

Legacy reinforcement helpers still exist, but normal adjacent-room idling is gone because adjacent authored rooms are part of the same gameplay room.

## Radio And Guard Speech

Radio and guard dialogue are intentionally separate.

Use `radio(text, seconds)` only for command/radio communication that should appear in the top-left radio callout. Examples include mission guidance, extraction messages, and remote support.

Use `sayGuard(guard, text, seconds)` when an in-world guard is speaking. This creates a `guardBarks` entry that follows the guard and renders above that guard's head. Do not prefix guard speech with `GUARD:`; `sayGuard` strips that legacy prefix for compatibility, but new call sites should pass the actual spoken line.

Use `sayNearestGuard(room, x, y, text, seconds, range)` when the event is world-positioned and the system does not already know which guard should react. This is used for noises such as meows, yarn, tuna scent, box rustles, steps, and vent rattles.

Guard speech state lives in `guardBarks` in `src/core.js`. `updateGuardBarks(dt)` in `src/player-actions.js` expires speech bubbles and drops them if the speaking guard is no longer in the current room.

Reset functions must clear `guardBarks`. Current reset coverage is:

- `reset()`
- `resetCurrentRoomAfterCatch()`
- `clearSectorTransients()`

When adding new guard reactions, pick the channel deliberately:

- guard notices, suspicion, alarm movement, and local tactical barks: `sayGuard` or `sayNearestGuard`
- support calls, objectives, mission status, and offscreen radio chatter: `radio`

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
