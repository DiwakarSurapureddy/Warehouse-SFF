from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config
from app.models.models import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)
    db.init_app(app)

    # Register Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.order_routes import order_bp
    from app.routes.inventory_routes import inventory_bp
    from app.routes.allocation_routes import allocation_bp
    from app.routes.picking_routes import picking_bp
    from app.routes.packing_routes import packing_bp
    from app.routes.qc_routes import qc_bp
    from app.routes.exception_routes import exception_bp
    from app.routes.replenishment_routes import replenishment_bp
    from app.routes.analytics_routes import analytics_bp
    from app.routes.simulator_routes import simulator_bp
    from app.routes.copilot_routes import copilot_bp
    from app.routes.notification_routes import notification_bp
    from app.routes.audit_routes import audit_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(allocation_bp)
    app.register_blueprint(picking_bp)
    app.register_blueprint(packing_bp)
    app.register_blueprint(qc_bp)
    app.register_blueprint(exception_bp)
    app.register_blueprint(replenishment_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(simulator_bp)
    app.register_blueprint(copilot_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(audit_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'SmartFulfill AI Backend Core',
            'version': '1.0.0'
        }), 200

    return app
