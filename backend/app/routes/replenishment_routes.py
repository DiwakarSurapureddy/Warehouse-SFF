from flask import Blueprint, request, jsonify
from app.decision_engine.replenishment_engine import ReplenishmentEngine

replenishment_bp = Blueprint('replenishment', __name__, url_prefix='/api/replenishment')

@replenishment_bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    warehouse_id = request.args.get('warehouse_id', type=int)
    recs = ReplenishmentEngine.evaluate_all_products(warehouse_id=warehouse_id)
    return jsonify({'count': len(recs), 'recommendations': recs}), 200

@replenishment_bp.route('/purchase-order', methods=['POST'])
def create_po():
    data = request.get_json() or {}
    product_id = data.get('product_id')
    quantity = int(data.get('quantity', 100))
    warehouse_id = int(data.get('warehouse_id', 1))
    user_id = data.get('user_id')

    if not product_id:
        return jsonify({'error': 'product_id is required'}), 400

    res = ReplenishmentEngine.create_purchase_order(
        product_id=product_id,
        quantity=quantity,
        warehouse_id=warehouse_id,
        user_id=user_id
    )
    if not res.get('success'):
        return jsonify(res), 400
    return jsonify(res), 201
