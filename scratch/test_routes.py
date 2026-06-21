import sys
sys.path.append("llm_service")
from main import app

print("Active Routes:")
for route in app.routes:
    print(f"- {route.path} [{route.methods}]")
