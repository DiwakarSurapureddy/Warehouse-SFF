import json
from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from app.models.models import db, Product, Inventory, Bin, Zone, Warehouse, Supplier, AuditLog
from app.decision_engine.demand_forecaster import DemandForecaster

inventory_bp = Blueprint('inventory', __name__, url_prefix='/api/inventory')

@inventory_bp.route('', methods=['GET'])
def list_inventory():
    warehouse_id = request.args.get('warehouse_id', type=int)
    category = request.args.get('category')
    health_status = request.args.get('health_status')
    search = request.args.get('search')

    query = Inventory.query

    if warehouse_id:
        query = query.filter_by(warehouse_id=warehouse_id)
    
    items = query.all()

    # Filter in memory for rich computed properties
    results = []
    for item in items:
        item_dict = item.to_dict()
        if category and item_dict['category'] != category:
            continue
        if health_status and health_status != 'ALL' and item_dict['health_status'] != health_status:
            continue
        if search:
            s = search.lower()
            if (s not in item_dict['product_sku'].lower() and 
                s not in item_dict['product_name'].lower() and 
                s not in item_dict['bin_code'].lower()):
                continue
        results.append(item_dict)

    # Also return summary counts
    return jsonify({
        'count': len(results),
        'inventory': results
    }), 200

@inventory_bp.route('/products', methods=['GET'])
def list_products():
    search = request.args.get('search')
    category = request.args.get('category')

    query = Product.query
    if category and category != 'ALL':
        query = query.filter_by(category=category)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Product.sku.ilike(search_fmt)) |
            (Product.name.ilike(search_fmt))
        )

    products = [p.to_dict() for p in query.all()]
    return jsonify({'count': len(products), 'products': products}), 200

@inventory_bp.route('/<int:inventory_id>/adjust', methods=['POST'])
def adjust_inventory(inventory_id):
    """
    Manual adjustment or cycle count correction.
    """
    inv = db.session.get(Inventory, inventory_id)
    if not inv:
        return jsonify({'error': 'Inventory record not found'}), 404

    data = request.get_json(silent=True) or {}
    delta_total = int(data.get('delta_total', 0))
    delta_damaged = int(data.get('delta_damaged', 0))
    delta_missing = int(data.get('delta_missing', 0))
    reason = data.get('reason', 'Supervisor manual adjustment')

    now = datetime.now(timezone.utc)
    inv.total_stock = max(0, inv.total_stock + delta_total)
    inv.damaged_stock = max(0, inv.damaged_stock + delta_damaged)
    inv.missing_stock = max(0, inv.missing_stock + delta_missing)
    inv.updated_at = now

    audit = AuditLog(
        entity_type='INVENTORY',
        entity_id=f"INV-{inv.id}",
        action='STOCK_ADJUSTED',
        performed_by='Inventory Manager',
        details_json=json.dumps({
            'sku': inv.product.sku if inv.product else 'N/A',
            'bin': inv.bin.code if inv.bin else 'N/A',
            'delta_total': delta_total,
            'delta_damaged': delta_damaged,
            'delta_missing': delta_missing,
            'new_available': inv.available_stock,
            'reason': reason
        })
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Inventory adjusted successfully',
        'inventory': inv.to_dict()
    }), 200

@inventory_bp.route('/products/<int:product_id>/forecast', methods=['GET'])
def get_product_forecast(product_id):
    horizon = request.args.get('horizon', default=14, type=int)
    forecast = DemandForecaster.generate_forecast(product_id, horizon_days=horizon)
    return jsonify(forecast), 200
