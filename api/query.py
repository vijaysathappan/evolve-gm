import os
import sys

# Add the llm_service directory directly to sys.path
# This allows 'main.py' to find 'agent.py', 'database.py', etc.
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "llm_service"))

from main import app
