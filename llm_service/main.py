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

class QueryRequest(BaseModel):
    query: str = Field(..., description="The user's query sent to Evolve GM")

@app.post("/api/query")
async def generate_response(request: QueryRequest):
    try:
        # 1. Edge Security Validation (Blocks jailbreaks, XSS, limits length)
        safe_query = validate_query_security(request.query)
        
        # 2. Delegate the actual AI processing for the validated query
        text = await generate_llm_response(safe_query)
        return {"text": text}
    except HTTPException as he:
        # Pass through the specific security HTTP exceptions gracefully to UI
        raise he
    except Exception as e:
        print(f"API Internal Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process AI query")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "llm_agent"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
