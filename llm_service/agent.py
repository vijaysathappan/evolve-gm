import os
import sys
import google.generativeai as genai
import tiktoken
from dotenv import load_dotenv

load_dotenv()

def get_mock_response(query: str) -> str:
    query_lower = query.lower().strip()
    
    # Learn Mode Chapter Generator Fallback
    if "learn mode" in query_lower or "teacher persona" in query_lower:
        import json
        mock_chapter = {
            "content": "# Thermodynamics\n\nThermodynamics is the science of heat, work, and the transformations of energy.",
            "script": "Welcome to Thermodynamics! Today we will learn about temperature, heat, and energy.",
            "sections": [
                {
                    "title": "1. What is Thermodynamics?",
                    "content": "### What is Thermodynamics?\n\nThermodynamics is a branch of physics that studies the relationships between heat, work, temperature, and energy. It describes how thermal energy is converted to and from other forms of energy.",
                    "explanation": "Let's begin. Thermodynamics is simply the science of heat and work. Look at the description on the left. The word thermal refers to heat, and dynamics refers to movement or work."
                },
                {
                    "title": "2. Zero-th Law of Thermodynamics",
                    "content": "### The Zeroth Law\n\nIf two thermodynamic systems are each in thermal equilibrium with a third system, then they are in thermal equilibrium with each other. This law defines temperature.",
                    "explanation": "Now, let's explore the Zeroth Law. If System A and System B are both in thermal equilibrium with System C, then A and B are in equilibrium with each other. This is the foundation of temperature measurement."
                },
                {
                    "title": "3. First Law of Thermodynamics",
                    "content": "### The First Law\n\nThe First Law states that energy cannot be created or destroyed, only transformed from one form to another. Mathematically, it is expressed as:\n\n$$\\Delta U = Q - W$$\n\nWhere:\n- $\\Delta U$ is change in internal energy\n- $Q$ is heat added\n- $W$ is work done by system",
                    "explanation": "Moving on to the First Law of Thermodynamics. It is also known as the Law of Conservation of Energy. Energy can change forms, but the total energy of the universe remains constant."
                }
            ]
        }
        return json.dumps(mock_chapter)

    # Learn Mode Doubt Solver Fallback
    if "student doubt" in query_lower or "doubt-solving" in query_lower:
        return "That is a great question. Thermal equilibrium means there is no net exchange of heat between two systems in contact because they have reached the exact same temperature. Does that make sense?"

    # 1. Greetings
    if query_lower in ["hi", "hello", "hey", "hola"]:
        return (
            "Hello! I am your <span class='mark-gold'>Evolve Master Teacher</span>. "
            "How can I assist you with your prep today? You can select one of the quick suggestions "
            "below (like <span class='mark-gold'>Explain</span> or <span class='mark-gold'>Quiz Me</span>) or ask any specific question."
        )
        
    if "who are you" in query_lower or "your name" in query_lower:
        return (
            "I am the <span class='mark-gold'>Evolve AI chatbot</span>, specialized in helping you master "
            "your school, <span class='mark-gold'>JEE</span>, and <span class='mark-gold'>NEET</span> syllabi."
        )
        
    # 2. Suggestion: Explain
    if "explain the concept of" in query_lower or "explain" in query_lower:
        topic = query.replace("Explain the concept of", "").replace("explain the concept of", "").replace("Explain", "").replace("explain", "").strip("[] ")
        if not topic or topic == "insert topic":
            topic = "your chosen physics/chemistry topic"
        return (
            f"Here is a breakdown of <span class='mark-gold'>{topic}</span>:\n\n"
            f"1. **Core Principle**: In simple terms, this represents how systems conserve energy and momentum when subjected to internal or external forces.\n"
            f"2. **Mathematical Formulation**: Typically modeled by standard differential equations, where the change in state depends directly on the system's current state.\n"
            f"3. **Practical Application**: This concept is fundamental to solving kinematics, thermodynamics, and electromagnetic problems in standard entrance exams."
        )

    # 3. Suggestion: Solve
    if "solve this problem" in query_lower or "solve" in query_lower:
        prob = query.replace("Solve this problem step-by-step:", "").replace("solve this problem step-by-step:", "").replace("Solve", "").replace("solve", "").strip("[] ")
        if not prob or prob == "insert equation or problem":
            prob = "the given system of equations"
        return (
            f"Let's solve <span class='mark-gold'>{prob}</span> step-by-step:\n\n"
            f"**Step 1: Identify Known Variables**\n"
            f"Isolate the constants and variables on either side. Check for boundary conditions.\n\n"
            f"**Step 2: Apply Fundamental Formula**\n"
            f"Using the conservation relation:\n"
            f"$$\\int F \\cdot dt = \\Delta P$$\n\n"
            f"**Step 3: Integrate and Calculate**\n"
            f"Substitute value constants. We arrive at the final simplified expression: <span class='mark-gold'>x = 2.54 \\text{{ units}}</span>."
        )

    # 4. Suggestion: Quiz
    if "create a 5-question" in query_lower or "quiz" in query_lower:
        topic = query.replace("Create a 5-question multiple choice quiz on", "").replace("create a 5-question multiple choice quiz on", "").replace("Quiz", "").replace("quiz", "").strip("[] ")
        if not topic or topic == "insert subject or topic":
            topic = "General Science"
        return (
            f"Here is a custom multiple-choice question to practice <span class='mark-gold'>{topic}</span>:\n\n"
            f"**Question 1**: Which of the following defines the rate of change of momentum?\n"
            f"- A) Kinetic Energy\n"
            f"- B) Force (Correct)\n"
            f"- C) Work Done\n"
            f"- D) Power\n\n"
            f"Feel free to select one or ask for the next question!"
        )

    # 5. Suggestion: Study plan / track
    if "detailed study plan" in query_lower or "study plan" in query_lower or "syllabus" in query_lower:
        return (
            "Here is your customized <span class='mark-gold'>study plan</span> for the current chapter:\n\n"
            "- **Day 1-2**: Master the core definitions, formulas, and diagrams. Solve basic NCERT level problems.\n"
            "- **Day 3-4**: Attempt past-year JEE/NEET questions. Focus on speed and accuracy benchmarks.\n"
            "- **Day 5**: Take a full practice diagnostic test in the **Practice** tab to identify weak subtopics."
        )

    # 6. Exam / MCQ Generator Fallback
    if "exam generator" in query_lower or "mcq exam" in query_lower:
        import json
        mock_exam = {
            "reply": "Here is a 3-question mock Physics & Chemistry mechanics exam to get you started (using Evolve offline mock generator).",
            "ready": True,
            "questions": [
                {
                    "subject": "Physics",
                    "q": "A particle of mass 2 kg moves in a circle of radius 3 m at 4 m/s. Find the centripetal force acting on the particle.",
                    "opts": ["4.33 N", "8.67 N", "10.67 N", "12.00 N"],
                    "ans": 2,
                    "exp": "Centripetal force is given by the formula F = m * v^2 / r. Substituting the given values: F = 2 * (4^2) / 3 = 32 / 3 ≈ 10.67 N."
                },
                {
                    "subject": "Physics",
                    "q": "A block of mass 5 kg is pulled along a frictionless horizontal surface by a force of 20 N. What is its acceleration?",
                    "opts": ["2 m/s²", "4 m/s²", "10 m/s²", "100 m/s²"],
                    "ans": 1,
                    "exp": "According to Newton's second law, F = m * a. Therefore, acceleration a = F / m = 20 N / 5 kg = 4 m/s²."
                },
                {
                    "subject": "Chemistry",
                    "q": "Which of the following gas laws states that at constant temperature, the volume of a given mass of gas is inversely proportional to its pressure?",
                    "opts": ["Charles's Law", "Boyle's Law", "Avogadro's Law", "Gay-Lussac's Law"],
                    "ans": 1,
                    "exp": "Boyle's Law describes the inverse relationship between pressure and volume of a gas at constant temperature (P * V = k)."
                }
            ]
        }
        return json.dumps(mock_exam)

    # 7. Generic Fallback
    return (
        f"As Evolve Master Teacher, here is the key takeaway on <span class='mark-gold'>{query}</span>:\n\n"
        f"The subject focuses on how the core properties interact under external forces. "
        f"Always make sure to highlight the key formulas and identify dimensional consistency first.\n\n"
        f"*(Note: To enable active AI responses, please renew your `GEMINI_API_KEY` in the `.env` file.)*"
    )

def count_tokens(text: str) -> int:
    if not text:
        return 0
    try:
        try:
            encoding = tiktoken.encoding_for_model("gpt-4o-mini")
        except Exception:
            encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception as e:
        print(f"[TOKEN COUNT WARNING] tiktoken error: {e}", file=sys.stderr)
        return max(1, len(text) // 4)

def count_messages_tokens(messages: list) -> int:
    num_tokens = 0
    try:
        try:
            encoding = tiktoken.encoding_for_model("gpt-4o-mini")
        except Exception:
            encoding = tiktoken.get_encoding("cl100k_base")
    except Exception as e:
        print(f"[TOKEN COUNT WARNING] tiktoken load failed: {e}", file=sys.stderr)
        return sum(max(1, len(m.get("content", "")) // 4) for m in messages)

    for message in messages:
        num_tokens += 4  # every message follows <im_start>{role/name}\n{content}<im_end>\n
        content = message.get("content", "")
        if isinstance(content, list):
            for part in content:
                if part.get("type") == "text":
                    num_tokens += len(encoding.encode(part.get("text", "")))
                elif part.get("type") == "image_url":
                    num_tokens += 85
        else:
            num_tokens += len(encoding.encode(content))
    num_tokens += 2  # every reply is primed with <im_start>assistant
    return num_tokens

def get_dynamic_token_limit(query: str) -> int:
    query_lower = query.lower().strip()
    detailed_keywords = [
        "explain", "solve", "quiz", "detailed", "step-by-step", 
        "notes", "summarize", "study plan", "code", "write", 
        "create", "how to", "why"
    ]
    if any(kw in query_lower for kw in detailed_keywords) or len(query.split()) > 8:
        return 800
    return 150

def get_mock_usage(query: str, response_text: str, system_prompt: str = None) -> dict:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": query})
    
    prompt_tokens = count_messages_tokens(messages)
    completion_tokens = count_tokens(response_text)
    total_token = prompt_tokens + completion_tokens
    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_token": total_token
    }

async def generate_llm_response(query: str, history: list = None, image_base64: str = None) -> dict:
    api_key = os.getenv("OPENROUTER_API_KEY")
    model_name = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    
    if image_base64:
        model_name = "google/gemini-3.1-flash-lite"

    print(f"[LLM] Generating response. API Key loaded: {bool(api_key)}, Model: {model_name}", flush=True)

    limit = get_dynamic_token_limit(query)
    query_lower = query.lower()
    if "exam generator" in query_lower or "mcq exam" in query_lower:
        system_prompt = (
            "You are Evolve AI, a professional exam generator. "
            "Generate high-quality multiple choice questions matching the user's requirements exactly. "
            "Ensure the output format matches the requested JSON structure exactly. Keep explanations and questions very concise (max 1 sentence per explanation) to prevent truncation. "
            "Do not output any thinking process or extra text outside the JSON in the final content. Return only the JSON object."
        )
    elif "teacher persona" in query_lower or "learn mode" in query_lower or "textbook chapter" in query_lower:
        system_prompt = (
            "You are Evolve AI Master Teacher, a world-class school tutor. "
            "Generate a structured textbook chapter containing content and section-by-section script explanations. "
            "Ensure the output matches the requested JSON structure exactly. "
            "Do not output any thinking process or extra text outside the JSON. Return only the JSON object."
        )
    elif "student doubt" in query_lower or "doubt-solving" in query_lower:
        system_prompt = (
            "You are Evolve AI Master Teacher, helping a student with their doubt. "
            "Provide a direct, conversational, and encouraging response as a human teacher would. "
            "Keep the reply brief (under 3 sentences) and speak naturally. Do not use Markdown formatting or math equations that cannot be easily read aloud by a text-to-speech engine."
        )
    elif "tamil" in query_lower or "tanglish" in query_lower or "tamil nadu" in query_lower:
        system_prompt = (
            "You are Evolve AI Master Teacher, a legendary, passionate, and extremely engaging Physics teacher from Tamil Nadu. "
            "Explain concepts in conversational Tamil script with a natural mix of English technical terms (Tanglish in Tamil script). "
            "Follow all formatting requirements (e.g. returning valid JSON array of objects) exactly. "
            "Do not use markdown formatting or HTML spans like mark-gold unless explicitly requested."
        )
    else:
        if image_base64:
            system_prompt = (
                "You are an expert academic tutor. You are provided with a student's problem and an image. "
                "Provide a highly detailed, step-by-step explanation and breakdown of the solution. "
                "Format your response cleanly using Markdown and LaTeX for math."
            )
        else:
            system_prompt = (
                "You are Evolve Master Teacher. Explain clearly and naturally. "
                f"Use <span class='mark-gold'> for key terms. Keep under {limit} tokens."
            )

    if not api_key:
        print("[LLM SERVICE WARNING] OPENROUTER_API_KEY missing. Using fallback response.", flush=True)
        fallback_text = get_mock_response(query)
        return {
            "text": fallback_text,
            "usage": get_mock_usage(query, fallback_text, system_prompt)
        }

    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for entry in history[-4:]:
            if "query" in entry and "response" in entry:
                messages.append({"role": "user", "content": entry["query"]})
                messages.append({"role": "assistant", "content": entry["response"]})

    if image_base64:
        if "," in image_base64:
            mime_type = image_base64.split(";")[0].split(":")[1]
            b64_data = image_base64.split(",")[1]
        else:
            mime_type = "image/jpeg"
            b64_data = image_base64
            
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": query
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{b64_data}"
                    }
                }
            ]
        })
    else:
        messages.append({"role": "user", "content": query})

    try:
        import requests
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.5,
            "max_tokens": 4000  # Increased to 4000 to allow reasoning models enough budget to think and complete JSON
        }
        
        print(f"[LLM] Sending request to OpenRouter for model: {model_name}...", flush=True)
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30  # Increased from 10 to prevent timeouts on reasoning models
        )
        
        print(f"[LLM] OpenRouter responded with status code: {response.status_code}", flush=True)
        if response.status_code == 200:
            res_data = response.json()
            choices = res_data.get("choices", [])
            if choices:
                msg = choices[0].get("message", {})
                text = msg.get("content")
                
                # If content is empty/None but there is reasoning, we can use the reasoning as a fallback
                if not text:
                    reasoning = msg.get("reasoning")
                    if reasoning:
                        print(f"[LLM WARNING] Content was empty/None, falling back to reasoning output.", flush=True)
                        text = f"Thinking process:\n{reasoning}"
                    else:
                        text = ""
                
                # ALWAYS use tiktoken to calculate token counts as per request (so it matches exactly)
                prompt_tokens = count_messages_tokens(messages)
                completion_tokens = count_tokens(text)
                total_token = prompt_tokens + completion_tokens
                
                print(f"[LLM SUCCESS] Response generated successfully. Tokens used: {total_token} (tiktoken)", flush=True)
                return {
                    "text": text,
                    "usage": {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "total_token": total_token
                    }
                }
            
            fallback_text = "Error: Empty response from OpenRouter."
            print(f"[LLM SERVICE WARNING] Empty choices. Returning fallback.", flush=True)
            return {
                "text": fallback_text,
                "usage": get_mock_usage(query, fallback_text, system_prompt)
            }
        else:
            err_msg = response.text
            print(f"[LLM SERVICE WARNING] OpenRouter API failed with status {response.status_code}: {err_msg}. Using fallback.", flush=True)
            fallback_text = get_mock_response(query)
            return {
                "text": fallback_text,
                "usage": get_mock_usage(query, fallback_text, system_prompt)
            }

    except Exception as e:
        print(f"[LLM SERVICE WARNING] OpenRouter request failed: {e}. Using local Evolve AI fallback.", flush=True)
        fallback_text = get_mock_response(query)
        return {
            "text": fallback_text,
            "usage": get_mock_usage(query, fallback_text, system_prompt)
        }