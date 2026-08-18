from flask import Blueprint, request, jsonify
from app.services.simulator_service import SimulatorService

simulator_bp = Blueprint('simulator', __name__, url_prefix='/api/simulator')

@simulator_bp.route('/presets', methods=['GET'])
def get_presets():
    return jsonify({
        'presets': SimulatorService.SCENARIO_PRESETS
    }), 200

@simulator_bp.route('/run', methods=['POST'])
def run_simulation():
    data = request.get_json(silent=True) or {}
    res = SimulatorService.run_simulation(data)
    return jsonify(res), 200
