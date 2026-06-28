import json
from app.core.prompts import DOUBT_EVAL_PROMPT
from app.services.llm_client import generate_llm_response

async def evaluate_doubt(query: str, context: str, history: list) -> dict:
    prompt = DOUBT_EVAL_PROMPT.format(
        context=context,
        history="\n".join(history) if history else "No previous history.",
        query=query
    )
    
    res_obj = await generate_llm_response(prompt)
    text = res_obj["text"].strip()
    
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()
        
    try:
        data = json.loads(text)
        return data
    except:
        return {"answer": text, "intensity": "low"}
