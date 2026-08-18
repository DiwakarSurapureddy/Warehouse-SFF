from flask import Blueprint, request, jsonify
from app.models.models import db, PickingTask, Order
from app.decision_engine.picking_optimizer import PickingOptimizer

picking_bp = Blueprint('picking', __name__, url_prefix='/api/picking')

@picking_bp.route('/tasks', methods=['GET'])
def list_tasks():
    status = request.args.get('status')
    user_id = request.args.get('user_id', type=int)

    query = PickingTask.query
    if status and status != 'ALL':
        query = query.filter_by(status=status)
    if user_id:
        query = query.filter_by(assigned_user_id=user_id)

    tasks = [t.to_dict() for t in query.order_by(PickingTask.id.desc()).all()]
    return jsonify({'count': len(tasks), 'tasks': tasks}), 200

@picking_bp.route('/generate-route/<int:order_id>', methods=['POST'])
def generate_route(order_id):
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    res = PickingOptimizer.generate_optimized_route(order_id, assigned_user_id=user_id)
    if not res.get('success'):
        return jsonify(res), 400
    return jsonify(res), 200

@picking_bp.route('/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    task = db.session.get(PickingTask, task_id)
    if not task:
        return jsonify({'error': 'Picking task not found'}), 404
    return jsonify({'task': task.to_dict()}), 200

@picking_bp.route('/tasks/<int:task_id>/action', methods=['POST'])
def record_action(task_id):
    data = request.get_json(silent=True) or {}
    step_number = data.get('step_number')
    action_type = data.get('action_type') # PICK, MISSING, DAMAGED
    user_id = data.get('user_id')
    notes = data.get('notes')

    if not step_number or not action_type:
        return jsonify({'error': 'step_number and action_type are required'}), 400

    res = PickingOptimizer.record_pick_action(
        task_id=task_id,
        step_number=step_number,
        action_type=action_type,
        user_id=user_id,
        notes=notes
    )
    if not res.get('success'):
        return jsonify(res), 400
    return jsonify(res), 200
