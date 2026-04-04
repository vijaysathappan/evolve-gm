import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

async def generate_llm_response(query: str, history: list = None) -> str:
    # Ensure this is set in Vercel settings!
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return "Teacher System Error: GEMINI_API_KEY missing."

    genai.configure(api_key=api_key)

    # ✅ FIXED: Valid, existing high-speed model
    model = genai.GenerativeModel("gemini-3.1-flash-lite-preview")

    system_prompt = (
        "You are Evolve Master Teacher. Explain clearly and naturally. "
        "Use <span class='mark-gold'> for key terms. Keep under 100 tokens."
    )

    chat_history = []
    if history:
        for entry in history[-4:]:
            if "query" in entry and "response" in entry:
                chat_history.append({"role": "user", "parts": [entry["query"]]})
                chat_history.append({"role": "model", "parts": [entry["response"]]})

    try:
        chat = model.start_chat(history=chat_history)

        prompt_with_persona = f"{system_prompt}\n\nUser Question: {query}"
        
        response = chat.send_message(
            prompt_with_persona,
            generation_config={
                "temperature": 0.5,
                "max_output_tokens": 150
            }
        )

        return response.text

    except Exception as e:
        return f"Teacher System Error (Gemini): {str(e)}"