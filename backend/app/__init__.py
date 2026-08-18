import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config
from app.models.models import db

def create_app(config_class=Config):
    # Setup static folder pointing to the frontend dist folder
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))
    app = Flask(__name__, static_folder=frontend_dir)
    app.config.from_object(config_class)

    # Validate production secrets early — fails loudly on Render if not set.
    try:
        config_class.validate_production_secrets()
    except AttributeError:
        pass  # Config subclasses without the method are fine.

    # Initialize extensions
    frontend_url = app.config.get('FRONTEND_URL', '*')
    if frontend_url == '*':
        cors_origins = '*'
    else:
        # Support comma-separated list of allowed origins
        cors_origins = [u.strip() for u in frontend_url.split(',') if u.strip()]

    CORS(app, resources={r"/api/*": {"origins": cors_origins}})
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

    # Serve React App
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'SmartFulfill AI Backend Core',
            'version': '1.0.0'
        }), 200

    # Auto-create tables and seed if the database is empty.
    # This ensures a fresh Render deploy is always usable without a manual seeding step.
    with app.app_context():
        db.create_all()
        _auto_seed_if_empty()

    return app


def _auto_seed_if_empty():
    """Seed the database with demo data if no users exist yet."""
    from app.models.models import User
    try:
        if User.query.count() == 0:
            import sys
            import os
            # Add backend root to path for seed module
            backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if backend_root not in sys.path:
                sys.path.insert(0, backend_root)
            from seed.seed_data import seed_with_context
            print("[STARTUP] Database is empty — running auto-seed...")
            seed_with_context()
            print("[STARTUP] Auto-seed complete.")
    except Exception as e:
        # Do not crash the app if seeding fails — log the error and continue.
        print(f"[STARTUP WARNING] Auto-seed skipped or failed: {e}")
