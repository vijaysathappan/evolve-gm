import os
import requests
from dotenv import load_dotenv

load_dotenv()

async def generate_llm_response(query: str, history: list = None) -> str:
    api_key = "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"
    model_name = "nousresearch/hermes-3-llama-3.1-405b:free"

    if not api_key:
        return "API key missing."

    system_prompt = (
        "You are Evolve Master Teacher. Explain clearly and naturally. "
        "Use <span class='mark-gold'> for key terms. Keep under 100 tokens."
    )

    llm_messages = [{"role": "system", "content": system_prompt}]

    if history:
        for entry in history[-4:]:
            if "query" in entry and "response" in entry:
                llm_messages.append({"role": "user", "content": entry["query"]})
                llm_messages.append({"role": "assistant", "content": entry["response"]})

    llm_messages.append({"role": "user", "content": query})

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model_name,   # ✅ correct
                "messages": llm_messages,   # ✅ correct
                "temperature": 0,
                "top_p": 1,
                "max_tokens": 500
            },
        )

        if response.status_code != 200:
            return f"OpenRouter Error {response.status_code}: {response.text}"

        res = response.json()
        return res["choices"][0]["message"]["content"]

    except Exception as e:
        return f"Error: {str(e)}"