@echo off
title AniParty - Internet Orqali Do'stlar Bilan Tomosha Qilish
cd /d "%~dp0"
echo ====================================================
echo   AniParty Server (Internet va Wi-Fi Rejimi)
echo   Do'stlaringiz butun dunyo bo'ylab ulana oladi!
echo ====================================================
node server/index.js --tunnel
pause
