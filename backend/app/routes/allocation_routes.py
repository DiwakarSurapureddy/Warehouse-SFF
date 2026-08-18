from flask import Blueprint, request, jsonify
from app.decision_engine.allocation_engine import AllocationEngine
from app.models.models import Order

allocation_bp = Blueprint('allocation', __name__, url_prefix='/api/allocation')

@allocation_bp.route('/recommend/<int:order_id>', methods=['GET', 'POST'])
def recommend_allocation(order_id):
    """
    Evaluates inventory availability and priority to generate a recommended allocation plan
    with full explainability (What, Why, Impact, Alternative).
    """
    res = AllocationEngine.evaluate_allocation(order_id)
    if not res.get('success'):
        return jsonify(res), 400
    return jsonify(res), 200

@allocation_bp.route('/confirm/<int:order_id>', methods=['POST'])
def confirm_allocation(order_id):
    """
    Executes and commits the allocation decision to the DB, updates reserved stock,
    and advances order to ALLOCATED / PARTIALLY_ALLOCATED state.
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    custom_plan = data.get('custom_plan') # Optional overrides

    res = AllocationEngine.execute_allocation(order_id, user_id=user_id, custom_plan=custom_plan)
    if not res.get('success'):
        return jsonify(res), 400
    return jsonify(res), 200

@allocation_bp.route('/batch-evaluate', methods=['GET'])
def batch_evaluate_pending():
    """
    Evaluates all unallocated orders and flags conflicts.
    """
    pending = Order.query.filter(Order.status.in_(['CREATED', 'PARTIALLY_ALLOCATED'])).order_by(Order.priority_score.desc()).all()
    evaluations = []
    for order in pending:
        ev = AllocationEngine.evaluate_allocation(order.id)
        if ev.get('success'):
            evaluations.append(ev['evaluation'])

    return jsonify({
        'count': len(evaluations),
        'evaluations': evaluations
    }), 200
