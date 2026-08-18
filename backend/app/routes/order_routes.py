import json
from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from app.models.models import (
    db, Order, OrderItem, Product, Allocation, PickingTask,
    PackingTask, QualityCheck, ExceptionRecord, AuditLog, DecisionLog
)
from app.decision_engine.priority_engine import PriorityEngine

order_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@order_bp.route('', methods=['GET'])
def list_orders():
    warehouse_id = request.args.get('warehouse_id', type=int)
    status = request.args.get('status')
    priority = request.args.get('priority')
    search = request.args.get('search')
    sla_risk_only = request.args.get('sla_risk') == 'true'

    query = Order.query

    if warehouse_id:
        query = query.filter_by(warehouse_id=warehouse_id)
    if status and status != 'ALL':
        query = query.filter_by(status=status)
    if priority and priority != 'ALL':
        query = query.filter_by(priority=priority)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Order.order_number.ilike(search_fmt)) |
            (Order.customer_name.ilike(search_fmt))
        )

    orders = query.order_by(Order.priority_score.desc(), Order.created_at.desc()).all()

    if sla_risk_only:
        orders = [o for o in orders if o.is_sla_risk]

    return jsonify({
        'count': len(orders),
        'orders': [o.to_dict(include_items=True) for o in orders]
    }), 200

@order_bp.route('/<int:order_id>', methods=['GET'])
def get_order(order_id):
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    # Recalculate dynamic priority score
    priority_res = PriorityEngine.calculate_priority_score(order)
    order.priority_score = priority_res['score']
    order.priority_breakdown = json.dumps(priority_res['breakdown'])
    order.priority_reason = priority_res['summary']
    db.session.commit()

    # Get Audit Logs for this order
    audit_logs = AuditLog.query.filter(
        (AuditLog.entity_id == order.order_number) | 
        (AuditLog.entity_id == str(order.id))
    ).order_by(AuditLog.created_at.desc()).all()

    # Get Decision Logs for this order
    decision_logs = DecisionLog.query.filter(
        DecisionLog.context_ref.ilike(f"%{order.order_number}%")
    ).order_by(DecisionLog.created_at.desc()).all()

    # Get Active Allocations
    allocations = [a.to_dict() for a in order.allocations]
    
    # Get Picking / Packing / QC tasks
    picking_task = PickingTask.query.filter_by(order_id=order.id).first()
    packing_task = PackingTask.query.filter_by(order_id=order.id).first()
    qc = QualityCheck.query.filter_by(order_id=order.id).first()
    exceptions = [e.to_dict() for e in order.exceptions]

    order_dict = order.to_dict(include_items=True)
    order_dict['priority_analysis'] = priority_res
    order_dict['allocations'] = allocations
    order_dict['picking_task'] = picking_task.to_dict() if picking_task else None
    order_dict['packing_task'] = packing_task.to_dict() if packing_task else None
    order_dict['quality_check'] = qc.to_dict() if qc else None
    order_dict['exceptions'] = exceptions
    order_dict['audit_timeline'] = [a.to_dict() for a in audit_logs]
    order_dict['decision_history'] = [d.to_dict() for d in decision_logs]

    return jsonify({'order': order_dict}), 200

@order_bp.route('', methods=['POST'])
def create_order():
    data = request.get_json(silent=True) or {}
    customer_name = data.get('customer_name')
    customer_tier = data.get('customer_tier', 'STANDARD')
    priority = data.get('priority', 'NORMAL')
    warehouse_id = data.get('warehouse_id', 1)
    items_data = data.get('items', [])
    sla_hours = float(data.get('sla_hours', 24))

    if not customer_name or not items_data:
        return jsonify({'error': 'Customer name and order items are required'}), 400

    now = datetime.now(timezone.utc)
    sla_deadline = now + timedelta(hours=sla_hours)

    # Generate sequential order number
    count = Order.query.count() + 1
    order_number = f"ORD-2026-{count:04d}"

    order = Order(
        order_number=order_number,
        customer_name=customer_name,
        customer_tier=customer_tier,
        priority=priority,
        sla_deadline=sla_deadline,
        status='CREATED',
        warehouse_id=warehouse_id,
        notes=data.get('notes', '')
    )
    db.session.add(order)
    db.session.flush()

    total_amount = 0.0
    for it in items_data:
        product_id = it.get('product_id')
        qty = int(it.get('quantity', 1))
        product = db.session.get(Product, product_id)
        if product:
            total_amount += product.unit_price * qty
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity_requested=qty,
                quantity_allocated=0,
                status='PENDING'
            )
            db.session.add(order_item)

    order.total_amount = round(total_amount, 2)
    db.session.flush()

    # Calculate initial priority score
    p_res = PriorityEngine.calculate_priority_score(order)
    order.priority_score = p_res['score']
    order.priority_breakdown = json.dumps(p_res['breakdown'])
    order.priority_reason = p_res['summary']

    # Audit log
    audit = AuditLog(
        entity_type='ORDER',
        entity_id=order.order_number,
        action='CREATED',
        performed_by='Operations Portal',
        details_json=json.dumps({
            'customer': customer_name,
            'tier': customer_tier,
            'priority': priority,
            'items_count': len(items_data),
            'sla_deadline': sla_deadline.isoformat(),
            'priority_score': p_res['score']
        })
    )
    db.session.add(audit)

    db.session.commit()

    return jsonify({
        'message': f'Order {order.order_number} created successfully',
        'order': order.to_dict(include_items=True)
    }), 201

@order_bp.route('/<int:order_id>/recalculate-priority', methods=['POST'])
def recalculate_priority(order_id):
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    res = PriorityEngine.calculate_priority_score(order)
    order.priority_score = res['score']
    order.priority_breakdown = json.dumps(res['breakdown'])
    order.priority_reason = res['summary']
    db.session.commit()

    return jsonify({'success': True, 'priority': res}), 200

@order_bp.route('/<int:order_id>/dispatch', methods=['POST'])
def dispatch_order(order_id):
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    now = datetime.now(timezone.utc)
    order.status = 'DISPATCHED'
    order.dispatched_at = now
    order.updated_at = now

    audit = AuditLog(
        entity_type='ORDER',
        entity_id=order.order_number,
        action='DISPATCHED',
        performed_by='Dispatch Dock Supervisor',
        details_json=json.dumps({
            'dispatched_at': now.isoformat(),
            'total_items': sum(i.quantity_requested for i in order.items)
        })
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Order {order.order_number} marked as DISPATCHED",
        'order': order.to_dict()
    }), 200
