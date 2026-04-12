from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

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

from database import get_session_history_async, save_message_to_session_async

class QueryRequest(BaseModel):
    query: str = Field(..., description="The user's query sent to Evolve GM")
    chat_data_id: str = Field(None, description="The session ID (UUID) from the frontend")
    user_id: str = Field(None, description="The user ID (UUID)")

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
        text = await generate_llm_response(safe_query, history)
        
        # 4. Save the interaction back to the session row in Supabase
        if request.chat_data_id:
            await save_message_to_session_async(request.chat_data_id, safe_query, text, request.user_id)
            
        return {"text": text}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"API Internal Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process AI query: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "llm_agent"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
