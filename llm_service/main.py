from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio

# Import the granular modules for AI logic and Edge Security
from agent import generate_llm_response
from security import validate_query_security

app = FastAPI(title="Evolve GM LLM API", description="Python production-grade LLM inference layer")

# Allow CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in absolute production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import Optional
from database import get_session_history_async, save_message_to_session_async, get_user_personalization_async

class QueryRequest(BaseModel):
    query: str = Field(..., description="The user's query sent to Evolve GM")
    chat_data_id: Optional[str] = Field(None, description="The session ID (UUID) from the frontend")
    user_id: Optional[str] = Field(None, description="The user ID (UUID)")
    image_base64: Optional[str] = Field(None, description="Optional base64 encoded image data")
    chat_type: Optional[str] = Field(None, description="Optional chat type (e.g., 'solve')")

@app.post("/api/query")
async def generate_response(request: QueryRequest):
    try:
        # 1. Edge Security Validation
        safe_query = validate_query_security(request.query)
        
        # 2. Retrieve history context if session exists
        history = []
        if request.chat_data_id:
            history = await get_session_history_async(request.chat_data_id)
        
        # 3. Generate response (now with history context)
        res_obj = await generate_llm_response(safe_query, history, request.image_base64)
        text = res_obj["text"]
        usage = res_obj["usage"]
        
        # 4. Save the interaction back to the session row in Supabase
        if request.chat_data_id:
            await save_message_to_session_async(request.chat_data_id, safe_query, text, request.user_id, usage, request.chat_type)
            
        return {"text": text, "usage": usage}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"API Internal Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process AI query: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "llm_agent"}

import os
import json

# Use /tmp in Vercel/production for writable cache, otherwise use relative path
is_vercel = os.getenv("VERCEL") == "1" or not os.path.exists("C:/Projects")
CACHE_DIR = "/tmp/llm_content" if is_vercel else os.path.join(os.path.dirname(__file__), "..", "utils", "llm_content")
os.makedirs(CACHE_DIR, exist_ok=True)

def get_cache_path(subject: str, chapter: str, sec_idx: int) -> str:
    # Normalize subject → e.g. "Physics" → "physics"
    sub_clean = "".join([c if c.isalnum() else "_" for c in subject.lower()]).strip("_")
    # Normalize chapter to short key: use only the first word group of digits found,
    # e.g. "Class 11 Chapter 1: Units and Measurement" → "class_11_chapter_1"
    import re
    ch_short = re.sub(r'[^a-z0-9]+', '_', chapter.lower())
    # Keep only up to the first content-word after known structure keywords
    parts = ch_short.strip('_').split('_')
    key_parts = []
    for p in parts:
        if p in ('units', 'measurement', 'system', 'physics', 'chemistry', 'mathematics', 'biology'):
            break
        key_parts.append(p)
    ch_clean = '_'.join(key_parts).strip('_') if key_parts else ch_short[:30].strip('_')
    return os.path.join(CACHE_DIR, f"{sub_clean}_{ch_clean}_section_{sec_idx}.json")

async def generate_and_cache_section(subject: str, chapter: str, sec_title: str, raw_text: str, sec_idx: int, user_id: str = None):
    cache_path = get_cache_path(subject, chapter, sec_idx)
    if os.path.exists(cache_path):
        return None

    print(f"[PRE-FETCH] Generating explanations for Section {sec_idx}: {sec_title}...", flush=True)
    
    personalization = None
    if user_id:
        personalization = await get_user_personalization_async(user_id)
        
    personalization_prompt = ""
    if personalization:
        personalization_prompt = (
            f"\nIMPORTANT: Tailor the explanations for a student with the following personalization profile:\n"
            f"{json.dumps(personalization, indent=2)}\n"
            f"Make sure to use analogies, tone, or depth that matches their profile."
        )
        
    paragraphs = [p.strip() for p in raw_text.split('\n\n') if p.strip()]
    if not paragraphs:
        paragraphs = [raw_text.strip()]
        
    sentences_per_para = "4-6 sentences" if len(paragraphs) <= 3 else "2-3 sentences"
    paragraphs_context = "\n\n".join([f"Paragraph {i+1}:\n{p}" for i, p in enumerate(paragraphs)])

    prompt = (
        f"You are Evolve AI Tutor — a warm, enthusiastic best-friend tutor who explains physics like chatting with a friend over coffee.\n"
        f"We are studying the section: '{sec_title}' from Class 11 Physics.\n"
        f"Here are the textbook paragraphs of this section:\n"
        f"\"\"\"\n{paragraphs_context}\n\"\"\"\n\n"
        f"Your job: Generate a friendly, conversational spoken-audio explanation for each paragraph, like a knowledgeable friend explaining it aloud.\n"
        f"Requirements:\n"
        f"1. Talk like a friend — warm, casual, encouraging. Use phrases like 'okay so imagine this...', 'think of it like...', 'here's the cool part...', 'now here's where it gets interesting...', 'basically what this means is...'. Do NOT sound like a formal textbook or lecture.\n"
        f"2. Write in clear, natural English only. Use simple everyday words.\n"
        f"3. For each paragraph, give a vivid real-life analogy the student can picture instantly. Use references to sports, gaming, cars, cooking, music, or everyday tech that a teenage student would relate to.\n"
        f"4. Make each explanation rich and thorough ({sentences_per_para} of spoken-audio-friendly sentences). Imagine the student is listening, not reading.\n"
        f"5. CRITICAL: No math symbols, no LaTeX, no square brackets, no superscripts. Write ALL math in simple spoken English: 'M raised to the power 0, L cubed, T to the minus 2' or 'Mass times velocity squared'. No formulas in symbol form.\n"
        f"6. No bullet points, no colons starting lists, no markdown. Pure flowing conversational paragraphs only.\n"
        f"7. Return the response as a JSON array of strings, one string per paragraph in order (e.g., [\"explanation for paragraph 1\", \"explanation for paragraph 2\", ...]). No original paragraph text.\n"
        f"{personalization_prompt}\n"
        f"Ensure the output is valid JSON. Do not include markdown wraps like ```json. Just return raw JSON."
    )
    
    try:
        res_obj = await generate_llm_response(prompt, None, None)
        text = res_obj["text"]
        
        clean_text = text.strip()
        if "```json" in clean_text:
            clean_text = clean_text.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```", 1)[1].split("```", 1)[0].strip()
        
        if "[" in clean_text and "]" in clean_text:
            first_bracket = clean_text.find("[")
            last_bracket = clean_text.rfind("]")
            clean_text = clean_text[first_bracket:last_bracket+1]
            
        data = json.loads(clean_text)
        
        # Format as list of objects expected by the frontend
        formatted_data = []
        for i, p in enumerate(paragraphs):
            exp = data[i] if i < len(data) else "மன்னிக்கவும், இந்த பத்தியை விளக்குவதில் சிறு தடுமாற்றம்."
            formatted_data.append({"paragraph": p, "explanation": exp})
        
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(formatted_data, f, ensure_ascii=False, indent=2)
            
        print(f"[PRE-FETCH] Section {sec_idx} cached successfully.", flush=True)
        return formatted_data
    except Exception as e:
        print(f"[PRE-FETCH ERROR] Failed to cache section {sec_idx}: {e}", flush=True)
        return None

async def prefetch_sections_task(subject: str, chapter: str, sections_list: list, indices: list, user_id: str = None):
    tasks = []
    for idx in indices:
        if 0 <= idx < len(sections_list):
            sec = sections_list[idx]
            tasks.append(generate_and_cache_section(subject, chapter, sec["title"], sec["raw_text"], idx, user_id))
    if tasks:
        await asyncio.gather(*tasks)

class LearnGenerateRequest(BaseModel):
    subject: str = Field(..., description="Subject name")
    chapter: str = Field(..., description="Chapter name")
    user_id: Optional[str] = Field(None, description="The user's ID for personalization")

class LearnDoubtRequest(BaseModel):
    subject: str = Field(..., description="Subject name")
    chapter: str = Field(..., description="Chapter name")
    doubt: str = Field(..., description="The user's question")
    context: str = Field("", description="Previous chat context")
    user_id: Optional[str] = Field(None, description="The user's ID for personalization")

class ExplainSectionRequest(BaseModel):
    section_title: str = Field(..., description="Section title")
    raw_text: str = Field(..., description="Raw text of the section")
    user_id: Optional[str] = Field(None, description="The user's ID for personalization")
    subject: str = Field(..., description="Subject name")
    chapter: str = Field(..., description="Chapter name")
    sections: list = Field(..., description="All sections list for pre-fetching")
    active_idx: int = Field(..., description="Active section index")

@app.post("/api/learn/generate")
async def learn_generate(request: LearnGenerateRequest, background_tasks: BackgroundTasks):
    try:
        # Load local JSON file using relative path
        txt_path = os.path.join(os.path.dirname(__file__), "..", "utils", "extracted_data", "physics_class11_chapter1.txt")
        with open(txt_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        chapter_title = list(data.keys())[0]
        chapter_data = data[chapter_title]
        
        sections = []
        
        def format_section(title, val):
            return {
                "title": title,
                "raw_text": val.get("raw_text", ""),
                "table": val.get("table"),
                "example_sums": val.get("example_sums"),
                "unsolved_sums": val.get("unsolved_sums")
            }

        for sec_title, sec_val in chapter_data.items():
            if sec_title in ["Summary", "Exercises"]:
                sections.append(format_section(sec_title, sec_val))
                continue
                
            sub_sections = sec_val.get("sub_sections")
            if sub_sections:
                if sec_val.get("raw_text", "").strip():
                    sections.append(format_section(sec_title, {
                        "raw_text": sec_val.get("raw_text"),
                        "table": sec_val.get("table"),
                        "example_sums": sec_val.get("example_sums")
                    }))
                for sub_title, sub_val in sub_sections.items():
                    sections.append(format_section(sub_title, sub_val))
            else:
                sections.append(format_section(sec_title, sec_val))
                
        # Start pre-fetching Section 1 (index 0) and Section 2 (index 1) in the background
        background_tasks.add_task(prefetch_sections_task, request.subject, request.chapter, sections, [0, 1], request.user_id)
        
        return {
            "chapter_title": chapter_title,
            "pdf_url": "/api/books/physics_class11_chapter1.pdf",
            "sections": sections
        }
            
    except Exception as e:
        print(f"Learn API Generate Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load local chapter.")

@app.post("/api/learn/explain-section")
async def explain_section(request: ExplainSectionRequest, background_tasks: BackgroundTasks):
    try:
        # Trigger background pre-fetching for active_idx + 2 and active_idx + 3
        background_tasks.add_task(
            prefetch_sections_task,
            request.subject,
            request.chapter,
            request.sections,
            [request.active_idx + 2, request.active_idx + 3],
            request.user_id
        )

        cache_path = get_cache_path(request.subject, request.chapter, request.active_idx)
        
        # Check if cached file exists
        if os.path.exists(cache_path):
            print(f"[CACHE HIT] Loading Section {request.active_idx} from {cache_path}...", flush=True)
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {"explanations": data}
            
        # Cache miss: generate explanations
        # Fetch user personalization
        personalization = None
        if request.user_id:
            personalization = await get_user_personalization_async(request.user_id)
            
        personalization_prompt = ""
        if personalization:
            personalization_prompt = (
                f"\nIMPORTANT: Tailor the explanations for a student with the following personalization profile:\n"
                f"{json.dumps(personalization, indent=2)}\n"
                f"Make sure to use analogies, tone, or depth that matches their profile."
            )
            
        # Split raw text into paragraphs to explain concept-by-concept
        paragraphs = [p.strip() for p in request.raw_text.split('\n\n') if p.strip()]
        
        # If no paragraphs found (e.g. single block of text), default to the whole text
        if not paragraphs:
            paragraphs = [request.raw_text.strip()]
            
        sentences_per_para = "4-6 sentences" if len(paragraphs) <= 3 else "2-3 sentences"
        # Create a numbered list of paragraphs for prompt context
        paragraphs_context = "\n\n".join([f"Paragraph {i+1}:\n{p}" for i, p in enumerate(paragraphs)])

        prompt = (
            f"You are Evolve AI Tutor — a warm, enthusiastic best-friend tutor who explains physics like chatting with a friend over coffee.\n"
            f"We are studying the section: '{request.section_title}' from Class 11 Physics.\n"
            f"Here are the textbook paragraphs of this section:\n"
            f"\"\"\"\n{paragraphs_context}\n\"\"\"\n\n"
            f"Your job: Generate a friendly, conversational spoken-audio explanation for each paragraph, like a knowledgeable friend explaining it aloud.\n"
            f"Requirements:\n"
            f"1. Talk like a friend — warm, casual, encouraging. Use phrases like 'okay so imagine this...', 'think of it like...', 'here is the cool part...', 'now here is where it gets interesting...', 'basically what this means is...'. Do NOT sound like a formal textbook or lecture.\n"
            f"2. Write in clear, natural English only. Use simple everyday words.\n"
            f"3. For each paragraph, give a vivid real-life analogy the student can picture instantly. Use references to sports, gaming, cars, cooking, music, or everyday tech that a teenage student would relate to.\n"
            f"4. Make each explanation rich and thorough ({sentences_per_para} of spoken-audio-friendly sentences). Imagine the student is listening, not reading.\n"
            f"5. CRITICAL: No math symbols, no LaTeX, no square brackets, no superscripts. Write ALL math in simple spoken English: 'M raised to the power 0, L cubed, T to the minus 2' or 'Mass times velocity squared'. No formulas in symbol form.\n"
            f"6. No bullet points, no colons starting lists, no markdown. Pure flowing conversational paragraphs only.\n"
            f"7. Return the response as a JSON array of strings, one string per paragraph in order (e.g., [\"explanation for paragraph 1\", \"explanation for paragraph 2\", ...]). No original paragraph text.\n"
            f"{personalization_prompt}\n"
            f"Ensure the output is valid JSON. Do not include markdown wraps like ```json. Just return raw JSON."
        )
        
        res_obj = await generate_llm_response(prompt, None, None)
        text = res_obj["text"]
        
        # Parse the JSON string
        try:
            clean_text = text.strip()
            
            # Extract JSON block if it is wrapped in markdown code blocks
            if "```json" in clean_text:
                clean_text = clean_text.split("```json", 1)[1].split("```", 1)[0].strip()
            elif "```" in clean_text:
                clean_text = clean_text.split("```", 1)[1].split("```", 1)[0].strip()
            
            # Trim to the outermost brackets to bypass any leading/trailing text
            if "[" in clean_text and "]" in clean_text:
                first_bracket = clean_text.find("[")
                last_bracket = clean_text.rfind("]")
                clean_text = clean_text[first_bracket:last_bracket+1]
                
            data = json.loads(clean_text)
            
            # Format as list of objects expected by the frontend
            formatted_data = []
            for i, p in enumerate(paragraphs):
                exp = data[i] if i < len(data) else "மன்னிக்கவும், இந்த பத்தியை விளக்குவதில் சிறு தடுமாற்றம்."
                formatted_data.append({"paragraph": p, "explanation": exp})
            
            # Save to cache
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(formatted_data, f, ensure_ascii=False, indent=2)
                
            return {"explanations": formatted_data}
        except Exception as parse_err:
            print(f"Failed to parse LLM JSON: {parse_err}. Content: {text}", flush=True)
            raise Exception("Parsing error")
            
    except Exception as e:
        print(f"Error explaining section: {e}", flush=True)
        # Fallback split if LLM failed or is offline
        paragraphs = [p.strip() for p in request.raw_text.split('\n\n') if p.strip()]
        if not paragraphs:
            paragraphs = [request.raw_text.strip()]
        explanations = []
        for p in paragraphs:
            explanations.append({
                "paragraph": p,
                "explanation": f"மன்னிக்கவும், இந்த பகுதியை விளக்குவதில் சிறு தடுமாற்றம். இதோ இந்த பத்தியில் கூறப்பட்டுள்ள கருத்துக்களை விளக்குகிறேன். ஏதேனும் சந்தேகம் இருந்தால் தாராளமாக கேட்கலாம்."
            })
        return {"explanations": explanations}

@app.post("/api/learn/doubt")
async def learn_doubt(request: LearnDoubtRequest):
    try:
        personalization = None
        if request.user_id:
            personalization = await get_user_personalization_async(request.user_id)
            
        personalization_prompt = ""
        if personalization:
            personalization_prompt = (
                f"\nIMPORTANT: Tailor the doubt response for a student with the following personalization profile:\n"
                f"{json.dumps(personalization, indent=2)}\n"
                f"Use explanations, analogies, and a tone that matches their background."
            )
            
        prompt = (
            f"You are Evolve AI Tutor — a warm, friendly tutor who answers student doubts like a knowledgeable friend.\n"
            f"The student is asking a doubt about Subject: '{request.subject}', Chapter: '{request.chapter}'.\n"
            f"The student asked: '{request.doubt}'\n"
            f"Here is the conversation context so far:\n{request.context}\n\n"
            f"Give a warm, clear, conversational answer. Requirements:\n"
            f"1. Explain the physics concept behind the doubt in simple, friendly terms — like you are texting a smart friend who just needs a quick clear explanation.\n"
            f"2. Write in natural English only. Use everyday analogies — sports, gaming, cars, cooking, music, phones — that a teenager would instantly relate to.\n"
            f"3. Be encouraging and reassuring. Show you understand why they might be confused, then clear it up step by step.\n"
            f"4. CRITICAL: No math symbols, no LaTeX, no square brackets, no superscripts. Write all math in spoken English like 'force equals mass times acceleration'. Keep it speech-friendly.\n"
            f"{personalization_prompt}"
        )
        res_obj = await generate_llm_response(prompt, None, None)
        return {"answer": res_obj["text"]}
    except Exception as e:
        print(f"Learn API Doubt Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to answer doubt.")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
