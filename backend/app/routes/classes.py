from flask import Blueprint, jsonify, request

from app.data.store import store


classes_bp = Blueprint("classes", __name__)


@classes_bp.get("")
def list_classes():
    return jsonify(store.classes)


@classes_bp.post("")
def create_class():
    payload = request.get_json() or {}
    training_class = {
        "id": store.next_id("classes"),
        "name": payload.get("name", "新班级"),
        "level": payload.get("level", "入门"),
        "teacher": payload.get("teacher", "待分配"),
        "room": payload.get("room", "待分配"),
        "status": payload.get("status", "招生中"),
        "capacity": int(payload.get("capacity", 20)),
        "students": [],
    }
    store.classes.append(training_class)
    return jsonify(training_class), 201


@classes_bp.get("/<int:class_id>")
def get_class(class_id):
    training_class = next((item for item in store.classes if item["id"] == class_id), None)
    if not training_class:
        return jsonify({"message": "Class not found"}), 404
    return jsonify(training_class)


@classes_bp.post("/<int:class_id>/students")
def add_student(class_id):
    training_class = next((item for item in store.classes if item["id"] == class_id), None)
    if not training_class:
        return jsonify({"message": "Class not found"}), 404

    current_count = len(training_class["students"])
    capacity = training_class["capacity"]
    remaining = capacity - current_count
    if remaining <= 0:
        return jsonify({
            "message": f"班级容量已满，无法添加学员。当前 {current_count}/{capacity} 人",
            "remaining": 0,
            "current": current_count,
            "capacity": capacity
        }), 400

    payload = request.get_json() or {}
    student_ids = [student["id"] for item in store.classes for student in item["students"]]
    student = {
        "id": max(student_ids, default=0) + 1,
        "name": payload.get("name", "新学员"),
        "phone": payload.get("phone", ""),
    }
    training_class["students"].append(student)
    return jsonify({
        "student": student,
        "remaining": remaining - 1,
        "current": current_count + 1,
        "capacity": capacity
    }), 201


@classes_bp.put("/<int:class_id>")
def update_class(class_id):
    training_class = next((item for item in store.classes if item["id"] == class_id), None)
    if not training_class:
        return jsonify({"message": "Class not found"}), 404

    payload = request.get_json() or {}
    new_capacity = payload.get("capacity")
    if new_capacity is not None:
        new_capacity = int(new_capacity)
        current_count = len(training_class["students"])
        if new_capacity < current_count:
            return jsonify({
                "message": f"容量不能小于当前学员数。当前已有 {current_count} 名学员，新容量为 {new_capacity}",
                "current": current_count,
                "proposedCapacity": new_capacity
            }), 400
        training_class["capacity"] = new_capacity

    if "name" in payload:
        training_class["name"] = payload["name"]
    if "level" in payload:
        training_class["level"] = payload["level"]
    if "teacher" in payload:
        training_class["teacher"] = payload["teacher"]
    if "room" in payload:
        training_class["room"] = payload["room"]
    if "status" in payload:
        training_class["status"] = payload["status"]

    return jsonify(training_class), 200
