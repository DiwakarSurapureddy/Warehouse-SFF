import json
from datetime import datetime, timezone
from app.models.models import db, Inventory, Order, OrderItem, Allocation, DecisionLog, ReplenishmentRecommendation, AuditLog, Product

class AllocationEngine:
    """
    Intelligent inventory allocation engine that resolves stock shortages, multi-order competition,
    picking distance, warehouse workload, and customer SLA urgency.
    """

    @classmethod
    def evaluate_allocation(cls, order_id):
        """
        Evaluates an order and its competing orders to generate an optimal allocation plan
        with full explainability (What, Why, Expected Impact, Alternative Action).
        """
        order = db.session.get(Order, order_id)
        if not order:
            return {'success': False, 'error': 'Order not found'}

        results = []
        overall_decision = 'FULL_ALLOCATION'
        shortage_items = []
        explanations = []
        impacts = []
        alternatives = []

        for item in order.items:
            product = item.product
            req_qty = item.quantity_requested
            already_alloc = item.quantity_allocated
            needed_qty = max(0, req_qty - already_alloc)

            if needed_qty == 0:
                continue

            # Find all available inventory records across warehouses/bins
            # Find all available inventory records across warehouses/bins
            inv_records = Inventory.query.filter_by(product_id=product.id).all()
            
            # Filter records for target warehouse first
            local_inv = []
            local_available = 0
            remote_inv = []
            remote_available = 0

            for inv in inv_records:
                avail = inv.available_stock
                if avail > 0:
                    zone_workload = inv.bin.zone.workload_pct if inv.bin and inv.bin.zone else 50.0
                    is_same_warehouse = (inv.warehouse_id == order.warehouse_id)
                    entry = {
                        'inventory': inv,
                        'available': avail,
                        'score': (100 if is_same_warehouse else 60) - (zone_workload * 0.2),
                        'is_same_warehouse': is_same_warehouse,
                        'zone_code': inv.bin.zone.code if inv.bin and inv.bin.zone else 'Z1',
                        'bin_code': inv.bin.code if inv.bin else 'B1'
                    }
                    if is_same_warehouse:
                        local_inv.append(entry)
                        local_available += avail
                    else:
                        remote_inv.append(entry)
                        remote_available += avail

            local_inv.sort(key=lambda x: x['score'], reverse=True)
            remote_inv.sort(key=lambda x: x['score'], reverse=True)

            # Check competing pending orders in same warehouse
            competing_orders = (
                db.session.query(Order, OrderItem)
                .join(OrderItem, Order.id == OrderItem.order_id)
                .filter(
                    OrderItem.product_id == product.id,
                    Order.id != order.id,
                    Order.warehouse_id == order.warehouse_id,
                    Order.status.in_(['CREATED', 'PARTIALLY_ALLOCATED']),
                    OrderItem.quantity_allocated < OrderItem.quantity_requested
                )
                .all()
            )

            # Immediate local allocation evaluation
            if local_available >= needed_qty:
                # Full local stock is available
                allocation_plan = []
                remaining_needed = needed_qty
                for v in local_inv:
                    if remaining_needed <= 0:
                        break
                    take = min(remaining_needed, v['available'])
                    allocation_plan.append({
                        'inventory_id': v['inventory'].id,
                        'bin_code': v['bin_code'],
                        'zone_code': v['zone_code'],
                        'warehouse_id': v['inventory'].warehouse_id,
                        'quantity': take
                    })
                    remaining_needed -= take

                item_res = {
                    'item_id': item.id,
                    'sku': product.sku,
                    'product_name': product.name,
                    'quantity_requested': req_qty,
                    'allocatable_quantity': needed_qty,
                    'shortage': 0,
                    'decision': 'FULL_ALLOCATION',
                    'plan': allocation_plan,
                    'reasons': [
                        f"Full stock available ({local_available} units found in active warehouse bins)",
                        f"Priority score {int(order.priority_score)} justifies immediate fulfillment",
                        f"Optimal picking path from zone {allocation_plan[0]['zone_code'] if allocation_plan else 'A'}"
                    ],
                    'expected_impact': "Zero fulfillment delay; on track to meet SLA window",
                    'alternative': "None required (sufficient inventory)"
                }
                results.append(item_res)

            else:
                # Stock Shortage / Conflict!
                allocatable = min(needed_qty, local_available)
                shortage = needed_qty - allocatable
                overall_decision = 'PARTIAL_ALLOCATION' if allocatable > 0 else 'BACKORDER'
                shortage_items.append({'sku': product.sku, 'shortage': shortage, 'product_id': product.id})

                allocation_plan = []
                remaining_needed = allocatable
                for v in local_inv:
                    if remaining_needed <= 0:
                        break
                    take = min(remaining_needed, v['available'])
                    allocation_plan.append({
                        'inventory_id': v['inventory'].id,
                        'bin_code': v['bin_code'],
                        'zone_code': v['zone_code'],
                        'warehouse_id': v['inventory'].warehouse_id,
                        'quantity': take
                    })
                    remaining_needed -= take

                # Build rich reasoning
                reasons = []
                if order.priority.upper() in ['CRITICAL', 'URGENT'] or order.is_sla_risk:
                    reasons.append(f"Critical priority ({order.priority}) & SLA risk — allocate all available {allocatable} units immediately to protect SLA")
                else:
                    reasons.append(f"Standard priority with local stock deficit ({local_available} avail vs {needed_qty} req)")
                
                reasons.append(f"Shortage of {shortage} units placed on controlled backorder")
                reasons.append(f"Automated replenishment recommendation triggered for {product.reorder_quantity} units")
                if remote_available > 0:
                    reasons.append(f"Secondary stock: {remote_available} units located at partner warehouse (available for inter-facility transit)")

                item_res = {
                    'item_id': item.id,
                    'sku': product.sku,
                    'product_name': product.name,
                    'quantity_requested': req_qty,
                    'allocatable_quantity': allocatable,
                    'shortage': shortage,
                    'decision': 'PARTIAL_ALLOCATION' if allocatable > 0 else 'BACKORDER',
                    'plan': allocation_plan,
                    'reasons': reasons,
                    'expected_impact': f"Fulfills {round((allocatable/req_qty)*100)}% of order volume immediately while triggering restock PO",
                    'alternative': f"Hold entire order until replenishment (causes estimated 72h SLA breach)"
                }
                results.append(item_res)
                explanations.extend(reasons)
                impacts.append(item_res['expected_impact'])
                alternatives.append(item_res['alternative'])

        recommendation_summary = {
            'order_id': order.id,
            'order_number': order.order_number,
            'priority': order.priority,
            'priority_score': order.priority_score,
            'overall_decision': overall_decision,
            'items': results,
            'has_shortage': len(shortage_items) > 0,
            'shortage_count': sum(s['shortage'] for s in shortage_items),
            'recommended_action': (
                f"Allocate available units ({sum(i['allocatable_quantity'] for i in results)}) immediately to {order.order_number}"
                + (f" and backorder {sum(s['shortage'] for s in shortage_items)} units with urgent restock PO" if shortage_items else "")
            ),
            'reasons': explanations if explanations else ["Optimal stock and location matched for prompt fulfillment"],
            'expected_impact': "; ".join(impacts) if impacts else "On-time fulfillment guaranteed within current shift",
            'alternative_action': "; ".join(alternatives) if alternatives else "Route from secondary warehouse facility"
        }

        return {'success': True, 'evaluation': recommendation_summary}

    @classmethod
    def execute_allocation(cls, order_id, user_id=None, custom_plan=None):
        """
        Executes and commits inventory allocations to database, updates reserved stock,
        updates order state, and creates audit/decision logs.
        """
        evaluation = cls.evaluate_allocation(order_id)
        if not evaluation.get('success'):
            return evaluation

        order = db.session.get(Order, order_id)
        eval_data = evaluation['evaluation']
        now = datetime.now(timezone.utc)

        total_allocated = 0
        total_requested = 0

        for item_eval in eval_data['items']:
            item = db.session.get(OrderItem, item_eval['item_id'])
            if not item:
                continue
            
            total_requested += item.quantity_requested

            plan = custom_plan.get(str(item.id)) if custom_plan and str(item.id) in custom_plan else item_eval['plan']

            for p in plan:
                qty = p['quantity']
                if qty <= 0:
                    continue

                inv = db.session.get(Inventory, p['inventory_id'])
                if inv:
                    # Update reserved stock
                    inv.reserved_stock += qty
                    
                    # Create allocation record
                    alloc = Allocation(
                        order_id=order.id,
                        order_item_id=item.id,
                        inventory_id=inv.id,
                        quantity=qty,
                        status='ACTIVE',
                        decision_reason=f"Allocated {qty} units from Bin {p.get('bin_code', 'N/A')} (Zone {p.get('zone_code', 'N/A')})",
                        allocated_at=now
                    )
                    db.session.add(alloc)
                    item.quantity_allocated += qty
                    total_allocated += qty

            if item.quantity_allocated >= item.quantity_requested:
                item.status = 'ALLOCATED'
            elif item.quantity_allocated > 0:
                item.status = 'PARTIALLY_ALLOCATED'
            else:
                item.status = 'SHORTAGE'

        # Update order status
        if total_allocated >= total_requested:
            order.status = 'ALLOCATED'
        elif total_allocated > 0:
            order.status = 'PARTIALLY_ALLOCATED'
        else:
            order.status = 'BACKORDERED'
        
        order.updated_at = now

        # Create Decision Log
        dec_log = DecisionLog(
            decision_type='ALLOCATION',
            context_ref=order.order_number,
            score=order.priority_score,
            recommended_action=eval_data['recommended_action'],
            reason_json=json.dumps(eval_data['reasons']),
            expected_impact=eval_data['expected_impact'],
            alternative_action=eval_data['alternative_action'],
            execution_status='APPROVED',
            executed_by=f"User #{user_id}" if user_id else 'Smart Decision Engine'
        )
        db.session.add(dec_log)

        # Create Audit Log
        audit = AuditLog(
            entity_type='ORDER',
            entity_id=order.order_number,
            action='INVENTORY_ALLOCATED',
            performed_by=f"User #{user_id}" if user_id else 'Decision Engine',
            details_json=json.dumps({
                'allocated_quantity': total_allocated,
                'requested_quantity': total_requested,
                'status': order.status,
                'decision': eval_data['overall_decision']
            })
        )
        db.session.add(audit)

        # If shortages exist, generate replenishment recommendations
        if eval_data['has_shortage']:
            for s in eval_data['items']:
                if s['shortage'] > 0:
                    product = Product.query.filter_by(sku=s['sku']).first()
                    if product:
                        repl = ReplenishmentRecommendation(
                            product_id=product.id,
                            warehouse_id=order.warehouse_id,
                            current_stock=product.to_dict()['available_stock'],
                            reorder_point=product.reorder_point,
                            recommended_quantity=max(product.reorder_quantity, s['shortage'] * 3),
                            urgency='CRITICAL' if order.priority in ['CRITICAL', 'URGENT'] else 'HIGH',
                            estimated_lead_time_days=product.supplier.lead_time_days if product.supplier else 3,
                            status='PENDING'
                        )
                        db.session.add(repl)

        db.session.commit()
        return {'success': True, 'order': order.to_dict(), 'evaluation': eval_data}
