import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Gemini API Key: {api_key[:10]}... if exists" if api_key else "No Gemini API key found")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content("Hello! Are you active?")
    print("Success!")
    print("Response text:", response.text)
except Exception as e:
    print("Gemini API call failed:", e)
