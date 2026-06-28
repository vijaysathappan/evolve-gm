import os
import google.generativeai as genai

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Warning: GEMINI_API_KEY not found in environment.")
else:
    genai.configure(api_key=api_key)

generation_config = {
  "temperature": 0.7,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
  model_name="gemini-2.5-pro",
  generation_config=generation_config,
)

async def generate_llm_response(prompt: str) -> dict:
    """
    Sends a prompt to the LLM and returns the text response.
    """
    try:
        response = await model.generate_content_async(prompt)
        return {"text": response.text}
    except Exception as e:
        print(f"LLM Error: {e}")
        return {"text": str(e)}
