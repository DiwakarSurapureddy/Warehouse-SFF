import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'smartfulfill-super-secret-production-key-2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-smartfulfill-ultra-secure-key-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    
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
