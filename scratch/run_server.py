import sys
import os
import uvicorn

# Add llm_service to system path
llm_dir = os.path.abspath("llm_service")
sys.path.append(llm_dir)
os.chdir(llm_dir) # Change working directory to llm_service so it can load relative files

if __name__ == "__main__":
    try:
        from main import app
        print("Starting uvicorn programmatically...", flush=True)
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception as e:
        import traceback
        print(f"Failed to start server: {e}", flush=True)
        with open(os.path.join(llm_dir, "server_error.log"), "w") as f:
            f.write(f"Startup failed: {e}\n")
            traceback.print_exc(file=f)
