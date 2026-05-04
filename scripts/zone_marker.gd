@tool
extends Area2D

const SPRITE_SIZE := 64.0
const PLAYER_WALK := preload("res://assets/player-walk.png")

@export_enum("hiding", "backpack", "generator", "exit", "ration", "yarn", "walk", "player_start") var zone_type := "hiding"
@export var label := ""

func _ready() -> void:
	queue_redraw()

func _draw() -> void:
	if not Engine.is_editor_hint():
		return
	var color := _zone_color()
	var rect := _local_rect()
	draw_rect(rect, Color(color.r, color.g, color.b, 0.16), true)
	draw_rect(rect, Color(color.r, color.g, color.b, 0.75), false, 2.0)
	if zone_type == "player_start":
		var src := Rect2(0, 0, SPRITE_SIZE, SPRITE_SIZE)
		draw_texture_rect_region(PLAYER_WALK, Rect2(Vector2(-32, -42), Vector2(64, 64)), src)
		draw_line(Vector2(-18, 0), Vector2(18, 0), Color("#d7f7ef"), 2.0)
		draw_line(Vector2(0, -18), Vector2(0, 18), Color("#d7f7ef"), 2.0)
		draw_circle(Vector2.ZERO, 8.0, Color(0.48, 0.84, 0.78, 0.35))

func _local_rect() -> Rect2:
	for child in get_children():
		if child is CollisionShape2D and child.shape is RectangleShape2D:
			return Rect2(child.position - child.shape.size * 0.5, child.shape.size)
	return Rect2(Vector2(-14, -14), Vector2(28, 28))

func _zone_color() -> Color:
	match zone_type:
		"walk":
			return Color("#41e89c")
		"hiding":
			return Color("#7ed6c8")
		"backpack":
			return Color("#d7f7ef")
		"generator":
			return Color("#ffd65a")
		"exit":
			return Color("#62d989")
		"ration":
			return Color("#ffcc5c")
		"yarn":
			return Color("#7ed6c8")
		"player_start":
			return Color("#ffffff")
	return Color("#ffffff")
