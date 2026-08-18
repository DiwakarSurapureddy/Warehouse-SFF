import os
from app import create_app
from app.config import Config

app = create_app(Config)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[SERVER] Starting SmartFulfill AI Backend Server on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
