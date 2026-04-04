import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def generate_llm_response(query: str, history: list = None) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    model_name = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

    if not api_key:
        return "Teacher System Error: API key missing."

    system_prompt = (
        "You are Evolve Master Teacher. Explain clearly and naturally. "
        "Use <span class='mark-gold'> for key terms. Keep under 100 tokens."
    )

    llm_messages = [{"role": "system", "content": system_prompt}]

    if history:
        for entry in history[-4:]:
            llm_messages.append({"role": "user", "content": entry["query"]})
            llm_messages.append({"role": "assistant", "content": entry["response"]})

    llm_messages.append({"role": "user", "content": query})

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model_name,
                "messages": llm_messages,
                "temperature": 0,
                "top_p": 0.1,
                "max_tokens": 120,
            },
            timeout=30
        )

        res = response.json()
        return res["choices"][0]["message"]["content"]

    except Exception as e:
        return "Teacher System Error: Request failed."