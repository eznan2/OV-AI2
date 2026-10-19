@echo off
chcp 65001 > nul
echo ========================================================
echo        오버워치 훈련장 - 솔저: 76 (Practice Range)
echo ========================================================
echo.
echo 브라우저에서 훈련장을 실행합니다...
echo.

:: 백그라운드 PowerShell 서버 실행 및 브라우저 열기
start "" powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0server.ps1"
timeout /t 1 /nobreak > nul
start http://localhost:8080/index.html

echo 실행 완료! 즐거운 훈련 되세요!
