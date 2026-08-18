from flask import Blueprint, request, jsonify
from app.models.models import AuditLog, DecisionLog

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')

@audit_bp.route('/logs', methods=['GET'])
def list_audit_logs():
    entity_type = request.args.get('entity_type')
    entity_id = request.args.get('entity_id')
    limit = request.args.get('limit', default=100, type=int)

    query = AuditLog.query
    if entity_type and entity_type != 'ALL':
        query = query.filter_by(entity_type=entity_type)
    if entity_id:
        query = query.filter_by(entity_id=entity_id)

    logs = [l.to_dict() for l in query.order_by(AuditLog.created_at.desc()).limit(limit).all()]
    return jsonify({'count': len(logs), 'audit_logs': logs}), 200

@audit_bp.route('/decisions', methods=['GET'])
def list_decision_logs():
    decision_type = request.args.get('type')
    limit = request.args.get('limit', default=100, type=int)

    query = DecisionLog.query
    if decision_type and decision_type != 'ALL':
        query = query.filter_by(decision_type=decision_type)

    decisions = [d.to_dict() for d in query.order_by(DecisionLog.created_at.desc()).limit(limit).all()]
    return jsonify({'count': len(decisions), 'decisions': decisions}), 200
