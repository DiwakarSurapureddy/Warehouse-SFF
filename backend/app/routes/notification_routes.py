from flask import Blueprint, request, jsonify
from app.models.models import db, Notification

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
def list_notifications():
    unread_only = request.args.get('unread') == 'true'
    severity = request.args.get('severity')

    query = Notification.query
    if unread_only:
        query = query.filter_by(is_read=False)
    if severity and severity != 'ALL':
        query = query.filter_by(severity=severity)

    notifs = [n.to_dict() for n in query.order_by(Notification.created_at.desc()).limit(50).all()]
    unread_count = Notification.query.filter_by(is_read=False).count()

    return jsonify({
        'count': len(notifs),
        'unread_count': unread_count,
        'notifications': notifs
    }), 200

@notification_bp.route('/<int:notif_id>/read', methods=['POST'])
def mark_read(notif_id):
    notif = db.session.get(Notification, notif_id)
    if not notif:
        return jsonify({'error': 'Notification not found'}), 404

    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True, 'notification': notif.to_dict()}), 200

@notification_bp.route('/mark-all-read', methods=['POST'])
def mark_all_read():
    Notification.query.filter_by(is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'success': True, 'message': 'All notifications marked as read'}), 200
