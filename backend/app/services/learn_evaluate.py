import json
from app.core.prompts import EVALUATE_CONCEPT_NEXT_PROMPT, EVALUATE_CONCEPT_RETRY_PROMPT
from app.services.llm_client import generate_llm_response

async def evaluate_and_generate_next(
    subject: str, 
    chapter_name: str, 
    current_concept_index: int, 
    user_answer_index: int, 
    all_sections: list, 
    personalization: str, 
    question_data: dict
) -> tuple[bool, dict, bool]:
    """
    Returns (is_complete, concept_data, is_correct)
    """
    is_correct = user_answer_index == question_data.get("answer_index", 0)

    if not is_correct:
        # Re-teach
        current_concept_raw = all_sections[current_concept_index]
        prompt = EVALUATE_CONCEPT_RETRY_PROMPT.format(
            subject=subject,
            chapter_name=chapter_name,
            title=current_concept_raw['title'],
            failed_question_text=question_data.get('text'),
            personalization=personalization
        )
    else:
        # Generate NEXT
        next_index = current_concept_index + 1
        if next_index >= len(all_sections):
            return True, None, True
            
        next_concept_raw = all_sections[next_index]
        prompt = EVALUATE_CONCEPT_NEXT_PROMPT.format(
            subject=subject,
            chapter_name=chapter_name,
            title=next_concept_raw['title'],
            raw_text=next_concept_raw['raw_text'],
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
        return False, None, False
    
    return False, concept_data, is_correct
