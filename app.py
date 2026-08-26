"""
app.py - FastAPI uvicorn entrypoint alias for main_api
"""
import uvicorn
from main_api import app

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
