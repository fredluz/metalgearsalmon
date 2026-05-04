@tool
extends Node2D

@export var gameplay_offset := Vector2(-78.0, -62.0):
	set(value):
		gameplay_offset = value
		queue_redraw()
@export var gameplay_scale := Vector2.ONE:
	set(value):
		gameplay_scale = value
		queue_redraw()
@export var show_editor_guides := true:
	set(value):
		show_editor_guides = value
		queue_redraw()

const DOCK_W := 1511.0
const DOCK_H := 1041.0
const PLAYER_RADIUS := 15.0
const GUARD_RADIUS := 12.0
const YARN_SPEED := 320.0
const YARN_RANGE := 170.0
const SPRITE_SIZE := 64.0
const PLAYER_FRAME_RATE := 9.0
const GUARD_FRAME_RATE := 7.0
const GUARD_PATROL_SPEED := 28.0
const GUARD_CHASE_SPEED := 92.0
const GUARD_INVESTIGATE_SPEED := 64.0
const GUARD_CONTACT_RANGE := 24.0
const PLAYER_HIT_GRACE := 1.25
const GUARD_CHASE_SUSPICION := 0.62
const GUARD_SLEEP_SECONDS := 30.0
const TAKEDOWN_RANGE := 42.0
const TAKEDOWN_BACK_DOT := 0.45
const GUARD_SHOT_RANGE := 310.0
const GUARD_SHOT_COOLDOWN := 0.9
const BULLET_SPEED := 430.0
const NAV_CELL_SIZE := 16.0

var dock_base: Texture2D
var player_walk: Texture2D
var enemy_walk: Texture2D

var prop_texture_paths := {
	"dockFishingBoatSmall": "res://assets/props/dock-fishing-boat-small/prop.png",
	"dockRowboat": "res://assets/props/dock-rowboat/prop.png",
	"dockFishCrate": "res://assets/props/dock-fish-crate/prop.png",
	"dockBarrelStack": "res://assets/props/dock-barrel-stack/prop.png",
	"dockLanternPost": "res://assets/props/dock-lantern-post/prop.png",
	"dockHangingLantern": "res://assets/props/dock-hanging-lantern/prop.png",
}
var prop_textures := {}
var layout_from_nodes := false
var guard_layout_nodes := []
var guard_nav := AStar2D.new()
var guard_nav_cells := {}

var walk_bounds := [
	{ "id": "left_lower_vertical", "type": "rect", "x": 68, "y": 383, "w": 64, "h": 348 },
	{ "id": "left_lower_top", "type": "rect", "x": 70, "y": 382, "w": 235, "h": 44 },
	{ "id": "left_lower_bottom", "type": "rect", "x": 128, "y": 733, "w": 235, "h": 56 },
	{ "id": "lower_main_dock", "type": "rect", "x": 299, "y": 559, "w": 615, "h": 62 },
	{ "id": "lower_left_connector", "type": "rect", "x": 299, "y": 610, "w": 64, "h": 179 },
	{ "id": "lower_pier_01", "type": "rect", "x": 431, "y": 610, "w": 38, "h": 122 },
	{ "id": "lower_pier_02", "type": "rect", "x": 536, "y": 610, "w": 38, "h": 122 },
	{ "id": "lower_pier_03", "type": "rect", "x": 643, "y": 610, "w": 43, "h": 122 },
	{ "id": "lower_pier_04", "type": "rect", "x": 748, "y": 610, "w": 43, "h": 122 },
	{ "id": "left_upper_main", "type": "rect", "x": 181, "y": 244, "w": 527, "h": 52 },
	{ "id": "left_upper_riser", "type": "rect", "x": 493, "y": 126, "w": 60, "h": 170 },
	{ "id": "left_upper_top", "type": "rect", "x": 553, "y": 133, "w": 139, "h": 56 },
	{ "id": "left_upper_drop", "type": "rect", "x": 644, "y": 232, "w": 63, "h": 199 },
	{ "id": "center_bridge", "type": "rect", "x": 706, "y": 371, "w": 460, "h": 67 },
	{ "id": "center_platform", "type": "rect", "x": 912, "y": 438, "w": 265, "h": 462 },
	{ "id": "right_left_vertical", "type": "rect", "x": 1030, "y": 60, "w": 68, "h": 315 },
	{ "id": "right_top_horizontal", "type": "rect", "x": 1030, "y": 62, "w": 415, "h": 73 },
	{ "id": "right_outer_vertical", "type": "rect", "x": 1366, "y": 60, "w": 78, "h": 285 },
	{ "id": "right_inner_vertical", "type": "rect", "x": 1223, "y": 195, "w": 58, "h": 229 },
	{ "id": "right_mid_horizontal", "type": "rect", "x": 1095, "y": 372, "w": 185, "h": 55 },
	{ "id": "exit_shore", "type": "rect", "x": 1176, "y": 872, "w": 335, "h": 169 },
]

var props := [
	{ "id": "left-fish-boat", "imageKey": "dockFishingBoatSmall", "x": 190, "y": 294, "w": 190, "h": 98, "sortY": 294, "fallback": Color("#394b54") },
	{ "id": "left-fish-crate", "imageKey": "dockFishCrate", "x": 222, "y": 342, "w": 94, "h": 74, "sortY": 342, "fallback": Color("#77683e") },
	{ "id": "orange-crate", "imageKey": "dockFishCrate", "x": 382, "y": 330, "w": 92, "h": 78, "sortY": 330, "fallback": Color("#b87923") },
	{ "id": "backpack-lantern", "imageKey": "dockLanternPost", "x": 226, "y": 512, "w": 58, "h": 126, "sortY": 512, "fallback": Color("#9f7b3d") },
	{ "id": "upper-loop-rowboat", "imageKey": "dockRowboat", "x": 840, "y": 338, "w": 180, "h": 96, "sortY": 338, "fallback": Color("#475b5f") },
	{ "id": "upper-loop-lantern", "imageKey": "dockHangingLantern", "x": 704, "y": 250, "w": 54, "h": 70, "sortY": 250, "fallback": Color("#d89a43") },
	{ "id": "central-crate-cover", "imageKey": "dockFishCrate", "x": 980, "y": 610, "w": 112, "h": 82, "sortY": 610, "fallback": Color("#77683e") },
	{ "id": "lower-fish-boat-a", "imageKey": "dockFishingBoatSmall", "x": 462, "y": 944, "w": 166, "h": 92, "sortY": 944, "fallback": Color("#394b54") },
	{ "id": "lower-fish-boat-b", "imageKey": "dockFishingBoatSmall", "x": 604, "y": 944, "w": 166, "h": 92, "sortY": 944, "fallback": Color("#394b54") },
	{ "id": "lower-fish-boat-c", "imageKey": "dockFishingBoatSmall", "x": 748, "y": 944, "w": 166, "h": 92, "sortY": 944, "fallback": Color("#394b54") },
	{ "id": "lower-fish-boat-d", "imageKey": "dockFishingBoatSmall", "x": 892, "y": 944, "w": 166, "h": 92, "sortY": 944, "fallback": Color("#394b54") },
	{ "id": "lower-fish-boat-e", "imageKey": "dockFishingBoatSmall", "x": 1036, "y": 944, "w": 166, "h": 92, "sortY": 944, "fallback": Color("#394b54") },
	{ "id": "lower-fish-crate", "imageKey": "dockFishCrate", "x": 1144, "y": 838, "w": 124, "h": 88, "sortY": 838, "fallback": Color("#77683e") },
	{ "id": "right-spine-lantern", "imageKey": "dockLanternPost", "x": 1310, "y": 748, "w": 62, "h": 130, "sortY": 748, "fallback": Color("#9f7b3d") },
	{ "id": "right-top-fish-boat", "imageKey": "dockFishingBoatSmall", "x": 1514, "y": 178, "w": 218, "h": 106, "sortY": 178, "fallback": Color("#394b54") },
	{ "id": "right-top-crates", "imageKey": "dockFishCrate", "x": 1554, "y": 188, "w": 116, "h": 82, "sortY": 188, "fallback": Color("#77683e") },
	{ "id": "generator-barrels", "imageKey": "dockBarrelStack", "x": 1536, "y": 414, "w": 92, "h": 92, "sortY": 414, "fallback": Color("#6d5735") },
	{ "id": "exit-fish-crate", "imageKey": "dockFishCrate", "x": 1428, "y": 1106, "w": 126, "h": 92, "sortY": 1106, "fallback": Color("#c89b4c") },
	{ "id": "exit-boat", "imageKey": "dockRowboat", "x": 1612, "y": 1194, "w": 190, "h": 104, "sortY": 1194, "fallback": Color("#475b5f") },
]

var walls := [
	Rect2(348, 300, 76, 52),
	Rect2(944, 572, 82, 44),
	Rect2(1106, 790, 96, 48),
	Rect2(1498, 386, 76, 46),
	Rect2(1378, 1078, 88, 48),
]

var hiding := [
	Rect2(184, 312, 86, 58),
	Rect2(326, 796, 82, 58),
	Rect2(940, 566, 92, 58),
	Rect2(1100, 786, 118, 66),
	Rect2(1494, 150, 122, 56),
	Rect2(1372, 1072, 116, 66),
]

var shadows := [
	Rect2(42, 626, 88, 108),
	Rect2(420, 756, 150, 92),
	Rect2(798, 530, 150, 82),
	Rect2(1238, 436, 110, 110),
	Rect2(1286, 914, 110, 126),
]

var light_pools := [
	{ "x": 226, "y": 512, "radius": 140, "alpha": 0.2 },
	{ "x": 704, "y": 250, "radius": 142, "alpha": 0.18 },
	{ "x": 1012, "y": 600, "radius": 154, "alpha": 0.18 },
	{ "x": 1310, "y": 748, "radius": 150, "alpha": 0.19 },
	{ "x": 1508, "y": 330, "radius": 190, "alpha": 0.22 },
	{ "x": 1418, "y": 1112, "radius": 166, "alpha": 0.2 },
]

var guards := []
var player := {
	"pos": Vector2(118, 872),
	"facing": Vector2.RIGHT,
	"moving": false,
	"gear": false,
	"hidden": false,
	"inside_prop": "",
	"boxed": false,
	"soft": false,
	"life": 3,
	"hit_cooldown": 0.0,
	"rations": 0,
	"yarn": 2,
	"meow_cooldown": 0.0,
	"sense_timer": 0.0,
	"sense_cooldown": 0.0,
}

var backpack := { "rect": Rect2(166, 458, 54, 42), "taken": false }
var panel := { "rect": Rect2(1126, 236, 78, 62), "done": false }
var exit_zone := Rect2(1160, 856, 122, 54)
var rations := [{ "pos": Vector2(276, 780), "taken": false }, { "pos": Vector2(990, 760), "taken": false }]
var yarn_pickups := [{ "pos": Vector2(542, 174), "taken": false }]
var noises := []
var yarns := []
var paw_prints := []
var bullets := []
var player_start := Vector2.ZERO

var camera: Camera2D
var hud: Label
var notice_label: Label
var notice_text := "INFILTRATE: recover your gear"
var notice_timer := 2.5
var mission_time := 0.0
var alert := 0.0
var system_down := false
var won := false
var game_over := false
var paused := false
var footstep_timer := 0.0
var restart_armed := false
var player_anim_time := 0.0
var guard_anim_time := 0.0

func _ready() -> void:
	RenderingServer.set_default_clear_color(Color("#071119"))
	_load_textures()
	_load_layout_from_scene()
	player.pos = player_start
	guards = _base_guards()
	if Engine.is_editor_hint():
		queue_redraw()
		return
	_set_authoring_nodes_visible(false)
	_create_camera()
	_create_hud()
	reset_game()
	set_process(true)

func _load_textures() -> void:
	dock_base = _load_png("res://assets/maps/dock-village/dock-village-base.png")
	player_walk = _load_png("res://assets/player-walk.png")
	enemy_walk = _load_png("res://assets/enemy-walk.png")
	for key in prop_texture_paths:
		prop_textures[key] = _load_png(prop_texture_paths[key])

func _load_png(path: String) -> Texture2D:
	var image := Image.new()
	var err := image.load(ProjectSettings.globalize_path(path))
	if err != OK:
		push_warning("Could not load image: %s" % path)
		return null
	return ImageTexture.create_from_image(image)

func _map_point(point: Vector2) -> Vector2:
	return Vector2(point.x * gameplay_scale.x, point.y * gameplay_scale.y) + gameplay_offset

func _unmap_point(point: Vector2) -> Vector2:
	return Vector2((point.x - gameplay_offset.x) / gameplay_scale.x, (point.y - gameplay_offset.y) / gameplay_scale.y)

func _map_rect(rect: Rect2) -> Rect2:
	var pos := _map_point(rect.position)
	var size := Vector2(rect.size.x * gameplay_scale.x, rect.size.y * gameplay_scale.y)
	return Rect2(pos, size)

func _unmap_rect(rect: Rect2) -> Rect2:
	var pos := _unmap_point(rect.position)
	var size := Vector2(rect.size.x / gameplay_scale.x, rect.size.y / gameplay_scale.y)
	return Rect2(pos, size)

func _map_radius_scale() -> float:
	return (absf(gameplay_scale.x) + absf(gameplay_scale.y)) * 0.5

func _load_layout_from_scene() -> void:
	layout_from_nodes = has_node("Props") or has_node("Guards") or has_node("Collision") or has_node("WalkBounds")
	if not layout_from_nodes:
		return
	_load_props_from_nodes()
	_load_guards_from_nodes()
	_load_collision_from_nodes()
	_load_walk_bounds_from_nodes()
	_load_hiding_from_nodes()
	_load_objectives_from_nodes()

func _set_authoring_nodes_visible(visible: bool) -> void:
	for path in ["Props", "Guards", "Collision", "WalkBounds", "HidingZones", "Objectives"]:
		var node := get_node_or_null(path)
		if node is CanvasItem:
			node.visible = visible

func _load_props_from_nodes() -> void:
	var container := get_node_or_null("Props")
	if not container:
		return
	props.clear()
	for child in container.get_children():
		if not child is Sprite2D:
			continue
		var size: Vector2 = child.get("prop_size") if child.get("prop_size") != null else Vector2(64, 64)
		var source_rect := _unmap_rect(Rect2(child.position, size))
		props.append({
			"id": str(child.get("prop_id") if child.get("prop_id") != null else child.name),
			"imageKey": str(child.get("image_key") if child.get("image_key") != null else ""),
			"hideable": bool(child.get("hideable") if child.get("hideable") != null else _default_prop_hideable(str(child.get("image_key") if child.get("image_key") != null else ""))),
			"x": source_rect.position.x,
			"y": source_rect.position.y,
			"w": source_rect.size.x,
			"h": source_rect.size.y,
			"sortY": source_rect.position.y,
			"fallback": Color("#77683e"),
		})

func _default_prop_hideable(image_key: String) -> bool:
	return image_key != "dockLanternPost" and image_key != "dockHangingLantern"

func _load_guards_from_nodes() -> void:
	var container := get_node_or_null("Guards")
	if not container:
		return
	guard_layout_nodes.clear()
	for child in container.get_children():
		if child is Node2D:
			guard_layout_nodes.append(_static_guard(
				str(child.get("guard_id") if child.get("guard_id") != null else child.name),
				child.position,
				child.get("facing") if child.get("facing") != null else Vector2.RIGHT,
				float(child.get("sight_range") if child.get("sight_range") != null else 245.0),
				float(child.get("sight_spread") if child.get("sight_spread") != null else 0.52),
				float(child.get("dark_range_factor") if child.get("dark_range_factor") != null else 0.38)
			))

func _load_collision_from_nodes() -> void:
	walls.clear()
	_load_prop_blockers_from_nodes()
	var container := get_node_or_null("Collision")
	if not container:
		return
	for body in container.get_children():
		if not body is Node2D:
			continue
		for shape_node in body.get_children():
			_load_wall_shape(shape_node)

func _load_prop_blockers_from_nodes() -> void:
	var container := get_node_or_null("Props")
	if not container:
		return
	for prop_node in container.get_children():
		for shape_node in prop_node.get_children():
			_load_wall_shape(shape_node)

func _load_wall_shape(shape_node: Node) -> void:
	if shape_node is CollisionShape2D and shape_node.shape is RectangleShape2D:
		var size: Vector2 = shape_node.shape.size * shape_node.global_scale.abs()
		var rect := Rect2(shape_node.global_position - size * 0.5, size)
		walls.append(_unmap_rect(rect))

func _load_walk_bounds_from_nodes() -> void:
	var container := get_node_or_null("WalkBounds")
	if not container:
		return
	walk_bounds.clear()
	for area in container.get_children():
		if not area is Node2D:
			continue
		for shape_node in area.get_children():
			if shape_node is CollisionShape2D and shape_node.shape is RectangleShape2D:
				var rect := Rect2(area.position + shape_node.position - shape_node.shape.size * 0.5, shape_node.shape.size)
				var source := _unmap_rect(rect)
				walk_bounds.append({ "id": area.name, "type": "rect", "x": source.position.x, "y": source.position.y, "w": source.size.x, "h": source.size.y })
			elif shape_node is CollisionPolygon2D:
				var points := []
				for point in shape_node.polygon:
					var source_point := _unmap_point(area.position + shape_node.position + point)
					points.append([source_point.x, source_point.y])
				walk_bounds.append({ "id": area.name, "type": "polygon", "points": points })

func _load_hiding_from_nodes() -> void:
	var container := get_node_or_null("HidingZones")
	if not container:
		return
	hiding.clear()
	for area in container.get_children():
		if not area is Node2D:
			continue
		for shape_node in area.get_children():
			if shape_node is CollisionShape2D and shape_node.shape is RectangleShape2D:
				var rect := Rect2(area.position + shape_node.position - shape_node.shape.size * 0.5, shape_node.shape.size)
				hiding.append(_unmap_rect(rect))

func _load_objectives_from_nodes() -> void:
	var container := get_node_or_null("Objectives")
	if not container:
		return
	rations.clear()
	yarn_pickups.clear()
	for area in container.get_children():
		if not area is Node2D:
			continue
		var zone_type := str(area.get("zone_type") if area.get("zone_type") != null else area.name).to_lower()
		var rect := _area_rect(area)
		if zone_type == "backpack":
			backpack.rect = rect
			backpack.taken = false
		elif zone_type == "generator":
			panel.rect = rect
			panel.done = false
		elif zone_type == "exit":
			exit_zone = rect
		elif zone_type == "ration":
			rations.append({ "pos": area.position, "taken": false })
		elif zone_type == "yarn":
			yarn_pickups.append({ "pos": area.position, "taken": false })
		elif zone_type == "player_start":
			player_start = area.position
	if player_start == Vector2.ZERO:
		player_start = _map_point(Vector2(118, 872))

func _area_rect(area: Node2D) -> Rect2:
	for shape_node in area.get_children():
		if shape_node is CollisionShape2D and shape_node.shape is RectangleShape2D:
			return Rect2(area.position + shape_node.position - shape_node.shape.size * 0.5, shape_node.shape.size)
	return Rect2(area.position - Vector2(16, 16), Vector2(32, 32))

func _create_camera() -> void:
	camera = Camera2D.new()
	camera.name = "Camera2D"
	camera.zoom = Vector2(1.5, 1.5)
	camera.position = player.pos
	camera.enabled = true
	add_child(camera)

func _create_hud() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	hud = Label.new()
	hud.position = Vector2(16, 14)
	hud.add_theme_color_override("font_color", Color("#d7f7ef"))
	hud.add_theme_color_override("font_shadow_color", Color("#061014"))
	hud.add_theme_constant_override("shadow_offset_x", 2)
	hud.add_theme_constant_override("shadow_offset_y", 2)
	layer.add_child(hud)
	notice_label = Label.new()
	notice_label.position = Vector2(16, 594)
	notice_label.add_theme_color_override("font_color", Color("#ffd65a"))
	notice_label.add_theme_color_override("font_shadow_color", Color("#061014"))
	notice_label.add_theme_constant_override("shadow_offset_x", 2)
	notice_label.add_theme_constant_override("shadow_offset_y", 2)
	layer.add_child(notice_label)

func reset_game() -> void:
	_load_layout_from_scene()
	_rebuild_guard_nav()
	guards = _base_guards()
	player.pos = player_start
	player.facing = Vector2.RIGHT
	player.moving = false
	player.gear = false
	player.hidden = false
	player.inside_prop = ""
	player.life = 3
	player.hit_cooldown = 0.0
	player.rations = 0
	player.yarn = 2
	player.meow_cooldown = 0.0
	player.sense_timer = 0.0
	player.sense_cooldown = 0.0
	backpack.taken = false
	panel.done = false
	system_down = false
	won = false
	game_over = false
	paused = false
	alert = 0.0
	mission_time = 0.0
	player_anim_time = 0.0
	guard_anim_time = 0.0
	noises.clear()
	yarns.clear()
	paw_prints.clear()
	bullets.clear()
	for ration in rations:
		ration.taken = false
	for pickup in yarn_pickups:
		pickup.taken = false
	notice("INFILTRATE: recover your gear", 2.4)

func _base_guards() -> Array:
	if layout_from_nodes and guard_layout_nodes.size() > 0:
		return guard_layout_nodes.duplicate(true)
	return [
		_static_guard("left-sentry", _map_point(Vector2(326, 834)), Vector2(-0.92, 0.38), 250, 0.58, 0.42),
		_static_guard("upper-sentry", _map_point(Vector2(804, 334)), Vector2(0.38, 0.92), 285, 0.5, 0.42),
		_static_guard("right-top-sentry", _map_point(Vector2(1322, 168)), Vector2(0.98, 0.18), 280, 0.54, 0.34),
		_static_guard("generator-sentry", _map_point(Vector2(1570, 470)), Vector2(-0.22, -1.0), 260, 0.52, 0.32),
		_static_guard("south-left-sentry", _map_point(Vector2(1260, 1096)), Vector2(-0.8, 0.58), 300, 0.62, 0.2),
		_static_guard("south-center-sentry", _map_point(Vector2(1352, 1088)), Vector2(0.05, 1.0), 330, 0.6, 0.18),
		_static_guard("south-right-sentry", _map_point(Vector2(1510, 1096)), Vector2(0.7, 0.72), 310, 0.62, 0.2),
	]

func _static_guard(id: String, pos: Vector2, dir: Vector2, range: float, spread: float, dark_factor: float) -> Dictionary:
	return {
		"id": id,
		"pos": pos,
		"dir": dir.normalized(),
		"home_dir": dir.normalized(),
		"home_pos": pos,
		"range": range,
		"spread": spread,
			"dark_factor": dark_factor,
			"investigate": 0.0,
			"investigate_pos": pos,
			"state": "watch",
			"suspicion": 0.0,
			"sleep_timer": 0.0,
			"dead": false,
			"shot_cooldown": 0.0,
			"patrol_timer": 0.0,
			"patrol_step": 0,
			"patrol_target": pos,
		}

func _process(delta: float) -> void:
	if Engine.is_editor_hint():
		queue_redraw()
		return
	if Input.is_action_just_pressed("pause"):
		paused = not paused
		notice("PAUSED" if paused else "MISSION RESUMED", 0.8)
	if Input.is_action_just_pressed("restart"):
		if restart_armed or won or game_over:
			restart_armed = false
			reset_game()
		else:
			restart_armed = true
			notice("PRESS R AGAIN TO RESTART", 1.5)
	if paused:
		_update_hud()
		queue_redraw()
		return
	if won or game_over:
		_update_hud()
		queue_redraw()
		return

	mission_time += delta
	player_anim_time += delta
	guard_anim_time += delta
	_update_timers(delta)
	_handle_actions()
	_move_player(delta)
	_update_yarn(delta)
	_update_noises(delta)
	_update_guards(delta)
	_update_bullets(delta)
	_update_camera(delta)
	_update_hud()
	queue_redraw()

func _update_timers(delta: float) -> void:
	notice_timer = maxf(0.0, notice_timer - delta)
	alert = maxf(0.0, alert - delta * 0.22)
	player.meow_cooldown = maxf(0.0, player.meow_cooldown - delta)
	player.hit_cooldown = maxf(0.0, player.hit_cooldown - delta)
	player.sense_timer = maxf(0.0, player.sense_timer - delta)
	player.sense_cooldown = maxf(0.0, player.sense_cooldown - delta)
	for i in range(paw_prints.size() - 1, -1, -1):
		paw_prints[i].ttl -= delta
		if paw_prints[i].ttl <= 0.0:
			paw_prints.remove_at(i)

func _handle_actions() -> void:
	if Input.is_action_just_pressed("interact"):
		interact()
	if Input.is_action_just_pressed("meow"):
		emit_meow()
	if Input.is_action_just_pressed("yarn"):
		throw_yarn()
	if Input.is_action_just_pressed("whisker_sense"):
		if player.sense_cooldown <= 0.0:
			player.sense_timer = 2.8
			player.sense_cooldown = 9.5
			notice("WHISKER SENSE: READ THE ROOM", 0.9)
		else:
			notice("WHISKERS RECALIBRATING %ds" % ceili(player.sense_cooldown), 0.7)
	if Input.is_action_just_pressed("use_ration"):
		if player.rations > 0 and player.life < 3:
			player.rations -= 1
			player.life += 1
			notice("TUNA RATION USED", 1.0)
		elif player.rations <= 0:
			notice("NO RATIONS", 0.75)
		else:
			notice("ALREADY STEADY", 0.75)

func _move_player(delta: float) -> void:
	if player.inside_prop != "":
		player.hidden = true
		player.moving = false
		return
	var move := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	player.soft = Input.is_action_pressed("soft_walk")
	player.boxed = Input.is_action_pressed("box_cover")
	player.moving = move.length() > 0.01
	if move.length() <= 0.01:
		return
	player.facing = move.normalized()
	var speed := 138.0
	if player.boxed:
		speed = 54.0
	elif player.soft:
		speed = 88.0
	var next_x = player.pos + Vector2(player.facing.x * speed * delta, 0)
	var next_y = player.pos + Vector2(0, player.facing.y * speed * delta)
	if not movement_blocked(next_x, PLAYER_RADIUS):
		player.pos.x = next_x.x
	if not movement_blocked(next_y, PLAYER_RADIUS):
		player.pos.y = next_y.y
	if not player.soft and not player.hidden and not player.boxed:
		footstep_timer -= delta
		if footstep_timer <= 0.0:
			make_noise(player.pos, 88, 0.28, "TAP", "step")
			paw_prints.append({ "pos": player.pos - player.facing * 10.0, "ttl": 2.2, "max_ttl": 2.2 })
			footstep_timer = 0.33
	elif player.boxed:
		footstep_timer -= delta
		if footstep_timer <= 0.0:
			make_noise(player.pos, 54, 0.26, "RUSTLE", "box")
			footstep_timer = 0.58

func interact() -> void:
	if player.inside_prop != "":
		var prop := _prop_by_id(player.inside_prop)
		player.pos = _nearest_exit_for_prop(prop)
		player.inside_prop = ""
		player.hidden = false
		notice("COVER EXITED", 0.8)
		return
	if _try_guard_interaction():
		return
	for prop in props:
		if not bool(prop.get("hideable", true)):
			continue
		var hide_rect := _prop_hide_rect(prop)
		if _near_rect(hide_rect, 38):
			player.inside_prop = prop.id
			player.pos = hide_rect.get_center()
			player.hidden = true
			player.boxed = false
			notice("HIDDEN INSIDE %s" % prop.id.to_upper().replace("-", " "), 1.0)
			return
	if not backpack.taken and _near_rect(backpack.rect, 36):
		backpack.taken = true
		player.gear = true
		notice("GEAR RECOVERED: FIND THE GENERATOR", 1.45)
		return
	if not panel.done and _near_rect(panel.rect, 32):
		panel.done = true
		system_down = true
		alert = maxf(0.0, alert - 1.0)
		make_noise(panel.rect.get_center(), 124, 0.5, "SCRATCH", "scratch")
		notice("GENERATOR CLAWED: LIGHTS OUT", 2.2)
		return
	if _near_rect(exit_zone, 38):
		if not player.gear:
			notice("GEAR STILL ON THE DOCK", 1.0)
		elif not system_down:
			notice("LIGHTS STILL COVER THE EXIT", 1.0)
		else:
			complete_mission()
		return
	for ration in rations:
		if not ration.taken and player.pos.distance_to(ration.pos) < 42:
			if player.rations >= 3:
				notice("RATION POUCH FULL", 0.9)
				return
			ration.taken = true
			player.rations += 1
			notice("TUNA RATION STORED", 1.2)
			return
	for pickup in yarn_pickups:
		if not pickup.taken and player.pos.distance_to(pickup.pos) < 42:
			if player.yarn >= 3:
				notice("YARN STASH FULL", 0.9)
				return
			pickup.taken = true
			player.yarn += 1
			notice("YARN BALL ACQUIRED", 1.05)
			return
		notice("NOTHING TO SCRATCH HERE", 0.65)

func _try_guard_interaction() -> bool:
	var guard := _nearest_interactable_guard()
	if guard.is_empty():
		return false
	if bool(guard.dead):
		return false
	if guard.state == "sleep":
		guard.dead = true
		guard.state = "dead"
		guard.sleep_timer = 0.0
		guard.suspicion = 0.0
		notice("TARGET SILENCED", 1.0)
		return true
	guard.state = "sleep"
	guard.sleep_timer = GUARD_SLEEP_SECONDS
	guard.suspicion = 0.0
	guard.investigate = 0.0
	guard.shot_cooldown = 0.0
	notice("GUARD KNOCKED OUT", 1.0)
	return true

func _nearest_interactable_guard() -> Dictionary:
	var best := {}
	var best_dist := TAKEDOWN_RANGE
	for guard in guards:
		if bool(guard.dead):
			continue
		var dist: float = player.pos.distance_to(guard.pos)
		if dist > best_dist:
			continue
		if guard.state != "sleep" and not _behind_guard(guard):
			continue
		best = guard
		best_dist = dist
	return best

func _behind_guard(guard: Dictionary) -> bool:
	var guard_to_player: Vector2 = (player.pos - guard.pos).normalized()
	var player_to_guard: Vector2 = (guard.pos - player.pos).normalized()
	return guard.dir.dot(guard_to_player) < -TAKEDOWN_BACK_DOT and player.facing.dot(player_to_guard) > 0.15

func emit_meow() -> void:
	if player.meow_cooldown > 0.0:
		return
	make_noise(player.pos, 330, 1.35, "MREOW", "meow")
	player.meow_cooldown = 2.4 if alert > 0.0 else 3.0
	notice("LONG-RANGE DECOY MEOW", 1.0)

func throw_yarn() -> void:
	if player.yarn <= 0:
		notice("NO YARN LEFT", 0.75)
		return
	player.yarn -= 1
	yarns.append({
		"pos": player.pos + player.facing * 18.0,
		"vel": player.facing * YARN_SPEED,
		"traveled": 0.0,
		"landed": false,
		"ttl": 2.4,
		"max_ttl": 2.4,
	})
	notice("YARN BALL TOSSED", 0.9)

func _update_yarn(delta: float) -> void:
	for i in range(yarns.size() - 1, -1, -1):
		var yarn = yarns[i]
		if not yarn.landed:
			var step = yarn.vel * delta
			yarn.pos += step
			yarn.traveled += step.length()
			if yarn.traveled >= YARN_RANGE or movement_blocked(yarn.pos, 7):
				yarn.landed = true
				yarn.ttl = 1.6
				yarn.max_ttl = 1.6
				make_noise(yarn.pos, 190, 0.45, "YARN", "yarn")
		else:
			yarn.ttl -= delta
		yarns[i] = yarn
		if yarn.ttl <= 0.0:
			yarns.remove_at(i)

func make_noise(pos: Vector2, radius: float, ttl: float, label: String, kind: String) -> void:
	noises.append({ "pos": pos, "radius": radius, "ttl": ttl, "max_ttl": ttl, "label": label, "kind": kind, "fresh": true })

func _update_noises(delta: float) -> void:
	for i in range(noises.size() - 1, -1, -1):
		var sound = noises[i]
		if sound.fresh:
			for guard in guards:
				if bool(guard.dead) or guard.state == "sleep":
					continue
				var dist: float = guard.pos.distance_to(sound.pos)
				var muffled := 1.0 if has_line_of_sight(sound.pos, guard.pos) else 0.55
				if dist <= sound.radius * muffled:
					guard.dir = (sound.pos - guard.pos).normalized()
					guard.investigate = 1.2 if sound.kind == "yarn" else 0.75
					guard.investigate_pos = sound.pos
					guard.state = "investigate"
					guard.suspicion = maxf(guard.suspicion, 0.34 if sound.kind == "meow" else 0.16)
			sound.fresh = false
		sound.ttl -= delta
		noises[i] = sound
		if sound.ttl <= 0.0:
			noises.remove_at(i)

func _update_guards(delta: float) -> void:
	for guard in guards:
		if bool(guard.dead):
			continue
		if guard.state == "sleep":
			guard.sleep_timer = maxf(0.0, guard.sleep_timer - delta)
			if guard.sleep_timer <= 0.0:
				guard.state = "watch"
				guard.suspicion = 0.0
				notice("A GUARD WOKE UP", 0.8)
			continue
		guard.shot_cooldown = maxf(0.0, guard.shot_cooldown - delta)
		var sees_player := _guard_sees_player(guard)
		if sees_player:
			guard.investigate_pos = player.pos
			guard.dir = (player.pos - guard.pos).normalized()
			guard.suspicion = minf(1.0, guard.suspicion + delta * _suspicion_gain_for_player())
			alert = minf(4.0, alert + delta * (0.35 if guard.suspicion < GUARD_CHASE_SUSPICION else 0.8))
			if guard.suspicion >= GUARD_CHASE_SUSPICION:
				guard.state = "chase"
			else:
				guard.state = "investigate"
				guard.investigate = maxf(guard.investigate, 0.65)
		elif guard.state == "chase":
			guard.investigate = maxf(guard.investigate, 1.6)
			guard.state = "investigate"
		if guard.state == "chase":
			_move_guard_toward(guard, player.pos, GUARD_CHASE_SPEED, delta)
			_guard_try_shoot(guard)
			if guard.pos.distance_to(player.pos) <= GUARD_CONTACT_RANGE and player.hit_cooldown <= 0.0:
				_player_hit()
				guard.suspicion = 0.45
		elif guard.investigate > 0.0:
			guard.investigate = maxf(0.0, guard.investigate - delta)
			_move_guard_toward(guard, guard.investigate_pos, GUARD_INVESTIGATE_SPEED, delta)
			if guard.pos.distance_to(guard.investigate_pos) < 12.0:
				guard.investigate = minf(guard.investigate, 0.35)
			guard.suspicion = maxf(0.0, guard.suspicion - delta * 0.08)
		else:
			guard.state = "watch"
			guard.dir = guard.dir.lerp(guard.home_dir, delta * 2.0).normalized()
			guard.suspicion = maxf(0.0, guard.suspicion - delta * 0.18)
			_update_guard_patrol(guard, delta)

func _guard_try_shoot(guard: Dictionary) -> void:
	if guard.shot_cooldown > 0.0:
		return
	var to_player: Vector2 = player.pos - guard.pos
	if to_player.length() > GUARD_SHOT_RANGE:
		return
	if not has_line_of_sight(guard.pos, player.pos):
		return
	guard.shot_cooldown = GUARD_SHOT_COOLDOWN
	bullets.append({
		"pos": guard.pos + guard.dir * 18.0,
		"vel": to_player.normalized() * BULLET_SPEED,
		"ttl": 1.0,
	})
	make_noise(guard.pos, 140, 0.22, "SHOT", "shot")

func _update_bullets(delta: float) -> void:
	for i in range(bullets.size() - 1, -1, -1):
		var bullet = bullets[i]
		var step: Vector2 = bullet.vel * delta
		bullet.pos += step
		bullet.ttl -= delta
		if bullet.pos.distance_to(player.pos) <= PLAYER_RADIUS + 4.0 and player.hit_cooldown <= 0.0:
			_player_hit()
			bullets.remove_at(i)
			continue
		if bullet.ttl <= 0.0 or movement_blocked(bullet.pos, 3.0):
			bullets.remove_at(i)
			continue
		bullets[i] = bullet

func _suspicion_gain_for_player() -> float:
	if player.boxed:
		return 0.38
	if player.soft:
		return 0.62
	return 0.78

func _update_guard_patrol(guard: Dictionary, delta: float) -> void:
	guard.patrol_timer -= delta
	if guard.patrol_timer <= 0.0 or guard.pos.distance_to(guard.patrol_target) < 8.0:
		guard.patrol_target = _next_patrol_target(guard)
		guard.patrol_timer = 1.6
	if guard.pos.distance_to(guard.patrol_target) > 10.0:
		_move_guard_toward(guard, guard.patrol_target, GUARD_PATROL_SPEED, delta)

func _next_patrol_target(guard: Dictionary) -> Vector2:
	var forward: Vector2 = guard.home_dir
	var side := Vector2(-forward.y, forward.x)
	var directions := [forward, side, -forward, -side]
	var seed := absi(str(guard.id).hash())
	guard.patrol_step = int(guard.patrol_step) + 1
	var start_index := (int(guard.patrol_step) + seed) % directions.size()
	var radius := 28.0 + float(seed % 22)
	for attempt in directions.size():
		var dir: Vector2 = directions[(start_index + attempt) % directions.size()]
		var candidate: Vector2 = guard.home_pos + dir.normalized() * radius
		if not movement_blocked(candidate, GUARD_RADIUS):
			return candidate
	return guard.home_pos

func _rebuild_guard_nav() -> void:
	guard_nav.clear()
	guard_nav_cells.clear()
	var cols := ceili(DOCK_W / NAV_CELL_SIZE)
	var rows := ceili(DOCK_H / NAV_CELL_SIZE)
	for y in range(rows):
		for x in range(cols):
			var cell := Vector2i(x, y)
			var pos := Vector2((float(x) + 0.5) * NAV_CELL_SIZE, (float(y) + 0.5) * NAV_CELL_SIZE)
			if not movement_blocked(pos, GUARD_RADIUS):
				var id := _nav_id(cell)
				guard_nav.add_point(id, pos)
				guard_nav_cells[cell] = id
	for cell in guard_nav_cells.keys():
		var id: int = guard_nav_cells[cell]
		for offset in [Vector2i(1, 0), Vector2i(0, 1)]:
			var other: Vector2i = cell + offset
			if guard_nav_cells.has(other):
				var other_id: int = guard_nav_cells[other]
				var midpoint := (guard_nav.get_point_position(id) + guard_nav.get_point_position(other_id)) * 0.5
				if not movement_blocked(midpoint, GUARD_RADIUS):
					guard_nav.connect_points(id, other_id)

func _nav_id(cell: Vector2i) -> int:
	return cell.y * 10000 + cell.x

func _next_guard_path_point(from_pos: Vector2, target: Vector2) -> Vector2:
	if guard_nav.get_point_count() == 0:
		return target
	var from_id := guard_nav.get_closest_point(from_pos)
	var target_id := guard_nav.get_closest_point(target)
	if from_id < 0 or target_id < 0:
		return target
	var path := guard_nav.get_point_path(from_id, target_id)
	if path.size() >= 2:
		return path[1]
	if path.size() == 1:
		return path[0]
	return target

func _move_guard_toward(guard: Dictionary, target: Vector2, speed: float, delta: float) -> void:
	var waypoint: Vector2 = target
	if guard.pos.distance_to(target) > NAV_CELL_SIZE and (not _line_stays_walkable(guard.pos, target) or not has_line_of_sight(guard.pos, target)):
		waypoint = _next_guard_path_point(guard.pos, target)
	var to_target: Vector2 = waypoint - guard.pos
	if to_target.length() < 4.0:
		return
	var dir: Vector2 = to_target.normalized()
	guard.dir = dir
	var next_x: Vector2 = guard.pos + Vector2(dir.x * speed * delta, 0)
	var next_y: Vector2 = guard.pos + Vector2(0, dir.y * speed * delta)
	if not movement_blocked(next_x, GUARD_RADIUS):
		guard.pos.x = next_x.x
	if not movement_blocked(next_y, GUARD_RADIUS):
		guard.pos.y = next_y.y

func _line_stays_walkable(a: Vector2, b: Vector2) -> bool:
	var distance: float = a.distance_to(b)
	var steps: int = maxi(1, ceili(distance / (NAV_CELL_SIZE * 0.5)))
	for i in range(1, steps + 1):
		var t := float(i) / float(steps)
		if movement_blocked(a.lerp(b, t), GUARD_RADIUS):
			return false
	return true

func _guard_sees_player(guard: Dictionary) -> bool:
	if player.hidden or player.inside_prop != "":
		return false
	var to_player = player.pos - guard.pos
	var range = guard.range * (guard.dark_factor if system_down else 1.0)
	if to_player.length() > range:
		return false
	if absf(guard.dir.angle_to(to_player.normalized())) > guard.spread:
		return false
	return has_line_of_sight(guard.pos, player.pos)

func _player_hit() -> void:
	if player.hit_cooldown > 0.0:
		return
	player.life -= 1
	player.hit_cooldown = PLAYER_HIT_GRACE
	alert = 3.0
	notice("CAUGHT: BREAK LINE OF SIGHT", 1.1)
	if player.life <= 0:
		game_over = true
		notice("MISSION FAILED: PRESS R TO RETRY", 99.0)

func complete_mission() -> void:
	won = true
	var rank := "S"
	if alert > 2.5 or player.life <= 1:
		rank = "C"
	elif alert > 0.5 or player.life == 2:
		rank = "A"
	notice("EXTRACTION COMPLETE - RANK %s - %s" % [rank, _format_time(mission_time)], 99.0)

func _update_camera(delta: float) -> void:
	var viewport_size := get_viewport_rect().size / camera.zoom
	var target := Vector2(
		clampf(player.pos.x, viewport_size.x * 0.5, DOCK_W - viewport_size.x * 0.5),
		clampf(player.pos.y, viewport_size.y * 0.5, DOCK_H - viewport_size.y * 0.5)
	)
	camera.position = camera.position.lerp(target, minf(1.0, delta * 8.0))

func movement_blocked(pos: Vector2, radius: float) -> bool:
	if pos.x < radius or pos.y < radius or pos.x > DOCK_W - radius or pos.y > DOCK_H - radius:
		return true
	if not _point_in_walk_bounds(pos):
		return true
	for wall in walls:
		if _circle_hits_rect(pos, radius, _map_rect(wall)):
			return true
	return false

func _point_in_walk_bounds(pos: Vector2) -> bool:
	for bound in walk_bounds:
		if bound.type == "rect":
			if _map_rect(Rect2(bound.x, bound.y, bound.w, bound.h)).has_point(pos):
				return true
		else:
			var poly := PackedVector2Array()
			for point in bound.points:
				poly.append(_map_point(Vector2(point[0], point[1])))
			if Geometry2D.is_point_in_polygon(pos, poly):
				return true
	return false

func _circle_hits_rect(pos: Vector2, radius: float, rect: Rect2) -> bool:
	var closest := Vector2(clampf(pos.x, rect.position.x, rect.end.x), clampf(pos.y, rect.position.y, rect.end.y))
	return pos.distance_to(closest) <= radius

func has_line_of_sight(a: Vector2, b: Vector2) -> bool:
	for wall in walls:
		var mapped_wall := _map_rect(wall)
		var points := [mapped_wall.position, Vector2(mapped_wall.end.x, mapped_wall.position.y), mapped_wall.end, Vector2(mapped_wall.position.x, mapped_wall.end.y)]
		for i in range(points.size()):
			if Geometry2D.segment_intersects_segment(a, b, points[i], points[(i + 1) % points.size()]) != null:
				return false
	return true

func _near_rect(rect: Rect2, distance: float) -> bool:
	var inflated := rect.grow(distance)
	return inflated.has_point(player.pos)

func _prop_hide_rect(prop: Dictionary) -> Rect2:
	return _map_rect(Rect2(prop.x, prop.y, prop.w, prop.h))

func _prop_by_id(id: String) -> Dictionary:
	for prop in props:
		if prop.id == id:
			return prop
	return {}

func _nearest_exit_for_prop(prop: Dictionary) -> Vector2:
	if prop.is_empty():
		return player.pos
	var rect := _prop_hide_rect(prop)
	var candidates := [
		Vector2(rect.get_center().x, rect.position.y - PLAYER_RADIUS - 10),
		Vector2(rect.get_center().x, rect.end.y + PLAYER_RADIUS + 10),
		Vector2(rect.position.x - PLAYER_RADIUS - 10, rect.get_center().y),
		Vector2(rect.end.x + PLAYER_RADIUS + 10, rect.get_center().y),
	]
	for candidate in candidates:
		if not movement_blocked(candidate, PLAYER_RADIUS):
			return candidate
	return player.pos

func notice(text: String, seconds: float) -> void:
	notice_text = text
	notice_timer = seconds

func _update_hud() -> void:
	var alert_label := "CLEAR" if alert <= 0.1 else "ALERT %.1f" % alert
	var gear_label := "GEAR" if player.gear else "LOST"
	var lights := "OFFLINE" if system_down else "ONLINE"
	var hidden := " HIDDEN" if player.hidden else ""
	hud.text = "Whisker Intrusion  %s\nGear: %s  Lights: %s  Life: %d  Yarn: %d  Rations: %d  Time: %s%s" % [
		alert_label,
		gear_label,
		lights,
		player.life,
		player.yarn,
		player.rations,
		_format_time(mission_time),
		hidden,
	]
	notice_label.text = notice_text if notice_timer > 0.0 else ""

func _format_time(seconds: float) -> String:
	return "%d:%02d" % [floori(seconds / 60.0), floori(fmod(seconds, 60.0))]

func _draw() -> void:
	if dock_base and not has_node("MapArt"):
		draw_texture_rect(dock_base, Rect2(0, 0, DOCK_W, DOCK_H), false)
	elif not has_node("MapArt"):
		draw_rect(Rect2(0, 0, DOCK_W, DOCK_H), Color("#071119"), true)
	if Engine.is_editor_hint() and show_editor_guides:
		_draw_editor_guides()
	for shadow in shadows:
		draw_rect(_map_rect(shadow), Color(0.02, 0.05, 0.06, 0.34), true)
	if not system_down:
		for light in light_pools:
			draw_circle(_map_point(Vector2(light.x, light.y)), light.radius * _map_radius_scale(), Color(1.0, 0.82, 0.35, light.alpha))
	for print in paw_prints:
		var alpha = print.ttl / print.max_ttl
		draw_circle(print.pos, 3.0, Color(0.95, 0.78, 0.4, alpha * 0.55))
	for rect in hiding:
		if player.sense_timer > 0.0 or Engine.is_editor_hint():
			var mapped_hiding := _map_rect(rect)
			draw_rect(mapped_hiding, Color(0.48, 0.84, 0.78, 0.18), true)
			draw_rect(mapped_hiding, Color(0.48, 0.84, 0.78, 0.55), false, 2.0)
		for sound in noises:
			var alpha = sound.ttl / sound.max_ttl
			draw_arc(sound.pos, sound.radius * (1.0 - alpha * 0.3), 0, TAU, 48, Color(0.48, 0.84, 0.78, alpha), 3.0)
		for bullet in bullets:
			draw_circle(bullet.pos, 3.0, Color("#ffd65a"))
		for yarn in yarns:
			draw_circle(yarn.pos, 6.0, Color("#7ed6c8"))
	if not Engine.is_editor_hint() or not has_node("Objectives"):
		_draw_pickups_and_objectives()
	if not Engine.is_editor_hint() or not has_node("Guards"):
		_draw_guards()
	if not Engine.is_editor_hint() or not has_node("Props"):
		_draw_props()
	_draw_player()

func _draw_editor_guides() -> void:
	for bound in walk_bounds:
		if bound.type == "rect":
			var rect := _map_rect(Rect2(bound.x, bound.y, bound.w, bound.h))
			draw_rect(rect, Color(0.25, 0.9, 0.65, 0.08), true)
			draw_rect(rect, Color(0.25, 0.9, 0.65, 0.28), false, 1.0)
		else:
			var poly := PackedVector2Array()
			for point in bound.points:
				poly.append(_map_point(Vector2(point[0], point[1])))
			draw_colored_polygon(poly, Color(0.25, 0.9, 0.65, 0.08))
			draw_polyline(poly + PackedVector2Array([poly[0]]), Color(0.25, 0.9, 0.65, 0.28), 1.0)
	for wall in walls:
		var mapped_wall := _map_rect(wall)
		draw_rect(mapped_wall, Color(1.0, 0.23, 0.23, 0.18), true)
		draw_rect(mapped_wall, Color(1.0, 0.23, 0.23, 0.48), false, 1.5)

func _draw_pickups_and_objectives() -> void:
	if not backpack.taken:
		draw_rect(backpack.rect, Color("#5d6b8b"), true)
		draw_rect(backpack.rect, Color("#d7f7ef"), false, 2.0)
	if not panel.done:
		draw_rect(panel.rect, Color("#8d5330"), true)
		draw_rect(panel.rect, Color("#ffd65a"), false, 2.0)
	draw_rect(exit_zone, Color(0.38, 0.84, 0.56, 0.16), true)
	draw_rect(exit_zone, Color(0.38, 0.84, 0.56, 0.65), false, 2.0)
	for ration in rations:
		if not ration.taken:
			draw_circle(ration.pos, 10.0, Color("#ffd65a"))
	for pickup in yarn_pickups:
		if not pickup.taken:
			draw_circle(pickup.pos, 9.0, Color("#7ed6c8"))

func _draw_guards() -> void:
	for guard in guards:
		if bool(guard.dead):
			_draw_guard_sprite(guard)
			continue
		var range = guard.range * (guard.dark_factor if system_down else 1.0)
		var left = guard.dir.rotated(-guard.spread) * range
		var right = guard.dir.rotated(guard.spread) * range
		var cone_alpha := 0.13
		if guard.state == "chase":
			cone_alpha = 0.34
		elif guard.suspicion > 0.5:
			cone_alpha = 0.24
		var color := Color(1.0, 0.84, 0.35, cone_alpha)
		draw_colored_polygon(PackedVector2Array([guard.pos, guard.pos + left, guard.pos + right]), color)
		_draw_guard_sprite(guard)
		draw_line(guard.pos, guard.pos + guard.dir * 28.0, Color("#ffd65a"), 3.0)
		if guard.suspicion > 0.05:
			draw_arc(guard.pos, 22.0, -PI * 0.5, -PI * 0.5 + TAU * guard.suspicion, 20, Color("#ff705d"), 3.0)
		if guard.state == "sleep":
			_draw_sleep_zs(guard)
		if player.sense_timer > 0.0 and (guard.state == "chase" or guard.state == "investigate"):
			_draw_guard_route(guard)

func _draw_guard_sprite(guard: Dictionary) -> void:
	var tint := Color.WHITE
	if bool(guard.dead):
		tint = Color("#b3262e")
	elif guard.state == "sleep":
		tint = Color("#7a8b80")
	elif guard.state == "chase":
		tint = Color("#ff8a76")
	elif guard.state == "investigate":
		tint = Color("#ffd65a")
	if enemy_walk:
		var row := _sprite_row_for_direction(guard.dir)
		var moving = guard.state == "chase" or guard.state == "investigate"
		var frame := _animation_frame(guard_anim_time, GUARD_FRAME_RATE, moving)
		var src := Rect2(frame * SPRITE_SIZE, row * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE)
		draw_texture_rect_region(enemy_walk, Rect2(guard.pos - Vector2(32, 44), Vector2(64, 64)), src, tint)
	else:
		draw_circle(guard.pos, GUARD_RADIUS, Color("#b33b3b") if guard.suspicion > 0.65 else Color("#7a8b80"))
	if bool(guard.dead):
		draw_circle(guard.pos + Vector2(10, 8), 15.0, Color(0.7, 0.0, 0.03, 0.55))

func _draw_sleep_zs(guard: Dictionary) -> void:
	var z_count := 1
	if guard.sleep_timer > 20.0:
		z_count = 3
	elif guard.sleep_timer > 10.0:
		z_count = 2
	for i in range(z_count):
		var pos: Vector2 = guard.pos + Vector2(14 + i * 10, -50 - i * 8)
		draw_string(ThemeDB.fallback_font, pos, "Z", HORIZONTAL_ALIGNMENT_LEFT, -1, 22 - i * 2, Color("#d7f7ef"))

func _draw_guard_route(guard: Dictionary) -> void:
	var target: Vector2 = player.pos if guard.state == "chase" else guard.investigate_pos
	var from_id := guard_nav.get_closest_point(guard.pos)
	var target_id := guard_nav.get_closest_point(target)
	if from_id < 0 or target_id < 0:
		return
	var path := guard_nav.get_point_path(from_id, target_id)
	if path.size() < 2:
		return
	draw_polyline(path, Color(1.0, 0.84, 0.35, 0.55), 2.0)

func _draw_props() -> void:
	var sorted := props.duplicate()
	sorted.sort_custom(func(a, b): return a.sortY < b.sortY)
	for prop in sorted:
		var rect := _map_rect(Rect2(prop.x, prop.y, prop.w, prop.h))
		var texture = prop_textures.get(prop.imageKey)
		if texture:
			draw_texture_rect(texture, rect, false)
		else:
			draw_rect(rect, prop.fallback, true)

func _draw_player() -> void:
	if player.inside_prop != "":
		draw_circle(player.pos, 9.0, Color(0.48, 0.84, 0.78, 0.45))
		return
	var tint := Color("#d7f7ef")
	if player.hit_cooldown > 0.0 and int(player.hit_cooldown * 12.0) % 2 == 0:
		tint = Color("#ff8a76")
	if player.boxed:
		tint = Color("#b8945b")
	elif player.soft:
		tint = Color("#7ed6c8")
	if player_walk:
		var row := _sprite_row_for_direction(player.facing)
		var frame := _animation_frame(player_anim_time, PLAYER_FRAME_RATE, player.moving)
		var src := Rect2(frame * SPRITE_SIZE, row * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE)
		draw_texture_rect_region(player_walk, Rect2(player.pos - Vector2(32, 42), Vector2(64, 64)), src, tint)
	else:
		draw_circle(player.pos, PLAYER_RADIUS, tint)
	draw_line(player.pos, player.pos + player.facing * 24.0, Color("#ffd65a"), 2.0)

func _sprite_row_for_direction(dir: Vector2) -> int:
	if absf(dir.x) > absf(dir.y):
		return 2 if dir.x > 0.0 else 1
	return 3 if dir.y < 0.0 else 0

func _animation_frame(time: float, rate: float, moving: bool) -> int:
	if not moving:
		return 0
	return int(floor(time * rate)) % 4
