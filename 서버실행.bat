@echo off
chcp 65001 > nul
echo ========================================================
echo   [야구 AI 분석 사이트 & 5대 지표 API 서버 실행]
echo   접속 주소: http://localhost:8000
echo   API 문서: http://localhost:8000/docs
echo ========================================================
start "" http://localhost:8000
python main_api.py
pause
