from flask import Blueprint, request, jsonify
from app.models.models import db, ExceptionRecord
from app.decision_engine.exception_resolver import ExceptionResolver

exception_bp = Blueprint('exceptions', __name__, url_prefix='/api/exceptions')

@exception_bp.route('', methods=['GET'])
def list_exceptions():
    status = request.args.get('status')
    severity = request.args.get('severity')
    exc_type = request.args.get('type')

    query = ExceptionRecord.query
    if status and status != 'ALL':
        query = query.filter_by(resolution_status=status)
    if severity and severity != 'ALL':
        query = query.filter_by(severity=severity)
    if exc_type and exc_type != 'ALL':
        query = query.filter_by(exception_type=exc_type)

    exceptions = [e.to_dict() for e in query.order_by(ExceptionRecord.created_at.desc()).all()]
    return jsonify({'count': len(exceptions), 'exceptions': exceptions}), 200

@exception_bp.route('/<int:exception_id>', methods=['GET'])
def get_exception(exception_id):
    exc = db.session.get(ExceptionRecord, exception_id)
    if not exc:
        return jsonify({'error': 'Exception not found'}), 404
    return jsonify({'exception': exc.to_dict()}), 200

@exception_bp.route('/<int:exception_id>/options', methods=['GET'])
def get_resolution_options(exception_id):
    res = ExceptionResolver.get_resolution_options(exception_id)
    if not res.get('success'):
        return jsonify(res), 404
    return jsonify(res), 200

@exception_bp.route('/<int:exception_id>/resolve', methods=['POST', 'PUT'])
def resolve_exception(exception_id):
    data = request.get_json() or {}
    action_code = data.get('action_code', 'MANUAL_SUPERVISOR_OVERRIDE')
    user_id = data.get('user_id')
    notes = data.get('notes')

    res = ExceptionResolver.resolve_exception(
        exception_id=exception_id,
        action_code=action_code,
        user_id=user_id,
        custom_notes=notes
    )
    if not res.get('success'):
        return jsonify(res), 400
    return jsonify(res), 200
