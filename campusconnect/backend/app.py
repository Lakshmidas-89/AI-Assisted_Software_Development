import os

from flask import Flask, jsonify

from api import api
from config import Config
from db import init_app as init_db_app
from db import init_db
from extensions import cors
from seed import seed_events


def create_app(config_class=Config, **overrides):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.config.update(overrides)

    origins = os.environ.get(
        "FRONTEND_ORIGIN",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    origin.strip() for origin in origins.split(",") if origin.strip()
                ]
            }
        },
    )

    init_db_app(app)
    app.register_blueprint(api)

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(_error):
        return jsonify({"error": "Method not allowed."}), 405

    with app.app_context():
        init_db()
        if app.config.get("SEED_DATA", True):
            seed_events()

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(
        host="127.0.0.1",
        port=int(os.environ.get("PORT", 5000)),
        debug=True,
    )
