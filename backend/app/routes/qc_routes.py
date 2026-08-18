import json
from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from app.models.models import db, QualityCheck, Order, ExceptionRecord, AuditLog

qc_bp = Blueprint('qc', __name__, url_prefix='/api/qc')

@qc_bp.route('/checks', methods=['GET'])
def list_checks():
    status = request.args.get('status')
    query = QualityCheck.query
    if status and status != 'ALL':
        query = query.filter_by(status=status)

    checks = [q.to_dict() for q in query.order_by(QualityCheck.id.desc()).all()]
    return jsonify({'count': len(checks), 'quality_checks': checks}), 200

@qc_bp.route('/checks/<int:check_id>', methods=['GET'])
def get_check(check_id):
    qc = db.session.get(QualityCheck, check_id)
    if not qc:
        return jsonify({'error': 'QC check not found'}), 404
    
    qc_dict = qc.to_dict()
    if qc.order:
        qc_dict['order_items'] = [it.to_dict() for it in qc.order.items]
    return jsonify({'quality_check': qc_dict}), 200

@qc_bp.route('/checks/<int:check_id>/submit', methods=['POST'])
def submit_qc_result(check_id):
    qc = db.session.get(QualityCheck, check_id)
    if not qc:
        return jsonify({'error': 'QC check not found'}), 404
    data = request.get_json(silent=True) or {}
    status = data.get('status', 'PASS') # PASS, FAIL, HOLD
    sku_v = bool(data.get('sku_verified', True))
    qty_v = bool(data.get('quantity_verified', True))
    cond_v = bool(data.get('condition_verified', True))
    pack_v = bool(data.get('packaging_verified', True))
    lbl_v = bool(data.get('label_verified', True))
    notes = data.get('notes', '')
    user_id = data.get('user_id')

    now = datetime.now(timezone.utc)
    qc.status = status
    qc.sku_verified = sku_v
    qc.quantity_verified = qty_v
    qc.condition_verified = cond_v
    qc.packaging_verified = pack_v
    qc.label_verified = lbl_v
    qc.notes = notes
    qc.inspector_id = user_id
    qc.checked_at = now

    order = qc.order
    if status == 'PASS':
        if order:
            order.status = 'QC_PASSED'
    elif status in ['FAIL', 'HOLD']:
        if order:
            order.status = 'QC_FAILED'
        
        # Auto-create Exception
        failure_reasons = []
        if not sku_v: failure_reasons.append("Incorrect SKU verified in parcel")
        if not qty_v: failure_reasons.append("Quantity mismatch during parcel weight check")
        if not cond_v: failure_reasons.append("Product condition defect / visible damage")
        if not pack_v: failure_reasons.append("Packaging damaged / carton integrity breached")
        if not lbl_v: failure_reasons.append("Barcode label unreadable / missing carrier routing tag")

        reason_str = ", ".join(failure_reasons) if failure_reasons else notes or "Quality check inspection failure"

        exc = ExceptionRecord(
            order_id=order.id if order else None,
            exception_type='FAILED_QC',
            severity='HIGH',
            impact_summary=f"QC {status} on Order #{order.order_number if order else 'N/A'}: {reason_str}",
            ai_recommendation="Quarantine package, re-inspect items in secondary station, and repack in reinforced container Box-L.",
            resolution_status='OPEN',
            created_at=now
        )
        db.session.add(exc)

    audit = AuditLog(
        entity_type='QC',
        entity_id=f"QC-{qc.id}",
        action=f"QC_{status}",
        performed_by=f"Inspector #{user_id}" if user_id else 'QC Team',
        details_json=json.dumps({
            'status': status,
            'notes': notes,
            'order_number': order.order_number if order else ''
        })
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Quality Check marked as {status}",
        'quality_check': qc.to_dict()
    }), 200
