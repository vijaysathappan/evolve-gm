import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def generate_llm_response(query: str, history: list = None) -> str:
    """
    Handles communication with OpenRouter LLM with 'Master Teacher: Chat Mode'.
    Provides answers in a natural conversational flow.
    """
    # Dynamic retrieval to ensure production-grade env updates on Vercel
    api_key = os.getenv("OPENROUTER_API_KEY")
    model_name = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-70b-instruct")

    # Safe Diagnostic Info for the user
    key_diag = "MISSING"
    if api_key:
        key_diag = f"{api_key[:3]}...{api_key[-3:]}"

    if not api_key:
        return f"Teacher System Error: OPENROUTER_API_KEY is not defined in Vercel settings (Diagnostic: {key_diag})"

    # 1. Build Message List
    system_prompt = (
        "You are 'Evolve Master Teacher', a friendly and expert academic mentor. "
        "Your goal is to explain concepts clearly and conversationally, as if in a chat app. "
        "CRITICAL INSTRUCTION: DO NOT IMITATE THE STYLE OF PREVIOUS MESSAGES IN THE HISTORY. "
        "STOP using '### TOPIC', 'FOUNDATIONAL ARCHITECTURE', or 'ELITE COMMANDER' headings immediately. "
        "RULES:\n"
        "- Respond directly and naturally. Be warm and encouraging.\n"
        "- Use a standard list or bolding only if it makes a complex technical point clearer.\n"
        "- Highlight critical terms in `<span class='mark-gold'>term</span>`.\n"
        "- Highlight strategic examples in `<span class='mark-teal'>term</span>`.\n"
        "- Be comprehensive but never robotic."
        "- Make the output response less than 100 tokens"
    )

    llm_messages = [{"role": "system", "content": system_prompt}]
    
    # Add previous history (Only last 4 entries to reduce prompt processing time)
    if history:
        for entry in history[-1:]:
            if "query" in entry and "response" in entry:
                llm_messages.append({"role": "user", "content": entry["query"]})
                llm_messages.append({"role": "assistant", "content": entry["response"]})
    
    # Add current query
    llm_messages.append({"role": "user", "content": query})

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model_name,
                "messages": llm_messages,
                "temperature": 0, 
                "top_p": 0.1,
                "max_tokens": 512,
                "stream": False # Set to True for future streaming implementation
            },
            timeout=10 # Ensure request doesn't hang long
        )
        
        response.raise_for_status()
        res = response.json()
        
        if "choices" in res and len(res["choices"]) > 0:
            return res["choices"][0]["message"]["content"]
        else:
            return "Even a Master Teacher needs a moment. I encountered a minor sync issue with the system."
            
    except Exception as e:
        print(f"LLM Error: {e}")
        return f"Teacher System Error: {str(e)} | Key Signature: {key_diag}. (Tip: Ensure you have Redeployed on Vercel after adding keys and check for extra spaces in the key string.)"
