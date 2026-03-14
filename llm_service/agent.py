import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

async def generate_llm_response(query: str) -> str:
    """
    Handles the actual communication with the Google Gemini LLM.
    This separates the core AI logic from the FastAPI routing layer.
    """
    if not api_key or api_key == "your_gemini_api_key_here":
        return f"[MOCK PYTHON AI]: Received your query: '{query}'. Please configure GEMINI_API_KEY in the python environment."
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = await model.generate_content_async(query)
        return response.text
    except Exception as e:
        print(f"LLM Error: {e}")
        raise e
