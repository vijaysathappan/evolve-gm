import uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import Any, Dict

app = FastAPI(
    title="Evolve Learn Platform",
    description="Research-Grade AI Platform Foundation",
    version="1.0.0",
)

# Rule 10: Every request gets Request ID.
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# Rule 5: Every exception returns standard JSON.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "message": "Internal Server Error",
            "request_id": request_id,
            "error_detail": str(exc) # Consider removing detail in production
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": exc.errors(),
            "message": "Validation Error",
            "request_id": request_id
        }
    )

def standard_response(data: Any, message: str = "", request_id: str = "") -> Dict:
    """Rule 4: Every response returns a standard structure."""
    return {
        "success": True,
        "data": data,
        "message": message,
        "request_id": request_id
    }

from app.domains.user.router import router as user_router

app.include_router(user_router)

@app.get("/api/health")
async def health_check(request: Request):
    request_id = getattr(request.state, "request_id", "")
    return standard_response(
        data={"status": "healthy"},
        message="System is operational.",
        request_id=request_id
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
