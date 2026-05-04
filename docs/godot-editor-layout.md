# Godot Level Editing

Open `res://scenes/main_editable.tscn`.

If the 2D viewport opens on empty space, select `MapArt` in the scene tree and press `F` to frame the map.

- Move `Props/*` Sprite2D nodes to reposition crates, boats, lanterns, and other props.
- `prop_size` is the size the prop uses in gameplay. The Sprite2D `scale` only makes the source PNG preview fit that size in the editor.
- Some props have a `Blocker` child. Move the prop to move its collision with it, or resize the child shape to tune the blocker.
- Move `Guards/*` nodes to reposition sentries. Edit their exported `facing`, `sight_range`, `sight_spread`, and `dark_range_factor` values in the Inspector.
- In play mode, press `E` behind a guard to knock them out for 30 seconds. Press `E` again on a sleeping guard to finish them permanently.
- Add extra `Collision/*/Shape` rectangles only for standalone blockers that are not attached to a prop.
- Edit `WalkBounds/*` areas for where the player and guards can move.
- Edit `HidingZones/*` areas for cover/hiding spots.
- Edit `Objectives/*` areas for backpack, generator, exit, rations, yarn pickups, and `PlayerStart`.

Editor guide colors:

- Teal outlines are prop bounds, hiding zones, and walkable areas.
- Orange/red outlines inside props are hard collision blockers.
- Yellow cones are guard vision.
- White crosshair plus player sprite is `PlayerStart`.
- Sleeping guards show 3, 2, then 1 `Z` as they get closer to waking.

The runtime reads these nodes when the scene starts. Press Play after moving or resizing nodes to test the new layout.
