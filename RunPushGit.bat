@echo off
chcp 65001 >nul
cd /d "C:\Users\USER\source\repos\BoMainAmir"
git add .
git commit -m "העלאת שינויים לפרויקט"
git push origin main
pause
