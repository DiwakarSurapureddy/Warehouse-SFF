from flask import Blueprint, request, jsonify
from app.ai.copilot_service import CopilotService

copilot_bp = Blueprint('copilot', __name__, url_prefix='/api/copilot')

@copilot_bp.route('/query', methods=['POST'])
def query_copilot():
    data = request.get_json() or {}
    query_text = data.get('query', '').strip()
    if not query_text:
        return jsonify({'error': 'Query text is required'}), 400

    res = CopilotService.answer_query(query_text)
    return jsonify(res), 200

@copilot_bp.route('/context', methods=['GET'])
def get_copilot_context():
    context = CopilotService.get_warehouse_context_summary()
    return jsonify({'context': context}), 200
