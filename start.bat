@echo off
title AniParty - Do'stlar Bilan Anime Tomosha Qilish
cd /d "%~dp0"
echo ====================================================
echo      AniParty Server Ishga Tushmoqda...
echo ====================================================
echo.
echo  Sayt manzili: http://localhost:5000
echo  Bosh Admin:   akbarali
echo  Admin Parol:  12345678aki
echo.
echo ====================================================
node server/index.js
pause
