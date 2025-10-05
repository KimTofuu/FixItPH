@echo off
echo Starting development servers...

start "Backend" cmd /k "cd backend && set PORT=3001 && npm run dev"
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo Press any key to continue...
pause