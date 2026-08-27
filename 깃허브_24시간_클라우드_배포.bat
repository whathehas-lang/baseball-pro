@echo off
chcp 65001 > nul
title [포탈야구 v5 24시간 클라우드 배포]
cd /d C:\Users\FORYOUCOM\Desktop\포탈야구_v5_신규업그레이드
"C:\Program Files\Git\cmd\git.exe" add -A
"C:\Program Files\Git\cmd\git.exe" commit -m "🚀 [포탈야구 v5] 최신 기능 업데이트 배포"
"C:\Program Files\Git\cmd\git.exe" push -u origin main --force
pause
