import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# Hardcoded fallback values — intentionally kept for local development only.
_DEFAULT_SECRET = 'smartfulfill-super-secret-production-key-2026'
_DEFAULT_JWT_SECRET = 'jwt-smartfulfill-ultra-secure-key-2026'

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', _DEFAULT_SECRET)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', _DEFAULT_JWT_SECRET)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    # CORS — restrict to deployed frontend URL in production.
    # Set FRONTEND_URL env var on Render. Accepts comma-separated list.
    FRONTEND_URL = os.environ.get('FRONTEND_URL', '*')

    # SQLite Database
    DB_PATH = os.path.join(PROJECT_ROOT, 'smartfulfill.db')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{DB_PATH}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Optional Gemini AI API Key
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

    # Decision Engine Weights
    PRIORITY_WEIGHTS = {
        'critical': 50,
        'urgent': 35,
        'high': 25,
        'normal': 15,
        'low': 5
    }

    SLA_URGENCY_MAX_HOURS = 24
    MAX_DISTANCE_PENALTY = 20

    @classmethod
    def validate_production_secrets(cls):
        """
        Call this during app startup.
        Raises RuntimeError if insecure default secrets are used outside local development.
        """
        is_dev = os.environ.get('FLASK_ENV', 'production') == 'development'
        if not is_dev:
            if cls.SECRET_KEY == _DEFAULT_SECRET:
                raise RuntimeError(
                    "[SECURITY] SECRET_KEY is using the hardcoded default. "
                    "Set the SECRET_KEY environment variable in Render before deploying."
                )
            if cls.JWT_SECRET_KEY == _DEFAULT_JWT_SECRET:
                raise RuntimeError(
                    "[SECURITY] JWT_SECRET_KEY is using the hardcoded default. "
                    "Set the JWT_SECRET_KEY environment variable in Render before deploying."
                )
