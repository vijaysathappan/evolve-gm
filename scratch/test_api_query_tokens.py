import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
model_name = os.getenv("OPENROUTER_MODEL")

print(f"API Key: {api_key[:10]}... if exists" if api_key else "No API key found")
print(f"Model Name: {model_name}")

system_prompt = (
    "You are Evolve Master Teacher. Explain clearly and naturally. "
    "Use <span class='mark-gold'> for key terms. Keep under 100 tokens."
)
messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": "i wanted to learn more on physics chapter 1"}
]

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
payload = {
    "model": model_name,
    "messages": messages,
    "temperature": 0.5,
    "max_tokens": 1000  # Increased from 150
}

start_time = time.time()
try:
    print("Sending request with max_tokens=1000...")
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=30  # Increased from 10
    )
    elapsed = time.time() - start_time
    print(f"Time taken: {elapsed:.2f} seconds")
    print(f"Status Code: {response.status_code}")
    res_json = response.json()
    choices = res_json.get("choices", [])
    if choices:
        msg = choices[0].get("message", {})
        print("Reasoning:")
        print(msg.get("reasoning"))
        print("\nContent:")
        print(msg.get("content"))
    else:
        print("No choices returned.")
except Exception as e:
    elapsed = time.time() - start_time
    print(f"Time taken before error: {elapsed:.2f} seconds")
    print(f"Error: {e}")
