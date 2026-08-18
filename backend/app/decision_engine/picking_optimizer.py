import json
import math
from datetime import datetime, timezone
from app.models.models import db, Order, PickingTask, PackingTask, Allocation, Inventory, Bin, Zone, ExceptionRecord, AuditLog

class PickingOptimizer:
    """
    Heuristic TSP / S-Shape route optimizer that sequences order item picks to minimize
    warehouse walking distance, picker congestion, and fulfillment cycle time.
    """

    @classmethod
    def generate_optimized_route(cls, order_id, assigned_user_id=None):
        order = db.session.get(Order, order_id)
        if not order:
            return {'success': False, 'error': 'Order not found'}

        # Fetch active allocations for this order
        allocations = Allocation.query.filter_by(order_id=order.id, status='ACTIVE').all()
        if not allocations:
            return {'success': False, 'error': 'No active inventory allocations found for this order'}

        stops = []
        for alloc in allocations:
            inv = alloc.inventory
            bin_obj = inv.bin if inv else None
            zone_obj = bin_obj.zone if bin_obj else None
            
            x = bin_obj.x_coord if bin_obj else 0.0
            y = bin_obj.y_coord if bin_obj else 0.0
            
            stops.append({
                'allocation_id': alloc.id,
                'order_item_id': alloc.order_item_id,
                'inventory_id': inv.id,
                'product_id': inv.product_id,
                'sku': inv.product.sku,
                'product_name': inv.product.name,
                'category': inv.product.category,
                'quantity': alloc.quantity,
                'bin_id': bin_obj.id if bin_obj else 0,
                'bin_code': bin_obj.code if bin_obj else 'N/A',
                'aisle': bin_obj.aisle if bin_obj else 'A',
                'shelf': bin_obj.shelf if bin_obj else '01',
                'level': bin_obj.level if bin_obj else '1',
                'zone_code': zone_obj.code if zone_obj else 'Zone A',
                'zone_name': zone_obj.name if zone_obj else 'Primary Zone',
                'x': x,
                'y': y,
                'status': 'PENDING' # PENDING, PICKED, DAMAGED, MISSING
            })

        # Heuristic S-Shape / Nearest Neighbor Ordering
        # Sort primarily by Zone, then Aisle, then alternating S-Shape shelf traversal
        def sort_key(s):
            aisle_num = 0
            try:
                aisle_num = int(''.join(filter(str.isdigit, s['aisle'])) or 0)
            except:
                pass
            
            shelf_num = 0
            try:
                shelf_num = int(''.join(filter(str.isdigit, s['shelf'])) or 0)
            except:
                pass
            
            # S-shape: even aisles ascend shelf, odd aisles descend shelf
            if aisle_num % 2 == 1:
                shelf_num = -shelf_num

            return (s['zone_code'], aisle_num, shelf_num, s['level'])

        stops.sort(key=sort_key)

        # Calculate estimated total walking distance in meters
        total_distance = 15.0 # Base depot to first aisle
        prev_x, prev_y = 0.0, 0.0
        
        sequence = []
        for idx, stop in enumerate(stops):
            stop['step_number'] = idx + 1
            dist = math.sqrt((stop['x'] - prev_x)**2 + (stop['y'] - prev_y)**2) * 5.0 # 5m grid scale
            total_distance += max(4.0, dist)
            prev_x, prev_y = stop['x'], stop['y']
            sequence.append(stop)

        total_distance = round(total_distance, 1)
        # Average picker walking speed ~ 1.2 m/s + 20s scan/pick per item
        walking_time_min = total_distance / (1.2 * 60.0)
        pick_time_min = len(stops) * 0.4
        estimated_time_min = round(walking_time_min + pick_time_min + 1.0, 1)

        # Check if picking task already exists
        picking_task = PickingTask.query.filter_by(order_id=order.id).first()
        now = datetime.now(timezone.utc)

        if not picking_task:
            picking_task = PickingTask(
                order_id=order.id,
                assigned_user_id=assigned_user_id,
                status='QUEUED',
                total_items=sum(s['quantity'] for s in sequence),
                picked_items=0,
                estimated_distance_m=total_distance,
                estimated_time_min=estimated_time_min,
                route_sequence_json=json.dumps(sequence),
                started_at=None,
                completed_at=None
            )
            db.session.add(picking_task)
        else:
            picking_task.estimated_distance_m = total_distance
            picking_task.estimated_time_min = estimated_time_min
            picking_task.route_sequence_json = json.dumps(sequence)
            picking_task.total_items = sum(s['quantity'] for s in sequence)
            if assigned_user_id:
                picking_task.assigned_user_id = assigned_user_id

        db.session.commit()

        return {
            'success': True,
            'picking_task': picking_task.to_dict(),
            'route': sequence,
            'metrics': {
                'total_stops': len(sequence),
                'total_units': picking_task.total_items,
                'estimated_distance_m': total_distance,
                'estimated_time_min': estimated_time_min,
                'path_description': " → ".join([f"{s['bin_code']} ({s['quantity']}u)" for s in sequence[:6]]) + ("..." if len(sequence) > 6 else "")
            }
        }

    @classmethod
    def record_pick_action(cls, task_id, step_number, action_type, user_id=None, notes=None):
        """
        Records picker action for a given step:
        - 'PICK': Marks item as picked successfully, updates order item picked count.
        - 'MISSING': Marks item missing, spawns ExceptionRecord, updates missing stock.
        - 'DAMAGED': Marks item damaged, spawns ExceptionRecord, updates damaged stock.
        """
        task = db.session.get(PickingTask, task_id)
        if not task:
            return {'success': False, 'error': 'Picking task not found'}

        now = datetime.now(timezone.utc)
        if task.status == 'QUEUED':
            task.status = 'IN_PROGRESS'
            task.started_at = now
            task.order.status = 'PICKING'

        route = json.loads(task.route_sequence_json or '[]')
        target_step = None
        for step in route:
            if step.get('step_number') == step_number:
                target_step = step
                break

        if not target_step:
            return {'success': False, 'error': f'Step #{step_number} not found in route'}

        inv = db.session.get(Inventory, target_step['inventory_id'])
        order_obj = db.session.get(Order, task.order_id)
        order_item = order_obj.items if order_obj else []
        target_item = None
        for it in order_item:
            if it.id == target_step.get('order_item_id'):
                target_item = it
                break

        if action_type == 'PICK':
            target_step['status'] = 'PICKED'
            target_step['picked_at'] = now.isoformat()
            if target_item:
                target_item.quantity_picked += target_step['quantity']
                if target_item.quantity_picked >= target_item.quantity_requested:
                    target_item.status = 'PICKED'
            task.picked_items += target_step['quantity']

            # Audit
            audit = AuditLog(
                entity_type='PICKING',
                entity_id=f"TASK-{task.id}",
                action='ITEM_PICKED',
                performed_by=f"User #{user_id}" if user_id else 'Picker',
                details_json=json.dumps({
                    'sku': target_step['sku'],
                    'quantity': target_step['quantity'],
                    'bin': target_step['bin_code']
                })
            )
            db.session.add(audit)

        elif action_type == 'MISSING':
            target_step['status'] = 'MISSING'
            qty = target_step['quantity']
            if inv:
                inv.missing_stock += qty
                inv.reserved_stock = max(0, inv.reserved_stock - qty)

            # Spawn Exception
            exc = ExceptionRecord(
                order_id=task.order_id,
                order_item_id=target_step.get('order_item_id'),
                product_id=target_step['product_id'],
                exception_type='MISSING_ITEM',
                severity='HIGH' if task.order.priority in ['CRITICAL', 'URGENT'] else 'MEDIUM',
                impact_summary=f"Missing {qty} units of {target_step['sku']} at Bin {target_step['bin_code']}. Order fulfillment blocked.",
                ai_recommendation=f"Search adjacent Bin {target_step['bin_code']} or reallocate {qty} units from secondary warehouse zone.",
                resolution_status='OPEN',
                created_at=now
            )
            db.session.add(exc)
            task.status = 'EXCEPTION'

        elif action_type == 'DAMAGED':
            target_step['status'] = 'DAMAGED'
            qty = target_step['quantity']
            if inv:
                inv.damaged_stock += qty
                inv.reserved_stock = max(0, inv.reserved_stock - qty)

            exc = ExceptionRecord(
                order_id=task.order_id,
                order_item_id=target_step.get('order_item_id'),
                product_id=target_step['product_id'],
                exception_type='DAMAGED_ITEM',
                severity='HIGH',
                impact_summary=f"Found {qty} damaged units of {target_step['sku']} at Bin {target_step['bin_code']}.",
                ai_recommendation=f"Quarantine damaged stock, reallocate fresh units from buffer bin, and log vendor quality claim.",
                resolution_status='OPEN',
                created_at=now
            )
            db.session.add(exc)
            task.status = 'EXCEPTION'

        # Check if all steps in route are completed
        all_done = all(s.get('status') in ['PICKED', 'MISSING', 'DAMAGED'] for s in route)
        if all_done and task.status != 'EXCEPTION':
            task.status = 'COMPLETED'
            task.completed_at = now
            task.order.status = 'PICKED'

            # Auto-queue Packing Task if not exists
            existing_pack = PackingTask.query.filter_by(order_id=task.order_id).first()
            if not existing_pack:
                total_q = task.picked_items
                rec_box = 'Box-S (Small Electronics)' if total_q <= 2 else ('Box-M (Standard Cardboard)' if total_q <= 6 else 'Box-L (Heavy Reinforced)')
                new_pack_task = PackingTask(
                    order_id=task.order_id,
                    status='WAITING',
                    recommended_box_type=rec_box,
                    actual_weight_kg=round(max(0.5, total_q * 0.4 + 0.3), 2),
                    dimensions_cm='30x20x15'
                )
                db.session.add(new_pack_task)

                # Record Audit Log for Picking Completion
                audit = AuditLog(
                    entity_type='ORDER',
                    entity_id=task.order.order_number,
                    action='PICKING_COMPLETED',
                    performed_by=f"User #{user_id}" if user_id else 'Picker',
                    details_json=json.dumps({
                        'picked_items': task.picked_items,
                        'total_items': task.total_items,
                        'routed_to': 'PACKING_STATION_03'
                    })
                )
                db.session.add(audit)

        task.route_sequence_json = json.dumps(route)
        db.session.commit()

        return {
            'success': True,
            'task': task.to_dict(),
            'step': target_step,
            'all_completed': all_done
        }
