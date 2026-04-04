import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def generate_llm_response(query: str, history: list = None) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    # FIX: Use a confirmed free model ID
    model_name = os.getenv("OPENROUTER_MODEL", "nousresearch/hermes-3-llama-3.1-405b:free")

    if not api_key:
        return "Teacher System Error: API key missing."

    system_prompt = (
        "You are Evolve Master Teacher. Explain clearly and naturally. "
        "Use <span class='mark-gold'> for key terms. Keep under 100 tokens."
    )

    llm_messages = [{"role": "system", "content": system_prompt}]

    if history:
        for entry in history[-4:]:
            # Ensure keys exist to prevent crashes
            if "query" in entry and "response" in entry:
                llm_messages.append({"role": "user", "content": entry["query"]})
                llm_messages.append({"role": "assistant", "content": entry["response"]})

    llm_messages.append({"role": "user", "content": query})

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://evolve-gm.vercel.app", # MANDATORY for OpenRouter
                "X-Title": "Evolve GM" # MANDATORY for OpenRouter
            },
            json={
                "model": model_name,
                "messages": llm_messages,
                "temperature": 0.5,
                "top_p": 0.9,
                "max_tokens": 150,
            },
            timeout=30
        )

        # FIX: See the actual error if it fails (401, 404, etc)
        if response.status_code != 200:
            return f"OpenRouter Error {response.status_code}: {response.text}"

        res = response.json()
        return res["choices"][0]["message"]["content"]

    except Exception as e:
        # Show the real error so we can debug it
        return f"Teacher System Error: {str(e)}"
