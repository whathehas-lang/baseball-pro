@echo off
chcp 65001 > nul
title [포탈야구 v5 로컬 모바일 서버]
cd /d C:\Users\FORYOUCOM\Desktop\포탈야구_v5_신규업그레이드
python -m http.server 8080
pause
