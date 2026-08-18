import json
from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from app.models.models import db, PackingTask, Order, QualityCheck, AuditLog

packing_bp = Blueprint('packing', __name__, url_prefix='/api/packing')

@packing_bp.route('/tasks', methods=['GET'])
def list_tasks():
    status = request.args.get('status')
    query = PackingTask.query
    if status and status != 'ALL':
        query = query.filter_by(status=status)
    
    tasks = [t.to_dict() for t in query.order_by(PackingTask.id.desc()).all()]
    return jsonify({'count': len(tasks), 'tasks': tasks}), 200

@packing_bp.route('/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    task = db.session.get(PackingTask, task_id)
    if not task:
        return jsonify({'error': 'Packing task not found'}), 404
    
    task_dict = task.to_dict()
    order = task.order
    task_dict['order_items'] = [it.to_dict() for it in order.items] if order else []
    return jsonify({'task': task_dict}), 200

@packing_bp.route('/tasks/<int:task_id>/start', methods=['POST'])
def start_packing(task_id):
    task = db.session.get(PackingTask, task_id)
    if not task:
        return jsonify({'error': 'Packing task not found'}), 404

    now = datetime.now(timezone.utc)
    task.status = 'PACKING'
    task.started_at = now
    if task.order:
        task.order.status = 'PACKING'

    db.session.commit()
    return jsonify({'success': True, 'task': task.to_dict()}), 200

@packing_bp.route('/tasks/<int:task_id>/complete', methods=['POST'])
def complete_packing(task_id):
    task = db.session.get(PackingTask, task_id)
    if not task:
        return jsonify({'error': 'Packing task not found'}), 404
    data = request.get_json(silent=True) or {}
    box_type = data.get('box_type', task.recommended_box_type)
    weight = float(data.get('weight_kg', 2.5))
    dimensions = data.get('dimensions_cm', '30x20x15')
    notes = data.get('notes', '')

    now = datetime.now(timezone.utc)
    task.status = 'PACKED'
    task.recommended_box_type = box_type
    task.actual_weight_kg = weight
    task.dimensions_cm = dimensions
    task.packaging_notes = notes
    task.completed_at = now

    if task.order:
        task.order.status = 'PACKED'
        for item in task.order.items:
            item.quantity_packed = item.quantity_picked
            item.status = 'PACKED'

        # Auto-create or queue Quality Check record
        qc = QualityCheck.query.filter_by(order_id=task.order.id).first()
        if not qc:
            qc = QualityCheck(
                order_id=task.order.id,
                packing_task_id=task.id,
                status='PENDING',
                sku_verified=True,
                quantity_verified=True,
                condition_verified=True,
                packaging_verified=True,
                label_verified=True,
                checked_at=now
            )
            db.session.add(qc)

    audit = AuditLog(
        entity_type='PACKING',
        entity_id=f"TASK-{task.id}",
        action='PACKED',
        performed_by='Packer Station',
        details_json=json.dumps({
            'box_type': box_type,
            'weight_kg': weight,
            'order_number': task.order.order_number if task.order else ''
        })
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'success': True, 'task': task.to_dict()}), 200
