from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.models import db, User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'manager')
    full_name = data.get('full_name', username)

    if not username or not email or not password:
        return jsonify({'error': 'Username, email and password are required'}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'error': 'Username or email already exists'}), 400

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
        full_name=full_name
    )
    db.session.add(user)
    db.session.commit()

    # Identity must be a string for Flask-JWT-Extended v4.6+
    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter((User.username == username) | (User.email == username)).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid username or password'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/demo-login/<role>', methods=['POST'])
def demo_login(role):
    """
    Convenience route for judges & hackathon testing to switch roles instantly.
    """
    valid_roles = ['admin', 'manager', 'picker', 'packer', 'inventory']
    role_norm = role.lower()
    if role_norm not in valid_roles:
        role_norm = 'manager'

    user = User.query.filter_by(role=role_norm).first()
    if not user:
        # Fallback to any user
        user = User.query.first()

    if not user:
        # DB is empty — seed hasn't run or failed on startup.
        return jsonify({
            'error': 'No users in the database. The seed data may not have loaded yet. '
                     'Please wait a moment and retry, or check the server logs.'
        }), 503

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': f'Logged in as {user.full_name} ({user.role})',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()  # Always a string since we set str(user.id)
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200
