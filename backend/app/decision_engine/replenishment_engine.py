import math
import json
from datetime import datetime, timezone
from app.models.models import db, Product, Inventory, ReplenishmentRecommendation, Warehouse, AuditLog

class ReplenishmentEngine:
    """
    Evaluates warehouse stock levels, demand velocity, supplier lead times, and safety stock
    to generate data-grounded replenishment recommendations.
    """

    @classmethod
    def evaluate_all_products(cls, warehouse_id=None):
        """
        Scans products and evaluates replenishment needs based on inventory and velocity.
        """
        query = Product.query
        products = query.all()

        recommendations = []
        now = datetime.now(timezone.utc)

        for prod in products:
            # Aggregate available stock
            inv_query = Inventory.query.filter_by(product_id=prod.id)
            if warehouse_id:
                inv_query = inv_query.filter_by(warehouse_id=warehouse_id)
            
            records = inv_query.all()
            total_stk = sum(r.total_stock for r in records)
            reserved_stk = sum(r.reserved_stock for r in records)
            damaged_stk = sum(r.damaged_stock for r in records)
            missing_stk = sum(r.missing_stock for r in records)
            available_stk = max(0, total_stk - reserved_stk - damaged_stk - missing_stk)

            raw_demand = prod.avg_daily_demand if prod.avg_daily_demand is not None else 1.0
            daily_demand = max(0.5, float(raw_demand))
            lead_time = (prod.supplier.lead_time_days if prod.supplier and prod.supplier.lead_time_days else 3)
            
            # Statistical Safety Stock (Z=1.65 for 95% SLA)
            # Std dev of demand ~ 25% of mean
            sigma_d = daily_demand * 0.25
            safety_stock = math.ceil(1.65 * sigma_d * math.sqrt(max(1, lead_time)))
            min_safety = prod.min_safety_stock if prod.min_safety_stock is not None else 5
            safety_stock = max(min_safety, safety_stock)

            # Reorder point = (Daily Demand * Lead Time) + Safety Stock
            reorder_point = math.ceil((daily_demand * lead_time) + safety_stock)
            
            days_of_stock = round(available_stk / daily_demand, 1)
            is_under_reorder = available_stk <= reorder_point

            # Determine urgency and risk
            if available_stk <= 0:
                urgency = 'CRITICAL'
                risk_msg = "Stockout active! Immediate expedited PO required."
            elif days_of_stock <= lead_time:
                urgency = 'CRITICAL'
                risk_msg = f"Stockout predicted in {days_of_stock} days (shorter than lead time of {lead_time} days)."
            elif available_stk <= reorder_point:
                urgency = 'HIGH'
                risk_msg = f"Current stock ({available_stk}) reached reorder threshold ({reorder_point})."
            elif available_stk <= reorder_point * 1.3:
                urgency = 'NORMAL'
                risk_msg = f"Approaching reorder threshold within ~{round(max(0, days_of_stock - lead_time), 1)} days."
            else:
                urgency = 'HEALTHY'
                risk_msg = "Stock levels optimal."

            # Calculate Economic Order Quantity (EOQ) or batch multiplier
            reorder_qty = prod.reorder_quantity if prod.reorder_quantity is not None else 20
            recommended_qty = max(reorder_qty, math.ceil(daily_demand * 30))

            unit_cost = prod.unit_cost if prod.unit_cost is not None else 10.0

            if is_under_reorder or urgency in ['CRITICAL', 'HIGH']:
                recommendations.append({
                    'product_id': prod.id,
                    'sku': prod.sku,
                    'name': prod.name,
                    'category': prod.category,
                    'supplier_name': prod.supplier.name if prod.supplier else 'Direct OEM',
                    'supplier_id': prod.default_supplier_id,
                    'lead_time_days': lead_time,
                    'unit_cost': unit_cost,
                    'total_stock': total_stk,
                    'available_stock': available_stk,
                    'reserved_stock': reserved_stk,
                    'damaged_stock': damaged_stk,
                    'missing_stock': missing_stk,
                    'daily_demand': round(daily_demand, 1),
                    'days_of_stock': days_of_stock,
                    'safety_stock': safety_stock,
                    'reorder_point': reorder_point,
                    'recommended_reorder_qty': recommended_qty,
                    'total_order_cost': round(recommended_qty * unit_cost, 2),
                    'urgency': urgency,
                    'risk_assessment': risk_msg
                })

        # Sort recommendations by urgency (CRITICAL first, then lowest days of stock)
        urgency_order = {'CRITICAL': 0, 'HIGH': 1, 'NORMAL': 2, 'HEALTHY': 3}
        recommendations.sort(key=lambda r: (urgency_order.get(r['urgency'], 4), r['days_of_stock']))

        return recommendations

    @classmethod
    def create_purchase_order(cls, product_id, quantity, warehouse_id=1, user_id=None):
        """
        Approves replenishment and creates active restock order.
        """
        product = db.session.get(Product, product_id)
        if not product:
            return {'success': False, 'error': 'Product not found'}

        now = datetime.now(timezone.utc)
        rec = ReplenishmentRecommendation(
            product_id=product.id,
            warehouse_id=warehouse_id,
            current_stock=product.to_dict()['available_stock'],
            reorder_point=product.reorder_point or 10,
            recommended_quantity=quantity,
            urgency='HIGH',
            estimated_lead_time_days=product.supplier.lead_time_days if product.supplier else 3,
            status='ORDERED',
            created_at=now
        )
        db.session.add(rec)

        # Record Audit Log
        audit = AuditLog(
            entity_type='REPLENISHMENT',
            entity_id=product.sku,
            action='PURCHASE_ORDER_CREATED',
            performed_by=f"User #{user_id}" if user_id else 'Procurement Manager',
            details_json=json.dumps({
                'product_id': product.id,
                'sku': product.sku,
                'quantity': quantity,
                'supplier': product.supplier.name if product.supplier else 'Direct OEM',
                'lead_time_days': rec.estimated_lead_time_days,
                'estimated_cost': round(quantity * (product.unit_cost or 0), 2)
            })
        )
        db.session.add(audit)

        db.session.commit()

        return {
            'success': True,
            'message': f"Purchase Order created for {quantity} units of {product.sku} ({product.name})",
            'order': rec.to_dict()
        }
