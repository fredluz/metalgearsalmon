@tool
extends Node2D

const SPRITE_SIZE := 64.0
const ENEMY_WALK := preload("res://assets/enemy-walk.png")

@export var guard_id := ""
@export var facing := Vector2.RIGHT:
	set(value):
		facing = value.normalized() if value.length() > 0.001 else Vector2.RIGHT
		queue_redraw()
@export var sight_range := 245.0:
	set(value):
		sight_range = value
		queue_redraw()
@export var sight_spread := 0.52:
	set(value):
		sight_spread = value
		queue_redraw()
@export var dark_range_factor := 0.38

func _draw() -> void:
	var left := facing.rotated(-sight_spread) * sight_range
	var right := facing.rotated(sight_spread) * sight_range
	draw_colored_polygon(PackedVector2Array([Vector2.ZERO, left, right]), Color(1.0, 0.84, 0.35, 0.16))
	var src := Rect2(0, _sprite_row_for_direction(facing) * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE)
	draw_texture_rect_region(ENEMY_WALK, Rect2(Vector2(-32, -44), Vector2(64, 64)), src)
	draw_line(Vector2.ZERO, facing * 30.0, Color("#ffd65a"), 3.0)

func _sprite_row_for_direction(dir: Vector2) -> int:
	if absf(dir.x) > absf(dir.y):
		return 2 if dir.x > 0.0 else 1
	return 0 if dir.y > 0.0 else 3
