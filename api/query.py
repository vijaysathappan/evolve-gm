import os
import sys

# Add the project root to sys.path so we can import llm_service
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from llm_service.main import app
