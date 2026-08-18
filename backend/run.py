import os
from app import create_app
from app.config import Config

app = create_app(Config)

if __name__ == '__main__':
    # On Render: PORT is auto-injected by the platform.
    # Locally: defaults to 5000 if PORT is not set in .env.
    port = int(os.environ.get('PORT', 5000))
    print(f"[SERVER] Starting SmartFulfill AI Backend on 0.0.0.0:{port}")
    print(f"[SERVER] Local access: http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
