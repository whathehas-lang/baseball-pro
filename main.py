"""
main.py - Entrypoint alias for main_api.py (FastAPI Application)
"""
import sys
import uvicorn
from main_api import app

if __name__ == "__main__":
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')
    print("🚀 [FastAPI] main.py를 통해 서버를 구동합니다: http://127.0.0.1:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
