@echo off
echo ========================================
echo    ETHIOPIAN DIGITAL COURT SYSTEM
echo    MICROSERVICES DEPLOYMENT
echo ========================================
echo.

echo Starting all CORE SERVICES...
echo.

echo [1/7] Starting User Service (Port 8080)...
cd core-services\digit-user-service
start "User Service" cmd /k "mvn spring-boot:run" 2>nul
if errorlevel 1 goto error

echo [2/7] Starting Notification Service (Port 8081)...
cd ..\digit-notification-service
start "Notification Service" cmd /k "mvn spring-boot:run" 2>nul
if errorlevel 1 goto error

echo [3/7] Starting Workflow Service (Port 8082)...
cd ..\digit-workflow-service
start "Workflow Service" cmd /k "mvn spring-boot:run" 2>nul
if errorlevel 1 goto error

echo [4/7] Starting Filestore Service (Port 8083)...
cd ..\digit-filestore
start "Filestore Service" cmd /k "mvn spring-boot:run" 2>nul
if errorlevel 1 goto error

echo [5/7] Starting MDMS Service (Port 8084)...
cd ..\digit-mdms-service
start "MDMS Service" cmd /k "mvn spring-boot:run" 2>nul
if errorlevel 1 goto error

echo [6/7] Starting Indexer Service (Port 8085)...
cd ..\digit-indexer
start "Indexer Service" cmd /k "mvn spring-boot:run" 2>nul
if errorlevel 1 goto error

echo [7/7] Starting Persister Service (Port 8086)...
cd ..\digit-persister
start "Persister Service" cmd /k "mvn spring-boot:run" 2>nul
if errorlevel 1 goto error

echo.
echo ========================================
echo    ALL MICROSERVICES STARTED!
echo ========================================
echo.
echo Services running on:
echo   User Service:     http://localhost:8080
echo   Notification:      http://localhost:8081
echo   Workflow:         http://localhost:8082
echo   Filestore:        http://localhost:8083
echo   MDMS:            http://localhost:8084
echo   Indexer:         http://localhost:8085
echo   Persister:       http://localhost:8086
echo.
echo Press any key to stop all services...
pause > nul
goto end

:error
echo ========================================
echo           ERROR STARTING SERVICES!
echo ========================================
echo.
pause
exit /b 1

:end
echo All services stopped.
pause
