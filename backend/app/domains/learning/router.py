from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

from app.core.db import supabase
from app.services.learn_concept import generate_first_concept
from app.services.learn_evaluate import evaluate_and_generate_next
from app.services.learn_doubt import evaluate_doubt

router = APIRouter(prefix="/api/learn", tags=["learn"])

class LearnPersonalizeStartRequest(BaseModel):
    user_id: str
    subject: str
    class_level: str
    chapter_name: str
    personalization: str

@router.post("/personalize_start")
async def personalize_start(request: LearnPersonalizeStartRequest) -> Any:
    res = supabase.table("learn_chapters").select("chapter_name, raw_content, pyq_weightage").eq("subject", request.subject).execute()
    
    chapter_data = None
    if res.data:
        for c in res.data:
            if c["chapter_name"].lower() in request.chapter_name.lower() or request.chapter_name.lower() in c["chapter_name"].lower():
                chapter_data = c
                break
                
    if not chapter_data:
        raise HTTPException(status_code=404, detail=f"Chapter '{request.chapter_name}' not found for subject {request.subject}")
        
    raw_content = chapter_data.get("raw_content", {})
    
    try:
        concept_data, all_sections = await generate_first_concept(
            subject=request.subject,
            chapter_name=request.chapter_name,
            raw_content=raw_content,
            personalization=request.personalization
        )
        
        session_id = f"session_{request.user_id}_{request.subject}_{request.chapter_name}".replace(" ", "_")
        
        # Save to student_learning_history
        try:
            existing = supabase.table("student_learning_history").select("id").eq("session_id", session_id).execute()
            if not existing.data:
                supabase.table("student_learning_history").insert({
                    "user_id": request.user_id,
                    "session_id": session_id,
                    "subject": request.subject,
                    "chapter_name": request.chapter_name,
                    "chapter_text": [concept_data],
                    "personalization_prompt": request.personalization
                }).execute()
            else:
                supabase.table("student_learning_history").update({
                    "chapter_text": [concept_data],
                    "personalization_prompt": request.personalization
                }).eq("session_id", session_id).execute()
        except Exception as db_err:
            print("DB warning (maybe column missing):", db_err)

        return {
            "session_id": session_id,
            "concept": concept_data,
            "all_sections": all_sections
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/raw_content")
async def get_raw_content(request: LearnPersonalizeStartRequest) -> Any:
    res = supabase.table("learn_chapters").select("chapter_name, raw_content").eq("subject", request.subject).execute()
    
    chapter_data = None
    if res.data:
        for c in res.data:
            if c["chapter_name"].lower() in request.chapter_name.lower() or request.chapter_name.lower() in c["chapter_name"].lower():
                chapter_data = c
                break
                
    if not chapter_data:
        raise HTTPException(status_code=404, detail=f"Chapter '{request.chapter_name}' not found for subject {request.subject}")
        
    raw_content = chapter_data.get("raw_content", {})
    
    sections = []
    if raw_content:
        for chap_key, chap_dict in raw_content.items():
            if isinstance(chap_dict, dict):
                for sec_title, sec_text in chap_dict.items():
                    if isinstance(sec_text, str):
                        sections.append({"title": sec_title, "raw_text": sec_text})

    if not sections:
        raise HTTPException(status_code=404, detail="No sections found in raw content")
    
    return {
        "concept": sections[0] if sections else None,
        "all_sections": sections
    }


class LearnEvaluateConceptRequest(BaseModel):
    user_id: str
    session_id: str
    subject: str
    chapter_name: str
    current_concept_index: int
    user_answer_index: int
    all_sections: list
    personalization: str
    question_data: dict

@router.post("/evaluate_concept")
async def evaluate_concept(request: LearnEvaluateConceptRequest) -> Any:
    is_complete, concept_data, is_correct = await evaluate_and_generate_next(
        subject=request.subject,
        chapter_name=request.chapter_name,
        current_concept_index=request.current_concept_index,
        user_answer_index=request.user_answer_index,
        all_sections=request.all_sections,
        personalization=request.personalization,
        question_data=request.question_data
    )
    
    if concept_data:
        try:
            res = supabase.table("student_learning_history").select("chapter_text").eq("session_id", request.session_id).execute()
            if res.data:
                chapter_text = res.data[0].get("chapter_text", []) or []
                chapter_text.append(concept_data)
                supabase.table("student_learning_history").update({"chapter_text": chapter_text}).eq("session_id", request.session_id).execute()
        except Exception as e:
            print(f"Error appending concept: {e}")

    return {"complete": is_complete, "concept": concept_data, "is_correct": is_correct}


class LearnDoubtRequest(BaseModel):
    query: str
    context: str
    history: list = []

@router.post("/doubt_eval")
async def learn_doubt_eval(request: LearnDoubtRequest) -> Any:
    return await evaluate_doubt(request.query, request.context, request.history)
