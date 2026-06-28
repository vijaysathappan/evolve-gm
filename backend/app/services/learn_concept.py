import json
from app.core.prompts import PERSONALIZE_START_PROMPT
from app.services.llm_client import generate_llm_response

async def generate_first_concept(subject: str, chapter_name: str, raw_content: dict, personalization: str) -> dict:
    sections_list = []
    
    # raw_content is like {"Chapter One: ...": {"1.1 Introduction": "text", ...}}
    if raw_content:
        for chap_key, chap_dict in raw_content.items():
            if isinstance(chap_dict, dict):
                for sec_title, sec_text in chap_dict.items():
                    if isinstance(sec_text, str):
                        sections_list.append({"title": sec_title, "raw_text": sec_text})
        
    if not sections_list:
        raise ValueError("No sections found in raw_content")

    first_concept = sections_list[0]
    
    prompt = PERSONALIZE_START_PROMPT.format(
        subject=subject,
        chapter_name=chapter_name,
        title=first_concept['title'],
        raw_text=first_concept['raw_text'],
        personalization=personalization
    )
    
    res_obj = await generate_llm_response(prompt)
    text = res_obj["text"].strip()
    
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()
        
    try:
        concept_data = json.loads(text)
    except:
        concept_data = {
            "title": first_concept['title'],
            "raw_text": first_concept['raw_text'],
            "question": None,
            "error": "Failed to parse JSON from LLM"
        }
        
    return concept_data, sections_list
