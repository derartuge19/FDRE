@echo off
echo 🚀 Simple Court System Deployment

echo 🗄️ Starting database and services...
docker-compose -f docker-compose-simple.yml up -d

echo ⏳ Waiting 15 seconds for services to start...
timeout /t 15 /nobreak > nul

echo 🔧 Starting existing court services...
docker-compose -f docker-compose-simple.yml up -d court-api-gateway court-auth-service court-case-service court-document-service court-notification-service

echo ⏳ Waiting 10 seconds for services to be ready...
timeout /t 10 /nobreak > nul

echo 🌐 Starting frontend (if available)...
docker images | findstr court-frontend > nul
if not errorlevel 1 (
    docker-compose -f docker-compose-simple.yml up -d court-frontend
    echo ✅ Frontend started
) else (
    echo ⚠️ Frontend not found, skipping...
)

echo ⏳ Waiting 5 seconds for final startup...
timeout /t 5 /nobreak > nul

echo 🔍 Checking services...

echo Checking database...
docker ps | findstr postgres > nul
if errorlevel 1 (
    echo ❌ Database not running
) else (
    echo ✅ Database is running
)

echo Checking API Gateway...
curl -f http://localhost:3000/health > nul 2>&1
if errorlevel 1 (
    echo ❌ API Gateway is not responding
) else (
    echo ✅ API Gateway is healthy
)

echo Checking Auth Service...
curl -f http://localhost:3001/health > nul 2>&1
if errorlevel 1 (
    echo ❌ Auth Service is not responding
) else (
    echo ✅ Auth Service is healthy
)

echo Checking Case Service...
curl -f http://localhost:3002/health > nul 2>&1
if errorlevel 1 (
    echo ❌ Case Service is not responding
) else (
    echo ✅ Case Service is healthy
)

echo Checking Document Service...
curl -f http://localhost:3003/health > nul 2>&1
if errorlevel 1 (
    echo ❌ Document Service is not responding
) else (
    echo ✅ Document Service is healthy
)

echo Checking Notification Service...
curl -f http://localhost:3004/health > nul 2>&1
if errorlevel 1 (
    echo ❌ Notification Service is not responding
) else (
    echo ✅ Notification Service is healthy
)

echo Checking Frontend...
curl -f http://localhost:5173 > nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend is not responding
) else (
    echo ✅ Frontend is healthy
)

echo.
echo 🎉 Deployment completed!
echo.
echo 🌐 Access URLs:
echo    Frontend: http://localhost:5173
echo    API Gateway: http://localhost:3000
echo    Auth Service: http://localhost:3001
echo    Case Service: http://localhost:3002
echo    Document Service: http://localhost:3003
echo    Notification Service: http://localhost:3004
echo.
echo 📊 System Status:
docker-compose -f docker-compose-simple.yml ps

echo.
echo 🎯 Next steps:
echo 1. Access the system at http://localhost:3000
echo 2. Test the API endpoints
echo 3. Check logs with: docker-compose -f docker-compose-simple.yml logs -f [service-name]

echo.
echo 🚀 Your Court System is now running!
