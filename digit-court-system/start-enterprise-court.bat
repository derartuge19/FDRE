@echo off
echo ========================================================
echo   🏛️ ETHIOPIAN DIGITAL COURT - ENTERPRISE MICROSERVICES
echo ========================================================
echo.

cd court-services

echo Starting [1/6] court-auth-service (3001)...
start "Auth Service" cmd /c "cd court-auth-service && npm install && npm start"

echo Starting [2/6] court-case-service (3002)...
start "Case Service" cmd /c "cd court-case-service && npm install && npm start"

echo Starting [3/6] court-document-service (3003)...
start "Document Service" cmd /c "cd court-document-service && npm install && npm start"

echo Starting [4/6] court-notification-service (3004)...
start "Notification Service" cmd /c "cd court-notification-service && npm install && npm start"

echo Starting [5/6] court-communication-service (3005)...
start "Communication/WebSocket Service" cmd /c "cd court-communication-service && npm install && npm start"

echo.
echo Waiting for backend microservices to initialize...
timeout /t 10 /nobreak > nul

echo Starting [6/6] court-api-gateway (5173)...
start "API Gateway (Proxy)" cmd /c "cd court-api-gateway && npm install && npm start"

echo.
echo ========================================================
echo   ✅ ALL ENTERPRISE COURT MICROSERVICES DEPLOYED!
echo   Frontend commands should now hit the gateway at :5173
echo ========================================================
pause
