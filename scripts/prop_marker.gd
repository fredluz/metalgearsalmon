@tool
extends Sprite2D

@export var prop_id := ""
@export var image_key := ""
@export var hideable := true
@export var prop_size := Vector2(64, 64):
	set(value):
		prop_size = value
		queue_redraw()

func _ready() -> void:
	centered = false

func _draw() -> void:
	if not Engine.is_editor_hint():
		return
	draw_rect(Rect2(Vector2.ZERO, prop_size), Color(0.48, 0.84, 0.78, 0.18), false, 2.0)
	for child in get_children():
		if child is CollisionShape2D and child.shape is RectangleShape2D:
			var rect := Rect2(child.position - child.shape.size * 0.5, child.shape.size)
			draw_rect(rect, Color(1.0, 0.28, 0.2, 0.12), true)
			draw_rect(rect, Color(1.0, 0.45, 0.25, 0.8), false, 2.0)
